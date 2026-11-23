import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
import { timestampText } from '../../common/dto/response-values.js';

const money = z.string().regex(/^(0|[1-9]\d*)(\.\d{1,4})?$/);
const components = z.record(z.string(), money);
export const finalizedLineSnapshot = z.object({
  employee: z.object({ id: z.uuid(), code: z.string(), name: z.string(), email: z.string() }),
  period: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  payDate: z.string(),
  countryCode: z.literal('IN'),
  currency: z.literal('INR'),
  earnings: components,
  deductions: components,
  gross: money,
  deductionTotal: money,
  net: money,
  source: z.object({
    draftId: z.uuid(),
    revisionId: z.uuid(),
    version: z.number().int().positive(),
  }),
  calculation: z.object({
    employeeId: z.uuid(),
    period: z.string(),
    currency: z.literal('INR'),
    policyId: z.uuid(),
    policyVersion: z.number().int().positive(),
    policyHash: z.string(),
    calendarDays: z.number().int().nonnegative(),
    employmentDays: z.number().int().nonnegative(),
    paidDays: z.number().int().nonnegative(),
    prorationDays: z.number().int().nonnegative().optional(),
    gross: money,
    deductionTotal: money,
    net: money,
    employerContributions: z.object({ pf: money, esi: money }),
    segments: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        calendarDays: z.number().int().nonnegative(),
        paidDays: z.number().int().nonnegative(),
        salaryRecordId: z.uuid().nullable(),
        monthlyAmount: money,
        currency: z.literal('INR'),
        correctsId: z.uuid().nullable(),
      }),
    ),
    inputs: z.object({
      pfEligible: z.boolean(),
      esiEligible: z.boolean(),
      stateCode: z.string(),
      ptAmount: money,
      tdsAmount: money,
      leavingDate: z.string().nullable(),
      unpaidDates: z.array(z.string()),
    }),
    warnings: z.array(z.string()),
    sourceHash: z.string(),
    previewHash: z.string(),
  }),
});
export type FinalizedLineSnapshot = z.output<typeof finalizedLineSnapshot>;
export const manifestEntry = z.object({
  employeeId: z.uuid(),
  employeeCode: z.string(),
  currency: z.literal('INR'),
  netAmount: money,
});
export type ManifestEntry = z.output<typeof manifestEntry>;
export const deliveryRun = z.object({
  id: z.uuid(),
  period: z.string(),
  version: z.number().int().positive(),
  generation: z.number().int().positive(),
  status: z.literal('FINALIZED'),
  finalizedAt: timestampText,
  sourceHash: z.string(),
  financeApproverName: z.string().nullable(),
  employeeCount: z.number().int().nonnegative(),
  canExport: z.boolean(),
  canPrepare: z.boolean(),
  canReportExternalPayment: z.boolean(),
  paymentUnavailableReason: z.string().nullable(),
});
export type DeliveryRun = z.output<typeof deliveryRun>;
export const finalizedPayslip = z.object({
  run: deliveryRun,
  snapshot: finalizedLineSnapshot,
  status: z.literal('FINALIZED'),
});
export const externalPayment = z.object({
  id: z.uuid(),
  externalReference: z.string(),
  paymentDate: z.string(),
  reportedByName: z.string(),
  reportedAt: timestampText,
  status: z.literal('EXTERNALLY_REPORTED_PAID'),
  reason: z.string(),
});
export const paymentPreparation = z.object({
  id: z.uuid(),
  runId: z.uuid(),
  runVersion: z.number().int().positive(),
  generation: z.number().int().positive(),
  period: z.string(),
  currency: z.literal('INR'),
  manifestCount: z.number().int().nonnegative(),
  manifestHash: z.string(),
  sourceHash: z.string(),
  preparedByName: z.string(),
  preparedAt: timestampText,
  status: z.enum(['PREPARED', 'EXTERNALLY_REPORTED_PAID']),
  externalPayment: externalPayment.nullable(),
  replayed: z.boolean(),
  reason: z.string(),
});
export const documentResponse = z.object({
  filename: z.string(),
  mimeType: z.enum(['text/html', 'text/csv']),
  content: z.string(),
  contentHash: z.string(),
  replayed: z.boolean(),
});
const page = { page: z.coerce.number().int().min(1).max(100000).default(1) };
export class DeliveryListDto extends requestDto(
  z
    .object({
      ...page,
      period: z
        .string()
        .regex(/^(?!9999)[2-9]\d{3}-(0[1-9]|1[0-2])$/)
        .optional(),
    })
    .strict(),
  'Select a valid finalized payroll month and page',
) {}
export class DeliveryPageDto extends requestDto(
  z.object(page).strict(),
  'Invalid payroll delivery page',
) {}
export class DeliveryRunParamsDto extends requestDto(
  z.object({ id: z.uuid() }).strict(),
  'Invalid finalized payroll run',
) {}
export class DeliveryPayslipParamsDto extends requestDto(
  z.object({ id: z.uuid(), employeeId: z.uuid() }).strict(),
  'Invalid finalized payslip',
) {}
export const deliveryCommandInput = z
  .object({ commandId: z.uuid(), confirmed: z.literal(true) })
  .strict();
export class DeliveryCommandDto extends requestDto(
  deliveryCommandInput,
  'Confirm the payroll document or preparation request',
) {}
export const preparationInput = deliveryCommandInput
  .extend({ reason: z.string().trim().min(1).max(1000) })
  .strict();
export class PreparationDto extends requestDto(
  preparationInput,
  'Enter a preparation reason and confirm the complete manifest',
) {}
export const externalPaymentInput = deliveryCommandInput
  .extend({
    externalReference: z.string().trim().min(1).max(200),
    paymentDate: z.iso
      .date()
      .refine((value) => !value.startsWith('0000-'), 'Use a supported calendar year'),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();
export class ExternalPaymentDto extends requestDto(
  externalPaymentInput,
  'Enter the externally reported payment reference and date, then confirm',
) {}
export const deliveryRunPage = z.object({
  items: z.array(deliveryRun),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const deliveryPayslipPage = z.object({
  items: z.array(finalizedPayslip),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const preparationPage = z.object({
  items: z.array(paymentPreparation),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const manifestPage = z.object({
  items: z.array(manifestEntry),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
