import { useState } from 'react';
import { payrollDeliveryApi } from './api';
import { PayslipBrowser } from './payslip-browser';
import { PaymentPreparations } from './payment-preparations';
import { Button } from '../../shared/ui/button';
import { Form, TextInput } from '../../shared/ui/form-controls';
import { DataTable } from '../../shared/ui/data-table';
import { Pagination } from '../../shared/ui/pagination';
import { RequestState } from '../../shared/ui/request-state';
import { Modal } from '../../shared/ui/modal';
import { Tabs } from '../../shared/ui/tabs';
import { errorMessage } from '../../shared/api/client';

function DeliveryDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const query = payrollDeliveryApi.useDeliveryRunQuery(id);
  const [tab, setTab] = useState('payslips');
  const [busy, setBusy] = useState(false);
  const status =
    query.error && typeof query.error === 'object' && 'status' in query.error
      ? query.error.status
      : undefined;
  const blocked = status === 401 || status === 403 || status === 404;
  const run = blocked ? undefined : query.currentData;
  return (
    <Modal
      title={run ? 'Finalized payroll · ' + run.period : 'Finalized payroll'}
      contextLabel="Payslips and payment preparation"
      onClose={onClose}
      canClose={!busy || !run}
    >
      {query.error && run && (
        <p role="alert">
          Could not refresh the run. The saved view and any entered payment note are retained. Retry
          before creating another action.
        </p>
      )}
      <RequestState
        loading={query.isFetching && !run}
        error={
          !run && query.error ? errorMessage(query.error, 'Could not load finalized payroll.') : ''
        }
        loadingMessage="Loading finalized payroll…"
      >
        {run && (
          <>
            <p>
              Finalized run version {run.version} · {run.employeeCount} employees. Payment
              processing is not connected.
            </p>
            <Tabs
              label="Finalized payroll delivery"
              selected={tab}
              onSelect={setTab}
              tabs={[
                {
                  id: 'payslips',
                  label: 'Finalized payslips',
                  disabled: busy && tab !== 'payslips',
                  content: <PayslipBrowser run={run} />,
                },
                {
                  id: 'payments',
                  label: 'Payment preparation & history',
                  disabled: busy && tab !== 'payments',
                  content: <PaymentPreparations run={run} onBusyChange={setBusy} />,
                },
              ]}
            />
          </>
        )}
      </RequestState>
    </Modal>
  );
}
export function PayrollDelivery() {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [filters, setFilters] = useState({ period, page: 1 });
  const [selected, setSelected] = useState('');
  const query = payrollDeliveryApi.useDeliveryRunsQuery(filters);
  const data = query.error ? undefined : query.currentData;
  return (
    <section className="team-panel" aria-labelledby="payroll-delivery-heading">
      <h2 id="payroll-delivery-heading">Finalized payslips & payment preparation</h2>
      <p>
        Browse approved, finalized employee snapshots. Prepare exact-net manifests and record an
        external full-run payment report. No bank/provider processing is connected.
      </p>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ period, page: 1 });
        }}
      >
        <TextInput
          label="Finalized payroll month"
          type="month"
          min="2000-01"
          max="9998-12"
          required
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        />
        <Button type="submit" disabled={query.isFetching}>
          Show finalized runs
        </Button>
      </Form>
      <Button
        variant="secondary"
        disabled={query.isFetching}
        onClick={() => {
          void query.refetch();
        }}
      >
        Refresh finalized runs
      </Button>
      <RequestState
        loading={query.isFetching && !data}
        error={
          query.error ? errorMessage(query.error, 'Could not load finalized payroll runs.') : ''
        }
        loadingMessage="Loading finalized runs…"
      >
        {data && (
          <>
            <DataTable
              caption="Accessible finalized payroll runs"
              head={
                <tr>
                  <th scope="col">Period</th>
                  <th scope="col">Employees</th>
                  <th scope="col">Status</th>
                  <th scope="col">Finance approver</th>
                  <th scope="col">Action</th>
                </tr>
              }
            >
              {data.items.map((run) => (
                <tr key={run.id}>
                  <td>{run.period}</td>
                  <td>{run.employeeCount}</td>
                  <td>Finalized · version {run.version}</td>
                  <td>{run.financeApproverName ?? 'Not recorded'}</td>
                  <td>
                    <Button onClick={() => setSelected(run.id)}>Open finalized payroll</Button>
                  </td>
                </tr>
              ))}
            </DataTable>
            {!data.items.length && (
              <p>
                No finalized runs are available for this selection. Draft or unapproved payroll
                cannot produce final payslips. Access is limited to HR and this run’s configured
                Finance/Director readers.
              </p>
            )}
            <Pagination
              label="Finalized payroll runs"
              page={filters.page}
              pageSize={data.pageSize}
              total={data.total}
              disabled={query.isFetching}
              onPageChange={(page) => setFilters((value) => ({ ...value, page }))}
              previousLabel="Previous"
              nextLabel="Next"
            />
          </>
        )}
      </RequestState>
      {selected && <DeliveryDetails key={selected} id={selected} onClose={() => setSelected('')} />}
    </section>
  );
}
