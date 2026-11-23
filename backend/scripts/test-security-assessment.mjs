import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { createApp } from '../dist/app.js';
import { AuthenticationService } from '../dist/auth/authentication.service.js';
import {
  createPayrollWorkflowFixture,
  manualPayrollComponents,
  seedApprovedPayrollPolicy,
} from './payroll-workflow-fixtures.mjs';

// Never target the installed working database. Every write belongs to this disposable fixture.
const database = `acme_test_${randomUUID().replaceAll('-', '')}`;
assert.match(database, /^acme_test_[a-f0-9]{32}$/);
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL);
const runtimeUrl = new URL(process.env.DATABASE_URL);
for (const url of [ownerUrl, runtimeUrl]) {
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  assert.ok(url.port === '55432' || process.env.CI === 'true');
}
const admin = new Client({ connectionString: ownerUrl.href, connectionTimeoutMillis: 5000 });
await admin.connect();
let created = false;
let owner;
let app;
let passed = 0;
const ok = (label) => console.log(`PASS SECURITY-${++passed} ${label}`);
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
  const f = await createPayrollWorkflowFixture(owner);
  const policy = await seedApprovedPayrollPolicy(owner, f);
  process.env.DATABASE_URL = runtimeUrl.href;
  process.env.NODE_ENV = 'test';
  process.env.APP_ORIGIN = 'http://localhost:5910';
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const auth = app.get(AuthenticationService);
  const sessions = {};
  for (const key of ['hr', 'finance', 'outsider', 'viewer', 'editor']) {
    const issued = await auth.issue(f.emails[key]);
    sessions[key] = await auth.verify(issued.challengeId, issued.code);
    assert.ok(sessions[key]);
  }
  async function http(
    path,
    { actor = 'hr', method = 'GET', body, headers = {}, status = 200 } = {},
  ) {
    const session = sessions[actor];
    const response = await fetch(base + '/api/v1' + path, {
      method,
      headers: {
        Origin: process.env.APP_ORIGIN,
        'Content-Type': 'application/json',
        ...(session
          ? { Cookie: `acme_session=${session.token}`, 'X-CSRF-Token': session.csrf }
          : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, status, `${method} ${path}: unexpected status`);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    const data = await response.json();
    const encoded = JSON.stringify(data);
    for (const s of Object.values(sessions)) {
      assert.ok(!encoded.includes(s.token));
      assert.ok(!encoded.includes(s.csrf));
    }
    assert.doesNotMatch(
      encoded,
      /postgres(?:ql)?:\/\/|node_modules|SELECT .* FROM|secret_hash|token_hash/,
    );
    return data;
  }
  const command = () => ({
    commandId: randomUUID(),
    confirmed: true,
    reason: 'Synthetic security regression',
  });
  for (const path of [
    '/employees',
    '/team',
    '/salary/workspace',
    '/payroll-drafts',
    '/payroll-policies',
    '/payroll-runs',
    '/payroll-delivery/runs',
  ])
    await http(path, { actor: 'anonymous', status: 401 });
  await http('/salary/workspace', { actor: 'viewer', status: 403 });
  ok('Anonymous and salary permission boundaries, no-store and safe response projections');

  const input = {
    ...command(),
    employeeId: f.employeeIds.full,
    period: '2026-06',
    ...manualPayrollComponents(),
  };
  for (const headers of [
    { Origin: 'https://attacker.invalid' },
    { Origin: 'null' },
    { 'X-CSRF-Token': '' },
    { 'X-CSRF-Token': sessions.finance.csrf },
  ])
    await http('/payroll-drafts', {
      method: 'POST',
      body: input,
      headers,
      status: headers['X-CSRF-Token'] === sessions.finance.csrf ? 401 : 403,
    });
  assert.equal(
    (
      await owner.query(
        "SELECT count(*)::int n FROM payroll_drafts WHERE period_month='2026-06-01'",
      )
    ).rows[0].n,
    0,
  );
  ok('Cross-origin, null-origin, missing and cross-session CSRF attempts cannot write');

  const injected = await http('/employees?search=' + encodeURIComponent("%' OR 1=1 --"));
  assert.equal(injected.total, 0);
  await http('/employees?sort=' + encodeURIComponent('name; DROP TABLE employees'), {
    status: 400,
  });
  await http('/employees?page=100001', { status: 400 });
  await http('/employees?pageSize=101', { status: 400 });
  for (const extra of [
    { status: 'FINALIZED' },
    { createdBy: f.ids.finance },
    { isHrManager: true },
  ])
    await http('/payroll-drafts', { method: 'POST', body: { ...input, ...extra }, status: 400 });
  for (const basic of ['-1.00', '1e6', 'NaN', '0.001'])
    await http('/payroll-drafts', {
      method: 'POST',
      body: { ...input, earnings: { ...input.earnings, basic } },
      status: 400,
    });
  ok('SQL-like input remains literal; pagination, mass assignment and invalid money are rejected');

  const responses = await Promise.all(
    Array.from({ length: 6 }, () =>
      http('/payroll-drafts', { method: 'POST', body: input, status: 201 }),
    ),
  );
  assert.equal(new Set(responses.map((r) => r.id)).size, 1);
  assert.equal(responses.filter((r) => r.replayed).length, 5);
  assert.equal(
    (
      await owner.query('SELECT count(*)::int n FROM payroll_draft_commands WHERE command_id=$1', [
        input.commandId,
      ])
    ).rows[0].n,
    1,
  );
  await http('/payroll-drafts', {
    method: 'POST',
    body: { ...input, reason: 'Tampered replay' },
    status: 409,
  });
  ok('Concurrent identical commands commit once and changed replay payloads are denied');

  const run = await http('/payroll-runs', {
    method: 'POST',
    status: 201,
    body: {
      ...command(),
      period: f.period,
      policyId: policy.id,
      hrReviewerId: f.ids.reviewer,
      financeApproverId: f.ids.finance,
      directorApproverId: f.ids.director,
      calculations: [
        {
          employeeId: f.employeeIds.full,
          manualDraftId: f.drafts.full.id,
          expectedDraftVersion: 1,
          pfEligible: true,
          esiEligible: true,
          stateCode: 'KA',
          ptAmount: '0.00',
          tdsAmount: '0.00',
          leavingDate: null,
          unpaidDates: [],
        },
      ],
    },
  });
  await http(`/payroll-runs/${run.id}`, { actor: 'outsider', status: 403 });
  await http(`/payroll-runs/${run.id}`, { actor: 'finance' });
  await http(`/payroll-delivery/runs/${run.id}`, { status: 404 });
  await http(`/payroll-runs/${run.id}/actions`, {
    actor: 'finance',
    method: 'POST',
    body: { ...command(), expectedVersion: run.version, action: 'FINALIZE' },
    status: 409,
  });
  ok(
    'Guessed run IDs require assignment; draft documents and skipped approval stages remain closed',
  );

  await auth.revoke(sessions.editor.token);
  await http('/employees', { actor: 'editor', status: 401 });
  await owner.query("UPDATE users SET permissions=ARRAY['read']::text[] WHERE id=$1", [
    f.ids.finance,
  ]);
  await http(`/payroll-runs/${run.id}`, { actor: 'finance', status: 403 });
  await http('/employees', { actor: 'finance' });
  ok('Revoked sessions and current permission removal take effect on the next request');

  for (const [body, status] of [
    ['{"broken":', 400],
    [JSON.stringify({ padding: 'x'.repeat(110000) }), 413],
  ]) {
    const response = await fetch(base + '/api/v1/payroll-drafts', {
      method: 'POST',
      headers: { Origin: process.env.APP_ORIGIN, 'Content-Type': 'application/json' },
      body,
    });
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /SyntaxError|node_modules|stack|padding/);
  }
  assert.equal((await fetch(base + '/healthz')).status, 200);
  ok('Malformed and oversized JSON fail safely and leave the server responsive');
  const runtime = new Client({ connectionString: runtimeUrl.href });
  await runtime.connect();
  try {
    for (const sql of [
      'CREATE TABLE security_probe(id integer)',
      "UPDATE audit_logs SET description='tampered' WHERE false",
      'DELETE FROM salary_records WHERE false',
    ])
      await assert.rejects(runtime.query(sql), (error) => error.code === '42501');
  } finally {
    await runtime.end();
  }
  ok(
    'Runtime database role cannot create schema objects or rewrite protected financial/audit history',
  );
  for (let index = 0; index < 20; index++)
    await http('/auth/otp/request', {
      actor: 'anonymous',
      method: 'POST',
      body: { email: `unknown-${index}@security.invalid` },
      status: 202,
    });
  await http('/auth/otp/verify', {
    actor: 'anonymous',
    method: 'POST',
    headers: { 'X-Forwarded-For': '198.51.100.77' },
    body: { challengeId: randomUUID(), code: '000000' },
    status: 429,
  });
  ok(
    'One source IP shares the persisted authentication budget; forwarded headers cannot increase it',
  );
  console.log(`PASS ${passed} adversarial security groups; synthetic local scope only`);
} finally {
  if (app) await app.close();
  if (owner) await owner.end();
  if (created) await admin.query(`DROP DATABASE ${database} WITH (FORCE)`);
  await admin.end();
}
