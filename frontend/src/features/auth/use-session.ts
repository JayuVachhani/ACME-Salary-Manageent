import { refreshSession } from '../../shared/api/session';
import { baseApi } from '../../shared/api/base-api';
import { errorMessage } from '../../shared/api/client';
import { useAppDispatch } from '../../shared/state/hooks';
import { dismiss } from '../../shared/state/notifications';
import { sessionCleared } from '../../shared/state/store';

/** Server identity lives only in the RTK Query cache; no parallel Context or persisted credentials. */
export function useSession() {
  // App and Login already subscribe before the lazy workspace mounts; share that verified identity.
  const session = baseApi.useSessionQuery(undefined, { refetchOnMountOrArgChange: false });
  const dispatch = useAppDispatch();
  return {
    identity: session.isError ? null : (session.currentData ?? null),
    error:
      session.isError && session.error
        ? errorMessage(session.error, 'Could not load your session. Please retry.')
        : '',
    refresh: () => refreshSession(dispatch),
    clear: (message: string) => {
      dispatch(sessionCleared(message));
    },
    clearNotice: () => {
      dispatch(dismiss());
    },
  };
}
