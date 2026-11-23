import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
import { timestampText } from '../../common/dto/response-values.js';
const money = z.string().regex(/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/);
const percent = z.string().regex(/^(100(\.0{1,6})?|[0-9]{1,2}(\.\d{1,6})?)$/);
const contribution = z
  .object({
    enabled: z.boolean(),
    employeePercent: percent,
    employerPercent: percent,
    base: z.enum(['BASIC', 'BASIC_HRA', 'GROSS']),
    wageCap: money.nullable(),
    capProration: z.enum(['FULL_CAP', 'CALENDAR_PAID_DAYS']),
    eligibilityCeiling: money.nullable(),
    eligibilityCeilingBasis: z.enum(['PAYABLE_EARNINGS', 'FULL_MONTH_BASE']),
  })
  .strict();
const mode = z.enum(['CALENDAR_DAYS', 'FULL_MONTH']);
export const payrollPolicyConfig = z
  .object({
    name: z.string().trim().min(1).max(200),
    countryCode: z.literal('IN'),
    currency: z.literal('INR'),
    roundingMode: z.enum(['HALF_UP', 'FLOOR', 'CEIL']),
    basicSource: z.enum(['LEDGER', 'MANUAL_DRAFT']),
    fullMonthLedgerRateDate: z.enum(['PERIOD_END', 'EMPLOYMENT_END']),
    manualStatutoryTreatment: z.literal('REPLACE_WITH_POLICY_AND_INPUTS'),
    proration: z
      .object({
        basic: mode,
        hra: mode,
        allowances: mode,
        bonuses: mode,
        incentives: mode,
        overtime: mode,
      })
      .strict(),
    unpaidLeaveTreatment: z.enum(['PRORATE_EARNINGS', 'MANUAL_DEDUCTION']),
    employerContributionTreatment: z.literal('EMPLOYER_ONLY_NOT_DEDUCTED'),
    pf: contribution,
    esi: contribution,
    professionalTax: z
      .object({
        mode: z.enum(['DISABLED', 'MANUAL_INPUT', 'STATE_RULES']),
        rules: z
          .array(
            z
              .object({
                stateCode: z.string().trim().min(1).max(20).toUpperCase(),
                amount: money,
                proration: mode,
              })
              .strict(),
          )
          .max(100)
          .refine((rows) => new Set(rows.map((r) => r.stateCode)).size === rows.length),
      })
      .strict(),
    tdsMode: z.enum(['DISABLED', 'MANUAL_INPUT']),
    finalizerRole: z.enum(['HR', 'FINANCE']),
    financeApproverIds: z
      .array(z.uuid().toLowerCase())
      .min(1)
      .max(20)
      .refine((ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length),
    requiresDirector: z.boolean(),
    directorApproverIds: z
      .array(z.uuid().toLowerCase())
      .max(20)
      .refine((ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length),
  })
  .strict()
  .refine((c) => !c.requiresDirector || c.directorApproverIds.length > 0, {
    message: 'Choose Director approvers when Director approval is required',
  })
  .refine((c) => c.professionalTax.mode !== 'STATE_RULES' || c.professionalTax.rules.length > 0, {
    message: 'Configure state rules explicitly',
  });
export type PayrollPolicyConfig = z.output<typeof payrollPolicyConfig>;
export const createPayrollPolicyInput = z
  .object({
    policyKey: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Za-z0-9_-]+$/)
      .toUpperCase(),
    effectiveFrom: z.iso
      .date()
      .refine(
        (date) => /^(?!9999)[2-9]\d{3}-(0[1-9]|1[0-2])-01$/.test(date),
        'Policy starts must be a first day from 2000 through 9998',
      ),
    config: payrollPolicyConfig,
    reason: z.string().trim().min(1).max(1000),
    confirmed: z.literal(true),
  })
  .strict();
export class CreatePayrollPolicyDto extends requestDto(
  createPayrollPolicyInput,
  'Complete all explicit policy settings and approval assignments',
) {}
export class ApprovePayrollPolicyDto extends requestDto(
  z.object({ comment: z.string().trim().min(1).max(1000), confirmed: z.literal(true) }).strict(),
  'Enter an approval comment and confirm',
) {}
export class PayrollPolicyParamsDto extends requestDto(
  z.object({ id: z.uuid() }).strict(),
  'Invalid payroll policy',
) {}
export class PayrollPolicyQueryDto extends requestDto(
  z
    .object({
      page: z.coerce.number().int().min(1).max(100000).default(1),
      search: z.string().trim().max(100).default(''),
    })
    .strict(),
  'Invalid policy list filters',
) {}
export const payrollPolicyResponse = z.object({
  id: z.uuid(),
  policyKey: z.string(),
  version: z.number().int(),
  effectiveFrom: z.string(),
  config: payrollPolicyConfig,
  policyHash: z.string(),
  createdBy: z.uuid(),
  createdByName: z.string(),
  createdAt: timestampText,
  status: z.enum(['INACTIVE', 'ACTIVE']),
  approvedBy: z.uuid().nullable(),
  approvedByName: z.string().nullable(),
  approvedAt: timestampText.nullable(),
  reason: z.string(),
  assignees: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      employeeCode: z.string().nullable(),
      role: z.enum(['FINANCE', 'DIRECTOR']),
      active: z.boolean(),
    }),
  ),
});
export const payrollPolicyPageResponse = z.object({
  items: z.array(payrollPolicyResponse),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const policyApproverPageResponse = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      email: z.string(),
      employeeCode: z.string().nullable(),
      hr: z.boolean(),
    }),
  ),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
