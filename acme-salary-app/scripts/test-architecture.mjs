import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';
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
pool.connect = async () => ({ query: async () => ({ rows: [], rowCount: 0 }), release() {} });
pool.query = async () => { throw Error('Architecture test must not query a database'); };
try {
  assert.equal(pool.listenerCount('error'), 1, 'The shared pool must handle background connection errors');
  assert.doesNotThrow(() => pool.emit('error', Object.assign(new Error('synthetic background failure'), { code: '08006' })));
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
  const spec = await fetch(`${base}/api/openapi.json`);
  assert.equal(spec.status, 200);
  const document = await spec.json();
  assert.ok(document.paths['/api/v1/employees']);
  assert.ok(document.paths['/api/v1/auth/otp/verify'].post.requestBody);
  const malformed = await fetch(`${base}/api/v1/auth/otp/request`, { method: 'POST', headers: { Origin: process.env.APP_ORIGIN, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { statusCode: 400, message: 'Enter a valid email address' });
  const denied = await fetch(`${base}/api/v1/employees`);
  assert.equal(denied.status, 401);
  assert.deepEqual(await denied.json(), { statusCode: 401, message: 'Sign in required' });
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

// Enforce the architectural contract, not only successful TypeScript compilation.
const root = 'apps/api/src';
for (const relative of readdirSync(root, { recursive: true }).filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))) {
  const source = readFileSync(`${root}/${relative}`, 'utf8');
  const file = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true);
  const imports = file.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text);
  if (relative.endsWith('.controller.ts')) {
    assert.ok(!imports.includes('pg'), `${relative}: persistence belongs in services`);
    assert.ok(!/new \w+Service\(/.test(source), `${relative}: services must be injected`);
    assert.ok(!/\.(safeParse|parse|transform)\(/.test(source), `${relative}: validation belongs in parameter pipes`);
  }
  if (relative.endsWith('.service.ts') && !relative.includes('common')) {
    assert.match(source, /@Injectable\(\)/, `${relative}: service must be a native Nest provider`);
    assert.ok(!/\bHttpException\b/.test(source), `${relative}: HTTP errors belong at the transport boundary`);
  }
  if (relative.endsWith('.module.ts') && !relative.startsWith('config') && !relative.startsWith('database')) {
    assert.ok(!/useFactory/.test(source), `${relative}: feature providers must be constructed by Nest`);
  }
}
console.log('Architecture boundaries PASS: native providers, injected services, thin controllers, transport error separation');

// Production must not register the local/test API documentation routes.
const savedEnvironment = { NODE_ENV: process.env.NODE_ENV, APP_ORIGIN: process.env.APP_ORIGIN, DEV_INSECURE_COOKIES: process.env.DEV_INSECURE_COOKIES };
let production;
try {
  process.env.NODE_ENV = 'production';
  process.env.APP_ORIGIN = 'https://acme.test';
  process.env.DEV_INSECURE_COOKIES = 'false';
  production = await createApp();
  await production.listen(0, '127.0.0.1');
  const base = await production.getUrl();
  for (const path of ['/api/docs', '/api/openapi.json', '/api/openapi.yaml']) {
    assert.equal((await fetch(`${base}${path}`)).status, 404, `Production must omit ${path}`);
  }
  console.log('Production documentation isolation PASS: UI/JSON/YAML routes absent');
} finally {
  await production?.close();
  for (const [key, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
