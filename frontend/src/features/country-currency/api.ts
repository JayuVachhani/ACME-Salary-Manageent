import { baseApi } from '../../shared/api/base-api';
import type { Currency } from '../../shared/api/currency-catalogue';
import type { Country, Draft } from './types';
export const countryCurrencyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    countries: build.query<{ items: Country[]; total: number }, number>({
      query: (offset) => ({ path: `/api/v1/countries?offset=${offset}` }),
      providesTags: ['Countries'],
    }),
    saveCountry: build.mutation<unknown, { draft: Draft; editing: Country | null }>({
      query: ({ draft, editing }) => {
        const { isActive, countryCode, ...fields } = draft;
        return {
          path: `/api/v1/countries${editing ? `/${editing.country_code}` : ''}`,
          method: editing ? 'PATCH' : 'POST',
          body: editing
            ? { ...fields, isActive, expectedVersion: editing.version }
            : { ...fields, countryCode },
        };
      },
      invalidatesTags: (_data, error) =>
        error ? [] : ['Countries', 'EmployeeFilters', 'Employees'],
    }),
    activateCurrency: build.mutation<unknown, Currency>({
      query: (currency) => ({
        path: `/api/v1/currencies/${currency.code}`,
        method: 'PATCH',
        body: { isActive: !currency.is_active, expectedVersion: currency.version },
      }),
      invalidatesTags: (_data, error) => (error ? [] : ['Currencies']),
    }),
  }),
});
export const { useCountriesQuery, useSaveCountryMutation, useActivateCurrencyMutation } =
  countryCurrencyApi;
