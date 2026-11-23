import { useState } from 'react';
import { useSalaryRequestsQuery, useDecideSalaryMutation, type SalaryRequest } from './api';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';

export function useSalaryApprovals() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<{
    request: SalaryRequest;
    decision: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [comment, setComment] = useState('');
  const query = useSalaryRequestsQuery({ status, page });
  const [decide] = useDecideSalaryMutation();
  const action = useAction();
  const latest = selection
    ? query.currentData?.items.find((request) => request.id === selection.request.id)
    : undefined;
  const selected = selection ? { ...selection, request: latest ?? selection.request } : null;
  const canConfirm = Boolean(
    selected &&
    latest?.status === 'PENDING' &&
    latest.can_decide &&
    (selected.decision === 'REJECTED' || !latest.isStale),
  );
  function review(request: SalaryRequest, decision: 'APPROVED' | 'REJECTED') {
    if (
      action.busy ||
      !request.can_decide ||
      request.status !== 'PENDING' ||
      (decision === 'APPROVED' && request.isStale)
    )
      return;
    setSelection({ request, decision });
    setComment('');
  }
  function confirm() {
    if (!selected || !comment.trim() || !canConfirm) return;
    const reviewed = selected;
    void action.perform(async (signal) => {
      try {
        await runRequest(
          decide({
            id: reviewed.request.id,
            decision: reviewed.decision,
            comment,
            confirmed: true,
          }),
          signal,
        );
        if (signal.aborted) return;
        setSelection(null);
        setComment('');
        action.announce(
          reviewed.decision === 'APPROVED' ? 'Salary approved.' : 'Salary request rejected.',
        );
      } catch (cause) {
        if (
          !signal.aborted &&
          cause &&
          typeof cause === 'object' &&
          'status' in cause &&
          cause.status === 409
        )
          void query.refetch();
        throw cause;
      }
    });
  }
  function changeStatus(next: string) {
    setStatus(next);
    setPage(1);
  }
  return {
    status,
    changeStatus,
    page,
    setPage,
    selected,
    comment,
    setComment,
    query,
    action,
    canConfirm,
    review,
    confirm,
    cancel: () => setSelection(null),
  };
}
