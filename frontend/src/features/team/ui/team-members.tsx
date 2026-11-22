import { formatTimestampDate } from '../../../shared/format/date';
import { OffsetPagination } from '../../../shared/ui/pagination';
import { DataTable } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/request-state';
import { Button } from '../../../shared/ui/button';
import type { TeamModel } from '../use-team';
import { EmployeeLinkEditor } from './employee-link-editor';
export function TeamMembers({ model }: { model: TeamModel }) {
  const { linking, setLinking } = model;
  const { userId, items, total, offset, setOffset, busy, edit, reviewReinvite, reviewRemove } =
    model;
  return (
    <>
      <DataTable
        caption="Team members"
        head={
          <tr>
            <th>Name and email</th>
            <th>Role and permissions</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        }
      >
        {items.map((account) => (
          <tr key={account.id}>
            <td>
              {account.full_name}
              <br />
              {account.email}
              {account.id === userId ? ' (you)' : ''}
            </td>
            <td>
              {account.is_hr_manager
                ? 'HR Manager — all permissions'
                : account.permissions.join(', ') || 'No permissions'}
            </td>
            <td>
              {account.status}
              <p>{account.employee_id ? 'Employee linked' : 'Employee not linked'}</p>
              {account.status === 'INVITED' && account.invite_expires_at && (
                <>
                  <br />
                  Expires {formatTimestampDate(account.invite_expires_at)}
                </>
              )}
            </td>
            <td>
              {account.id !== userId && (
                <Button disabled={busy} onClick={() => setLinking(account)}>
                  Link employee record
                </Button>
              )}
              <Button
                disabled={busy}
                aria-label={`Edit ${account.email}`}
                onClick={() => edit(account)}
              >
                Edit
              </Button>
              {account.status === 'INVITED' && (
                <Button
                  disabled={busy}
                  aria-label={`Reinvite ${account.email}`}
                  onClick={() => reviewReinvite(account)}
                >
                  Reinvite
                </Button>
              )}
              <Button
                disabled={busy}
                aria-label={`Remove ${account.email}`}
                onClick={() => reviewRemove(account)}
              >
                Remove access
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      {linking && (
        <EmployeeLinkEditor key={linking.id} account={linking} onClose={() => setLinking(null)} />
      )}
      {!items.length && <EmptyState>No team members on this page.</EmptyState>}
      <OffsetPagination
        label="Team"
        offset={offset}
        pageSize={20}
        total={total}
        disabled={busy}
        onOffsetChange={setOffset}
        previousLabel="Previous page"
        nextLabel="Next page"
        summary={`${total} members`}
      />
    </>
  );
}
