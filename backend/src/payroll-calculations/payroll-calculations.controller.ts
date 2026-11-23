import { Body, Controller, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import {
  ApiErrors,
  ApiInput,
  ApiMutation,
  ApiResult,
  ApiSession,
} from '../common/http/api-contract.decorators.js';
import { PayrollCalculationsService } from './payroll-calculations.service.js';
import {
  PayrollCalculationDto,
  payrollCalculationResponse,
} from './dto/payroll-calculation.dto.js';
@Controller('/api/v1/payroll-calculations')
@ApiTags('Payroll calculation previews')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 409, 500)
@UseGuards(MutationRequestGuard)
export class PayrollCalculationsController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(PayrollCalculationsService) private readonly service: PayrollCalculationsService,
  ) {}
  @Post('preview')
  @HttpCode(200)
  @ApiMutation()
  @ApiInput(PayrollCalculationDto, 'body')
  @ApiResult(payrollCalculationResponse)
  preview(@Req() req: Request, @Body() body: PayrollCalculationDto) {
    return this.service.preview(this.security.token(req), this.security.csrf(req), body);
  }
}
