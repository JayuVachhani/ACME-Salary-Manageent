import { requestJson, queryString } from '../../shared/api/client';
import type { FxQuery, PendingRate, Rate, Resolution } from './types';
export { getCurrencyCatalogue } from '../../shared/api/currency-catalogue';
export const fxApi = {
  list: (query: Partial<FxQuery> & { offset?: number }, signal?: AbortSignal) => requestJson<{ items: Rate[]; total: number }>(`/api/v1/fx-rates?${queryString(query)}`, { signal, errorMessage: 'FX request failed' }),
  resolve: (query: FxQuery, signal: AbortSignal) => requestJson<Resolution>(`/api/v1/fx-rates/resolve?${queryString(query)}`, { signal, errorMessage: 'FX request failed' }),
  append: (pending: PendingRate, signal: AbortSignal) => requestJson<{ revision: number }>('/api/v1/fx-rates', { method: 'POST', body: { ...pending.input, expectedRevision: pending.expectedRevision }, signal }),
};
