import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
const backend = http.createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  res.writeHead(201, {
    'content-type': 'application/json',
    'set-cookie': ['qa_synthetic=one; HttpOnly', 'qa_second=two'],
  });
  res.end(JSON.stringify({ method: req.method, path: req.url, origin: req.headers.origin, body }));
});
await new Promise((r) => backend.listen(0, '127.0.0.1', r));
const child = spawn(process.execPath, ['scripts/qa-web-server.mjs', '0'], {
  env: { ...process.env, QA_API_PORT: String(backend.address().port) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
try {
  const port = await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const line = output.split('\n').find((v) => v.includes('qa_web_started'));
      if (line) resolve(JSON.parse(line).port);
    });
    child.once('exit', (code) => reject(Error(`QA web exited ${code}`)));
    setTimeout(() => reject(Error('QA web startup timeout')), 10000).unref();
  });
  const base = `http://127.0.0.1:${port}`;
  const html = await fetch(base);
  assert.equal(html.status, 200);
  assert.match(html.headers.get('content-type'), /text\/html/);
  const text = await html.text();
  assert.ok(text.includes('<div id="root">'));
  const asset = text.match(/src="([^"]+\.js)"/)[1];
  const script = await fetch(base + asset);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
  assert.equal(
    (await fetch(base + asset, { method: 'HEAD' })).headers.get('content-length'),
    script.headers.get('content-length'),
  );
  console.log('PASS QA-WEB-01 built HTML/JS/HEAD and MIME');
  assert.equal((await fetch(base + '/../.env')).status, 403);
  assert.equal((await fetch(base + '/%2e%2e%5cpackage.json')).status, 403);
  assert.equal((await fetch(base + '/missing.js')).status, 404);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  console.log('PASS QA-WEB-02 dotfile/traversal/missing asset/method denial');
  const response = await fetch(base + '/api/v1/synthetic?q=literal', {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: '{"synthetic":true}',
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.deepEqual(await response.json(), {
    method: 'POST',
    path: '/api/v1/synthetic?q=literal',
    origin: base,
    body: '{"synthetic":true}',
  });
  assert.equal((await fetch(base + '/healthz')).status, 201);
  assert.equal((await fetch(base + '/readyz')).status, 201);
  console.log('PASS QA-WEB-03 real proxy method/query/origin/body/cookies/health');
  await new Promise((r) => backend.close(r));
  const failure = await fetch(base + '/api/v1/synthetic');
  assert.equal(failure.status, 502);
  assert.deepEqual(await failure.json(), { message: 'QA API unavailable' });
  console.log('PASS QA-WEB-04 unavailable backend generic502');
} finally {
  child.kill();
  if (backend.listening) await new Promise((r) => backend.close(r));
}
