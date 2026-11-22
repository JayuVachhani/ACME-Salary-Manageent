import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { Employee, EmployeeQuery, Filters } from './types';
export const employeesApi = baseApi.injectEndpoints({ endpoints: build => ({
  employees: build.query<{ items: Employee[]; total: number }, EmployeeQuery>({ query: query => ({ path: `/api/v1/employees?${queryString(query)}` }), providesTags: ['Employees'] }),
  employeeFilters: build.query<Filters, void>({ query: () => ({ path: '/api/v1/employees/filters' }), providesTags: ['EmployeeFilters'] }),
  employee: build.query<Employee, string>({ query: id => ({ path: `/api/v1/employees/${id}` }), providesTags: ['Employees'] }),
}) });
export const { useEmployeesQuery, useEmployeeFiltersQuery, useLazyEmployeeQuery } = employeesApi;
