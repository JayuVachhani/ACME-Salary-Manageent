import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { withTransaction } from '../database/transaction.js';
import { sqlState } from '../database/database-errors.js';
import { SalaryApprovalService, SalaryApprovalError } from './salary-approval.service.js';
import { salaryRequestResponse } from './dto/salary-workflow.dto.js';
@Injectable()
export class SalaryWorkflowService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(SalaryApprovalService) private readonly approvals: SalaryApprovalService,
  ) {}
  list(token: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', page: number) {
    return withTransaction(this.pool, async (client) => {
      const actor = await this.auth.authenticateWithin(client, token);
      if (!actor) throw new ApplicationError('Sign in required', 401);
      if (!actor.isHrManager) throw new ApplicationError('HR Manager access required', 403);
      const linked = (
        await client.query<{ employee_id: string }>(
          'SELECT u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=$1 AND e.removed_at IS NULL',
          [actor.id],
        )
      ).rows[0]?.employee_id;
      const from = `FROM salary_request_status r JOIN employees e ON e.id=r.employee_id JOIN users u ON u.id=r.requested_by
        LEFT JOIN country_rules country ON country.country_code=r.country_code
        LEFT JOIN currencies request_currency ON request_currency.code=r.currency
        LEFT JOIN currencies default_currency ON default_currency.code=r.default_currency
        LEFT JOIN users decision_actor ON decision_actor.id=r.decided_by
        `;
      const where = `${from} WHERE r.status=$1`;
      const before = `CASE WHEN previous_salary.id IS NOT NULL THEN jsonb_build_object('id',previous_salary.id,'amount',previous_salary.monthly_amount::text,'currency',previous_salary.currency,'countryCode',previous_salary.country_code,'defaultCurrency',previous_salary.default_currency,'effectiveFrom',previous_salary.effective_from::text,'decimalPlaces',previous_salary.decimal_places) ELSE NULL END`;
      const beforeJoin = `LEFT JOIN LATERAL(SELECT s.* FROM salary_records s WHERE s.employee_id=r.employee_id AND s.approval_request_id IS DISTINCT FROM r.id AND
        ((r.corrects_id IS NOT NULL AND s.id=r.corrects_id) OR (r.corrects_id IS NULL AND s.effective_from<=r.effective_from AND NOT EXISTS(SELECT 1 FROM salary_records replacement WHERE replacement.corrects_id=s.id)))
        ORDER BY s.effective_from DESC,s.created_at DESC,s.id LIMIT 1) previous_salary ON r.status='PENDING' AND r.request_kind='BACKDATED'`;
      const stale = `(r.status='PENDING' AND (e.removed_at IS NOT NULL OR e.version<>r.expected_employee_version OR country.version IS DISTINCT FROM r.country_rule_version OR country.is_active IS NOT TRUE OR request_currency.is_active IS NOT TRUE OR default_currency.is_active IS NOT TRUE))`;
      const items = (
        await client.query<z.output<typeof salaryRequestResponse>>(
          `SELECT r.id,r.employee_id,e.employee_code,e.first_name||' '||e.last_name employee_name,r.requested_by,u.full_name requested_by_name,r.request_kind,r.monthly_amount::text,r.currency,r.effective_from::text,r.reason,r.status,r.decision_comment,
        ($2::uuid IS NOT NULL AND r.requested_by<>$3 AND r.employee_id<>$2 AND r.status='PENDING') can_decide,
        r.corrects_id "correctsId",r.decimal_places "decimalPlaces",r.country_code "countryCode",r.default_currency "defaultCurrency",${before} "before",${stale} "isStale",decision_actor.full_name "decidedByName",r.decided_at "decidedAt"
        ${from} ${beforeJoin} WHERE r.status=$1 ORDER BY r.created_at,r.id LIMIT 25 OFFSET $4`,
          [status, linked ?? null, actor.id, (page - 1) * 25],
        )
      ).rows;
      const total = (await client.query<{ n: number }>(`SELECT count(*)::int n ${where}`, [status]))
        .rows[0]!.n;
      return { items, total, page, pageSize: 25 };
    });
  }
  async decide(
    token: string,
    csrf: string,
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    comment: string,
  ) {
    try {
      return await withTransaction(this.pool, async (client) => {
        const actor = await this.auth.authenticateWithin(client, token, csrf);
        if (!actor) throw new ApplicationError('Sign in required', 401);
        if (!actor.isHrManager) throw new ApplicationError('HR Manager access required', 403);
        // Use the authenticated transaction: permission revocation cannot race a separate commit.
        const salaryId = await this.approvals.decideWithin(client, actor.id, id, decision, comment);
        return { salaryId };
      });
    } catch (error) {
      const state = sqlState(error);
      if (state === '42501')
        throw new ApplicationError(
          'A different HR manager with verified employee linkage must decide this request',
          403,
        );
      if (['23505', '23514', '40001', '40P01'].includes(state ?? ''))
        throw new ApplicationError(
          'This request was already decided or its employee/policy changed. Refresh the list.',
          409,
        );
      if (error instanceof SalaryApprovalError)
        throw new ApplicationError(error.message.replaceAll('_', ' ').toLowerCase(), 409);
      throw error;
    }
  }
}
