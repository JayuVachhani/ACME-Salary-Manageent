import { Body, Controller, Get, Inject, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import { ApiErrors, ApiInput, ApiMutation, ApiResult, ApiSession } from '../common/http/api-contract.decorators.js';
import { FxRatesService } from './fx-rates.service.js';
import { AppendFxRateDto, FxQueryDto, ResolveFxDto } from './dto/fx-rates.dto.js';
import { fxRateResponse, fxPageResponse, fxResolutionResponse } from './dto/fx-rates-response.dto.js';

@ApiTags('FX rates')
@ApiSession()
@ApiErrors(400, 401, 403, 409, 422, 500)
@Controller('/api/v1/fx-rates')
@UseGuards(MutationRequestGuard)
export class FxRatesController {
  constructor(@Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(FxRatesService) private readonly service: FxRatesService) {}

  @Get()
  @ApiInput(FxQueryDto, 'query')
  @ApiResult(fxPageResponse)
  list(@Req() req: Request, @Query() query: FxQueryDto) { return this.service.list(this.security.token(req), query); }

  @Get('resolve')
  @ApiInput(ResolveFxDto, 'query')
  @ApiResult(fxResolutionResponse)
  resolve(@Req() req: Request, @Query() query: ResolveFxDto) { return this.service.resolve(this.security.token(req), query); }

  @Post()
  @ApiMutation()
  @ApiInput(AppendFxRateDto, 'body')
  @ApiResult(fxRateResponse, 201)
  append(@Req() req: Request, @Body() body: AppendFxRateDto) {
    return this.service.append(this.security.token(req), this.security.csrf(req), body);
  }
}
