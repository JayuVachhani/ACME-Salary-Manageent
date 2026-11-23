/** Immutable money/policy display context shared by salary history and the approval inbox. */
export type SalaryMoneySnapshot = {
  amount: string;
  currency: string;
  countryCode: string;
  defaultCurrency: string;
  decimalPlaces: number;
  effectiveFrom: string;
};

export type SalaryDraftCommand = {
  commandId: string;
  leaseToken: string;
  expectedVersion: number;
  amount: string;
  currency: string;
  effectiveFrom: string;
  correctsId?: string;
  reason: string;
};
export type SalaryPreview = {
  businessDate: string;
  employeeVersion: number;
  amount: string;
  currency: string;
  effectiveFrom: string;
  correction: boolean;
  requiresApproval: boolean;
  before: {
    id: string;
    amount: string;
    currency: string;
    effectiveFrom: string;
    decimalPlaces: number;
  } | null;
  policy: {
    countryCode: string;
    countryName: string;
    defaultCurrency: string;
    decimalPlaces: number;
    roundingMode: string;
    version: number;
  };
  convertedAmount: string;
  conversionLegs: {
    rateId: string;
    base: string;
    quote: string;
    rate: string;
    effectiveDate: string;
    revision: number;
    inverse: boolean;
    source: string;
  }[];
  previewHash: string;
};
export type SalaryWriteResult = {
  outcome: 'RECORDED' | 'PENDING_APPROVAL';
  salaryId: string | null;
  requestId: string | null;
  employeeVersion: number;
  replayed: boolean;
};
