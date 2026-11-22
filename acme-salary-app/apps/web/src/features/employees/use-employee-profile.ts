import { useCallback } from 'react';
import { useResource } from '../../shared/hooks/use-resource';
import { employeesApi } from './api';
import type { Employee } from './types';
export function useEmployeeProfile(id: string) {
  const loader = useCallback((signal: AbortSignal) => employeesApi.detail(id, signal), [id]);
  return useResource<Employee | null>(loader, null);
}
