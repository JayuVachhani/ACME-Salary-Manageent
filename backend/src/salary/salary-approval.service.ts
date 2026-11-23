import { withTransaction } from '../database/transaction.js';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, FX_STALE_DAYS } from '../config/config.module.js';
import { randomUUID } from 'node:crypto';
import {
  appendPreparedSalary,
  prepareSalaryWithin,
  SalaryPreparationError,
} from './salary-preparation.js';
import { Pool, type PoolClient } from 'pg';
import { businessDate, dateOrdinal } from '../common/domain/money.js';
export class SalaryApprovalError extends Error {}
export interface BackdatedRequestInput {
  employeeId: string;
  effectiveFrom: string;
  amount: string;
  currency: string;
  reason: string;
  expectedVersion: number;
  correctsId?: string;
}
@Injectable()
export class SalaryApprovalService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(CLOCK) private readonly now: () => Date = () => new Date(),
    @Inject(FX_STALE_DAYS) private readonly maxStaleDays = 7,
  ) {}
  private transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    return withTransaction(this.pool, work);
  }
  // actorId is resolved by the authenticated boundary, never accepted in a public request body.
  async submit(actorId: string, input: BackdatedRequestInput): Promise<string> {
    const today = businessDate(this.now());
    if (dateOrdinal(input.effectiveFrom) >= dateOrdinal(today))
      throw new SalaryApprovalError('BACKDATED_DATE_REQUIRED');
    if (!input.reason.trim()) throw new SalaryApprovalError('REASON_REQUIRED');
    try {
      return await this.transaction(async (client) => {
        const prepared = await prepareSalaryWithin(client, input, today, this.maxStaleDays, false);
        const result = await appendPreparedSalary(client, actorId, prepared);
        return result.requestId!;
      });
    } catch (error) {
      if (error instanceof SalaryPreparationError) throw new SalaryApprovalError(error.message);
      throw error;
    }
  }
  async decide(
    actorId: string,
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    comment: string,
  ): Promise<string | null> {
    return this.transaction((client) =>
      this.decideWithin(client, actorId, requestId, decision, comment),
    );
  }
  async decideWithin(
    client: PoolClient,
    actorId: string,
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    comment: string,
  ): Promise<string | null> {
    if (!['APPROVED', 'REJECTED'].includes(decision))
      throw new SalaryApprovalError('INVALID_DECISION');
    if (!comment.trim()) throw new SalaryApprovalError('COMMENT_REQUIRED');
    const request = (
      await client.query<{
        employee_id: string;
        country_code: string;
        country_rule_version: number;
        currency: string;
      }>(
        'SELECT employee_id,country_code,country_rule_version,currency FROM salary_change_requests WHERE id=$1',
        [requestId],
      )
    ).rows[0];
    if (!request) throw new SalaryApprovalError('REQUEST_UNAVAILABLE');
    const linked = (
      await client.query<{ employee_id: string | null }>(
        'SELECT employee_id FROM users WHERE id=$1',
        [actorId],
      )
    ).rows[0]?.employee_id;
    await client.query('SELECT id FROM employees WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
      [request.employee_id, ...(linked ? [linked] : [])],
    ]);
    if (decision === 'APPROVED') {
      const country = (
        await client.query<{
          version: number;
        }>('SELECT version FROM country_rules WHERE country_code=$1 FOR SHARE', [
          request.country_code,
        ])
      ).rows[0];
      if (country?.version !== request.country_rule_version)
        throw new SalaryApprovalError('STALE_COUNTRY_POLICY');
      // Hold a shared row lock until commit so deactivation cannot race this decision.
      if (
        !(
          await client.query('SELECT 1 FROM currencies WHERE code=$1 AND is_active FOR SHARE', [
            request.currency,
          ])
        ).rowCount
      ) {
        throw new SalaryApprovalError('INVALID_CURRENCY');
      }
    }
    await client.query(
      'INSERT INTO salary_approval_decisions(request_id,decision,decided_by,comment) VALUES($1,$2,$3,$4)',
      [requestId, decision, actorId, comment.trim()],
    );
    if (decision === 'REJECTED') return null;
    const salaryId = randomUUID();
    await client.query(
      `INSERT INTO salary_records(id,employee_id,corrects_id,approval_request_id,monthly_amount,currency,
    country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,
    approval_status,change_reason,conversion_meta,created_by)
    SELECT $1,employee_id,corrects_id,id,monthly_amount,currency,country_code,default_currency,country_rule_version,
     decimal_places,rounding_mode,effective_from,submitted_business_date,'ACTIVE',reason,conversion_meta,requested_by
    FROM salary_change_requests WHERE id=$2`,
      [salaryId, requestId],
    );
    return salaryId;
  }
}
