import { requestJson } from './client';
export type Currency = { code: string; currency_name: string; minor_units: number | null; configured_minor_units: number | null; is_active: boolean; version: number; supported: boolean; published_on: string; source: string };
export const getCurrencyCatalogue = (signal?: AbortSignal) => requestJson<{ items: Currency[] }>('/api/v1/currency-catalogue', { signal, errorMessage: 'Country/currency request failed' });
