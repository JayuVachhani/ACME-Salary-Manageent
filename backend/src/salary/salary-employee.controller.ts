import { Body, Controller, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
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
import { SalaryWriteService } from './salary-write.service.js';
import {
  SalaryDraftDto,
  SalaryWriteDto,
  SalaryEmployeeParamsDto,
  salaryPreviewResponse,
  salaryWriteResponse,
} from './dto/salary-write.dto.js';
@ApiTags('Monthly salaries')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 409, 422, 500)
@UseGuards(MutationRequestGuard)
@Controller('/api/v1/employees/:id/salary')
export class SalaryEmployeeController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(SalaryWriteService) private readonly service: SalaryWriteService,
  ) {}
  @Post('preview')
  @HttpCode(200)
  @ApiMutation()
  @ApiInput(SalaryEmployeeParamsDto, 'path')
  @ApiInput(SalaryDraftDto, 'body')
  @ApiResult(salaryPreviewResponse)
  preview(
    @Req() req: Request,
    @Param() params: SalaryEmployeeParamsDto,
    @Body() body: SalaryDraftDto,
  ) {
    return this.service.preview(this.security.token(req), this.security.csrf(req), params.id, body);
  }
  @Post()
  @ApiMutation()
  @ApiInput(SalaryEmployeeParamsDto, 'path')
  @ApiInput(SalaryWriteDto, 'body')
  @ApiResult(salaryWriteResponse, 201)
  submit(
    @Req() req: Request,
    @Param() params: SalaryEmployeeParamsDto,
    @Body() body: SalaryWriteDto,
  ) {
    return this.service.submit(this.security.token(req), this.security.csrf(req), params.id, body);
  }
}
