import { useState } from 'react';
import { payrollRunsApi } from './api';
import {
  emptyFields,
  type SelectedDraft,
  type CalculationFields,
  type RunAction,
  type CreateRun,
  type RunPolicyChoice,
} from './types';
import { useAction } from '../../shared/hooks/use-action';
import { useAppDispatch } from '../../shared/state/hooks';
import { baseApi } from '../../shared/api/base-api';
import { requestJson, ApiError } from '../../shared/api/client';
export function usePayrollRuns(isHrManager: boolean) {
  const [period, setPeriod] = useState('');
  const [policyChoice, setPolicyChoice] = useState<RunPolicyChoice | null>(null);
  const [policyPage, setPolicyPage] = useState(1);
  const [page, setPage] = useState(1);
  const [id, setId] = useState('');
  const [linePage, setLinePage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [draftPage, setDraftPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, SelectedDraft>>({});
  const [fields, setFields] = useState<CalculationFields>({ ...emptyFields });
  const [hrReviewerId, setHr] = useState('');
  const [financeApproverId, setFinance] = useState('');
  const [directorApproverId, setDirector] = useState('');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState<{
    path: string;
    body:
      | CreateRun
      | {
          commandId: string;
          expectedVersion: number;
          action?: RunAction;
          reason: string;
          confirmed: true;
        };
  } | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const dispatch = useAppDispatch();
  const action = useAction();
  const list = payrollRunsApi.usePayrollRunsQuery({ period, page });
  const detail = payrollRunsApi.usePayrollRunQuery({ id, page: linePage }, { skip: !id });
  const policyChoices = payrollRunsApi.useRunPolicyChoicesQuery(policyPage, {
    skip: !creating || !isHrManager,
  });
  const setup = payrollRunsApi.useRunSetupQuery(
    { period, policyId: policyChoice?.id ?? '' },
    {
      skip: !creating || !period || !isHrManager || !policyChoice,
    },
  );
  const drafts = payrollRunsApi.useRunSourceDraftsQuery(
    { period, page: draftPage, search },
    { skip: !creating || !period || !isHrManager },
  );
  const values = Object.values(selected);
  const [selectedPage, setSelectedPage] = useState(1);
  function select(draft: SelectedDraft['draft'], checked: boolean) {
    setSelected((current) => {
      const next = { ...current };
      if (checked && Object.keys(next).length < 100)
        next[draft.id] = { draft, fields: { ...emptyFields } };
      else delete next[draft.id];
      return next;
    });
  }
  function applyFields() {
    setSelected((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, value]) => [key, { ...value, fields: { ...fields } }]),
      ),
    );
  }
  function update(id: string, key: keyof CalculationFields, value: string) {
    setSelected((current) => {
      const selected = current[id];
      if (!selected) return current;
      return { ...current, [id]: { ...selected, fields: { ...selected.fields, [key]: value } } };
    });
  }
  function reset() {
    setCreating(false);
    setSelected({});
    setStep(1);
    setReason('');
    setPending(null);
    setUncertain(false);
  }
  function reviewCreate() {
    if (
      !setup.currentData ||
      setup.isError ||
      !policyChoice ||
      !values.length ||
      !hrReviewerId ||
      !financeApproverId ||
      !reason.trim() ||
      (setup.currentData.policy.requiresDirector && !directorApproverId)
    ) {
      action.setMessage('Choose employees, required reviewers and a reason.', 'error');
      return;
    }
    if (
      values.some(
        ({ fields: f }) =>
          !['true', 'false'].includes(f.pfEligible) ||
          !['true', 'false'].includes(f.esiEligible) ||
          !f.stateCode.trim() ||
          !f.ptAmount ||
          !f.tdsAmount,
      )
    ) {
      action.setMessage(
        'Complete PF, ESI, state, professional tax and TDS for every selected employee.',
        'error',
      );
      return;
    }
    const body: CreateRun = {
      commandId: crypto.randomUUID(),
      policyId: policyChoice.id,
      period,
      hrReviewerId,
      financeApproverId,
      directorApproverId: directorApproverId || null,
      reason: reason.trim(),
      confirmed: true,
      calculations: values.map(({ draft, fields: f }) => ({
        employeeId: draft.employeeId,
        manualDraftId: draft.id,
        expectedDraftVersion: draft.version,
        pfEligible: f.pfEligible === 'true',
        esiEligible: f.esiEligible === 'true',
        stateCode: f.stateCode.trim(),
        ptAmount: f.ptAmount,
        tdsAmount: f.tdsAmount,
        leavingDate: f.leavingDate || null,
        unpaidDates: f.unpaidDates.split(/[\s,]+/).filter(Boolean),
      })),
    };
    setPending({ path: '/api/v1/payroll-runs', body });
    setUncertain(false);
  }
  function reviewAction(kind: RunAction | 'REFRESH') {
    if (!detail.data || !reason.trim()) {
      action.setMessage('Enter a reason for this payroll action.', 'error');
      return;
    }
    setPending({
      path: `/api/v1/payroll-runs/${id}/${kind === 'REFRESH' ? 'refresh' : 'actions'}`,
      body: {
        commandId: crypto.randomUUID(),
        expectedVersion: detail.data.version,
        ...(kind === 'REFRESH' ? {} : { action: kind }),
        reason: reason.trim(),
        confirmed: true,
      },
    });
    setUncertain(false);
  }
  function submit() {
    if (!pending) return;
    const snapshot = pending;
    void action.perform(async (signal) => {
      try {
        const result = await requestJson<PayrollResult>(snapshot.path, {
          method: 'POST',
          body: snapshot.body,
          signal,
        });
        if (signal.aborted) return;
        dispatch(baseApi.util.invalidateTags(['PayrollRuns']));
        setId(result.id);
        setLinePage(1);
        reset();
        action.announce('Payroll action saved. Review the current run before the next step.');
      } catch (error) {
        if (signal.aborted) return;
        if (!(error instanceof ApiError) || error.status >= 500) setUncertain(true);
        throw error;
      }
    });
  }
  return {
    policyChoices,
    policyPage,
    setPolicyPage,
    policyChoice,
    choosePolicy: (choice: RunPolicyChoice) => {
      setPolicyChoice(choice);
      setHr('');
      setFinance('');
      setDirector('');
    },
    period,
    setPeriod: (value: string) => {
      if (action.busy || pending) return;
      setPeriod(value);
      setPage(1);
      setDraftPage(1);
      setSelected({});
    },
    page,
    setPage,
    id,
    open: (value: string) => {
      setId(value);
      setLinePage(1);
      setReason('');
    },
    linePage,
    setLinePage,
    creating,
    start: () => {
      setCreating(true);
      setStep(1);
    },
    reset,
    step,
    setStep,
    draftPage,
    setDraftPage,
    search,
    setSearch,
    selected,
    values,
    selectedPage,
    setSelectedPage,
    fields,
    setFields,
    select,
    applyFields,
    update,
    hrReviewerId,
    setHr,
    financeApproverId,
    setFinance,
    directorApproverId,
    setDirector,
    reason,
    setReason,
    pending,
    cancelReview: () => {
      if (!action.busy && !uncertain) setPending(null);
    },
    uncertain,
    list,
    detail,
    setup,
    drafts,
    action,
    reviewCreate,
    reviewAction,
    submit,
  };
}
type PayrollResult = { id: string };
