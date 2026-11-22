import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { offsetQuery } from '../common/dto/pagination.dto.js';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CountryCurrencyService } from './country-currency.service.js';
import { countryInput, countryChange, currencyChange, countryCode, currencyCode } from './dto/country-currency.dto.js';
const invalid = 'Invalid country or currency details';
@Controller('/api/v1')
@UseGuards(MutationRequestGuard)
export class CountryCurrencyController {
  constructor(@Inject(RequestSecurity) private readonly security: RequestSecurity, @Inject(CountryCurrencyService) private readonly service: CountryCurrencyService) {}
  @Get('currency-catalogue') catalogue(@Req() req: Request) { return this.service.catalogue(this.security.token(req)); }
  @Get('currencies') currencies(@Req() req: Request) { return this.service.currencies(this.security.token(req)); }
  @Patch('currencies/:code')
  activate(@Req() req: Request, @Param('code', new ZodValidationPipe(currencyCode, invalid)) code: string, @Body(new ZodValidationPipe(currencyChange, invalid)) body: z.infer<typeof currencyChange>) { return this.service.activate(this.security.token(req), this.security.csrf(req), code, body); }
  @Get('countries')
  countries(@Req() req: Request, @Query(new ZodValidationPipe(offsetQuery, invalid)) query: z.infer<typeof offsetQuery>) { return this.service.countries(this.security.token(req), query.offset); }
  @Post('countries')
  create(@Req() req: Request, @Body(new ZodValidationPipe(countryInput, invalid)) body: z.infer<typeof countryInput>) { return this.service.create(this.security.token(req), this.security.csrf(req), body); }
  @Patch('countries/:code')
  change(@Req() req: Request, @Param('code', new ZodValidationPipe(countryCode, invalid)) code: string, @Body(new ZodValidationPipe(countryChange, invalid)) body: z.infer<typeof countryChange>) { return this.service.change(this.security.token(req), this.security.csrf(req), code, body); }
}
