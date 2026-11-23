import { baseApi } from '../../shared/api/base-api';
export type Policy = {
  id: string;
  policyKey: string;
  version: number;
  effectiveFrom: string;
  status: 'INACTIVE' | 'ACTIVE';
  createdBy: string;
  createdByName: string;
  approvedByName: string | null;
  reason: string;
  assignees: {
    id: string;
    name: string;
    employeeCode: string | null;
    role: 'FINANCE' | 'DIRECTOR';
    active: boolean;
  }[];
  config: Record<string, unknown> & {
    name: string;
    finalizerRole: 'HR' | 'FINANCE';
    financeApproverIds: string[];
    directorApproverIds: string[];
    requiresDirector: boolean;
  };
};
export type Approver = {
  id: string;
  name: string;
  email: string;
  employeeCode: string | null;
  hr: boolean;
};
export const payrollPolicyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    payrollPolicies: build.query<
      { items: Policy[]; total: number; page: number; pageSize: number },
      number
    >({
      query: (page) => ({ path: '/api/v1/payroll-policies?page=' + page }),
      providesTags: ['PayrollPolicies'],
    }),
    policyApprovers: build.query<
      { items: Approver[]; total: number; page: number; pageSize: number },
      { search: string; page: number }
    >({
      query: (q) => ({
        path:
          '/api/v1/payroll-policies/approvers?search=' +
          encodeURIComponent(q.search) +
          '&page=' +
          q.page,
      }),
      providesTags: ['Team'],
    }),
    createPayrollPolicy: build.mutation<
      Policy,
      { policyKey: string; effectiveFrom: string; config: object; reason: string; confirmed: true }
    >({
      query: (body) => ({ path: '/api/v1/payroll-policies', method: 'POST', body }),
      invalidatesTags: (_d, e) => (e ? [] : ['PayrollPolicies']),
    }),
    approvePayrollPolicy: build.mutation<Policy, { id: string; comment: string; confirmed: true }>({
      query: ({ id, ...body }) => ({
        path: '/api/v1/payroll-policies/' + id + '/approve',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_d, e) => (e ? [] : ['PayrollPolicies']),
    }),
  }),
});
export const {
  usePayrollPoliciesQuery,
  usePolicyApproversQuery,
  useCreatePayrollPolicyMutation,
  useApprovePayrollPolicyMutation,
} = payrollPolicyApi;
