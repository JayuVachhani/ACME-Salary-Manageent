import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import type { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
import type { SessionIdentity } from '../auth/auth.types.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { withTransaction } from '../database/transaction.js';
import { sqlState } from '../database/database-errors.js';
import {
  finalizedLineSnapshot,
  manifestEntry,
  type DeliveryRun,
  type FinalizedLineSnapshot,
  type externalPaymentInput,
} from './dto/payroll-delivery.dto.js';
import { renderFinalizedPayslipHtml, renderPreparationCsv } from './payroll-documents.js';

type Run = {
  id: string;
  period: string;
  version: number;
  generation: number;
  status: string;
  policy_snapshot: { financeApproverIds?: string[]; directorApproverIds?: string[] };
  source_hash: string;
  finalized_at: Date | null;
  finance_approver_id: string | null;
  finance_name: string | null;
  employee_count: number;
};
type Preparation = {
  id: string;
  run_id: string;
  run_version: number;
  generation: number;
  period: string;
  manifest?: unknown;
  manifest_count: number;
  manifest_hash: string;
  source_hash: string;
  prepared_by_name: string;
  created_at: Date;
  reason: string;
};
type ExternalReport = {
  id: string;
  external_reference: string;
  payment_date: string;
  reported_by_name: string;
  reported_at: Date;
  reason: string;
};
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const runSelect = `r.id,to_char(r.period_month,'YYYY-MM') period,r.version,r.generation,r.status,r.policy_snapshot,r.source_hash,r.finalized_at,r.finance_approver_id,finance.full_name finance_name,(SELECT count(*)::int FROM payroll_run_lines line WHERE line.run_id=r.id AND line.generation=r.generation) employee_count`;
const runFrom = `FROM payroll_runs r LEFT JOIN users finance ON finance.id=r.finance_approver_id`;

@Injectable()
export class PayrollDeliveryService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
  ) {}
  private async execute<T>(work: (client: PoolClient) => Promise<T>) {
    try {
      return await withTransaction(this.pool, work);
    } catch (error) {
      const state = sqlState(error);
      if (state === '42501')
        throw new ApplicationError(
          'Your current payroll assignment or permissions do not permit this action',
          403,
        );
      if (['23505', '23514', '23503', '40001', '40P01'].includes(state ?? ''))
        throw new ApplicationError(
          'Payroll delivery data changed or this external payment was already reported. Refresh its history before retrying.',
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
      !(actor.permissions.includes('read') && actor.permissions.includes('salary:view'))
    )
      throw new ApplicationError('Payroll read and salary access are required', 403);
    return actor;
  }
  private readable(actor: SessionIdentity, run: Run) {
    return (
      actor.isHrManager ||
      (actor.permissions.includes('read') &&
        actor.permissions.includes('salary:view') &&
        [
          ...(run.policy_snapshot.financeApproverIds ?? []),
          ...(run.policy_snapshot.directorApproverIds ?? []),
        ].includes(actor.id))
    );
  }
  private exportable(actor: SessionIdentity) {
    return actor.isHrManager || actor.permissions.includes('export');
  }
  private async liveLink(client: PoolClient, actor: SessionIdentity) {
    return (
      (
        await client.query<{ employee_id: string }>(
          'SELECT u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=$1 AND e.removed_at IS NULL FOR SHARE OF e',
          [actor.id],
        )
      ).rows[0]?.employee_id ?? null
    );
  }
  private async run(client: PoolClient, actor: SessionIdentity, id: string) {
    const run = (
      await client.query<Run>(
        `SELECT ${runSelect} ${runFrom} WHERE r.id=$1 AND r.status='FINALIZED' AND r.finalized_at IS NOT NULL FOR SHARE OF r`,
        [id],
      )
    ).rows[0];
    if (!run) throw new ApplicationError('A finalized payroll run is required', 404);
    if (!this.readable(actor, run))
      throw new ApplicationError(
        'Only HR or this run’s configured Finance/Director readers can access finalized payroll',
        403,
      );
    return run;
  }
  private async view(client: PoolClient, actor: SessionIdentity, run: Run): Promise<DeliveryRun> {
    const linked = await this.liveLink(client, actor);
    const own = linked
      ? Boolean(
          (
            await client.query(
              'SELECT 1 FROM payroll_run_lines WHERE run_id=$1 AND generation=$2 AND employee_id=$3 LIMIT 1',
              [run.id, run.generation, linked],
            )
          ).rowCount,
        )
      : false;
    const reason =
      run.finance_approver_id !== actor.id
        ? 'Only this run’s actual Finance approver can report an external payment.'
        : !linked
          ? 'A live verified employee link is required to report payments.'
          : own
            ? 'You cannot report a run containing your own payroll record.'
            : null;
    return {
      id: run.id,
      period: run.period,
      version: run.version,
      generation: run.generation,
      status: 'FINALIZED',
      finalizedAt: run.finalized_at!.toISOString(),
      sourceHash: run.source_hash,
      financeApproverName: run.finance_name,
      employeeCount: run.employee_count,
      canExport: this.exportable(actor),
      canPrepare: this.exportable(actor) && linked !== null,
      canReportExternalPayment: reason === null,
      paymentUnavailableReason: reason,
    };
  }
  private snapshot(value: unknown, run: Run, employeeId: string): FinalizedLineSnapshot {
    const parsed = finalizedLineSnapshot.safeParse(value);
    if (
      !parsed.success ||
      parsed.data.employee.id !== employeeId ||
      parsed.data.period !== run.period ||
      parsed.data.calculation.employeeId !== employeeId ||
      parsed.data.calculation.period !== run.period ||
      parsed.data.gross !== parsed.data.calculation.gross ||
      parsed.data.deductionTotal !== parsed.data.calculation.deductionTotal ||
      parsed.data.net !== parsed.data.calculation.net
    )
      throw new ApplicationError(
        'The immutable finalized snapshot needs review; no document or payment preparation was generated',
        409,
      );
    return parsed.data;
  }
  private async lines(client: PoolClient, run: Run, page?: number) {
    return (
      await client.query<{ employee_id: string; snapshot: unknown }>(
        `SELECT employee_id,snapshot FROM payroll_run_lines WHERE run_id=$1 AND generation=$2 ORDER BY employee_id ${page ? 'LIMIT 25 OFFSET $3' : ''}`,
        page ? [run.id, run.generation, (page - 1) * 25] : [run.id, run.generation],
      )
    ).rows;
  }
  list(token: string, period: string | undefined, page: number) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token);
      const where = `WHERE r.status='FINALIZED' AND r.finalized_at IS NOT NULL AND ($1::text IS NULL OR to_char(r.period_month,'YYYY-MM')=$1) AND ($2::boolean OR (r.policy_snapshot->'financeApproverIds') ? $3 OR (r.policy_snapshot->'directorApproverIds') ? $3)`;
      const params = [period ?? null, actor.isHrManager, actor.id];
      const rows = (
        await client.query<Run>(
          `SELECT ${runSelect} ${runFrom} ${where} ORDER BY r.period_month DESC,r.id LIMIT 25 OFFSET $4`,
          [...params, (page - 1) * 25],
        )
      ).rows;
      const total = (
        await client.query<{ n: number }>(`SELECT count(*)::int n ${runFrom} ${where}`, params)
      ).rows[0]!.n;
      const items: DeliveryRun[] = [];
      for (const run of rows) items.push(await this.view(client, actor, run));
      return { items, total, page, pageSize: 25 };
    });
  }
  payslips(token: string, id: string, page: number) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token);
      const run = await this.run(client, actor, id);
      const view = await this.view(client, actor, run);
      const items = (await this.lines(client, run, page)).map((line) => ({
        run: view,
        snapshot: this.snapshot(line.snapshot, run, line.employee_id),
        status: 'FINALIZED' as const,
      }));
      return { items, total: run.employee_count, page, pageSize: 25 };
    });
  }
  detailRun(token: string, id: string) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token);
      return this.view(client, actor, await this.run(client, actor, id));
    });
  }
  payslip(token: string, id: string, employeeId: string) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token);
      const run = await this.run(client, actor, id);
      const line = (
        await client.query<{ snapshot: unknown }>(
          'SELECT snapshot FROM payroll_run_lines WHERE run_id=$1 AND generation=$2 AND employee_id=$3',
          [run.id, run.generation, employeeId],
        )
      ).rows[0];
      if (!line) throw new ApplicationError('Finalized payslip unavailable', 404);
      return {
        run: await this.view(client, actor, run),
        snapshot: this.snapshot(line.snapshot, run, employeeId.toLowerCase()),
        status: 'FINALIZED' as const,
      };
    });
  }
  private async report(client: PoolClient, runId: string) {
    return (
      (
        await client.query<ExternalReport>(
          'SELECT id,external_reference,payment_date::text,reported_by_name,reported_at,reason FROM payroll_external_payment_reports WHERE run_id=$1',
          [runId],
        )
      ).rows[0] ?? null
    );
  }
  private async preparation(client: PoolClient, row: Preparation, replayed = false) {
    const report = await this.report(client, row.run_id);
    return {
      id: row.id,
      runId: row.run_id,
      runVersion: row.run_version,
      generation: row.generation,
      period: row.period,
      currency: 'INR' as const,
      manifestCount: row.manifest_count,
      manifestHash: row.manifest_hash,
      sourceHash: row.source_hash,
      preparedByName: row.prepared_by_name,
      preparedAt: row.created_at.toISOString(),
      reason: row.reason,
      status: report ? ('EXTERNALLY_REPORTED_PAID' as const) : ('PREPARED' as const),
      externalPayment: report
        ? {
            id: report.id,
            externalReference: report.external_reference,
            paymentDate: report.payment_date,
            reportedByName: report.reported_by_name,
            reportedAt: report.reported_at.toISOString(),
            status: 'EXTERNALLY_REPORTED_PAID' as const,
            reason: report.reason,
          }
        : null,
      replayed,
    };
  }
  private async preparationRow(client: PoolClient, actor: SessionIdentity, id: string) {
    const row = (
      await client.query<Preparation>('SELECT * FROM payroll_payment_preparations WHERE id=$1', [
        id,
      ])
    ).rows[0];
    if (!row) throw new ApplicationError('Payment preparation unavailable', 404);
    const run = await this.run(client, actor, row.run_id);
    if (
      row.run_version !== run.version ||
      row.generation !== run.generation ||
      row.source_hash !== run.source_hash
    )
      throw new ApplicationError('Payment preparation does not match the finalized run', 409);
    return { row, run };
  }
  prepare(token: string, csrf: string, id: string, commandId: string, reason: string) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token, csrf);
      const run = await this.run(client, actor, id);
      const view = await this.view(client, actor, run);
      if (!view.canPrepare)
        throw new ApplicationError(
          'Preparation requires current export access and a live employee link',
          403,
        );
      const inputHash = hash(
        JSON.stringify({
          runId: run.id,
          runVersion: run.version,
          generation: run.generation,
          reason,
        }),
      );
      const prior = (
        await client.query<Preparation & { input_hash: string }>(
          'SELECT * FROM payroll_payment_preparations WHERE prepared_by=$1 AND command_id=$2',
          [actor.id, commandId],
        )
      ).rows[0];
      if (prior) {
        if (prior.input_hash !== inputHash)
          throw new ApplicationError(
            'Submission key was used for another payment preparation',
            409,
          );
        return this.preparation(client, prior, true);
      }
      const manifest = (await this.lines(client, run)).map((line) => {
        const snapshot = this.snapshot(line.snapshot, run, line.employee_id);
        return {
          employeeId: snapshot.employee.id,
          employeeCode: snapshot.employee.code,
          currency: 'INR' as const,
          netAmount: snapshot.net,
        };
      });
      if (!manifest.length)
        throw new ApplicationError('A finalized run with employee snapshots is required', 409);
      const preparationId = randomUUID();
      const manifestHash = hash(JSON.stringify(manifest));
      const row = (
        await client.query<Preparation>(
          'INSERT INTO payroll_payment_preparations(id,run_id,run_version,generation,period,source_hash,manifest,manifest_count,manifest_hash,prepared_by,command_id,input_hash,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
          [
            preparationId,
            run.id,
            run.version,
            run.generation,
            run.period,
            run.source_hash,
            JSON.stringify(manifest),
            manifest.length,
            manifestHash,
            actor.id,
            commandId,
            inputHash,
            reason,
          ],
        )
      ).rows[0]!;
      return this.preparation(client, row);
    });
  }
  preparations(token: string, id: string, page: number) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token);
      const run = await this.run(client, actor, id);
      const rows = (
        await client.query<Preparation>(
          'SELECT id,run_id,run_version,generation,period,manifest_count,manifest_hash,source_hash,prepared_by_name,created_at,reason FROM payroll_payment_preparations WHERE run_id=$1 ORDER BY created_at DESC,id LIMIT 25 OFFSET $2',
          [run.id, (page - 1) * 25],
        )
      ).rows;
      const total = (
        await client.query<{ n: number }>(
          'SELECT count(*)::int n FROM payroll_payment_preparations WHERE run_id=$1',
          [run.id],
        )
      ).rows[0]!.n;
      const items = [];
      for (const row of rows) items.push(await this.preparation(client, row));
      return { items, total, page, pageSize: 25 };
    });
  }
  manifest(token: string, id: string, page: number) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token);
      const { row } = await this.preparationRow(client, actor, id);
      const entries = manifestEntry.array().parse(row.manifest);
      return {
        items: entries.slice((page - 1) * 25, page * 25),
        total: entries.length,
        page,
        pageSize: 25,
      };
    });
  }
  private async document(
    client: PoolClient,
    actor: SessionIdentity,
    run: Run,
    commandId: string,
    scope: {
      kind: 'PAYSLIP_HTML' | 'PAYMENT_MANIFEST_CSV';
      employeeId?: string;
      preparationId?: string;
    },
    content: string,
  ) {
    if (!this.exportable(actor))
      throw new ApplicationError('Payroll document export permission is required', 403);
    const inputHash = hash(JSON.stringify({ runId: run.id, runVersion: run.version, ...scope }));
    const contentHash = hash(content);
    const prior = (
      await client.query<{ input_hash: string; content_hash: string }>(
        'SELECT input_hash,content_hash FROM payroll_delivery_exports WHERE actor_id=$1 AND command_id=$2',
        [actor.id, commandId],
      )
    ).rows[0];
    if (prior && (prior.input_hash !== inputHash || prior.content_hash !== contentHash))
      throw new ApplicationError('Export submission key was used for a different document', 409);
    if (!prior)
      await client.query(
        'INSERT INTO payroll_delivery_exports(id,actor_id,command_id,input_hash,run_id,kind,employee_id,preparation_id,content_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [
          randomUUID(),
          actor.id,
          commandId,
          inputHash,
          run.id,
          scope.kind,
          scope.employeeId ?? null,
          scope.preparationId ?? null,
          contentHash,
        ],
      );
    return {
      filename:
        scope.kind === 'PAYSLIP_HTML'
          ? `finalized-payslip-${run.id}-${scope.employeeId}.html`
          : `payment-preparation-${scope.preparationId}.csv`,
      mimeType: scope.kind === 'PAYSLIP_HTML' ? ('text/html' as const) : ('text/csv' as const),
      content,
      contentHash,
      replayed: Boolean(prior),
    };
  }
  downloadPayslip(token: string, csrf: string, id: string, employeeId: string, commandId: string) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token, csrf);
      const run = await this.run(client, actor, id);
      const view = await this.view(client, actor, run);
      const line = (
        await client.query<{ snapshot: unknown }>(
          'SELECT snapshot FROM payroll_run_lines WHERE run_id=$1 AND generation=$2 AND employee_id=$3',
          [run.id, run.generation, employeeId],
        )
      ).rows[0];
      if (!line) throw new ApplicationError('Finalized payslip unavailable', 404);
      const snapshot = this.snapshot(line.snapshot, run, employeeId.toLowerCase());
      return this.document(
        client,
        actor,
        run,
        commandId,
        { kind: 'PAYSLIP_HTML', employeeId: snapshot.employee.id },
        renderFinalizedPayslipHtml(view, snapshot),
      );
    });
  }
  downloadManifest(token: string, csrf: string, id: string, commandId: string) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token, csrf);
      const { row, run } = await this.preparationRow(client, actor, id);
      const view = await this.view(client, actor, run);
      return this.document(
        client,
        actor,
        run,
        commandId,
        { kind: 'PAYMENT_MANIFEST_CSV', preparationId: row.id },
        renderPreparationCsv(row.id, view, manifestEntry.array().parse(row.manifest)),
      );
    });
  }
  reportExternalPayment(
    token: string,
    csrf: string,
    id: string,
    input: z.output<typeof externalPaymentInput>,
  ) {
    return this.execute(async (client) => {
      const actor = await this.actor(client, token, csrf);
      const { row, run } = await this.preparationRow(client, actor, id);
      const view = await this.view(client, actor, run);
      if (!view.canReportExternalPayment)
        throw new ApplicationError(
          view.paymentUnavailableReason ??
            'Only the assigned Finance approver can report external payment',
          403,
        );
      const inputHash = hash(
        JSON.stringify({
          preparationId: row.id,
          externalReference: input.externalReference,
          paymentDate: input.paymentDate,
          reason: input.reason,
        }),
      );
      const prior = (
        await client.query<{ input_hash: string }>(
          'SELECT input_hash FROM payroll_external_payment_reports WHERE reported_by=$1 AND command_id=$2',
          [actor.id, input.commandId],
        )
      ).rows[0];
      if (prior) {
        if (prior.input_hash !== inputHash)
          throw new ApplicationError(
            'This payment-report submission key was used for different details',
            409,
          );
        return this.preparation(client, row, true);
      }
      await client.query(
        'INSERT INTO payroll_external_payment_reports(id,run_id,preparation_id,external_reference,payment_date,reported_by,command_id,input_hash,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [
          randomUUID(),
          run.id,
          row.id,
          input.externalReference,
          input.paymentDate,
          actor.id,
          input.commandId,
          inputHash,
          input.reason,
        ],
      );
      return this.preparation(client, row);
    });
  }
}
