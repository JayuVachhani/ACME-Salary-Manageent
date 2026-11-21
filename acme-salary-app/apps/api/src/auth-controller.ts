import { Body, Controller, Get, HttpCode, HttpException, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { secretDigest } from './auth-secrets.js';
import { AuthenticationService } from './authentication.js';
import { allowAuthAttempt } from './auth-rate.js';
import { createOtpMailer } from './otp-mail.js';
import type { loadConfig } from './config.js';

export function authController(pool: Pool, config: ReturnType<typeof loadConfig>) {
  const auth = new AuthenticationService(pool, config.OTP_HMAC_SECRET, () => new Date(), {
    otpMinutes: config.OTP_TTL_MINUTES, idleMinutes: config.SESSION_IDLE_MINUTES, absoluteHours: config.SESSION_ABSOLUTE_HOURS });
  const send = createOtpMailer(config);
  const deliveries = new Set<Promise<void>>();
  const emailInput = z.object({ email: z.email().max(254).transform(value => value.trim().toLowerCase()) }).strict();
  const verifyInput = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) }).strict();
  const secure = config.DEV_INSECURE_COOKIES !== 'true';
  const cookies = { secure, sameSite: 'lax' as const, path: '/', maxAge: 12 * 60 * 60_000 };
  const cookie = (req: Request, name: string) => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1) ?? '';
  function origin(req: Request) {
    if (req.headers.origin !== config.APP_ORIGIN) throw new HttpException('Request origin rejected', 403);
  }
  @Controller('/api/v1/auth')
  class AuthController {
    @Post(['/otp/request','/otp/resend']) @HttpCode(202)
    async request(@Req() req: Request, @Body() body: unknown) {
      origin(req);
      const parsed = emailInput.safeParse(body);
      if (!parsed.success) throw new HttpException('Enter a valid email address', 400);
      const email = parsed.data.email;
      const challengeId = randomUUID();
      const allowed = await allowAuthAttempt(pool, config.OTP_HMAC_SECRET, email, req.ip ?? 'unknown', 'ISSUE');
      // Delivery is deliberately outside the response path, including unknown/limited identifiers.
      // Pending work is drained on shutdown; plaintext codes are never persisted or logged.
      if (allowed) {
        const delivery = auth.issue(email, challengeId).then(async issued => {
          if (!issued.code) return;
          try { await send(email, issued.code); }
          catch { await auth.invalidate(issued.challengeId); }
        }).catch(() => { process.stderr.write('{"event":"otp_delivery_unavailable"}\n'); });
        deliveries.add(delivery);
        void delivery.finally(() => deliveries.delete(delivery));
      }
      return { challengeId, message: `If your account is eligible, a sign-in code will arrive by email. The code expires in ${config.OTP_TTL_MINUTES} minutes.` };
    }
    @Post('/otp/verify') @HttpCode(200)
    async verify(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: unknown) {
      origin(req);
      const parsed = verifyInput.safeParse(body);
      if (!await allowAuthAttempt(pool, config.OTP_HMAC_SECRET, '', req.ip ?? 'unknown', 'VERIFY')) throw new HttpException('Try again later', 429);
      const session = parsed.success ? await auth.verify(parsed.data.challengeId, parsed.data.code) : null;
      if (!session) {
        await pool.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
          VALUES('AUTH',$1,'LOGIN_REJECTED','Invalid or expired sign-in code')`,
          [secretDigest(config.OTP_HMAC_SECRET, 'rejected-challenge', parsed.success ? parsed.data.challengeId : 'malformed')]);
        throw new HttpException('Invalid or expired code', 401);
      }
      res.cookie('acme_session', session.token, { ...cookies, httpOnly: true });
      res.cookie('acme_csrf', session.csrf, { ...cookies, httpOnly: false });
      return { message: 'Signed in' };
    }
    @Get('/me')
    async me(@Req() req: Request) {
      const user = await auth.authenticate(cookie(req, 'acme_session'));
      if (!user) throw new HttpException('Sign in required', 401);
      return user;
    }
    @Post('/logout') @HttpCode(200)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
      origin(req);
      const token = cookie(req, 'acme_session');
      const csrf = req.header('X-CSRF-Token');
      if (!csrf || !await auth.authenticate(token, csrf)) throw new HttpException('Request rejected', 403);
      await auth.revoke(token);
      res.clearCookie('acme_session', { ...cookies, httpOnly: true });
      res.clearCookie('acme_csrf', { ...cookies, httpOnly: false });
      return { message: 'Signed out' };
    }
  }
  return { controller: AuthController, drain: () => Promise.allSettled([...deliveries]) };
}
