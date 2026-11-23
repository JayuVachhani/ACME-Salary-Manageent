import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
import { employeeQuery } from '../../employees/dto/employees.dto.js';

// The salary roster follows the same employee search/filter/pagination contract as the directory.
export class SalaryWorkspaceQueryDto extends requestDto(
  employeeQuery,
  'Check salary workspace search, filters and pagination',
) {}
export const workspaceSalaryResponse = z.object({
  id: z.uuid(),
  amount: z.string(),
  currency: z.string(),
  effectiveFrom: z.string(),
  decimalPlaces: z.number().int(),
  approvalStatus: z.enum(['ACTIVE', 'WAITING_MANAGEMENT_APPROVAL']),
});
export const salaryWorkspaceItemResponse = z.object({
  employeeId: z.uuid(),
  employeeCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  joiningDate: z.string(),
  version: z.number().int(),
  countryCode: z.string().nullable(),
  countryName: z.string().nullable(),
  departmentId: z.uuid().nullable(),
  department: z.string().nullable(),
  designation: z.string().nullable(),
  employmentStatus: z.string().nullable(),
  current: workspaceSalaryResponse.nullable(),
  nextScheduled: workspaceSalaryResponse.nullable(),
  pendingCount: z.number().int(),
});
export const salaryWorkspaceResponse = z.object({
  items: z.array(salaryWorkspaceItemResponse),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  businessDate: z.string(),
});
export const salaryBulkResolveInput = z
  .object({
    employeeCodes: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(100)
          .transform((value) => value.toUpperCase()),
      )
      .min(1)
      .max(100)
      .refine((codes) => new Set(codes).size === codes.length, 'Employee codes must be unique'),
  })
  .strict();
export class SalaryBulkResolveDto extends requestDto(
  salaryBulkResolveInput,
  'Enter up to 100 unique employee codes',
) {}
export const salaryBulkResolvedResponse = z.array(
  z.object({
    employeeCode: z.string(),
    id: z.uuid(),
    version: z.number().int(),
    firstName: z.string(),
    lastName: z.string(),
  }),
);
