import { useEmployeeSalary } from '../use-employee-salary';
import type { Employee } from '../types';
import { InitialSalaryEditor } from './initial-salary-editor';
import { SalaryEditor } from './salary-editor';
import { SalaryHistory } from './salary-history';
import { SalaryRequests } from './salary-requests';
import { salaryEntryStatus } from '../salary-display';
import { RequestState } from '../../../shared/ui/request-state';
import { Button } from '../../../shared/ui/button';
import { errorMessage } from '../../../shared/api/client';
import { formatMoney } from '../../../shared/format/money';
import { formatBusinessDate } from '../../../shared/format/date';

export function EmployeeSalary({
  employee,
  onEditingChange,
}: {
  employee: Employee;
  onEditingChange: (editing: boolean) => void;
}) {
  const model = useEmployeeSalary(employee, onEditingChange);
  const { data, editor } = model;
  const editing = Boolean(editor) || model.initialOpen || model.busy;
  const scheduled = data
    ? data.history.filter((row) => !row.isSuperseded && row.effectiveFrom > data.businessDate)
    : [];
  return (
    <section className="salary-summary" aria-labelledby="monthly-salary-heading">
      <div className="salary-section-heading">
        <h3 id="monthly-salary-heading">Monthly salary</h3>
        <Button
          variant="secondary"
          disabled={editing || model.query.isFetching}
          onClick={() => {
            void model.query.refetch();
          }}
        >
          Refresh salary details
        </Button>
      </div>
      {editor && (
        <SalaryEditor
          employee={employee}
          session={editor}
          leaseFailure={model.leaseFailure}
          writeAllowed={model.canChangeSalary}
          replaceLease={model.replaceLease}
          onFinish={model.finish}
        />
      )}
      {model.initialOpen && (
        <InitialSalaryEditor employee={employee} onClose={model.finish} onSaved={model.finish} />
      )}
      <RequestState
        loading={model.query.isFetching && !data}
        error={
          model.query.error ? errorMessage(model.query.error, 'Could not load salary details.') : ''
        }
        loadingMessage="Loading salary details..."
      >
        {data && (
          <>
            <div className="salary-current-card">
              <p className="eyebrow">CURRENT MONTHLY BASE SALARY</p>
              <p className="field-hint">As of {formatBusinessDate(data.businessDate)} (UTC)</p>
              {data.current ? (
                <>
                  <p className="salary-amount">
                    {formatMoney(
                      data.current.amount,
                      data.current.currency,
                      data.current.decimalPlaces,
                    )}
                    <small> per month</small>
                  </p>
                  <p>Effective {formatBusinessDate(data.current.effectiveFrom)}</p>
                  <span className="salary-status">
                    {salaryEntryStatus(data.current, data.businessDate)}
                  </span>
                </>
              ) : (
                <p>No salary is effective on {formatBusinessDate(data.businessDate)}.</p>
              )}
              <p className="field-hint">
                Recorded salaries count from their start date. Requests awaiting approval do not.
              </p>
              {!editing && model.canChangeSalary && (
                <div className="form-actions">
                  <Button onClick={() => model.begin('revision')}>Add salary revision</Button>
                  {data.current &&
                    !data.current.isSuperseded &&
                    (model.canSubmitBackdated ||
                      data.current.effectiveFrom >= data.businessDate) && (
                      <Button
                        variant="secondary"
                        onClick={() => model.begin('correction', data.current)}
                      >
                        Correct a typo in the current salary
                      </Button>
                    )}
                </div>
              )}
              {!model.canChangeSalary && data.salaryChangeUnavailableReason && (
                <p className="setup-note">{data.salaryChangeUnavailableReason}</p>
              )}
              {!editing && data.canResubmitInitial && model.canCreate && (
                <Button onClick={model.beginInitial}>Submit a corrected initial salary</Button>
              )}
            </div>
            {!!scheduled.length && (
              <section className="salary-scheduled" aria-labelledby="scheduled-salary-heading">
                <h4 id="scheduled-salary-heading">Scheduled entries on this history page</h4>
                <ul>
                  {scheduled.map((row) => (
                    <li key={row.id}>
                      <strong>{formatMoney(row.amount, row.currency, row.decimalPlaces)}</strong>{' '}
                      per month from {formatBusinessDate(row.effectiveFrom)}
                      <span className="salary-status">
                        {salaryEntryStatus(row, data.businessDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <SalaryHistory model={model} />
            <SalaryRequests model={model} />
          </>
        )}
      </RequestState>
    </section>
  );
}
