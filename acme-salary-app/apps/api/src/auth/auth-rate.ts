import { requiredRow } from '../database/query-result.js';
import { withTransaction } from '../database/transaction.js';
import type { Pool } from 'pg';
import { secretDigest } from './auth-secrets.js';

export async function allowAuthAttempt(
  pool: Pool,
  key: string,
  email: string,
  ip: string,
  action: 'ISSUE' | 'VERIFY',
) {
  const emailHash = secretDigest(key, 'rate-email', email);
  const ipHash = secretDigest(key, 'rate-ip', ip);
  return withTransaction(pool, async (client) => {
    // Global short lock makes all three limits atomic across API processes.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_auth_limits'))");
    const counts = requiredRow(
      await client.query<{ ip: number; email: number; pair: number }>(
        `SELECT
      count(*) FILTER (WHERE ip_hash=$2 AND created_at > clock_timestamp()-interval '10 minutes')::int AS ip,
      count(*) FILTER (WHERE is_allowed AND action='ISSUE' AND email_hash=$1)::int AS email,
      count(*) FILTER (WHERE is_allowed AND action='ISSUE' AND email_hash=$1 AND ip_hash=$2)::int AS pair
      FROM auth_rate_events WHERE created_at > clock_timestamp()-interval '1 hour'`,
        [emailHash, ipHash],
      ),
    );
    const allowed =
      counts.ip < 20 && (action === 'VERIFY' || (counts.email < 20 && counts.pair < 5));
    await client.query(
      'INSERT INTO auth_rate_events(email_hash,ip_hash,action,is_allowed) VALUES($1,$2,$3,$4)',
      [emailHash, ipHash, action, allowed],
    );
    if (!allowed)
      await client.query(
        `INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description)
      VALUES(NULL,'AUTH',$1,'RATE_LIMITED','Authentication rate limit reached')`,
        [emailHash],
      );
    return allowed;
  });
}
