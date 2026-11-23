import { useState } from 'react';
import { payrollDraftsApi } from './api';
import { PayrollDraftEditor } from './payroll-draft-editor';
import { DraftPayslip } from './draft-payslip';
import { PayrollDraftHistory } from './payroll-draft-history';
import { PayrollInputImport } from './payroll-input-import';
import type { PayrollEmployee, PayrollDraft } from './types';
import { Button } from '../../shared/ui/button';
import { Form, TextInput } from '../../shared/ui/form-controls';
import { Modal } from '../../shared/ui/modal';
import { DataTable } from '../../shared/ui/data-table';
import { RequestState } from '../../shared/ui/request-state';
import { Pagination } from '../../shared/ui/pagination';
import { Tabs } from '../../shared/ui/tabs';
import { errorMessage } from '../../shared/api/client';

function CreateDraft({
  period,
  onClose,
  onSaved,
}: {
  period: string;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [employee, setEmployee] = useState<PayrollEmployee | null>(null);
  const result = payrollDraftsApi.usePayrollEmployeesQuery(query, { skip: !query });
  return (
    <Modal
      title="New payroll draft"
      subtitle={period + ' · India / INR'}
      contextLabel="Draft payroll"
      canClose={!employee}
      onClose={onClose}
    >
      {employee ? (
        <>
          <p>
            <strong>
              {employee.first_name} {employee.last_name}
            </strong>{' '}
            · {employee.employee_code}
          </p>
          <PayrollDraftEditor
            employeeId={employee.id}
            period={period}
            onCancel={() => setEmployee(null)}
            onSaved={(draft) => onSaved(draft.id)}
          />
        </>
      ) : (
        <>
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
            }}
          >
            <TextInput
              label="Find employee by code or name"
              required
              maxLength={100}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type="submit">Find employee</Button>
          </Form>
          {query && (
            <RequestState
              loading={result.isFetching}
              loadingMessage="Finding employees..."
              error={result.error ? errorMessage(result.error, 'Could not find employees.') : ''}
            >
              {result.currentData && !result.error && (
                <>
                  <p>Showing up to 25 matches. Use an employee code to narrow the search.</p>
                  <DataTable
                    caption="Choose payroll employee"
                    head={
                      <tr>
                        <th scope="col">Employee</th>
                        <th scope="col">Action</th>
                      </tr>
                    }
                  >
                    {result.currentData.items.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.employee_code} · {row.first_name} {row.last_name}
                        </td>
                        <td>
                          <Button variant="secondary" onClick={() => setEmployee(row)}>
                            Enter draft
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                  {!result.currentData.items.length && <p>No matching employees.</p>}
                </>
              )}
            </RequestState>
          )}
        </>
      )}
    </Modal>
  );
}
function ViewDraft({ id, onClose }: { id: string; onClose: () => void }) {
  const query = payrollDraftsApi.usePayrollDraftQuery(id);
  const [editing, setEditing] = useState<PayrollDraft | null>(null);
  const [tab, setTab] = useState('payslip');
  const draft = query.error ? undefined : query.currentData;
  return (
    <Modal
      title="Draft payslip"
      contextLabel="Not approved for payment"
      onClose={onClose}
      canClose={!editing}
    >
      {editing ? (
        <PayrollDraftEditor
          key={editing.version}
          employeeId={editing.employeeId}
          period={editing.period}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void query.refetch();
          }}
        />
      ) : (
        <RequestState
          loading={query.isFetching && !draft}
          loadingMessage="Loading payroll draft..."
          error={query.error ? errorMessage(query.error, 'Could not load payroll draft.') : ''}
        >
          {draft && (
            <>
              <div className="form-actions payroll-draft-actions">
                <Button
                  variant="secondary"
                  disabled={query.isFetching}
                  onClick={() => {
                    void query.refetch();
                  }}
                >
                  Refresh saved draft
                </Button>
                <Button onClick={() => setEditing(draft)} disabled={query.isFetching}>
                  Revise draft
                </Button>
                {tab === 'payslip' && (
                  <Button variant="secondary" onClick={() => window.print()}>
                    Print draft payslip
                  </Button>
                )}
              </div>
              <Tabs
                label="Payroll draft details"
                selected={tab}
                onSelect={setTab}
                tabs={[
                  {
                    id: 'payslip',
                    label: 'Draft payslip',
                    content: <DraftPayslip draft={draft} />,
                  },
                  {
                    id: 'history',
                    label: 'Revision history',
                    content: <PayrollDraftHistory id={id} />,
                  },
                ]}
              />
            </>
          )}
        </RequestState>
      )}
    </Modal>
  );
}
export function PayrollDrafts() {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ period, search: '', page: 1 });
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState('');
  const query = payrollDraftsApi.usePayrollDraftsQuery(filters);
  const data = query.error ? undefined : query.currentData;
  return (
    <section className="team-panel" aria-labelledby="payroll-drafts-heading">
      <h2 id="payroll-drafts-heading">Monthly payroll drafts</h2>
      <p>
        Prepare manually entered earnings and deductions, then view a draft payslip. Periods run
        from the first to last calendar day; the planned payment date is the following month’s 7th.
      </p>
      <p className="setup-note">
        Drafts only. Automatic calculations, statutory deductions, proration, approval, finalization
        and payment processing are unavailable.
      </p>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ period, search: search.trim(), page: 1 });
        }}
      >
        <div className="form-grid">
          <TextInput
            label="Payroll month"
            type="month"
            min="2000-01"
            max="9998-12"
            required
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
          <TextInput
            label="Search saved drafts by employee"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={query.isFetching}>
          Show drafts
        </Button>
      </Form>
      <div className="form-actions">
        <Button onClick={() => setCreating(true)}>New draft for {filters.period}</Button>
        <Button variant="secondary" onClick={() => setImporting(true)}>
          Import monthly inputs
        </Button>
        <Button
          variant="secondary"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          Refresh drafts
        </Button>
      </div>
      <RequestState
        loading={query.isFetching && !data}
        loadingMessage="Loading payroll drafts..."
        error={query.error ? errorMessage(query.error, 'Could not load payroll drafts.') : ''}
      >
        {data && (
          <>
            <DataTable
              caption="Saved monthly payroll drafts"
              head={
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Period</th>
                  <th scope="col">Planned payment</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              }
            >
              {data.items.map((draft) => (
                <tr key={draft.id}>
                  <td>
                    {draft.employee.code} · {draft.employee.name}
                  </td>
                  <td>{draft.period}</td>
                  <td>{draft.payDate}</td>
                  <td>Draft · revision {draft.version}</td>
                  <td>
                    <Button variant="secondary" onClick={() => setSelected(draft.id)}>
                      View draft payslip
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
            {!data.items.length && (
              <p>
                No payroll drafts for this selection. Create a draft to enter manual components.
              </p>
            )}
            <Pagination
              page={filters.page}
              pageSize={data.pageSize}
              total={data.total}
              disabled={query.isFetching}
              onPageChange={(page) => setFilters({ ...filters, page })}
              label="Payroll drafts"
              previousLabel="Previous"
              nextLabel="Next"
            />
          </>
        )}
      </RequestState>
      {importing && (
        <PayrollInputImport
          key={filters.period}
          period={filters.period}
          onClose={() => setImporting(false)}
        />
      )}
      {creating && (
        <CreateDraft
          key={filters.period}
          period={filters.period}
          onClose={() => setCreating(false)}
          onSaved={(id) => {
            setCreating(false);
            setSelected(id);
          }}
        />
      )}
      {selected && <ViewDraft key={selected} id={selected} onClose={() => setSelected('')} />}
    </section>
  );
}
