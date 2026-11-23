import { useState } from 'react';
import { payrollCalculationsApi } from './api';
import {
  blankInputs,
  type CalculationDraft,
  type CalculationInput,
  type CalculationPreview,
  type DraftChoice,
  type PolicyChoice,
} from './types';
import { requestJson } from '../../shared/api/client';
import { useAction } from '../../shared/hooks/use-action';
export function usePayrollCalculations() {
  const [period, setPeriod] = useState('');
  const [search, setSearch] = useState('');
  const [draftPage, setDraftPage] = useState(1);
  const [policyPage, setPolicyPage] = useState(1);
  const [policy, setPolicy] = useState<PolicyChoice | null>(null);
  const [draft, setDraft] = useState<DraftChoice | null>(null);
  const [fields, setFields] = useState<CalculationDraft>({ ...blankInputs });
  const [preview, setPreview] = useState<CalculationPreview | null>(null);
  const action = useAction();
  const policies = payrollCalculationsApi.useCalculationPoliciesQuery(policyPage);
  const drafts = payrollCalculationsApi.useCalculationDraftsQuery(
    { period, search, page: draftPage },
    { skip: !period },
  );
  const denied = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500;
  const metadataDenied = Boolean(denied(policies.error) || denied(drafts.error));
  function change(key: keyof CalculationDraft, value: string) {
    setPreview(null);
    setFields((current) => ({ ...current, [key]: value }));
  }
  function calculate() {
    if (action.busy || !policy || !draft || metadataDenied) return;
    if (
      !['true', 'false'].includes(fields.pfEligible) ||
      !['true', 'false'].includes(fields.esiEligible) ||
      !fields.stateCode.trim() ||
      !fields.ptAmount ||
      !fields.tdsAmount
    ) {
      action.setMessage(
        'Choose PF and ESI eligibility, state and explicit professional tax/TDS amounts.',
        'error',
      );
      return;
    }
    const input: CalculationInput = {
      employeeId: draft.employeeId,
      period,
      policyId: policy.id,
      manualDraftId: draft.id,
      expectedDraftVersion: draft.version,
      pfEligible: fields.pfEligible === 'true',
      esiEligible: fields.esiEligible === 'true',
      stateCode: fields.stateCode.trim(),
      ptAmount: fields.ptAmount,
      tdsAmount: fields.tdsAmount,
      leavingDate: fields.leavingDate || null,
      unpaidDates: fields.unpaidDates.split(/[\s,]+/).filter(Boolean),
    };
    setPreview(null);
    void action.perform(async (signal) => {
      try {
        const result = await requestJson<CalculationPreview>(
          '/api/v1/payroll-calculations/preview',
          { method: 'POST', body: input, signal },
        );
        if (!signal.aborted) setPreview(result);
      } catch (error) {
        if (!signal.aborted) setPreview(null);
        throw error;
      }
    });
  }
  return {
    period,
    setPeriod: (value: string) => {
      setPeriod(value);
      setDraft(null);
      setPreview(null);
      setDraftPage(1);
    },
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setDraftPage(1);
    },
    draftPage,
    setDraftPage,
    policyPage,
    setPolicyPage,
    policy,
    choosePolicy: (value: PolicyChoice) => {
      setPolicy(value);
      setPreview(null);
    },
    draft,
    chooseDraft: (value: DraftChoice) => {
      setDraft(value);
      setPreview(null);
    },
    fields,
    change,
    preview:
      metadataDenied ||
      policies.isError ||
      drafts.isError ||
      !policies.currentData ||
      !drafts.currentData
        ? null
        : preview,
    action,
    calculate,
    policies,
    drafts,
    metadataDenied,
  };
}
