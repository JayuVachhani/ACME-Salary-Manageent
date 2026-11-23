import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { PayrollRun, RunSummary, RunSetup, RunSourceDraft, RunPolicyChoice } from './types';
export const payrollRunsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    payrollRuns: build.query<
      { items: RunSummary[]; total: number; page: number; pageSize: number },
      { period: string; page: number }
    >({
      query: (q) => ({ path: '/api/v1/payroll-runs?' + queryString(q) }),
      providesTags: ['PayrollRuns', 'Session'],
    }),
    payrollRun: build.query<PayrollRun, { id: string; page: number }>({
      query: (q) => ({ path: `/api/v1/payroll-runs/${q.id}?page=${q.page}` }),
      providesTags: ['PayrollRuns', 'PayrollDrafts', 'Session'],
    }),
    runSetup: build.query<RunSetup, { period: string; policyId: string }>({
      query: (query) => ({ path: '/api/v1/payroll-runs/setup?' + queryString(query) }),
      providesTags: ['PayrollRuns', 'PayrollPolicies', 'Team', 'Session'],
    }),
    runPolicyChoices: build.query<
      { items: RunPolicyChoice[]; total: number; page: number; pageSize: number },
      number
    >({
      query: (page) => ({ path: '/api/v1/payroll-policies?' + queryString({ page }) }),
      providesTags: ['PayrollRuns', 'PayrollPolicies', 'Session'],
    }),
    runSourceDrafts: build.query<
      { items: RunSourceDraft[]; total: number; page: number; pageSize: number },
      { period: string; page: number; search: string }
    >({
      query: (q) => ({ path: '/api/v1/payroll-drafts?' + queryString(q) }),
      providesTags: ['PayrollDrafts', 'Session'],
    }),
  }),
});
