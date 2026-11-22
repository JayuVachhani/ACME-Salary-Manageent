import { timestampText } from '../../common/dto/response-values.js';
import { z } from 'zod';
export const currencyResponse = z.object({
  code: z.string(),
  minor_units: z.number().int(),
  is_active: z.boolean(),
  version: z.number().int(),
});
export const catalogueEntryResponse = z.object({
  code: z.string(),
  currency_name: z.string(),
  minor_units: z.number().int().nullable(),
  published_on: z.string(),
  source: z.string(),
  is_active: z.boolean(),
  version: z.number().int(),
  supported: z.boolean(),
  configured_minor_units: z.number().int().nullable(),
});
export const catalogueResponse = z.object({ items: z.array(catalogueEntryResponse) });
export const currenciesResponse = z.object({ items: z.array(currencyResponse) });
export const countryResponse = z.object({
  country_code: z.string(),
  country_name: z.string(),
  default_currency: z.string(),
  decimal_places: z.number().int(),
  rounding_mode: z.enum(['HALF_UP', 'FLOOR', 'CEIL']),
  is_active: z.boolean(),
  version: z.number().int(),
  regulatory_notes: z.string().nullable(),
  retention_notes: z.string().nullable(),
  updated_at: timestampText,
});
export const countriesResponse = z.object({
  items: z.array(countryResponse),
  total: z.number().int(),
});

export type CurrencyResponse = z.output<typeof currencyResponse>;
export type CatalogueEntryResponse = z.output<typeof catalogueEntryResponse>;
export type CountryResponse = z.output<typeof countryResponse>;
export type CountryRecord = Omit<CountryResponse, 'updated_at'> & { updated_at: Date };
