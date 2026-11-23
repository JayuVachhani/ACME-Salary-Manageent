import { payrollPolicyConfig } from '../../payroll-policies/dto/payroll-policy.dto.js';
import {
  payrollCalculationInput,
  payrollCalculationResponse,
} from '../../payroll-calculations/dto/payroll-calculation.dto.js';
import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
import { timestampText } from '../../common/dto/response-values.js';
export const runStates = [
  'DRAFT',
  'HR_REVIEWED',
  'FINANCE_APPROVED',
  'DIRECTOR_APPROVED',
  'FINALIZED',
] as const;
export const runActions = [
  'HR_REVIEW',
  'FINANCE_APPROVE',
  'DIRECTOR_APPROVE',
  'FINALIZE',
  'REJECT',
] as const;
const period = z.string().regex(/^(?!9999)[2-9]\d{3}-(0[1-9]|1[0-2])$/);
const command = {
  commandId: z.uuid(),
  reason: z.string().trim().min(1).max(1000),
  confirmed: z.literal(true),
};
export const calculationInput = payrollCalculationInput.omit({ period: true, policyId: true });
export const createRunInput = z
  .object({
    ...command,
    period,
    policyId: z.uuid().optional(),
    calculations: z.array(calculationInput).min(1).max(100),
    hrReviewerId: z.uuid(),
    financeApproverId: z.uuid(),
    directorApproverId: z.uuid().nullable(),
  })
  .strict()
  .refine(
    (q) => new Set(q.calculations.map((line) => line.employeeId)).size === q.calculations.length,
    'Duplicate employee identifiers',
  );
export const refreshRunInput = z
  .object({ ...command, expectedVersion: z.number().int().positive() })
  .strict();
export const runActionInput = z
  .object({ ...command, expectedVersion: z.number().int().positive(), action: z.enum(runActions) })
  .strict();
export class CreateRunDto extends requestDto(
  createRunInput,
  'Choose the month, manual drafts and independent HR reviewer',
) {}
export class RefreshRunDto extends requestDto(
  refreshRunInput,
  'Review the current run version before refreshing',
) {}
export class RunActionDto extends requestDto(
  runActionInput,
  'Confirm the action, reason and current run version',
) {}
export class RunParamsDto extends requestDto(
  z.object({ id: z.uuid() }).strict(),
  'Invalid payroll run',
) {}
export class RunQueryDto extends requestDto(
  z
    .object({
      period: period.optional(),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    })
    .strict(),
  'Invalid payroll run filters',
) {}
export const runSummary = z.object({
  id: z.uuid(),
  period: z.string(),
  status: z.enum(runStates),
  version: z.number().int(),
  generation: z.number().int(),
  employeeCount: z.number().int(),
  hrReviewerId: z.uuid(),
  financeApproverId: z.uuid(),
  directorApproverId: z.uuid().nullable(),
  requiresDirector: z.boolean(),
  createdBy: z.uuid(),
  createdAt: timestampText,
  finalizedAt: timestampText.nullable(),
});
const policySnapshot = z.object({
  policyId: z.uuid(),
  version: z.number().int(),
  policyHash: z.string(),
  config: payrollPolicyConfig,
  financeApproverIds: z.array(z.uuid()),
  directorApproverIds: z.array(z.uuid()),
  requiresDirector: z.boolean(),
  finalizerRole: z.enum(['HR', 'FINANCE']),
  createdBy: z.uuid(),
  approvedBy: z.uuid(),
});
const runLineSnapshot = z.object({
  employee: z.object({ id: z.uuid(), code: z.string(), name: z.string(), email: z.string() }),
  period: z.string(),
  currency: z.literal('INR'),
  countryCode: z.literal('IN'),
  earnings: payrollCalculationResponse.shape.earnings,
  deductions: payrollCalculationResponse.shape.deductions,
  gross: z.string(),
  deductionTotal: z.string(),
  net: z.string(),
  source: z.object({ draftId: z.uuid(), revisionId: z.uuid(), version: z.number().int() }),
  policy: policySnapshot,
  periodStart: z.string(),
  periodEnd: z.string(),
  payDate: z.string(),
  calculation: payrollCalculationResponse,
  input: calculationInput,
});
export const runDetail = runSummary.extend({
  policy: policySnapshot,
  sourceHash: z.string(),
  linesPage: z.number().int(),
  linesTotal: z.number().int(),
  lines: z.array(z.object({ id: z.uuid(), employeeId: z.uuid(), snapshot: runLineSnapshot })),
  events: z.array(
    z.object({
      id: z.uuid(),
      action: z.string(),
      fromStatus: z.string().nullable(),
      toStatus: z.string(),
      actorId: z.uuid(),
      actorName: z.string(),
      reason: z.string(),
      version: z.number().int(),
      createdAt: timestampText,
    }),
  ),
  stale: z.boolean(),
  blockedReason: z.string().nullable(),
  availableActions: z.array(z.enum(runActions)),
  replayed: z.boolean(),
});
export const runPage = z.object({
  items: z.array(runSummary),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type RunAction = z.output<typeof runActionInput>;

export class RunSetupQueryDto extends requestDto(
  z.object({ period, policyId: z.uuid().optional() }).strict(),
  'Choose a payroll month',
) {}
export const runSetupResponse = z.object({
  policy: policySnapshot,
  candidates: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      employeeCode: z.string(),
      isHrManager: z.boolean(),
    }),
  ),
});
