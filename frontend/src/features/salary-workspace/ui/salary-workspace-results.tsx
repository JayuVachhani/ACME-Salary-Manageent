import { Button } from '../../../shared/ui/button';
import { DataTable } from '../../../shared/ui/data-table';
import { EmptyState, RequestState } from '../../../shared/ui/request-state';
import { Pagination } from '../../../shared/ui/pagination';
import { formatMoney } from '../../../shared/format/money';
import { formatBusinessDate } from '../../../shared/format/date';
import { formatSalaryStatus } from '../../../shared/format/salary-status';
import type { SalaryWorkspaceModel } from '../use-salary-workspace';

export function SalaryWorkspaceResults({
  model,
  onOpenSalary,
}: {
  model: SalaryWorkspaceModel;
  onOpenSalary: (employeeId: string) => void;
}) {
  return (
    <RequestState
      loading={model.loading}
      error={model.error}
      loadingMessage="Loading employee salaries…"
    >
      <p className="salary-workspace-result-count">
        {model.total} {model.total === 1 ? 'employee' : 'employees'}
        {model.businessDate
          ? ` · salaries as of ${formatBusinessDate(model.businessDate)} (UTC)`
          : ''}
      </p>
      {!model.items.length ? (
        <EmptyState>
          No employees match these filters. Clear the filters to see more employees.
        </EmptyState>
      ) : (
        <DataTable
          caption="Employee salary overview"
          label="Scrollable employee salary list"
          head={
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Country / department</th>
              <th scope="col">Current monthly salary</th>
              <th scope="col">Next scheduled salary</th>
              <th scope="col">Approval requests</th>
              <th scope="col">Actions</th>
            </tr>
          }
        >
          {model.items.map((employee) => (
            <tr key={employee.employeeId}>
              <td>
                <strong>
                  {employee.firstName} {employee.lastName}
                </strong>
                <span className="salary-workspace-cell-note">{employee.employeeCode}</span>
                <span className="salary-workspace-cell-note">{employee.email}</span>
                {employee.employmentStatus === 'INACTIVE' && (
                  <span className="salary-status salary-status--old">Inactive employee</span>
                )}
              </td>
              <td>
                {employee.countryName ?? 'Country not assigned'}
                <span className="salary-workspace-cell-note">
                  {employee.department ?? 'Department not assigned'}
                </span>
                {employee.designation && (
                  <span className="salary-workspace-cell-note">{employee.designation}</span>
                )}
              </td>
              <td>
                {employee.current ? (
                  <>
                    <strong className="salary-workspace-money">
                      {formatMoney(
                        employee.current.amount,
                        employee.current.currency,
                        employee.current.decimalPlaces,
                      )}
                    </strong>
                    <span className="salary-workspace-cell-note">
                      From {formatBusinessDate(employee.current.effectiveFrom)}
                    </span>
                    <span className="salary-status">
                      {formatSalaryStatus(employee.current, model.businessDate)}
                    </span>
                  </>
                ) : (
                  <span className="salary-workspace-muted">No salary is effective yet</span>
                )}
              </td>
              <td>
                {employee.nextScheduled ? (
                  <>
                    <strong className="salary-workspace-money">
                      {formatMoney(
                        employee.nextScheduled.amount,
                        employee.nextScheduled.currency,
                        employee.nextScheduled.decimalPlaces,
                      )}
                    </strong>
                    <span className="salary-workspace-cell-note">
                      Starts {formatBusinessDate(employee.nextScheduled.effectiveFrom)}
                    </span>
                    <span className="salary-status">
                      {formatSalaryStatus(employee.nextScheduled, model.businessDate)}
                    </span>
                  </>
                ) : (
                  <span className="salary-workspace-muted">No scheduled change</span>
                )}
              </td>
              <td>
                {employee.pendingCount > 0 ? (
                  <>
                    <span className="salary-status salary-status--review">
                      {employee.pendingCount} awaiting approval
                    </span>
                    <span className="salary-workspace-cell-note">Not active compensation</span>
                  </>
                ) : (
                  <span className="salary-workspace-muted">No pending requests</span>
                )}
              </td>
              <td>
                <Button
                  aria-label={`Open salary for ${employee.employeeCode}`}
                  onClick={() => onOpenSalary(employee.employeeId)}
                >
                  Open salary
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pagination
        label="Salary workspace"
        page={model.query.page}
        pageSize={Number(model.query.pageSize)}
        total={model.total}
        disabled={model.loading}
        onPageChange={model.setPage}
        previousLabel="Previous employees"
        nextLabel="Next employees"
        summary={`Page ${model.query.page} · ${model.total} employees`}
      />
    </RequestState>
  );
}
