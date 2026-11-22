import type { Account } from '../types';
import { Form, TextInput, Select, Textarea } from '../../../shared/ui/form-controls';
import { Button } from '../../../shared/ui/button';
import { RequestState } from '../../../shared/ui/request-state';
import { ConfirmationDialog } from '../../../shared/ui/confirmation-dialog';
import { errorMessage } from '../../../shared/api/client';
import { useEmployeeLinkEditor } from '../use-employee-link-editor';
export function EmployeeLinkEditor({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const {
    search,
    setSearch,
    query,
    setQuery,
    employee,
    setEmployee,
    reason,
    setReason,
    review,
    setReview,
    resource,
    action,
    confirm,
  } = useEmployeeLinkEditor(account, onClose);
  return (
    <section className="link-editor">
      <h3>Employee record for {account.full_name}</h3>
      <p>
        Choose the record that belongs to this colleague. Linking signs them out and updates salary
        safeguards. You cannot link your own account.
      </p>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery({ search, page: 1 });
        }}
      >
        <TextInput
          label="Find employee by name, code or email"
          value={search}
          maxLength={200}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" disabled={action.busy}>
          Find employee
        </Button>
      </Form>
      <RequestState
        loading={resource.isFetching}
        error={resource.error ? errorMessage(resource.error, 'Could not find employees.') : ''}
        loadingMessage="Finding employees…"
      >
        {resource.currentData && (
          <>
            <Select
              label="Employee record"
              disabled={action.busy}
              value={employee?.id ?? ''}
              onChange={(e) => {
                const row = resource.currentData?.items.find((item) => item.id === e.target.value);
                setEmployee(
                  row
                    ? {
                        id: row.id,
                        name: row.employee_code + ' · ' + row.first_name + ' ' + row.last_name,
                      }
                    : null,
                );
              }}
            >
              <option value="">No employee linked / remove existing link</option>
              {employee && !resource.currentData.items.some((item) => item.id === employee.id) && (
                <option value={employee.id}>{employee.name}</option>
              )}
              {resource.currentData.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.employee_code} · {item.first_name} {item.last_name}
                </option>
              ))}
            </Select>
            <div className="pagination">
              <Button
                variant="secondary"
                disabled={query.page === 1 || action.busy}
                onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
              >
                Previous employees
              </Button>
              <span>Page {query.page}</span>
              <Button
                variant="secondary"
                disabled={query.page * 25 >= resource.currentData.total || action.busy}
                onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
              >
                Next employees
              </Button>
            </div>
          </>
        )}
      </RequestState>
      <Textarea
        label="Reason for changing the link"
        required
        maxLength={1000}
        disabled={action.busy}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="form-actions">
        <Button
          disabled={action.busy || !reason.trim() || (employee?.id ?? null) === account.employee_id}
          onClick={() => setReview(true)}
        >
          Review employee link
        </Button>
        <Button variant="secondary" disabled={action.busy} onClick={onClose}>
          Cancel linking
        </Button>
      </div>
      <ConfirmationDialog
        open={review}
        busy={action.busy}
        title="Change this colleague’s employee link?"
        headingId="employee-link-heading"
        className="team-confirm"
        onCancel={() => setReview(false)}
        onConfirm={confirm}
        confirmLabel="Confirm employee link"
        cancelLabel="Back to selection"
        busyLabel="Updating employee link…"
      >
        <p>
          Account: {account.full_name} ({account.email})
        </p>
        <p>New employee: {employee?.name ?? 'No employee linked'}</p>
        <p>Reason: {reason}</p>
        <p>
          This colleague will be signed out. Access and salary safeguards will use the new link.
        </p>
      </ConfirmationDialog>
    </section>
  );
}
