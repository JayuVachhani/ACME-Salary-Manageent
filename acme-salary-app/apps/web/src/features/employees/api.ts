import { queryString, requestJson } from '../../shared/api/client';
import type { Employee, EmployeeQuery, Filters } from './types';
export const employeesApi = {
  list: (query: EmployeeQuery, signal: AbortSignal) => requestJson<{ items: Employee[]; total: number }>(`/api/v1/employees?${queryString(query)}`, { signal, errorMessage: 'Employee request failed' }),
  filters: (signal: AbortSignal) => requestJson<Filters>('/api/v1/employees/filters', { signal, errorMessage: 'Employee request failed' }),
  detail: (id: string, signal: AbortSignal) => requestJson<Employee>(`/api/v1/employees/${id}`, { signal, errorMessage: 'Employee request failed' }),
};
