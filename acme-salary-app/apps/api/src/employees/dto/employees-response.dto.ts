import { z } from 'zod';
export const employeeResponse = z.object({ id: z.uuid(), employee_code: z.string(), email: z.string(), first_name: z.string(), last_name: z.string(),
  joining_date: z.string(), version: z.number().int(), country_code: z.string().nullable(), country_name: z.string().nullable(),
  department_id: z.uuid().nullable(), department: z.string().nullable(), designation_id: z.uuid().nullable(), designation: z.string().nullable(), employment_status: z.string().nullable() });
export const employeePageResponse = z.object({ items: z.array(employeeResponse), total: z.number().int(), page: z.number().int(), pageSize: z.number().int() });
export const employeeFiltersResponse = z.object({ countries: z.array(z.object({ code: z.string(), name: z.string(), is_active: z.boolean() })),
  departments: z.array(z.object({ id: z.uuid(), name: z.string(), is_active: z.boolean() })) });

export type EmployeeResponse = z.output<typeof employeeResponse>;
export type EmployeePageResponse = z.output<typeof employeePageResponse>;
export type EmployeeFiltersResponse = z.output<typeof employeeFiltersResponse>;
