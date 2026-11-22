import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = path.resolve('qa-artifacts/regression');
mkdirSync(dir, { recursive: true });
const report = path.join(dir, 'assertions.jsonl');
writeFileSync(report, '');
const scripts = [
  'test-database.mjs',
  'test-country-fx-retention.mjs',
  'test-approvals.mjs',
  'test-prisma.mjs',
  'test-health.mjs',
];
const results = [];
for (const script of scripts) {
  const result = spawnSync(
    process.execPath,
    [
      '--env-file=.env',
      '--import',
      pathToFileURL(path.resolve('scripts/qa-assert-observer.mjs')).href,
      `scripts/${script}`,
    ],
    {
      env: { ...process.env, QA_ASSERT_REPORT: report },
      encoding: 'utf8',
      windowsHide: true,
      timeout: 90000,
    },
  );
  writeFileSync(path.join(dir, `${script}.log`), (result.stdout || '') + (result.stderr || ''));
  results.push({ script, exitCode: result.status, error: result.error?.message || null });
  console.log(`${script}: ${result.status === 0 ? 'PASS' : 'FAIL'}`);
}
writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(results, null, 2));
if (results.some((r) => r.exitCode !== 0)) process.exitCode = 1;
