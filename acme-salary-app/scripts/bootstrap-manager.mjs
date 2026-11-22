import { Client } from 'pg';
const [email, fullName, confirmation] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName?.trim() || confirmation !== '--confirm') {
  throw new Error('Usage: node --env-file=.env scripts/bootstrap-manager.mjs <email> <full-name> --confirm');
}
const client = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_bootstrap_manager'))");
  const existing = await client.query('SELECT 1 FROM users WHERE is_hr_manager AND status<>\'DELETED\'');
  if (existing.rowCount) throw new Error('A manager already exists; use team invitations instead');
  const user = (await client.query(`INSERT INTO users(email,full_name,status,is_hr_manager,invited_by)
    VALUES($1,$2,'ACTIVE',true,'00000000-0000-4000-8000-000000000001') RETURNING id`, [email.toLowerCase(), fullName.trim()])).rows[0];
  await client.query(`INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description)
    VALUES('00000000-0000-4000-8000-000000000001','USER',$1,'BOOTSTRAPPED','First HR Manager created by explicit CLI action')`, [user.id]);
  await client.query('COMMIT');
  console.log('First HR Manager created; request a sign-in code in the application.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }
