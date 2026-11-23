import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
export const salaryDraftInput = z
  .object({
    commandId: z.uuid(),
    leaseToken: z.string().regex(/^[\w-]{43}$/),
    expectedVersion: z.number().int().positive(),
    amount: z
      .string()
      .max(24)
      .regex(/^(0|[1-9]\d*)(\.\d{1,4})?$/),
    currency: z.string().regex(/^[A-Z]{3}$/),
    effectiveFrom: z.iso.date(),
    correctsId: z.uuid().optional(),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();
export const salaryWriteInput = salaryDraftInput
  .extend({ previewHash: z.string().regex(/^[a-f0-9]{64}$/), confirmed: z.literal(true) })
  .strict();
export class SalaryDraftDto extends requestDto(
  salaryDraftInput,
  'Check salary amount, effective date, reason and edit session',
) {}
export class SalaryWriteDto extends requestDto(
  salaryWriteInput,
  'Review and confirm the current salary preview before saving',
) {}
export class SalaryEmployeeParamsDto extends requestDto(
  z.object({ id: z.uuid() }).strict(),
  'Invalid employee identifier',
) {}
export const salaryBeforeResponse = z.object({
  id: z.uuid(),
  amount: z.string(),
  currency: z.string(),
  effectiveFrom: z.string(),
  decimalPlaces: z.number().int(),
});
export const salaryPreviewResponse = z.object({
  businessDate: z.string(),
  employeeVersion: z.number().int(),
  amount: z.string(),
  currency: z.string(),
  effectiveFrom: z.string(),
  correction: z.boolean(),
  requiresApproval: z.boolean(),
  before: salaryBeforeResponse.nullable(),
  policy: z.object({
    countryCode: z.string(),
    countryName: z.string(),
    defaultCurrency: z.string(),
    decimalPlaces: z.number().int(),
    roundingMode: z.enum(['HALF_UP', 'FLOOR', 'CEIL']),
    version: z.number().int(),
  }),
  convertedAmount: z.string(),
  conversionLegs: z.array(
    z.object({
      rateId: z.uuid(),
      base: z.string(),
      quote: z.string(),
      rate: z.string(),
      effectiveDate: z.string(),
      revision: z.number().int(),
      inverse: z.boolean(),
      source: z.string(),
    }),
  ),
  previewHash: z.string(),
});
export const salaryWriteResponse = z.object({
  outcome: z.enum(['RECORDED', 'PENDING_APPROVAL']),
  salaryId: z.uuid().nullable(),
  requestId: z.uuid().nullable(),
  employeeVersion: z.number().int(),
  replayed: z.boolean(),
});
