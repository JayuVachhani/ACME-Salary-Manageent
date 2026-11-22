import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { createApp } from '../apps/api/dist/app.js';
import { MailModule } from '../apps/api/dist/mail/mail.module.js';
import { AuthModule } from '../apps/api/dist/auth/auth.module.js';
import { AuthenticationService } from '../apps/api/dist/auth/authentication.service.js';
import { OtpDeliveries } from '../apps/api/dist/mail/otp-deliveries.service.js';
import { TeamModule } from '../apps/api/dist/team/team.module.js';
import { TeamService } from '../apps/api/dist/team/team.service.js';
import { EmployeesModule } from '../apps/api/dist/employees/employees.module.js';
import { EmployeesService } from '../apps/api/dist/employees/employees.service.js';
import { DatabaseModule } from '../apps/api/dist/database/database.module.js';

// Compose real Nest providers. No connection to a database or SMTP server is made.
const app = await createApp();
const pool = app.select(DatabaseModule).get(Pool, { strict: true });
const auth = app.select(AuthModule).get(AuthenticationService, { strict: true });
const deliveries = app.select(MailModule).get(OtpDeliveries, { strict: true });
const team = app.select(TeamModule).get(TeamService, { strict: true });
const employees = app.select(EmployeesModule).get(EmployeesService, { strict: true });
let closed = false;
const end = pool.end.bind(pool);
pool.end = async () => { closed = true; await end(); };
// Fail on accidental infrastructure access; liveness and malformed input need none.
pool.connect = async () => { throw Error('Architecture test must not connect to a database'); };
pool.query = async () => { throw Error('Architecture test must not query a database'); };
try {
  assert.equal(team.auth, auth);
  assert.equal(employees.auth, auth);
  assert.equal(team.pool, pool);
  assert.equal(employees.pool, pool);
  assert.throws(() => app.select(EmployeesModule).get(TeamService, { strict: true }));
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const live = await fetch(`${base}/healthz`);
  assert.deepEqual(await live.json(), { status: 'ok' });
  assert.ok(live.headers.get('x-request-id'));
  assert.equal(live.headers.get('x-content-type-options'), 'nosniff');
  // Every feature controller must be registered, with the original rejection contract.
  for (const [url, options, status] of [
    ['/api/v1/auth/otp/request', { method: 'POST' }, 403],
    ['/api/v1/team', { method: 'POST' }, 403],
    ['/api/v1/organization-references/invalid', {}, 400],
    ['/api/v1/countries/invalid', { method: 'PATCH' }, 403],
    ['/api/v1/fx-rates', { method: 'POST' }, 403],
    ['/api/v1/employees/invalid', {}, 400],
  ]) {
    const response = await fetch(`${base}${url}`, options);
    assert.equal(response.status, status, url);
    assert.equal(response.headers.get('cache-control'), 'no-store', url);
  }
  const ready = await fetch(`${base}/readyz`);
  assert.equal(ready.status, 503);
  assert.deepEqual(await ready.json(), { status: 'not_ready', reason: 'database_unavailable' });
  let release;
  let drained = false;
  deliveries.track(new Promise(resolve => { release = () => { assert.equal(closed, false); drained = true; resolve(); }; }));
  const closing = app.close();
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(closed, false, 'Database must remain available for pending delivery invalidation');
  release();
  await closing;
  assert.equal(drained, true);
  assert.equal(closed, true);
  console.log('Nest architecture PASS: real DI, shared providers, module isolation, six feature routes, health, headers and shutdown drain order');
} finally { if (!closed) await app.close(); }
