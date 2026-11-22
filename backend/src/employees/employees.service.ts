import { requiredRow } from '../database/query-result.js';
import type {
  EmployeeResponse,
  EmployeePageResponse,
  EmployeeFiltersResponse,
} from './dto/employees-response.dto.js';
import { withTransaction } from '../database/transaction.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { Inject, Injectable } from '@nestjs/common';
import { employeeQuery, employeeId } from './dto/employees.dto.js';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
const projection = `e.id,e.employee_code,e.email::text,e.first_name,e.last_name,e.joining_date::text,e.version,a.country_code,c.country_name,a.department_id,d.name::text AS department,a.designation_id,g.name::text AS designation,a.employment_status`;
const joins = `FROM employees e LEFT JOIN LATERAL (SELECT country_code,department_id,designation_id,employment_status FROM employee_assignments WHERE employee_id=e.id AND effective_from<=(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date ORDER BY effective_from DESC LIMIT 1) a ON true LEFT JOIN country_rules c ON c.country_code=a.country_code LEFT JOIN departments d ON d.id=a.department_id LEFT JOIN designations g ON g.id=a.designation_id`;
@Injectable()
export class EmployeesService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
  ) {}
  private read<T>(token: string, work: (client: PoolClient) => Promise<T>): Promise<T> {
    return withTransaction(this.pool, async (client) => {
      const actor = await this.auth.authenticateWithin(client, token);
      if (!actor) throw new ApplicationError('Sign in required', 401);
      if (!actor.isHrManager && !actor.permissions.includes('read'))
        throw new ApplicationError('Employee read permission required', 403);
      return work(client);
    });
  }

  list(token: string, input: z.infer<typeof employeeQuery>) {
    const q = employeeQuery.parse(input);
    return this.read(token, async (client) => {
      const sort = {
        code: 'employee_code',
        name: 'first_name',
        joiningDate: 'joining_date',
        department: 'department',
        country: 'country_name',
      }[q.sort];
      const direction = q.direction === 'asc' ? 'ASC' : 'DESC';
      const pattern = '%' + q.search.replace(/[\\%_]/g, '\\$&') + '%';
      const result = await client.query<Pick<EmployeePageResponse, 'items' | 'total'>>(
        `WITH eligible AS MATERIALIZED(SELECT ${projection} ${joins} WHERE e.removed_at IS NULL AND ($1='' OR e.employee_code ILIKE $2 ESCAPE E'\\\\' OR (e.first_name||' '||e.last_name) ILIKE $2 ESCAPE E'\\\\' OR e.email::text ILIKE $2 ESCAPE E'\\\\') AND ($3::text IS NULL OR a.country_code=$3) AND ($4::uuid IS NULL OR a.department_id=$4) AND ($5::text IS NULL OR a.employment_status=$5)),page_rows AS(SELECT * FROM eligible ORDER BY ${sort} ${direction} NULLS LAST,${q.sort === 'name' ? `last_name ${direction},` : ''}id LIMIT $6 OFFSET $7) SELECT (SELECT count(*)::int FROM eligible) AS total,coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY ${sort} ${direction} NULLS LAST,${q.sort === 'name' ? `last_name ${direction},` : ''}id) FROM page_rows p),'[]'::jsonb) AS items`,
        [
          q.search,
          pattern,
          q.country ?? null,
          q.department ?? null,
          q.status ?? null,
          q.pageSize,
          (q.page - 1) * q.pageSize,
        ],
      );
      return { ...requiredRow(result), page: q.page, pageSize: q.pageSize };
    });
  }
  detail(token: string, id: string) {
    employeeId.parse(id);
    return this.read(token, async (client) => {
      const result = await client.query<EmployeeResponse>(
        `SELECT ${projection} ${joins} WHERE e.id=$1 AND e.removed_at IS NULL`,
        [id],
      );
      if (!result.rowCount) throw new ApplicationError('Employee unavailable', 404);
      return requiredRow(result);
    });
  }
  filters(token: string) {
    return this.read(token, async (client) => ({
      countries: (
        await client.query<EmployeeFiltersResponse['countries'][number]>(
          'SELECT country_code AS code,country_name AS name,is_active FROM country_rules ORDER BY country_name,country_code',
        )
      ).rows,
      departments: (
        await client.query<EmployeeFiltersResponse['departments'][number]>(
          'SELECT id,name::text,is_active FROM departments ORDER BY name,id',
        )
      ).rows,
    }));
  }
  salary(token: string, id: string, page: number) {
    employeeId.parse(id);
    return withTransaction(this.pool, async (client) => {
      const actor = await this.auth.authenticateWithin(client, token);
      if (!actor) throw new ApplicationError('Sign in required', 401);
      if (
        !actor.isHrManager &&
        !(actor.permissions.includes('read') && actor.permissions.includes('salary:view'))
      )
        throw new ApplicationError('Salary view permission required', 403);
      if (
        !(await client.query('SELECT id FROM employees WHERE id=$1 AND removed_at IS NULL', [id]))
          .rowCount
      )
        throw new ApplicationError('Employee unavailable', 404);
      type Entry = {
        id: string;
        amount: string;
        currency: string;
        effectiveFrom: string;
        reason: string;
      };
      const current =
        (
          await client.query<Entry>(
            `SELECT id,monthly_amount::text amount,currency,effective_from::text "effectiveFrom" FROM salary_in_force((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date) WHERE employee_id=$1`,
            [id],
          )
        ).rows[0] ?? null;
      const history = (
        await client.query<Entry>(
          `SELECT id,monthly_amount::text amount,currency,effective_from::text "effectiveFrom",change_reason reason FROM salary_records WHERE employee_id=$1 ORDER BY effective_from DESC,created_at DESC,id LIMIT 25 OFFSET $2`,
          [id, (page - 1) * 25],
        )
      ).rows;
      const pending = (
        await client.query<Entry>(
          `SELECT id,monthly_amount::text amount,currency,effective_from::text "effectiveFrom" FROM salary_request_status WHERE employee_id=$1 AND status='PENDING' ORDER BY created_at DESC LIMIT 25`,
          [id],
        )
      ).rows;
      const total = (
        await client.query<{ n: number }>(
          'SELECT count(*)::int n FROM salary_records WHERE employee_id=$1',
          [id],
        )
      ).rows[0]!.n;
      const canResubmitInitial =
        total === 0 &&
        Boolean(
          (
            await client.query(
              'SELECT u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=$1 AND e.removed_at IS NULL AND e.id<>$2',
              [actor.id, id],
            )
          ).rowCount,
        ) &&
        !(
          await client.query(
            `SELECT id FROM salary_request_status WHERE employee_id=$1 AND status<>'REJECTED' LIMIT 1`,
            [id],
          )
        ).rowCount;
      return { current, history, pending, total, page, canResubmitInitial };
    });
  }
}
