import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Employee } from './types';
import type {
  SalaryDraftCommand,
  SalaryEditContext,
  SalaryEditorSession,
  SalaryPreview,
} from './salary-types';
import { salaryWriteApi } from './salary-write-api';
import { employeeEditApi, type EditLease } from './edit-api';
import { employeesApi } from './api';
import { decimalInput } from '../../shared/format/money';
import { ApiError, errorMessage } from '../../shared/api/client';
import { runRequest } from '../../shared/api/run-request';
import { useAction } from '../../shared/hooks/use-action';
import { useAppDispatch } from '../../shared/state/hooks';
import { baseApi } from '../../shared/api/base-api';

type Props = {
  employee: Employee;
  session: SalaryEditorSession;
  leaseFailure: string;
  writeAllowed: boolean;
  replaceLease: (lease: EditLease, context: SalaryEditContext) => void;
  onFinish: () => void;
};
export function useSalaryEditor({
  employee,
  session,
  leaseFailure,
  writeAllowed,
  replaceLease,
  onFinish,
}: Props) {
  const initial = session.corrects ?? session.initial;
  const [commandId] = useState(() => crypto.randomUUID());
  const [draft, setDraft] = useState(() => ({
    amount: initial ? decimalInput(initial.amount, initial.decimalPlaces) : '',
    currency: initial?.currency ?? session.currencies[0]?.code ?? '',
    effectiveFrom:
      session.corrects?.effectiveFrom ??
      (employee.joining_date > session.businessDate ? employee.joining_date : session.businessDate),
    reason: '',
  }));
  const [review, setReview] = useState<{
    input: Readonly<SalaryDraftCommand>;
    preview: SalaryPreview;
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [failure, setFailure] = useState('');
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const action = useAction();
  const dispatch = useAppDispatch();
  function change(field: keyof typeof draft, value: string) {
    if (action.busy || uncertain) return;
    setDraft((previous) => ({ ...previous, [field]: value }));
    setReview(null);
    setReviewOpen(false);
    setFailure('');
  }
  function preview(event: FormEvent) {
    event.preventDefault();
    if (!writeAllowed || leaseFailure || needsRefresh || uncertain) return;
    const input: SalaryDraftCommand = {
      commandId,
      leaseToken: session.lease.leaseToken,
      expectedVersion: session.lease.version,
      ...draft,
      ...(session.corrects ? { correctsId: session.corrects.id } : {}),
    };
    void action.perform(async (signal) => {
      try {
        const result = await salaryWriteApi.preview(employee.id, input, signal);
        if (signal.aborted) return;
        setFailure('');
        setReview({ input: Object.freeze({ ...input }), preview: result });
        setReviewOpen(true);
      } catch (cause) {
        if (!signal.aborted) {
          setReview(null);
          setReviewOpen(false);
          setFailure(
            errorMessage(cause, 'Could not prepare the salary review. Your draft is preserved.'),
          );
          if (cause instanceof ApiError && cause.status === 409) setNeedsRefresh(true);
        }
        throw cause;
      }
    });
  }
  function confirm() {
    if (!review || !writeAllowed || (!uncertain && (leaseFailure || needsRefresh))) return;
    const snapshot = review;
    void action.perform(async (signal) => {
      try {
        const result = await salaryWriteApi.submit(
          employee.id,
          { ...snapshot.input, previewHash: snapshot.preview.previewHash, confirmed: true },
          signal,
        );
        if (signal.aborted) return;
        const message =
          result.outcome === 'PENDING_APPROVAL'
            ? 'Salary request submitted. It will not affect compensation until independently approved.'
            : 'Salary recorded. It counts from its start date and is marked for management review.';
        action.announce(
          result.replayed ? 'Your previous submission was confirmed. ' + message : message,
        );
        onFinish();
        dispatch(baseApi.util.invalidateTags(['Employees', 'SalaryRequests']));
      } catch (cause) {
        if (!signal.aborted) {
          setFailure(
            errorMessage(
              cause,
              'Could not confirm the result. Your draft and reviewed submission are preserved.',
            ),
          );
          if (cause instanceof ApiError && cause.status === 409) {
            setReview(null);
            setReviewOpen(false);
            setNeedsRefresh(true);
            setUncertain(false);
          } else if (!(cause instanceof ApiError) || cause.status >= 500) {
            setUncertain(true);
          } else {
            setReview(null);
            setReviewOpen(false);
            setUncertain(false);
          }
        }
        throw cause;
      }
    });
  }
  function refreshLease() {
    if (action.busy || uncertain) return;
    void action.perform(async (signal) => {
      try {
        await employeeEditApi.release(employee.id, session.lease.leaseToken);
        if (signal.aborted) return;
        const latest = await runRequest(
          dispatch(
            employeesApi.endpoints.salaryEditSnapshot.initiate(employee.id, {
              subscribe: false,
              forceRefetch: true,
            }),
          ),
          signal,
        );
        const context = await runRequest(
          dispatch(
            employeesApi.endpoints.employeeSalary.initiate(
              { id: employee.id, page: 1, requestsPage: 1 },
              { subscribe: false, forceRefetch: true },
            ),
          ),
          signal,
        );
        if (!context.canChangeSalary)
          throw new Error(
            context.salaryChangeUnavailableReason ??
              'Salary changes are not available for this account or employee.',
          );
        const lease = await employeeEditApi.acquire(employee.id, latest.version, signal);
        if (signal.aborted) return;
        replaceLease(lease, context);
        setReview(null);
        setReviewOpen(false);
        setFailure('');
        setNeedsRefresh(false);
        action.announce(
          'Edit session refreshed. Review your preserved draft again before saving.',
          'info',
        );
      } catch (cause) {
        if (!signal.aborted)
          setFailure(
            errorMessage(cause, 'Could not refresh the edit session. Your draft is preserved.'),
          );
        throw cause;
      }
    });
  }
  function backToDraft() {
    if (action.busy) return;
    setReviewOpen(false);
    if (!uncertain) setReview(null);
  }
  return {
    draft,
    change,
    review,
    reviewOpen,
    reopenReview: () => setReviewOpen(true),
    preview,
    confirm,
    backToDraft,
    refreshLease,
    failure,
    needsRefresh,
    uncertain,
    busy: action.busy,
    minimumDate: session.canSubmitBackdated
      ? employee.joining_date
      : employee.joining_date > session.businessDate
        ? employee.joining_date
        : session.businessDate,
    blocked: !writeAllowed || Boolean(leaseFailure) || needsRefresh,
    canEditDraft: !action.busy && !uncertain,
  };
}
