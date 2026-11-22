import type { Permission } from '../common/domain/policy.js';
export type SessionIdentity = { id: string; isHrManager: boolean; permissions: Permission[] };
export type AuthUserRecord = { id: string; status: string; is_system: boolean; invite_expires_at: Date | null; is_hr_manager: boolean; permissions: Permission[] };
export type ChallengeRecord = { consumed_at: Date | null; attempts: number; expires_at: Date; secret_hash: string };
export type SessionRecord = { token_hash: string; user_id: string; csrf_hash: string; created_at: Date; last_seen_at: Date; revoked_at: Date | null };
