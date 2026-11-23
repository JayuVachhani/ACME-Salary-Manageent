import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createAction } from '@reduxjs/toolkit';
import { ApiError, requestJson, serviceOnline } from './client';

export type Identity = { id: string; isHrManager: boolean; permissions: string[] };
export type QueryError = { status: number | 'NETWORK_ERROR' | 'CANCELLED'; message: string };
type Request = {
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: object;
  timeoutMs?: number;
};
export const sessionExpired = createAction('session/expired');
export const accessDenied = createAction('session/accessDenied');
const baseQuery: BaseQueryFn<Request, unknown, QueryError> = async ({ path, ...options }, api) => {
  try {
    return { data: await requestJson<unknown>(path, { ...options, signal: api.signal }) };
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) {
      api.dispatch(sessionExpired());
      if (path === '/api/v1/auth/me') return { data: null };
    }
    if (cause instanceof ApiError && cause.status === 403 && path !== '/api/v1/auth/me')
      api.dispatch(accessDenied());
    return {
      error: {
        status: api.signal.aborted
          ? 'CANCELLED'
          : cause instanceof ApiError
            ? cause.status
            : 'NETWORK_ERROR',
        message: api.signal.aborted
          ? 'Request cancelled.'
          : cause instanceof ApiError
            ? cause.message
            : 'Service unavailable. Please try again.',
      },
    };
  }
};

/** One cache and transport for the same-origin API; feature files inject their endpoints. */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  keepUnusedDataFor: 0,
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'Session',
    'Team',
    'References',
    'Countries',
    'Currencies',
    'FxRates',
    'EmployeeFilters',
    'Employees',
    'SalaryRequests',
    'PayrollDrafts',
  ],
  endpoints: (build) => ({
    health: build.query<boolean, void>({
      queryFn: async (_arg, api) => {
        const controller = new AbortController();
        // Preserve the visible deadline under browser clock controls as well as the transport timeout.
        const deadline = window.setTimeout(() => controller.abort(), 8000);
        try {
          return { data: await serviceOnline(AbortSignal.any([api.signal, controller.signal])) };
        } catch {
          return { data: false };
        } finally {
          window.clearTimeout(deadline);
        }
      },
    }),
    session: build.query<Identity | null, void>({
      query: () => ({ path: '/api/v1/auth/me' }),
      providesTags: ['Session'],
    }),
  }),
});
