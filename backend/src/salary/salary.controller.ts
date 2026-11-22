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
import { SalaryWorkflowService } from './salary-workflow.service.js';
import {
  SalaryRequestParamsDto,
  SalaryRequestQueryDto,
  SalaryDecisionDto,
  salaryRequestPageResponse,
  salaryDecisionResponse,
} from './dto/salary-workflow.dto.js';
@ApiTags('Salary approvals')
@ApiSession()
@ApiErrors(400, 401, 403, 409, 500)
@Controller('/api/v1/salary-requests')
@UseGuards(MutationRequestGuard)
export class SalaryController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(SalaryWorkflowService) private readonly service: SalaryWorkflowService,
  ) {}
  @Get()
  @ApiInput(SalaryRequestQueryDto, 'query')
  @ApiResult(salaryRequestPageResponse)
  list(@Req() req: Request, @Query() query: SalaryRequestQueryDto) {
    return this.service.list(this.security.token(req), query.status, query.page);
  }
  @Post(':id/decision')
  @ApiMutation()
  @ApiInput(SalaryRequestParamsDto, 'path')
  @ApiInput(SalaryDecisionDto, 'body')
  @ApiResult(salaryDecisionResponse, 201)
  decide(
    @Req() req: Request,
    @Param() params: SalaryRequestParamsDto,
    @Body() body: SalaryDecisionDto,
  ) {
    return this.service.decide(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.decision,
      body.comment,
    );
  }
}
