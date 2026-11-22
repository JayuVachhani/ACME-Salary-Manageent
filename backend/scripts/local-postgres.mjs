import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Client } from 'pg';
import { pg_ctl, initdb } from '@embedded-postgres/windows-x64';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacy = path.resolve(root, '../acme-salary-app/.local');
const local = process.env.ACME_LOCAL_DATA_DIR
  ? path.resolve(process.env.ACME_LOCAL_DATA_DIR)
  : existsSync(path.join(legacy, 'postgres', 'PG_VERSION'))
    ? legacy
    : path.join(root, '.local');
const data = path.join(local, 'postgres');
mkdirSync(local, { recursive: true });
const command = process.argv[2] || 'start';
const run = (exe, args) =>
  execFileSync(exe, args, { windowsHide: true, stdio: 'ignore', timeout: 30000 });
if (command === 'stop') {
  run(pg_ctl, ['-D', data, '-m', 'fast', '-w', 'stop']);
  console.log('Project-local PostgreSQL stopped.');
} else if (command === 'start') {
  const credentialsFile = path.join(local, 'database.json');
  const credentials = existsSync(credentialsFile)
    ? JSON.parse(readFileSync(credentialsFile, 'utf8'))
    : {
        owner: randomBytes(32).toString('hex'),
        runtime: randomBytes(32).toString('hex'),
      };
  writeFileSync(credentialsFile, JSON.stringify(credentials), { mode: 0o600 });
  if (!existsSync(path.join(data, 'PG_VERSION'))) {
    const passwordFile = path.join(local, 'init-password');
    try {
      writeFileSync(passwordFile, credentials.owner, { mode: 0o600 });
      run(initdb, [
        '-D',
        data,
        '-U',
        'acme_owner',
        '--pwfile',
        passwordFile,
        '--auth-host=scram-sha-256',
        '--auth-local=scram-sha-256',
        '--encoding=UTF8',
        '--locale=C',
      ]);
    } finally {
      if (existsSync(passwordFile)) unlinkSync(passwordFile);
    }
  }
  let running = false;
  try {
    run(pg_ctl, ['-D', data, 'status']);
    running = true;
  } catch {
    /* Not started yet. */
  }
  if (!running)
    run(pg_ctl, [
      '-D',
      data,
      '-l',
      path.join(local, 'postgres.log'),
      '-o',
      '-h 127.0.0.1 -p 55432',
      '-w',
      'start',
    ]);
  const ownerUrl = `postgresql://acme_owner:${credentials.owner}@127.0.0.1:55432/postgres`;
  const client = new Client({
    connectionString: ownerUrl,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
  });
  await client.connect();
  try {
    if (!(await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'acme_app'")).rowCount) {
      // Password is generated hexadecimal, never user input or written to output.
      await client.query(
        `CREATE ROLE acme_app LOGIN PASSWORD '${credentials.runtime}' NOSUPERUSER NOCREATEDB NOCREATEROLE`,
      );
    }
    if (!(await client.query("SELECT 1 FROM pg_database WHERE datname = 'acme'")).rowCount) {
      await client.query('CREATE DATABASE acme OWNER acme_owner');
    }
  } finally {
    await client.end();
  }
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) {
    writeFileSync(
      envPath,
      [
        'NODE_ENV=development',
        'PORT=3001',
        'APP_ORIGIN=http://localhost:5173',
        `DATABASE_URL=postgresql://acme_app:${credentials.runtime}@127.0.0.1:55432/acme`,
        `MIGRATION_DATABASE_URL=postgresql://acme_owner:${credentials.owner}@127.0.0.1:55432/acme`,
        `OTP_HMAC_SECRET=${randomBytes(32).toString('hex')}`,
        'OTP_TTL_MINUTES=15',
        'SESSION_IDLE_MINUTES=30',
        'SESSION_ABSOLUTE_HOURS=12',
        'FX_MAX_STALENESS_DAYS=7',
        'DEV_INSECURE_COOKIES=true',
        'SMTP_HOST=localhost',
        'SMTP_PORT=1025',
        'SMTP_FROM="ACME <no-reply@acme.test>"',
        '',
      ].join('\n'),
      { mode: 0o600 },
    );
  }
  const probe = new Client({
    host: '127.0.0.1',
    port: 55432,
    database: 'acme',
    user: 'acme_app',
    password: credentials.runtime,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
  });
  await probe.connect();
  try {
    const result = await probe.query('SELECT current_user, version()');
    console.log(
      JSON.stringify({
        event: 'local_database_ready',
        host: '127.0.0.1',
        port: 55432,
        role: result.rows[0].current_user,
        version: result.rows[0].version,
      }),
    );
  } finally {
    await probe.end();
  }
} else {
  throw new Error('Expected start or stop');
}
