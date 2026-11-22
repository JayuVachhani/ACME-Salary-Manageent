import { z } from 'zod';
import { requestDto } from '../../common/dto/request-dto.js';
export const employeeCreateInput = z
  .object({
    commandId: z.uuid(),
    employeeCode: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform((value) => value.toUpperCase()),
    email: z
      .email()
      .trim()
      .max(254)
      .transform((value) => value.toLowerCase()),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    joiningDate: z.iso.date(),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    departmentId: z.uuid(),
    designationId: z.uuid(),
    employmentStatus: z.enum(['ACTIVE', 'INACTIVE']),
    effectiveFrom: z.iso.date(),
    amount: z
      .string()
      .max(24)
      .regex(/^(0|[1-9]\d*)(\.\d{1,4})?$/),
    currency: z.string().regex(/^[A-Z]{3}$/),
    reason: z.string().trim().min(1).max(1000),
    confirmed: z.literal(true),
  })
  .strict();
export class CreateEmployeeDto extends requestDto(
  employeeCreateInput,
  'Check employee details, salary and confirmation',
) {}
export const initialSalaryInput = employeeCreateInput
  .pick({
    commandId: true,
    effectiveFrom: true,
    amount: true,
    currency: true,
    reason: true,
    confirmed: true,
  })
  .extend({ expectedVersion: z.number().int().positive() })
  .strict();
export class InitialSalaryDto extends requestDto(
  initialSalaryInput,
  'Check the initial salary details and employee version',
) {}
export const employeeCreatedResponse = z.object({
  employeeId: z.uuid(),
  requestId: z.uuid(),
  status: z.literal('PENDING'),
});
export const employeeCreateOptionsResponse = z.object({
  countries: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      currency: z.string(),
      decimalPlaces: z.number().int(),
    }),
  ),
  departments: z.array(z.object({ id: z.uuid(), name: z.string() })),
  designations: z.array(z.object({ id: z.uuid(), name: z.string() })),
  currencies: z.array(z.object({ code: z.string() })),
});
