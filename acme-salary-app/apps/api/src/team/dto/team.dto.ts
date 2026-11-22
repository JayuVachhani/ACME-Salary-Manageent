import { z } from 'zod';
const permissions = z.array(z.enum(['read', 'write', 'edit', 'delete', 'salary:view', 'export'])).max(6).refine(values => new Set(values).size === values.length, 'Duplicate permissions');
export const inviteInput = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()),
  fullName: z.string().trim().min(1).max(200), isHrManager: z.boolean(), permissions }).strict();
export const changeInput = inviteInput.omit({ email: true }).extend({ expectedVersion: z.number().int().positive() }).strict();
export const versionInput = z.object({ expectedVersion: z.number().int().positive() }).strict();

export const accountId = z.uuid();
