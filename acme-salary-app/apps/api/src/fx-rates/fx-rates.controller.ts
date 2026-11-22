import { Body, Controller, Get, Inject, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { FxRatesService } from './fx-rates.service.js';
import { fxInput, fxQuery, fxResolve } from './dto/fx-rates.dto.js';
const invalid = 'Invalid FX details: check currencies, date, positive decimal rate (max 8 places), source, reason and revision';
@Controller('/api/v1/fx-rates')
@UseGuards(MutationRequestGuard)
export class FxRatesController {
  constructor(@Inject(RequestSecurity) private readonly security: RequestSecurity, @Inject(FxRatesService) private readonly service: FxRatesService) {}
  @Get()
  list(@Req() req: Request, @Query(new ZodValidationPipe(fxQuery, invalid)) query: z.infer<typeof fxQuery>) { return this.service.list(this.security.token(req), query); }
  @Get('resolve')
  resolve(@Req() req: Request, @Query(new ZodValidationPipe(fxResolve, invalid)) query: z.infer<typeof fxResolve>) { return this.service.resolve(this.security.token(req), query); }
  @Post()
  append(@Req() req: Request, @Body(new ZodValidationPipe(fxInput, invalid)) body: z.infer<typeof fxInput>) { return this.service.append(this.security.token(req), this.security.csrf(req), body); }
}
