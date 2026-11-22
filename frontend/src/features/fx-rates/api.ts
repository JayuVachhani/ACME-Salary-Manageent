import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { FxQuery, PendingRate, Rate, Resolution } from './types';
export const fxApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    fxRates: build.query<{ items: Rate[]; total: number }, Partial<FxQuery> & { offset?: number }>({
      query: (query) => ({ path: `/api/v1/fx-rates?${queryString(query)}` }),
      providesTags: ['FxRates'],
    }),
    resolveFx: build.query<Resolution, FxQuery>({
      query: (query) => ({ path: `/api/v1/fx-rates/resolve?${queryString(query)}` }),
      providesTags: ['FxRates'],
    }),
    appendFx: build.mutation<{ revision: number }, PendingRate>({
      query: (pending) => ({
        path: '/api/v1/fx-rates',
        method: 'POST',
        body: { ...pending.input, expectedRevision: pending.expectedRevision },
      }),
      invalidatesTags: (_data, error) => (error ? [] : ['FxRates']),
    }),
  }),
});
export const { useFxRatesQuery, useLazyFxRatesQuery, useLazyResolveFxQuery, useAppendFxMutation } =
  fxApi;
