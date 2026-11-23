import { useEffect, useRef, useState } from 'react';
import { payrollDeliveryApi } from './api';
import type { DeliveryRun, Preparation } from './types';
import { saveDocument } from './document-download';
import { Form, TextInput, Textarea } from '../../shared/ui/form-controls';
import { Button } from '../../shared/ui/button';
import { DataTable } from '../../shared/ui/data-table';
import { Pagination } from '../../shared/ui/pagination';
import { RequestState } from '../../shared/ui/request-state';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { errorMessage } from '../../shared/api/client';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
import { formatMoney } from '../../shared/format/money';

type Pending =
  | { kind: 'prepare'; commandId: string; reason: string }
  | {
      kind: 'report';
      id: string;
      commandId: string;
      externalReference: string;
      paymentDate: string;
      reason: string;
      manifestCount: number;
    };
function Manifest({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const query = payrollDeliveryApi.usePreparationManifestQuery({ id, page });
  const data = query.error ? undefined : query.currentData;
  return (
    <section>
      <h4>Exact finalized payment amounts</h4>
      <RequestState
        loading={query.isFetching && !data}
        error={query.error ? errorMessage(query.error, 'Could not load the payment manifest.') : ''}
        loadingMessage="Loading manifest…"
      >
        {data && (
          <>
            <DataTable
              caption="Provider-neutral payment manifest"
              head={
                <tr>
                  <th scope="col">Employee code</th>
                  <th scope="col">Employee ID</th>
                  <th scope="col">Exact net amount</th>
                </tr>
              }
            >
              {data.items.map((row) => (
                <tr key={row.employeeId}>
                  <td>{row.employeeCode}</td>
                  <td>{row.employeeId}</td>
                  <td>{formatMoney(row.netAmount, 'INR', 2)}</td>
                </tr>
              ))}
            </DataTable>
            <Pagination
              label="Manifest employees"
              page={page}
              pageSize={data.pageSize}
              total={data.total}
              disabled={query.isFetching}
              onPageChange={setPage}
              previousLabel="Previous"
              nextLabel="Next"
            />
          </>
        )}
      </RequestState>
    </section>
  );
}
export function PaymentPreparations({
  run,
  onBusyChange,
}: {
  run: DeliveryRun;
  onBusyChange: (busy: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const [manifestId, setManifestId] = useState('');
  const [selected, setSelected] = useState<Preparation | null>(null);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportReason, setReportReason] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [failure, setFailure] = useState('');
  const query = payrollDeliveryApi.usePaymentPreparationsQuery({ id: run.id, page });
  const data = query.error ? undefined : query.currentData;
  const [prepare] = payrollDeliveryApi.usePreparePaymentMutation();
  const [report] = payrollDeliveryApi.useReportExternalPaymentMutation();
  const [download] = payrollDeliveryApi.useDownloadManifestMutation();
  const downloadCommands = useRef(new Map<string, string>());
  const action = useAction();
  useEffect(() => {
    onBusyChange(action.busy);
    return () => onBusyChange(false);
  }, [action.busy, onBusyChange]);
  function confirm() {
    if (!pending) return;
    const snapshot = pending;
    void action.perform(async (signal) => {
      try {
        if (snapshot.kind === 'prepare')
          await runRequest(
            prepare({
              id: run.id,
              commandId: snapshot.commandId,
              reason: snapshot.reason,
              confirmed: true,
            }),
            signal,
          );
        else
          await runRequest(
            report({
              id: snapshot.id,
              commandId: snapshot.commandId,
              externalReference: snapshot.externalReference,
              paymentDate: snapshot.paymentDate,
              reason: snapshot.reason,
              confirmed: true,
            }),
            signal,
          );
        if (signal.aborted) return;
        setPending(null);
        setReviewOpen(false);
        setUncertain(false);
        setFailure('');
        setSelected(null);
        setReason('');
        setReportReason('');
        setReference('');
        action.announce(
          snapshot.kind === 'prepare'
            ? 'Payment preparation saved. No money was transferred.'
            : 'External payment report recorded. ACME did not transfer or verify money.',
        );
      } catch (cause) {
        if (signal.aborted) return;
        const status =
          typeof cause === 'object' && cause !== null && 'status' in cause
            ? cause.status
            : undefined;
        const unknown =
          status === undefined ||
          status === 'NETWORK_ERROR' ||
          (typeof status === 'number' && status >= 500);
        setUncertain(unknown);
        setReviewOpen(false);
        setFailure(
          errorMessage(
            cause,
            'The result is uncertain. Retry the same submission or check saved history.',
          ),
        );
        if (!unknown) setPending(null);
        throw cause;
      }
    });
  }
  function downloadCsv(id: string) {
    let commandId = downloadCommands.current.get(id);
    if (!commandId) {
      commandId = crypto.randomUUID();
      downloadCommands.current.set(id, commandId);
    }
    const key = commandId;
    void action.perform(async (signal) => {
      const file = await runRequest(download({ id, commandId: key, confirmed: true }), signal);
      if (signal.aborted) return;
      saveDocument(file);
      downloadCommands.current.delete(id);
      action.announce(
        'Provider-neutral preparation manifest downloaded. This is not a bank upload file.',
      );
    });
  }
  return (
    <section>
      <h3>Payment preparation & external tracking</h3>
      <p>
        Assigned Finance approver: <strong>{run.financeApproverName ?? 'Not recorded'}</strong>.
      </p>
      <p className="setup-note">
        Preparation does not mark anyone paid. The manifest contains exact finalized INR net amounts
        and employee identifiers; it contains no bank account details and is not a bank/provider
        upload file.
      </p>
      <div className="form-actions">
        <Button disabled>Send through bank / payment provider</Button>
        <span>No provider integration is configured. ACME cannot transfer money.</span>
      </div>
      {!run.canReportExternalPayment && <p>{run.paymentUnavailableReason}</p>}
      {failure && <p role="alert">{failure}</p>}
      {uncertain && pending && (
        <div className="setup-note">
          <p>
            The save result is uncertain. The reviewed payload is retained for an identical retry.
            Check saved history before creating another action.
          </p>
          <Button disabled={action.busy} onClick={() => setReviewOpen(true)}>
            Review & retry same action
          </Button>
        </div>
      )}
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          if (action.busy || uncertain) return;
          setPending({ kind: 'prepare', commandId: crypto.randomUUID(), reason: reason.trim() });
          setReviewOpen(true);
        }}
      >
        <Textarea
          label="Preparation reason"
          required
          maxLength={1000}
          disabled={!run.canPrepare || action.busy || uncertain}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <Button type="submit" disabled={!run.canPrepare || action.busy || uncertain}>
          Review full-run preparation
        </Button>
      </Form>
      {!run.canPrepare && (
        <p>Preparing a manifest requires export permission and a live verified employee link.</p>
      )}
      <Button
        variant="secondary"
        disabled={query.isFetching || action.busy}
        onClick={() => {
          void query.refetch();
        }}
      >
        Refresh preparation / reporting history
      </Button>
      <RequestState
        loading={query.isFetching && !data}
        error={
          query.error
            ? errorMessage(query.error, 'Could not load payment preparation history.')
            : ''
        }
        loadingMessage="Loading preparation history…"
      >
        {data && (
          <>
            <DataTable
              caption="Immutable payment preparation history"
              head={
                <tr>
                  <th scope="col">Prepared by</th>
                  <th scope="col">Employees</th>
                  <th scope="col">Status / external report</th>
                  <th scope="col">Actions</th>
                </tr>
              }
            >
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.preparedByName}
                    <p>{row.reason}</p>
                  </td>
                  <td>{row.manifestCount}</td>
                  <td>
                    {row.externalPayment ? (
                      <>
                        <strong>Externally reported paid</strong>
                        <p>
                          {row.externalPayment.externalReference} ·{' '}
                          {row.externalPayment.paymentDate}
                        </p>
                        <p>
                          Reported by {row.externalPayment.reportedByName}.{' '}
                          {row.externalPayment.reason}
                        </p>
                        <p>Not a transfer or bank verification by ACME.</p>
                      </>
                    ) : (
                      <strong>Prepared only</strong>
                    )}
                  </td>
                  <td>
                    <Button variant="secondary" onClick={() => setManifestId(row.id)}>
                      View exact amounts
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={!run.canExport || action.busy}
                      onClick={() => downloadCsv(row.id)}
                    >
                      Download preparation CSV
                    </Button>
                    {!row.externalPayment && run.canReportExternalPayment && (
                      <Button
                        disabled={action.busy || uncertain}
                        onClick={() => {
                          setSelected(row);
                          setReference('');
                          setReportReason('');
                        }}
                      >
                        Report external full-net payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
            {!data.items.length && (
              <p>No payment preparations yet. A finalized run is not evidence of payment.</p>
            )}
            <Pagination
              label="Payment preparations"
              page={page}
              pageSize={data.pageSize}
              total={data.total}
              disabled={query.isFetching || action.busy}
              onPageChange={setPage}
              previousLabel="Previous"
              nextLabel="Next"
            />
          </>
        )}
      </RequestState>
      {manifestId && <Manifest key={manifestId} id={manifestId} />}
      {selected && (
        <section>
          <h4>Report an external payment for all {selected.manifestCount} employees</h4>
          <p>
            Only the complete finalized net amounts are covered. Partial payments, adjustments,
            reversals and refunds are not supported. This records your external attestation; ACME
            will not send money.
          </p>
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              if (action.busy || uncertain) return;
              setPending({
                kind: 'report',
                id: selected.id,
                commandId: crypto.randomUUID(),
                externalReference: reference.trim(),
                paymentDate,
                reason: reportReason.trim(),
                manifestCount: selected.manifestCount,
              });
              setReviewOpen(true);
            }}
          >
            <fieldset disabled={action.busy || uncertain}>
              <legend>External payment report</legend>
              <TextInput
                label="External transaction / batch reference"
                hint="Do not enter bank or account details."
                required
                maxLength={200}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
              <TextInput
                label="Externally reported payment date"
                type="date"
                required
                min="0001-01-01"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
              <Textarea
                label="Reason / payment note"
                required
                maxLength={1000}
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
              />
            </fieldset>
            <div className="form-actions">
              <Button type="submit" disabled={action.busy || uncertain}>
                Review external payment report
              </Button>
              <Button
                variant="secondary"
                disabled={action.busy || uncertain}
                onClick={() => setSelected(null)}
              >
                Cancel reporting
              </Button>
            </div>
          </Form>
        </section>
      )}
      <ConfirmationDialog
        open={reviewOpen}
        busy={action.busy}
        className="team-confirm"
        title={
          pending?.kind === 'report'
            ? 'Record an external full-net payment report?'
            : 'Prepare the full finalized payment manifest?'
        }
        headingId="payment-delivery-confirm"
        onCancel={() => setReviewOpen(false)}
        onConfirm={confirm}
        confirmLabel={
          pending?.kind === 'report' ? 'Record external report only' : 'Save preparation only'
        }
        busyLabel="Saving immutable record…"
        cancelLabel="Back to details"
      >
        {pending?.kind === 'report' ? (
          <>
            <p>
              I am reporting that the complete finalized net amounts for all {pending.manifestCount}{' '}
              employees were paid externally.
            </p>
            <p>
              Reference: {pending.externalReference}. Date: {pending.paymentDate}.
            </p>
            <p>Reason: {pending.reason}</p>
            <p>This is an immutable manual report, not bank verification or a transfer by ACME.</p>
          </>
        ) : (
          <>
            <p>
              Prepare exact finalized INR net amounts for all {run.employeeCount} employees in{' '}
              {run.period}.
            </p>
            <p>Reason: {pending?.reason}</p>
            <p>No employee is marked paid and no bank/provider request is sent.</p>
          </>
        )}
      </ConfirmationDialog>
    </section>
  );
}
