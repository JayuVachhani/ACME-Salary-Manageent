import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { SalaryWorkspaceFilters, SalaryWorkspacePage, SalaryWorkspaceQuery } from './types';

export const salaryWorkspaceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    salaryWorkspace: build.query<SalaryWorkspacePage, SalaryWorkspaceQuery>({
      query: (query) => ({ path: `/api/v1/salary/workspace?${queryString(query)}` }),
      providesTags: ['Employees', 'SalaryRequests', 'Session', 'Countries', 'References'],
    }),
    salaryWorkspaceFilters: build.query<SalaryWorkspaceFilters, void>({
      query: () => ({ path: '/api/v1/employees/filters' }),
      providesTags: ['EmployeeFilters', 'Countries', 'References'],
    }),
  }),
});
export const { useSalaryWorkspaceQuery, useSalaryWorkspaceFiltersQuery } = salaryWorkspaceApi;
