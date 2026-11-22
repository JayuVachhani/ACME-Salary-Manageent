import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { RequestSecurity } from '../common/http/request-security.service.js';
import {
  ApiErrors,
  ApiInput,
  ApiMutation,
  ApiResult,
  ApiSession,
} from '../common/http/api-contract.decorators.js';
import { AuthOriginGuard } from './auth-origin.guard.js';
import { AuthService } from './auth.service.js';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto.js';
import { identityResponse, messageResponse, otpResponse } from './dto/auth-response.dto.js';

@ApiTags('Authentication')
@ApiErrors(400, 401, 403, 429, 500)
@Controller('/api/v1/auth')
@UseGuards(AuthOriginGuard)
export class AuthController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  private get cookies() {
    return {
      secure: this.config.DEV_INSECURE_COOKIES !== 'true',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 12 * 60 * 60000,
    };
  }

  @Post(['/otp/request', '/otp/resend'])
  @HttpCode(202)
  @ApiHeader({ name: 'Origin', required: true, description: 'Configured APP_ORIGIN' })
  @ApiInput(RequestOtpDto, 'body')
  @ApiResult(
    otpResponse,
    202,
    'Generic eligibility response; never discloses an OTP or account existence',
  )
  request(@Req() req: Request, @Body() input: RequestOtpDto) {
    return this.auth.request(input.email, req.ip ?? 'unknown');
  }

  @Post('/otp/verify')
  @HttpCode(200)
  @ApiHeader({ name: 'Origin', required: true, description: 'Configured APP_ORIGIN' })
  @ApiInput(VerifyOtpDto, 'body')
  @ApiOperation({
    description:
      'Malformed verification input is throttled and audited before rejection. Success sets HttpOnly acme_session and readable acme_csrf cookies; neither value appears in JSON.',
  })
  @ApiResult(messageResponse)
  async verify(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: VerifyOtpDto,
  ) {
    const session = await this.auth.verify(body, req.ip ?? 'unknown');
    res.cookie('acme_session', session.token, { ...this.cookies, httpOnly: true });
    res.cookie('acme_csrf', session.csrf, { ...this.cookies, httpOnly: false });
    return { message: 'Signed in' };
  }

  @Get('/me')
  @ApiSession()
  @ApiResult(identityResponse)
  me(@Req() req: Request) {
    return this.auth.me(this.security.token(req));
  }

  @Post('/logout')
  @HttpCode(200)
  @ApiSession()
  @ApiMutation()
  @ApiResult(messageResponse)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.security.token(req), req.header('X-CSRF-Token'));
    res.clearCookie('acme_session', { ...this.cookies, httpOnly: true });
    res.clearCookie('acme_csrf', { ...this.cookies, httpOnly: false });
    return { message: 'Signed out' };
  }
}
