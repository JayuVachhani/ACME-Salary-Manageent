import { Inject } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { Body, Controller, Get, HttpException, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { CountryCurrencyService, countryInput, countryChange, currencyChange, countryCode, currencyCode } from './country-currency.service.js';
@Controller('/api/v1')
export class CountryCurrencyController {
  constructor(
    @Inject(CountryCurrencyService) private readonly service: CountryCurrencyService,
    @Inject(APP_CONFIG) private readonly config: AppConfig) { }
  private readonly token = (req: Request) => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('acme_session='))?.slice(13) ?? '';
  private readonly csrf = (req: Request) => {
    if (req.headers.origin !== this.config.APP_ORIGIN || !req.header('X-CSRF-Token'))
      throw new HttpException('Request rejected', 403); return req.header('X-CSRF-Token')!;
  };
  private readonly parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
    const r = schema.safeParse(value); if (!r.success)
      throw new HttpException('Invalid country or currency details', 400); return r.data;
  };
  @Get('currency-catalogue')
  catalogue(
    @Req() req: Request) { return this.service.catalogue(this.token(req)); }
  @Get('currencies')
  currencies(
    @Req() req: Request) { return this.service.currencies(this.token(req)); }
  @Patch('currencies/:code')
  activate(
    @Req() req: Request,
    @Param('code') code: string,
    @Body() body: unknown) { return this.service.activate(this.token(req), this.csrf(req), this.parse(currencyCode, code), this.parse(currencyChange, body)); }
  @Get('countries')
  countries(
    @Req() req: Request) { const q = this.parse(z.object({ offset: z.coerce.number().int().min(0).max(100000).default(0) }).strict(), req.query); return this.service.countries(this.token(req), q.offset); }
  @Post('countries')
  create(
    @Req() req: Request,
    @Body() body: unknown) { return this.service.create(this.token(req), this.csrf(req), this.parse(countryInput, body)); }
  @Patch('countries/:code')
  change(
    @Req() req: Request,
    @Param('code') code: string,
    @Body() body: unknown) { return this.service.change(this.token(req), this.csrf(req), this.parse(countryCode, code), this.parse(countryChange, body)); }
}
