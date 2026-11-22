import { timestampText } from '../../common/dto/response-values.js';
import { z } from 'zod';
export const memberResponse = z.object({ id: z.uuid(), email: z.email(), full_name: z.string(), is_hr_manager: z.boolean(),
  permissions: z.array(z.string()), status: z.enum(['INVITED', 'ACTIVE', 'DELETED']), invite_expires_at: timestampText.nullable(), team_version: z.number().int(), employee_id: z.uuid().nullable() });
export const teamPageResponse = z.object({ items: z.array(memberResponse), total: z.number().int() });
export const invitationResponse = z.object({ account: memberResponse, delivery: z.enum(['sent', 'failed', 'failed_audit_unavailable']) });

export type MemberResponse = z.output<typeof memberResponse>;
export type MemberRecord = Omit<MemberResponse, 'invite_expires_at'> & { invite_expires_at: Date | null };
