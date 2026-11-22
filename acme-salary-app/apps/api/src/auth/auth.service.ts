import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { MailService } from '../mail/mail.service.js';
import { OtpDeliveries } from '../mail/otp-deliveries.service.js';
import { AuthenticationService } from './authentication.service.js';
import { allowAuthAttempt } from './auth-rate.js';
import { secretDigest } from './auth-secrets.js';
import { verifyInput } from './dto/auth.dto.js';
@Injectable()
export class AuthService {
  constructor(
  @Inject(Pool) private readonly pool: Pool,
  @Inject(APP_CONFIG) private readonly config: AppConfig,
  @Inject(AuthenticationService) private readonly auth: AuthenticationService,
  @Inject(MailService) private readonly mail: MailService,
  @Inject(OtpDeliveries) private readonly deliveries: OtpDeliveries) { }
  async request(email: string, ip: string) {
    const challengeId = randomUUID();
    const allowed = await allowAuthAttempt(this.pool, this.config.OTP_HMAC_SECRET, email, ip, 'ISSUE');
    if (allowed) {
      const delivery = this.auth.issue(email, challengeId).then(async (issued) => {
        if (!issued.code)
          return;
        try {
          await this.mail.otp(email, issued.code);
        }
        catch {
          await this.auth.invalidate(issued.challengeId);
        }
      }).catch(() => { process.stderr.write('{"event":"otp_delivery_unavailable"}\n'); });
      this.deliveries.track(delivery);
    }
    return { challengeId, message: `If your account is eligible, a sign-in code will arrive by email. The code expires in ${this.config.OTP_TTL_MINUTES} minutes.` };
  }
  async verify(body: unknown, ip: string) {
    const parsed = verifyInput.safeParse(body);
    if (!await allowAuthAttempt(this.pool, this.config.OTP_HMAC_SECRET, '', ip, 'VERIFY'))
      throw new ApplicationError('Try again later', 429);
    const session = parsed.success ? await this.auth.verify(parsed.data.challengeId, parsed.data.code) : null;
    if (!session) {
      await this.pool.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
    VALUES('AUTH',$1,'LOGIN_REJECTED','Invalid or expired sign-in code')`, [secretDigest(this.config.OTP_HMAC_SECRET, 'rejected-challenge', parsed.success ? parsed.data.challengeId : 'malformed')]);
      throw new ApplicationError('Invalid or expired code', 401);
    }
    return session;
  }
  async me(token: string) {
    const user = await this.auth.authenticate(token);
    if (!user)
      throw new ApplicationError('Sign in required', 401);
    return user;
  }
  async logout(token: string, csrf: string | undefined) {
    if (!csrf || !await this.auth.authenticate(token, csrf))
      throw new ApplicationError('Request rejected', 403);
    await this.auth.revoke(token);
  }
}
