import { offsetQuery } from '../../common/dto/pagination.dto.js';
import { requestDto } from '../../common/dto/request-dto.js';
import { z } from 'zod';
export const referenceKind = z.enum(['departments', 'designations']);
export type ReferenceKind = z.infer<typeof referenceKind>;
export const referenceCreate = z.object({ name: z.string().trim().min(1).max(200) }).strict();
export const referenceChange = referenceCreate
  .extend({ isActive: z.boolean(), expectedVersion: z.number().int().positive() })
  .strict();

export class CreateReferenceDto extends requestDto(referenceCreate, 'Invalid reference details') {}

export class ChangeReferenceDto extends requestDto(referenceChange, 'Invalid reference details') {}

export class ReferenceKindParamsDto extends requestDto(
  z.object({ kind: referenceKind }).strict(),
  'Invalid reference details',
) {}

export class ReferenceParamsDto extends requestDto(
  z.object({ kind: referenceKind, id: z.uuid() }).strict(),
  'Invalid reference details',
) {}

export class ReferenceOffsetQueryDto extends requestDto(offsetQuery, 'Invalid reference details') {}
