import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
import { timestampText } from '../../common/dto/response-values.js';
export class SalaryRequestParamsDto extends requestDto(
  z.object({ id: z.uuid() }).strict(),
  'Invalid salary request',
) {}
export class SalaryRequestQueryDto extends requestDto(
  z
    .object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    })
    .strict(),
  'Invalid approval filters',
) {}
export class SalaryDecisionDto extends requestDto(
  z
    .object({
      decision: z.enum(['APPROVED', 'REJECTED']),
      comment: z.string().trim().min(1).max(1000),
      confirmed: z.literal(true),
    })
    .strict(),
  'Select a decision and enter a comment',
) {}
export const salaryRequestResponse = z.object({
  id: z.uuid(),
  employee_id: z.uuid(),
  employee_code: z.string(),
  employee_name: z.string(),
  requested_by: z.uuid(),
  requested_by_name: z.string(),
  request_kind: z.enum(['INITIAL', 'BACKDATED']),
  monthly_amount: z.string(),
  currency: z.string(),
  effective_from: z.string(),
  reason: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  decision_comment: z.string().nullable(),
  can_decide: z.boolean(),
  correctsId: z.uuid().nullable(),
  decimalPlaces: z.number().int(),
  countryCode: z.string(),
  defaultCurrency: z.string(),
  before: z
    .object({
      id: z.uuid(),
      amount: z.string(),
      currency: z.string(),
      countryCode: z.string(),
      defaultCurrency: z.string(),
      effectiveFrom: z.string(),
      decimalPlaces: z.number().int(),
    })
    .nullable(),
  isStale: z.boolean(),
  decidedByName: z.string().nullable(),
  decidedAt: timestampText.nullable(),
});
export const salaryRequestPageResponse = z.object({
  items: z.array(salaryRequestResponse),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const salaryDecisionResponse = z.object({ salaryId: z.uuid().nullable() });
