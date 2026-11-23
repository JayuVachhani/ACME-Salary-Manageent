import { Inject, Injectable } from '@nestjs/common';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { businessDate } from '../common/domain/money.js';
import { CLOCK } from '../config/config.module.js';
import { withTransaction } from '../database/transaction.js';
import { employeeQuery } from '../employees/dto/employees.dto.js';
import {
  salaryWorkspaceItemResponse,
  salaryBulkResolveInput,
  salaryBulkResolvedResponse,
} from './dto/salary-workspace.dto.js';

@Injectable()
export class SalaryWorkspaceService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(CLOCK) private readonly now: () => Date,
  ) {}
  private async authorize(client: PoolClient, token: string, csrf?: string, edit = false) {
    const actor = await this.auth.authenticateWithin(client, token, csrf);
    if (!actor)
      throw new ApplicationError(
        csrf === undefined ? 'Sign in required' : 'Request rejected',
        csrf === undefined ? 401 : 403,
      );
    const permissions = edit ? ['read', 'edit', 'salary:view'] : ['read', 'salary:view'];
    if (
      !actor.isHrManager &&
      !permissions.every((permission) => actor.permissions.some((value) => value === permission))
    )
      throw new ApplicationError(
        edit
          ? 'Salary edit access is required to prepare bulk changes'
          : 'Salary view access is required',
        403,
      );
    if (
      edit &&
      !(
        await client.query(
          'SELECT e.id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=$1 AND e.removed_at IS NULL FOR SHARE OF e',
          [actor.id],
        )
      ).rowCount
    )
      throw new ApplicationError(
        'Ask another HR manager to link your account to your employee record before preparing salary changes',
        403,
      );
    return actor;
  }
  list(token: string, input: z.output<typeof employeeQuery>) {
    const q = employeeQuery.parse(input);
    return withTransaction(this.pool, async (client) => {
      await this.authorize(client, token);
      const today = businessDate(this.now());
      const sort = {
        code: '"employeeCode"',
        name: '"firstName"',
        joiningDate: '"joiningDate"',
        department: '"department"',
        country: '"countryName"',
      }[q.sort];
      const direction = q.direction === 'asc' ? 'ASC' : 'DESC';
      const order = `${sort} ${direction} NULLS LAST,${q.sort === 'name' ? `"lastName" ${direction},` : ''}"employeeId"`;
      const pattern = '%' + q.search.replace(/[\\%_]/g, '\\$&') + '%';
      const snapshot = (alias: 'current_row' | 'next_row') =>
        `CASE WHEN ${alias}.id IS NULL THEN NULL ELSE jsonb_build_object('id',${alias}.id,'amount',${alias}.monthly_amount::text,'currency',${alias}.currency,'effectiveFrom',${alias}.effective_from::text,'decimalPlaces',${alias}.decimal_places,'approvalStatus',${alias}.approval_status) END`;
      const result = (
        await client.query<{
          items: z.output<typeof salaryWorkspaceItemResponse>[];
          total: number;
        }>(
          `
        WITH current_assignments AS MATERIALIZED(
          SELECT DISTINCT ON(employee_id) employee_id,country_code,department_id,designation_id,employment_status FROM employee_assignments
          WHERE effective_from<=$8::date ORDER BY employee_id,effective_from DESC
        ), eligible AS MATERIALIZED(
          SELECT e.id "employeeId",e.employee_code "employeeCode",e.first_name "firstName",e.last_name "lastName",e.email::text email,e.joining_date::text "joiningDate",e.version,
            a.country_code "countryCode",c.country_name "countryName",a.department_id "departmentId",d.name::text department,g.name::text designation,a.employment_status "employmentStatus"
          FROM employees e LEFT JOIN current_assignments a ON a.employee_id=e.id LEFT JOIN country_rules c ON c.country_code=a.country_code LEFT JOIN departments d ON d.id=a.department_id LEFT JOIN designations g ON g.id=a.designation_id
          WHERE e.removed_at IS NULL AND($1='' OR e.employee_code ILIKE $2 ESCAPE E'\\\\' OR(e.first_name||' '||e.last_name) ILIKE $2 ESCAPE E'\\\\' OR e.email::text ILIKE $2 ESCAPE E'\\\\')
            AND($3::text IS NULL OR a.country_code=$3) AND($4::uuid IS NULL OR a.department_id=$4) AND($5::text IS NULL OR a.employment_status=$5)
        ), page_rows AS MATERIALIZED(SELECT * FROM eligible ORDER BY ${order} LIMIT $6 OFFSET $7),
        salary_tips AS MATERIALIZED(
          SELECT s.* FROM salary_records s JOIN page_rows p ON p."employeeId"=s.employee_id
          WHERE NOT EXISTS(SELECT 1 FROM salary_records replacement WHERE replacement.corrects_id=s.id)
        ), current_salary AS(
          SELECT DISTINCT ON(employee_id) * FROM salary_tips WHERE effective_from<=$8::date ORDER BY employee_id,effective_from DESC,created_at DESC,id
        ), next_salary AS(
          SELECT DISTINCT ON(employee_id) * FROM salary_tips WHERE effective_from>$8::date ORDER BY employee_id,effective_from,created_at DESC,id
        ), pending_counts AS(
          SELECT r.employee_id,count(*)::int n FROM salary_change_requests r JOIN page_rows p ON p."employeeId"=r.employee_id LEFT JOIN salary_approval_decisions decision ON decision.request_id=r.id WHERE decision.request_id IS NULL GROUP BY r.employee_id
        ), enriched AS(
          SELECT p.*,${snapshot('current_row')} "current",${snapshot('next_row')} "nextScheduled",coalesce(pending.n,0) "pendingCount"
          FROM page_rows p LEFT JOIN current_salary current_row ON current_row.employee_id=p."employeeId" LEFT JOIN next_salary next_row ON next_row.employee_id=p."employeeId" LEFT JOIN pending_counts pending ON pending.employee_id=p."employeeId"
        )
        SELECT coalesce((SELECT jsonb_agg(to_jsonb(item) ORDER BY ${order}) FROM enriched item),'[]'::jsonb) items,(SELECT count(*)::int FROM eligible) total`,
          [
            q.search,
            pattern,
            q.country ?? null,
            q.department ?? null,
            q.status ?? null,
            q.pageSize,
            (q.page - 1) * q.pageSize,
            today,
          ],
        )
      ).rows[0]!;
      return { ...result, page: q.page, pageSize: q.pageSize, businessDate: today };
    });
  }
  resolve(token: string, csrf: string, input: z.output<typeof salaryBulkResolveInput>) {
    const q = salaryBulkResolveInput.parse(input);
    return withTransaction(this.pool, async (client) => {
      await this.authorize(client, token, csrf, true);
      return (
        await client.query<z.output<typeof salaryBulkResolvedResponse>[number]>(
          `SELECT employee_code "employeeCode",id,version,first_name "firstName",last_name "lastName" FROM employees WHERE employee_code=ANY($1::text[]) AND removed_at IS NULL ORDER BY array_position($1::text[],employee_code),id`,
          [q.employeeCodes],
        )
      ).rows;
    });
  }
}
