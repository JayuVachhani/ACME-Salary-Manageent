import { createHash, randomUUID } from 'node:crypto';
import { approvedInitialFixture, linkFixtureActor } from './salary-fixtures.mjs';

export const manualPayrollComponents = () => ({
  earnings: {
    basic: '1.00',
    hra: '6000.00',
    allowances: '3000.00',
    bonuses: '1000.00',
    incentives: '0.00',
    overtime: '0.00',
  },
  deductions: {
    pf: '9999.00',
    esi: '9999.00',
    professionalTax: '999.00',
    tds: '999.00',
    unpaidLeave: '0.00',
    authorized: '100.00',
  },
});

export function payrollFixturePolicyConfig(
  ids,
  { statutory = true, requiresDirector = true } = {},
) {
  return {
    name: 'Synthetic explicit payroll policy',
    countryCode: 'IN',
    currency: 'INR',
    roundingMode: 'HALF_UP',
    basicSource: 'LEDGER',
    fullMonthLedgerRateDate: 'PERIOD_END',
    manualStatutoryTreatment: 'REPLACE_WITH_POLICY_AND_INPUTS',
    proration: {
      basic: 'CALENDAR_DAYS',
      hra: 'CALENDAR_DAYS',
      allowances: 'CALENDAR_DAYS',
      bonuses: 'FULL_MONTH',
      incentives: 'FULL_MONTH',
      overtime: 'FULL_MONTH',
    },
    unpaidLeaveTreatment: 'PRORATE_EARNINGS',
    employerContributionTreatment: 'EMPLOYER_ONLY_NOT_DEDUCTED',
    pf: {
      enabled: statutory,
      employeePercent: statutory ? '12' : '0',
      employerPercent: statutory ? '12' : '0',
      base: 'BASIC',
      wageCap: statutory ? '15000.00' : null,
      capProration: 'FULL_CAP',
      eligibilityCeiling: null,
      eligibilityCeilingBasis: 'FULL_MONTH_BASE',
    },
    esi: {
      enabled: statutory,
      employeePercent: statutory ? '0.75' : '0',
      employerPercent: statutory ? '3.25' : '0',
      base: 'GROSS',
      wageCap: null,
      capProration: 'FULL_CAP',
      eligibilityCeiling: statutory ? '50000.00' : null,
      eligibilityCeilingBasis: 'FULL_MONTH_BASE',
    },
    professionalTax: {
      mode: statutory ? 'STATE_RULES' : 'DISABLED',
      rules: statutory ? [{ stateCode: 'KA', amount: '200.00', proration: 'FULL_MONTH' }] : [],
    },
    tdsMode: statutory ? 'MANUAL_INPUT' : 'DISABLED',
    finalizerRole: 'HR',
    financeApproverIds: [ids.finance],
    requiresDirector,
    directorApproverIds: requiresDirector ? [ids.director] : [],
  };
}

export async function createPayrollWorkflowFixture(
  owner,
  { period = '2026-04', drafts = true, statutory = true } = {},
) {
  const ids = Object.fromEntries(
    ['hr', 'reviewer', 'finance', 'director', 'viewer', 'outsider', 'unlinked', 'editor'].map(
      (key) => [key, randomUUID()],
    ),
  );
  const emails = {};
  const actorEmployees = {};
  for (const [key, id] of Object.entries(ids)) {
    emails[key] = `${key}.payroll@acme.test`;
    const manager = ['hr', 'reviewer', 'unlinked'].includes(key);
    const permissions =
      key === 'viewer'
        ? ['read']
        : key === 'editor'
          ? ['read', 'edit', 'write', 'salary:view']
          : manager
            ? ['read']
            : ['read', 'salary:view', 'export'];
    await owner.query(
      "INSERT INTO users(id,email,full_name,status,is_hr_manager,permissions) VALUES($1,$2,$3,'ACTIVE',$4,$5)",
      [id, emails[key], `Synthetic ${key} payroll`, manager, permissions],
    );
    if (key !== 'unlinked') actorEmployees[key] = await linkFixtureActor(owner, id);
  }
  await owner.query("INSERT INTO currencies(code,minor_units) VALUES('INR',2),('USD',2)");
  await owner.query(
    "INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by) VALUES('IN','Synthetic India','INR',2,'HALF_UP',$1)",
    [ids.hr],
  );
  const department = (
    await owner.query(
      "INSERT INTO departments(name) VALUES('Synthetic Payroll Department') RETURNING id",
    )
  ).rows[0].id;
  const designation = (
    await owner.query("INSERT INTO designations(name) VALUES('Synthetic Payroll Job') RETURNING id")
  ).rows[0].id;
  const employeeIds = {};
  const employeeCodes = {
    full: 'PAY-FULL',
    partial: 'PAY-PARTIAL',
    escaped: '=CSV-ESCAPE',
    monthly: 'PAY-MONTHLY',
  };
  for (const key of Object.keys(employeeCodes)) {
    const id = randomUUID();
    employeeIds[key] = id;
    const joining = key === 'partial' ? period + '-16' : '2020-01-01';
    const firstName = key === 'escaped' ? '<script>alert("synthetic")</script>' : 'Synthetic';
    await owner.query(
      'INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [
        id,
        employeeCodes[key],
        `${key}.employee@acme.test`,
        firstName,
        `${key} payroll`,
        joining,
        ids.hr,
      ],
    );
    await owner.query(
      "INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by) VALUES($1,'IN',$2,$3,'ACTIVE',$4,'Synthetic payroll fixture',$5)",
      [id, department, designation, joining, ids.hr],
    );
    await approvedInitialFixture(owner, {
      employeeId: id,
      actorId: ids.hr,
      amount: '30000.00',
      currency: 'INR',
      effectiveFrom: joining,
      countryCode: 'IN',
    });
  }
  const fixture = {
    ids,
    emails,
    actorEmployees,
    employeeIds,
    employeeCodes,
    period,
    department,
    designation,
    drafts: {},
    policyConfig: payrollFixturePolicyConfig(ids, { statutory }),
  };
  if (drafts)
    for (const key of ['full', 'partial', 'escaped'])
      fixture.drafts[key] = await seedManualPayrollDraft(owner, fixture, key);
  return fixture;
}

export async function seedManualPayrollDraft(
  owner,
  fixture,
  key,
  components = manualPayrollComponents(),
) {
  const id = randomUUID();
  const revisionId = randomUUID();
  const employeeId = fixture.employeeIds[key];
  const snapshot = (
    await owner.query(
      "SELECT jsonb_build_object('id',id,'code',employee_code,'name',first_name||' '||last_name,'email',email::text) employee FROM employees WHERE id=$1",
      [employeeId],
    )
  ).rows[0].employee;
  await owner.query('BEGIN');
  try {
    await owner.query(
      "INSERT INTO payroll_drafts(id,employee_id,period_month,period_end,pay_date) VALUES($1,$2,($3||'-01')::date,(($3||'-01')::date+interval '1 month'-interval '1 day')::date,(($3||'-01')::date+interval '1 month'+interval '6 days')::date)",
      [id, employeeId, fixture.period],
    );
    await owner.query(
      'INSERT INTO payroll_draft_revisions(id,draft_id,version,employee_snapshot,earnings,deductions,reason,created_by) VALUES($1,$2,1,$3,$4,$5,$6,$7)',
      [
        revisionId,
        id,
        snapshot,
        components.earnings,
        components.deductions,
        'Synthetic manual draft',
        fixture.ids.hr,
      ],
    );
    await owner.query('COMMIT');
  } catch (error) {
    await owner.query('ROLLBACK');
    throw error;
  }
  return { id, revisionId, employeeId, period: fixture.period, version: 1, ...components };
}

export async function seedApprovedPayrollPolicy(
  owner,
  fixture,
  { policyKey = 'SYNTHETIC', config = fixture.policyConfig, effectiveFrom = '2026-01-01' } = {},
) {
  const id = randomUUID();
  await owner.query('BEGIN');
  try {
    await owner.query("SELECT pg_advisory_xact_lock(hashtext('acme_payroll_policy_approval'))");
    const version = (
      await owner.query(
        'SELECT coalesce(max(version),0)+1 version FROM payroll_policies WHERE policy_key=$1',
        [policyKey],
      )
    ).rows[0].version;
    const policyHash = createHash('sha256')
      .update(JSON.stringify({ id, key: policyKey, version, effectiveFrom, config }))
      .digest('hex');
    await owner.query(
      'INSERT INTO payroll_policies(id,policy_key,version,effective_from,config,policy_hash,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        id,
        policyKey,
        version,
        effectiveFrom,
        config,
        policyHash,
        'Synthetic explicit policy',
        fixture.ids.hr,
      ],
    );
    await owner.query(
      "INSERT INTO payroll_policy_approvals(policy_id,approved_by,comment) VALUES($1,$2,'Synthetic independent policy approval')",
      [id, fixture.ids.reviewer],
    );
    await owner.query('COMMIT');
    return { id, policyKey, version, effectiveFrom, config, policyHash };
  } catch (error) {
    await owner.query('ROLLBACK');
    throw error;
  }
}
