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
import {
  ApiErrors,
  ApiInput,
  ApiResult,
  ApiSession,
  ApiMutation,
} from '../common/http/api-contract.decorators.js';
import { EmployeesService } from './employees.service.js';
import { EmployeeCreationService } from './employee-creation.service.js';
import {
  CreateEmployeeDto,
  InitialSalaryDto,
  employeeCreatedResponse,
  employeeCreateOptionsResponse,
} from './dto/employee-create.dto.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import { EmployeeEditingService } from './employee-editing.service.js';
import {
  EmployeeLeaseDto,
  AcquireEmployeeLeaseDto,
  EditEmployeeDto,
  employeeLeaseResponse,
  employeeEditResponse,
} from './dto/employee-edit.dto.js';
import { messageResponse } from '../common/dto/message-response.dto.js';
import {
  EmployeeQueryDto,
  EmployeeParamsDto,
  EmployeeSalaryQueryDto,
} from './dto/employees.dto.js';
import {
  employeeResponse,
  employeePageResponse,
  employeeFiltersResponse,
  employeeSalaryResponse,
} from './dto/employees-response.dto.js';

@ApiTags('Employees')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 409, 422, 423, 500)
@Controller('/api/v1/employees')
@UseGuards(MutationRequestGuard)
export class EmployeesController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(EmployeesService) private readonly service: EmployeesService,
    @Inject(EmployeeCreationService) private readonly creation: EmployeeCreationService,
    @Inject(EmployeeEditingService) private readonly editing: EmployeeEditingService,
  ) {}
  @Post(':id/edit-lease')
  @ApiMutation()
  @ApiInput(EmployeeParamsDto, 'path')
  @ApiResult(employeeLeaseResponse, 201)
  @ApiInput(AcquireEmployeeLeaseDto, 'body')
  acquireLease(
    @Req() req: Request,
    @Param() params: EmployeeParamsDto,
    @Body() body: AcquireEmployeeLeaseDto,
  ) {
    return this.editing.acquire(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.expectedVersion,
    );
  }
  @Post(':id/edit-lease/renew')
  @ApiMutation()
  @ApiInput(EmployeeParamsDto, 'path')
  @ApiInput(EmployeeLeaseDto, 'body')
  @ApiResult(employeeLeaseResponse, 201)
  renewLease(
    @Req() req: Request,
    @Param() params: EmployeeParamsDto,
    @Body() body: EmployeeLeaseDto,
  ) {
    return this.editing.renew(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.leaseToken,
    );
  }
  @Post(':id/edit-lease/release')
  @ApiMutation()
  @ApiInput(EmployeeParamsDto, 'path')
  @ApiInput(EmployeeLeaseDto, 'body')
  @ApiResult(messageResponse, 201)
  releaseLease(
    @Req() req: Request,
    @Param() params: EmployeeParamsDto,
    @Body() body: EmployeeLeaseDto,
  ) {
    return this.editing.release(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.leaseToken,
    );
  }
  @Patch(':id')
  @ApiMutation()
  @ApiInput(EmployeeParamsDto, 'path')
  @ApiInput(EditEmployeeDto, 'body')
  @ApiResult(employeeEditResponse)
  edit(@Req() req: Request, @Param() params: EmployeeParamsDto, @Body() body: EditEmployeeDto) {
    return this.editing.edit(this.security.token(req), this.security.csrf(req), params.id, body);
  }

  @Post()
  @ApiMutation()
  @ApiInput(CreateEmployeeDto, 'body')
  @ApiResult(employeeCreatedResponse, 201)
  create(@Req() req: Request, @Body() body: CreateEmployeeDto) {
    return this.creation.create(this.security.token(req), this.security.csrf(req), body);
  }

  @Get('create-options')
  @ApiResult(employeeCreateOptionsResponse)
  createOptions(@Req() req: Request) {
    return this.creation.options(this.security.token(req));
  }
  @Post(':id/initial-salary')
  @ApiMutation()
  @ApiInput(EmployeeParamsDto, 'path')
  @ApiInput(InitialSalaryDto, 'body')
  @ApiResult(employeeCreatedResponse, 201)
  initialSalary(
    @Req() req: Request,
    @Param() params: EmployeeParamsDto,
    @Body() body: InitialSalaryDto,
  ) {
    return this.creation.resubmit(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body,
    );
  }

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
  @Get(':id/salary')
  @ApiInput(EmployeeParamsDto, 'path')
  @ApiInput(EmployeeSalaryQueryDto, 'query')
  @ApiResult(employeeSalaryResponse)
  salary(
    @Req() req: Request,
    @Param() params: EmployeeParamsDto,
    @Query() query: EmployeeSalaryQueryDto,
  ) {
    return this.service.salary(this.security.token(req), params.id, query.page);
  }
}
