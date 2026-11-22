import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import {
  businessDate,
  validateSalary,
  resolveFx,
  type FxRate,
  type RoundingMode,
} from '../common/domain/money.js';
import { CLOCK, FX_STALE_DAYS } from '../config/config.module.js';
import { withTransaction } from '../database/transaction.js';
import { sqlState } from '../database/database-errors.js';
import { employeeCreateInput, initialSalaryInput } from './dto/employee-create.dto.js';

@Injectable()
export class EmployeeCreationService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(CLOCK) private readonly now: () => Date,
    @Inject(FX_STALE_DAYS) private readonly staleDays: number,
  ) {}

  private async authorize(client: import('pg').PoolClient, token: string, csrf?: string) {
    const actor = await this.auth.authenticateWithin(client, token, csrf);
    if (!actor) throw new ApplicationError('Sign in required', 401);
    if (
      !actor.isHrManager &&
      !['read', 'write', 'salary:view'].every((p) => actor.permissions.some((value) => value === p))
    )
      throw new ApplicationError('Employee creation and salary access are required', 403);
    return actor;
  }

  options(token: string) {
    return withTransaction(this.pool, async (client) => {
      await this.authorize(client, token);
      return {
        countries: (
          await client.query<{
            code: string;
            name: string;
            currency: string;
            decimalPlaces: number;
          }>(
            `SELECT c.country_code code,c.country_name name,c.default_currency currency,c.decimal_places "decimalPlaces" FROM country_rules c JOIN currencies x ON x.code=c.default_currency WHERE c.is_active AND x.is_active ORDER BY c.country_name`,
          )
        ).rows,
        departments: (
          await client.query<{ id: string; name: string }>(
            'SELECT id,name::text FROM departments WHERE is_active ORDER BY name',
          )
        ).rows,
        designations: (
          await client.query<{ id: string; name: string }>(
            'SELECT id,name::text FROM designations WHERE is_active ORDER BY name',
          )
        ).rows,
        currencies: (
          await client.query<{ code: string }>(
            'SELECT code FROM currencies WHERE is_active ORDER BY code',
          )
        ).rows,
      };
    });
  }

  async create(token: string, csrf: string, input: z.output<typeof employeeCreateInput>) {
    const q = employeeCreateInput.parse(input);
    if (q.effectiveFrom < q.joiningDate)
      throw new ApplicationError('Salary cannot start before the joining date', 400);
    const hash = createHash('sha256').update(JSON.stringify(q)).digest('hex');
    try {
      return await withTransaction(this.pool, async (client) => {
        const actor = await this.authorize(client, token, csrf);
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
          actor.id + q.commandId,
        ]);
        const prior = (
          await client.query<{ input_hash: string; employee_id: string; request_id: string }>(
            'SELECT * FROM employee_creation_commands WHERE actor_id=$1 AND command_id=$2',
            [actor.id, q.commandId],
          )
        ).rows[0];
        if (prior) {
          if (prior.input_hash !== hash)
            throw new ApplicationError(
              'This submission was already used for different details. Start a new form.',
              409,
            );
          return {
            employeeId: prior.employee_id,
            requestId: prior.request_id,
            status: 'PENDING' as const,
          };
        }
        const policy = (
          await client.query<{
            country_code: string;
            default_currency: string;
            version: number;
            decimal_places: number;
            rounding_mode: RoundingMode;
          }>('SELECT * FROM country_rules WHERE country_code=$1 AND is_active FOR SHARE', [
            q.countryCode,
          ])
        ).rows[0];
        if (!policy) throw new ApplicationError('Select an active country', 409);
        for (const [table, id] of [
          ['departments', q.departmentId],
          ['designations', q.designationId],
        ] as const) {
          if (
            !(
              await client.query(`SELECT id FROM ${table} WHERE id=$1 AND is_active FOR SHARE`, [
                id,
              ])
            ).rowCount
          )
            throw new ApplicationError('Department or job title is no longer active', 409);
        }
        for (const currency of [...new Set([q.currency, policy.default_currency])].sort()) {
          if (
            !(
              await client.query(
                'SELECT code FROM currencies WHERE code=$1 AND is_active FOR SHARE',
                [currency],
              )
            ).rowCount
          )
            throw new ApplicationError('Select an active salary currency', 409);
        }
        let amount: string;
        try {
          amount = validateSalary(q.amount, policy.decimal_places);
        } catch {
          throw new ApplicationError(
            `Enter a positive salary with at most ${policy.decimal_places} decimal places`,
            400,
          );
        }
        const rates = (
          await client.query<FxRate>(
            `SELECT id,base_currency base,quote_currency quote,effective_date::text "effectiveDate",revision,rate::text,source FROM fx_rate_revisions WHERE effective_date<=$1 AND effective_date>=$1::date-$2::int`,
            [q.effectiveFrom, this.staleDays],
          )
        ).rows;
        let conversion: object;
        try {
          const path = resolveFx(
            rates,
            q.currency,
            policy.default_currency,
            q.effectiveFrom,
            this.staleDays,
          );
          conversion = path.length ? { rateDate: q.effectiveFrom, path } : {};
        } catch {
          throw new ApplicationError(
            'Add an applicable exchange rate before saving this salary',
            422,
          );
        }
        const employeeId = randomUUID();
        const requestId = randomUUID();
        await client.query(
          'INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',
          [employeeId, q.employeeCode, q.email, q.firstName, q.lastName, q.joiningDate, actor.id],
        );
        await client.query(
          'INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [
            employeeId,
            q.countryCode,
            q.departmentId,
            q.designationId,
            q.employmentStatus,
            q.joiningDate,
            q.reason,
            actor.id,
          ],
        );
        await client.query(
          `INSERT INTO salary_change_requests(id,employee_id,requested_by,submitted_business_date,effective_from,expected_employee_version,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,reason,conversion_meta,request_kind) SELECT $1,e.id,$3,$4,$5,e.version,$6,$7,$8,$9,$10,$11,$12,$13,$14,'INITIAL' FROM employees e WHERE e.id=$2`,
          [
            requestId,
            employeeId,
            actor.id,
            businessDate(this.now()),
            q.effectiveFrom,
            amount,
            q.currency,
            q.countryCode,
            policy.default_currency,
            policy.version,
            policy.decimal_places,
            policy.rounding_mode,
            q.reason,
            conversion,
          ],
        );
        await client.query(
          `INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload) VALUES($1,'EMPLOYEE',$2,'CREATED',$3,$4)`,
          [
            actor.id,
            employeeId,
            q.reason,
            JSON.stringify({ employeeCode: q.employeeCode, initialRequestId: requestId }),
          ],
        );
        await client.query(
          'INSERT INTO employee_creation_commands(actor_id,command_id,input_hash,employee_id,request_id) VALUES($1,$2,$3,$4,$5)',
          [actor.id, q.commandId, hash, employeeId, requestId],
        );
        return { employeeId, requestId, status: 'PENDING' as const };
      });
    } catch (error) {
      const state = sqlState(error);
      if (state === '23505')
        throw new ApplicationError(
          'Employee code, email or initial salary already exists. Refresh before retrying.',
          409,
        );
      if (['23503', '23514', '40001', '40P01'].includes(state ?? ''))
        throw new ApplicationError(
          'Employee details or reference data changed. Review and try again.',
          409,
        );
      if (state === '42501')
        throw new ApplicationError('This employee or salary action is not permitted', 403);
      throw error;
    }
  }
  async resubmit(
    token: string,
    csrf: string,
    employeeId: string,
    input: z.output<typeof initialSalaryInput>,
  ) {
    const q = initialSalaryInput.parse(input);
    const hash = createHash('sha256')
      .update(JSON.stringify({ employeeId, ...q }))
      .digest('hex');
    try {
      return await withTransaction(this.pool, async (client) => {
        const actor = await this.authorize(client, token, csrf);
        if (
          !(
            await client.query(
              'SELECT u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=$1 AND e.removed_at IS NULL AND e.id<>$2',
              [actor.id, employeeId],
            )
          ).rowCount
        )
          throw new ApplicationError(
            'Ask another HR manager to link your account to your employee record before changing salary requests',
            403,
          );
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
          actor.id + q.commandId,
        ]);
        const prior = (
          await client.query<{ input_hash: string; employee_id: string; request_id: string }>(
            'SELECT * FROM employee_creation_commands WHERE actor_id=$1 AND command_id=$2',
            [actor.id, q.commandId],
          )
        ).rows[0];
        if (prior) {
          if (prior.input_hash !== hash)
            throw new ApplicationError('Submission key already used for different details', 409);
          return {
            employeeId: prior.employee_id,
            requestId: prior.request_id,
            status: 'PENDING' as const,
          };
        }
        const employee = (
          await client.query<{ version: number; joining_date: string }>(
            'SELECT version,joining_date::text FROM employees WHERE id=$1 AND removed_at IS NULL FOR UPDATE',
            [employeeId],
          )
        ).rows[0];
        if (!employee || employee.version !== q.expectedVersion)
          throw new ApplicationError(
            'Employee changed or is unavailable. Refresh the profile.',
            409,
          );
        if (q.effectiveFrom < employee.joining_date)
          throw new ApplicationError('Salary cannot start before joining', 400);
        const policy = (
          await client.query<{
            country_code: string;
            default_currency: string;
            version: number;
            decimal_places: number;
            rounding_mode: RoundingMode;
          }>(
            `SELECT c.* FROM country_rules c WHERE c.country_code=(SELECT country_code FROM employee_assignments WHERE employee_id=$1 AND effective_from<=$2 ORDER BY effective_from DESC LIMIT 1) AND c.is_active FOR SHARE`,
            [employeeId, q.effectiveFrom],
          )
        ).rows[0];
        if (!policy)
          throw new ApplicationError('No active country assignment applies on that date', 409);
        for (const currency of [...new Set([q.currency, policy.default_currency])].sort()) {
          if (
            !(
              await client.query(
                'SELECT code FROM currencies WHERE code=$1 AND is_active FOR SHARE',
                [currency],
              )
            ).rowCount
          )
            throw new ApplicationError('Salary currency is unavailable', 409);
        }
        let amount: string;
        try {
          amount = validateSalary(q.amount, policy.decimal_places);
        } catch {
          throw new ApplicationError(
            `Use a positive amount with at most ${policy.decimal_places} decimal places`,
            400,
          );
        }
        const rates = (
          await client.query<FxRate>(
            `SELECT id,base_currency base,quote_currency quote,effective_date::text "effectiveDate",revision,rate::text,source FROM fx_rate_revisions WHERE effective_date<=$1 AND effective_date>=$1::date-$2::int`,
            [q.effectiveFrom, this.staleDays],
          )
        ).rows;
        let conversion: object;
        try {
          const path = resolveFx(
            rates,
            q.currency,
            policy.default_currency,
            q.effectiveFrom,
            this.staleDays,
          );
          conversion = path.length ? { rateDate: q.effectiveFrom, path } : {};
        } catch {
          throw new ApplicationError('Add an applicable exchange rate first', 422);
        }
        const requestId = randomUUID();
        await client.query(
          `INSERT INTO salary_change_requests(id,employee_id,requested_by,submitted_business_date,effective_from,expected_employee_version,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,reason,conversion_meta,request_kind) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'INITIAL')`,
          [
            requestId,
            employeeId,
            actor.id,
            businessDate(this.now()),
            q.effectiveFrom,
            employee.version,
            amount,
            q.currency,
            policy.country_code,
            policy.default_currency,
            policy.version,
            policy.decimal_places,
            policy.rounding_mode,
            q.reason,
            conversion,
          ],
        );
        await client.query(
          'INSERT INTO employee_creation_commands(actor_id,command_id,input_hash,employee_id,request_id) VALUES($1,$2,$3,$4,$5)',
          [actor.id, q.commandId, hash, employeeId, requestId],
        );
        return { employeeId, requestId, status: 'PENDING' as const };
      });
    } catch (error) {
      const state = sqlState(error);
      if (state === '42501')
        throw new ApplicationError(
          'Initial salary submission is not permitted for this account or employee',
          403,
        );
      if (['23505', '23514', '23503', '40001', '40P01'].includes(state ?? ''))
        throw new ApplicationError(
          'Initial salary already exists or the employee changed. Refresh before retrying.',
          409,
        );
      throw error;
    }
  }
}
