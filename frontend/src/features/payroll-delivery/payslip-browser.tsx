import { useState } from 'react';
import { payrollDeliveryApi } from './api';
import { FinalizedPayslip } from './finalized-payslip';
import { saveDocument } from './document-download';
import type { DeliveryRun } from './types';
import { Modal } from '../../shared/ui/modal';
import { Button } from '../../shared/ui/button';
import { DataTable } from '../../shared/ui/data-table';
import { Pagination } from '../../shared/ui/pagination';
import { RequestState } from '../../shared/ui/request-state';
import { formatMoney } from '../../shared/format/money';
import { errorMessage } from '../../shared/api/client';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';

function PayslipViewer({
  run,
  employeeId,
  onClose,
}: {
  run: DeliveryRun;
  employeeId: string;
  onClose: () => void;
}) {
  const query = payrollDeliveryApi.useFinalizedPayslipQuery({ id: run.id, employeeId });
  const data = query.error ? undefined : query.currentData;
  const [download] = payrollDeliveryApi.useDownloadPayslipMutation();
  const [commandId, setCommandId] = useState(() => crypto.randomUUID());
  const action = useAction();
  function downloadHtml() {
    void action.perform(async (signal) => {
      const file = await runRequest(
        download({ id: run.id, employeeId, commandId, confirmed: true }),
        signal,
      );
      if (signal.aborted) return;
      saveDocument(file);
      setCommandId(crypto.randomUUID());
      action.announce('Finalized payslip downloaded.');
    });
  }
  return (
    <Modal
      title="Finalized payslip"
      contextLabel="Approved snapshot"
      onClose={onClose}
      canClose={!action.busy}
    >
      <RequestState
        loading={query.isFetching && !data}
        error={query.error ? errorMessage(query.error, 'Could not load finalized payslip.') : ''}
        loadingMessage="Loading finalized payslip…"
      >
        {data && (
          <>
            <div className="form-actions payroll-delivery-actions">
              <Button disabled={!data.run.canExport || action.busy} onClick={downloadHtml}>
                Download printable HTML
              </Button>
              <Button
                variant="secondary"
                disabled={!data.run.canExport || action.busy}
                onClick={() => window.print()}
              >
                Print finalized payslip
              </Button>
            </div>
            {!data.run.canExport && (
              <p>Document download and app printing require export permission.</p>
            )}
            <FinalizedPayslip payslip={data} />
          </>
        )}
      </RequestState>
    </Modal>
  );
}
export function PayslipBrowser({ run }: { run: DeliveryRun }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const query = payrollDeliveryApi.useFinalizedPayslipsQuery({ id: run.id, page });
  const data = query.error ? undefined : query.currentData;
  return (
    <section>
      <h3>Finalized employee payslips</h3>
      <p>
        Only this run’s finalized generation is shown. Draft and unapproved calculations cannot be
        downloaded here.
      </p>
      <RequestState
        loading={query.isFetching && !data}
        error={query.error ? errorMessage(query.error, 'Could not load finalized payslips.') : ''}
        loadingMessage="Loading finalized payslips…"
      >
        {data && (
          <>
            <DataTable
              caption="Finalized payslips"
              head={
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Net payable</th>
                  <th scope="col">Action</th>
                </tr>
              }
            >
              {data.items.map((row) => (
                <tr key={row.snapshot.employee.id}>
                  <td>
                    {row.snapshot.employee.code} · {row.snapshot.employee.name}
                  </td>
                  <td>{formatMoney(row.snapshot.net, 'INR', 2)}</td>
                  <td>
                    <Button
                      variant="secondary"
                      onClick={() => setSelected(row.snapshot.employee.id)}
                    >
                      View finalized payslip
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination
              label="Finalized payslips"
              page={page}
              pageSize={data.pageSize}
              total={data.total}
              disabled={query.isFetching}
              previousLabel="Previous"
              nextLabel="Next"
              onPageChange={setPage}
            />
            {!data.items.length && <p>No employee snapshots in this finalized run.</p>}
          </>
        )}
      </RequestState>
      {selected && (
        <PayslipViewer run={run} employeeId={selected} onClose={() => setSelected('')} />
      )}
    </section>
  );
}
