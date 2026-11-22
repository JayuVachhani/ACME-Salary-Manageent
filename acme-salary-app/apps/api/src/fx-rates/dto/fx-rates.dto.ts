import { z } from 'zod';
import { dateOrdinal } from '../../common/domain/money.js';
const code = z.string().regex(/^[A-Z]{3}$/);
export const fxDate = z.string().refine(value => { try {
  dateOrdinal(value);
  return value >= '0001-01-01';
}
catch {
  return false;
} }, 'Use a valid YYYY-MM-DD date');
export const fxInput = z.object({ base: code, quote: code, effectiveDate: fxDate,
  rate: z.string().regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,8})?$/).refine(value => /[1-9]/.test(value), 'Rate must be positive'),
  source: z.string().trim().min(1).max(500), reason: z.string().trim().min(1).max(2000), expectedRevision: z.number().int().min(0)
}).strict().refine(value => value.base !== value.quote, 'Currencies must differ');
export const fxQuery = z.object({ base: code.optional(), quote: code.optional(), asOf: fxDate.optional(), offset: z.coerce.number().int().min(0).max(100000).default(0) }).strict();
export const fxResolve = z.object({ base: code, quote: code, asOf: fxDate }).strict();
