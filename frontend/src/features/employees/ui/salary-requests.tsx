import type { EmployeeSalaryModel } from '../use-employee-salary';
import { Button } from '../../../shared/ui/button';
import { formatMoney } from '../../../shared/format/money';
import { formatBusinessDate, formatTimestampDate } from '../../../shared/format/date';

export function SalaryRequests({ model }: { model: EmployeeSalaryModel }) {
  const { data, requests, isHrManager } = model;
  if (!data) return null;
  const editing = Boolean(model.editor) || model.initialOpen || model.busy;
  const publicPending = data.pending.filter(
    (pending) => !requests.some((request) => request.id === pending.id),
  );
  return (
    <section className="salary-requests" aria-labelledby="employee-salary-requests-heading">
      {!!publicPending.length && (
        <section
          className="salary-pending-notices"
          aria-labelledby="salary-pending-amounts-heading"
        >
          <h4 id="salary-pending-amounts-heading">Pending salary amounts</h4>
          <p className="field-hint">
            These requests are awaiting approval and are not active compensation. Request notes and
            decisions are shown only to their creator or an HR manager.
          </p>
          <ul>
            {publicPending.map((request) => (
              <li key={request.id}>
                <strong>
                  {formatMoney(request.amount, request.currency, request.decimalPlaces)}
                </strong>{' '}
                per month, starting {formatBusinessDate(request.effectiveFrom)}{' '}
                <span className="salary-status salary-status--review">
                  Awaiting approval · not active
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h3 id="employee-salary-requests-heading">
        {isHrManager ? 'Approval requests' : 'Your approval requests'}
      </h3>
      <p className="field-hint">
        Initial and backdated requests stay separate from recorded salary until approved. Rejected
        requests never change compensation.
      </p>
      {!requests.length ? (
        <p>No visible approval requests on this page.</p>
      ) : (
        <ul className="salary-request-list">
          {requests.map((request) => (
            <li key={request.id} className="salary-request-card">
              <div className="salary-section-heading">
                <strong>
                  {formatMoney(request.amount, request.currency, request.decimalPlaces)} per month
                </strong>
                <span
                  className={`salary-status ${request.status === 'PENDING' ? 'salary-status--review' : request.status === 'REJECTED' ? 'salary-status--rejected' : 'salary-status--approved'}`}
                >
                  {request.status === 'PENDING'
                    ? 'Awaiting approval · not active'
                    : request.status === 'REJECTED'
                      ? 'Rejected · salary unchanged'
                      : 'Approved · added to history'}
                </span>
              </div>
              <p>
                {request.requestKind === 'INITIAL'
                  ? 'Initial salary'
                  : request.correctsId
                    ? 'Backdated typo correction'
                    : 'Backdated salary change'}{' '}
                · starts {formatBusinessDate(request.effectiveFrom)}
              </p>
              <p>
                <strong>Reason:</strong> {request.reason}
              </p>
              <p className="field-hint">
                Requested by {request.requestedByName} on {formatTimestampDate(request.createdAt)}
              </p>
              {request.decisionComment && (
                <div className="salary-decision-note">
                  <strong>Decision comment</strong>
                  <p>{request.decisionComment}</p>
                  {(request.decidedByName || request.decidedAt) && (
                    <small>
                      Decided {request.decidedByName ? 'by ' + request.decidedByName : ''}
                      {request.decidedAt ? ' on ' + formatTimestampDate(request.decidedAt) : ''}
                    </small>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="pagination">
        <Button
          variant="secondary"
          disabled={model.requestsPage === 1 || editing}
          onClick={() => model.setRequestsPage((page) => page - 1)}
        >
          Previous requests
        </Button>
        <span>
          Page {model.requestsPage}
          {isHrManager ? ` · ${data.requestsTotal} requests` : ''}
        </span>
        <Button
          variant="secondary"
          disabled={
            editing ||
            (isHrManager ? model.requestsPage * 25 >= data.requestsTotal : requests.length < 25)
          }
          onClick={() => model.setRequestsPage((page) => page + 1)}
        >
          Next requests
        </Button>
      </div>
    </section>
  );
}
