import { z } from 'zod';
export const referenceKind = z.enum(['departments', 'designations']);
export type ReferenceKind = z.infer<typeof referenceKind>;
export const referenceCreate = z.object({ name: z.string().trim().min(1).max(200) }).strict();
export const referenceChange = referenceCreate.extend({ isActive: z.boolean(), expectedVersion: z.number().int().positive() }).strict();
