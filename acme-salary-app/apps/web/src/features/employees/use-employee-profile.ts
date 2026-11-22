import { useEffect } from 'react';
import { errorMessage } from '../../shared/api/client';
import { useLazyEmployeeQuery } from './api';
export function useEmployeeProfile(id: string) {
  const [load, result] = useLazyEmployeeQuery();
  useEffect(() => {
    let active = true;
    let request: ReturnType<typeof load> | undefined;
    // Do not start an immediately cancelled StrictMode setup probe for the same cache key.
    queueMicrotask(() => { if (active) request = load(id); });
    return () => { active = false; request?.abort(); };
  }, [id, load]);
  return { data: result.isError ? null : result.currentData ?? null,
    loading: result.isUninitialized || result.isFetching,
    error: result.isError && result.error ? errorMessage(result.error, 'Employee request failed. Please retry.') : '' };
}
