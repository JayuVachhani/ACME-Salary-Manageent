import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client, Pool } from 'pg';
import { AuthenticationService } from '../apps/api/dist/authentication.js';
import { allowAuthAttempt } from '../apps/api/dist/auth-rate.js';
const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL);
const runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href });
await admin.connect();
let pool;
let owner;
try {
  await admin.query(`CREATE DATABASE ${name}`);
  ownerUrl.pathname = runtimeUrl.pathname = `/${name}`;
  execFileSync(process.execPath, ['scripts/migrate.mjs'], { env: { ...process.env, MIGRATION_DATABASE_URL: ownerUrl.href }, windowsHide: true, stdio: 'pipe' });
  owner = new Client({ connectionString: ownerUrl.href }); await owner.connect();
  pool = new Pool({ connectionString: runtimeUrl.href });
  let now = new Date('2026-11-21T12:00:00Z');
  const service = new AuthenticationService(pool, 'synthetic-auth-test-key-at-least-32-characters', () => now);
  const id = randomUUID();
  await owner.query("INSERT INTO users(id,email,full_name,status) VALUES($1,'login@acme.test','Synthetic Login','ACTIVE')", [id]);
  assert.equal((await service.issue('unknown@acme.test')).code, undefined);
  assert.equal((await service.issue('system@acme.invalid')).code, undefined);
  assert.equal(await service.verify('-'.repeat(36), '123456'), null);
  const first = await service.issue('login@acme.test');
  const next = await service.issue('login@acme.test');
  assert.equal(await service.verify(first.challengeId, first.code), null);
  const wrong = next.code === '000000' ? '000001' : '000000';
  for (let i = 0; i < 3; i++) assert.equal(await service.verify(next.challengeId, wrong), null);
  assert.equal(await service.verify(next.challengeId, next.code), null);
  assert.equal((await owner.query('SELECT attempts FROM login_challenges WHERE id=$1', [next.challengeId])).rows[0].attempts, 3);
  const active = await service.issue('login@acme.test');
  const results = await Promise.all([service.verify(active.challengeId, active.code), service.verify(active.challengeId, active.code)]);
  assert.equal(results.filter(Boolean).length, 1);
  const session = results.find(Boolean);
  assert.equal((await service.authenticate(session.token)).id, id);
  assert.equal(await service.authenticate(session.token, 'wrong-csrf'), null);
  assert.equal((await service.authenticate(session.token, session.csrf)).id, id);
  await owner.query("UPDATE users SET permissions=ARRAY['read','salary:view'] WHERE id=$1", [id]);
  assert.deepEqual((await service.authenticate(session.token)).permissions, ['read','salary:view']);
  await owner.query("UPDATE users SET status='DELETED',deleted_at=now() WHERE id=$1", [id]);
  assert.notEqual((await owner.query('SELECT revoked_at FROM user_sessions')).rows[0].revoked_at, null);
  assert.equal(await service.authenticate(session.token), null);
  await owner.query("UPDATE users SET status='ACTIVE',deleted_at=NULL WHERE id=$1", [id]);
  now = new Date(+now + 30 * 60_000);
  assert.equal(await service.authenticate(session.token), null);
  const expired = await service.issue('login@acme.test');
  now = new Date(+now + 15 * 60_000);
  assert.equal(await service.verify(expired.challengeId, expired.code), null);
  assert.equal((await owner.query('SELECT count(*)::int n FROM user_sessions')).rows[0].n, 1);
  const waiting = await service.issue('login@acme.test');
  await owner.query('BEGIN');
  await owner.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [id]);
  const pending = service.verify(waiting.challengeId, waiting.code);
  try {
    let blocked = false;
    for (let i = 0; i < 100; i++) {
      blocked = (await owner.query("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND pid<>pg_backend_pid()) AS blocked")).rows[0].blocked;
      if (blocked) break;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(blocked, true, 'verification must actually wait on the identity lock');
    now = new Date(+now + 15 * 60_000);
  } finally { await owner.query('COMMIT'); }
  assert.equal(await pending, null, 'expiry must be evaluated after acquiring locks');
  const rateKey = 'synthetic-rate-limit-key-at-least-32-characters';
  const concurrent = await Promise.all(Array.from({length: 8}, () => allowAuthAttempt(pool, rateKey, 'limited@acme.test', '127.0.0.2', 'ISSUE')));
  assert.equal(concurrent.filter(Boolean).length, 5);
  assert.equal(await allowAuthAttempt(pool, rateKey, 'limited@acme.test', '127.0.0.3', 'ISSUE'), true);
  for (let i = 0; i < 20; i++) assert.equal(await allowAuthAttempt(pool, rateKey, '', '127.0.0.4', 'VERIFY'), true);
  assert.equal(await allowAuthAttempt(pool, rateKey, '', '127.0.0.4', 'VERIFY'), false);
  for (let i = 0; i < 20; i++) assert.equal(await allowAuthAttempt(pool, rateKey, 'global@acme.test', `192.0.2.${i+1}`, 'ISSUE'), true);
  assert.equal(await allowAuthAttempt(pool, rateKey, 'global@acme.test', '192.0.2.100', 'ISSUE'), false);
  assert.equal((await owner.query("SELECT count(*)::int n FROM auth_rate_events WHERE email_hash LIKE '%@%'")).rows[0].n, 0);
  const bootstrapArgs = ['scripts/bootstrap-manager.mjs', 'bootstrap@acme.test', 'Synthetic Bootstrap Manager', '--confirm'];
  const bootstrapOptions = { env: { ...process.env, MIGRATION_DATABASE_URL: ownerUrl.href }, windowsHide: true, stdio: 'pipe', timeout: 30000 };
  execFileSync(process.execPath, bootstrapArgs, bootstrapOptions);
  assert.equal((await owner.query("SELECT count(*)::int n FROM users WHERE is_hr_manager AND status='ACTIVE'")).rows[0].n, 1);
  assert.throws(() => execFileSync(process.execPath, bootstrapArgs, bootstrapOptions));
  assert.equal((await owner.query("SELECT actor_id::text FROM audit_logs WHERE change_type='BOOTSTRAPPED'")).rows[0].actor_id, '00000000-0000-4000-8000-000000000001');
  await owner.query(`INSERT INTO users(email,full_name,status,invite_expires_at) VALUES
    ('invited@acme.test','Synthetic Invitee','INVITED',$1),
    ('expired@acme.test','Synthetic Expired Invitee','INVITED',$2)`, [new Date(+now+60_000), now]);
  assert.equal((await service.issue('expired@acme.test')).code, undefined);
  const invitation = await service.issue('invited@acme.test');
  const invitedSession = await service.verify(invitation.challengeId, invitation.code);
  assert.ok(invitedSession);
  assert.equal((await owner.query("SELECT status FROM users WHERE email='invited@acme.test'")).rows[0].status, 'ACTIVE');
  await Promise.all([...Array.from({length: 8}, () => service.authenticate(invitedSession.token)), service.revoke(invitedSession.token)]);
  assert.equal(await service.authenticate(invitedSession.token), null);
  console.log('PASS authentication: unknown/system identity, resend, three attempts, concurrent replay, session/CSRF, disabled identity and exact expiry boundaries');
} finally {
  await pool?.end(); await owner?.end();
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.end();
}
