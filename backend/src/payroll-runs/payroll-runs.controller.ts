import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
import { PayrollRunsService } from './payroll-runs.service.js';
import {
  CreateRunDto,
  RefreshRunDto,
  RunActionDto,
  RunParamsDto,
  RunQueryDto,
  runDetail,
  runPage,
  RunSetupQueryDto,
  runSetupResponse,
} from './dto/payroll-runs.dto.js';
@ApiTags('Payroll review and approval')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 409, 422, 500)
@UseGuards(MutationRequestGuard)
@Controller('/api/v1/payroll-runs')
export class PayrollRunsController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(PayrollRunsService) private readonly service: PayrollRunsService,
  ) {}
  @Get()
  @ApiInput(RunQueryDto, 'query')
  @ApiResult(runPage)
  list(@Req() req: Request, @Query() query: RunQueryDto) {
    return this.service.list(this.security.token(req), query);
  }
  @Get('setup')
  @ApiInput(RunSetupQueryDto, 'query')
  @ApiResult(runSetupResponse)
  setup(@Req() req: Request, @Query() query: RunSetupQueryDto) {
    return this.service.setup(this.security.token(req), query.period, query.policyId);
  }
  @Get(':id')
  @ApiInput(RunParamsDto, 'path')
  @ApiInput(RunQueryDto, 'query')
  @ApiResult(runDetail)
  detail(@Req() req: Request, @Param() params: RunParamsDto, @Query() query: RunQueryDto) {
    return this.service.detail(this.security.token(req), params.id, query.page);
  }
  @Post()
  @ApiMutation()
  @ApiInput(CreateRunDto, 'body')
  @ApiResult(runDetail, 201)
  create(@Req() req: Request, @Body() body: CreateRunDto) {
    return this.service.create(this.security.token(req), this.security.csrf(req), body);
  }
  @Post(':id/refresh')
  @ApiMutation()
  @ApiInput(RunParamsDto, 'path')
  @ApiInput(RefreshRunDto, 'body')
  @ApiResult(runDetail, 201)
  refresh(@Req() req: Request, @Param() params: RunParamsDto, @Body() body: RefreshRunDto) {
    return this.service.refresh(this.security.token(req), this.security.csrf(req), params.id, body);
  }
  @Post(':id/actions')
  @ApiMutation()
  @ApiInput(RunParamsDto, 'path')
  @ApiInput(RunActionDto, 'body')
  @ApiResult(runDetail, 201)
  action(@Req() req: Request, @Param() params: RunParamsDto, @Body() body: RunActionDto) {
    return this.service.act(this.security.token(req), this.security.csrf(req), params.id, body);
  }
}
