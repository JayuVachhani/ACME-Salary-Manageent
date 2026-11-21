import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { generateOtp, generateSessionToken, matchesSecret, secretDigest, sessionExpired } from './auth-secrets.js';

export class AuthenticationService {
  constructor(private readonly pool: Pool, private readonly key: string,
    private readonly clock: () => Date = () => new Date()) {}

  private async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const value = await work(client);
      await client.query('COMMIT');
      return value;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }

  /** Internal delivery boundary only: never expose the returned code through an HTTP response. */
  async issue(email: string): Promise<{ challengeId: string; code?: string }> {
    const challengeId = randomUUID();
    return this.transaction(async client => {
      const now = this.clock();
      const user = (await client.query(`SELECT id FROM users WHERE email=$1 AND NOT is_system
        AND (status='ACTIVE' OR (status='INVITED' AND invite_expires_at > $2)) FOR UPDATE`, [email, now])).rows[0];
      if (!user) return { challengeId };
      await client.query('UPDATE login_challenges SET consumed_at=$2 WHERE user_id=$1 AND consumed_at IS NULL', [user.id, now]);
      const code = generateOtp();
      await client.query(`INSERT INTO login_challenges(id,user_id,secret_hash,created_at,expires_at)
        VALUES($1,$2,$3,$4,$5)`, [challengeId, user.id, secretDigest(this.key, `otp:${challengeId}`, code), now, new Date(+now + 15 * 60_000)]);
      return { challengeId, code };
    });
  }

  async verify(challengeId: string, code: string): Promise<{ token: string; csrf: string } | null> {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(challengeId) || !/^\d{6}$/.test(code)) return null;
    return this.transaction(async client => {
      // Always lock the identity first, matching resend/session lock order.
      const user = (await client.query(`SELECT u.* FROM users u JOIN login_challenges c ON c.user_id=u.id
        WHERE c.id=$1 FOR UPDATE OF u`, [challengeId])).rows[0];
      const challenge = (await client.query('SELECT * FROM login_challenges WHERE id=$1 FOR UPDATE', [challengeId])).rows[0];
      const now = this.clock();
      if (!user || user.is_system || (user.status !== 'ACTIVE' && !(user.status === 'INVITED' && user.invite_expires_at > now))) return null;
      if (challenge.consumed_at || challenge.attempts >= 3 || challenge.expires_at <= now) return null;
      const valid = matchesSecret(this.key, `otp:${challengeId}`, code, challenge.secret_hash);
      await client.query(`UPDATE login_challenges SET attempts=attempts+1,
        consumed_at=CASE WHEN $2 OR attempts=2 THEN $3::timestamptz ELSE NULL END WHERE id=$1`, [challengeId, valid, now]);
      if (!valid) return null; // Commit failed attempts; throwing here would undo the attempt limit.
      if (user.status === 'INVITED') await client.query("UPDATE users SET status='ACTIVE' WHERE id=$1", [user.id]);
      const token = generateSessionToken(); const csrf = generateSessionToken();
      await client.query(`INSERT INTO user_sessions(token_hash,user_id,csrf_hash,created_at,last_seen_at)
        VALUES($1,$2,$3,$4,$4)`, [secretDigest(this.key, 'session', token), user.id, secretDigest(this.key, 'csrf', csrf), now]);
      await client.query(`INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description)
        VALUES($1::uuid,'USER',$1::text,'LOGIN','Email OTP login succeeded')`, [user.id]);
      return { token, csrf };
    });
  }

  async authenticate(token: string, csrf?: string) {
    if (!/^[\w-]{43}$/.test(token)) return null;
    return this.transaction(async client => {
      const session = (await client.query(`SELECT s.*,u.status,u.is_system,u.is_hr_manager,u.permissions FROM user_sessions s
        JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 FOR UPDATE OF u,s`, [secretDigest(this.key, 'session', token)])).rows[0];
      const now = this.clock();
      if (!session || session.revoked_at || session.status !== 'ACTIVE' || session.is_system ||
        sessionExpired(session.created_at, session.last_seen_at, now) ||
        (csrf !== undefined && !matchesSecret(this.key, 'csrf', csrf, session.csrf_hash))) return null;
      await client.query('UPDATE user_sessions SET last_seen_at=$2 WHERE token_hash=$1', [session.token_hash, now]);
      return { id: session.user_id as string, isHrManager: session.is_hr_manager as boolean, permissions: session.permissions as string[] };
    });
  }
}
