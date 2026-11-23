import { baseApi } from '../../shared/api/base-api';
import type { SalaryMoneySnapshot } from '../../shared/api/salary-contract';
export type SalaryRequest = {
  id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  requested_by: string;
  requested_by_name: string;
  request_kind: 'INITIAL' | 'BACKDATED';
  monthly_amount: string;
  currency: string;
  effective_from: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decision_comment: string | null;
  can_decide: boolean;
  correctsId: string | null;
  decimalPlaces: number;
  countryCode: string;
  defaultCurrency: string;
  before: ({ id: string } & SalaryMoneySnapshot) | null;
  isStale: boolean;
  decidedByName: string | null;
  decidedAt: string | null;
};
export const salaryApprovalsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    salaryRequests: build.query<
      { items: SalaryRequest[]; total: number; page: number; pageSize: number },
      { status: string; page: number }
    >({
      query: (q) => ({ path: `/api/v1/salary-requests?status=${q.status}&page=${q.page}` }),
      providesTags: ['SalaryRequests', 'Team', 'Employees', 'Session'],
    }),
    decideSalary: build.mutation<
      { salaryId: string | null },
      { id: string; decision: 'APPROVED' | 'REJECTED'; comment: string; confirmed: true }
    >({
      query: ({ id, ...body }) => ({
        path: `/api/v1/salary-requests/${id}/decision`,
        method: 'POST',
        body,
        timeoutMs: 20000,
      }),
      invalidatesTags: (_data, error) => (error ? [] : ['SalaryRequests', 'Employees']),
    }),
  }),
});
export const { useSalaryRequestsQuery, useDecideSalaryMutation } = salaryApprovalsApi;
