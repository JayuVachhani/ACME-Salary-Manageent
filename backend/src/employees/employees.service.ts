import { requiredRow } from '../database/query-result.js';
import type {
  EmployeeResponse,
  EmployeePageResponse,
  EmployeeFiltersResponse,
  EmployeeSalaryEntry,
  EmployeeSalaryRequest,
  EmployeeSalaryPending,
} from './dto/employees-response.dto.js';
import { withTransaction } from '../database/transaction.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { Inject, Injectable } from '@nestjs/common';
import { employeeQuery, employeeId } from './dto/employees.dto.js';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { canChangeSalary as mayChangeSalary, can } from '../common/domain/policy.js';
import { businessDate } from '../common/domain/money.js';
import { CLOCK } from '../config/config.module.js';
const projection = `e.id,e.employee_code,e.email::text,e.first_name,e.last_name,e.joining_date::text,e.version,a.country_code,c.country_name,a.department_id,d.name::text AS department,a.designation_id,g.name::text AS designation,a.employment_status`;
const joins = `FROM employees e LEFT JOIN LATERAL (SELECT country_code,department_id,designation_id,employment_status FROM employee_assignments WHERE employee_id=e.id AND effective_from<=(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date ORDER BY effective_from DESC LIMIT 1) a ON true LEFT JOIN country_rules c ON c.country_code=a.country_code LEFT JOIN departments d ON d.id=a.department_id LEFT JOIN designations g ON g.id=a.designation_id`;
@Injectable()
export class EmployeesService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(CLOCK) private readonly now: () => Date = () => new Date(),
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
  salary(token: string, id: string, page: number, requestsPage = 1) {
    employeeId.parse(id);
    id = id.toLowerCase();
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
      const linked =
        (
          await client.query<{ employee_id: string }>(
            'SELECT u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=$1 AND e.removed_at IS NULL',
            [actor.id],
          )
        ).rows[0]?.employee_id ?? null;
      const principal = {
        id: actor.id,
        employeeId: linked,
        isHrManager: actor.isHrManager,
        permissions: actor.permissions,
        active: true,
        isSystem: false,
      };
      const today = businessDate(this.now());
      const columns = `s.id,s.monthly_amount::text amount,s.currency,s.effective_from::text "effectiveFrom",s.change_reason reason,s.approval_status "approvalStatus",s.decimal_places "decimalPlaces",s.created_at "createdAt",u.full_name "createdByName",h.change_type "changeType",s.corrects_id "correctsId",EXISTS(SELECT 1 FROM salary_records replacement WHERE replacement.corrects_id=s.id) "isSuperseded",s.conversion_meta "conversionMeta",h.events`;
      // Extract NUMERIC money as text before aggregating JSON, never as JavaScript numbers.
      const eventState = (column: 'before_state' | 'after_state') =>
        `jsonb_build_object('amount',event.${column}->>'monthly_amount','currency',event.${column}->>'currency','countryCode',event.${column}->>'country_code','defaultCurrency',event.${column}->>'default_currency','decimalPlaces',(event.${column}->>'decimal_places')::int,'effectiveFrom',event.${column}->>'effective_from')`;
      const joins = `JOIN users u ON u.id=s.created_by LEFT JOIN LATERAL(
        SELECT (SELECT event.change_type FROM salary_history_events event WHERE event.salary_record_id=s.id AND event.change_type<>'CURRENCY_CHANGE' ORDER BY event.updated_at,event.id LIMIT 1) change_type,
        coalesce((SELECT jsonb_agg(jsonb_build_object('type',event.change_type,'before',CASE WHEN jsonb_typeof(event.before_state)='object' THEN ${eventState('before_state')} ELSE NULL END,'after',${eventState('after_state')}) ORDER BY event.updated_at,CASE WHEN event.change_type='CURRENCY_CHANGE' THEN 1 ELSE 0 END,event.id) FROM salary_history_events event WHERE event.salary_record_id=s.id),'[]'::jsonb) events
      ) h ON true`;
      const current =
        (
          await client.query<EmployeeSalaryEntry>(
            `SELECT ${columns} FROM salary_records s ${joins} WHERE s.employee_id=$1 AND s.effective_from<=$2 AND NOT EXISTS(SELECT 1 FROM salary_records replacement WHERE replacement.corrects_id=s.id) ORDER BY s.effective_from DESC,s.created_at DESC,s.id LIMIT 1`,
            [id, today],
          )
        ).rows[0] ?? null;
      const history = (
        await client.query<EmployeeSalaryEntry>(
          `SELECT ${columns} FROM salary_records s ${joins} WHERE s.employee_id=$1 ORDER BY s.effective_from DESC,s.created_at DESC,s.id LIMIT 25 OFFSET $2`,
          [id, (page - 1) * 25],
        )
      ).rows;
      const total = (
        await client.query<{ n: number }>(
          'SELECT count(*)::int n FROM salary_records WHERE employee_id=$1',
          [id],
        )
      ).rows[0]!.n;
      const requestColumns = `r.id,r.monthly_amount::text amount,r.currency,r.effective_from::text "effectiveFrom",r.reason,r.status,r.decision_comment "decisionComment",r.request_kind "requestKind",r.requested_by "requestedBy",u.full_name "requestedByName",r.decimal_places "decimalPlaces",r.created_at "createdAt",r.decided_at "decidedAt",r.corrects_id "correctsId",decision_actor.full_name "decidedByName"`;
      const requestWhere = `FROM salary_request_status r JOIN users u ON u.id=r.requested_by LEFT JOIN users decision_actor ON decision_actor.id=r.decided_by WHERE r.employee_id=$1 AND ($2::boolean OR r.requested_by=$3::uuid)`;
      const requestParams = [id, actor.isHrManager, actor.id];
      const requests = (
        await client.query<EmployeeSalaryRequest>(
          `SELECT ${requestColumns} ${requestWhere} ORDER BY r.created_at DESC,r.id LIMIT 25 OFFSET $4`,
          [...requestParams, (requestsPage - 1) * 25],
        )
      ).rows;
      const pending = (
        await client.query<EmployeeSalaryPending>(
          `SELECT r.id,r.monthly_amount::text amount,r.currency,r.effective_from::text "effectiveFrom",r.decimal_places "decimalPlaces" FROM salary_request_status r WHERE r.employee_id=$1 AND r.status='PENDING' ORDER BY r.created_at DESC,r.id LIMIT 25`,
          [id],
        )
      ).rows;
      const requestsTotal = (
        await client.query<{ n: number }>(`SELECT count(*)::int n ${requestWhere}`, requestParams)
      ).rows[0]!.n;
      const canResubmitInitial =
        total === 0 &&
        linked !== null &&
        linked !== id &&
        can(principal, 'read') &&
        can(principal, 'write') &&
        can(principal, 'salary:view') &&
        !(
          await client.query(
            `SELECT id FROM salary_request_status WHERE employee_id=$1 AND status<>'REJECTED' LIMIT 1`,
            [id],
          )
        ).rowCount;
      const canChangeSalary = total > 0 && mayChangeSalary(principal, id);
      const salaryChangeUnavailableReason = canChangeSalary
        ? null
        : !can(principal, 'edit')
          ? 'Your account can view salaries but cannot change them. Ask an HR manager for edit access.'
          : linked === null
            ? 'Ask another HR manager to link your account to your employee record before changing salaries.'
            : linked === id
              ? 'You cannot change your own salary. Ask another authorized colleague to make this change.'
              : 'The initial salary must be approved by an independent HR manager before revisions can be added.';
      const currencies = (
        await client.query<{ code: string }>(
          'SELECT code FROM currencies WHERE is_active AND minor_units IS NOT NULL ORDER BY code',
        )
      ).rows;
      return {
        current,
        history,
        pending,
        total,
        page,
        canResubmitInitial,
        canChangeSalary,
        canSubmitBackdated: canChangeSalary && actor.isHrManager,
        salaryChangeUnavailableReason,
        businessDate: today,
        requests,
        requestsTotal,
        requestsPage,
        currencies,
      };
    });
  }
}
