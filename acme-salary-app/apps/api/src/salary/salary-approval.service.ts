import { withTransaction } from '../database/transaction.js';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, FX_STALE_DAYS } from '../config/config.module.js';
import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { businessDate, dateOrdinal, resolveFx, validateSalary, type FxRate, type RoundingMode } from '../common/domain/money.js';
export class SalaryApprovalError extends Error {
}
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
  @Inject(FX_STALE_DAYS) private readonly maxStaleDays = 7) { }
  private transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    return withTransaction(this.pool, work);
  }
  // actorId is resolved by the future session guard, never accepted from a request body.
  async submit(actorId: string, input: BackdatedRequestInput): Promise<string> {
    const today = businessDate(this.now());
    if (dateOrdinal(input.effectiveFrom) >= dateOrdinal(today))
      throw new SalaryApprovalError('BACKDATED_DATE_REQUIRED');
    if (!input.reason.trim())
      throw new SalaryApprovalError('REASON_REQUIRED');
    return this.transaction(async (client) => {
      const employee = (await client.query<{
        version: number;
        joining_date: string;
      }>('SELECT version,joining_date::text FROM employees WHERE id=$1 AND removed_at IS NULL FOR UPDATE', [input.employeeId])).rows[0];
      if (!employee || input.effectiveFrom < employee.joining_date)
        throw new SalaryApprovalError('INVALID_EMPLOYEE_OR_DATE');
      if (employee.version !== input.expectedVersion)
        throw new SalaryApprovalError('STALE_EMPLOYEE');
      const country = (await client.query<{
        country_code: string;
        default_currency: string;
        version: number;
        decimal_places: number;
        rounding_mode: RoundingMode;
      }>(`SELECT a.country_code,c.default_currency,c.version,c.decimal_places,c.rounding_mode
    FROM employee_assignments a JOIN country_rules c USING(country_code)
    WHERE a.employee_id=$1 AND a.effective_from<=$2 ORDER BY a.effective_from DESC LIMIT 1`, [input.employeeId, input.effectiveFrom])).rows[0];
      if (!country)
        throw new SalaryApprovalError('ASSIGNMENT_REQUIRED');
      const amount = validateSalary(input.amount, country.decimal_places);
      if (!(await client.query('SELECT 1 FROM currencies WHERE code=$1 AND is_active', [input.currency])).rowCount)
        throw new SalaryApprovalError('INVALID_CURRENCY');
      if (input.correctsId) {
        if (!(await client.query(`SELECT 1 FROM salary_records s WHERE id=$1 AND employee_id=$2 AND effective_from=$3
     AND NOT EXISTS(SELECT 1 FROM salary_records c WHERE c.corrects_id=s.id)`, [input.correctsId, input.employeeId, input.effectiveFrom])).rowCount) {
          throw new SalaryApprovalError('INVALID_CORRECTION');
        }
      }
      else if ((await client.query('SELECT 1 FROM salary_records WHERE employee_id=$1 AND effective_from=$2', [input.employeeId, input.effectiveFrom])).rowCount) {
        throw new SalaryApprovalError('EFFECTIVE_DATE_OCCUPIED');
      }
      const rates = (await client.query<FxRate>(`SELECT id,base_currency AS base,quote_currency AS quote,
    effective_date::text AS "effectiveDate",revision,rate::text,source FROM fx_rate_revisions
    WHERE effective_date <= $1 AND effective_date >= $1::date-$2::int`, [input.effectiveFrom, this.maxStaleDays])).rows;
      const legs = resolveFx(rates, input.currency, country.default_currency, input.effectiveFrom, this.maxStaleDays);
      const conversion = legs.length ? { rateDate: input.effectiveFrom, path: legs } : {};
      const id = randomUUID();
      await client.query(`INSERT INTO salary_change_requests(id,employee_id,requested_by,submitted_business_date,effective_from,
    expected_employee_version,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,
    rounding_mode,corrects_id,reason,conversion_meta) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [id, input.employeeId, actorId, today, input.effectiveFrom, input.expectedVersion, amount, input.currency, country.country_code,
        country.default_currency, country.version, country.decimal_places, country.rounding_mode, input.correctsId ?? null, input.reason.trim(), conversion]);
      return id;
    });
  }
  async decide(actorId: string, requestId: string, decision: 'APPROVED' | 'REJECTED', comment: string): Promise<string | null> {
    if (!['APPROVED', 'REJECTED'].includes(decision))
      throw new SalaryApprovalError('INVALID_DECISION');
    if (!comment.trim())
      throw new SalaryApprovalError('COMMENT_REQUIRED');
    return this.transaction(async (client) => {
      const request = (await client.query<{
        employee_id: string;
        country_code: string;
        country_rule_version: number;
        currency: string;
      }>('SELECT employee_id,country_code,country_rule_version,currency FROM salary_change_requests WHERE id=$1', [requestId])).rows[0];
      if (!request)
        throw new SalaryApprovalError('REQUEST_UNAVAILABLE');
      await client.query('SELECT id FROM employees WHERE id=$1 FOR UPDATE', [request.employee_id]);
      if (decision === 'APPROVED') {
        const country = (await client.query<{
          version: number;
        }>('SELECT version FROM country_rules WHERE country_code=$1 FOR SHARE', [request.country_code])).rows[0];
        if (country?.version !== request.country_rule_version)
          throw new SalaryApprovalError('STALE_COUNTRY_POLICY');
        // Hold a shared row lock until commit so deactivation cannot race this decision.
        if (!(await client.query('SELECT 1 FROM currencies WHERE code=$1 AND is_active FOR SHARE', [request.currency])).rowCount) {
          throw new SalaryApprovalError('INVALID_CURRENCY');
        }
      }
      await client.query('INSERT INTO salary_approval_decisions(request_id,decision,decided_by,comment) VALUES($1,$2,$3,$4)', [requestId, decision, actorId, comment.trim()]);
      if (decision === 'REJECTED')
        return null;
      const salaryId = randomUUID();
      await client.query(`INSERT INTO salary_records(id,employee_id,corrects_id,approval_request_id,monthly_amount,currency,
    country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,
    approval_status,change_reason,conversion_meta,created_by)
    SELECT $1,employee_id,corrects_id,id,monthly_amount,currency,country_code,default_currency,country_rule_version,
     decimal_places,rounding_mode,effective_from,submitted_business_date,'ACTIVE',reason,conversion_meta,requested_by
    FROM salary_change_requests WHERE id=$2`, [salaryId, requestId]);
      return salaryId;
    });
  }
}
