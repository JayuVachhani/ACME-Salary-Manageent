import { useEffect } from 'react';
import { errorMessage } from '../../shared/api/client';
import { useLazyEmployeeQuery } from './api';
export function useEmployeeProfile(id: string) {
  const [load, result] = useLazyEmployeeQuery();
  useEffect(() => {
    let active = true;
    let request: ReturnType<typeof load> | undefined;
    // Do not start an immediately cancelled StrictMode setup probe for the same cache key.
    queueMicrotask(() => {
      if (active) request = load(id);
    });
    return () => {
      active = false;
      request?.abort();
    };
  }, [id, load]);
  const status = result.error && 'status' in result.error ? result.error.status : undefined;
  const transientFailure =
    result.isError &&
    (status === 'NETWORK_ERROR' ||
      status === 'CANCELLED' ||
      (typeof status === 'number' && status >= 500));
  return {
    data: result.isError && !transientFailure ? null : (result.currentData ?? null),
    loading: result.isUninitialized || result.isFetching,
    error:
      result.isError && result.error
        ? errorMessage(result.error, 'Employee request failed. Please retry.')
        : '',
  };
}
