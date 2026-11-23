import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import type { SessionIdentity } from '../auth/auth.types.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { withTransaction } from '../database/transaction.js';
import { sqlState } from '../database/database-errors.js';
import { PayrollPoliciesService } from '../payroll-policies/payroll-policies.service.js';
import { PayrollCalculationsService } from '../payroll-calculations/payroll-calculations.service.js';
import {
  createRunInput,
  refreshRunInput,
  runActionInput,
  type RunAction,
} from './dto/payroll-runs.dto.js';

type Status = 'DRAFT' | 'HR_REVIEWED' | 'FINANCE_APPROVED' | 'DIRECTOR_APPROVED' | 'FINALIZED';
type Policy = Awaited<ReturnType<PayrollPoliciesService['snapshotWithin']>>;
type Calculation = Awaited<ReturnType<PayrollCalculationsService['calculateWithin']>>;
type Input = z.output<typeof createRunInput>;
type Line = { id: string; employeeId: string; snapshot: Record<string, unknown> };
type Header = {
  id: string;
  period: string;
  status: Status;
  version: number;
  generation: number;
  employeeCount: number;
  hrReviewerId: string;
  financeApproverId: string;
  directorApproverId: string | null;
  requiresDirector: boolean;
  createdBy: string;
  createdAt: Date;
  finalizedAt: Date | null;
  policy: Policy;
  sourceHash: string;
};
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const columns = `id,to_char(period_month,'YYYY-MM') period,status,version,generation,employee_count "employeeCount",hr_reviewer_id "hrReviewerId",finance_approver_id "financeApproverId",director_approver_id "directorApproverId",requires_director "requiresDirector",created_by "createdBy",created_at "createdAt",finalized_at "finalizedAt",policy_snapshot policy,source_hash "sourceHash"`;
@Injectable()
export class PayrollRunsService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
    @Inject(PayrollPoliciesService) private readonly policies: PayrollPoliciesService,
    @Inject(PayrollCalculationsService) private readonly calculations: PayrollCalculationsService,
  ) {}
  private async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    try {
      return await withTransaction(this.pool, work);
    } catch (error) {
      if (sqlState(error) === '42501')
        throw new ApplicationError(
          'Independent linked payroll access is required for this action.',
          403,
        );
      if (['23505', '23514', '40001', '40P01'].includes(sqlState(error) ?? ''))
        throw new ApplicationError(
          'Payroll changed. Refresh and review the latest run before trying again.',
          409,
        );
      throw error;
    }
  }
  private async actor(client: PoolClient, token: string, csrf?: string) {
    const actor = await this.auth.authenticateWithin(client, token, csrf);
    if (!actor) throw new ApplicationError('Sign in required', 401);
    if (
      !actor.isHrManager &&
      !['read', 'salary:view'].every((p) =>
        actor.permissions.some((permission) => permission === p),
      )
    )
      throw new ApplicationError('Payroll requires employee and salary read access', 403);
    return actor;
  }
  private async linked(client: PoolClient, id: string) {
    const user = (
      await client.query<{ employeeId: string }>(
        `SELECT u.employee_id "employeeId" FROM users u JOIN employees e ON e.id=u.employee_id AND e.removed_at IS NULL WHERE u.id=$1 AND u.status='ACTIVE' AND NOT u.is_system FOR SHARE OF u,e`,
        [id],
      )
    ).rows[0];
    if (!user)
      throw new ApplicationError(
        'A live employee-linked account is required. Ask another HR manager to update account linkage.',
        403,
      );
    return user.employeeId;
  }
  private async header(client: PoolClient, id: string, actor: SessionIdentity, lock = false) {
    const row = (
      await client.query<Header>(
        `SELECT ${columns} FROM payroll_runs WHERE id=$1 ${lock ? 'FOR UPDATE' : ''}`,
        [id],
      )
    ).rows[0];
    if (!row) throw new ApplicationError('Payroll run unavailable', 404);
    if (
      !actor.isHrManager &&
      actor.id !== row.financeApproverId &&
      actor.id !== row.directorApproverId
    )
      throw new ApplicationError('This payroll run is assigned to other reviewers', 403);
    return row;
  }
  private async lines(client: PoolClient, run: Header, page?: number) {
    return (
      await client.query<Line>(
        `SELECT id,employee_id "employeeId",snapshot FROM payroll_run_lines WHERE run_id=$1 AND generation=$2 ORDER BY employee_id ${page ? 'LIMIT 25 OFFSET $3' : ''}`,
        page ? [run.id, run.generation, (page - 1) * 25] : [run.id, run.generation],
      )
    ).rows;
  }
  private async eligibleReviewer(client: PoolClient, id: string, hr: boolean) {
    await this.linked(client, id);
    const user = (
      await client.query<{ isHr: boolean; permissions: string[] }>(
        `SELECT is_hr_manager "isHr",permissions FROM users WHERE id=$1 FOR SHARE`,
        [id],
      )
    ).rows[0]!;
    if (
      hr
        ? !user.isHr
        : !user.isHr && !['read', 'salary:view'].every((p) => user.permissions.includes(p))
    )
      throw new ApplicationError(
        hr
          ? 'Choose a current linked HR manager'
          : 'Choose a current approver with salary read access',
        403,
      );
  }
  private async assignments(
    client: PoolClient,
    policy: Policy,
    input: Pick<Input, 'hrReviewerId' | 'financeApproverId' | 'directorApproverId'>,
    employeeIds: string[],
  ) {
    if (
      !policy.financeApproverIds.includes(input.financeApproverId) ||
      (policy.requiresDirector &&
        (!input.directorApproverId ||
          !policy.directorApproverIds.includes(input.directorApproverId)))
    )
      throw new ApplicationError('Choose approvers assigned by the approved payroll policy', 409);
    if (input.directorApproverId && !policy.directorApproverIds.includes(input.directorApproverId))
      throw new ApplicationError('Director is not assigned by the approved policy', 409);
    const ids = [
      input.hrReviewerId,
      input.financeApproverId,
      ...(policy.requiresDirector ? [input.directorApproverId!] : []),
    ];
    if (new Set(ids).size !== ids.length)
      throw new ApplicationError('Assign different people to HR, Finance and Director review', 409);
    for (const id of ids) {
      await this.eligibleReviewer(client, id, id === input.hrReviewerId);
      if (employeeIds.includes(await this.linked(client, id)))
        throw new ApplicationError(
          'A reviewer cannot approve their own payroll. Select an independent reviewer or split these employees into separate runs.',
          403,
        );
    }
  }
  private async calculate(
    client: PoolClient,
    period: string,
    policy: Policy,
    inputs: Input['calculations'],
  ) {
    await client.query('SELECT id FROM employees WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
      inputs.map((input) => input.employeeId),
    ]);
    const snapshots: Record<string, unknown>[] = [];
    for (const input of [...inputs].sort((a, b) => a.employeeId.localeCompare(b.employeeId))) {
      const calc: Calculation = await this.calculations.calculateWithin(client, {
        ...input,
        period,
        policyId: policy.policyId,
      });
      const source = (
        await client.query<{
          revisionId: string;
          employee: Record<string, unknown>;
          periodStart: string;
          periodEnd: string;
          payDate: string;
        }>(
          `SELECT r.id "revisionId",jsonb_build_object('id',e.id,'code',e.employee_code,'name',e.first_name||' '||e.last_name,'email',e.email::text) employee,d.period_month::text "periodStart",d.period_end::text "periodEnd",d.pay_date::text "payDate" FROM payroll_drafts d JOIN payroll_draft_revisions r ON r.draft_id=d.id AND r.version=$2 JOIN employees e ON e.id=d.employee_id AND e.removed_at IS NULL WHERE d.id=$1 AND d.employee_id=$3 AND to_char(d.period_month,'YYYY-MM')=$4 FOR SHARE OF d`,
          [input.manualDraftId, input.expectedDraftVersion, input.employeeId, period],
        )
      ).rows[0];
      if (!source)
        throw new ApplicationError(
          'Selected manual draft is unavailable for this employee and month',
          409,
        );
      snapshots.push({
        employee: source.employee,
        period,
        currency: 'INR',
        countryCode: 'IN',
        earnings: calc.earnings,
        deductions: calc.deductions,
        gross: calc.gross,
        deductionTotal: calc.deductionTotal,
        net: calc.net,
        source: {
          draftId: input.manualDraftId,
          revisionId: source.revisionId,
          version: input.expectedDraftVersion,
        },
        policy,
        periodStart: source.periodStart,
        periodEnd: source.periodEnd,
        payDate: source.payDate,
        calculation: calc,
        input,
      });
    }
    return snapshots;
  }
  private sourceHash(policy: Policy, snapshots: Record<string, unknown>[]) {
    return digest({
      policyHash: policy.policyHash,
      lines: snapshots.map((s) => (s.calculation as Calculation).sourceHash),
    });
  }
  private async currentFamilyPolicy(client: PoolClient, run: Header) {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_payroll_policy_approval'))");
    const current = (
      await client.query<{ id: string }>(
        `SELECT candidate.id FROM payroll_policies original JOIN payroll_policies candidate ON candidate.policy_key=original.policy_key JOIN payroll_policy_approvals approved ON approved.policy_id=candidate.id WHERE original.id=$1 AND candidate.effective_from<=($2||'-01')::date ORDER BY candidate.effective_from DESC,candidate.version DESC LIMIT 1`,
        [run.policy.policyId, run.period],
      )
    ).rows[0];
    if (!current)
      throw new ApplicationError(
        'No current approved policy remains for this payroll family. Resolve policy setup before continuing.',
        409,
      );
    return this.policies.snapshotWithin(client, run.period, current.id);
  }
  private async freshness(client: PoolClient, run: Header) {
    if (run.status === 'FINALIZED') return null;
    try {
      const policy = await this.currentFamilyPolicy(client, run);
      if (policy.policyHash !== run.policy.policyHash)
        return 'The approved policy changed. Reject to draft, refresh sources and repeat every review.';
      const lines = await this.lines(client, run);
      const input = lines.map((line) => line.snapshot.input as Input['calculations'][number]);
      const latest = await this.calculate(client, run.period, policy, input);
      return this.sourceHash(policy, latest) === run.sourceHash
        ? null
        : 'Salary or manual draft sources changed. Reject to draft, refresh sources and repeat every review.';
    } catch (error) {
      if (error instanceof ApplicationError && [400, 403, 404, 409, 422].includes(error.status))
        return 'A source or approved policy is no longer eligible. Return to draft and resolve its setup before reviewing again.';
      throw error;
    }
  }
  private async independent(client: PoolClient, run: Header, actor: SessionIdentity) {
    const employee = await this.linked(client, actor.id);
    if (
      (
        await client.query(
          'SELECT 1 FROM payroll_run_lines WHERE run_id=$1 AND generation=$2 AND employee_id=$3',
          [run.id, run.generation, employee],
        )
      ).rowCount
    )
      throw new ApplicationError(
        'You cannot approve your own payroll. Ask an independent assigned reviewer or split the run.',
        403,
      );
  }
  private async available(
    client: PoolClient,
    run: Header,
    actor: SessionIdentity,
    stale: string | null,
  ) {
    const actions: RunAction['action'][] = [];
    if (run.status === 'FINALIZED') return actions;
    try {
      await this.independent(client, run, actor);
    } catch (error) {
      if (error instanceof ApplicationError && error.status === 403) return actions;
      throw error;
    }
    if (
      run.status !== 'DRAFT' &&
      (actor.isHrManager ||
        actor.id === run.financeApproverId ||
        actor.id === run.directorApproverId)
    )
      actions.push('REJECT');
    if (stale) return actions;
    if (run.status === 'DRAFT' && actor.isHrManager && actor.id === run.hrReviewerId)
      actions.push('HR_REVIEW');
    if (run.status === 'HR_REVIEWED' && actor.id === run.financeApproverId)
      actions.push('FINANCE_APPROVE');
    if (
      run.status === 'FINANCE_APPROVED' &&
      run.requiresDirector &&
      actor.id === run.directorApproverId
    )
      actions.push('DIRECTOR_APPROVE');
    if (
      ((run.status === 'DIRECTOR_APPROVED' && run.requiresDirector) ||
        (run.status === 'FINANCE_APPROVED' && !run.requiresDirector)) &&
      ((run.policy.config.finalizerRole === 'HR' && actor.isHrManager) ||
        (run.policy.config.finalizerRole === 'FINANCE' && actor.id === run.financeApproverId))
    )
      actions.push('FINALIZE');
    return actions;
  }
  private async detailWithin(
    client: PoolClient,
    run: Header,
    actor: SessionIdentity,
    page = 1,
    replayed = false,
  ) {
    const blockedReason = await this.freshness(client, run);
    return {
      ...run,
      lines: await this.lines(client, run, page),
      linesPage: page,
      linesTotal: run.employeeCount,
      events: (
        await client.query(
          `SELECT id,action,from_status "fromStatus",to_status "toStatus",actor_id "actorId",actor_name "actorName",reason,version,created_at "createdAt" FROM payroll_run_events WHERE run_id=$1 ORDER BY version`,
          [run.id],
        )
      ).rows,
      stale: !!blockedReason,
      blockedReason,
      availableActions: await this.available(client, run, actor, blockedReason),
      replayed,
    };
  }
  setup(token: string, period: string, policyId?: string) {
    return this.transaction(async (client) => {
      const actor = await this.actor(client, token);
      if (!actor.isHrManager) throw new ApplicationError('HR prepares payroll runs', 403);
      const policy = await this.policies.snapshotWithin(client, period, policyId);
      const candidates = (
        await client.query<{
          id: string;
          name: string;
          employeeCode: string;
          isHrManager: boolean;
        }>(
          `SELECT u.id,u.full_name name,e.employee_code "employeeCode",u.is_hr_manager "isHrManager" FROM users u JOIN employees e ON e.id=u.employee_id AND e.removed_at IS NULL WHERE u.status='ACTIVE' AND NOT u.is_system AND (u.is_hr_manager OR (u.permissions @> ARRAY['read','salary:view']::text[] AND (u.id=ANY($1::uuid[]) OR u.id=ANY($2::uuid[])))) ORDER BY u.full_name,u.id`,
          [policy.financeApproverIds, policy.directorApproverIds],
        )
      ).rows;
      return { policy, candidates };
    });
  }
  list(token: string, q: { period?: string; page: number }) {
    return this.transaction(async (client) => {
      const actor = await this.actor(client, token);
      const values = [q.period ?? null, actor.isHrManager, actor.id];
      const where = `WHERE ($1::text IS NULL OR period_month=($1||'-01')::date) AND ($2 OR finance_approver_id=$3 OR director_approver_id=$3)`;
      return {
        items: (
          await client.query<Header>(
            `SELECT ${columns} FROM payroll_runs ${where} ORDER BY period_month DESC,created_at DESC,id LIMIT 25 OFFSET $4`,
            [...values, (q.page - 1) * 25],
          )
        ).rows,
        total: (
          await client.query<{ n: number }>(
            `SELECT count(*)::int n FROM payroll_runs ${where}`,
            values,
          )
        ).rows[0]!.n,
        page: q.page,
        pageSize: 25,
      };
    });
  }
  detail(token: string, id: string, page = 1) {
    return this.transaction(async (client) => {
      const actor = await this.actor(client, token);
      return this.detailWithin(client, await this.header(client, id, actor), actor, page);
    });
  }
  private async replay(
    client: PoolClient,
    actor: SessionIdentity,
    commandId: string,
    hash: string,
  ) {
    const old = (
      await client.query<{ input_hash: string; result: Record<string, unknown>; run_id: string }>(
        'SELECT input_hash,result,run_id FROM payroll_run_commands WHERE actor_id=$1 AND command_id=$2',
        [actor.id, commandId],
      )
    ).rows[0];
    if (!old) return null;
    await this.header(client, old.run_id, actor);
    if (old.input_hash !== hash)
      throw new ApplicationError(
        'Submission key was already used for different payroll details',
        409,
      );
    return { ...old.result, replayed: true };
  }
  private async event(
    client: PoolClient,
    run: Header,
    actor: SessionIdentity,
    action: string,
    from: Status | null,
    reason: string,
  ) {
    await client.query(
      `INSERT INTO payroll_run_events(id,run_id,version,generation,action,from_status,to_status,actor_id,actor_name,reason) SELECT $1,$2,$3,$4,$5,$6,$7,u.id,u.full_name,$8 FROM users u WHERE u.id=$9`,
      [
        randomUUID(),
        run.id,
        run.version,
        run.generation,
        action,
        from,
        run.status,
        reason,
        actor.id,
      ],
    );
  }
  private async storeLines(
    client: PoolClient,
    id: string,
    generation: number,
    snapshots: Record<string, unknown>[],
  ) {
    for (const snapshot of snapshots)
      await client.query(
        'INSERT INTO payroll_run_lines(id,run_id,generation,employee_id,snapshot) VALUES($1,$2,$3,$4,$5)',
        [randomUUID(), id, generation, (snapshot.employee as { id: string }).id, snapshot],
      );
  }
  private async remember(
    client: PoolClient,
    actor: SessionIdentity,
    commandId: string,
    hash: string,
    result: Record<string, unknown>,
  ) {
    await client.query(
      'INSERT INTO payroll_run_commands(actor_id,command_id,input_hash,run_id,result) VALUES($1,$2,$3,$4,$5)',
      [actor.id, commandId, hash, result.id, result],
    );
    return result;
  }
  create(token: string, csrf: string, raw: Input) {
    const q = createRunInput.parse(raw);
    const hash = digest({ action: 'CREATE', ...q, commandId: undefined });
    return this.transaction(async (client) => {
      const actor = await this.actor(client, token, csrf);
      if (!actor.isHrManager) throw new ApplicationError('HR creates payroll runs', 403);
      await this.linked(client, actor.id);
      const replay = await this.replay(client, actor, q.commandId, hash);
      if (replay) return replay;
      const policy = await this.policies.snapshotWithin(client, q.period, q.policyId);
      await this.assignments(
        client,
        policy,
        q,
        q.calculations.map((c) => c.employeeId),
      );
      const snapshots = await this.calculate(client, q.period, policy, q.calculations);
      const id = randomUUID();
      await client.query(
        `INSERT INTO payroll_runs(id,period_month,policy_snapshot,source_hash,employee_count,created_by,hr_reviewer_id,finance_approver_id,director_approver_id,requires_director) VALUES($1,($2||'-01')::date,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          id,
          q.period,
          policy,
          this.sourceHash(policy, snapshots),
          snapshots.length,
          actor.id,
          q.hrReviewerId,
          q.financeApproverId,
          q.directorApproverId,
          policy.requiresDirector,
        ],
      );
      const run = await this.header(client, id, actor);
      await this.storeLines(client, id, 1, snapshots);
      await this.event(client, run, actor, 'CREATE', null, q.reason);
      return this.remember(
        client,
        actor,
        q.commandId,
        hash,
        await this.detailWithin(client, run, actor),
      );
    });
  }
  refresh(token: string, csrf: string, id: string, raw: z.output<typeof refreshRunInput>) {
    const q = refreshRunInput.parse(raw);
    const hash = digest({ action: 'REFRESH', id, reason: q.reason });
    return this.transaction(async (client) => {
      const actor = await this.actor(client, token, csrf);
      if (!actor.isHrManager) throw new ApplicationError('HR refreshes payroll sources', 403);
      await this.linked(client, actor.id);
      const run = await this.header(client, id, actor, true);
      const replay = await this.replay(client, actor, q.commandId, hash);
      if (replay) return replay;
      if (run.status !== 'DRAFT' || run.version !== q.expectedVersion)
        throw new ApplicationError('Return this run to draft and refresh its latest version', 409);
      const policy = await this.currentFamilyPolicy(client, run);
      await this.assignments(
        client,
        policy,
        run,
        (await this.lines(client, run)).map((l) => l.employeeId),
      );
      const inputs = (await this.lines(client, run)).map(
        (l) => l.snapshot.input as Input['calculations'][number],
      );
      await client.query(
        'SELECT id FROM employees WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',
        [inputs.map((input) => input.employeeId)],
      );
      for (const input of inputs) {
        const latest = (
          await client.query<{ version: number }>(
            'SELECT version FROM payroll_drafts WHERE id=$1 FOR SHARE',
            [input.manualDraftId],
          )
        ).rows[0];
        if (!latest) throw new ApplicationError('Manual draft unavailable', 409);
        input.expectedDraftVersion = latest.version;
      }
      const snapshots = await this.calculate(client, run.period, policy, inputs);
      await client.query(
        'UPDATE payroll_runs SET version=version+1,generation=generation+1,policy_snapshot=$2,source_hash=$3,requires_director=$4,updated_at=clock_timestamp() WHERE id=$1',
        [id, policy, this.sourceHash(policy, snapshots), policy.requiresDirector],
      );
      const next = await this.header(client, id, actor);
      await this.storeLines(client, id, next.generation, snapshots);
      await this.event(client, next, actor, 'REFRESH', 'DRAFT', q.reason);
      return this.remember(
        client,
        actor,
        q.commandId,
        hash,
        await this.detailWithin(client, next, actor),
      );
    });
  }
  act(token: string, csrf: string, id: string, raw: RunAction) {
    const q = runActionInput.parse(raw);
    const hash = digest({ id, action: q.action, reason: q.reason });
    return this.transaction(async (client) => {
      const actor = await this.actor(client, token, csrf);
      const run = await this.header(client, id, actor, true);
      const replay = await this.replay(client, actor, q.commandId, hash);
      if (replay) return replay;
      if (run.version !== q.expectedVersion)
        throw new ApplicationError(
          'Another reviewer changed this run. Review its latest version.',
          409,
        );
      await this.independent(client, run, actor);
      const stale = await this.freshness(client, run);
      if (!(await this.available(client, run, actor, stale)).includes(q.action))
        throw new ApplicationError(
          stale ?? 'This action requires the assigned reviewer and preceding approvals',
          409,
        );
      await this.eligibleReviewer(client, actor.id, q.action === 'HR_REVIEW');
      if (q.action !== 'REJECT')
        await this.assignments(
          client,
          run.policy,
          run,
          (await this.lines(client, run)).map((line) => line.employeeId),
        );
      const status: Status =
        q.action === 'REJECT'
          ? 'DRAFT'
          : q.action === 'HR_REVIEW'
            ? 'HR_REVIEWED'
            : q.action === 'FINANCE_APPROVE'
              ? 'FINANCE_APPROVED'
              : q.action === 'DIRECTOR_APPROVE'
                ? 'DIRECTOR_APPROVED'
                : 'FINALIZED';
      if (status === 'FINALIZED') {
        const duplicate = (
          await client.query<{ run_id: string }>(
            `SELECT a.run_id FROM payroll_finalized_allocations a JOIN payroll_run_lines l ON l.employee_id=a.employee_id AND l.run_id=$1 AND l.generation=$2 WHERE a.period_month=($3||'-01')::date LIMIT 1`,
            [run.id, run.generation, run.period],
          )
        ).rows[0];
        if (duplicate)
          throw new ApplicationError(
            'An employee in this run was already finalized in payroll run ' +
              duplicate.run_id +
              '. Keep this draft and review the existing finalized run.',
            409,
          );
      }
      await client.query(
        `UPDATE payroll_runs SET status=$2,version=version+1,updated_at=clock_timestamp(),finalized_at=CASE WHEN $2='FINALIZED' THEN clock_timestamp() ELSE NULL END WHERE id=$1`,
        [id, status],
      );
      const next = await this.header(client, id, actor);
      await this.event(client, next, actor, q.action, run.status, q.reason);
      return this.remember(
        client,
        actor,
        q.commandId,
        hash,
        await this.detailWithin(client, next, actor),
      );
    });
  }
}
