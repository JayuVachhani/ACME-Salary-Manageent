export const earningsFields = [
  ['basic', 'Basic salary'],
  ['hra', 'HRA'],
  ['allowances', 'Allowances'],
  ['bonuses', 'Bonuses'],
  ['incentives', 'Incentives'],
  ['overtime', 'Overtime'],
] as const;
export const deductionFields = [
  ['pf', 'PF'],
  ['esi', 'ESI'],
  ['professionalTax', 'Professional tax'],
  ['tds', 'TDS'],
  ['unpaidLeave', 'Unpaid leave'],
  ['authorized', 'Authorised deductions'],
] as const;
export type Earnings = Record<(typeof earningsFields)[number][0], string>;
export type Deductions = Record<(typeof deductionFields)[number][0], string>;
export type DraftInput = {
  commandId: string;
  employeeId: string;
  period: string;
  earnings: Earnings;
  deductions: Deductions;
  reason: string;
  confirmed: true;
};
export type PayrollDraft = {
  id: string;
  revisionId: string;
  employeeId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  countryCode: 'IN';
  currency: 'INR';
  status: 'DRAFT';
  version: number;
  employee: { id: string; code: string; name: string; email: string };
  earnings: Earnings;
  deductions: Deductions;
  reason: string;
  updatedByName: string;
  updatedAt: string;
  replayed?: boolean;
};
export type PayrollEmployee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
};
