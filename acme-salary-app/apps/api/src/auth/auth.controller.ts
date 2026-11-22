import { AuthOriginGuard } from './auth-origin.guard.js';
import type { z } from 'zod';
import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import { emailInput } from './dto/auth.dto.js';
@Controller('/api/v1/auth')
@UseGuards(AuthOriginGuard)
export class AuthController {
  constructor(
  @Inject(RequestSecurity) private readonly security: RequestSecurity,
  @Inject(APP_CONFIG) private readonly config: AppConfig,
  @Inject(AuthService) private readonly auth: AuthService) { }
  private get cookies() { return { secure: this.config.DEV_INSECURE_COOKIES !== 'true', sameSite: 'lax' as const, path: '/', maxAge: 12 * 60 * 60000 }; }
  @Post(['/otp/request', '/otp/resend'])
  @HttpCode(202)
  request(
  @Req() req: Request,
  @Body(new ZodValidationPipe(emailInput, 'Enter a valid email address')) input: z.infer<typeof emailInput>) {
    return this.auth.request(input.email, req.ip ?? 'unknown');
  }
  @Post('/otp/verify')
  @HttpCode(200)
  async verify(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
  @Body() body: unknown) {
    // Malformed attempts still count toward throttling and the rejection audit.
    const session = await this.auth.verify(body, req.ip ?? 'unknown');
    res.cookie('acme_session', session.token, { ...this.cookies, httpOnly: true });
    res.cookie('acme_csrf', session.csrf, { ...this.cookies, httpOnly: false });
    return { message: 'Signed in' };
  }
  @Get('/me')
  me(
  @Req() req: Request) { return this.auth.me(this.security.token(req)); }
  @Post('/logout')
  @HttpCode(200)
  async logout(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.security.token(req), req.header('X-CSRF-Token'));
    res.clearCookie('acme_session', { ...this.cookies, httpOnly: true });
    res.clearCookie('acme_csrf', { ...this.cookies, httpOnly: false });
    return { message: 'Signed out' };
  }
}
