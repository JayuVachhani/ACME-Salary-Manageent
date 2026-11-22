import { Inject } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { OTP_MAILER, type OtpMailer } from '../mail/mail.module.js';
import { OtpDeliveries } from '../mail/otp-deliveries.service.js';
import { Body, Controller, Get, HttpCode, HttpException, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { secretDigest } from './auth-secrets.js';
import { AuthenticationService } from './authentication.service.js';
import { allowAuthAttempt } from './auth-rate.js';
@Controller('/api/v1/auth')
export class AuthController {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(OTP_MAILER) private readonly send: OtpMailer,
    @Inject(OtpDeliveries) private readonly deliveries: OtpDeliveries) { }
  private readonly emailInput = z.object({ email: z.email().max(254).transform(value => value.trim().toLowerCase()) }).strict();
  private readonly verifyInput = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) }).strict();
  private get cookies() { return { secure: this.config.DEV_INSECURE_COOKIES !== 'true', sameSite: 'lax' as const, path: '/', maxAge: 12 * 60 * 60000 }; }
  private readonly cookie = (req: Request, name: string) => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1) ?? '';
  private origin(req: Request) {
    if (req.headers.origin !== this.config.APP_ORIGIN)
      throw new HttpException('Request origin rejected', 403);
  }
  @Post(['/otp/request', '/otp/resend'])
  @HttpCode(202)
  async request(
    @Req() req: Request,
    @Body() body: unknown) {
    this.origin(req);
    const parsed = this.emailInput.safeParse(body);
    if (!parsed.success)
      throw new HttpException('Enter a valid email address', 400);
    const email = parsed.data.email;
    const challengeId = randomUUID();
    const allowed = await allowAuthAttempt(this.pool, this.config.OTP_HMAC_SECRET, email, req.ip ?? 'unknown', 'ISSUE');
    // Delivery is deliberately outside the response path, including unknown/limited identifiers.
    // Pending work is drained on shutdown; plaintext codes are never persisted or logged.
    if (allowed) {
      const delivery = this.auth.issue(email, challengeId).then(async (issued) => {
        if (!issued.code)
          return;
        try {
          await this.send(email, issued.code);
        }
        catch {
          await this.auth.invalidate(issued.challengeId);
        }
      }).catch(() => { process.stderr.write('{"event":"otp_delivery_unavailable"}\n'); });
      this.deliveries.track(delivery);
    }
    return { challengeId, message: `If your account is eligible, a sign-in code will arrive by email. The code expires in ${this.config.OTP_TTL_MINUTES} minutes.` };
  }
  @Post('/otp/verify')
  @HttpCode(200)
  async verify(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: unknown) {
    this.origin(req);
    const parsed = this.verifyInput.safeParse(body);
    if (!await allowAuthAttempt(this.pool, this.config.OTP_HMAC_SECRET, '', req.ip ?? 'unknown', 'VERIFY'))
      throw new HttpException('Try again later', 429);
    const session = parsed.success ? await this.auth.verify(parsed.data.challengeId, parsed.data.code) : null;
    if (!session) {
      await this.pool.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
     VALUES('AUTH',$1,'LOGIN_REJECTED','Invalid or expired sign-in code')`, [secretDigest(this.config.OTP_HMAC_SECRET, 'rejected-challenge', parsed.success ? parsed.data.challengeId : 'malformed')]);
      throw new HttpException('Invalid or expired code', 401);
    }
    res.cookie('acme_session', session.token, { ...this.cookies, httpOnly: true });
    res.cookie('acme_csrf', session.csrf, { ...this.cookies, httpOnly: false });
    return { message: 'Signed in' };
  }
  @Get('/me')
  async me(
    @Req() req: Request) {
    const user = await this.auth.authenticate(this.cookie(req, 'acme_session'));
    if (!user)
      throw new HttpException('Sign in required', 401);
    return user;
  }
  @Post('/logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response) {
    this.origin(req);
    const token = this.cookie(req, 'acme_session');
    const csrf = req.header('X-CSRF-Token');
    if (!csrf || !await this.auth.authenticate(token, csrf))
      throw new HttpException('Request rejected', 403);
    await this.auth.revoke(token);
    res.clearCookie('acme_session', { ...this.cookies, httpOnly: true });
    res.clearCookie('acme_csrf', { ...this.cookies, httpOnly: false });
    return { message: 'Signed out' };
  }
}
