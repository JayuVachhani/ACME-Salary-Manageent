import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { createApp } from '../dist/app.js';
import { AuthenticationService } from '../dist/auth/authentication.service.js';
import { linkFixtureActor } from './salary-fixtures.mjs';

const database = `acme_test_${randomUUID().replaceAll('-', '')}`;
assert.match(database, /^acme_test_[a-f0-9]{32}$/);
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL);
const runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href, connectionTimeoutMillis: 5000 });
await admin.connect();
let owner,
  app,
  created = false,
  passed = 0;
const ok = (label) =>
  console.log(`PASS EMP-WORKFLOW-${String(++passed).padStart(2, '0')} ${label}`);
const today = new Date().toISOString().slice(0, 10);
const future = new Date(Date.parse(today) + 30 * 86400000).toISOString().slice(0, 10);
try {
  await admin.query(`CREATE DATABASE ${database}`);
  created = true;
  ownerUrl.pathname = runtimeUrl.pathname = `/${database}`;
  execFileSync(process.execPath, ['scripts/migrate.mjs'], {
    env: { ...process.env, MIGRATION_DATABASE_URL: ownerUrl.href },
    windowsHide: true,
    stdio: 'pipe',
  });
  owner = new Client({ connectionString: ownerUrl.href });
  await owner.connect();
  const ids = {
    hr: randomUUID(),
    reviewer: randomUUID(),
    reader: randomUUID(),
    unlinked: randomUUID(),
    editor: randomUUID(),
  };
  for (const [key, id] of Object.entries(ids))
    await owner.query(
      "INSERT INTO users(id,email,full_name,status,is_hr_manager,permissions) VALUES($1,$2,$3,'ACTIVE',$4,$5)",
      [
        id,
        `${key}.workflow@acme.test`,
        `Synthetic ${key}`,
        ['hr', 'reviewer', 'unlinked'].includes(key),
        key === 'editor' ? ['read', 'write', 'edit', 'salary:view'] : ['read'],
      ],
    );
  await linkFixtureActor(owner, ids.hr);
  await linkFixtureActor(owner, ids.reviewer);
  await linkFixtureActor(owner, ids.editor);
  await owner.query("INSERT INTO currencies(code,minor_units) VALUES('USD',2),('INR',2)");
  await owner.query(
    "INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by) VALUES('ZZ','Synthetic Workflow','USD',2,'HALF_UP',$1)",
    [ids.hr],
  );
  const department = (
    await owner.query(
      "INSERT INTO departments(name) VALUES('Synthetic Workflow Department') RETURNING id",
    )
  ).rows[0].id;
  const designation = (
    await owner.query(
      "INSERT INTO designations(name) VALUES('Synthetic Workflow Job') RETURNING id",
    )
  ).rows[0].id;
  process.env.DATABASE_URL = runtimeUrl.href;
  process.env.APP_ORIGIN = 'http://localhost:5899';
  process.env.NODE_ENV = 'test';
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const auth = app.get(AuthenticationService);
  const sessions = {};
  for (const key of Object.keys(ids)) {
    const issued = await auth.issue(`${key}.workflow@acme.test`);
    sessions[key] = await auth.verify(issued.challengeId, issued.code);
    assert.ok(sessions[key]);
  }
  async function http(path, { actor = 'hr', method = 'GET', body, csrf = true } = {}) {
    const session = sessions[actor];
    const headers = {
      Origin: process.env.APP_ORIGIN,
      'Content-Type': 'application/json',
      Cookie: `acme_session=${session.token}`,
    };
    if (csrf) headers['X-CSRF-Token'] = session.csrf;
    const response = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }
  let number = 0;
  const input = (overrides = {}) => ({
    commandId: randomUUID(),
    employeeCode: `WF-${++number}`,
    email: `workflow.employee${number}@acme.test`,
    firstName: 'Synthetic',
    lastName: 'Employee',
    joiningDate: '2026-01-01',
    countryCode: 'ZZ',
    departmentId: department,
    designationId: designation,
    employmentStatus: 'ACTIVE',
    effectiveFrom: '2026-01-01',
    amount: '1250.50',
    currency: 'USD',
    reason: 'Synthetic initial request',
    confirmed: true,
    ...overrides,
  });
  const firstInput = input();
  let response = await http('/api/v1/employees', { method: 'POST', body: firstInput, csrf: false });
  assert.equal(response.status, 403);
  ok('creation requires origin/CSRF transport guard');
  response = await http('/api/v1/employees', { actor: 'reader', method: 'POST', body: firstInput });
  assert.equal(response.status, 403);
  ok('read-only account cannot create salary-bearing employee');
  response = await http('/api/v1/employees', {
    method: 'POST',
    body: { ...firstInput, unexpected: true },
  });
  assert.equal(response.status, 400);
  ok('strict global DTO rejects unknown fields');
  const first = await http('/api/v1/employees', { method: 'POST', body: firstInput });
  assert.equal(first.status, 201);
  assert.equal(first.body.status, 'PENDING');
  const employee = first.body.employeeId,
    request = first.body.requestId;
  assert.equal(
    (
      await owner.query('SELECT count(*)::int n FROM salary_records WHERE employee_id=$1', [
        employee,
      ])
    ).rows[0].n,
    0,
  );
  ok('employee and initial request created without active ledger');
  await assert.rejects(
    owner.query(
      `INSERT INTO salary_records(employee_id,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,approval_status,change_reason,created_by)
    SELECT employee_id,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,'ACTIVE',reason,requested_by FROM salary_change_requests WHERE id=$1`,
      [request],
    ),
    (error) => error.code === '42501',
  );
  ok('direct SQL cannot bypass independent initial approval');
  response = await http('/api/v1/employees', { method: 'POST', body: firstInput });
  assert.equal(response.status, 201);
  assert.deepEqual(response.body, first.body);
  ok('same actor/command retries return original result');
  const concurrentInput = input();
  const concurrent = await Promise.all([
    http('/api/v1/employees', { method: 'POST', body: concurrentInput }),
    http('/api/v1/employees', { method: 'POST', body: concurrentInput }),
  ]);
  assert.equal(concurrent[0].status, 201);
  assert.equal(concurrent[1].status, 201);
  assert.deepEqual(concurrent[0].body, concurrent[1].body);
  assert.equal(
    (
      await owner.query(
        'SELECT count(*)::int n FROM employee_creation_commands WHERE command_id=$1',
        [concurrentInput.commandId],
      )
    ).rows[0].n,
    1,
  );
  ok('concurrent duplicate creation commits one employee/request/result');
  response = await http('/api/v1/employees', {
    method: 'POST',
    body: { ...firstInput, amount: '1300' },
  });
  assert.equal(response.status, 409);
  ok('reusing a submission key for changed data is rejected');
  response = await http('/api/v1/employees', {
    method: 'POST',
    body: input({ employeeCode: firstInput.employeeCode }),
  });
  assert.equal(response.status, 409);
  ok('duplicate employee code rolls back');
  response = await http('/api/v1/employees', {
    method: 'POST',
    body: input({ amount: '100.001' }),
  });
  assert.equal(response.status, 400);
  ok('excess country precision rejected without rounding');
  response = await http('/api/v1/employees', { method: 'POST', body: input({ currency: 'INR' }) });
  assert.equal(response.status, 422);
  ok('missing required FX provenance rejects creation');
  response = await http('/api/v1/employees', {
    method: 'POST',
    body: input({ effectiveFrom: '2025-12-31' }),
  });
  assert.equal(response.status, 400);
  ok('salary cannot precede joining date');
  const unavailable = input({ employeeCode: 'WF-FAULT' });
  await owner.query(
    `CREATE FUNCTION workflow_fail_create() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity_type='EMPLOYEE' AND NEW.change_type='CREATED' THEN RAISE EXCEPTION 'Synthetic creation fault'; END IF; RETURN NEW; END; $$; CREATE TRIGGER workflow_fail_create BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION workflow_fail_create();`,
  );
  response = await http('/api/v1/employees', { method: 'POST', body: unavailable });
  assert.equal(response.status, 500);
  assert.equal(
    (await owner.query("SELECT count(*)::int n FROM employees WHERE employee_code='WF-FAULT'"))
      .rows[0].n,
    0,
  );
  assert.equal(
    (
      await owner.query(
        'SELECT count(*)::int n FROM employee_creation_commands WHERE command_id=$1',
        [unavailable.commandId],
      )
    ).rows[0].n,
    0,
  );
  await owner.query(
    'DROP TRIGGER workflow_fail_create ON audit_logs; DROP FUNCTION workflow_fail_create()',
  );
  ok('late creation fault rolls back employee, request and idempotency result');
  response = await http('/api/v1/salary-requests');
  assert.equal(response.status, 200);
  assert.ok(response.body.items.some((row) => row.id === request && !row.can_decide));
  ok('inbox excludes requester from deciding');
  response = await http('/api/v1/salary-requests', { actor: 'reader' });
  assert.equal(response.status, 403);
  ok('non-HR cannot browse salary approval inbox');
  const decision = {
    decision: 'APPROVED',
    comment: 'Synthetic independent approval',
    confirmed: true,
  };
  response = await http(`/api/v1/salary-requests/${request}/decision`, {
    method: 'POST',
    body: decision,
  });
  assert.equal(response.status, 403);
  ok('requester cannot approve own request');
  response = await http(`/api/v1/salary-requests/${request}/decision`, {
    actor: 'unlinked',
    method: 'POST',
    body: decision,
  });
  assert.equal(response.status, 403);
  ok('unlinked HR cannot approve salary');
  await owner.query(
    `CREATE FUNCTION workflow_fail_salary() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity_type='SALARY' THEN RAISE EXCEPTION 'Synthetic salary fault'; END IF; RETURN NEW; END; $$; CREATE TRIGGER workflow_fail_salary BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION workflow_fail_salary();`,
  );
  response = await http(`/api/v1/salary-requests/${request}/decision`, {
    actor: 'reviewer',
    method: 'POST',
    body: decision,
  });
  assert.equal(response.status, 500);
  assert.equal(
    (await owner.query('SELECT status FROM salary_request_status WHERE id=$1', [request])).rows[0]
      .status,
    'PENDING',
  );
  assert.equal(
    (
      await owner.query('SELECT count(*)::int n FROM salary_records WHERE employee_id=$1', [
        employee,
      ])
    ).rows[0].n,
    0,
  );
  await owner.query(
    'DROP TRIGGER workflow_fail_salary ON audit_logs; DROP FUNCTION workflow_fail_salary()',
  );
  ok('approval fault rolls back decision and ledger/history');
  response = await http(`/api/v1/salary-requests/${request}/decision`, {
    actor: 'reviewer',
    method: 'POST',
    body: decision,
  });
  assert.equal(response.status, 201);
  assert.ok(response.body.salaryId);
  ok('linked independent reviewer approves initial salary atomically');
  response = await http(`/api/v1/salary-requests/${request}/decision`, {
    actor: 'reviewer',
    method: 'POST',
    body: decision,
  });
  assert.equal(response.status, 409);
  ok('duplicate decision cannot append another salary');
  response = await http(`/api/v1/employees/${employee}/salary`, { actor: 'reader' });
  assert.equal(response.status, 403);
  response = await http(`/api/v1/employees/${employee}`, { actor: 'reader' });
  assert.equal(response.status, 200);
  assert.equal('monthly_amount' in response.body, false);
  ok('employee reads never expose salary without permission');
  response = await http(`/api/v1/employees/${employee}/salary`);
  assert.equal(response.status, 200);
  assert.equal(response.body.current.amount, '1250.5000');
  assert.equal(response.body.history.length, 1);
  ok('approved salary is visible in current value and history');
  const rejected = await http('/api/v1/employees', { method: 'POST', body: input() });
  response = await http(`/api/v1/salary-requests/${rejected.body.requestId}/decision`, {
    actor: 'reviewer',
    method: 'POST',
    body: { ...decision, decision: 'REJECTED' },
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.salaryId, null);
  const rejectedEmployee = (await http(`/api/v1/employees/${rejected.body.employeeId}`)).body;
  response = await http(`/api/v1/employees/${rejected.body.employeeId}/initial-salary`, {
    actor: 'unlinked',
    method: 'POST',
    body: {
      commandId: randomUUID(),
      expectedVersion: rejectedEmployee.version,
      amount: '1400',
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      reason: 'Synthetic corrected initial',
      confirmed: true,
    },
  });
  assert.equal(response.status, 403);
  response = await http(`/api/v1/employees/${rejected.body.employeeId}/initial-salary`, {
    method: 'POST',
    body: {
      commandId: randomUUID(),
      expectedVersion: rejectedEmployee.version,
      amount: '1400',
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      reason: 'Synthetic corrected initial',
      confirmed: true,
    },
  });
  assert.equal(response.status, 201);
  assert.notEqual(response.body.requestId, rejected.body.requestId);
  ok('rejection preserves history and linked creator can submit a new initial request');
  const scheduled = await http('/api/v1/employees', {
    method: 'POST',
    body: input({ effectiveFrom: future }),
  });
  response = await http(`/api/v1/salary-requests/${scheduled.body.requestId}/decision`, {
    actor: 'reviewer',
    method: 'POST',
    body: decision,
  });
  assert.equal(response.status, 201);
  response = await http(`/api/v1/employees/${scheduled.body.employeeId}/salary`);
  assert.equal(response.body.current, null);
  assert.equal(response.body.history.length, 1);
  ok('approved future salary is scheduled, not current compensation');
  const startsToday = await http('/api/v1/employees', {
    method: 'POST',
    body: input({ effectiveFrom: today }),
  });
  assert.equal(startsToday.status, 201);
  response = await http(`/api/v1/employees/${startsToday.body.employeeId}/salary`);
  assert.equal(response.body.current, null);
  assert.equal(response.body.pending.length, 1);
  ok('today’s initial salary also remains pending until independent approval');
  const profile = (await http(`/api/v1/employees/${employee}`)).body;
  response = await http(`/api/v1/employees/${employee}/edit-lease`, {
    method: 'POST',
    body: { expectedVersion: profile.version - 1 },
  });
  assert.equal(response.status, 409);
  ok('stale displayed profile cannot acquire a fresh lease');
  const lease = await http(`/api/v1/employees/${employee}/edit-lease`, {
    method: 'POST',
    body: { expectedVersion: profile.version },
  });
  assert.equal(lease.status, 201);
  response = await http(`/api/v1/employees/${employee}/edit-lease`, {
    actor: 'reviewer',
    method: 'POST',
    body: { expectedVersion: profile.version },
  });
  assert.equal(response.status, 423);
  ok('competing edit sessions have one lease winner');
  response = await http(`/api/v1/employees/${employee}/edit-lease/renew`, {
    actor: 'reviewer',
    method: 'POST',
    body: { leaseToken: lease.body.leaseToken },
  });
  assert.equal(response.status, 409);
  ok('another actor cannot renew a known lease token');
  const edited = {
    leaseToken: lease.body.leaseToken,
    expectedVersion: lease.body.version,
    firstName: 'Updated',
    lastName: 'Synthetic',
    email: 'updated.workflow@acme.test',
    reason: 'Synthetic personal edit',
    confirmed: true,
  };
  response = await http(`/api/v1/employees/${employee}`, { method: 'PATCH', body: edited });
  assert.equal(response.status, 200);
  assert.equal(response.body.version, profile.version + 1);
  assert.equal(
    (await owner.query('SELECT count(*)::int n FROM record_locks WHERE employee_id=$1', [employee]))
      .rows[0].n,
    0,
  );
  ok('personal edit advances version and releases lease in same transaction');
  response = await http(`/api/v1/employees/${employee}`, { method: 'PATCH', body: edited });
  assert.equal(response.status, 409);
  ok('stale save cannot overwrite confirmed edit');
  const finalProfile = (await http(`/api/v1/employees/${employee}`)).body;
  const expiryLease = await http(`/api/v1/employees/${employee}/edit-lease`, {
    method: 'POST',
    body: { expectedVersion: finalProfile.version },
  });
  await owner.query(
    "UPDATE record_locks SET expires_at=clock_timestamp()-interval '1 second' WHERE employee_id=$1",
    [employee],
  );
  response = await http(`/api/v1/employees/${employee}/edit-lease/renew`, {
    method: 'POST',
    body: { leaseToken: expiryLease.body.leaseToken },
  });
  assert.equal(response.status, 409);
  ok('expired lease cannot be renewed');
  response = await http(`/api/v1/employees/${employee}/edit-lease`, {
    actor: 'reviewer',
    method: 'POST',
    body: { expectedVersion: finalProfile.version },
  });
  assert.equal(response.status, 201);
  response = await http(`/api/v1/employees/${employee}/edit-lease/release`, {
    actor: 'reviewer',
    method: 'POST',
    body: { leaseToken: response.body.leaseToken },
  });
  assert.equal(response.status, 201);
  ok('expired lease can be taken over and holder can release');
  console.log(`${passed} isolated SQL/real HTTP employee workflow checks passed`);
} finally {
  await app?.close();
  await owner?.end();
  if (created) await admin.query(`DROP DATABASE ${database} WITH (FORCE)`);
  await admin.end();
}
