export type RunState =
  'DRAFT' | 'HR_REVIEWED' | 'FINANCE_APPROVED' | 'DIRECTOR_APPROVED' | 'FINALIZED';
export type RunAction =
  'HR_REVIEW' | 'FINANCE_APPROVE' | 'DIRECTOR_APPROVE' | 'FINALIZE' | 'REJECT';
export const actionLabels: Record<RunAction, string> = {
  HR_REVIEW: 'Complete HR review',
  FINANCE_APPROVE: 'Approve as Finance',
  DIRECTOR_APPROVE: 'Approve as Director',
  FINALIZE: 'Finalize payroll',
  REJECT: 'Return to draft',
};
export type RunSummary = {
  id: string;
  period: string;
  status: RunState;
  version: number;
  generation: number;
  employeeCount: number;
  hrReviewerId: string;
  financeApproverId: string;
  directorApproverId: string | null;
  requiresDirector: boolean;
  createdBy: string;
  createdAt: string;
  finalizedAt: string | null;
};
export type RunLine = {
  id: string;
  employeeId: string;
  snapshot: {
    employee: { id: string; code: string; name: string; email: string };
    period: string;
    currency: 'INR';
    countryCode: 'IN';
    earnings: Record<string, string>;
    deductions: {
      pf: string;
      esi: string;
      professionalTax: string;
      tds: string;
      unpaidLeave: string;
      authorized: string;
    };
    gross: string;
    deductionTotal: string;
    net: string;
    source: { draftId: string; revisionId: string; version: number };
    periodStart: string;
    periodEnd: string;
    payDate: string;
    calculation: { segments: unknown[] };
  };
};
export type PayrollRun = RunSummary & {
  sourceHash: string;
  policy: unknown;
  lines: RunLine[];
  linesPage: number;
  linesTotal: number;
  events: {
    id: string;
    action: string;
    fromStatus: string | null;
    toStatus: string;
    actorId: string;
    actorName: string;
    reason: string;
    version: number;
    createdAt: string;
  }[];
  stale: boolean;
  blockedReason: string | null;
  availableActions: RunAction[];
  replayed: boolean;
};
export type RunSourceDraft = {
  id: string;
  employeeId: string;
  version: number;
  period: string;
  employee: { id: string; code: string; name: string; email: string };
};
export type CalculationFields = {
  pfEligible: string;
  esiEligible: string;
  stateCode: string;
  ptAmount: string;
  tdsAmount: string;
  leavingDate: string;
  unpaidDates: string;
};
export type SelectedDraft = { draft: RunSourceDraft; fields: CalculationFields };
export const emptyFields: CalculationFields = {
  pfEligible: '',
  esiEligible: '',
  stateCode: '',
  ptAmount: '',
  tdsAmount: '',
  leavingDate: '',
  unpaidDates: '',
};
export type RunSetup = {
  policy: {
    policyId: string;
    version: number;
    policyHash: string;
    financeApproverIds: string[];
    directorApproverIds: string[];
    requiresDirector: boolean;
    config: { finalizerRole: 'HR' | 'FINANCE' };
  };
  candidates: { id: string; name: string; employeeCode: string; isHrManager: boolean }[];
};
export type RunPolicyChoice = {
  id: string;
  policyKey: string;
  version: number;
  effectiveFrom: string;
  status: 'ACTIVE' | 'INACTIVE';
};
export type CreateRun = {
  policyId: string;
  commandId: string;
  period: string;
  hrReviewerId: string;
  financeApproverId: string;
  directorApproverId: string | null;
  reason: string;
  confirmed: true;
  calculations: {
    employeeId: string;
    manualDraftId: string;
    expectedDraftVersion: number;
    pfEligible: boolean;
    esiEligible: boolean;
    stateCode: string;
    ptAmount: string;
    tdsAmount: string;
    leavingDate: string | null;
    unpaidDates: string[];
  }[];
};
