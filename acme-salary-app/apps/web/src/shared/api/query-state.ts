import { errorMessage } from './client';
/** Adapt library state to the feature view models; never owns a second copy of server data. */
export function queryState<T>(query: { currentData?: T; isError?: boolean; isFetching: boolean; error?: unknown; refetch: () => { unwrap: () => Promise<T> } }, initial: T) {
  return { data: query.currentData ?? initial, loading: query.isFetching,
    error: query.isError && query.error ? errorMessage(query.error, 'Service unavailable. Please try again.') : '',
    refresh: () => query.refetch().unwrap() };
}
