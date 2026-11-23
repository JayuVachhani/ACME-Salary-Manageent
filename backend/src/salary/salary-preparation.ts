import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import {
  convertExact,
  dateOrdinal,
  resolveFx,
  roundCalculated,
  validateSalary,
  type ConversionLeg,
  type FxRate,
  type RoundingMode,
} from '../common/domain/money.js';

export class SalaryPreparationError extends Error {}
export type SalaryDraft = {
  employeeId: string;
  expectedVersion: number;
  amount: string;
  currency: string;
  effectiveFrom: string;
  correctsId?: string;
  reason: string;
};
export type SalaryBefore = {
  id: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  decimalPlaces: number;
};
export type PreparedSalary = {
  employeeId: string;
  employeeVersion: number;
  businessDate: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  correctsId: string | null;
  reason: string;
  requiresApproval: boolean;
  correction: boolean;
  before: SalaryBefore | null;
  policy: {
    countryCode: string;
    countryName: string;
    defaultCurrency: string;
    decimalPlaces: number;
    roundingMode: RoundingMode;
    version: number;
  };
  convertedAmount: string;
  conversionLegs: {
    rateId: string;
    base: string;
    quote: string;
    rate: string;
    effectiveDate: string;
    revision: number;
    inverse: boolean;
    source: string;
  }[];
  conversionMeta: { rateDate?: string; path?: ConversionLeg[] };
};

/** The caller owns the transaction. Compute once and persist this exact policy/rate snapshot. */
export async function prepareSalaryWithin(
  client: PoolClient,
  input: SalaryDraft,
  today: string,
  staleDays: number,
  checkPending = true,
): Promise<PreparedSalary> {
  dateOrdinal(input.effectiveFrom);
  if (!input.reason.trim()) throw new SalaryPreparationError('REASON_REQUIRED');
  const employee = (
    await client.query<{ version: number; joining_date: string }>(
      'SELECT version,joining_date::text FROM employees WHERE id=$1 AND removed_at IS NULL FOR UPDATE',
      [input.employeeId],
    )
  ).rows[0];
  if (!employee || input.effectiveFrom < employee.joining_date)
    throw new SalaryPreparationError('INVALID_EMPLOYEE_OR_DATE');
  if (employee.version !== input.expectedVersion)
    throw new SalaryPreparationError('STALE_EMPLOYEE');
  if (
    !(
      await client.query('SELECT id FROM salary_records WHERE employee_id=$1 LIMIT 1', [
        input.employeeId,
      ])
    ).rowCount
  )
    throw new SalaryPreparationError('INITIAL_APPROVAL_REQUIRED');
  const policy = (
    await client.query<PreparedSalary['policy']>(
      `SELECT c.country_code "countryCode",c.country_name "countryName",c.default_currency "defaultCurrency",c.decimal_places "decimalPlaces",c.rounding_mode "roundingMode",c.version
    FROM country_rules c WHERE c.country_code=(SELECT a.country_code FROM employee_assignments a WHERE a.employee_id=$1 AND a.effective_from<=$2 ORDER BY a.effective_from DESC LIMIT 1) AND c.is_active FOR SHARE`,
      [input.employeeId, input.effectiveFrom],
    )
  ).rows[0];
  if (!policy) throw new SalaryPreparationError('ASSIGNMENT_REQUIRED');
  for (const currency of [...new Set([input.currency, policy.defaultCurrency])].sort()) {
    if (
      !(
        await client.query(
          'SELECT code FROM currencies WHERE code=$1 AND is_active AND minor_units IS NOT NULL FOR SHARE',
          [currency],
        )
      ).rowCount
    )
      throw new SalaryPreparationError('INVALID_CURRENCY');
  }
  const amount = validateSalary(input.amount, policy.decimalPlaces);
  let before: SalaryBefore | null;
  if (input.correctsId) {
    before =
      (
        await client.query<SalaryBefore>(
          `SELECT s.id,s.monthly_amount::text amount,s.currency,s.effective_from::text "effectiveFrom",s.decimal_places "decimalPlaces" FROM salary_records s WHERE s.id=$1 AND s.employee_id=$2 AND s.effective_from=$3 AND NOT EXISTS(SELECT 1 FROM salary_records replacement WHERE replacement.corrects_id=s.id)`,
          [input.correctsId, input.employeeId, input.effectiveFrom],
        )
      ).rows[0] ?? null;
    if (!before) throw new SalaryPreparationError('INVALID_CORRECTION');
  } else {
    if (
      (
        await client.query(
          'SELECT id FROM salary_records WHERE employee_id=$1 AND effective_from=$2 LIMIT 1',
          [input.employeeId, input.effectiveFrom],
        )
      ).rowCount
    )
      throw new SalaryPreparationError('EFFECTIVE_DATE_OCCUPIED');
    before =
      (
        await client.query<SalaryBefore>(
          `SELECT s.id,s.monthly_amount::text amount,s.currency,s.effective_from::text "effectiveFrom",s.decimal_places "decimalPlaces" FROM salary_records s WHERE s.employee_id=$1 AND s.effective_from<=$2 AND NOT EXISTS(SELECT 1 FROM salary_records replacement WHERE replacement.corrects_id=s.id) ORDER BY s.effective_from DESC,s.created_at DESC,s.id LIMIT 1`,
          [input.employeeId, input.effectiveFrom],
        )
      ).rows[0] ?? null;
  }
  if (
    checkPending &&
    (
      await client.query(
        `SELECT r.id FROM salary_change_requests r WHERE r.employee_id=$1 AND r.effective_from=$2 AND NOT EXISTS(SELECT 1 FROM salary_approval_decisions d WHERE d.request_id=r.id) LIMIT 1`,
        [input.employeeId, input.effectiveFrom],
      )
    ).rowCount
  )
    throw new SalaryPreparationError('PENDING_REQUEST_EXISTS');
  const currencies = [...new Set([input.currency, policy.defaultCurrency, 'USD'])];
  const rates = (
    await client.query<FxRate>(
      `SELECT id,base_currency base,quote_currency quote,effective_date::text "effectiveDate",revision,rate::text,source FROM fx_rate_revisions WHERE effective_date<=$1 AND effective_date>=$1::date-$2::int AND base_currency=ANY($3::text[]) AND quote_currency=ANY($3::text[]) ORDER BY base_currency,quote_currency,effective_date,revision,id`,
      [input.effectiveFrom, staleDays, currencies],
    )
  ).rows;
  const path = resolveFx(
    rates,
    input.currency,
    policy.defaultCurrency,
    input.effectiveFrom,
    staleDays,
  );
  return {
    employeeId: input.employeeId,
    employeeVersion: employee.version,
    businessDate: today,
    amount,
    currency: input.currency,
    effectiveFrom: input.effectiveFrom,
    correctsId: input.correctsId ?? null,
    reason: input.reason.trim(),
    requiresApproval: input.effectiveFrom < today,
    correction: Boolean(input.correctsId),
    before,
    policy,
    convertedAmount: roundCalculated(
      convertExact(amount, path),
      policy.decimalPlaces,
      policy.roundingMode,
    ),
    conversionLegs: path.map((leg) => ({
      rateId: leg.rate.id,
      base: leg.rate.base,
      quote: leg.rate.quote,
      rate: leg.rate.rate,
      effectiveDate: leg.rate.effectiveDate,
      revision: leg.rate.revision,
      inverse: leg.inverse,
      source: leg.rate.source,
    })),
    conversionMeta: path.length ? { rateDate: input.effectiveFrom, path } : {},
  };
}

export async function appendPreparedSalary(
  client: PoolClient,
  actorId: string,
  prepared: PreparedSalary,
): Promise<{ salaryId: string | null; requestId: string | null }> {
  const p = prepared;
  const id = randomUUID();
  const values = [
    id,
    p.employeeId,
    actorId,
    p.businessDate,
    p.effectiveFrom,
    p.amount,
    p.currency,
    p.policy.countryCode,
    p.policy.defaultCurrency,
    p.policy.version,
    p.policy.decimalPlaces,
    p.policy.roundingMode,
    p.correctsId,
    p.reason,
    p.conversionMeta,
  ];
  if (p.requiresApproval) {
    await client.query(
      `INSERT INTO salary_change_requests(id,employee_id,requested_by,submitted_business_date,effective_from,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,corrects_id,reason,conversion_meta,expected_employee_version,request_kind) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'BACKDATED')`,
      [...values, p.employeeVersion],
    );
    return { salaryId: null, requestId: id };
  }
  await client.query(
    `INSERT INTO salary_records(id,employee_id,created_by,submitted_business_date,effective_from,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,corrects_id,change_reason,conversion_meta,approval_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'WAITING_MANAGEMENT_APPROVAL')`,
    values,
  );
  return { salaryId: id, requestId: null };
}
