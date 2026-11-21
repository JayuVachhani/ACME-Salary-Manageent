import type { PoolClient } from 'pg';
import { can, canExportSalary, type Permission, type Principal } from './policy.js';

export class SnapshotAccessError extends Error {
  constructor(public readonly code: 'ACCESS_DENIED' | 'SNAPSHOT_UNAVAILABLE') { super(code); }
}

/** Must run within the caller's transaction; actorId comes from the authenticated session. */
export async function readSalarySnapshot(client: PoolClient, actorId: string, snapshotId: string, exportRequested: boolean, now = new Date()) {
  // Lock identity before snapshot to serialize with permission updates/invalidation.
  const actorResult = await client.query<{
    id: string; employee_id: string | null; status: string; is_system: boolean;
    is_hr_manager: boolean; permissions: Permission[]; authorization_version: number;
  }>('SELECT id,employee_id,status,is_system,is_hr_manager,permissions,authorization_version FROM users WHERE id=$1 FOR SHARE', [actorId]);
  const actor = actorResult.rows[0];
  if (!actor) throw new SnapshotAccessError('ACCESS_DENIED');
  const principal: Principal = { id: actor.id, employeeId: actor.employee_id, active: actor.status === 'ACTIVE',
    isSystem: actor.is_system, isHrManager: actor.is_hr_manager, permissions: actor.permissions };
  if (!(exportRequested ? canExportSalary(principal) : can(principal, 'read') && can(principal, 'salary:view'))) {
    throw new SnapshotAccessError('ACCESS_DENIED');
  }
  const result = await client.query<{ payload: unknown; as_of: Date; target_currency: string }>(
    `SELECT payload,as_of,target_currency FROM report_snapshots
     WHERE id=$1 AND owner_id=$2 AND authorization_version=$3
       AND invalidated_at IS NULL AND expires_at>$4 FOR SHARE`,
    [snapshotId, actorId, actor.authorization_version, now]);
  if (!result.rows[0]) throw new SnapshotAccessError('SNAPSHOT_UNAVAILABLE');
  return result.rows[0];
}
