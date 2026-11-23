import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { PolicyChoice, DraftChoice } from './types';
type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export const payrollCalculationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    calculationPolicies: build.query<Page<PolicyChoice>, number>({
      query: (page) => ({ path: '/api/v1/payroll-policies?' + queryString({ page }) }),
      providesTags: ['PayrollPolicies', 'Session'],
    }),
    calculationDrafts: build.query<
      Page<DraftChoice>,
      { period: string; search: string; page: number }
    >({
      query: (q) => ({ path: '/api/v1/payroll-drafts?' + queryString(q) }),
      providesTags: ['PayrollDrafts', 'Session'],
    }),
  }),
});
