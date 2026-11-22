import { useState } from 'react';
import type { Account } from './types';
import { useLinkableEmployeesQuery, useLinkMemberEmployeeMutation } from './api';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
export function useEmployeeLinkEditor(account: Account, onClose: () => void) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState({ search: '', page: 1 });
  const [employee, setEmployee] = useState<{ id: string; name: string } | null>(
    account.employee_id ? { id: account.employee_id, name: 'Current linked employee' } : null,
  );
  const [reason, setReason] = useState('');
  const [review, setReview] = useState(false);
  const resource = useLinkableEmployeesQuery(query);
  const [link] = useLinkMemberEmployeeMutation();
  const action = useAction();
  function confirm() {
    void action.perform(async (signal) => {
      await runRequest(
        link({
          id: account.id,
          employeeId: employee?.id ?? null,
          expectedVersion: account.team_version,
          reason,
          confirmed: true,
        }),
        signal,
      );
      if (signal.aborted) return;
      action.announce('Employee link updated. The colleague must sign in again.');
      onClose();
    });
  }
  return {
    search,
    setSearch,
    query,
    setQuery,
    employee,
    setEmployee,
    reason,
    setReason,
    review,
    setReview,
    resource,
    action,
    confirm,
  };
}
