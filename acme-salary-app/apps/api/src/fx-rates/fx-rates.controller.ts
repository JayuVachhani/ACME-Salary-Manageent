import { Inject } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { Body, Controller, Get, HttpException, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { FxRatesService, fxInput, fxQuery, fxResolve } from './fx-rates.service.js';
@Controller('/api/v1/fx-rates')
export class FxRatesController {
  constructor(
    @Inject(FxRatesService) private readonly service: FxRatesService,
    @Inject(APP_CONFIG) private readonly config: AppConfig) { }
  private readonly token = (req: Request) => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('acme_session='))?.slice(13) ?? '';
  private readonly parse = <T>(schema: z.ZodType<T>, input: unknown): T => {
    const r = schema.safeParse(input); if (!r.success)
      throw new HttpException('Invalid FX details: check currencies, date, positive decimal rate (max 8 places), source, reason and revision', 400); return r.data;
  };
  @Get()
  list(
    @Req() req: Request) { return this.service.list(this.token(req), this.parse(fxQuery, req.query)); }
  @Get('resolve')
  resolve(
    @Req() req: Request) { return this.service.resolve(this.token(req), this.parse(fxResolve, req.query)); }
  @Post()
  append(
    @Req() req: Request,
    @Body() body: unknown) {
    if (req.headers.origin !== this.config.APP_ORIGIN || !req.header('X-CSRF-Token'))
      throw new HttpException('Request rejected', 403);
    return this.service.append(this.token(req), req.header('X-CSRF-Token')!, this.parse(fxInput, body));
  }
}
