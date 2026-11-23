import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
import { timestampText } from '../../common/dto/response-values.js';

const amount = z.string().regex(/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/);
const suppliedAmount = amount.transform((value) => {
  const [integer, decimals = ''] = value.split('.');
  return `${integer}.${decimals.padEnd(2, '0')}`;
});
const earningFields = {
  basic: amount,
  hra: amount,
  allowances: amount,
  bonuses: amount,
  incentives: amount,
  overtime: amount,
};
const deductionFields = {
  pf: amount,
  esi: amount,
  professionalTax: amount,
  tds: amount,
  unpaidLeave: amount,
  authorized: amount,
};
export const payrollEarningsResponse = z.object(earningFields).strict();
export const payrollDeductionsResponse = z.object(deductionFields).strict();
const earningsInput = z
  .object({
    basic: suppliedAmount,
    hra: suppliedAmount,
    allowances: suppliedAmount,
    bonuses: suppliedAmount,
    incentives: suppliedAmount,
    overtime: suppliedAmount,
  })
  .strict();
const deductionsInput = z
  .object({
    pf: suppliedAmount,
    esi: suppliedAmount,
    professionalTax: suppliedAmount,
    tds: suppliedAmount,
    unpaidLeave: suppliedAmount,
    authorized: suppliedAmount,
  })
  .strict();
const period = z.string().regex(/^(?!9999)[2-9]\d{3}-(0[1-9]|1[0-2])$/);
const supplied = {
  commandId: z.uuid(),
  earnings: earningsInput,
  deductions: deductionsInput,
  reason: z.string().trim().min(1).max(1000),
  confirmed: z.literal(true),
};
export const createPayrollDraftInput = z
  .object({ ...supplied, employeeId: z.uuid(), period })
  .strict();
export const revisePayrollDraftInput = z
  .object({ ...supplied, expectedVersion: z.number().int().positive() })
  .strict();
export class CreatePayrollDraftDto extends requestDto(
  createPayrollDraftInput,
  'Enter the employee, month and all manual draft components',
) {}
export class RevisePayrollDraftDto extends requestDto(
  revisePayrollDraftInput,
  'Review manual components and the current draft version',
) {}
export class PayrollDraftParamsDto extends requestDto(
  z.object({ id: z.uuid() }).strict(),
  'Invalid payroll draft identifier',
) {}
export class PayrollDraftListDto extends requestDto(
  z
    .object({
      period: period.optional(),
      search: z.string().trim().max(200).default(''),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    })
    .strict(),
  'Invalid payroll draft filters',
) {}
export class PayrollDraftRevisionQueryDto extends requestDto(
  z.object({ page: z.coerce.number().int().min(1).max(100000).default(1) }).strict(),
  'Invalid payroll draft history page',
) {}
export const payrollDraftResponse = z.object({
  id: z.uuid(),
  revisionId: z.uuid(),
  employeeId: z.uuid(),
  period: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  payDate: z.string(),
  countryCode: z.literal('IN'),
  currency: z.literal('INR'),
  status: z.literal('DRAFT'),
  version: z.number().int().positive(),
  employee: z.object({ id: z.uuid(), code: z.string(), name: z.string(), email: z.string() }),
  earnings: payrollEarningsResponse,
  deductions: payrollDeductionsResponse,
  reason: z.string(),
  updatedByName: z.string(),
  updatedAt: timestampText,
  replayed: z.boolean(),
});
export const payrollDraftPageResponse = z.object({
  items: z.array(payrollDraftResponse),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type PayrollDraftResponse = z.output<typeof payrollDraftResponse>;
