import { permissions as permissionNames } from '../../common/domain/policy.js';
import { requestDto } from '../../common/dto/request-dto.js';
import { z } from 'zod';
const permissions = z
  .array(z.enum(permissionNames))
  .max(6)
  .refine((values) => new Set(values).size === values.length, 'Duplicate permissions')
  .describe('Each permission may appear only once');
export const inviteInput = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    fullName: z.string().trim().min(1).max(200),
    isHrManager: z.boolean(),
    permissions,
  })
  .strict();
export const changeInput = inviteInput
  .omit({ email: true })
  .extend({ expectedVersion: z.number().int().positive() })
  .strict();
export const versionInput = z.object({ expectedVersion: z.number().int().positive() }).strict();

export const accountId = z.uuid();

export class InviteMemberDto extends requestDto(
  inviteInput,
  'Invalid team details; check names, email, permissions and version',
) {}

export class ChangeMemberDto extends requestDto(
  changeInput,
  'Invalid team details; check names, email, permissions and version',
) {}

export class MemberVersionDto extends requestDto(
  versionInput,
  'Invalid team details; check names, email, permissions and version',
) {}

export class AccountParamsDto extends requestDto(
  z.object({ id: accountId }).strict(),
  'Invalid account ID',
) {}

export const linkageInput = versionInput
  .extend({
    employeeId: z.uuid().nullable(),
    reason: z.string().trim().min(1).max(1000),
    confirmed: z.literal(true),
  })
  .strict();
export class LinkEmployeeDto extends requestDto(
  linkageInput,
  'Invalid team details; check names, email, permissions and version',
) {}
