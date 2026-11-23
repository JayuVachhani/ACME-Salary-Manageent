import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Decimal } from 'decimal.js';
import { Pool, type PoolClient } from 'pg';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { withTransaction } from '../database/transaction.js';
import { dateOrdinal } from '../common/domain/money.js';
import { PayrollPoliciesService } from '../payroll-policies/payroll-policies.service.js';
import {
  payrollCalculationInput,
  type PayrollCalculationInput,
  type PayrollCalculationPreview,
} from './dto/payroll-calculation.dto.js';
const Exact = Decimal.clone({ precision: 60 });
const rounding = {
  HALF_UP: Decimal.ROUND_HALF_UP,
  FLOOR: Decimal.ROUND_FLOOR,
  CEIL: Decimal.ROUND_CEIL,
};
const keys = ['basic', 'hra', 'allowances', 'bonuses', 'incentives', 'overtime'] as const;
type Components = Record<(typeof keys)[number], string>;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const day = (ordinal: number) => new Date(ordinal * 86400000).toISOString().slice(0, 10);
@Injectable()
export class PayrollCalculationsService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(PayrollPoliciesService) private readonly policies: PayrollPoliciesService,
  ) {}
  preview(token: string, csrf: string, input: PayrollCalculationInput) {
    const q = payrollCalculationInput.parse(input);
    return withTransaction(this.pool, async (client) => {
      const actor = await this.auth.authenticateWithin(client, token, csrf);
      if (!actor) throw new ApplicationError('Sign in required', 401);
      if (!actor.isHrManager)
        throw new ApplicationError('HR manager access required for payroll previews', 403);
      return this.calculateWithin(client, q);
    });
  }
  async calculateWithin(
    client: PoolClient,
    input: PayrollCalculationInput,
  ): Promise<PayrollCalculationPreview> {
    const q = payrollCalculationInput.parse(input);
    const policy = await this.policies.snapshotWithin(client, q.period, q.policyId);
    const config = policy.config;
    const employee = (
      await client.query<{ id: string; version: number; joiningDate: string }>(
        'SELECT id,version,joining_date::text "joiningDate" FROM employees WHERE id=$1 AND removed_at IS NULL FOR UPDATE',
        [q.employeeId],
      )
    ).rows[0];
    if (!employee) throw new ApplicationError('Employee unavailable', 404);
    const draft = (
      await client.query<{
        id: string;
        version: number;
        revisionId: string;
        earnings: Components;
        deductions: { unpaidLeave: string; authorized: string };
        country_code: string;
        currency: string;
        employee_id: string;
        period: string;
      }>(
        `SELECT d.id,d.version,r.id "revisionId",r.earnings,r.deductions,d.country_code,d.currency,d.employee_id,to_char(d.period_month,'YYYY-MM') period FROM payroll_drafts d JOIN payroll_draft_revisions r ON r.draft_id=d.id AND r.version=d.version WHERE d.id=$1 FOR SHARE OF d`,
        [q.manualDraftId],
      )
    ).rows[0];
    if (
      !draft ||
      draft.employee_id !== employee.id ||
      draft.period !== q.period ||
      draft.version !== q.expectedDraftVersion
    )
      throw new ApplicationError(
        'Select the current manual draft for this employee and month',
        409,
      );
    if (draft.currency !== 'INR' || draft.country_code !== 'IN')
      throw new ApplicationError('Only explicitly configured India/INR payroll is supported', 409);
    const start = dateOrdinal(q.period + '-01');
    const next = new Date(q.period + '-01T00:00:00Z');
    next.setUTCMonth(next.getUTCMonth() + 1);
    const end = next.getTime() / 86400000 - 1;
    const calendarDays = end - start + 1;
    const joined = dateOrdinal(employee.joiningDate);
    const leaving = q.leavingDate === null ? end : dateOrdinal(q.leavingDate);
    if (q.leavingDate !== null && leaving < joined)
      throw new ApplicationError('Leaving date cannot precede joining date', 400);
    const first = Math.max(start, joined),
      last = Math.min(end, leaving);
    if (first > last)
      throw new ApplicationError('The employee has no employment days in this month', 409);
    const unpaid = new Set(q.unpaidDates.map(dateOrdinal));
    for (const date of unpaid)
      if (date < first || date > last)
        throw new ApplicationError(
          'Unpaid dates must be unique dates inside this month’s employment period',
          400,
        );
    const ledger = (
      await client.query<{
        id: string;
        effectiveFrom: string;
        amount: string;
        currency: string;
        correctsId: string | null;
      }>(
        `SELECT s.id,s.effective_from::text "effectiveFrom",s.monthly_amount::text amount,s.currency,s.corrects_id "correctsId" FROM salary_records s WHERE s.employee_id=$1 AND s.effective_from<=$2 AND NOT EXISTS(SELECT 1 FROM salary_records replacement WHERE replacement.corrects_id=s.id) ORDER BY s.effective_from,s.created_at,s.id`,
        [employee.id, day(end)],
      )
    ).rows;
    const active = (ordinal: number) =>
      ledger.filter((row) => dateOrdinal(row.effectiveFrom) <= ordinal).at(-1);
    const segments: PayrollCalculationPreview['segments'] = [];
    const used = new Map<string, (typeof ledger)[number]>();
    let basic = new Exact(0);
    let paidDays = 0;
    for (let current = first; current <= last; current++) {
      const row = active(current);
      if (!row)
        throw new ApplicationError(
          'Approved salary coverage is missing for part of the month; resolve the ledger gap before payroll',
          409,
        );
      if (row.currency !== 'INR')
        throw new ApplicationError(
          'Every consumed salary segment must be INR; automatic FX is not configured for payroll',
          409,
        );
      used.set(row.id, row);
      const paid = !unpaid.has(current);
      if (paid) paidDays++;
      const prior = segments.at(-1);
      if (prior && prior.salaryRecordId === row.id) {
        prior.to = day(current);
        prior.calendarDays++;
        if (paid) prior.paidDays++;
      } else
        segments.push({
          from: day(current),
          to: day(current),
          calendarDays: 1,
          paidDays: paid ? 1 : 0,
          salaryRecordId: row.id,
          monthlyAmount: row.amount,
          currency: 'INR',
          correctsId: row.correctsId,
        });
      if (paid || config.unpaidLeaveTreatment === 'MANUAL_DEDUCTION')
        basic = basic.plus(
          new Exact(config.basicSource === 'LEDGER' ? row.amount : draft.earnings.basic).div(
            calendarDays,
          ),
        );
    }
    const roundingMode = rounding[config.roundingMode];
    const text = (value: Decimal) => value.toDecimalPlaces(2, roundingMode).toFixed(2);
    const monthly = { ...draft.earnings };
    const needsMonthlyLedger =
      config.basicSource === 'LEDGER' &&
      (config.proration.basic === 'FULL_MONTH' ||
        [config.pf, config.esi].some(
          (rule, index) =>
            rule.enabled &&
            (index === 0 ? q.pfEligible : q.esiEligible) &&
            rule.eligibilityCeiling !== null &&
            rule.eligibilityCeilingBasis === 'FULL_MONTH_BASE',
        ));
    if (needsMonthlyLedger) {
      const monthlyRow = active(config.fullMonthLedgerRateDate === 'PERIOD_END' ? end : last);
      if (!monthlyRow || monthlyRow.currency !== 'INR')
        throw new ApplicationError(
          'The configured full-month wage basis requires an INR salary at its selected date',
          409,
        );
      used.set(monthlyRow.id, monthlyRow);
      monthly.basic = monthlyRow.amount;
    }
    const prorationDays =
      config.unpaidLeaveTreatment === 'MANUAL_DEDUCTION' ? last - first + 1 : paidDays;
    const earnings = {} as Components;
    for (const key of keys)
      earnings[key] = text(
        config.proration[key] === 'FULL_MONTH'
          ? new Exact(monthly[key])
          : key === 'basic'
            ? basic
            : new Exact(monthly[key]).times(prorationDays).div(calendarDays),
      );
    const gross = keys.reduce((sum, key) => sum.plus(earnings[key]), new Exact(0));
    const base = (choice: 'BASIC' | 'BASIC_HRA' | 'GROSS', values: Components) =>
      choice === 'BASIC'
        ? new Exact(values.basic)
        : choice === 'BASIC_HRA'
          ? new Exact(values.basic).plus(values.hra)
          : keys.reduce((sum, key) => sum.plus(values[key]), new Exact(0));
    const contribution = (rule: typeof config.pf, eligible: boolean, label: string) => {
      if (!rule.enabled) {
        if (eligible)
          throw new ApplicationError(
            `${label} eligibility was marked true but its policy is disabled`,
            409,
          );
        return { employee: '0.00', employer: '0.00' };
      }
      if (!eligible) return { employee: '0.00', employer: '0.00' };
      let wage = base(rule.base, earnings);
      if (rule.eligibilityCeiling !== null) {
        const eligibilityBase =
          rule.eligibilityCeilingBasis === 'FULL_MONTH_BASE' ? base(rule.base, monthly) : wage;
        if (eligibilityBase.greaterThan(rule.eligibilityCeiling))
          throw new ApplicationError(
            `${label} eligibility conflicts with the approved ceiling; review the supplied flag or policy`,
            409,
          );
      }
      if (rule.wageCap !== null) {
        const cap = new Exact(rule.wageCap).times(
          rule.capProration === 'CALENDAR_PAID_DAYS' ? new Exact(paidDays).div(calendarDays) : 1,
        );
        wage = Exact.min(wage, cap);
      }
      return {
        employee: text(wage.times(rule.employeePercent).div(100)),
        employer: text(wage.times(rule.employerPercent).div(100)),
      };
    };
    const pf = contribution(config.pf, q.pfEligible, 'PF'),
      esi = contribution(config.esi, q.esiEligible, 'ESI');
    let professionalTax: string;
    if (config.professionalTax.mode === 'DISABLED') {
      if (!new Exact(q.ptAmount).isZero())
        throw new ApplicationError(
          'Professional tax is disabled; the manual PT input must be zero',
          400,
        );
      professionalTax = '0.00';
    } else if (config.professionalTax.mode === 'MANUAL_INPUT')
      professionalTax = text(new Exact(q.ptAmount));
    else {
      if (!new Exact(q.ptAmount).isZero())
        throw new ApplicationError(
          'State-based professional tax cannot also include manual PT',
          400,
        );
      const rule = config.professionalTax.rules.find((row) => row.stateCode === q.stateCode);
      if (!rule)
        throw new ApplicationError(
          'No approved professional-tax rule exists for the supplied state',
          409,
        );
      professionalTax = text(
        new Exact(rule.amount).times(
          rule.proration === 'CALENDAR_DAYS' ? new Exact(paidDays).div(calendarDays) : 1,
        ),
      );
    }
    if (config.tdsMode === 'DISABLED' && !new Exact(q.tdsAmount).isZero())
      throw new ApplicationError('TDS is disabled; the manual TDS input must be zero', 400);
    if (
      config.unpaidLeaveTreatment === 'PRORATE_EARNINGS' &&
      !new Exact(draft.deductions.unpaidLeave).isZero()
    )
      throw new ApplicationError(
        'Unpaid dates already reduce earnings; clear the manual unpaid-leave deduction to avoid double deduction',
        409,
      );
    const deductions = {
      pf: pf.employee,
      esi: esi.employee,
      professionalTax,
      tds: config.tdsMode === 'DISABLED' ? '0.00' : text(new Exact(q.tdsAmount)),
      unpaidLeave:
        config.unpaidLeaveTreatment === 'MANUAL_DEDUCTION'
          ? text(new Exact(draft.deductions.unpaidLeave))
          : '0.00',
      authorized: text(new Exact(draft.deductions.authorized)),
    };
    const deductionTotal = Object.values(deductions).reduce(
      (sum, value) => sum.plus(value),
      new Exact(0),
    );
    const net = gross.minus(deductionTotal);
    if (net.isNegative())
      throw new ApplicationError(
        'Deductions exceed gross pay. Negative net pay is not configured.',
        409,
      );
    const inputs = { ...q, unpaidDates: [...q.unpaidDates].sort() };
    const sourceHash = hash({ employee, policy, draft, ledger: [...used.values()], inputs });
    const result = {
      employeeId: employee.id,
      period: q.period,
      currency: 'INR' as const,
      policyId: policy.policyId,
      policyVersion: policy.version,
      policyHash: policy.policyHash,
      manualDraftId: draft.id,
      manualDraftVersion: draft.version,
      employeeVersion: employee.version,
      inputs,
      periodStart: day(start),
      periodEnd: day(end),
      calendarDays,
      employmentDays: last - first + 1,
      paidDays,
      prorationDays,
      segments,
      earnings,
      deductions,
      employerContributions: { pf: pf.employer, esi: esi.employer },
      gross: text(gross),
      deductionTotal: text(deductionTotal),
      net: text(net),
      sourceHash,
      warnings: [
        'Preview only. No payroll finalization, payment, or salary-ledger mutation occurs.',
        'Manual PF, ESI, PT and TDS draft fields are replaced by this approved policy and explicit tax inputs.',
        config.unpaidLeaveTreatment === 'PRORATE_EARNINGS'
          ? 'Unpaid dates prorate earnings. The manual unpaid-leave deduction is not charged again.'
          : 'The manual unpaid-leave deduction is used. Unpaid dates do not also reduce earnings.',
      ],
    };
    return { ...result, previewHash: hash(result) };
  }
}
