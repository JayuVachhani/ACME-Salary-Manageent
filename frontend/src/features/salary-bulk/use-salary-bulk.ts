import { useCallback, useEffect, useRef, useState } from 'react';
import { salaryBulkApi } from './api';
import { MAX_BULK_CSV_BYTES, parseBulkSalaryCsv, type BulkDraftRow } from './csv';
import { employeeEditApi } from '../../shared/api/employee-edit';
import { salaryWriteApi } from '../../shared/api/salary-write';
import type { SalaryDraftCommand, SalaryPreview } from '../../shared/api/salary-contract';
import { ApiError, errorMessage } from '../../shared/api/client';
import { handleDirectRequestError } from '../../shared/api/direct-request-errors';
import { runRequest } from '../../shared/api/run-request';
import { useAction } from '../../shared/hooks/use-action';
import { useAppDispatch } from '../../shared/state/hooks';
import { baseApi } from '../../shared/api/base-api';

type Status =
  'Imported' | 'Ready' | 'Recorded' | 'Awaiting approval' | 'Needs attention' | 'Result uncertain';
export type BulkRow = BulkDraftRow & {
  status: Status;
  message: string;
  employeeId?: string;
  name?: string;
  commandId?: string;
  input?: Readonly<SalaryDraftCommand>;
  preview?: SalaryPreview;
};
type QueuedRow = BulkRow & {
  employeeId: string;
  input: Readonly<SalaryDraftCommand>;
  preview: SalaryPreview;
};
const finished = (row: BulkRow) => row.status === 'Recorded' || row.status === 'Awaiting approval';
const queued = (row: BulkRow): row is QueuedRow =>
  ['Ready', 'Result uncertain'].includes(row.status) &&
  Boolean(row.employeeId && row.input && row.preview);
const sameReview = (live: BulkRow | undefined, reviewed: QueuedRow) =>
  Boolean(
    live &&
    queued(live) &&
    live.employeeId === reviewed.employeeId &&
    live.input.commandId === reviewed.input.commandId &&
    live.preview.previewHash === reviewed.preview.previewHash,
  );

export function useSalaryBulk() {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [failure, setFailure] = useState('');
  const [reviewOpen, setOpen] = useState(false);
  const [reviewRows, setReviewRows] = useState<QueuedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const current = useRef(rows);
  const busy = useRef(false);
  const readingFile = useRef(false);
  const alive = useRef(true);
  const inFlight = useRef(new Set<number>());
  const renewing = useRef(new Set<number>());
  const action = useAction();
  const dispatch = useAppDispatch();
  const replace = useCallback((next: BulkRow[]) => {
    current.current = next;
    if (alive.current) setRows(next);
  }, []);
  const patch = useCallback(
    (rowNumber: number, update: Partial<BulkRow>) => {
      replace(
        current.current.map((row) => (row.rowNumber === rowNumber ? { ...row, ...update } : row)),
      );
    },
    [replace],
  );
  const release = useCallback(
    async (row: BulkRow) => {
      if (!row.employeeId || !row.input) return;
      try {
        await employeeEditApi.release(row.employeeId, row.input.leaseToken);
      } catch (cause) {
        handleDirectRequestError(cause, dispatch);
      }
    },
    [dispatch],
  );
  const releaseCurrent = useCallback(() => {
    for (const row of current.current) void release(row);
  }, [release]);
  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    const timer = window.setInterval(() => {
      void Promise.all(
        current.current.filter(queued).map(async (row) => {
          if (inFlight.current.has(row.rowNumber) || renewing.current.has(row.rowNumber)) return;
          renewing.current.add(row.rowNumber);
          try {
            await employeeEditApi.renew(row.employeeId, row.input.leaseToken, controller.signal);
          } catch (cause) {
            if (controller.signal.aborted) return;
            handleDirectRequestError(cause, dispatch);
            const live = current.current.find((item) => item.rowNumber === row.rowNumber);
            if (
              !live ||
              !queued(live) ||
              live.input.leaseToken !== row.input.leaseToken ||
              inFlight.current.has(row.rowNumber)
            )
              return;
            if (live.status === 'Result uncertain')
              patch(row.rowNumber, {
                message:
                  'The result is still uncertain. Retry the same reviewed submission to confirm it.',
              });
            else {
              patch(row.rowNumber, {
                status: 'Needs attention',
                message:
                  'Edit session could not be renewed. Prepare this row again; the command remains the same.',
                preview: undefined,
              });
              void release(row);
            }
          } finally {
            renewing.current.delete(row.rowNumber);
          }
        }),
      );
    }, 60000);
    return () => {
      alive.current = false;
      controller.abort();
      window.clearInterval(timer);
      releaseCurrent();
    };
  }, [dispatch, patch, release, releaseCurrent]);
  async function importFile(file: File | undefined) {
    if (!file || busy.current || readingFile.current || current.current.length) return;
    readingFile.current = true;
    setImporting(true);
    try {
      if (file.size > MAX_BULK_CSV_BYTES) throw new Error('Choose a CSV file smaller than 256 KB.');
      const imported = parseBulkSalaryCsv(await file.text());
      if (!alive.current) return;
      replace(imported.map((row) => ({ ...row, status: 'Imported', message: '' })));
      setFailure('');
    } catch (cause) {
      if (alive.current) setFailure(errorMessage(cause, 'Could not read this CSV file.'));
    } finally {
      readingFile.current = false;
      if (alive.current) setImporting(false);
    }
  }
  function prepare() {
    if (action.busy || busy.current || readingFile.current || !current.current.length) return;
    void action.perform(async (signal) => {
      busy.current = true;
      setFailure('');
      try {
        const eligible = current.current.filter(
          (row) => !finished(row) && row.status !== 'Result uncertain',
        );
        if (!eligible.length) return;
        const resolved = await runRequest(
          dispatch(
            salaryBulkApi.endpoints.resolveSalaryEmployees.initiate(
              eligible.map((row) => row.employeeCode),
            ),
          ),
          signal,
        );
        for (const entry of eligible) {
          if (signal.aborted) break;
          const row = current.current.find((item) => item.rowNumber === entry.rowNumber);
          if (!row || finished(row) || row.status === 'Ready' || row.status === 'Result uncertain')
            continue;
          const employee = resolved.find(
            (item) => item.employeeCode.toUpperCase() === row.employeeCode.toUpperCase(),
          );
          if (!employee) {
            await release(row);
            patch(row.rowNumber, {
              status: 'Needs attention',
              message: 'Employee code unavailable. Correct the CSV and start a new batch.',
              preview: undefined,
            });
            continue;
          }
          inFlight.current.add(row.rowNumber);
          let input: SalaryDraftCommand | undefined;
          try {
            await release(row);
            if (signal.aborted) break;
            const lease = await employeeEditApi.acquire(employee.id, employee.version, signal);
            input = {
              commandId: row.commandId ?? row.input?.commandId ?? crypto.randomUUID(),
              leaseToken: lease.leaseToken,
              expectedVersion: lease.version,
              amount: row.amount,
              currency: row.currency,
              effectiveFrom: row.effectiveFrom,
              reason: row.reason,
            };
            if (signal.aborted) {
              void release({ ...row, employeeId: employee.id, input });
              break;
            }
            patch(row.rowNumber, {
              employeeId: employee.id,
              name: employee.firstName + ' ' + employee.lastName,
              commandId: input.commandId,
              input: Object.freeze({ ...input }),
              preview: undefined,
            });
            const preview = await salaryWriteApi.preview(employee.id, input, signal);
            if (signal.aborted) {
              void release({ ...row, employeeId: employee.id, input });
              break;
            }
            patch(row.rowNumber, {
              preview,
              status: 'Ready',
              message: preview.requiresApproval
                ? 'Will request independent HR approval.'
                : 'Will record from its effective date.',
            });
          } catch (cause) {
            if (signal.aborted) {
              if (input) void release({ ...row, employeeId: employee.id, input });
              break;
            }
            handleDirectRequestError(cause, dispatch);
            patch(row.rowNumber, {
              status: 'Needs attention',
              preview: undefined,
              message: errorMessage(cause, 'Could not prepare this row.'),
            });
            if (input) await release({ ...row, employeeId: employee.id, input });
            // A row-specific 403 (such as own salary) must not prevent preparing later employees.
            if (cause instanceof ApiError && cause.status === 401) break;
          } finally {
            inFlight.current.delete(row.rowNumber);
          }
        }
      } finally {
        busy.current = false;
      }
    });
  }
  function setReviewOpen(open: boolean) {
    if (action.busy || busy.current) return;
    if (open)
      setReviewRows(
        current.current.filter(queued).map((row) => ({
          ...row,
          input: Object.freeze({ ...row.input }),
          preview: { ...row.preview },
        })),
      );
    else setReviewRows([]);
    setOpen(open);
  }
  const reviewChanged = reviewRows.some(
    (row) =>
      !sameReview(
        rows.find((live) => live.rowNumber === row.rowNumber),
        row,
      ),
  );
  function submit() {
    if (action.busy || busy.current || !reviewRows.length || reviewChanged) return;
    const reviewed = [...reviewRows];
    setOpen(false);
    setReviewRows([]);
    void action.perform(async (signal) => {
      busy.current = true;
      setFailure('');
      try {
        for (const snapshot of reviewed) {
          if (signal.aborted) break;
          const row = current.current.find((item) => item.rowNumber === snapshot.rowNumber);
          if (row && finished(row)) continue;
          if (!sameReview(row, snapshot)) {
            setFailure(
              'A reviewed row is no longer ready. Later rows were not processed. Prepare and review the remaining rows again.',
            );
            break;
          }
          inFlight.current.add(snapshot.rowNumber);
          try {
            const result = await salaryWriteApi.submit(
              snapshot.employeeId,
              { ...snapshot.input, previewHash: snapshot.preview.previewHash, confirmed: true },
              signal,
            );
            if (signal.aborted) break;
            patch(snapshot.rowNumber, {
              status: result.outcome === 'RECORDED' ? 'Recorded' : 'Awaiting approval',
              message: result.replayed ? 'Previous submission confirmed.' : 'Saved successfully.',
              input: undefined,
            });
            void release(snapshot);
            dispatch(baseApi.util.invalidateTags(['Employees', 'SalaryRequests']));
          } catch (cause) {
            if (signal.aborted) break;
            handleDirectRequestError(cause, dispatch);
            const uncertain =
              !(cause instanceof ApiError) ||
              cause.status >= 500 ||
              (snapshot.status === 'Result uncertain' && [401, 403, 404].includes(cause.status));
            patch(snapshot.rowNumber, {
              status: uncertain ? 'Result uncertain' : 'Needs attention',
              message: errorMessage(cause, 'Result unknown. Retry this same reviewed batch.'),
              ...(uncertain ? {} : { preview: undefined }),
            });
            if (!uncertain) await release(snapshot);
            // Keep the command ID for every retry, and stop at the first unsuccessful write.
            break;
          } finally {
            inFlight.current.delete(snapshot.rowNumber);
          }
        }
      } finally {
        busy.current = false;
      }
    });
  }
  function clear() {
    if (action.busy || busy.current || readingFile.current) return;
    releaseCurrent();
    replace([]);
    setFailure('');
    setOpen(false);
    setReviewRows([]);
  }
  return {
    rows,
    failure,
    action,
    importing,
    importFile,
    prepare,
    clear,
    submit,
    reviewOpen,
    setReviewOpen,
    reviewRows,
    reviewChanged,
    ready: rows.filter(queued),
  };
}
