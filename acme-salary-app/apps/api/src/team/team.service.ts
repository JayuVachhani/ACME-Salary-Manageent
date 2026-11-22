import { sqlState } from '../database/database-errors.js';
import { requiredRow } from '../database/query-result.js';
import type { MemberRecord } from './dto/team-response.dto.js';
import { withTransaction } from '../database/transaction.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { Inject, Injectable } from '@nestjs/common';
import { inviteInput, changeInput } from './dto/team.dto.js';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
const columns = 'id,email,full_name,is_hr_manager,permissions,status,invite_expires_at,team_version';
@Injectable()
export class TeamService {
  constructor(
  @Inject(Pool) private readonly pool: Pool,
  @Inject(AuthenticationService) private readonly auth: AuthenticationService) { }
  private async run<T>(token: string, csrf: string | undefined, mutate: boolean, work: (client: PoolClient, actor: string) => Promise<T>) {
    try {
      return await withTransaction(this.pool, async client => {
        await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_team_management'))");
        if (mutate && !csrf)
          throw new ApplicationError('CSRF token required', 403);
        const user = await this.auth.authenticateWithin(client, token, mutate ? csrf : undefined);
        if (!user)
          throw new ApplicationError(mutate ? 'Request rejected' : 'Sign in required', mutate ? 403 : 401);
        if (!user.isHrManager)
          throw new ApplicationError('HR Manager access required', 403);
        if (mutate)
          await client.query("SELECT set_config('acme.team_actor',$1,true)", [user.id]);
        const result = await work(client, user.id);
        return result;
      });
    }
    catch (error) {
      const code = sqlState(error);
      if (code === '23505')
        throw new ApplicationError('An account with this email already exists', 409);
      if (code === '23514')
        throw new ApplicationError('At least one active HR Manager must remain', 409);
      if (code === '42501')
        throw new ApplicationError('This team change is not permitted', 403);
      throw error;
    }

  }
  async list(token: string, offset = 0) {
    return this.run(token, undefined, false, async (client) => ({
      items: (await client.query<MemberRecord>(`SELECT ${columns} FROM users WHERE NOT is_system AND status<>'DELETED' ORDER BY created_at,id LIMIT 20 OFFSET $1`, [offset])).rows,
      total: requiredRow(await client.query<{ n: number }>("SELECT count(*)::int n FROM users WHERE NOT is_system AND status<>'DELETED'")).n
    }));
  }
  async invite(token: string, csrf: string, input: z.infer<typeof inviteInput>) {
    return this.run(token, csrf, true, async (client, actor) => requiredRow(await client.query<MemberRecord>(`INSERT INTO users(email,full_name,is_hr_manager,permissions,status,invited_by,invite_expires_at)
   VALUES($1,$2,$3,$4,'INVITED',$5,clock_timestamp()+interval '7 days') RETURNING ${columns}`, [input.email, input.fullName, input.isHrManager, input.permissions, actor])));
  }
  async change(token: string, csrf: string, id: string, input: z.infer<typeof changeInput>) {
    return this.run(token, csrf, true, async (client) => {
      const result = await client.query<MemberRecord>(`UPDATE users SET full_name=$2,is_hr_manager=$3,permissions=$4
    WHERE id=$1 AND NOT is_system AND status<>'DELETED' AND team_version=$5 RETURNING ${columns}`, [id, input.fullName, input.isHrManager, input.permissions, input.expectedVersion]);
      if (!result.rowCount)
        throw new ApplicationError('Account changed or is unavailable; refresh the team list', 409);
      return requiredRow(result);
    });
  }
  async remove(token: string, csrf: string, id: string, version: number) {
    return this.run(token, csrf, true, async (client) => {
      const result = await client.query(`UPDATE users SET status='DELETED',deleted_at=clock_timestamp()
    WHERE id=$1 AND NOT is_system AND status<>'DELETED' AND team_version=$2 RETURNING id`, [id, version]);
      if (!result.rowCount)
        throw new ApplicationError('Account changed or is unavailable; refresh the team list', 409);
    });
  }
  async reinvite(token: string, csrf: string, id: string, version: number) {
    return this.run(token, csrf, true, async (client) => {
      const result = await client.query<MemberRecord>(`UPDATE users SET invite_expires_at=clock_timestamp()+interval '7 days'
    WHERE id=$1 AND NOT is_system AND status='INVITED' AND team_version=$2 RETURNING ${columns}`, [id, version]);
      if (!result.rowCount)
        throw new ApplicationError('Invitation changed or is unavailable; refresh the team list', 409);
      await client.query('UPDATE login_challenges SET consumed_at=clock_timestamp() WHERE user_id=$1 AND consumed_at IS NULL', [id]);
      return requiredRow(result);
    });
  }
}
