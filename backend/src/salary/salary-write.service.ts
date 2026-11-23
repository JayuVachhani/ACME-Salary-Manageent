import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { businessDate } from '../common/domain/money.js';
import { canChangeSalary } from '../common/domain/policy.js';
import { CLOCK, FX_STALE_DAYS } from '../config/config.module.js';
import { withTransaction } from '../database/transaction.js';
import { sqlState } from '../database/database-errors.js';
import {
  appendPreparedSalary,
  prepareSalaryWithin,
  SalaryPreparationError,
  type PreparedSalary,
} from './salary-preparation.js';
import { salaryDraftInput, salaryWriteInput } from './dto/salary-write.dto.js';

type Draft = z.output<typeof salaryDraftInput>;
type Result = {
  outcome: 'RECORDED' | 'PENDING_APPROVAL';
  salaryId: string | null;
  requestId: string | null;
  employeeVersion: number;
  replayed: boolean;
};
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
function canonicalAmount(value: string) {
  return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
function semantic(input: Draft) {
  return {
    amount: canonicalAmount(input.amount),
    currency: input.currency,
    effectiveFrom: input.effectiveFrom,
    correctsId: input.correctsId?.toLowerCase() ?? null,
    reason: input.reason,
  };
}
function normalized(input: Draft) {
  return {
    commandId: input.commandId.toLowerCase(),
    expectedVersion: input.expectedVersion,
    ...semantic(input),
  };
}
function previewOf(prepared: PreparedSalary, input: Draft) {
  const {
    businessDate,
    employeeVersion,
    amount,
    currency,
    effectiveFrom,
    correction,
    requiresApproval,
    before,
    policy,
    convertedAmount,
    conversionLegs,
  } = prepared;
  const projection = {
    businessDate,
    employeeVersion,
    amount,
    currency,
    effectiveFrom,
    correction,
    requiresApproval,
    before,
    policy,
    convertedAmount,
    conversionLegs,
  };
  return {
    ...projection,
    previewHash: digest(
      JSON.stringify({ employeeId: prepared.employeeId, input: normalized(input), ...projection }),
    ),
  };
}
@Injectable()
export class SalaryWriteService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(CLOCK) private readonly now: () => Date,
    @Inject(FX_STALE_DAYS) private readonly staleDays: number,
  ) {}
  private async run<T>(
    token: string,
    csrf: string,
    employeeId: string,
    work: (
      client: PoolClient,
      actor: { id: string; isHrManager: boolean },
      version: number,
    ) => Promise<T>,
  ) {
    try {
      return await withTransaction(this.pool, async (client) => {
        const actor = await this.auth.authenticateWithin(client, token, csrf);
        if (!actor) throw new ApplicationError('Sign in required', 401);
        const linked =
          (
            await client.query<{ employee_id: string }>(
              'SELECT employee_id FROM users WHERE id=$1',
              [actor.id],
            )
          ).rows[0]?.employee_id ?? null;
        if (
          !canChangeSalary(
            {
              id: actor.id,
              employeeId: linked,
              isHrManager: actor.isHrManager,
              permissions: actor.permissions,
              active: true,
              isSystem: false,
            },
            employeeId,
          )
        )
          throw new ApplicationError(
            'Salary changes require read, edit and salary access, a verified employee link, and a different employee',
            403,
          );
        // Lock the linked actor and salary subject in one stable order, including reciprocal edits.
        const locked = (
          await client.query<{ id: string; version: number; removed_at: Date | null }>(
            'SELECT id,version,removed_at FROM employees WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',
            [[linked, employeeId]],
          )
        ).rows;
        if (!locked.some((row) => row.id === linked && row.removed_at === null))
          throw new ApplicationError(
            'Your employee link is no longer active. Ask another HR manager to update it.',
            403,
          );
        const employee = locked.find((row) => row.id === employeeId && row.removed_at === null);
        if (!employee) throw new ApplicationError('Employee unavailable', 404);
        return work(client, actor, employee.version);
      });
    } catch (error) {
      const code = sqlState(error);
      if (code === '42501')
        throw new ApplicationError(
          'This salary change is not permitted. Backdated changes require an independent linked HR manager.',
          403,
        );
      if (['23505', '23514', '23503', '40001', '40P01'].includes(code ?? ''))
        throw new ApplicationError(
          'Salary, employee or reference data changed. Refresh and review before retrying.',
          409,
        );
      if (error instanceof SalaryPreparationError) {
        const messages: Record<string, string> = {
          INITIAL_APPROVAL_REQUIRED: 'Approve the initial salary before adding revisions.',
          STALE_EMPLOYEE: 'Employee changed. Reopen the editor and review the latest salary.',
          INVALID_EMPLOYEE_OR_DATE:
            'The employee or effective date is unavailable. Salary cannot start before joining.',
          ASSIGNMENT_REQUIRED: 'An active country assignment is required on this date.',
          INVALID_CURRENCY: 'Select an active salary currency.',
          INVALID_CORRECTION:
            'This correction is no longer the latest entry, or its effective date changed.',
          EFFECTIVE_DATE_OCCUPIED:
            'A salary already starts on this date. Select its latest entry to correct a typo.',
          PENDING_REQUEST_EXISTS: 'A salary request for this date is already waiting for approval.',
        };
        throw new ApplicationError(
          messages[error.message] ?? 'Review the salary details before continuing.',
          409,
        );
      }
      if (
        error instanceof Error &&
        [
          'INVALID_AMOUNT',
          'SALARY_MUST_BE_POSITIVE',
          'EXCESS_COUNTRY_PRECISION',
          'AMOUNT_OUT_OF_RANGE',
          'INVALID_PRECISION',
          'INVALID_DATE',
          'INVALID_ROUNDING',
        ].includes(error.message)
      )
        throw new ApplicationError(
          'Enter a positive salary with the country’s permitted precision and a valid effective date.',
          400,
        );
      if (error instanceof Error && error.message === 'FX_RATE_UNAVAILABLE')
        throw new ApplicationError(
          'An applicable exchange rate is required on or before the effective date.',
          422,
        );
      throw error;
    }
  }
  private async lease(
    client: PoolClient,
    actorId: string,
    employeeId: string,
    input: Draft,
    version: number,
  ) {
    if (input.expectedVersion !== version) throw new SalaryPreparationError('STALE_EMPLOYEE');
    if (
      !(
        await client.query(
          'SELECT 1 FROM record_locks WHERE employee_id=$1 AND locked_by=$2 AND token_hash=$3 AND expires_at>clock_timestamp()',
          [employeeId, actorId, digest(input.leaseToken)],
        )
      ).rowCount
    )
      throw new ApplicationError(
        'Edit session expired or belongs to another editor. Reopen the salary editor.',
        409,
      );
  }
  preview(token: string, csrf: string, employeeId: string, input: Draft) {
    employeeId = employeeId.toLowerCase();
    const q = salaryDraftInput.parse(input);
    return this.run(token, csrf, employeeId, async (client, actor, version) => {
      const today = businessDate(this.now());
      if (q.effectiveFrom < today && !actor.isHrManager)
        throw new ApplicationError('Only HR managers can submit backdated salary changes', 403);
      await this.lease(client, actor.id, employeeId, q, version);
      const prepared = await prepareSalaryWithin(
        client,
        { ...q, employeeId },
        today,
        this.staleDays,
      );
      return previewOf(prepared, q);
    });
  }
  submit(
    token: string,
    csrf: string,
    employeeId: string,
    input: z.output<typeof salaryWriteInput>,
  ) {
    employeeId = employeeId.toLowerCase();
    const q = salaryWriteInput.parse(input);
    const inputHash = digest(JSON.stringify({ employeeId, ...semantic(q) }));
    return this.run(token, csrf, employeeId, async (client, actor, version): Promise<Result> => {
      const prior = (
        await client.query<{
          input_hash: string;
          outcome: Result['outcome'];
          salary_id: string | null;
          request_id: string | null;
          employee_version: number;
        }>(
          'SELECT input_hash,outcome,salary_id,request_id,employee_version FROM salary_commands WHERE actor_id=$1 AND command_id=$2',
          [actor.id, q.commandId],
        )
      ).rows[0];
      if (prior) {
        if (prior.input_hash !== inputHash)
          throw new ApplicationError(
            'This submission key was used for different details. Start a new salary change.',
            409,
          );
        return {
          outcome: prior.outcome,
          salaryId: prior.salary_id,
          requestId: prior.request_id,
          employeeVersion: prior.employee_version,
          replayed: true,
        };
      }
      const today = businessDate(this.now());
      if (q.effectiveFrom < today && !actor.isHrManager)
        throw new ApplicationError('Only HR managers can submit backdated salary changes', 403);
      await this.lease(client, actor.id, employeeId, q, version);
      const prepared = await prepareSalaryWithin(
        client,
        { ...q, employeeId },
        today,
        this.staleDays,
      );
      if (previewOf(prepared, q).previewHash !== q.previewHash)
        throw new ApplicationError(
          'The date, salary, country policy or exchange rate changed after review. Request a new preview.',
          409,
        );
      const result = await appendPreparedSalary(client, actor.id, prepared);
      const employeeVersion = (
        await client.query<{ version: number }>('SELECT version FROM employees WHERE id=$1', [
          employeeId,
        ])
      ).rows[0]!.version;
      const outcome = prepared.requiresApproval ? 'PENDING_APPROVAL' : 'RECORDED';
      await client.query(
        'INSERT INTO salary_commands(actor_id,command_id,input_hash,employee_id,outcome,salary_id,request_id,employee_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          actor.id,
          q.commandId,
          inputHash,
          employeeId,
          outcome,
          result.salaryId,
          result.requestId,
          employeeVersion,
        ],
      );
      await client.query(
        'DELETE FROM record_locks WHERE employee_id=$1 AND locked_by=$2 AND token_hash=$3',
        [employeeId, actor.id, digest(q.leaseToken)],
      );
      return { outcome, ...result, employeeVersion, replayed: false };
    });
  }
}
