import assert from 'node:assert/strict';
import { Client } from 'pg';
const owner = new Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const app = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
await owner.connect();
await app.connect();
let passed = 0;
async function rejectsSQL(client, sql, expectedCode) {
  await client.query('BEGIN');
  try {
    await assert.rejects(client.query(sql), (error) => error.code === expectedCode);
    passed++;
  } finally {
    await client.query('ROLLBACK');
  }
}
try {
  assert.equal(
    (await app.query('SELECT count(*)::int AS n FROM users WHERE is_system')).rows[0].n,
    1,
  );
  passed++;
  for (const client of [owner, app]) {
    for (const sql of [
      "UPDATE audit_logs SET description='forbidden'",
      'DELETE FROM audit_logs',
      'TRUNCATE audit_logs',
    ]) {
      await rejectsSQL(client, sql, client === app ? '42501' : '55000');
    }
  }
  await rejectsSQL(app, 'CREATE TABLE forbidden_ddl(id int)', '42501');
  await rejectsSQL(app, 'SELECT * FROM schema_migrations', '42501');
  await rejectsSQL(
    owner,
    "INSERT INTO users(email,full_name,status,permissions) VALUES('invalid@acme.test','Synthetic','ACTIVE',ARRAY['superuser'])",
    '23514',
  );
  await rejectsSQL(
    owner,
    "INSERT INTO users(email,full_name,status,is_system,permissions) VALUES('second@acme.test','Synthetic','ACTIVE',true,ARRAY[]::text[])",
    '23505',
  );
  console.log(`${passed} real PostgreSQL identity/audit checks passed`);
} finally {
  await app.end();
  await owner.end();
}
