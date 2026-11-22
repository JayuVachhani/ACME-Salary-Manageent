import { requestDto } from '../../common/dto/request-dto.js';
import { z } from 'zod';
import { dateOrdinal } from '../../common/domain/money.js';
const code = z.string().regex(/^[A-Z]{3}$/);
export const fxDate = z
  .string()
  .refine((value) => {
    try {
      dateOrdinal(value);
      return value >= '0001-01-01';
    } catch {
      return false;
    }
  }, 'Use a valid YYYY-MM-DD date')
  .describe('Valid calendar date in YYYY-MM-DD format, year 0001 or later');
export const fxInput = z
  .object({
    base: code,
    quote: code,
    effectiveDate: fxDate,
    rate: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,8})?$/)
      .refine((value) => /[1-9]/.test(value), 'Rate must be positive'),
    source: z.string().trim().min(1).max(500),
    reason: z.string().trim().min(1).max(2000),
    expectedRevision: z.number().int().min(0),
  })
  .strict()
  .refine((value) => value.base !== value.quote, 'Currencies must differ')
  .describe(
    'Base and quote currencies must differ; rate is positive exact decimal text with at most 8 fractional places',
  );
export const fxQuery = z
  .object({
    base: code.optional(),
    quote: code.optional(),
    asOf: fxDate.optional(),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();
export const fxResolve = z.object({ base: code, quote: code, asOf: fxDate }).strict();

export class AppendFxRateDto extends requestDto(
  fxInput,
  'Invalid FX details: check currencies, date, positive decimal rate (max 8 places), source, reason and revision',
) {}

export class FxQueryDto extends requestDto(
  fxQuery,
  'Invalid FX details: check currencies, date, positive decimal rate (max 8 places), source, reason and revision',
) {}

export class ResolveFxDto extends requestDto(
  fxResolve,
  'Invalid FX details: check currencies, date, positive decimal rate (max 8 places), source, reason and revision',
) {}
