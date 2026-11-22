export type Account = {
  id: string;
  email: string;
  full_name: string;
  is_hr_manager: boolean;
  permissions: string[];
  status: string;
  team_version: number;
  employee_id: string | null;
  invite_expires_at: string | null;
};
export type MemberInput = { fullName: string; isHrManager: boolean; permissions: string[] };
export type TeamProps = { userId: string; onSelfRemoved: () => void };
export const rights = ['read', 'write', 'edit', 'delete', 'salary:view', 'export'];

export type Delivery = 'sent' | 'failed' | 'failed_audit_unavailable';
export type InvitationResult = { account: Account; delivery: Delivery };
