export type WorkspaceSalarySnapshot = {
  id: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  decimalPlaces: number;
  approvalStatus: 'ACTIVE' | 'WAITING_MANAGEMENT_APPROVAL';
};
export type SalaryWorkspaceEmployee = {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  joiningDate: string;
  version: number;
  countryCode: string | null;
  countryName: string | null;
  departmentId: string | null;
  department: string | null;
  designation: string | null;
  employmentStatus: string | null;
  current: WorkspaceSalarySnapshot | null;
  nextScheduled: WorkspaceSalarySnapshot | null;
  pendingCount: number;
};
export type SalaryWorkspacePage = {
  items: SalaryWorkspaceEmployee[];
  total: number;
  page: number;
  pageSize: number;
  businessDate: string;
};
export type SalaryWorkspaceFilters = {
  countries: { code: string; name: string; is_active: boolean }[];
  departments: { id: string; name: string; is_active: boolean }[];
};
export const initialSalaryWorkspaceFilters = {
  search: '',
  country: '',
  department: '',
  status: '',
  sort: 'code',
  direction: 'asc',
  pageSize: '25',
};
export type SalaryWorkspaceDraft = typeof initialSalaryWorkspaceFilters;
export type SalaryWorkspaceQuery = SalaryWorkspaceDraft & { page: number };
