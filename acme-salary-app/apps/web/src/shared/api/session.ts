import { baseApi } from './base-api';
import type { AppDispatch } from '../state/store';

/** OTP may finish before the anonymous startup read. Do not deduplicate against that old request. */
export async function refreshSession(dispatch: AppDispatch) {
  const previous = dispatch(baseApi.util.getRunningQueryThunk('session', undefined));
  if (previous) {
    previous.abort();
    await previous;
  }
  return dispatch(
    baseApi.endpoints.session.initiate(undefined, { subscribe: false, forceRefetch: true }),
  ).unwrap();
}
