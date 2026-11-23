import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
const money = z.string().regex(/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/);
export const payrollCalculationInput = z
  .object({
    employeeId: z.uuid(),
    period: z.string().regex(/^(?!9999)[2-9]\d{3}-(0[1-9]|1[0-2])$/),
    policyId: z.uuid().optional(),
    manualDraftId: z.uuid(),
    expectedDraftVersion: z.number().int().positive(),
    pfEligible: z.boolean(),
    esiEligible: z.boolean(),
    stateCode: z.string().trim().min(1).max(20).toUpperCase(),
    ptAmount: money,
    tdsAmount: money,
    leavingDate: z.iso.date().nullable(),
    unpaidDates: z
      .array(z.iso.date())
      .max(31)
      .refine((dates) => new Set(dates).size === dates.length),
  })
  .strict();
export type PayrollCalculationInput = z.output<typeof payrollCalculationInput>;
export class PayrollCalculationDto extends requestDto(
  payrollCalculationInput,
  'Supply eligibility, state, manual tax, leaving and unpaid-date inputs explicitly',
) {}
const amounts = z.object({
  basic: z.string(),
  hra: z.string(),
  allowances: z.string(),
  bonuses: z.string(),
  incentives: z.string(),
  overtime: z.string(),
});
export const payrollCalculationResponse = z.object({
  employeeId: z.uuid(),
  period: z.string(),
  currency: z.literal('INR'),
  policyId: z.uuid(),
  policyVersion: z.number().int(),
  policyHash: z.string(),
  manualDraftId: z.uuid(),
  manualDraftVersion: z.number().int(),
  employeeVersion: z.number().int(),
  inputs: payrollCalculationInput,
  periodStart: z.string(),
  periodEnd: z.string(),
  calendarDays: z.number().int(),
  employmentDays: z.number().int(),
  paidDays: z.number().int(),
  prorationDays: z.number().int(),
  segments: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      calendarDays: z.number().int(),
      paidDays: z.number().int(),
      salaryRecordId: z.uuid(),
      monthlyAmount: z.string(),
      currency: z.literal('INR'),
      correctsId: z.uuid().nullable(),
    }),
  ),
  earnings: amounts,
  deductions: z.object({
    pf: z.string(),
    esi: z.string(),
    professionalTax: z.string(),
    tds: z.string(),
    unpaidLeave: z.string(),
    authorized: z.string(),
  }),
  employerContributions: z.object({ pf: z.string(), esi: z.string() }),
  gross: z.string(),
  deductionTotal: z.string(),
  net: z.string(),
  sourceHash: z.string(),
  previewHash: z.string(),
  warnings: z.array(z.string()),
});
export type PayrollCalculationPreview = z.output<typeof payrollCalculationResponse>;
