import { HttpException } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from './authentication.js';

const permissions = z.array(z.enum(['read','write','edit','delete','salary:view','export'])).max(6).refine(values => new Set(values).size === values.length, 'Duplicate permissions');
export const inviteInput = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()),
  fullName: z.string().trim().min(1).max(200), isHrManager: z.boolean(), permissions }).strict();
export const changeInput = inviteInput.omit({ email: true }).extend({ expectedVersion: z.number().int().positive() }).strict();
export const versionInput = z.object({ expectedVersion: z.number().int().positive() }).strict();
export const linkageInput = versionInput.extend({ employeeId: z.uuid().nullable(),
  reason: z.string().trim().min(1).max(1000), confirmed: z.literal(true) }).strict();
const columns = 'id,email,full_name,is_hr_manager,permissions,status,invite_expires_at,team_version,employee_id';

export class TeamService {
  constructor(private readonly pool: Pool, private readonly auth: AuthenticationService) {}
  private async run<T>(token: string, csrf: string | undefined, mutate: boolean, work: (client: PoolClient, actor: string) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_team_management'))");
      if (mutate && !csrf) throw new HttpException('CSRF token required', 403);
      const user = await this.auth.authenticateWithin(client, token, mutate ? csrf : undefined);
      if (!user) throw new HttpException(mutate ? 'Request rejected' : 'Sign in required', mutate ? 403 : 401);
      if (!user.isHrManager) throw new HttpException('HR Manager access required', 403);
      if (mutate) await client.query("SELECT set_config('acme.team_actor',$1,true)", [user.id]);
      const result = await work(client, user.id);
      await client.query('COMMIT'); return result;
    } catch (error) {
      await client.query('ROLLBACK');
      const code = (error as {code?: string}).code;
      if (code === '23505') throw new HttpException('Email or employee is already assigned to an account', 409);
      if (code === '23514') throw new HttpException('Account or employee state prevents this change', 409);
      if (code === '42501') throw new HttpException('This team change is not permitted', 403);
      throw error;
    } finally { client.release(); }
  }
  async list(token: string, offset = 0) {
    return this.run(token, undefined, false, async client => ({
      items: (await client.query(`SELECT ${columns} FROM users WHERE NOT is_system AND status<>'DELETED' ORDER BY created_at,id LIMIT 20 OFFSET $1`, [offset])).rows,
      total: (await client.query("SELECT count(*)::int n FROM users WHERE NOT is_system AND status<>'DELETED'")).rows[0].n as number
    }));
  }
  async invite(token: string, csrf: string, input: z.infer<typeof inviteInput>) {
    return this.run(token, csrf, true, async (client, actor) => (await client.query(`INSERT INTO users(email,full_name,is_hr_manager,permissions,status,invited_by,invite_expires_at)
      VALUES($1,$2,$3,$4,'INVITED',$5,clock_timestamp()+interval '7 days') RETURNING ${columns}`,
      [input.email,input.fullName,input.isHrManager,input.permissions,actor])).rows[0]);
  }
  async change(token: string, csrf: string, id: string, input: z.infer<typeof changeInput>) {
    return this.run(token, csrf, true, async client => {
      const result = await client.query(`UPDATE users SET full_name=$2,is_hr_manager=$3,permissions=$4
        WHERE id=$1 AND NOT is_system AND status<>'DELETED' AND team_version=$5 RETURNING ${columns}`,
        [id,input.fullName,input.isHrManager,input.permissions,input.expectedVersion]);
      if (!result.rowCount) throw new HttpException('Account changed or is unavailable; refresh the team list',409);
      return result.rows[0];
    });
  }
  async remove(token: string, csrf: string, id: string, version: number) {
    return this.run(token, csrf, true, async client => {
      const result = await client.query(`UPDATE users SET status='DELETED',deleted_at=clock_timestamp()
        WHERE id=$1 AND NOT is_system AND status<>'DELETED' AND team_version=$2 RETURNING id`, [id,version]);
      if (!result.rowCount) throw new HttpException('Account changed or is unavailable; refresh the team list',409);
    });
  }
  async reinvite(token: string, csrf: string, id: string, version: number) {
    return this.run(token, csrf, true, async client => {
      const result = await client.query(`UPDATE users SET invite_expires_at=clock_timestamp()+interval '7 days'
        WHERE id=$1 AND NOT is_system AND status='INVITED' AND team_version=$2 RETURNING ${columns}`, [id,version]);
      if (!result.rowCount) throw new HttpException('Invitation changed or is unavailable; refresh the team list',409);
      await client.query('UPDATE login_challenges SET consumed_at=clock_timestamp() WHERE user_id=$1 AND consumed_at IS NULL',[id]);
      return result.rows[0];
    });
  }
  async linkEmployee(token: string, csrf: string, id: string, input: z.infer<typeof linkageInput>) {
    const value = linkageInput.parse(input);
    return this.run(token, csrf, true, async (client, actor) => {
      if (id === actor) throw new HttpException('Own employee linkage cannot be changed', 403);
      const target = (await client.query(`SELECT employee_id FROM users
        WHERE id=$1 AND NOT is_system AND status<>'DELETED' AND team_version=$2 FOR UPDATE`,
        [id,value.expectedVersion])).rows[0];
      if (!target) throw new HttpException('Account changed or is unavailable; refresh the team list',409);
      if (target.employee_id === value.employeeId) throw new HttpException('Employee linkage is unchanged',409);
      await client.query(`SELECT set_config('acme.link_actor',$1,true),
        set_config('acme.link_reason',$2,true),set_config('acme.link_confirmed','true',true)`,[actor,value.reason]);
      return (await client.query(`UPDATE users SET employee_id=$2 WHERE id=$1 RETURNING ${columns}`,
        [id,value.employeeId])).rows[0];
    });
  }
}
