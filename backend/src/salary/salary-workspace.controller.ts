import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
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
import { SalaryWorkspaceService } from './salary-workspace.service.js';
import {
  SalaryWorkspaceQueryDto,
  SalaryBulkResolveDto,
  salaryWorkspaceResponse,
  salaryBulkResolvedResponse,
} from './dto/salary-workspace.dto.js';
@ApiTags('Salary workspace')
@ApiSession()
@ApiErrors(400, 401, 403, 500)
@UseGuards(MutationRequestGuard)
@Controller('/api/v1/salary')
export class SalaryWorkspaceController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(SalaryWorkspaceService) private readonly service: SalaryWorkspaceService,
  ) {}
  @Get('workspace')
  @ApiInput(SalaryWorkspaceQueryDto, 'query')
  @ApiResult(salaryWorkspaceResponse)
  list(@Req() req: Request, @Query() query: SalaryWorkspaceQueryDto) {
    return this.service.list(this.security.token(req), query);
  }
  @Post('bulk/resolve')
  @HttpCode(200)
  @ApiMutation()
  @ApiInput(SalaryBulkResolveDto, 'body')
  @ApiResult(salaryBulkResolvedResponse)
  resolve(@Req() req: Request, @Body() body: SalaryBulkResolveDto) {
    return this.service.resolve(this.security.token(req), this.security.csrf(req), body);
  }
}
