import { z } from 'zod';
export const employeeQuery = z.object({ search: z.string().trim().max(200).default(''), country: z.string().regex(/^[A-Z]{2}$/).optional(), department: z.uuid().optional(), status: z.enum(['ACTIVE', 'INACTIVE']).optional(), sort: z.enum(['code', 'name', 'joiningDate', 'department', 'country']).default('code'), direction: z.enum(['asc', 'desc']).default('asc'), page: z.coerce.number().int().min(1).max(100000).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).strict();
export const employeeId = z.uuid();
