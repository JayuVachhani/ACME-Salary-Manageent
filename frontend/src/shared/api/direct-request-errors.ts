import { ApiError } from './client';
import { accessDenied, sessionExpired } from './base-api';
type AuthLifecycleAction = ReturnType<typeof accessDenied> | ReturnType<typeof sessionExpired>;

/** Direct requests keep credentials local; only payload-free lifecycle events enter Redux. */
export function handleDirectRequestError(
  cause: unknown,
  dispatch: (action: AuthLifecycleAction) => unknown,
): void {
  // RTK Query unwraps to a plain QueryError and already reports its own auth lifecycle.
  if (!(cause instanceof ApiError)) return;
  if (cause.status === 401) dispatch(sessionExpired());
  else if (cause.status === 403) dispatch(accessDenied());
}
