import { requestJson } from '../../shared/api/client';
import type { Currency } from '../../shared/api/currency-catalogue';
import type { Country, Draft } from './types';
export { getCurrencyCatalogue } from '../../shared/api/currency-catalogue';
export const countryCurrencyApi = {
  list: (offset: number, signal?: AbortSignal) => requestJson<{ items: Country[]; total: number }>(`/api/v1/countries?offset=${offset}`, { signal, errorMessage: 'Country/currency request failed' }),
  save: (draft: Draft, editing: Country | null, signal: AbortSignal) => {
    const { isActive, countryCode, ...fields } = draft;
    return requestJson<unknown>(`/api/v1/countries${editing ? `/${editing.country_code}` : ''}`, { method: editing ? 'PATCH' : 'POST', signal,
      body: editing ? { ...fields, isActive, expectedVersion: editing.version } : { ...fields, countryCode } });
  },
  activate: (currency: Currency, signal: AbortSignal) => requestJson<unknown>(`/api/v1/currencies/${currency.code}`, { method: 'PATCH', signal, body: { isActive: !currency.is_active, expectedVersion: currency.version } }),
};
