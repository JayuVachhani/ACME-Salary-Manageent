import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
const selection = process.argv[2];
const groups = [
  ['authentication.spec.ts', 'team.spec.ts'],
  ['organization-references.spec.ts'],
  ['country-currency.spec.ts'],
  ['fx-rates.spec.ts'],
  ['employees.spec.ts'],
];
if (
  process.argv.length > 3 ||
  (selection && !groups.some((group) => group.includes(`${selection}.spec.ts`)))
)
  throw new Error('Unknown browser suite selection');
const selected = selection
  ? groups.filter((group) => group.includes(`${selection}.spec.ts`))
  : groups;
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL);
const runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href });
await admin.connect();
try {
  // Reference HR identities must not change the team suite's last-manager scenario.
  // Each group has a separate disposable database, not weakened continuity guards.
  for (const suites of selected) {
    const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
    let created = false;
    try {
      await admin.query(`CREATE DATABASE ${name}`);
      created = true;
      ownerUrl.pathname = runtimeUrl.pathname = `/${name}`;
      const env = {
        ...process.env,
        MIGRATION_DATABASE_URL: ownerUrl.href,
        DATABASE_URL: runtimeUrl.href,
        QA_RUN:
          suites[0] === 'employees.spec.ts'
            ? 'employees'
            : suites[0] === 'fx-rates.spec.ts'
              ? 'fx'
              : suites[0] === 'country-currency.spec.ts'
                ? 'country-currency'
                : suites.length === 1
                  ? 'references'
                  : 'login',
        ACME_AUTH_TEST_DATABASE: name,
      };
      for (const args of [
        ['--env-file=../backend/.env', '../backend/scripts/migrate.mjs'],
        [
          'node_modules/@playwright/test/cli.js',
          'test',
          '--config=playwright.auth.config.ts',
          ...suites,
        ],
      ]) {
        console.log(
          JSON.stringify({
            event: 'browser_group_process_start',
            group: env.QA_RUN,
            stage: args.some((value) => value.includes('migrate')) ? 'migration' : 'chromium',
            nodeVersion: process.version,
          }),
        );
        const result = spawnSync(process.execPath, args, {
          env,
          stdio: 'inherit',
          windowsHide: true,
        });
        console.log(
          JSON.stringify({
            event: 'browser_group_process_end',
            group: env.QA_RUN,
            status: result.status,
            signal: result.signal,
            errorCode: result.error?.code ?? null,
          }),
        );
        if (result.status !== 0) {
          if (result.error || result.signal)
            console.error('Test process failed to complete', result.error?.code ?? result.signal);
          process.exitCode = result.status ?? 1;
          break;
        }
      }
    } finally {
      if (created) await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    }
    if (process.exitCode) break;
  }
} finally {
  await admin.end();
}
