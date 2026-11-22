import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
export const leaseInput = z.object({ leaseToken: z.string().regex(/^[\w-]{43}$/) }).strict();
export class EmployeeLeaseDto extends requestDto(leaseInput, 'Invalid edit session') {}
export class AcquireEmployeeLeaseDto extends requestDto(
  z.object({ expectedVersion: z.number().int().positive() }).strict(),
  'Refresh the employee profile before editing',
) {}
export const employeeEditInput = leaseInput
  .extend({
    expectedVersion: z.number().int().positive(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    reason: z.string().trim().min(1).max(1000),
    confirmed: z.literal(true),
  })
  .strict();
export class EditEmployeeDto extends requestDto(
  employeeEditInput,
  'Check the employee details and edit session',
) {}
export const employeeLeaseResponse = z.object({
  leaseToken: z.string(),
  expiresAt: z.string(),
  version: z.number().int(),
});
export const employeeEditResponse = z.object({ id: z.uuid(), version: z.number().int() });
