import { Pagination } from '../../../shared/ui/pagination';
import { RequestState, EmptyState } from '../../../shared/ui/request-state';
import { DataTable } from '../../../shared/ui/data-table';
import { Button } from '../../../shared/ui/button';
import type { EmployeesModel } from '../use-employees';
export function EmployeeResults({ model }: { model: EmployeesModel }) {
  const { query, setQuery, setSelectedId, items, total, loading, error } = model;
  return (
    <RequestState loading={loading} error={error} loadingMessage="Loading employees…">
      <p>
        {total} {total === 1 ? 'employee' : 'employees'}. Page {query.page}.
      </p>
      {!items.length ? (
        <EmptyState>No employees match these filters.</EmptyState>
      ) : (
        <DataTable
          caption="Employee results"
          label="Scrollable employee directory"
          head={
            <tr>
              <th>Code / name</th>
              <th>Email</th>
              <th>Assignment</th>
              <th>Joining date</th>
              <th>Actions</th>
            </tr>
          }
        >
          {items.map((row) => (
            <tr key={row.id}>
              <td>
                {row.employee_code}
                <br />
                {row.first_name} {row.last_name}
              </td>
              <td>{row.email}</td>
              <td>
                {row.country_name ?? 'Unassigned'}
                <br />
                {row.department ?? 'Unassigned'}
                <br />
                {row.employment_status ?? 'Unassigned'}
              </td>
              <td>{row.joining_date}</td>
              <td>
                <Button
                  aria-label={`View profile for employee ${row.employee_code}`}
                  onClick={() => setSelectedId(row.id)}
                >
                  View profile
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pagination
        label="Employees"
        page={query.page}
        pageSize={Number(query.pageSize)}
        total={total}
        onPageChange={(page) => setQuery({ ...query, page })}
        previousLabel="Previous employee page"
        nextLabel="Next employee page"
        summary={`Page ${query.page}`}
      />
    </RequestState>
  );
}
