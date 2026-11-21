import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { generateOtp, generateSessionToken, matchesSecret, secretDigest, sessionExpired } from './auth-secrets.js';

export class AuthenticationService {
  constructor(private readonly pool: Pool, private readonly key: string,
    private readonly clock: () => Date = () => new Date(),
    private readonly limits = { otpMinutes: 15, idleMinutes: 30, absoluteHours: 12 }) {}

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

  async invalidate(challengeId: string) {
    await this.transaction(async client => {
      await client.query('UPDATE login_challenges SET consumed_at=clock_timestamp() WHERE id=$1 AND consumed_at IS NULL', [challengeId]);
      await client.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
        VALUES('AUTH',$1,'OTP_DELIVERY_FAILED','OTP invalidated after delivery failure')`, [challengeId]);
    });
  }

  async revoke(token: string) {
    await this.transaction(async client => {
      await client.query(`SELECT u.id FROM users u JOIN user_sessions s ON s.user_id=u.id
        WHERE s.token_hash=$1 FOR UPDATE OF u`, [secretDigest(this.key, 'session', token)]);
      const session = (await client.query('UPDATE user_sessions SET revoked_at=clock_timestamp() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING user_id', [secretDigest(this.key, 'session', token)])).rows[0];
      if (session) await client.query(`INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description)
        VALUES($1::uuid,'USER',$1::text,'LOGOUT','Session revoked')`, [session.user_id]);
    });
  }

  /** Internal delivery boundary only: never expose the returned code through an HTTP response. */
  async issue(email: string, challengeId = randomUUID()): Promise<{ challengeId: string; code?: string }> {
    return this.transaction(async client => {
      const user = (await client.query(`SELECT id,status,invite_expires_at FROM users WHERE email=$1 AND NOT is_system
        AND status IN ('ACTIVE','INVITED') FOR UPDATE`, [email])).rows[0];
      const now = this.clock();
      await client.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
        VALUES('AUTH',$1,'OTP_REQUESTED','Email sign-in requested')`, [secretDigest(this.key, 'audit-email', email.toLowerCase())]);
      if (!user || (user.status === 'INVITED' && (!user.invite_expires_at || user.invite_expires_at <= now))) return { challengeId };
      await client.query('UPDATE login_challenges SET consumed_at=$2 WHERE user_id=$1 AND consumed_at IS NULL', [user.id, now]);
      const code = generateOtp();
      await client.query(`INSERT INTO login_challenges(id,user_id,secret_hash,created_at,expires_at)
        VALUES($1,$2,$3,$4,$5)`, [challengeId, user.id, secretDigest(this.key, `otp:${challengeId}`, code), now, new Date(+now + this.limits.otpMinutes * 60_000)]);
      await client.query(`INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description)
        VALUES($1,'AUTH',$2,'OTP_ISSUED','New OTP issued; prior open OTP invalidated')`, [user.id, challengeId]);
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
      if (!valid) {
        await client.query(`INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description)
          VALUES($1,'AUTH',$2,'OTP_REJECTED','OTP verification failed')`, [user.id, challengeId]);
        return null; // Commit failed attempts; throwing here would undo the attempt limit.
      }
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
      const tokenHash = secretDigest(this.key, 'session', token);
      const user = (await client.query(`SELECT u.* FROM users u JOIN user_sessions s ON s.user_id=u.id
        WHERE s.token_hash=$1 FOR UPDATE OF u`, [tokenHash])).rows[0];
      if (!user) return null;
      const session = (await client.query('SELECT * FROM user_sessions WHERE token_hash=$1 FOR UPDATE', [tokenHash])).rows[0];
      const now = this.clock();
      if (!session || session.revoked_at || user.status !== 'ACTIVE' || user.is_system ||
        sessionExpired(session.created_at, session.last_seen_at, now, this.limits.idleMinutes, this.limits.absoluteHours) ||
        (csrf !== undefined && !matchesSecret(this.key, 'csrf', csrf, session.csrf_hash))) return null;
      await client.query('UPDATE user_sessions SET last_seen_at=$2 WHERE token_hash=$1', [session.token_hash, now]);
      return { id: session.user_id as string, isHrManager: user.is_hr_manager as boolean, permissions: user.permissions as string[] };
    });
  }
}
