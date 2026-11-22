import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scanner = path.join(appRoot, 'scripts/verify-staged.mjs');
mkdirSync(path.join(appRoot, '.local'), { recursive: true });
const fixture = mkdtempSync(path.join(appRoot, '.local/git-safety-'));
const git = (args) =>
  execFileSync('git', args, { cwd: fixture, windowsHide: true, stdio: 'ignore' });
const scan = () =>
  spawnSync(process.execPath, [scanner], { cwd: fixture, encoding: 'utf8', windowsHide: true });
git(['init', '--initial-branch=chore/synthetic-safety-test']);
writeFileSync(path.join(fixture, 'README.md'), 'Synthetic safe source\n');
git(['add', 'README.md']);
assert.equal(scan().status, 0);
writeFileSync(path.join(fixture, '.env'), 'SYNTHETIC_VALUE=not-a-real-secret\n');
git(['add', '.env']);
assert.notEqual(scan().status, 0);
git(['rm', '--cached', '.env']);
writeFileSync(path.join(fixture, '.env.example'), 'SYNTHETIC_VALUE=template-only\n');
git(['add', '.env.example']);
assert.equal(scan().status, 0);
mkdirSync(path.join(fixture, 'acme-salary-app'), { recursive: true });
const syntheticSecret = 'SYNTHETIC_NOT_REAL_HMAC_CREDENTIAL_123456';
writeFileSync(path.join(fixture, 'acme-salary-app/.env'), `OTP_HMAC_SECRET=${syntheticSecret}\n`);
writeFileSync(path.join(fixture, 'README.md'), syntheticSecret);
git(['add', 'README.md']);
const leaked = scan();
assert.notEqual(leaked.status, 0);
assert.ok(!leaked.stderr.includes(syntheticSecret));
writeFileSync(path.join(fixture, 'README.md'), 'Synthetic safe source\n');
git(['add', 'README.md']);
assert.equal(scan().status, 0);
console.log(
  'PASS: Git index safety allows source/templates, rejects runtime env/known synthetic secrets, and withholds secret values. No test commit was created; isolated fixtures remain ignored under .local.',
);
