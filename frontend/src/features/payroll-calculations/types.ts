export type PolicyChoice = {
  id: string;
  policyKey: string;
  version: number;
  effectiveFrom: string;
  status: 'ACTIVE' | 'INACTIVE';
  approvedByName: string | null;
};
export type DraftChoice = {
  id: string;
  version: number;
  employeeId: string;
  period: string;
  employee: { id: string; code: string; name: string; email: string };
};
export type CalculationDraft = {
  pfEligible: string;
  esiEligible: string;
  stateCode: string;
  ptAmount: string;
  tdsAmount: string;
  leavingDate: string;
  unpaidDates: string;
};
export const blankInputs: CalculationDraft = {
  pfEligible: '',
  esiEligible: '',
  stateCode: '',
  ptAmount: '',
  tdsAmount: '',
  leavingDate: '',
  unpaidDates: '',
};
export type CalculationInput = {
  employeeId: string;
  period: string;
  policyId: string;
  manualDraftId: string;
  expectedDraftVersion: number;
  pfEligible: boolean;
  esiEligible: boolean;
  stateCode: string;
  ptAmount: string;
  tdsAmount: string;
  leavingDate: string | null;
  unpaidDates: string[];
};
export type CalculationPreview = {
  employeeId: string;
  period: string;
  currency: 'INR';
  policyId: string;
  policyVersion: number;
  policyHash: string;
  manualDraftId: string;
  manualDraftVersion: number;
  employeeVersion: number;
  inputs: CalculationInput;
  periodStart: string;
  periodEnd: string;
  calendarDays: number;
  employmentDays: number;
  paidDays: number;
  prorationDays: number;
  segments: {
    from: string;
    to: string;
    calendarDays: number;
    paidDays: number;
    salaryRecordId: string | null;
    monthlyAmount: string;
    currency: 'INR';
    correctsId: string | null;
  }[];
  earnings: Record<string, string>;
  deductions: Record<string, string>;
  employerContributions: { pf: string; esi: string };
  gross: string;
  deductionTotal: string;
  net: string;
  sourceHash: string;
  previewHash: string;
  warnings: string[];
};
export const componentLabels: Record<string, string> = {
  basic: 'Basic salary',
  hra: 'HRA',
  allowances: 'Allowances',
  bonuses: 'Bonuses',
  incentives: 'Incentives',
  overtime: 'Overtime',
  pf: 'PF',
  esi: 'ESI',
  professionalTax: 'Professional tax',
  tds: 'TDS',
  unpaidLeave: 'Unpaid leave',
  authorized: 'Authorised deductions',
};
