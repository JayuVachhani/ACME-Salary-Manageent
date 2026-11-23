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
} from './payroll-workflow-fixtures.mjs';
const database = `acme_test_${randomUUID().replaceAll('-', '')}`;
assert.match(database, /^acme_test_[a-f0-9]{32}$/);
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL),
  runtimeUrl = new URL(process.env.DATABASE_URL);
assert.ok(
  ownerUrl.port === '55432' || process.env.CI === 'true',
  'Use isolated verification cluster only',
);
const admin = new Client({ connectionString: ownerUrl.href, connectionTimeoutMillis: 5000 });
await admin.connect();
let owner,
  app,
  created = false,
  passed = 0;
const ok = (label) => console.log(`PASS PAYROLL-${++passed} ${label}`);
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
  const f = await createPayrollWorkflowFixture(owner, { drafts: false });
  process.env.DATABASE_URL = runtimeUrl.href;
  process.env.APP_ORIGIN = 'http://localhost:5908';
  process.env.NODE_ENV = 'test';
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const auth = app.get(AuthenticationService),
    sessions = {};
  for (const key of Object.keys(f.ids)) {
    const issued = await auth.issue(f.emails[key]);
    sessions[key] = await auth.verify(issued.challengeId, issued.code);
    assert.ok(sessions[key]);
  }
  async function http(
    path,
    { actor = 'hr', method = 'GET', body, csrf = true, status = 200 } = {},
  ) {
    const s = sessions[actor],
      headers = { Origin: process.env.APP_ORIGIN, 'Content-Type': 'application/json' };
    if (s) {
      headers.Cookie = `acme_session=${s.token}`;
      if (csrf) headers['X-CSRF-Token'] = s.csrf;
    }
    const r = await fetch(base + '/api/v1' + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await r.json();
    assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
    return result;
  }
  const command = () => ({
    commandId: randomUUID(),
    reason: 'Synthetic explicit regression command',
    confirmed: true,
  });
  const components = manualPayrollComponents();
  const drafts = {};
  await http('/payroll-drafts', { actor: 'anonymous', status: 401 });
  await http('/payroll-drafts', { actor: 'viewer', status: 403 });
  for (const key of ['full', 'partial', 'escaped']) {
    const body = { ...command(), employeeId: f.employeeIds[key], period: f.period, ...components };
    if (key === 'full') {
      await http('/payroll-drafts', { method: 'POST', body, csrf: false, status: 403 });
      await http('/payroll-drafts', {
        method: 'POST',
        body: { ...body, unexpected: true },
        status: 400,
      });
      await http('/payroll-drafts', {
        method: 'POST',
        body: { ...body, earnings: { ...body.earnings, basic: '1.001' } },
        status: 400,
      });
    }
    drafts[key] = await http('/payroll-drafts', { method: 'POST', body, status: 201 });
    const replay = await http('/payroll-drafts', { method: 'POST', body, status: 201 });
    assert.equal(replay.id, drafts[key].id);
    assert.equal(replay.replayed, true);
  }
  await http('/payroll-drafts', {
    method: 'POST',
    body: { ...command(), employeeId: f.actorEmployees.hr, period: f.period, ...components },
    status: 403,
  });
  const draftPage = await http(`/payroll-drafts?period=${f.period}&search=PAY-`);
  assert.equal(draftPage.total, 2);
  assert.equal(draftPage.items.length, 2);
  assert.ok(draftPage.items.every((row) => row.earnings.hra === '6000.00'));
  assert.ok(draftPage.items.every((row) => typeof row.updatedAt === 'string'));
  const emptyDraftPage = await http(`/payroll-drafts?period=${f.period}&page=2`);
  assert.equal(emptyDraftPage.total, 3);
  assert.deepEqual(emptyDraftPage.items, []);
  ok('Real authentication, strict DTO, CSRF, own-write denial and manual command replay');
  const monthlyId = f.employeeIds.monthly;
  const monthlyPath = `/employees/${monthlyId}`;
  const today = new Date().toISOString().slice(0, 10);
  async function salaryInput(extra = {}) {
    const version = (await owner.query('SELECT version FROM employees WHERE id=$1', [monthlyId]))
      .rows[0].version;
    const lease = await http(`${monthlyPath}/edit-lease`, {
      method: 'POST',
      body: { expectedVersion: version },
      status: 201,
    });
    return {
      commandId: randomUUID(),
      leaseToken: lease.leaseToken,
      expectedVersion: version,
      amount: '31000.00',
      currency: 'INR',
      effectiveFrom: today,
      reason: 'Synthetic monthly salary revision',
      ...extra,
    };
  }
  const salary = await salaryInput();
  await http(`${monthlyPath}/salary/preview`, {
    actor: 'unlinked',
    method: 'POST',
    body: salary,
    status: 403,
  });
  await http(`${monthlyPath}/salary/preview`, {
    actor: 'viewer',
    method: 'POST',
    body: salary,
    status: 403,
  });
  const preview = await http(`${monthlyPath}/salary/preview`, { method: 'POST', body: salary });
  assert.equal(preview.requiresApproval, false);
  const saved = await http(`${monthlyPath}/salary`, {
    method: 'POST',
    body: { ...salary, previewHash: preview.previewHash, confirmed: true },
    status: 201,
  });
  assert.equal(saved.outcome, 'RECORDED');
  const salaryReplay = await http(`${monthlyPath}/salary`, {
    method: 'POST',
    body: { ...salary, previewHash: preview.previewHash, confirmed: true },
    status: 201,
  });
  assert.equal(salaryReplay.salaryId, saved.salaryId);
  assert.equal(salaryReplay.replayed, true);
  await http(`${monthlyPath}/salary`, {
    method: 'POST',
    body: { ...salary, amount: '32000.00', previewHash: preview.previewHash, confirmed: true },
    status: 409,
  });
  const correction = await salaryInput({ amount: '31500.00', correctsId: saved.salaryId });
  const cp = await http(`${monthlyPath}/salary/preview`, { method: 'POST', body: correction });
  await http(`${monthlyPath}/salary`, {
    method: 'POST',
    body: { ...correction, previewHash: cp.previewHash, confirmed: true },
    status: 201,
  });
  const past = new Date(Date.parse(today) - 7 * 86400000).toISOString().slice(0, 10);
  const backdated = await salaryInput({ amount: '30500.00', effectiveFrom: past });
  const bp = await http(`${monthlyPath}/salary/preview`, { method: 'POST', body: backdated });
  assert.equal(bp.requiresApproval, true);
  const countBefore = (
    await owner.query('SELECT count(*)::int n FROM salary_records WHERE employee_id=$1', [
      monthlyId,
    ])
  ).rows[0].n;
  const pending = await http(`${monthlyPath}/salary`, {
    method: 'POST',
    body: { ...backdated, previewHash: bp.previewHash, confirmed: true },
    status: 201,
  });
  assert.equal(pending.outcome, 'PENDING_APPROVAL');
  assert.equal(
    (
      await owner.query('SELECT count(*)::int n FROM salary_records WHERE employee_id=$1', [
        monthlyId,
      ])
    ).rows[0].n,
    countBefore,
  );
  const decision = {
    decision: 'APPROVED',
    comment: 'Independent backdated approval',
    confirmed: true,
  };
  await http(`/salary-requests/${pending.requestId}/decision`, {
    method: 'POST',
    body: decision,
    status: 403,
  });
  await http(`/salary-requests/${pending.requestId}/decision`, {
    actor: 'reviewer',
    method: 'POST',
    body: decision,
    status: 201,
  });
  assert.equal(
    (
      await owner.query('SELECT count(*)::int n FROM salary_records WHERE employee_id=$1', [
        monthlyId,
      ])
    ).rows[0].n,
    countBefore + 1,
  );
  ok(
    'Monthly live-link permissions, lease/version command replay, same-date correction and independent backdated approval',
  );
  async function policy(config = f.policyConfig, key = 'SYNTHETIC') {
    return http('/payroll-policies', {
      method: 'POST',
      body: {
        policyKey: key,
        effectiveFrom: '2026-01-01',
        config,
        reason: 'Explicit synthetic policy',
        confirmed: true,
      },
      status: 201,
    });
  }
  const p = await policy();
  const calc = (key, policyId = p.id) => ({
    employeeId: f.employeeIds[key],
    period: f.period,
    policyId,
    manualDraftId: drafts[key].id,
    expectedDraftVersion: drafts[key].version,
    pfEligible: true,
    esiEligible: true,
    stateCode: 'KA',
    ptAmount: '0.00',
    tdsAmount: '1000.00',
    leavingDate: null,
    unpaidDates: key === 'partial' ? ['2026-04-20'] : [],
  });
  await http('/payroll-calculations/preview', { method: 'POST', body: calc('full'), status: 409 });
  await http(`/payroll-policies/${p.id}/approve`, {
    method: 'POST',
    body: { comment: 'Own policy forbidden', confirmed: true },
    status: 403,
  });
  await http(`/payroll-policies/${p.id}/approve`, {
    actor: 'reviewer',
    method: 'POST',
    body: { comment: 'Independent synthetic approval', confirmed: true },
    status: 201,
  });
  const full = await http('/payroll-calculations/preview', {
    method: 'POST',
    body: calc('full'),
    status: 200,
  });
  assert.deepEqual(
    [full.gross, full.deductionTotal, full.net, full.deductions.pf, full.deductions.esi],
    ['40000.00', '3400.00', '36600.00', '1800.00', '300.00'],
  );
  assert.deepEqual(full.employerContributions, { pf: '1800.00', esi: '1300.00' });
  const partial = await http('/payroll-calculations/preview', {
    method: 'POST',
    body: calc('partial'),
    status: 200,
  });
  assert.deepEqual(
    [partial.employmentDays, partial.paidDays, partial.prorationDays, partial.gross, partial.net],
    [15, 14, 14, '19200.00', '16076.00'],
  );
  assert.equal(partial.earnings.bonuses, '1000.00');
  const ceilingConfig = structuredClone(f.policyConfig);
  ceilingConfig.esi.eligibilityCeiling = '21000.00';
  const ceilingPolicy = await policy(ceilingConfig, 'CEILING');
  await http(`/payroll-policies/${ceilingPolicy.id}/approve`, {
    actor: 'reviewer',
    method: 'POST',
    body: { comment: 'Explicit ceiling policy approval', confirmed: true },
    status: 201,
  });
  await http('/payroll-calculations/preview', {
    method: 'POST',
    body: calc('partial', ceilingPolicy.id),
    status: 409,
  });
  const stored = (
    await owner.query('SELECT deductions FROM payroll_draft_revisions WHERE id=$1', [
      drafts.full.revisionId,
    ])
  ).rows[0];
  assert.equal(stored.deductions.pf, '9999.00');
  await http('/payroll-calculations/preview', {
    actor: 'finance',
    method: 'POST',
    body: calc('full'),
    status: 403,
  });
  await http('/payroll-calculations/preview', {
    method: 'POST',
    body: { ...calc('full'), ptAmount: '1.00' },
    status: 400,
  });
  ok(
    'Independent policy activation, exact ledger/proration/caps/statutory substitution and immutable manual input',
  );
  const runBody = {
    ...command(),
    period: f.period,
    policyId: p.id,
    calculations: ['full', 'escaped'].map((key) => {
      const { period, policyId, ...input } = calc(key);
      return input;
    }),
    hrReviewerId: f.ids.reviewer,
    financeApproverId: f.ids.finance,
    directorApproverId: f.ids.director,
  };
  let run = await http('/payroll-runs', { method: 'POST', body: runBody, status: 201 });
  await http(`/payroll-delivery/runs/${run.id}`, { status: 404 });
  const replay = await http('/payroll-runs', { method: 'POST', body: runBody, status: 201 });
  assert.equal(replay.id, run.id);
  const config2 = structuredClone(f.policyConfig);
  config2.pf.employeePercent = '10';
  const p2 = await policy(config2);
  await http(`/payroll-policies/${p2.id}/approve`, {
    actor: 'reviewer',
    method: 'POST',
    body: { comment: 'Independent revision approval', confirmed: true },
    status: 201,
  });
  let detail = await http(`/payroll-runs/${run.id}`);
  assert.equal(detail.stale, true);
  await http(`/payroll-runs/${run.id}/actions`, {
    actor: 'reviewer',
    method: 'POST',
    body: { ...command(), expectedVersion: run.version, action: 'HR_REVIEW' },
    status: 409,
  });
  run = await http(`/payroll-runs/${run.id}/refresh`, {
    method: 'POST',
    body: { ...command(), expectedVersion: run.version },
    status: 201,
  });
  assert.equal(run.generation, 2);
  assert.equal(run.policy.policyId, p2.id);
  const other = await policy(f.policyConfig, 'OTHER_FAMILY');
  await http(`/payroll-policies/${other.id}/approve`, {
    actor: 'reviewer',
    method: 'POST',
    body: { comment: 'Other family approved', confirmed: true },
    status: 201,
  });
  detail = await http(`/payroll-runs/${run.id}`);
  assert.equal(detail.stale, false);
  const { policyId, ...ambiguous } = calc('full');
  await http('/payroll-calculations/preview', { method: 'POST', body: ambiguous, status: 409 });
  ok('Stale source denies approvals, refresh keeps immutable generations and same policy family');
  async function action(name, actor) {
    const body = { ...command(), expectedVersion: run.version, action: name };
    run = await http(`/payroll-runs/${run.id}/actions`, {
      actor,
      method: 'POST',
      body,
      status: 201,
    });
    const again = await http(`/payroll-runs/${run.id}/actions`, {
      actor,
      method: 'POST',
      body,
      status: 201,
    });
    assert.equal(again.version, run.version);
    assert.equal(again.replayed, true);
  }
  await http(`/payroll-runs/${run.id}/actions`, {
    actor: 'director',
    method: 'POST',
    body: { ...command(), expectedVersion: run.version, action: 'DIRECTOR_APPROVE' },
    status: 409,
  });
  await action('HR_REVIEW', 'reviewer');
  await action('FINANCE_APPROVE', 'finance');
  await action('DIRECTOR_APPROVE', 'director');
  await action('FINALIZE', 'hr');
  assert.equal(run.status, 'FINALIZED');
  const duplicate = await http('/payroll-runs', {
    method: 'POST',
    body: { ...runBody, ...command(), policyId: p2.id },
    status: 201,
  });
  let overlap = duplicate;
  for (const [name, actor] of [
    ['HR_REVIEW', 'reviewer'],
    ['FINANCE_APPROVE', 'finance'],
    ['DIRECTOR_APPROVE', 'director'],
  ])
    overlap = await http(`/payroll-runs/${overlap.id}/actions`, {
      actor,
      method: 'POST',
      body: { ...command(), expectedVersion: overlap.version, action: name },
      status: 201,
    });
  await http(`/payroll-runs/${overlap.id}/actions`, {
    method: 'POST',
    body: { ...command(), expectedVersion: overlap.version, action: 'FINALIZE' },
    status: 409,
  });
  assert.equal(
    (
      await owner.query(
        'SELECT count(*)::int n FROM payroll_finalized_allocations WHERE period_month=$1',
        [`${f.period}-01`],
      )
    ).rows[0].n,
    2,
  );
  ok('Assigned independent HR, Finance, Director approvals and idempotent immutable finalization');
  const delivery = `/payroll-delivery/runs/${run.id}`;
  await http(delivery, { actor: 'outsider', status: 403 });
  await http(delivery, { actor: 'viewer', status: 403 });
  await http(delivery, { actor: 'anonymous', status: 401 });
  await http(delivery, { actor: 'finance' });
  const slip = await http(`${delivery}/payslips/${f.employeeIds.escaped}`);
  const doc = await http(`${delivery}/payslips/${f.employeeIds.escaped}/download`, {
    method: 'POST',
    body: { commandId: randomUUID(), confirmed: true },
    status: 201,
  });
  assert.equal(doc.mimeType, 'text/html');
  assert.ok(doc.content.includes('&lt;script&gt;'));
  assert.ok(!doc.content.includes('<script>alert'));
  assert.ok(doc.content.includes('FINALIZED'));
  const prepBody = command();
  const prep = await http(`${delivery}/payment-preparations`, {
    method: 'POST',
    body: prepBody,
    status: 201,
  });
  assert.equal(prep.status, 'PREPARED');
  const prepReplay = await http(`${delivery}/payment-preparations`, {
    method: 'POST',
    body: prepBody,
    status: 201,
  });
  assert.equal(prepReplay.id, prep.id);
  const prepPath = `/payroll-delivery/payment-preparations/${prep.id}`;
  const csv = await http(`${prepPath}/download`, {
    actor: 'finance',
    method: 'POST',
    body: { commandId: randomUUID(), confirmed: true },
    status: 201,
  });
  assert.ok(csv.content.includes("'=CSV-ESCAPE"));
  assert.ok(!/account_number|bank_account/i.test(csv.content));
  const report = {
    ...command(),
    externalReference: 'SYNTHETIC-EXTERNAL-REFERENCE',
    paymentDate: '2026-05-07',
  };
  await http(`${prepPath}/external-payment`, { method: 'POST', body: report, status: 403 });
  await http(`${prepPath}/external-payment`, {
    actor: 'finance',
    method: 'POST',
    body: { ...report, paymentDate: '0000-01-01' },
    status: 400,
  });
  const paid = await http(`${prepPath}/external-payment`, {
    actor: 'finance',
    method: 'POST',
    body: report,
    status: 201,
  });
  assert.equal(paid.status, 'EXTERNALLY_REPORTED_PAID');
  const paidReplay = await http(`${prepPath}/external-payment`, {
    actor: 'finance',
    method: 'POST',
    body: report,
    status: 201,
  });
  assert.equal(paidReplay.replayed, true);
  await http(`${prepPath}/external-payment`, {
    actor: 'finance',
    method: 'POST',
    body: { ...report, commandId: randomUUID() },
    status: 409,
  });
  ok(
    'Protected escaped finalized HTML, safe exact manifest and assigned Finance external attestation',
  );
  await assert.rejects(
    owner.query('UPDATE payroll_runs SET version=version+1 WHERE id=$1', [run.id]),
  );
  await assert.rejects(
    owner.query('UPDATE payroll_run_lines SET snapshot=snapshot WHERE run_id=$1', [run.id]),
  );
  const before = slip.snapshot ?? slip;
  await http(`/payroll-drafts/${drafts.escaped.id}`, {
    method: 'PATCH',
    body: {
      ...command(),
      expectedVersion: drafts.escaped.version,
      ...components,
      earnings: { ...components.earnings, hra: '999.00' },
    },
    status: 200,
  });
  const after = await http(`${delivery}/payslips/${f.employeeIds.escaped}`);
  assert.deepEqual(after.snapshot ?? after, before);
  ok('Finalized SQL immutability and payslip isolation from later draft edits');
  console.log(`PASS ${passed} payroll integration groups`);
} finally {
  if (app) await app.close();
  if (owner) await owner.end();
  if (created) await admin.query(`DROP DATABASE ${database} WITH (FORCE)`);
  await admin.end();
}
