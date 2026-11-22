import { useEffect, useState } from 'react';
import type { Employee } from './types';
import { employeeEditApi, type EditLease } from './edit-api';
import { useAction } from '../../shared/hooks/use-action';
import { errorMessage } from '../../shared/api/client';
import { baseApi } from '../../shared/api/base-api';
import { useAppDispatch } from '../../shared/state/hooks';
export function useEmployeeEditor(employee: Employee, onClose: () => void) {
  const [lease, setLease] = useState<EditLease | null>(null);
  const [leaseError, setLeaseError] = useState('');
  const [draft, setDraft] = useState({
    firstName: employee.first_name,
    lastName: employee.last_name,
    email: employee.email,
    reason: '',
  });
  const [review, setReview] = useState(false);
  const action = useAction();
  const dispatch = useAppDispatch();
  function startEditing() {
    void action.perform(async (signal) => {
      const value = await employeeEditApi.acquire(employee.id, employee.version, signal);
      if (!signal.aborted) setLease(value);
    });
  }
  useEffect(() => {
    if (!lease) return;
    const controller = new AbortController();
    const interval = setInterval(() => {
      void employeeEditApi
        .renew(employee.id, lease.leaseToken, controller.signal)
        .catch((error) => {
          if (!controller.signal.aborted) {
            setLeaseError(
              errorMessage(error, 'Could not renew the edit session. Cancel and reopen this form.'),
            );
            clearInterval(interval);
          }
        });
    }, 60000);
    return () => {
      controller.abort();
      clearInterval(interval);
      void employeeEditApi.release(employee.id, lease.leaseToken).catch(() => {});
    };
  }, [employee.id, lease]);
  function confirm() {
    if (!lease || leaseError) return;
    void action.perform(async (signal) => {
      await employeeEditApi.save(
        employee.id,
        { ...draft, leaseToken: lease.leaseToken, expectedVersion: lease.version, confirmed: true },
        signal,
      );
      if (signal.aborted) return;
      dispatch(baseApi.util.invalidateTags(['Employees', 'SalaryRequests']));
      action.announce('Employee details updated.');
      onClose();
    });
  }
  return { lease, leaseError, draft, setDraft, review, setReview, action, startEditing, confirm };
}
