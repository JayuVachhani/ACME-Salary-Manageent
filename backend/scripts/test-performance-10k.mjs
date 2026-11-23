import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { Client, Pool } from 'pg';
import { createApp } from '../dist/app.js';
import { AuthenticationService } from '../dist/auth/authentication.service.js';
import {
  createPayrollWorkflowFixture,
  manualPayrollComponents,
  seedApprovedPayrollPolicy,
} from './payroll-workflow-fixtures.mjs';

// No installed application database is ever seeded or reset by this benchmark.
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL);
const runtimeUrl = new URL(process.env.DATABASE_URL);
assert.ok(
  ['127.0.0.1', 'localhost'].includes(ownerUrl.hostname) && ownerUrl.port === '55432',
  'Use preserved local test cluster on55432',
);
const database = `acme_perf_${randomUUID().replaceAll('-', '')}`;
const readsOnly = process.argv.includes('--reads-only');
assert.match(database, /^acme_perf_[a-f0-9]{32}$/);
const admin = new Client({ connectionString: ownerUrl.href });
await admin.connect();
let owner,
  app,
  created = false;
const output = new URL('../.local/performance-10k/', import.meta.url);
await mkdir(output, { recursive: true });
const report = {
  startedAt: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    cpus: os.availableParallelism(),
    memoryGB: Math.round(os.totalmem() / 1073741824),
    poolMax: 10,
    statementTimeoutMs: 5000,
    database: 'disposable PostgreSQL55432',
    app: 'real Nest HTTP, loopback, same host as load generator/database',
  },
  workforce: 10000,
  mode: readsOnly ? 'read-and-calculation-recheck' : 'full-payroll-lifecycle',
  scenarios: [],
  errors: [],
  gates: { interactiveP95Ms: 1000, batch100P95Ms: 10000, unexpectedErrors: 0 },
  limitations: [
    'Engineering gates, not an approved production SLO.',
    'Synthetic single-host warm-cache workload, not production sizing or long soak.',
    '100 employees per run; no unbounded 10000-person HTTP request.',
  ],
};
const delay = monitorEventLoopDelay({ resolution: 20 });
const percentile = (values, p) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.ceil(values.length * p) - 1)
  ] ?? 0;
function summary(name, latencies, elapsed, concurrency, extra = {}) {
  const result = {
    name,
    count: latencies.length,
    concurrency,
    seconds: +(elapsed / 1000).toFixed(2),
    requestsPerSecond: +((latencies.length * 1000) / elapsed).toFixed(2),
    p50Ms: +percentile(latencies, 0.5).toFixed(2),
    p95Ms: +percentile(latencies, 0.95).toFixed(2),
    p99Ms: +percentile(latencies, 0.99).toFixed(2),
    maxMs: +Math.max(...latencies).toFixed(2),
    ...extra,
  };
  report.scenarios.push(result);
  console.log(JSON.stringify(result));
  return result;
}
async function workload(name, count, concurrency, work, extra) {
  const latencies = [];
  let next = 0;
  const start = performance.now();
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < count) {
        const index = next++;
        const began = performance.now();
        try {
          await work(index);
        } catch (error) {
          report.errors.push({ scenario: name, index, message: error.message });
        }
        latencies.push(performance.now() - began);
      }
    }),
  );
  return summary(name, latencies, performance.now() - start, concurrency, extra);
}
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
  const fixture = await createPayrollWorkflowFixture(owner, { drafts: false, statutory: false });
  const policy = await seedApprovedPayrollPolicy(owner, fixture);
  const seedStart = performance.now();
  const employees = Array.from({ length: 10000 }, (_, index) => ({
    n: index + 1,
    id: randomUUID(),
    request: randomUUID(),
    salary: randomUUID(),
    draft: randomUUID(),
    revision: randomUUID(),
  }));
  const json = JSON.stringify(employees);
  await owner.query('BEGIN');
  await owner.query(
    `INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) SELECT x.id::uuid,'PERF-'||lpad(x.n::text,5,'0'),'perf.'||x.n||'@acme.test','Synthetic',lpad(x.n::text,5,'0'),'2020-01-01',$2 FROM jsonb_to_recordset($1::jsonb) x(n int,id text)`,
    [json, fixture.ids.hr],
  );
  await owner.query(
    `INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by) SELECT x.id::uuid,'IN',$2,$3,'ACTIVE','2020-01-01','Synthetic capacity fixture',$4 FROM jsonb_to_recordset($1::jsonb) x(id text)`,
    [json, fixture.department, fixture.designation, fixture.ids.hr],
  );
  await owner.query(
    `INSERT INTO salary_change_requests(id,employee_id,requested_by,submitted_business_date,effective_from,expected_employee_version,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,reason,conversion_meta,request_kind) SELECT x.request::uuid,e.id,$2,(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,'2020-01-01',e.version,30000,'INR','IN','INR',c.version,2,'HALF_UP','Synthetic capacity initial','{}','INITIAL' FROM jsonb_to_recordset($1::jsonb) x(id text,request text) JOIN employees e ON e.id=x.id::uuid CROSS JOIN country_rules c WHERE c.country_code='IN'`,
    [json, fixture.ids.hr],
  );
  await owner.query(
    `INSERT INTO salary_approval_decisions(request_id,decision,decided_by,comment) SELECT x.request::uuid,'APPROVED',$2,'Independent synthetic capacity approval' FROM jsonb_to_recordset($1::jsonb) x(request text)`,
    [json, fixture.ids.reviewer],
  );
  await owner.query(
    `INSERT INTO salary_records(id,employee_id,approval_request_id,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,approval_status,change_reason,conversion_meta,created_by) SELECT x.salary::uuid,r.employee_id,r.id,r.monthly_amount,r.currency,r.country_code,r.default_currency,r.country_rule_version,r.decimal_places,r.rounding_mode,r.effective_from,r.submitted_business_date,'ACTIVE',r.reason,r.conversion_meta,r.requested_by FROM jsonb_to_recordset($1::jsonb) x(request text,salary text) JOIN salary_change_requests r ON r.id=x.request::uuid`,
    [json],
  );
  await owner.query(
    `INSERT INTO payroll_drafts(id,employee_id,period_month,period_end,pay_date) SELECT x.draft::uuid,x.id::uuid,'2026-04-01','2026-04-30','2026-05-07' FROM jsonb_to_recordset($1::jsonb) x(id text,draft text)`,
    [json],
  );
  const components = manualPayrollComponents();
  await owner.query(
    `INSERT INTO payroll_draft_revisions(id,draft_id,version,employee_snapshot,earnings,deductions,reason,created_by) SELECT x.revision::uuid,x.draft::uuid,1,jsonb_build_object('id',e.id,'code',e.employee_code,'name',e.first_name||' '||e.last_name,'email',e.email::text),$2::jsonb,$3::jsonb,'Synthetic capacity manual components',$4 FROM jsonb_to_recordset($1::jsonb) x(id text,draft text,revision text) JOIN employees e ON e.id=x.id::uuid`,
    [
      json,
      JSON.stringify(components.earnings),
      JSON.stringify(components.deductions),
      fixture.ids.hr,
    ],
  );
  await owner.query('COMMIT');
  await owner.query('ANALYZE');
  report.seedSeconds = +((performance.now() - seedStart) / 1000).toFixed(2);
  assert.equal(
    (await owner.query("SELECT count(*)::int n FROM employees WHERE employee_code LIKE 'PERF-%'"))
      .rows[0].n,
    10000,
  );
  process.env.DATABASE_URL = runtimeUrl.href;
  process.env.APP_ORIGIN = 'http://localhost:5998';
  process.env.NODE_ENV = 'test';
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const auth = app.get(AuthenticationService);
  const sessions = {};
  for (let i = 0; i < 25; i++) {
    fixture.emails[`reader${i}`] = `perf.reader${i}@acme.test`;
    await owner.query(
      "INSERT INTO users(id,email,full_name,status,is_hr_manager,permissions) VALUES($1,$2,$3,'ACTIVE',true,ARRAY['read'])",
      [randomUUID(), fixture.emails[`reader${i}`], `Synthetic load reader ${i}`],
    );
  }
  for (const key of [
    'hr',
    'reviewer',
    'finance',
    'director',
    ...Array.from({ length: 25 }, (_, i) => `reader${i}`),
  ]) {
    const issued = await auth.issue(fixture.emails[key]);
    sessions[key] = await auth.verify(issued.challengeId, issued.code);
    assert.ok(sessions[key]);
  }
  const pool = app.get(Pool);
  let draftListQuery;
  const instrumented = new WeakSet();
  pool.on('acquire', (client) => {
    if (instrumented.has(client)) return;
    instrumented.add(client);
    const query = client.query.bind(client);
    client.query = (...args) => {
      if (!draftListQuery && typeof args[0] === 'string' && args[0].includes('WITH live_employees'))
        draftListQuery = { text: args[0], values: args[1] };
      return query(...args);
    };
  });
  const draftSource = await readFile(
    new URL('../src/payroll-drafts/payroll-drafts.service.ts', import.meta.url),
    'utf8',
  );
  const selectSql = draftSource.match(/const select = `([^`]+)`/)?.[1];
  const fromSql = draftSource.match(/const from = `([^`]+)`/)?.[1];
  if (selectSql && fromSql) {
    const plan = await owner.query(
      `EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT ${selectSql} ${fromSql} WHERE d.period_month='2026-04-01' AND (r.employee_snapshot->>'code' ILIKE '%PERF-%' OR r.employee_snapshot->>'name' ILIKE '%PERF-%' OR r.employee_snapshot->>'email' ILIKE '%PERF-%') ORDER BY d.period_month DESC,d.updated_at DESC,d.id LIMIT 25 OFFSET 0`,
    );
    await writeFile(
      new URL('draft-list-plan.json', output),
      JSON.stringify(plan.rows[0]['QUERY PLAN'], null, 2),
    );
  }
  let peakWaiting = 0;
  let peakRss = process.memoryUsage().rss;
  let peakHeap = process.memoryUsage().heapUsed;
  const cpuStart = process.cpuUsage();
  const measuredStart = performance.now();
  const eventLoopStart = performance.eventLoopUtilization();
  const sampler = setInterval(() => {
    peakWaiting = Math.max(peakWaiting, pool.waitingCount);
    peakRss = Math.max(peakRss, process.memoryUsage().rss);
    peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed);
  }, 20);
  delay.enable();
  async function http(path, { method = 'GET', body, actor = 'hr', expected = 200 } = {}) {
    const session = sessions[actor];
    const response = await fetch(base + '/api/v1' + path, {
      method,
      headers: {
        Origin: process.env.APP_ORIGIN,
        'Content-Type': 'application/json',
        Cookie: `acme_session=${session.token}`,
        'X-CSRF-Token': session.csrf,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    const data = await response.json();
    assert.equal(
      response.status,
      expected,
      `${path}: ${response.status} ${JSON.stringify(data).slice(0, 300)}`,
    );
    return data;
  }
  const command = () => ({
    commandId: randomUUID(),
    confirmed: true,
    reason: 'Synthetic performance verification',
  });
  const calc = (employee) => ({
    employeeId: employee.id,
    manualDraftId: employee.draft,
    expectedDraftVersion: 1,
    pfEligible: false,
    esiEligible: false,
    stateCode: 'KA',
    ptAmount: '0.00',
    tdsAmount: '0.00',
    leavingDate: null,
    unpaidDates: [],
  });
  try {
    // Small warm-up excluded from timed scenarios.
    for (let i = 0; i < 10; i++) await http('/salary/workspace?search=PERF-&pageSize=25&page=1');
    for (const concurrency of [1, 10, 25]) {
      await workload(`salary-workspace-c${concurrency}`, 150, concurrency, async (i) => {
        const data = await http(
          `/salary/workspace?search=PERF-&pageSize=25&page=${1 + (i % 400)}`,
          { actor: `reader${i % concurrency}` },
        );
        assert.equal(data.total, 10000);
        assert.equal(data.items.length, 25);
        assert.ok(data.items.every((row) => row.current.amount === '30000.0000'));
      });
    }
    await workload('directory-search-deep-page', 100, 10, async (i) => {
      const data = await http(`/employees?search=PERF-&pageSize=100&page=${1 + i}`, {
        actor: `reader${i % 10}`,
      });
      assert.equal(data.total, 10000);
      assert.equal(data.items.length, 100);
    });
    await workload('salary-history', 150, 10, async (i) => {
      const data = await http(`/employees/${employees[i].id}/salary?page=1`, {
        actor: `reader${i % 10}`,
      });
      assert.equal(data.current.amount, '30000.0000');
    });
    await workload('payroll-draft-pages', 100, 10, async (i) => {
      const data = await http(`/payroll-drafts?period=2026-04&search=PERF-&page=${1 + i}`, {
        actor: `reader${i % 10}`,
      });
      assert.equal(data.total, 10000);
      assert.equal(data.items.length, 25);
    });
    await workload('calculation-preview', 200, 10, async (i) => {
      const result = await http('/payroll-calculations/preview', {
        method: 'POST',
        body: { ...calc(employees[i]), period: fixture.period, policyId: policy.id },
      });
      assert.equal(result.gross, '40000.00');
      assert.equal(result.net, '39900.00');
    });
    const conflictStart = performance.now();
    const employee = employees[0];
    const version = (await owner.query('SELECT version FROM employees WHERE id=$1', [employee.id]))
      .rows[0].version;
    const attempts = await Promise.all(
      Array.from({ length: 10 }, async () => {
        const r = await fetch(`${base}/api/v1/employees/${employee.id}/edit-lease`, {
          method: 'POST',
          headers: {
            Origin: process.env.APP_ORIGIN,
            'Content-Type': 'application/json',
            Cookie: `acme_session=${sessions.hr.token}`,
            'X-CSRF-Token': sessions.hr.csrf,
          },
          body: JSON.stringify({ expectedVersion: version }),
        });
        return { status: r.status, body: await r.json() };
      }),
    );
    const winners = attempts.filter((r) => r.status === 201);
    assert.equal(winners.length, 1);
    assert.ok(attempts.filter((r) => r.status !== 201).every((r) => r.status === 423));
    await http(`/employees/${employee.id}/edit-lease/release`, {
      method: 'POST',
      body: { leaseToken: winners[0].body.leaseToken },
      expected: 201,
    });
    report.leaseContention = {
      contenders: 10,
      winners: 1,
      expectedConflicts: 9,
      elapsedMs: +(performance.now() - conflictStart).toFixed(2),
    };
    if (!readsOnly) {
      const runs = [];
      await workload(
        'create-run-100-employees',
        100,
        1,
        async (i) => {
          const run = await http('/payroll-runs', {
            method: 'POST',
            expected: 201,
            body: {
              ...command(),
              policyId: policy.id,
              period: fixture.period,
              calculations: employees.slice(i * 100, (i + 1) * 100).map(calc),
              hrReviewerId: fixture.ids.reviewer,
              financeApproverId: fixture.ids.finance,
              directorApproverId: fixture.ids.director,
            },
          });
          assert.equal(run.employeeCount, 100);
          assert.equal(run.stale, false);
          runs.push(run);
          if ((i + 1) % 10 === 0)
            console.log(
              `PERF progress: ${(i + 1) * 100}/10000 employees calculated into bounded runs`,
            );
        },
        { employeesPerRequest: 100, employeesTotal: 10000 },
      );
      await workload(
        'review-and-finalize-run-100',
        runs.length,
        1,
        async (i) => {
          let run = runs[i];
          for (const [action, actor] of [
            ['HR_REVIEW', 'reviewer'],
            ['FINANCE_APPROVE', 'finance'],
            ['DIRECTOR_APPROVE', 'director'],
            ['FINALIZE', 'hr'],
          ])
            run = await http(`/payroll-runs/${run.id}/actions`, {
              method: 'POST',
              actor,
              expected: 201,
              body: { ...command(), action, expectedVersion: run.version },
            });
          assert.equal(run.status, 'FINALIZED');
        },
        { employeesPerRun: 100, employeesTotal: 10000, httpRequestsPerRun: 4 },
      );
      assert.equal(
        (await owner.query('SELECT count(*)::int n FROM payroll_finalized_allocations')).rows[0].n,
        10000,
      );
      await workload('finalized-payslip-pages', 100, 10, async (i) => {
        const result = await http(`/payroll-delivery/runs/${runs[i].id}/payslips?page=1`);
        assert.equal(result.total, 100);
        assert.equal(result.items.length, 25);
      });
      report.finalizedEmployees = 10000;
    }
    if (draftListQuery) {
      const plan = await owner.query(
        'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) ' + draftListQuery.text,
        draftListQuery.values,
      );
      await writeFile(
        new URL('draft-list-plan.json', output),
        JSON.stringify(plan.rows[0]['QUERY PLAN'], null, 2),
      );
    }
  } finally {
    clearInterval(sampler);
    delay.disable();
    report.resources = {
      cpuSeconds: +(
        (process.cpuUsage(cpuStart).user + process.cpuUsage(cpuStart).system) /
        1000000
      ).toFixed(2),
      cpuPercentOneCore: +(
        ((process.cpuUsage(cpuStart).user + process.cpuUsage(cpuStart).system) /
          1000 /
          (performance.now() - measuredStart)) *
        100
      ).toFixed(2),
      eventLoopUtilization: +performance
        .eventLoopUtilization(eventLoopStart)
        .utilization.toFixed(4),
      peakWaitingConnections: peakWaiting,
      peakRssMB: +(peakRss / 1048576).toFixed(1),
      peakHeapMB: +(peakHeap / 1048576).toFixed(1),
      eventLoopP95Ms: +(delay.percentile(95) / 1000000).toFixed(2),
      eventLoopMaxMs: +(delay.max / 1000000).toFixed(2),
      sharedLoadGenerator: true,
    };
  }
  report.passed = report.errors.length === 0;
} catch (error) {
  report.errors.push({ scenario: 'setup-or-correctness', message: error.message });
  report.passed = false;
} finally {
  if (app) await app.close();
  if (owner) await owner.end();
  if (created) await admin.query(`DROP DATABASE ${database} WITH (FORCE)`);
  await admin.end();
  report.finishedAt = new Date().toISOString();
  report.latencyGateFailures = report.scenarios
    .filter(
      (s) =>
        s.p95Ms >
        (s.name.includes('run-100') ? report.gates.batch100P95Ms : report.gates.interactiveP95Ms),
    )
    .map((s) => s.name);
  report.correctnessPassed = report.passed;
  report.passed = report.correctnessPassed && report.latencyGateFailures.length === 0;
  await writeFile(new URL('results.json', output), JSON.stringify(report, null, 2));
  await writeFile(
    new URL(readsOnly ? 'read-recheck-results.json' : 'full-lifecycle-results.json', output),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      passed: report.passed,
      errors: report.errors,
      latencyGateFailures: report.latencyGateFailures,
      results: 'backend/.local/performance-10k/results.json',
    }),
  );
  if (!report.passed || report.latencyGateFailures.length) process.exitCode = 1;
}
