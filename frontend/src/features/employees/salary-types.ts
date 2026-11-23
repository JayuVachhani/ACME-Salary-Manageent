import type { SalaryMoneySnapshot } from '../../shared/api/salary-contract';
export type SalaryEntry = {
  id: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  approvalStatus: 'ACTIVE' | 'WAITING_MANAGEMENT_APPROVAL';
  decimalPlaces: number;
  reason: string;
  createdAt: string;
  createdByName: string;
  changeType: string | null;
  correctsId: string | null;
  isSuperseded: boolean;
  conversionMeta: unknown;
  events: { type: string; before: SalaryMoneySnapshot | null; after: SalaryMoneySnapshot }[];
};
export type SalaryRequest = {
  id: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionComment: string | null;
  requestKind: 'INITIAL' | 'BACKDATED';
  requestedBy: string;
  requestedByName: string;
  decimalPlaces: number;
  createdAt: string;
  decidedAt: string | null;
  correctsId: string | null;
  decidedByName: string | null;
};
export type EmployeeSalaryData = {
  current: SalaryEntry | null;
  history: SalaryEntry[];
  pending: {
    id: string;
    amount: string;
    currency: string;
    effectiveFrom: string;
    decimalPlaces: number;
  }[];
  total: number;
  page: number;
  canResubmitInitial: boolean;
  canChangeSalary: boolean;
  canSubmitBackdated: boolean;
  businessDate: string;
  salaryChangeUnavailableReason: string | null;
  currencies: { code: string }[];
  requests: SalaryRequest[];
  requestsTotal: number;
  requestsPage: number;
};
export type {
  SalaryDraftCommand,
  SalaryPreview,
  SalaryWriteResult,
} from '../../shared/api/salary-contract';
export type SalaryEditorSession = {
  mode: 'revision' | 'correction';
  corrects: SalaryEntry | null;
  initial: SalaryEntry | null;
  lease: { leaseToken: string; expiresAt: string; version: number };
  businessDate: string;
  canSubmitBackdated: boolean;
  currencies: { code: string }[];
};
export type SalaryEditContext = Pick<
  EmployeeSalaryData,
  'businessDate' | 'canSubmitBackdated' | 'currencies'
>;
