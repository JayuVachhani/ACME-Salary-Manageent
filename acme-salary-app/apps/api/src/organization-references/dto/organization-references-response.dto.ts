import { z } from 'zod';
export const referenceResponse = z.object({ id: z.uuid(), name: z.string(), is_active: z.boolean(), version: z.number().int() });
export const referencePageResponse = z.object({ items: z.array(referenceResponse), total: z.number().int() });

export type ReferenceResponse = z.output<typeof referenceResponse>;
