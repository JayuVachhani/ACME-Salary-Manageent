import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { DraftInput, PayrollDraft, PayrollEmployee } from './types';
export const payrollDraftsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    resolvePayrollEmployees: build.mutation<
      { employeeCode: string; id: string; version: number; firstName: string; lastName: string }[],
      string[]
    >({
      query: (employeeCodes) => ({
        path: '/api/v1/salary/bulk/resolve',
        method: 'POST',
        body: { employeeCodes },
      }),
    }),
    payrollDrafts: build.query<
      { items: PayrollDraft[]; total: number; page: number; pageSize: number },
      { period: string; search: string; page: number }
    >({
      query: (query) => ({ path: '/api/v1/payroll-drafts?' + queryString(query) }),
      providesTags: ['PayrollDrafts', 'Session'],
    }),
    payrollDraft: build.query<PayrollDraft, string>({
      query: (id) => ({ path: '/api/v1/payroll-drafts/' + id }),
      providesTags: ['PayrollDrafts', 'Session'],
    }),
    payrollDraftRevisions: build.query<
      { items: PayrollDraft[]; total: number; page: number; pageSize: number },
      { id: string; page: number }
    >({
      query: ({ id, page }) => ({ path: `/api/v1/payroll-drafts/${id}/revisions?page=${page}` }),
      providesTags: ['PayrollDrafts', 'Session'],
    }),
    payrollEmployees: build.query<{ items: PayrollEmployee[]; total: number }, string>({
      query: (search) => ({
        path: '/api/v1/employees?' + queryString({ search, page: 1, pageSize: 25 }),
      }),
      providesTags: ['Employees', 'Session'],
    }),
    createPayrollDraft: build.mutation<PayrollDraft, DraftInput>({
      query: (body) => ({ path: '/api/v1/payroll-drafts', method: 'POST', body }),
      invalidatesTags: (_data, error) => (!error || error.status === 409 ? ['PayrollDrafts'] : []),
    }),
    revisePayrollDraft: build.mutation<
      PayrollDraft,
      { id: string; body: Omit<DraftInput, 'employeeId' | 'period'> & { expectedVersion: number } }
    >({
      query: ({ id, body }) => ({ path: '/api/v1/payroll-drafts/' + id, method: 'PATCH', body }),
      invalidatesTags: (_data, error) => (!error || error.status === 409 ? ['PayrollDrafts'] : []),
    }),
  }),
});
