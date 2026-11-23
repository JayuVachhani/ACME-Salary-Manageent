import { useSalaryApprovals } from './use-salary-approvals';
import { Select, Textarea } from '../../shared/ui/form-controls';
import { Button } from '../../shared/ui/button';
import { RequestState } from '../../shared/ui/request-state';
import { DataTable } from '../../shared/ui/data-table';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { MoneyChange } from '../../shared/ui/money-change';
import { errorMessage } from '../../shared/api/client';
import { formatMoney } from '../../shared/format/money';
import { formatBusinessDate, formatTimestampDate } from '../../shared/format/date';

export function SalaryApprovals() {
  const model = useSalaryApprovals();
  const { status, page, selected, comment, query, action } = model;
  return (
    <section className="team-panel">
      <h2>Salary approval inbox</h2>
      <Button
        variant="secondary"
        disabled={query.isFetching || action.busy}
        onClick={() => {
          void query.refetch();
        }}
      >
        Refresh approval inbox
      </Button>
      <p>
        Review the existing and proposed salary before deciding. You cannot approve your own request
        or your own salary. Your account must be linked to your employee record by another HR
        manager.
      </p>
      <Select
        label="Show requests"
        value={status}
        onChange={(event) => model.changeStatus(event.target.value)}
      >
        <option value="PENDING">Waiting for approval</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </Select>
      <RequestState
        loading={query.isFetching}
        error={query.error ? errorMessage(query.error, 'Could not load salary requests.') : ''}
        loadingMessage="Loading approval inbox..."
      >
        {query.currentData && (
          <>
            <DataTable
              caption="Salary requests"
              head={
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Proposed monthly salary</th>
                  <th scope="col">Starts on</th>
                  <th scope="col">Requested by</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Decision</th>
                </tr>
              }
            >
              {query.currentData.items.length ? (
                query.currentData.items.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.employee_name}</strong>
                      <br />
                      {request.employee_code}
                      <br />
                      <small>
                        {request.request_kind === 'INITIAL'
                          ? 'Initial salary'
                          : request.correctsId
                            ? 'Backdated typo correction'
                            : 'Backdated salary change'}
                      </small>
                    </td>
                    <td>
                      {formatMoney(request.monthly_amount, request.currency, request.decimalPlaces)}
                    </td>
                    <td>{formatBusinessDate(request.effective_from)}</td>
                    <td>{request.requested_by_name}</td>
                    <td>{request.reason}</td>
                    <td>
                      {request.can_decide ? (
                        <>
                          <Button
                            disabled={request.isStale || action.busy}
                            title={
                              request.isStale
                                ? 'Details changed since this request. Reject it and request a fresh submission.'
                                : undefined
                            }
                            onClick={() => model.review(request, 'APPROVED')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={action.busy}
                            onClick={() => model.review(request, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span>
                          {request.status === 'PENDING'
                            ? 'Another eligible HR manager must review'
                            : request.status === 'APPROVED'
                              ? 'Approved'
                              : 'Rejected'}
                        </span>
                      )}
                      {request.status === 'PENDING' && request.isStale && (
                        <p className="field-hint">
                          Employee, policy or salary details changed. Approval is unavailable; an
                          eligible HR manager can reject this request and ask for a fresh
                          submission.
                        </p>
                      )}
                      {request.decision_comment && <p>{request.decision_comment}</p>}
                      {(request.decidedByName || request.decidedAt) && (
                        <p className="field-hint">
                          Decided {request.decidedByName ? 'by ' + request.decidedByName : ''}
                          {request.decidedAt ? ' on ' + formatTimestampDate(request.decidedAt) : ''}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No {status.toLowerCase()} requests.</td>
                </tr>
              )}
            </DataTable>
            <div className="pagination">
              <Button
                variant="secondary"
                disabled={page === 1 || action.busy}
                onClick={() => model.setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} &middot; {query.currentData.total} requests
              </span>
              <Button
                variant="secondary"
                disabled={page * 25 >= query.currentData.total || action.busy}
                onClick={() => model.setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </RequestState>
      <ConfirmationDialog
        open={Boolean(selected)}
        busy={action.busy}
        focusHeading
        confirmDisabled={!comment.trim() || !model.canConfirm}
        title={selected?.decision === 'APPROVED' ? 'Approve this salary?' : 'Reject this request?'}
        headingId="salary-decision-heading"
        className="team-confirm salary-review"
        onCancel={model.cancel}
        onConfirm={model.confirm}
        confirmLabel={selected?.decision === 'APPROVED' ? 'Confirm approval' : 'Confirm rejection'}
        busyLabel="Saving decision..."
        cancelLabel="Cancel decision"
      >
        {selected && (
          <>
            <p>
              <strong>{selected.request.employee_name}</strong> &middot;{' '}
              {selected.request.employee_code}
            </p>
            <p>
              {selected.request.request_kind === 'INITIAL'
                ? 'Initial salary'
                : selected.request.correctsId
                  ? 'Backdated typo correction'
                  : 'Backdated salary change'}{' '}
              &middot; requested by {selected.request.requested_by_name}
            </p>
            {selected.request.status === 'PENDING' ? (
              <MoneyChange
                before={selected.request.before}
                after={{
                  amount: selected.request.monthly_amount,
                  currency: selected.request.currency,
                  countryCode: selected.request.countryCode,
                  defaultCurrency: selected.request.defaultCurrency,
                  decimalPlaces: selected.request.decimalPlaces,
                  effectiveFrom: selected.request.effective_from,
                }}
                beforeLabel="Existing salary at the requested start date"
                afterLabel="Proposed salary"
              />
            ) : (
              <p>This request is no longer awaiting a decision. Close and refresh the inbox.</p>
            )}
            <p>
              <strong>Reason:</strong> {selected.request.reason}
            </p>
            {selected.request.correctsId && (
              <p>
                This corrects a typo on the original effective date. The original salary entry
                remains in history.
              </p>
            )}
            {selected.request.isStale && (
              <p className="setup-note">
                Details changed since submission. This request cannot be approved. You may reject it
                with a comment so a corrected request can be submitted.
              </p>
            )}
            {!model.canConfirm &&
              selected.request.status === 'PENDING' &&
              !selected.request.isStale && (
                <p role="alert">
                  This decision is no longer available with your current access. Close and refresh
                  the inbox.
                </p>
              )}
            <Textarea
              label="Decision comment (required)"
              required
              maxLength={1000}
              value={comment}
              disabled={action.busy}
              onChange={(event) => model.setComment(event.target.value)}
            />
            {!comment.trim() && <p>Enter a comment before confirming.</p>}
            <p>
              {selected.decision === 'APPROVED'
                ? 'Approval adds the requested entry to permanent salary history. Other historical and later scheduled entries are preserved.'
                : 'Rejection leaves compensation unchanged and preserves the request and your comment in history.'}
            </p>
          </>
        )}
      </ConfirmationDialog>
    </section>
  );
}
