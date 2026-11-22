import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL);
const runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href }); await admin.connect();
try {
// Reference HR identities must not change the team suite's last-manager scenario.
// Each group has a separate disposable database, not weakened continuity guards.
for (const suites of [['authentication.spec.ts','team.spec.ts'],['organization-references.spec.ts']]) {
const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
let created = false;
try {
  await admin.query(`CREATE DATABASE ${name}`);
  created = true;
  ownerUrl.pathname = runtimeUrl.pathname = `/${name}`;
  const env = { ...process.env, MIGRATION_DATABASE_URL: ownerUrl.href, DATABASE_URL: runtimeUrl.href, QA_RUN: suites.length===1?'references':'login', ACME_AUTH_TEST_DATABASE: name };
  for (const args of [['scripts/migrate.mjs'], ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.auth.config.ts',...suites]]) {
    const result = spawnSync(process.execPath, args, { env, stdio: 'inherit', windowsHide: true });
    if (result.status !== 0) {
      if (result.error || result.signal) console.error('Test process failed to complete', result.error?.code ?? result.signal);
      process.exitCode = result.status ?? 1; break;
    }
  }
} finally { if (created) await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`); }
if(process.exitCode)break;
}
} finally {await admin.end();}
