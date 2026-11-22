import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Client, Pool } from 'pg';
import { AuthenticationService } from '../apps/api/dist/auth/authentication.service.js';
import { FxRatesService } from '../apps/api/dist/fx-rates/fx-rates.service.js';
import { fxInput, fxQuery, fxResolve } from '../apps/api/dist/fx-rates/dto/fx-rates.dto.js';
const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL),
  runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href });
await admin.connect();
let created = false,
  owner,
  pool,
  passed = 0;
const ok = (label) => console.log(`PASS FX-DB-${String(++passed).padStart(2, '0')} ${label}`);
const denied = (work, status) => assert.rejects(work, (error) => error.status === status);
try {
  await admin.query(`CREATE DATABASE ${name}`);
  created = true;
  ownerUrl.pathname = runtimeUrl.pathname = `/${name}`;
  execFileSync(process.execPath, ['scripts/migrate.mjs'], {
    env: { ...process.env, MIGRATION_DATABASE_URL: ownerUrl.href },
    stdio: 'pipe',
    windowsHide: true,
  });
  owner = new Client({ connectionString: ownerUrl.href });
  await owner.connect();
  pool = new Pool({ connectionString: runtimeUrl.href, max: 6 });
  const actor = randomUUID(),
    reader = randomUUID();
  await owner.query(
    `INSERT INTO users(id,email,full_name,status,is_hr_manager) VALUES
    ($1,'reference.hr@acme.test','Synthetic HR','ACTIVE',true),($2,'reference.reader@acme.test','Synthetic Reader','ACTIVE',false)`,
    [actor, reader],
  );
  await owner.query('UPDATE users SET permissions=ARRAY[]::text[] WHERE id=$1', [reader]);
  const auth = new AuthenticationService(pool, 'synthetic-fx-test-key-at-least-32-characters'),
    service = new FxRatesService(pool, auth, 7);
  const login = async (email) => {
    const i = await auth.issue(email);
    return auth.verify(i.challengeId, i.code);
  };
  const hr = await login('reference.hr@acme.test'),
    member = await login('reference.reader@acme.test');
  await denied(service.list('', { offset: 0 }), 401);
  await denied(service.list(member.token, { offset: 0 }), 403);
  ok('anonymous and no-read access denied');
  await owner.query("UPDATE users SET permissions=ARRAY['read'] WHERE id=$1", [reader]);
  assert.equal((await service.list(member.token, { offset: 0 })).total, 0);
  ok('read member views empty history');
  await owner.query(
    "INSERT INTO currencies(code,minor_units) VALUES('USD',2),('EUR',2),('INR',2),('GBP',2)",
  );
  const data = {
    base: 'USD',
    quote: 'EUR',
    effectiveDate: '2026-11-20',
    rate: '0.8',
    source: 'Synthetic treasury',
    reason: 'Synthetic initial quote',
    expectedRevision: 0,
  };
  await denied(service.append(member.token, member.csrf, data), 403);
  await denied(service.append(hr.token, '', data), 403);
  await denied(service.append(hr.token, 'wrong', data), 403);
  ok('member writes and invalid CSRF rejected');
  const invalid = [
    { ...data, rate: '0' },
    { ...data, rate: '-1' },
    { ...data, rate: '1e2' },
    { ...data, rate: '01' },
    { ...data, rate: '1.123456789' },
    { ...data, rate: '10000000000' },
    { ...data, effectiveDate: '2026-02-30' },
    { ...data, quote: 'USD' },
    { ...data, source: '   ' },
    { ...data, reason: '' },
    { ...data, actorId: reader },
  ];
  for (const row of invalid) assert.equal(fxInput.safeParse(row).success, false);
  ok('strict DTO rejects invalid rate, date, pair, reason/source and actor spoof');
  assert.equal(fxInput.safeParse({ ...data, rate: '9999999999.99999999' }).success, true);
  assert.equal(fxInput.safeParse({ ...data, rate: '0.00000001' }).success, true);
  ok('numeric(18,8) exact boundary rates allowed');
  const first = await service.append(hr.token, hr.csrf, data);
  assert.equal(first.revision, 1);
  assert.equal(first.rate, '0.80000000');
  assert.equal(first.created_by, actor);
  ok('first revision uses exact rate and session actor');
  await denied(service.append(hr.token, hr.csrf, data), 409);
  ok('duplicate expected revision rejected');
  const second = await service.append(hr.token, hr.csrf, {
    ...data,
    rate: '0.9',
    reason: 'Synthetic correction',
    expectedRevision: 1,
  });
  assert.notEqual(first.id, second.id);
  assert.equal(second.revision, 2);
  assert.equal(
    (await owner.query('SELECT rate::text FROM fx_rate_revisions WHERE id=$1', [first.id])).rows[0]
      .rate,
    '0.80000000',
  );
  ok('correction appends without changing prior record');
  const snapshot = (
    await owner.query(
      "SELECT payload FROM audit_logs WHERE entity_id=$1 AND entity_type='FX_RATE'",
      [second.id],
    )
  ).rows[0].payload;
  assert.equal(snapshot.before.id, first.id);
  assert.equal(snapshot.after.id, second.id);
  assert.equal(Number(snapshot.before.rate), 0.8);
  assert.equal(Number(snapshot.after.rate), 0.9);
  ok('audit contains exact before/after revision provenance');
  for (const sql of [
    'UPDATE fx_rate_revisions SET rate=1',
    'DELETE FROM fx_rate_revisions',
    'TRUNCATE fx_rate_revisions',
  ])
    await assert.rejects(owner.query(sql), (e) => e.code === '55000');
  ok('SQL update/delete/truncate blocked');
  const direct = await service.resolve(member.token, {
    base: 'USD',
    quote: 'EUR',
    asOf: '2026-11-20',
  });
  assert.equal(direct.rate, '0.9');
  assert.equal(direct.path[0].rate.id, second.id);
  ok('historical lookup uses latest same-day revision');
  const inverse = await service.resolve(hr.token, {
    base: 'EUR',
    quote: 'USD',
    asOf: '2026-11-20',
  });
  assert.equal(inverse.path[0].inverse, true);
  assert.ok(inverse.rate.startsWith('1.111111'));
  ok('inverse lookup preserves leg provenance');
  await service.append(hr.token, hr.csrf, { ...data, quote: 'INR', rate: '80' });
  const pivot = await service.resolve(hr.token, { base: 'EUR', quote: 'INR', asOf: '2026-11-20' });
  assert.equal(pivot.path.length, 2);
  assert.equal(pivot.path[0].inverse, true);
  ok('missing pair resolves through USD');
  await service.append(hr.token, hr.csrf, { ...data, effectiveDate: '2026-11-21', rate: '0.95' });
  assert.equal(
    (await service.resolve(hr.token, { base: 'USD', quote: 'EUR', asOf: '2026-11-20' })).rate,
    '0.9',
  );
  ok('future effective rate excluded from earlier as-of valuation');
  await denied(service.resolve(hr.token, { base: 'USD', quote: 'EUR', asOf: '2026-12-01' }), 422);
  await denied(service.resolve(hr.token, { base: 'USD', quote: 'GBP', asOf: '2026-11-20' }), 422);
  ok('stale or missing historical paths rejected');
  assert.equal(
    (await service.resolve(hr.token, { base: 'EUR', quote: 'EUR', asOf: '2026-11-20' })).rate,
    '1',
  );
  await denied(service.resolve(hr.token, { base: 'ZZZ', quote: 'ZZZ', asOf: '2026-11-20' }), 422);
  ok('identity conversion requires configured currency');
  const strict = new FxRatesService(pool, auth, 1);
  await denied(strict.resolve(hr.token, { base: 'USD', quote: 'EUR', asOf: '2026-11-23' }), 422);
  ok('constructor staleness policy honored');
  await owner.query("UPDATE currencies SET is_active=false WHERE code='EUR'");
  await denied(service.append(hr.token, hr.csrf, { ...data, expectedRevision: 2 }), 409);
  assert.equal(
    (await service.resolve(hr.token, { base: 'USD', quote: 'EUR', asOf: '2026-11-20' })).rate,
    '0.9',
  );
  ok('inactive currency blocks new rates but historical reads still work');
  await owner.query("UPDATE currencies SET is_active=true WHERE code='EUR'");
  await owner.query('UPDATE users SET is_hr_manager=true WHERE id=$1', [reader]);
  const race = await Promise.allSettled(
    ['0.91', '0.92'].map((rate, index) => {
      const session = index === 0 ? hr : member;
      return service.append(session.token, session.csrf, { ...data, rate, expectedRevision: 2 });
    }),
  );
  assert.equal(race.filter((r) => r.status === 'fulfilled').length, 1);
  ok('independent HR competing revisions have exactly one winner');
  const blocker = new Client({ connectionString: ownerUrl.href });
  await blocker.connect();
  try {
    await blocker.query('BEGIN');
    await blocker.query("UPDATE currencies SET is_active=false WHERE code='USD'");
    const waiting = service.append(hr.token, hr.csrf, { ...data, effectiveDate: '2026-11-22' });
    await new Promise((r) => setTimeout(r, 100));
    await blocker.query('COMMIT');
    await denied(waiting, 409);
    ok('concurrent deactivation rechecked after lock wait');
  } finally {
    await blocker.end();
  }
  await owner.query("UPDATE currencies SET is_active=true WHERE code='USD'");
  const count = (await owner.query('SELECT count(*)::int n FROM fx_rate_revisions')).rows[0].n;
  await owner.query(
    `CREATE FUNCTION fail_fx_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity_type='FX_RATE' THEN RAISE EXCEPTION 'Synthetic audit failure'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_fx_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fail_fx_audit()`,
  );
  await assert.rejects(service.append(hr.token, hr.csrf, { ...data, effectiveDate: '2026-11-23' }));
  assert.equal(
    (await owner.query('SELECT count(*)::int n FROM fx_rate_revisions')).rows[0].n,
    count,
  );
  ok('audit failure rolls back rate append');
  const page = await service.list(hr.token, {
    base: 'USD',
    quote: 'EUR',
    asOf: '2026-11-20',
    offset: 0,
  });
  assert.equal(page.total, 3);
  assert.ok(page.items.every((r) => r.effective_date === '2026-11-20'));
  ok('pair/date filtering retains full revision history');
  assert.equal(fxQuery.safeParse({ offset: -1 }).success, false);
  assert.equal(fxResolve.safeParse({ base: 'USD', quote: 'EUR', asOf: 'invalid' }).success, false);
  ok('invalid list/resolution inputs rejected');
  console.log(`${passed} real PostgreSQL FX checks passed`);
} finally {
  await pool?.end();
  await owner?.end();
  if (created) await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
  await admin.end();
}
