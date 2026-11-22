import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { withTransaction } from '../database/transaction.js';
import { sqlState } from '../database/database-errors.js';
import { employeeEditInput } from './dto/employee-edit.dto.js';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
@Injectable()
export class EmployeeEditingService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
  ) {}
  private async run<T>(
    token: string,
    csrf: string,
    id: string,
    work: (client: PoolClient, actorId: string, version: number) => Promise<T>,
  ) {
    try {
      return await withTransaction(this.pool, async (client) => {
        const actor = await this.auth.authenticateWithin(client, token, csrf);
        if (!actor) throw new ApplicationError('Sign in required', 401);
        if (
          !actor.isHrManager &&
          !(actor.permissions.includes('read') && actor.permissions.includes('edit'))
        )
          throw new ApplicationError('Employee edit permission required', 403);
        const employee = (
          await client.query<{ version: number }>(
            'SELECT version FROM employees WHERE id=$1 AND removed_at IS NULL FOR UPDATE',
            [id],
          )
        ).rows[0];
        if (!employee) throw new ApplicationError('Employee unavailable', 404);
        return work(client, actor.id, employee.version);
      });
    } catch (error) {
      const state = sqlState(error);
      if (state === '23505')
        throw new ApplicationError('This work email is already used by another employee', 409);
      if (['40001', '40P01'].includes(state ?? ''))
        throw new ApplicationError('Another update is in progress. Refresh before retrying.', 409);
      throw error;
    }
  }
  acquire(token: string, csrf: string, id: string, expectedVersion: number) {
    return this.run(token, csrf, id, async (client, actor, version) => {
      if (version !== expectedVersion)
        throw new ApplicationError('Employee changed. Refresh the profile before editing.', 409);
      const lock = (
        await client.query<{ full_name: string }>(
          `SELECT u.full_name FROM record_locks l JOIN users u ON u.id=l.locked_by WHERE l.employee_id=$1 AND l.expires_at>clock_timestamp()`,
          [id],
        )
      ).rows[0];
      if (lock)
        throw new ApplicationError(
          `${lock.full_name} is editing this employee. Try again after they finish or the edit session expires.`,
          423,
        );
      const leaseToken = randomBytes(32).toString('base64url');
      const result = await client.query<{ expires_at: Date }>(
        `INSERT INTO record_locks(employee_id,locked_by,token_hash,locked_at,expires_at) VALUES($1,$2,$3,clock_timestamp(),clock_timestamp()+interval '15 minutes') ON CONFLICT(employee_id) DO UPDATE SET locked_by=EXCLUDED.locked_by,token_hash=EXCLUDED.token_hash,locked_at=EXCLUDED.locked_at,expires_at=EXCLUDED.expires_at RETURNING expires_at`,
        [id, actor, digest(leaseToken)],
      );
      return { leaseToken, expiresAt: result.rows[0]!.expires_at.toISOString(), version };
    });
  }
  renew(token: string, csrf: string, id: string, leaseToken: string) {
    return this.run(token, csrf, id, async (client, actor, version) => {
      const result = await client.query<{ expires_at: Date }>(
        `UPDATE record_locks SET expires_at=clock_timestamp()+interval '15 minutes' WHERE employee_id=$1 AND locked_by=$2 AND token_hash=$3 AND expires_at>clock_timestamp() RETURNING expires_at`,
        [id, actor, digest(leaseToken)],
      );
      if (!result.rowCount)
        throw new ApplicationError('Edit session expired. Cancel and reopen the form.', 409);
      return { leaseToken, expiresAt: result.rows[0]!.expires_at.toISOString(), version };
    });
  }
  release(token: string, csrf: string, id: string, leaseToken: string) {
    return this.run(token, csrf, id, async (client, actor) => {
      await client.query(
        'DELETE FROM record_locks WHERE employee_id=$1 AND locked_by=$2 AND token_hash=$3',
        [id, actor, digest(leaseToken)],
      );
      return { message: 'Edit session closed' };
    });
  }
  edit(token: string, csrf: string, id: string, input: z.output<typeof employeeEditInput>) {
    const q = employeeEditInput.parse(input);
    return this.run(token, csrf, id, async (client, actor, version) => {
      if (version !== q.expectedVersion)
        throw new ApplicationError(
          'Employee changed. Cancel and reopen the profile before editing.',
          409,
        );
      if (
        !(
          await client.query(
            'SELECT 1 FROM record_locks WHERE employee_id=$1 AND locked_by=$2 AND token_hash=$3 AND expires_at>clock_timestamp()',
            [id, actor, digest(q.leaseToken)],
          )
        ).rowCount
      )
        throw new ApplicationError('Edit session expired. Reopen the form.', 409);
      const before = (
        await client.query<{ first_name: string; last_name: string; email: string }>(
          'SELECT first_name,last_name,email::text FROM employees WHERE id=$1',
          [id],
        )
      ).rows[0]!;
      const result = await client.query<{ id: string; version: number }>(
        'UPDATE employees SET first_name=$2,last_name=$3,email=$4,version=version+1,updated_at=clock_timestamp() WHERE id=$1 RETURNING id,version',
        [id, q.firstName, q.lastName, q.email],
      );
      await client.query(
        `INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload) VALUES($1,'EMPLOYEE',$2,'DETAILS_CHANGED',$3,$4)`,
        [
          actor,
          id,
          q.reason,
          JSON.stringify({
            before,
            after: { first_name: q.firstName, last_name: q.lastName, email: q.email },
          }),
        ],
      );
      await client.query(
        `UPDATE report_snapshots SET invalidated_at=clock_timestamp() WHERE invalidated_at IS NULL AND id IN(SELECT snapshot_id FROM report_snapshot_employees WHERE employee_id=$1)`,
        [id],
      );
      await client.query(
        'DELETE FROM record_locks WHERE employee_id=$1 AND locked_by=$2 AND token_hash=$3',
        [id, actor, digest(q.leaseToken)],
      );
      return result.rows[0]!;
    });
  }
}
