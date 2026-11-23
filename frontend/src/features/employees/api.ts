import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { Employee, EmployeeQuery, Filters } from './types';
import type { EmployeeCreateInput, EmployeeCreateOptions } from './create-types';
import type { EmployeeSalaryData } from './salary-types';
export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    resubmitInitialSalary: build.mutation<
      { employeeId: string; requestId: string; status: 'PENDING' },
      {
        id: string;
        commandId: string;
        expectedVersion: number;
        amount: string;
        currency: string;
        effectiveFrom: string;
        reason: string;
        confirmed: true;
      }
    >({
      query: ({ id, ...body }) => ({
        path: '/api/v1/employees/' + id + '/initial-salary',
        method: 'POST',
        body,
        timeoutMs: 20000,
      }),
      invalidatesTags: (_data, error) => (error ? [] : ['Employees', 'SalaryRequests']),
    }),
    employeeSalary: build.query<
      EmployeeSalaryData,
      { id: string; page: number; requestsPage?: number }
    >({
      query: ({ id, page, requestsPage = 1 }) => ({
        path: `/api/v1/employees/${id}/salary?page=${page}&requestsPage=${requestsPage}`,
      }),
      providesTags: ['Employees', 'SalaryRequests', 'Session'],
    }),
    salaryEditSnapshot: build.query<Employee, string>({
      query: (id) => ({ path: `/api/v1/employees/${id}` }),
    }),
    employeeCreateOptions: build.query<EmployeeCreateOptions, void>({
      query: () => ({ path: '/api/v1/employees/create-options' }),
      providesTags: ['EmployeeFilters', 'References', 'Countries', 'Currencies'],
    }),
    createEmployee: build.mutation<
      { employeeId: string; requestId: string; status: 'PENDING' },
      EmployeeCreateInput
    >({
      query: (body) => ({ path: '/api/v1/employees', method: 'POST', body, timeoutMs: 20000 }),
      invalidatesTags: (_data, error) => (error ? [] : ['Employees', 'SalaryRequests']),
    }),
    employees: build.query<{ items: Employee[]; total: number }, EmployeeQuery>({
      query: (query) => ({ path: `/api/v1/employees?${queryString(query)}` }),
      providesTags: ['Employees'],
    }),
    employeeFilters: build.query<Filters, void>({
      query: () => ({ path: '/api/v1/employees/filters' }),
      providesTags: ['EmployeeFilters'],
    }),
    employee: build.query<Employee, string>({
      query: (id) => ({ path: `/api/v1/employees/${id}` }),
      providesTags: ['Employees'],
    }),
  }),
});
export const { useEmployeesQuery, useEmployeeFiltersQuery, useLazyEmployeeQuery } = employeesApi;
export const { useEmployeeCreateOptionsQuery, useCreateEmployeeMutation } = employeesApi;
export const { useEmployeeSalaryQuery } = employeesApi;

export const { useResubmitInitialSalaryMutation } = employeesApi;
