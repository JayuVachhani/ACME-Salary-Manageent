import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client, Pool } from 'pg';
import { SalaryApprovalService } from '../apps/api/dist/salary/salary-approval.service.js';
const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
if (!/^acme_test_[a-f0-9]{32}$/.test(name)) throw new Error('Unsafe isolated database name');
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL);
const runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href, connectionTimeoutMillis: 5000 });
await admin.connect();
let pool;
let owner;
let passed = 0;
const [manager, approver, reader, employee, department, designation] = Array.from(
  { length: 6 },
  () => randomUUID(),
);
try {
  await admin.query(`CREATE DATABASE ${name}`);
  ownerUrl.pathname = `/${name}`;
  runtimeUrl.pathname = `/${name}`;
  execFileSync(process.execPath, ['scripts/migrate.mjs'], {
    env: { ...process.env, MIGRATION_DATABASE_URL: ownerUrl.href },
    windowsHide: true,
    stdio: 'pipe',
    timeout: 30000,
  });
  owner = new Client({ connectionString: ownerUrl.href });
  await owner.connect();
  pool = new Pool({ connectionString: runtimeUrl.href, max: 5, connectionTimeoutMillis: 5000 });
  const service = new SalaryApprovalService(pool, () => new Date('2026-11-21T12:00:00Z'));
  await owner.query(
    `INSERT INTO users(id,email,full_name,status,is_hr_manager) VALUES
    ($1,'manager@acme.test','Synthetic Requester','ACTIVE',true),
    ($2,'approver@acme.test','Synthetic Approver','ACTIVE',true),
    ($3,'reader@acme.test','Synthetic Reader','ACTIVE',false)`,
    [manager, approver, reader],
  );
  await owner.query("INSERT INTO currencies(code,minor_units) VALUES('USD',2)");
  await owner.query(
    "INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by) VALUES('ZZ','Synthetic','USD',2,'HALF_UP',$1)",
    [manager],
  );
  await owner.query("INSERT INTO departments(id,name) VALUES($1,'Synthetic Department')", [
    department,
  ]);
  await owner.query("INSERT INTO designations(id,name) VALUES($1,'Synthetic Designation')", [
    designation,
  ]);
  await owner.query(
    "INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,'TEST-001','employee@acme.test','Synthetic','Employee','2026-01-01',$2)",
    [employee, manager],
  );
  await owner.query(
    `INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by)
    VALUES($1,'ZZ',$2,$3,'ACTIVE','2026-01-01','Synthetic initial assignment',$4)`,
    [employee, department, designation, manager],
  );
  const original = (
    await owner.query(
      `INSERT INTO salary_records(employee_id,monthly_amount,currency,country_code,default_currency,country_rule_version,
    decimal_places,rounding_mode,effective_from,submitted_business_date,approval_status,change_reason,created_by)
    VALUES($1,100,'USD','ZZ','USD',1,2,'HALF_UP','2026-01-01','2026-01-01','ACTIVE','Synthetic initial salary',$2) RETURNING id`,
      [employee, manager],
    )
  ).rows[0].id;
  const version = async () =>
    (await owner.query('SELECT version FROM employees WHERE id=$1', [employee])).rows[0].version;
  const salary = async (date) =>
    (
      await owner.query(
        'SELECT monthly_amount::text FROM salary_in_force($1) WHERE employee_id=$2',
        [date, employee],
      )
    ).rows[0]?.monthly_amount;
  const input = async (date, amount = '200') => ({
    employeeId: employee,
    effectiveFrom: date,
    amount,
    currency: 'USD',
    reason: 'Synthetic backdated adjustment',
    expectedVersion: await version(),
  });
  const request = await service.submit(manager, await input('2026-10-01'));
  assert.equal(await salary('2026-11-21'), '100.0000');
  passed++;
  assert.equal(
    (await owner.query('SELECT status FROM salary_request_status WHERE id=$1', [request])).rows[0]
      .status,
    'PENDING',
  );
  passed++;
  await assert.rejects(
    service.submit(manager, await input('2026-10-01')),
    (e) => e.code === '23505',
  );
  passed++;
  await assert.rejects(
    service.decide(manager, request, 'APPROVED', 'Cannot approve own request'),
    (e) => e.code === '42501',
  );
  passed++;
  await assert.rejects(
    service.decide(reader, request, 'APPROVED', 'Not a manager'),
    (e) => e.code === '42501',
  );
  passed++;
  const fixtureLink = async (employeeId) => {
    await owner.query('BEGIN');
    try {
      await owner.query(
        `SELECT set_config('acme.link_actor',$1,true),set_config('acme.link_reason','Synthetic self-subject regression',true),set_config('acme.link_confirmed','true',true)`,
        [manager],
      );
      await owner.query('UPDATE users SET employee_id=$1 WHERE id=$2', [employeeId, approver]);
      await owner.query('COMMIT');
    } catch (error) {
      await owner.query('ROLLBACK');
      throw error;
    }
  };
  await fixtureLink(employee);
  await assert.rejects(
    service.decide(approver, request, 'APPROVED', 'Cannot approve own salary'),
    (e) => e.code === '42501',
  );
  passed++;
  await fixtureLink(null);
  const approvalState = async () => ({
    version: await version(),
    salary: await salary('2026-11-21'),
    counts: (
      await owner.query(`SELECT
      (SELECT count(*)::int FROM salary_records) AS ledger,
      (SELECT count(*)::int FROM salary_history_events) AS history,
      (SELECT count(*)::int FROM salary_approval_decisions) AS decisions,
      (SELECT count(*)::int FROM audit_logs) AS audit`)
    ).rows[0],
  });
  const beforeDeactivation = await approvalState();
  await owner.query("UPDATE currencies SET is_active=false WHERE code='USD'");
  await assert.rejects(
    service.decide(approver, request, 'APPROVED', 'Currency was deactivated'),
    /INVALID_CURRENCY/,
  );
  passed++;
  assert.deepEqual(await approvalState(), beforeDeactivation);
  passed++;
  assert.equal(
    (await owner.query('SELECT status FROM salary_request_status WHERE id=$1', [request])).rows[0]
      .status,
    'PENDING',
  );
  passed++;
  await assert.rejects(
    owner.query(
      `INSERT INTO salary_approval_decisions(request_id,decision,decided_by,comment)
    VALUES($1,'APPROVED',$2,'Direct SQL cannot bypass inactive currency')`,
      [request, approver],
    ),
    (error) => error.code === '23514' && error.message === 'Requested currency is inactive',
  );
  passed++;
  assert.deepEqual(await approvalState(), beforeDeactivation);
  passed++;
  await owner.query("UPDATE currencies SET is_active=true WHERE code='USD'");
  // A deactivation that starts first must win, even when it is uncommitted at validation.
  await owner.query('BEGIN');
  let race;
  try {
    await owner.query("UPDATE currencies SET is_active=false WHERE code='USD'");
    race = service.decide(approver, request, 'APPROVED', 'Concurrent currency deactivation').then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    let blocked = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      const waiting = await pool.query(`SELECT EXISTS(SELECT 1 FROM pg_stat_activity
        WHERE datname=current_database() AND wait_event_type='Lock'
        AND query LIKE 'SELECT 1 FROM currencies%') AS blocked`);
      if (waiting.rows[0].blocked) {
        blocked = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(
      blocked,
      true,
      'Approval must wait for the currency row, not read stale active status',
    );
    passed++;
    await owner.query('COMMIT');
  } finally {
    await owner.query('ROLLBACK');
  }
  const raceResult = await race;
  assert.equal(raceResult.error?.message, 'INVALID_CURRENCY');
  passed++;
  assert.deepEqual(await approvalState(), beforeDeactivation);
  passed++;
  // Rejection must still be possible after deactivation; it never applies compensation.
  await owner.query("UPDATE currencies SET is_active=true WHERE code='USD'");
  const rejectInactive = await service.submit(manager, await input('2026-04-01', '125'));
  await owner.query("UPDATE currencies SET is_active=false WHERE code='USD'");
  await service.decide(approver, rejectInactive, 'REJECTED', 'Inactive currency request rejected');
  assert.equal(
    (await owner.query('SELECT status FROM salary_request_status WHERE id=$1', [rejectInactive]))
      .rows[0].status,
    'REJECTED',
  );
  passed++;
  assert.equal(await salary('2026-11-21'), '100.0000');
  passed++;
  await owner.query("UPDATE currencies SET is_active=true WHERE code='USD'");
  const applied = await service.decide(
    approver,
    request,
    'APPROVED',
    'Verified historical adjustment',
  );
  assert.ok(applied);
  assert.equal(await salary('2026-11-21'), '200.0000');
  passed++;
  assert.equal(await salary('2026-09-30'), '100.0000');
  passed++;
  assert.equal(
    (await owner.query('SELECT monthly_amount::text FROM salary_records WHERE id=$1', [original]))
      .rows[0].monthly_amount,
    '100.0000',
  );
  passed++;
  await assert.rejects(
    service.decide(approver, request, 'REJECTED', 'Cannot decide twice'),
    (e) => e.code === '23505',
  );
  passed++;
  assert.equal(
    (
      await owner.query(
        'SELECT count(*)::int AS n FROM salary_history_events WHERE salary_record_id=$1',
        [applied],
      )
    ).rows[0].n,
    1,
  );
  passed++;
  const rejected = await service.submit(manager, await input('2026-09-01', '150'));
  await service.decide(approver, rejected, 'REJECTED', 'Not supported by documentation');
  assert.equal(await salary('2026-09-15'), '100.0000');
  passed++;
  assert.equal(
    (await owner.query('SELECT status FROM salary_request_status WHERE id=$1', [rejected])).rows[0]
      .status,
    'REJECTED',
  );
  passed++;
  const retry = await service.submit(manager, await input('2026-09-01', '155'));
  assert.notEqual(retry, rejected);
  passed++;
  await service.decide(approver, retry, 'REJECTED', 'Synthetic rejection');
  const correction = await service.submit(manager, {
    ...(await input('2026-01-01', '110')),
    correctsId: original,
  });
  assert.equal(await salary('2026-02-01'), '100.0000');
  await service.decide(approver, correction, 'APPROVED', 'Correct documented typo');
  assert.equal(await salary('2026-02-01'), '110.0000');
  passed++;
  assert.equal(await salary('2026-11-21'), '200.0000');
  passed++;
  const stale = await service.submit(manager, await input('2026-08-01'));
  await owner.query('UPDATE employees SET version=version+1 WHERE id=$1', [employee]);
  await assert.rejects(
    service.decide(approver, stale, 'APPROVED', 'Stale request'),
    (e) => e.code === '40001',
  );
  passed++;
  await service.decide(approver, stale, 'REJECTED', 'Resubmit against updated employee');
  const concurrentInput = await input('2026-07-01');
  const parallel = await Promise.allSettled([
    service.submit(manager, concurrentInput),
    service.submit(manager, concurrentInput),
  ]);
  assert.equal(parallel.filter((r) => r.status === 'fulfilled').length, 1);
  passed++;
  assert.equal(parallel.filter((r) => r.status === 'rejected').length, 1);
  passed++;
  await assert.rejects(
    service.submit(manager, await input('2026-12-01')),
    /BACKDATED_DATE_REQUIRED/,
  );
  passed++;
  await assert.rejects(
    service.submit(manager, await input('2025-12-01')),
    /INVALID_EMPLOYEE_OR_DATE/,
  );
  passed++;
  await assert.rejects(
    service.submit(manager, await input('2026-06-01', '10.001')),
    /EXCESS_COUNTRY_PRECISION/,
  );
  passed++;
  // A fault during audit insertion must roll back decision, ledger, history and version together.
  const atomic = await service.submit(manager, await input('2026-05-01'));
  const beforeVersion = await version();
  await owner.query(`CREATE FUNCTION test_fail_salary_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.entity_type='SALARY' THEN RAISE EXCEPTION 'Synthetic audit failure'; END IF; RETURN NEW; END; $$;
    CREATE TRIGGER test_fail_salary_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION test_fail_salary_audit()`);
  await assert.rejects(
    service.decide(approver, atomic, 'APPROVED', 'Fault injection'),
    /Synthetic audit failure/,
  );
  passed++;
  assert.equal(
    (await owner.query('SELECT status FROM salary_request_status WHERE id=$1', [atomic])).rows[0]
      .status,
    'PENDING',
  );
  passed++;
  assert.equal(
    (
      await owner.query(
        'SELECT count(*)::int AS n FROM salary_records WHERE approval_request_id=$1',
        [atomic],
      )
    ).rows[0].n,
    0,
  );
  passed++;
  assert.equal(await version(), beforeVersion);
  passed++;
  await owner.query('BEGIN');
  await owner.query(
    "INSERT INTO salary_approval_decisions(request_id,decision,decided_by,comment) VALUES($1,'APPROVED',$2,'Missing ledger test')",
    [atomic, approver],
  );
  await assert.rejects(owner.query('COMMIT'), (e) => e.code === '23514');
  passed++;
  await owner.query('ROLLBACK');
  assert.equal(
    (await owner.query('SELECT status FROM salary_request_status WHERE id=$1', [atomic])).rows[0]
      .status,
    'PENDING',
  );
  passed++;
  console.log(
    `${passed} real PostgreSQL approval-service checks passed; isolated database will be dropped`,
  );
} finally {
  if (pool) await pool.end();
  if (owner) await owner.end();
  // Only the uniquely named synthetic test database created above can be dropped.
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.end();
}
