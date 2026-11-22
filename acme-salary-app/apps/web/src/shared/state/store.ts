import { configureStore, createAction, createListenerMiddleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { accessDenied, baseApi, sessionExpired } from '../api/base-api';
import { notifications, notify } from './notifications';

export const sessionCleared = createAction<string>('session/cleared');
const listener = createListenerMiddleware();
export const store = configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer, notifications: notifications.reducer },
  middleware: getDefault => getDefault().prepend(listener.middleware).concat(baseApi.middleware),
  // Employee records must not be exposed to browser Redux DevTools, including in development.
  devTools: false,
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
const startListening = listener.startListening.withTypes<RootState, AppDispatch>();
function clearSession(dispatch: AppDispatch, message: string) {
  for (const request of dispatch(baseApi.util.getRunningQueriesThunk())) request.abort();
  for (const request of dispatch(baseApi.util.getRunningMutationsThunk())) request.abort();
  dispatch(baseApi.util.resetApiState());
  void dispatch(baseApi.util.upsertQueryData('session', undefined, null));
  dispatch(notify(message));
}
startListening({ actionCreator: sessionCleared, effect: (action, api) => clearSession(api.dispatch, action.payload) });
startListening({ actionCreator: sessionExpired, effect: (_action, api) => {
  // The initial anonymous /me response is expected; expiry feedback is only for an existing session.
  if (baseApi.endpoints.session.select()(api.getOriginalState()).data) clearSession(api.dispatch, 'Your session expired. Please sign in again.');
} });
startListening({ actionCreator: accessDenied, effect: (_action, api) => { api.dispatch(baseApi.util.invalidateTags(['Session'])); } });
// Module-level setup avoids duplicate focus/network subscriptions during StrictMode remounts.
setupListeners(store.dispatch);
