import { useRef, useState } from 'react';
import { payrollDraftsApi } from './api';
import {
  parsePayrollInputs,
  payrollInputTemplate,
  type PayrollInputRow,
} from './payroll-input-csv';
import { earningsFields, deductionFields } from './types';
import { writeCsv } from '../../shared/csv/csv';
import { Modal } from '../../shared/ui/modal';
import { TextInput } from '../../shared/ui/form-controls';
import { Button } from '../../shared/ui/button';
import { DataTable } from '../../shared/ui/data-table';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { useAction } from '../../shared/hooks/use-action';
import { useAppDispatch } from '../../shared/state/hooks';
import { runRequest } from '../../shared/api/run-request';
import { errorMessage } from '../../shared/api/client';

type Row = PayrollInputRow & {
  commandId: string;
  employeeId?: string;
  name?: string;
  status: 'Imported' | 'Ready' | 'Saved' | 'Needs attention' | 'Result uncertain';
  message: string;
};
function ManualComponents({ row }: { row: PayrollInputRow }) {
  return (
    <details>
      <summary>View all entered values</summary>
      <dl>
        {earningsFields.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>INR {row.earnings[key]}</dd>
          </div>
        ))}
        {deductionFields.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>INR {row.deductions[key]}</dd>
          </div>
        ))}
      </dl>
      <p>{row.reason}</p>
    </details>
  );
}
function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function PayrollInputImport({ period, onClose }: { period: string; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [failure, setFailure] = useState('');
  const [review, setReview] = useState<Row[]>([]);
  const [closing, setClosing] = useState(false);
  const reading = useRef(false);
  const action = useAction();
  const dispatch = useAppDispatch();
  const patch = (rowNumber: number, update: Partial<Row>) =>
    setRows((previous) =>
      previous.map((row) => (row.rowNumber === rowNumber ? { ...row, ...update } : row)),
    );
  async function load(file: File | undefined) {
    if (!file || reading.current || rows.length || action.busy) return;
    reading.current = true;
    try {
      await action.perform(async (signal) => {
        try {
          if (file.size > 262144) throw new Error('Use a CSV file smaller than 256 KB.');
          const text = await file.text();
          if (signal.aborted) return;
          const parsed = parsePayrollInputs(text);
          setRows(
            parsed.map((row) => ({
              ...row,
              commandId: crypto.randomUUID(),
              status: 'Imported',
              message: '',
            })),
          );
          setFailure('');
        } catch (cause) {
          if (!signal.aborted) setFailure(errorMessage(cause, 'Could not read payroll input CSV.'));
        }
      });
    } finally {
      reading.current = false;
    }
  }
  function prepare() {
    void action.perform(async (signal) => {
      const candidates = rows.filter(
        (row) => row.status !== 'Saved' && row.status !== 'Result uncertain',
      );
      if (!candidates.length) return;
      const employees = await runRequest(
        dispatch(
          payrollDraftsApi.endpoints.resolvePayrollEmployees.initiate(
            candidates.map((row) => row.employeeCode),
          ),
        ),
        signal,
      );
      if (signal.aborted) return;
      for (const row of candidates) {
        const employee = employees.find(
          (item) => item.employeeCode.toUpperCase() === row.employeeCode,
        );
        patch(
          row.rowNumber,
          employee
            ? {
                employeeId: employee.id,
                name: `${employee.firstName} ${employee.lastName}`,
                status: 'Ready',
                message: 'Ready to create a manual draft.',
              }
            : {
                status: 'Needs attention',
                message: 'Employee code unavailable. Correct the CSV before another import.',
              },
        );
      }
    });
  }
  function save() {
    const snapshot = review;
    setReview([]);
    void action.perform(async (signal) => {
      for (const row of snapshot) {
        if (!row.employeeId || signal.aborted) break;
        try {
          await runRequest(
            dispatch(
              payrollDraftsApi.endpoints.createPayrollDraft.initiate({
                commandId: row.commandId,
                employeeId: row.employeeId,
                period,
                earnings: row.earnings,
                deductions: row.deductions,
                reason: row.reason,
                confirmed: true,
              }),
            ),
            signal,
          );
          if (signal.aborted) break;
          patch(row.rowNumber, {
            status: 'Saved',
            message: 'Manual draft saved. Existing drafts are never overwritten by this import.',
          });
        } catch (cause) {
          if (signal.aborted) break;
          const status =
            typeof cause === 'object' && cause !== null && 'status' in cause
              ? cause.status
              : undefined;
          const uncertain =
            status === undefined ||
            status === 'NETWORK_ERROR' ||
            (typeof status === 'number' && status >= 500) ||
            (row.status === 'Result uncertain' && [401, 403, 404].includes(Number(status)));
          patch(row.rowNumber, {
            status: uncertain ? 'Result uncertain' : 'Needs attention',
            message: errorMessage(
              cause,
              'Could not confirm the result. Retry this same submission.',
            ),
          });
          break;
        }
      }
    });
  }
  const ready = rows.filter((row) => row.status === 'Ready' || row.status === 'Result uncertain');
  return (
    <Modal
      title="Import manual payroll inputs"
      subtitle={`${period} · India / INR`}
      contextLabel="Create drafts only"
      canClose={!action.busy}
      onClose={() => (rows.length ? setClosing(true) : onClose())}
    >
      <p>
        Enter all twelve components explicitly in the template; use 0 where not applicable. Each
        employee is saved separately. Existing monthly drafts are not replaced. Nothing is
        calculated, approved or paid by this import.
      </p>
      <Button
        variant="secondary"
        onClick={() => download('manual-payroll-inputs.csv', payrollInputTemplate())}
      >
        Download CSV template
      </Button>
      {!rows.length && (
        <TextInput
          label="Upload manual payroll CSV"
          type="file"
          accept=".csv,text/csv"
          hint="Up to 100 employees / 256 KB per batch."
          onChange={(event) => {
            void load(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      )}
      {failure && <p role="alert">{failure}</p>}
      {!!rows.length && (
        <>
          <div className="form-actions">
            <Button disabled={action.busy} onClick={prepare}>
              Match employee codes
            </Button>
            <Button
              disabled={action.busy || !ready.length}
              onClick={() =>
                setReview(
                  ready.map((row) => ({
                    ...row,
                    earnings: { ...row.earnings },
                    deductions: { ...row.deductions },
                  })),
                )
              }
            >
              Review & save {ready.length} drafts
            </Button>
            <Button
              variant="secondary"
              disabled={action.busy}
              onClick={() =>
                download(
                  'payroll-input-results.csv',
                  writeCsv([
                    ['Employee code', 'Month', 'Result', 'Message'],
                    ...rows.map((row) => [row.employeeCode, period, row.status, row.message]),
                  ]),
                )
              }
            >
              Download results
            </Button>
          </div>
          {action.busy && <p role="status">Saving one employee at a time. Keep this page open.</p>}
          <DataTable
            caption="Manual payroll import"
            head={
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Manual components</th>
                <th scope="col">Result</th>
              </tr>
            }
          >
            {rows.map((row) => (
              <tr key={row.rowNumber}>
                <td>
                  {row.employeeCode}
                  <br />
                  {row.name}
                </td>
                <td>
                  <ManualComponents row={row} />
                </td>
                <td>
                  <strong>{row.status}</strong>
                  <p>{row.message}</p>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
      <ConfirmationDialog
        open={!!review.length}
        busy={action.busy}
        title="Create reviewed monthly drafts?"
        headingId="import-payroll-confirm"
        focusHeading
        onCancel={() => setReview([])}
        onConfirm={save}
        confirmLabel={`Create ${review.length} drafts`}
        busyLabel="Saving..."
        cancelLabel="Keep reviewing"
      >
        <p>
          {review.length} manual drafts for {period}. Each row is a separate transaction. Saved rows
          remain if a later row fails; the batch stops at the first failed save. No existing draft
          is overwritten.
        </p>
        <ul>
          {review.map((row) => (
            <li key={row.rowNumber}>
              <strong>
                {row.employeeCode} · {row.name}
              </strong>
              <ManualComponents row={row} />
            </li>
          ))}
        </ul>
        <p>
          All twelve reviewed values are submitted exactly as entered. Unknown results retry the
          same saved command.
        </p>
      </ConfirmationDialog>
      <ConfirmationDialog
        open={closing}
        busy={action.busy}
        title="Leave this import?"
        headingId="leave-payroll-import"
        onCancel={() => setClosing(false)}
        onConfirm={onClose}
        confirmLabel="Leave import"
        busyLabel="Closing..."
        cancelLabel="Stay here"
      >
        <p>
          Saved drafts remain saved. Download results before leaving. Unsaved rows and local retry
          commands will be cleared. Resolve uncertain results first, or check saved drafts before
          importing again.
        </p>
      </ConfirmationDialog>
    </Modal>
  );
}
