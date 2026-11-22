import { useEmployeeSalary } from '../use-employee-salary';
import type { Employee } from '../types';
import { InitialSalaryEditor } from './initial-salary-editor';
import { RequestState } from '../../../shared/ui/request-state';
import { DataTable } from '../../../shared/ui/data-table';
import { Button } from '../../../shared/ui/button';
import { errorMessage } from '../../../shared/api/client';
export function EmployeeSalary({ employee }: { employee: Employee }) {
  const { page, setPage, query, canCreate } = useEmployeeSalary(employee);
  return (
    <section className="salary-summary">
      <h3>Monthly salary</h3>
      <RequestState
        loading={query.isFetching}
        error={query.error ? errorMessage(query.error, 'Could not load salary details.') : ''}
        loadingMessage="Loading salary details…"
      >
        {query.currentData && (
          <>
            {query.currentData.current ? (
              <p className="salary-amount">
                {query.currentData.current.currency} {query.currentData.current.amount}
                <small> per month · effective {query.currentData.current.effectiveFrom}</small>
              </p>
            ) : (
              <p>No approved salary is active today.</p>
            )}
            {query.currentData.pending.map((request) => (
              <p className="setup-note" key={request.id}>
                Waiting for approval: {request.currency} {request.amount} per month, starting{' '}
                {request.effectiveFrom}. This amount is not part of active compensation.
              </p>
            ))}
            <DataTable
              caption="Approved salary history"
              head={
                <tr>
                  <th>Starts on</th>
                  <th>Monthly salary</th>
                  <th>Reason</th>
                </tr>
              }
            >
              {query.currentData.history.length ? (
                query.currentData.history.map((row) => (
                  <tr key={row.id}>
                    <td>{row.effectiveFrom}</td>
                    <td>
                      {row.currency} {row.amount}
                    </td>
                    <td>{row.reason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No approved salary entries yet.</td>
                </tr>
              )}
            </DataTable>
            <div className="pagination">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous salary entries
              </Button>
              <span>
                Page {page} · {query.currentData.total} entries
              </span>
              <Button
                variant="secondary"
                disabled={page * 25 >= query.currentData.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next salary entries
              </Button>
            </div>
            {query.currentData.canResubmitInitial && canCreate && (
              <InitialSalaryEditor employee={employee} />
            )}
          </>
        )}
      </RequestState>
    </section>
  );
}
