import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client, Pool } from 'pg';
import { AuthenticationService } from '../apps/api/dist/auth/authentication.service.js';
import { TeamService } from '../apps/api/dist/team/team.service.js';
import { linkageInput } from '../apps/api/dist/team/dto/team.dto.js';
import { createApp } from '../apps/api/dist/app.js';

const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL),
  runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href });
await admin.connect();
let created = false,
  owner,
  pool,
  app,
  passed = 0;
const ok = (label) => console.log(`PASS LINK-${String(++passed).padStart(2, '0')} ${label}`);
const denied = (p, status) => assert.rejects(p, (error) => error.status === status);
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
  pool = new Pool({ connectionString: runtimeUrl.href, max: 8 });
  const role = (
    await pool.query('SELECT current_user,usesuper FROM pg_user WHERE usename=current_user')
  ).rows[0];
  assert.equal(role.current_user, 'acme_app');
  assert.equal(role.usesuper, false);
  ok('restricted runtime role');
  const [a, b, reader, other, e1, e2, e3] = Array.from({ length: 7 }, () => randomUUID());
  for (const [id, email, hr] of [
    [a, 'a', true],
    [b, 'b', true],
    [reader, 'reader', false],
    [other, 'other', false],
  ])
    await owner.query(
      "INSERT INTO users(id,email,full_name,status,is_hr_manager) VALUES($1,$2,'Synthetic Account','ACTIVE',$3)",
      [id, `${email}@acme.test`, hr],
    );
  for (const [id, code] of [
    [e1, 'SYN1'],
    [e2, 'SYN2'],
    [e3, 'SYN3'],
  ])
    await owner.query(
      "INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,$2,$3,'Synthetic','Employee','2026-01-01',$4)",
      [id, code, `${code}@acme.test`, a],
    );
  const key = 'synthetic-linkage-test-key-at-least-32-characters',
    auth = new AuthenticationService(pool, key),
    team = new TeamService(pool, auth);
  const login = async (email) => {
    const c = await auth.issue(`${email}@acme.test`);
    return auth.verify(c.challengeId, c.code);
  };
  const sa = await login('a'),
    sb = await login('b'),
    sr = await login('reader');
  const version = async (id) =>
    (await owner.query('SELECT team_version FROM users WHERE id=$1', [id])).rows[0].team_version;
  const input = async (id, employeeId) => ({
    expectedVersion: await version(id),
    employeeId,
    reason: 'Synthetic verified identity check',
    confirmed: true,
  });
  const baseline = async () =>
    (
      await owner.query(
        `SELECT (SELECT count(*)::int FROM audit_logs) audit,
    (SELECT authorization_version FROM users WHERE id=$1) authorization,
    (SELECT team_version FROM users WHERE id=$1) version`,
        [reader],
      )
    ).rows[0];
  const before = await baseline();
  await denied(team.linkEmployee('', sa.csrf, reader, await input(reader, e1)), 403);
  await denied(team.linkEmployee(sr.token, sr.csrf, other, await input(other, e1)), 403);
  await denied(team.linkEmployee(sa.token, 'wrong', reader, await input(reader, e1)), 403);
  await denied(team.linkEmployee(sa.token, sa.csrf, a, await input(a, e1)), 403);
  assert.deepEqual(await baseline(), before);
  ok('anonymous non-HR CSRF and self-link denied atomically');
  for (const body of [
    { ...(await input(reader, e1)), confirmed: false },
    { ...(await input(reader, e1)), reason: ' ' },
    { ...(await input(reader, e1)), actorId: a },
    { ...(await input(reader, e1)), employeeId: 'invalid' },
    { ...(await input(reader, e1)), expectedVersion: 0 },
  ])
    assert.equal(linkageInput.safeParse(body).success, false);
  ok('strict confirmation reason identity and version input');
  await assert.rejects(
    pool.query('UPDATE users SET employee_id=$1 WHERE id=$2', [e1, reader]),
    (e) => e.code === '42501',
  );
  await assert.rejects(
    pool.query(
      "INSERT INTO users(email,full_name,status,employee_id) VALUES('bypass@acme.test','Synthetic','ACTIVE',$1)",
      [e1],
    ),
    (e) => e.code === '42501',
  );
  ok('SQL cannot link without independent confirmed context or insert a prelinked account');
  const direct = await pool.connect();
  try {
    for (const [actor, confirmed] of [
      [reader, 'true'],
      [a, 'false'],
    ]) {
      await direct.query('BEGIN');
      await direct.query(
        `SELECT set_config('acme.link_actor',$1,true),set_config('acme.link_reason','Synthetic forbidden SQL',true),set_config('acme.link_confirmed',$2,true)`,
        [actor, confirmed],
      );
      await assert.rejects(
        direct.query('UPDATE users SET employee_id=$1 WHERE id=$2', [e1, other]),
        (e) => e.code === '42501',
      );
      await direct.query('ROLLBACK');
    }
  } finally {
    await direct.query('ROLLBACK');
    direct.release();
  }
  ok('database checks HR role and confirmation independently of HTTP');
  await owner.query("INSERT INTO currencies(code,minor_units) VALUES('USD',2)");
  const snapshot = async (user) =>
    (
      await owner.query(
        `INSERT INTO report_snapshots(owner_id,authorization_version,as_of,target_currency,filters,payload,expires_at)
    SELECT id,authorization_version,'2026-11-22','USD','{}','{}',now()+interval '30 minutes' FROM users WHERE id=$1 RETURNING id`,
        [user],
      )
    ).rows[0].id;
  const owned = await snapshot(reader),
    affected = await snapshot(a),
    unrelated = await snapshot(b);
  await owner.query(
    'INSERT INTO report_snapshot_employees(snapshot_id,employee_id) VALUES($1,$2)',
    [affected, e1],
  );
  const challenge = await auth.issue('reader@acme.test');
  await owner.query(
    "INSERT INTO record_locks(employee_id,locked_by,token_hash,expires_at) VALUES($1,$2,'synthetic',now()+interval '1 minute')",
    [e1, reader],
  );
  const originalVersion = await version(reader),
    linked = await team.linkEmployee(sa.token, sa.csrf, reader, await input(reader, e1));
  assert.equal(linked.employee_id, e1);
  assert.equal(linked.team_version, originalVersion + 1);
  assert.equal(await auth.authenticate(sr.token), null);
  assert.equal(await auth.verify(challenge.challengeId, challenge.code), null);
  assert.equal(
    (await owner.query('SELECT count(*)::int n FROM record_locks WHERE locked_by=$1', [reader]))
      .rows[0].n,
    0,
  );
  ok('link saves advances version revokes sessions OTP and leases');
  const snapshots = (await owner.query('SELECT id,invalidated_at FROM report_snapshots')).rows;
  assert.ok(snapshots.find((s) => s.id === owned).invalidated_at);
  assert.ok(snapshots.find((s) => s.id === affected).invalidated_at);
  assert.equal(snapshots.find((s) => s.id === unrelated).invalidated_at, null);
  ok('owner and employee membership snapshots invalidated selectively');
  const audit = (
    await owner.query(
      "SELECT actor_id,description,payload FROM audit_logs WHERE change_type='EMPLOYEE_LINK_CHANGED' AND entity_id=$1",
      [reader],
    )
  ).rows;
  assert.equal(audit.length, 1);
  assert.equal(audit[0].actor_id, a);
  assert.equal(audit[0].payload.before, null);
  assert.equal(audit[0].payload.after.id, e1);
  assert.equal(audit[0].payload.after.code, 'SYN1');
  assert.equal(audit[0].description, 'Synthetic verified identity check');
  ok('audit records independent actor reason and old/new employee details');
  await denied(
    team.linkEmployee(sa.token, sa.csrf, reader, {
      ...(await input(reader, e2)),
      expectedVersion: originalVersion,
    }),
    409,
  );
  await denied(team.linkEmployee(sa.token, sa.csrf, reader, await input(reader, e1)), 409);
  await denied(team.linkEmployee(sa.token, sa.csrf, other, await input(other, e1)), 409);
  ok('stale unchanged and duplicate assignments rejected');
  await owner.query('UPDATE employees SET removed_at=clock_timestamp() WHERE id=$1', [e3]);
  await denied(team.linkEmployee(sa.token, sa.csrf, other, await input(other, e3)), 409);
  await denied(team.linkEmployee(sa.token, sa.csrf, other, await input(other, randomUUID())), 409);
  ok('removed and unknown employees rejected');
  await team.linkEmployee(sb.token, sb.csrf, a, await input(a, e2));
  const freshA = await login('a');
  await denied(team.linkEmployee(freshA.token, freshA.csrf, other, await input(other, e2)), 403);
  ok('HR cannot assign their own employee identity to another account');
  await team.linkEmployee(sb.token, sb.csrf, a, await input(a, null));
  const freshA2 = await login('a');
  const racer = randomUUID();
  await owner.query(
    "INSERT INTO users(id,email,full_name,status) VALUES($1,'racer@acme.test','Synthetic Racer','ACTIVE')",
    [racer],
  );
  const race = await Promise.allSettled([
    team.linkEmployee(freshA2.token, freshA2.csrf, other, await input(other, e2)),
    team.linkEmployee(sb.token, sb.csrf, racer, await input(racer, e2)),
  ]);
  assert.equal(race.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(race.find((r) => r.status === 'rejected').reason.status, 409);
  assert.equal(
    (
      await owner.query(
        "SELECT count(*)::int n FROM users WHERE employee_id=$1 AND status<>'DELETED'",
        [e2],
      )
    ).rows[0].n,
    1,
  );
  ok('concurrent independent links preserve one account per employee');
  const relink = await team.linkEmployee(sb.token, sb.csrf, reader, await input(reader, null));
  assert.equal(relink.employee_id, null);
  const afterAudit = (
    await owner.query(
      "SELECT payload FROM audit_logs WHERE change_type='EMPLOYEE_LINK_CHANGED' AND entity_id=$1 ORDER BY id DESC LIMIT 1",
      [reader],
    )
  ).rows[0].payload;
  assert.equal(afterAudit.before.id, e1);
  assert.equal(afterAudit.after, null);
  ok('explicit unlink retains prior identity in immutable audit');
  await owner.query(`CREATE FUNCTION fail_link_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.change_type='EMPLOYEE_LINK_CHANGED' THEN RAISE EXCEPTION 'Synthetic audit fault'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER fail_link_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fail_link_audit()`);
  const freshReader = await login('reader'),
    rollbackState = await baseline();
  await assert.rejects(
    team.linkEmployee(sb.token, sb.csrf, reader, await input(reader, e1)),
    /Synthetic audit fault/,
  );
  assert.deepEqual(await baseline(), rollbackState);
  assert.ok(await auth.authenticate(freshReader.token));
  assert.equal(
    (await owner.query('SELECT employee_id FROM users WHERE id=$1', [reader])).rows[0].employee_id,
    null,
  );
  await owner.query('DROP TRIGGER fail_link_audit ON audit_logs;DROP FUNCTION fail_link_audit()');
  ok('audit failure rolls back mapping version authorization and session revocation');

  const config = { APP_ORIGIN: 'http://127.0.0.1:5173' };
  Object.assign(process.env, {
    DATABASE_URL: runtimeUrl.href,
    OTP_HMAC_SECRET: key,
    APP_ORIGIN: config.APP_ORIGIN,
  });
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const request = async (session, id, body, origin = config.APP_ORIGIN) =>
    fetch(`${base}/api/v1/team/${id}/employee-link`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `acme_session=${session.token}`,
        'X-CSRF-Token': session.csrf,
        Origin: origin,
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await request(sb, reader, await input(reader, e1), 'https://untrusted.test')).status,
    403,
  );
  assert.equal((await request(sb, 'invalid', await input(reader, e1))).status, 400);
  assert.equal(
    (await request(sb, reader, { ...(await input(reader, e1)), confirmed: false })).status,
    400,
  );
  ok('real HTTP rejects cross-origin invalid IDs and unconfirmed payloads');
  const response = await request(sb, reader, await input(reader, e1));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const payload = await response.json();
  assert.equal(payload.employee_id, e1);
  for (const field of ['monthly_amount', 'authorization_version', 'token_hash', 'csrf_hash'])
    assert.equal(Object.hasOwn(payload, field), false);
  ok('real Nest HTTP route accepts confirmed independent linkage with safe response');
  const visible = await team.list(sb.token);
  assert.equal(visible.items.find((u) => u.id === reader).employee_id, e1);
  const listResponse = await fetch(`${base}/api/v1/team`, {
    headers: { Cookie: `acme_session=${sb.token}` },
  });
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.headers.get('cache-control'), 'no-store');
  assert.equal((await listResponse.json()).items.find((u) => u.id === reader).employee_id, e1);
  ok('HR service and real HTTP team list include explicit current mapping');
  console.log(`${passed} isolated PostgreSQL / HTTP linkage checks passed`);
} catch (error) {
  // Set failure status explicitly even when local developer instrumentation intercepts errors.
  process.exitCode = 1;
  console.error(error);
} finally {
  await app?.close();
  await pool?.end();
  await owner?.end();
  if (created) await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
  await admin.end();
}
