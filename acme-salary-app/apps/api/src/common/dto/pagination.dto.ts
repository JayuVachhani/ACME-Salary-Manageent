import { requestDto } from './request-dto.js';
import { z } from 'zod';
export const offsetQuery = z.object({ offset: z.coerce.number().int().min(0).max(100000).default(0) }).strict();

export class OffsetQueryDto extends requestDto(offsetQuery, 'Invalid page') {}
