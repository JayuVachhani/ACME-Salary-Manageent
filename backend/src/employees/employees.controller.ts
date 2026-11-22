import { Controller, Get, Inject, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequestSecurity } from '../common/http/request-security.service.js';
import {
  ApiErrors,
  ApiInput,
  ApiResult,
  ApiSession,
} from '../common/http/api-contract.decorators.js';
import { EmployeesService } from './employees.service.js';
import { EmployeeQueryDto, EmployeeParamsDto } from './dto/employees.dto.js';
import {
  employeeResponse,
  employeePageResponse,
  employeeFiltersResponse,
} from './dto/employees-response.dto.js';

@ApiTags('Employees')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 500)
@Controller('/api/v1/employees')
export class EmployeesController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(EmployeesService) private readonly service: EmployeesService,
  ) {}

  @Get()
  @ApiInput(EmployeeQueryDto, 'query')
  @ApiResult(employeePageResponse)
  list(@Req() req: Request, @Query() query: EmployeeQueryDto) {
    return this.service.list(this.security.token(req), query);
  }

  @Get('filters')
  @ApiResult(employeeFiltersResponse)
  filters(@Req() req: Request) {
    return this.service.filters(this.security.token(req));
  }

  @Get(':id')
  @ApiInput(EmployeeParamsDto, 'path')
  @ApiResult(employeeResponse)
  detail(@Req() req: Request, @Param() params: EmployeeParamsDto) {
    return this.service.detail(this.security.token(req), params.id);
  }
}
