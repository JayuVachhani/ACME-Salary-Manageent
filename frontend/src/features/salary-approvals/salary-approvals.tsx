import { useState } from 'react';
import { useSalaryRequestsQuery, useDecideSalaryMutation, type SalaryRequest } from './api';
import { Select, Textarea } from '../../shared/ui/form-controls';
import { Button } from '../../shared/ui/button';
import { RequestState } from '../../shared/ui/request-state';
import { DataTable } from '../../shared/ui/data-table';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
import { errorMessage } from '../../shared/api/client';
export function SalaryApprovals() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{
    request: SalaryRequest;
    decision: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [comment, setComment] = useState('');
  const query = useSalaryRequestsQuery({ status, page });
  const [decide] = useDecideSalaryMutation();
  const action = useAction();
  function confirm() {
    if (!selected || !comment.trim()) return;
    void action.perform(async (signal) => {
      await runRequest(
        decide({ id: selected.request.id, decision: selected.decision, comment, confirmed: true }),
        signal,
      );
      if (signal.aborted) return;
      setSelected(null);
      setComment('');
      action.announce(
        selected.decision === 'APPROVED' ? 'Salary approved.' : 'Salary request rejected.',
      );
    });
  }
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
        Review the employee, amount and start date before deciding. You cannot approve your own
        request or your own salary. Your account must be linked to your employee record by another
        HR manager.
      </p>
      <Select
        label="Show requests"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
      >
        <option value="PENDING">Waiting for approval</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </Select>
      <RequestState
        loading={query.isFetching}
        error={query.error ? errorMessage(query.error, 'Could not load salary requests.') : ''}
        loadingMessage="Loading approval inbox…"
      >
        {query.currentData && (
          <>
            <DataTable
              caption="Salary requests"
              head={
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Monthly salary</th>
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
                        {request.request_kind === 'INITIAL' ? 'Initial salary' : 'Backdated change'}
                      </small>
                    </td>
                    <td>
                      {request.currency} {request.monthly_amount}
                    </td>
                    <td>{request.effective_from}</td>
                    <td>{request.requested_by_name}</td>
                    <td>{request.reason}</td>
                    <td>
                      {request.can_decide ? (
                        <>
                          <Button
                            onClick={() => {
                              setSelected({ request, decision: 'APPROVED' });
                              setComment('');
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelected({ request, decision: 'REJECTED' });
                              setComment('');
                            }}
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
                          {request.decision_comment && <p>{request.decision_comment}</p>}
                        </span>
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
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} · {query.currentData.total} requests
              </span>
              <Button
                variant="secondary"
                disabled={page * 25 >= query.currentData.total}
                onClick={() => setPage((p) => p + 1)}
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
        title={selected?.decision === 'APPROVED' ? 'Approve this salary?' : 'Reject this request?'}
        headingId="salary-decision-heading"
        className="team-confirm"
        onCancel={() => setSelected(null)}
        onConfirm={confirm}
        confirmLabel={selected?.decision === 'APPROVED' ? 'Confirm approval' : 'Confirm rejection'}
        busyLabel="Saving decision…"
        cancelLabel="Cancel decision"
      >
        {selected && (
          <>
            <p>
              {selected.request.employee_name}:{' '}
              <strong>
                {selected.request.currency} {selected.request.monthly_amount} per month
              </strong>{' '}
              from {selected.request.effective_from}.
            </p>
            <p>
              Requested by {selected.request.requested_by_name}. Reason: {selected.request.reason}
            </p>
            <Textarea
              label="Decision comment (required)"
              required
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {!comment.trim() && <p>Enter a comment before confirming.</p>}
            <p>
              {selected.decision === 'APPROVED'
                ? 'Approval adds the salary to the permanent history.'
                : 'Rejection does not change the active salary.'}
            </p>
          </>
        )}
      </ConfirmationDialog>
    </section>
  );
}
