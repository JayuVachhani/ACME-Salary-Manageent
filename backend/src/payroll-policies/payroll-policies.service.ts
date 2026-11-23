import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { withTransaction } from '../database/transaction.js';
import {
  createPayrollPolicyInput,
  payrollPolicyConfig,
  type PayrollPolicyConfig,
} from './dto/payroll-policy.dto.js';
export type PayrollPolicySnapshot = {
  policyId: string;
  version: number;
  policyHash: string;
  config: PayrollPolicyConfig;
  financeApproverIds: string[];
  directorApproverIds: string[];
  requiresDirector: boolean;
  finalizerRole: 'HR' | 'FINANCE';
  createdBy: string;
  approvedBy: string;
};
const projection = `p.id,p.policy_key "policyKey",p.version,p.effective_from::text "effectiveFrom",p.config,p.policy_hash "policyHash",p.created_by "createdBy",u.full_name "createdByName",p.created_at "createdAt",CASE WHEN a.policy_id IS NULL THEN 'INACTIVE' ELSE 'ACTIVE' END status,a.approved_by "approvedBy",v.full_name "approvedByName",a.approved_at "approvedAt",p.reason,coalesce((SELECT jsonb_agg(jsonb_build_object('id',person.id,'name',person.full_name,'employeeCode',employee.employee_code,'role',assignment.role,'active',person.status='ACTIVE' AND NOT person.is_system AND employee.id IS NOT NULL AND employee.removed_at IS NULL AND (person.is_hr_manager OR person.permissions@>ARRAY['read','salary:view']))) FROM (SELECT jsonb_array_elements_text(p.config->'financeApproverIds')::uuid id,'FINANCE'::text role UNION ALL SELECT jsonb_array_elements_text(p.config->'directorApproverIds')::uuid id,'DIRECTOR'::text role) assignment JOIN users person ON person.id=assignment.id LEFT JOIN employees employee ON employee.id=person.employee_id),'[]'::jsonb) assignees`;
const joins = `FROM payroll_policies p JOIN users u ON u.id=p.created_by LEFT JOIN payroll_policy_approvals a ON a.policy_id=p.id LEFT JOIN users v ON v.id=a.approved_by`;
@Injectable()
export class PayrollPoliciesService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
  ) {}
  private async hr(client: PoolClient, token: string, csrf?: string) {
    const actor = await this.auth.authenticateWithin(client, token, csrf);
    if (!actor) throw new ApplicationError('Sign in required', 401);
    if (!actor.isHrManager) throw new ApplicationError('HR manager access required', 403);
    return actor;
  }
  private async assignees(client: PoolClient, config: PayrollPolicyConfig) {
    const ids = [
      ...new Set(
        [...config.financeApproverIds, ...config.directorApproverIds].map((id) => id.toLowerCase()),
      ),
    ].sort();
    const rows = (
      await client.query<{ id: string }>(
        `SELECT u.id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=ANY($1::uuid[]) AND u.status='ACTIVE' AND NOT u.is_system AND e.removed_at IS NULL AND (u.is_hr_manager OR u.permissions@>ARRAY['read','salary:view']) ORDER BY u.id FOR SHARE OF u,e`,
        [ids],
      )
    ).rows;
    if (rows.length !== ids.length)
      throw new ApplicationError(
        'Every assigned approver must be active, linked to a live employee and have salary read access',
        409,
      );
  }
  list(token: string, page: number) {
    return withTransaction(this.pool, async (client) => {
      await this.hr(client, token);
      return {
        items: (
          await client.query(
            `SELECT ${projection} ${joins} ORDER BY p.policy_key,p.version DESC LIMIT 25 OFFSET $1`,
            [(page - 1) * 25],
          )
        ).rows,
        total: (await client.query<{ n: number }>('SELECT count(*)::int n FROM payroll_policies'))
          .rows[0]!.n,
        page,
        pageSize: 25,
      };
    });
  }
  approvers(token: string, search: string, page: number) {
    return withTransaction(this.pool, async (client) => {
      await this.hr(client, token);
      const pattern = '%' + search.replace(/[\\%_]/g, '\\$&') + '%';
      const from = `FROM users u LEFT JOIN employees e ON e.id=u.employee_id WHERE u.status='ACTIVE' AND NOT u.is_system AND e.id IS NOT NULL AND e.removed_at IS NULL AND (u.is_hr_manager OR u.permissions@>ARRAY['read','salary:view']) AND($1='' OR u.full_name ILIKE $2 ESCAPE E'\\\\' OR u.email::text ILIKE $2 ESCAPE E'\\\\' OR e.employee_code ILIKE $2 ESCAPE E'\\\\')`;
      return {
        items: (
          await client.query(
            `SELECT u.id,u.full_name name,u.email::text email,e.employee_code "employeeCode",u.is_hr_manager hr ${from} ORDER BY u.full_name,u.id LIMIT 25 OFFSET $3`,
            [search, pattern, (page - 1) * 25],
          )
        ).rows,
        total: (
          await client.query<{ n: number }>(`SELECT count(*)::int n ${from}`, [search, pattern])
        ).rows[0]!.n,
        page,
        pageSize: 25,
      };
    });
  }
  create(token: string, csrf: string, input: z.output<typeof createPayrollPolicyInput>) {
    const q = createPayrollPolicyInput.parse(input);
    return withTransaction(this.pool, async (client) => {
      const actor = await this.hr(client, token, csrf);
      await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_payroll_policy_approval'))");
      await this.assignees(client, q.config);
      const version = (
        await client.query<{ version: number }>(
          'SELECT coalesce(max(version),0)+1 version FROM payroll_policies WHERE policy_key=$1',
          [q.policyKey],
        )
      ).rows[0]!.version;
      const id = randomUUID();
      const hash = createHash('sha256')
        .update(
          JSON.stringify({
            id,
            key: q.policyKey,
            version,
            effectiveFrom: q.effectiveFrom,
            config: q.config,
          }),
        )
        .digest('hex');
      await client.query(
        'INSERT INTO payroll_policies(id,policy_key,version,effective_from,config,policy_hash,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [id, q.policyKey, version, q.effectiveFrom, q.config, hash, q.reason, actor.id],
      );
      return (await client.query(`SELECT ${projection} ${joins} WHERE p.id=$1`, [id])).rows[0];
    });
  }
  approve(token: string, csrf: string, id: string, comment: string) {
    return withTransaction(this.pool, async (client) => {
      const actor = await this.hr(client, token, csrf);
      await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_payroll_policy_approval'))");
      const policy = (
        await client.query<{ created_by: string; config: unknown }>(
          'SELECT created_by,config FROM payroll_policies WHERE id=$1',
          [id],
        )
      ).rows[0];
      if (!policy) throw new ApplicationError('Policy unavailable', 404);
      if (policy.created_by === actor.id)
        throw new ApplicationError('A different HR manager must approve this policy', 403);
      await this.assignees(client, payrollPolicyConfig.parse(policy.config));
      if (
        !(
          await client.query(
            'SELECT e.id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=$1 AND e.removed_at IS NULL FOR SHARE OF e',
            [actor.id],
          )
        ).rowCount
      )
        throw new ApplicationError(
          'A live verified employee link is required to approve policies',
          403,
        );
      if (
        (
          await client.query('SELECT policy_id FROM payroll_policy_approvals WHERE policy_id=$1', [
            id,
          ])
        ).rowCount
      )
        throw new ApplicationError('This policy is already approved', 409);
      await client.query(
        'INSERT INTO payroll_policy_approvals(policy_id,approved_by,comment) VALUES($1,$2,$3)',
        [id, actor.id, comment],
      );
      return (await client.query(`SELECT ${projection} ${joins} WHERE p.id=$1`, [id])).rows[0];
    });
  }
  async snapshotWithin(
    client: PoolClient,
    period: string,
    policyId?: string,
  ): Promise<PayrollPolicySnapshot> {
    if (!/^(?!9999)[2-9]\d{3}-(0[1-9]|1[0-2])$/.test(period))
      throw new ApplicationError('Select a valid payroll month', 400);
    await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_payroll_policy_approval'))");
    const rows = (
      await client.query<{
        id: string;
        version: number;
        policy_hash: string;
        config: unknown;
        created_by: string;
        approved_by: string;
      }>(
        `WITH applicable AS(SELECT DISTINCT ON(p.policy_key) p.*,a.approved_by FROM payroll_policies p JOIN payroll_policy_approvals a ON a.policy_id=p.id WHERE p.effective_from<=($1||'-01')::date ORDER BY p.policy_key,p.effective_from DESC,p.version DESC) SELECT * FROM applicable WHERE ($2::uuid IS NULL OR id=$2)`,
        [period, policyId ?? null],
      )
    ).rows;
    if (rows.length !== 1)
      throw new ApplicationError(
        'Select exactly one current approved payroll policy for this month; no inactive or outdated policy can calculate pay',
        409,
      );
    const p = rows[0]!;
    const config = payrollPolicyConfig.parse(p.config);
    await this.assignees(client, config);
    return {
      policyId: p.id,
      version: p.version,
      policyHash: p.policy_hash,
      config,
      financeApproverIds: config.financeApproverIds,
      directorApproverIds: config.directorApproverIds,
      requiresDirector: config.requiresDirector,
      finalizerRole: config.finalizerRole,
      createdBy: p.created_by,
      approvedBy: p.approved_by,
    };
  }
}
