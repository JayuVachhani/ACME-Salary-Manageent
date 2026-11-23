import { useState } from 'react';
import type { Employee } from './types';
import { useEmployeeCreateOptionsQuery, useResubmitInitialSalaryMutation } from './api';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
export function useInitialSalaryEditor(employee: Employee, onSaved?: () => void) {
  const options = useEmployeeCreateOptionsQuery();
  const [save] = useResubmitInitialSalaryMutation();
  const action = useAction();
  const [draft, setDraft] = useState(() => ({
    commandId: crypto.randomUUID(),
    amount: '',
    currency: '',
    effectiveFrom: employee.joining_date,
    reason: '',
  }));
  const [review, setReview] = useState(false);
  function confirm() {
    void action.perform(async (signal) => {
      await runRequest(
        save({ id: employee.id, ...draft, expectedVersion: employee.version, confirmed: true }),
        signal,
      );
      if (signal.aborted) return;
      setReview(false);
      action.announce('A new initial salary request is waiting for approval.');
      onSaved?.();
    });
  }
  return { options, action, draft, setDraft, review, setReview, confirm };
}
