import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { withTransaction } from '../database/transaction.js';
import { sqlState } from '../database/database-errors.js';
import {
  createPayrollDraftInput,
  revisePayrollDraftInput,
  type PayrollDraftResponse,
} from './dto/payroll-drafts.dto.js';

type ListInput = { period?: string; search: string; page: number };
const select = `d.id,r.id "revisionId",d.employee_id "employeeId",to_char(d.period_month,'YYYY-MM') period,d.period_month::text "periodStart",d.period_end::text "periodEnd",d.pay_date::text "payDate",d.country_code "countryCode",d.currency,'DRAFT'::text status,r.version,r.employee_snapshot employee,r.earnings,r.deductions,r.reason,r.created_by_name "updatedByName",r.created_at "updatedAt",false replayed`;
const from = `FROM payroll_drafts d JOIN payroll_draft_revisions r ON r.draft_id=d.id AND r.version=d.version JOIN users u ON u.id=r.created_by JOIN employees employee ON employee.id=d.employee_id AND employee.removed_at IS NULL`;
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

@Injectable()
export class PayrollDraftsService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
  ) {}
  private async actor(client: PoolClient, token: string, csrf?: string) {
    const actor = await this.auth.authenticateWithin(client, token, csrf);
    if (!actor) throw new ApplicationError('Sign in required', 401);
    if (!actor.isHrManager)
      throw new ApplicationError('HR Manager access required for manual payroll drafts', 403);
    return actor;
  }
  private async run<T>(work: (client: PoolClient) => Promise<T>) {
    try {
      return await withTransaction(this.pool, work);
    } catch (error) {
      const state = sqlState(error);
      if (state === '42501')
        throw new ApplicationError(
          'Draft changes require an independent HR manager with a live employee link',
          403,
        );
      if (['23505', '23514', '23503', '40001', '40P01'].includes(state ?? ''))
        throw new ApplicationError(
          'The draft or employee changed. Refresh the current draft before retrying.',
          409,
        );
      throw error;
    }
  }
  private async subject(client: PoolClient, actorId: string, employeeId: string) {
    const linked = (
      await client.query<{ employee_id: string | null }>(
        'SELECT employee_id FROM users WHERE id=$1',
        [actorId],
      )
    ).rows[0]?.employee_id;
    if (!linked || linked === employeeId)
      throw new ApplicationError(
        'You cannot edit your own payroll draft. Another HR manager must link your account before you edit other employees’ drafts.',
        403,
      );
    const employees = (
      await client.query<{
        id: string;
        employee_code: string;
        first_name: string;
        last_name: string;
        email: string;
        removed_at: Date | null;
      }>(
        'SELECT id,employee_code,first_name,last_name,email::text,removed_at FROM employees WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',
        [[linked, employeeId]],
      )
    ).rows;
    if (!employees.some((row) => row.id === linked && row.removed_at === null))
      throw new ApplicationError('Your employee link is no longer active', 403);
    const employee = employees.find((row) => row.id === employeeId && row.removed_at === null);
    if (!employee) throw new ApplicationError('Employee unavailable', 404);
    return {
      id: employee.id,
      code: employee.employee_code,
      name: employee.first_name + ' ' + employee.last_name,
      email: employee.email,
    };
  }
  private async revision(
    client: PoolClient,
    draftId: string,
    version?: number,
  ): Promise<PayrollDraftResponse> {
    const result = await client.query<PayrollDraftResponse>(
      `SELECT ${select} FROM payroll_drafts d JOIN payroll_draft_revisions r ON r.draft_id=d.id AND r.version=coalesce($2::int,d.version) JOIN users u ON u.id=r.created_by JOIN employees employee ON employee.id=d.employee_id AND employee.removed_at IS NULL WHERE d.id=$1`,
      [draftId, version ?? null],
    );
    if (!result.rowCount) throw new ApplicationError('Payroll draft unavailable', 404);
    return result.rows[0]!;
  }
  private async replay(client: PoolClient, actorId: string, commandId: string, inputHash: string) {
    const prior = (
      await client.query<{ input_hash: string; draft_id: string; version: number }>(
        'SELECT c.input_hash,c.draft_id,r.version FROM payroll_draft_commands c JOIN payroll_draft_revisions r ON r.id=c.revision_id WHERE c.actor_id=$1 AND c.command_id=$2',
        [actorId, commandId],
      )
    ).rows[0];
    if (!prior) return null;
    if (prior.input_hash !== inputHash)
      throw new ApplicationError(
        'This submission key was already used for different draft details. Start a new save.',
        409,
      );
    return { ...(await this.revision(client, prior.draft_id, prior.version)), replayed: true };
  }
  list(token: string, input: ListInput) {
    return this.run(async (client) => {
      await this.actor(client, token);
      const pattern = '%' + input.search.replace(/[\\%_]/g, '\\$&') + '%';
      const where = `WHERE ($1::text IS NULL OR d.period_month=($1||'-01')::date) AND ($2='' OR r.employee_snapshot->>'code' ILIKE $3 ESCAPE E'\\\\' OR r.employee_snapshot->>'name' ILIKE $3 ESCAPE E'\\\\' OR r.employee_snapshot->>'email' ILIKE $3 ESCAPE E'\\\\')`;
      const params = [input.period ?? null, input.search, pattern];
      const items = (
        await client.query<PayrollDraftResponse>(
          `SELECT ${select} ${from} ${where} ORDER BY d.period_month DESC,d.updated_at DESC,d.id LIMIT 25 OFFSET $4`,
          [...params, (input.page - 1) * 25],
        )
      ).rows;
      const total = (
        await client.query<{ n: number }>(`SELECT count(*)::int n ${from} ${where}`, params)
      ).rows[0]!.n;
      return { items, total, page: input.page, pageSize: 25 };
    });
  }
  detail(token: string, id: string) {
    return this.run(async (client) => {
      await this.actor(client, token);
      return this.revision(client, id.toLowerCase());
    });
  }
  revisions(token: string, id: string, page: number) {
    return this.run(async (client) => {
      await this.actor(client, token);
      const current = await this.revision(client, id.toLowerCase());
      const items = (
        await client.query<PayrollDraftResponse>(
          `SELECT ${select} FROM payroll_drafts d JOIN payroll_draft_revisions r ON r.draft_id=d.id JOIN users u ON u.id=r.created_by WHERE d.id=$1 ORDER BY r.version DESC LIMIT 25 OFFSET $2`,
          [id, (page - 1) * 25],
        )
      ).rows;
      return { items, total: current.version, page, pageSize: 25 };
    });
  }
  create(token: string, csrf: string, input: z.output<typeof createPayrollDraftInput>) {
    const q = createPayrollDraftInput.parse(input);
    const employeeId = q.employeeId.toLowerCase();
    const inputHash = digest({
      action: 'CREATE',
      employeeId,
      period: q.period,
      earnings: q.earnings,
      deductions: q.deductions,
      reason: q.reason,
    });
    return this.run(async (client) => {
      const actor = await this.actor(client, token, csrf);
      const snapshot = await this.subject(client, actor.id, employeeId);
      const replay = await this.replay(client, actor.id, q.commandId, inputHash);
      if (replay) return replay;
      const id = randomUUID();
      const revisionId = randomUUID();
      await client.query(
        `INSERT INTO payroll_drafts(id,employee_id,period_month,period_end,pay_date) VALUES($1,$2,($3||'-01')::date,(($3||'-01')::date+interval '1 month'-interval '1 day')::date,(($3||'-01')::date+interval '1 month'+interval '6 days')::date)`,
        [id, employeeId, q.period],
      );
      await client.query(
        'INSERT INTO payroll_draft_revisions(id,draft_id,version,employee_snapshot,earnings,deductions,reason,created_by) VALUES($1,$2,1,$3,$4,$5,$6,$7)',
        [revisionId, id, snapshot, q.earnings, q.deductions, q.reason, actor.id],
      );
      await client.query(
        'INSERT INTO payroll_draft_commands(actor_id,command_id,input_hash,draft_id,revision_id) VALUES($1,$2,$3,$4,$5)',
        [actor.id, q.commandId, inputHash, id, revisionId],
      );
      return this.revision(client, id, 1);
    });
  }
  revise(token: string, csrf: string, id: string, input: z.output<typeof revisePayrollDraftInput>) {
    id = id.toLowerCase();
    const q = revisePayrollDraftInput.parse(input);
    const inputHash = digest({
      action: 'REVISE',
      id,
      earnings: q.earnings,
      deductions: q.deductions,
      reason: q.reason,
    });
    return this.run(async (client) => {
      const actor = await this.actor(client, token, csrf);
      const header = (
        await client.query<{ employee_id: string }>(
          'SELECT employee_id FROM payroll_drafts WHERE id=$1',
          [id],
        )
      ).rows[0];
      if (!header) throw new ApplicationError('Payroll draft unavailable', 404);
      const snapshot = await this.subject(client, actor.id, header.employee_id);
      const replay = await this.replay(client, actor.id, q.commandId, inputHash);
      if (replay) return replay;
      const current = (
        await client.query<{ version: number }>(
          'SELECT version FROM payroll_drafts WHERE id=$1 FOR UPDATE',
          [id],
        )
      ).rows[0]!;
      if (current.version !== q.expectedVersion)
        throw new ApplicationError(
          'Another HR manager changed this draft. Refresh and review the latest version.',
          409,
        );
      const version = current.version + 1;
      const revisionId = randomUUID();
      await client.query(
        'UPDATE payroll_drafts SET version=$2,updated_at=clock_timestamp() WHERE id=$1',
        [id, version],
      );
      await client.query(
        'INSERT INTO payroll_draft_revisions(id,draft_id,version,employee_snapshot,earnings,deductions,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [revisionId, id, version, snapshot, q.earnings, q.deductions, q.reason, actor.id],
      );
      await client.query(
        'INSERT INTO payroll_draft_commands(actor_id,command_id,input_hash,draft_id,revision_id) VALUES($1,$2,$3,$4,$5)',
        [actor.id, q.commandId, inputHash, id, revisionId],
      );
      return this.revision(client, id, version);
    });
  }
}
