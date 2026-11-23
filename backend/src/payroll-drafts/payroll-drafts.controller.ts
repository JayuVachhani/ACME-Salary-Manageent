import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import { PayrollDraftsService } from './payroll-drafts.service.js';
import {
  CreatePayrollDraftDto,
  RevisePayrollDraftDto,
  PayrollDraftParamsDto,
  PayrollDraftListDto,
  PayrollDraftRevisionQueryDto,
  payrollDraftResponse,
  payrollDraftPageResponse,
} from './dto/payroll-drafts.dto.js';
@ApiTags('Manual payroll drafts')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 409, 500)
@UseGuards(MutationRequestGuard)
@Controller('/api/v1/payroll-drafts')
export class PayrollDraftsController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(PayrollDraftsService) private readonly service: PayrollDraftsService,
  ) {}
  @Get()
  @ApiInput(PayrollDraftListDto, 'query')
  @ApiResult(payrollDraftPageResponse)
  list(@Req() req: Request, @Query() query: PayrollDraftListDto) {
    return this.service.list(this.security.token(req), query);
  }
  @Get(':id')
  @ApiInput(PayrollDraftParamsDto, 'path')
  @ApiResult(payrollDraftResponse)
  detail(@Req() req: Request, @Param() params: PayrollDraftParamsDto) {
    return this.service.detail(this.security.token(req), params.id);
  }
  @Get(':id/revisions')
  @ApiInput(PayrollDraftParamsDto, 'path')
  @ApiInput(PayrollDraftRevisionQueryDto, 'query')
  @ApiResult(payrollDraftPageResponse)
  revisions(
    @Req() req: Request,
    @Param() params: PayrollDraftParamsDto,
    @Query() query: PayrollDraftRevisionQueryDto,
  ) {
    return this.service.revisions(this.security.token(req), params.id, query.page);
  }
  @Post()
  @ApiMutation()
  @ApiInput(CreatePayrollDraftDto, 'body')
  @ApiResult(payrollDraftResponse, 201)
  create(@Req() req: Request, @Body() body: CreatePayrollDraftDto) {
    return this.service.create(this.security.token(req), this.security.csrf(req), body);
  }
  @Patch(':id')
  @ApiMutation()
  @ApiInput(PayrollDraftParamsDto, 'path')
  @ApiInput(RevisePayrollDraftDto, 'body')
  @ApiResult(payrollDraftResponse)
  revise(
    @Req() req: Request,
    @Param() params: PayrollDraftParamsDto,
    @Body() body: RevisePayrollDraftDto,
  ) {
    return this.service.revise(this.security.token(req), this.security.csrf(req), params.id, body);
  }
}
