import { baseApi } from './base-api';
export type Currency = {
  code: string;
  currency_name: string;
  minor_units: number | null;
  configured_minor_units: number | null;
  is_active: boolean;
  version: number;
  supported: boolean;
  published_on: string;
  source: string;
};
export const currencyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    currencyCatalogue: build.query<{ items: Currency[] }, void>({
      query: () => ({ path: '/api/v1/currency-catalogue' }),
      providesTags: ['Currencies'],
    }),
  }),
});
export const { useCurrencyCatalogueQuery } = currencyApi;
