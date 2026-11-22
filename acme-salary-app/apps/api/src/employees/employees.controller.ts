import { Controller, Get, Inject, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { EmployeesService } from './employees.service.js';
import { employeeQuery, employeeId } from './dto/employees.dto.js';
@Controller('/api/v1/employees')
export class EmployeesController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(EmployeesService) private readonly service: EmployeesService,
  ) {}
  @Get()
  list(@Req() req: Request, @Query(new ZodValidationPipe(employeeQuery, 'Invalid employee filters or pagination')) query: z.infer<typeof employeeQuery>) {
    return this.service.list(this.security.token(req), query);
  }
  @Get('filters') filters(@Req() req: Request) { return this.service.filters(this.security.token(req)); }
  @Get(':id')
  detail(@Req() req: Request, @Param('id', new ZodValidationPipe(employeeId, 'Invalid employee identifier')) id: string) {
    return this.service.detail(this.security.token(req), id);
  }
}
