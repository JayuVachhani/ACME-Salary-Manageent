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
import { PayrollPoliciesService } from './payroll-policies.service.js';
import {
  CreatePayrollPolicyDto,
  ApprovePayrollPolicyDto,
  PayrollPolicyParamsDto,
  PayrollPolicyQueryDto,
  payrollPolicyResponse,
  payrollPolicyPageResponse,
  policyApproverPageResponse,
} from './dto/payroll-policy.dto.js';
@Controller('/api/v1/payroll-policies')
@ApiTags('Payroll policies')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 409, 500)
@UseGuards(MutationRequestGuard)
export class PayrollPoliciesController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(PayrollPoliciesService) private readonly service: PayrollPoliciesService,
  ) {}
  @Get()
  @ApiInput(PayrollPolicyQueryDto, 'query')
  @ApiResult(payrollPolicyPageResponse)
  list(@Req() req: Request, @Query() q: PayrollPolicyQueryDto) {
    return this.service.list(this.security.token(req), q.page);
  }
  @Get('approvers')
  @ApiInput(PayrollPolicyQueryDto, 'query')
  @ApiResult(policyApproverPageResponse)
  approvers(@Req() req: Request, @Query() q: PayrollPolicyQueryDto) {
    return this.service.approvers(this.security.token(req), q.search, q.page);
  }
  @Post()
  @ApiMutation()
  @ApiInput(CreatePayrollPolicyDto, 'body')
  @ApiResult(payrollPolicyResponse, 201)
  create(@Req() req: Request, @Body() body: CreatePayrollPolicyDto) {
    return this.service.create(this.security.token(req), this.security.csrf(req), body);
  }
  @Post(':id/approve')
  @ApiMutation()
  @ApiInput(PayrollPolicyParamsDto, 'path')
  @ApiInput(ApprovePayrollPolicyDto, 'body')
  @ApiResult(payrollPolicyResponse, 201)
  approve(
    @Req() req: Request,
    @Param() p: PayrollPolicyParamsDto,
    @Body() b: ApprovePayrollPolicyDto,
  ) {
    return this.service.approve(this.security.token(req), this.security.csrf(req), p.id, b.comment);
  }
}
