import { Inject } from '@nestjs/common';
import { Controller, Get, HttpException, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { EmployeesService, employeeQuery, employeeId } from './employees.service.js';
@Controller('/api/v1/employees')
export class EmployeesController {
  constructor(
    @Inject(EmployeesService) private readonly service: EmployeesService) { }
  private readonly token = (req: Request) => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('acme_session='))?.slice(13) ?? '';
  @Get()
  list(
    @Req() req: Request) {
      const q = employeeQuery.safeParse(req.query); if (!q.success)
        throw new HttpException('Invalid employee filters or pagination', 400); return this.service.list(this.token(req), q.data);
  }
  @Get('filters')
  filters(
    @Req() req: Request) { return this.service.filters(this.token(req)); }
  @Get(':id')
  detail(
    @Req() req: Request,
    @Param('id') id: string) {
      if (!employeeId.safeParse(id).success)
        throw new HttpException('Invalid employee identifier', 400); return this.service.detail(this.token(req), id);
  }
}
