import { offsetQuery } from '../../common/dto/pagination.dto.js';
import { requestDto } from '../../common/dto/request-dto.js';
import { z } from 'zod';
export const countryCode = z.string().regex(/^[A-Z]{2}$/);
export const currencyCode = z.string().regex(/^[A-Z]{3}$/);
export const countryInput = z.object({ countryCode, countryName: z.string().trim().min(1).max(200), defaultCurrency: currencyCode,
  decimalPlaces: z.number().int().min(0).max(4), roundingMode: z.enum(['HALF_UP', 'FLOOR', 'CEIL']),
  regulatoryNotes: z.string().trim().max(4000), retentionNotes: z.string().trim().max(4000) }).strict();
export const countryChange = countryInput.omit({ countryCode: true }).extend({ isActive: z.boolean(), expectedVersion: z.number().int().positive() }).strict();
export const currencyChange = z.object({ isActive: z.boolean(), expectedVersion: z.number().int().min(0) }).strict();

export class CreateCountryDto extends requestDto(countryInput, 'Invalid country or currency details') {}

export class ChangeCountryDto extends requestDto(countryChange, 'Invalid country or currency details') {}

export class ChangeCurrencyDto extends requestDto(currencyChange, 'Invalid country or currency details') {}

export class CountryParamsDto extends requestDto(z.object({ code: countryCode }).strict(), 'Invalid country or currency details') {}

export class CurrencyParamsDto extends requestDto(z.object({ code: currencyCode }).strict(), 'Invalid country or currency details') {}

export class CountryOffsetQueryDto extends requestDto(offsetQuery, 'Invalid country or currency details') {}
