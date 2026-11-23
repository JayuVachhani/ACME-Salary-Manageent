import { useEffect, useState } from 'react';
import type { Employee } from './types';
import { baseApi } from '../../shared/api/base-api';
import { useEmployeeSalaryQuery } from './api';
import { employeeEditApi, type EditLease } from './edit-api';
import { useAction } from '../../shared/hooks/use-action';
import { useAppDispatch } from '../../shared/state/hooks';
import { handleDirectRequestError } from '../../shared/api/direct-request-errors';
import { errorMessage } from '../../shared/api/client';
import type { SalaryEditContext, SalaryEditorSession, SalaryEntry } from './salary-types';
export function useEmployeeSalary(employee: Employee, onEditingChange: (editing: boolean) => void) {
  const id = employee.id;
  const session = baseApi.useSessionQuery(undefined, { refetchOnMountOrArgChange: false });
  const canCreate =
    session.currentData?.isHrManager ||
    ['read', 'write', 'salary:view'].every((permission) =>
      session.currentData?.permissions.includes(permission),
    );
  const [page, setPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [historyView, setHistoryView] = useState<'table' | 'timeline'>('table');
  const [editor, setEditor] = useState<SalaryEditorSession | null>(null);
  const [initialOpen, setInitialOpen] = useState(false);
  const [leaseFailure, setLeaseFailure] = useState('');
  const query = useEmployeeSalaryQuery({ id, page, requestsPage });
  const action = useAction();
  const dispatch = useAppDispatch();
  const identity = session.currentData;
  const data = query.currentData;
  const canChangeSalary = Boolean(
    data?.canChangeSalary &&
    identity &&
    (identity.isHrManager ||
      ['read', 'edit', 'salary:view'].every((permission) =>
        identity.permissions.includes(permission),
      )),
  );
  const canSubmitBackdated = Boolean(
    canChangeSalary && identity?.isHrManager && data?.canSubmitBackdated,
  );
  const activeLease = editor?.lease;
  useEffect(() => () => onEditingChange(false), [onEditingChange]);
  useEffect(() => {
    if (!activeLease) return;
    const controller = new AbortController();
    const interval = setInterval(() => {
      void employeeEditApi.renew(id, activeLease.leaseToken, controller.signal).catch((cause) => {
        if (controller.signal.aborted) return;
        handleDirectRequestError(cause, dispatch);
        setLeaseFailure(
          errorMessage(
            cause,
            'The edit session could not be renewed. Refresh the edit session before saving.',
          ),
        );
        clearInterval(interval);
      });
    }, 60000);
    return () => {
      controller.abort();
      clearInterval(interval);
      void employeeEditApi
        .release(id, activeLease.leaseToken)
        .catch((cause) => handleDirectRequestError(cause, dispatch));
    };
  }, [id, activeLease, dispatch]);
  function begin(mode: 'revision' | 'correction', row: SalaryEntry | null = null) {
    if (!data || !canChangeSalary || editor || initialOpen || action.busy) return;
    if (row && (row.isSuperseded || (row.effectiveFrom < data.businessDate && !canSubmitBackdated)))
      return;
    onEditingChange(true);
    setLeaseFailure('');
    void action.perform(async (signal) => {
      try {
        const lease = await employeeEditApi.acquire(id, employee.version, signal);
        if (signal.aborted) return;
        setEditor({
          mode,
          corrects: row,
          initial: data.current,
          lease,
          businessDate: data.businessDate,
          canSubmitBackdated,
          currencies: data.currencies,
        });
      } catch (cause) {
        onEditingChange(false);
        throw cause;
      }
    });
  }
  function finish() {
    setEditor(null);
    setInitialOpen(false);
    setLeaseFailure('');
    onEditingChange(false);
  }
  function replaceLease(lease: EditLease, context: SalaryEditContext) {
    setEditor((previous) =>
      previous
        ? {
            ...previous,
            lease,
            businessDate: context.businessDate,
            canSubmitBackdated: context.canSubmitBackdated,
            currencies: context.currencies,
          }
        : null,
    );
    setLeaseFailure('');
  }
  function beginInitial() {
    if (editor || initialOpen || action.busy) return;
    setInitialOpen(true);
    onEditingChange(true);
  }
  const requests = (data?.requests ?? []).filter(
    (request) => identity && (identity.isHrManager || request.requestedBy === identity.id),
  );
  return {
    page,
    setPage,
    requestsPage,
    setRequestsPage,
    historyView,
    setHistoryView,
    query,
    data,
    canCreate,
    canChangeSalary,
    canSubmitBackdated,
    editor,
    initialOpen,
    leaseFailure,
    begin,
    finish,
    replaceLease,
    beginInitial,
    busy: action.busy,
    requests,
    isHrManager: Boolean(identity?.isHrManager),
  };
}
export type EmployeeSalaryModel = ReturnType<typeof useEmployeeSalary>;
