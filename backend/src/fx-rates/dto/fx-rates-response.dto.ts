import { timestampText } from '../../common/dto/response-values.js';
import { z } from 'zod';
export const fxRateResponse = z.object({
  id: z.uuid(),
  base_currency: z.string(),
  quote_currency: z.string(),
  effective_date: z.string(),
  revision: z.number().int(),
  rate: z.string().describe('Exact decimal text; never a floating-point JSON number'),
  source: z.string(),
  reason: z.string(),
  created_by: z.uuid(),
  recorded_at: timestampText,
});
export const fxPageResponse = z.object({ items: z.array(fxRateResponse), total: z.number().int() });
const provenance = z.object({
  id: z.string(),
  base: z.string(),
  quote: z.string(),
  effectiveDate: z.string(),
  revision: z.number().int(),
  rate: z.string(),
  source: z.string(),
});
export const fxResolutionResponse = z.object({
  base: z.string(),
  quote: z.string(),
  asOf: z.string(),
  maxStalenessDays: z.number().int(),
  rate: z.string(),
  path: z.array(z.object({ inverse: z.boolean(), rate: provenance })),
});

export type FxRateResponse = z.output<typeof fxRateResponse>;
export type FxRateRecord = Omit<FxRateResponse, 'recorded_at'> & { recorded_at: Date };
export type FxResolutionResponse = z.output<typeof fxResolutionResponse>;
