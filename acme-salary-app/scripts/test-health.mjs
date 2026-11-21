import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port = '3199';
const child = spawn(process.execPath, ['--env-file=.env', 'apps/api/dist/main.js'], {
  cwd: process.cwd(), env: { ...process.env, PORT: port }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
try {
  let live;
  for (let attempt = 0; attempt < 160; attempt++) {
    try { live = await fetch(`http://127.0.0.1:${port}/healthz`); break; } catch { await new Promise(r => setTimeout(r, 250)); }
  }
  assert.ok(live?.ok, `API did not start: ${output}`);
  assert.deepEqual(await live.json(), { status: 'ok' });
  assert.ok(live.headers.get('x-request-id'));
  assert.equal(live.headers.get('x-content-type-options'), 'nosniff');
  const ready = await fetch(`http://127.0.0.1:${port}/readyz`);
  assert.equal(ready.status, 503);
  assert.equal((await ready.json()).reason, 'schema_not_verified');
  const privateRoute = await fetch(`http://127.0.0.1:${port}/api/v1/employees`);
  assert.equal(privateRoute.status, 404);
  assert.ok(!output.includes(process.env.OTP_HMAC_SECRET || 'impossible-secret'));
  console.log('Health API smoke checks passed: liveness, headers, closed readiness, no domain data route');
} finally { child.kill(); }
