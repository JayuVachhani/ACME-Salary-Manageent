import { requestDto } from '../../common/dto/request-dto.js';
import { z } from 'zod';
export const employeeQuery = z
  .object({
    search: z.string().trim().max(200).default(''),
    country: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    department: z.uuid().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    sort: z.enum(['code', 'name', 'joiningDate', 'department', 'country']).default('code'),
    direction: z.enum(['asc', 'desc']).default('asc'),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();
export const employeeId = z.uuid();
export class EmployeeSalaryQueryDto extends requestDto(
  z
    .object({
      page: z.coerce.number().int().min(1).max(100000).default(1),
      requestsPage: z.coerce.number().int().min(1).max(100000).default(1),
    })
    .strict(),
  'Invalid salary history page',
) {}

export class EmployeeQueryDto extends requestDto(
  employeeQuery,
  'Invalid employee filters or pagination',
) {}

export class EmployeeParamsDto extends requestDto(
  z.object({ id: employeeId }).strict(),
  'Invalid employee identifier',
) {}
