import { useState } from 'react';
import { payrollDraftsApi } from './api';
import { DraftPayslip } from './draft-payslip';
import type { PayrollDraft } from './types';
import { Button } from '../../shared/ui/button';
import { DataTable } from '../../shared/ui/data-table';
import { RequestState } from '../../shared/ui/request-state';
import { Pagination } from '../../shared/ui/pagination';
import { errorMessage } from '../../shared/api/client';

export function PayrollDraftHistory({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PayrollDraft | null>(null);
  const query = payrollDraftsApi.usePayrollDraftRevisionsQuery({ id, page });
  const data = query.error ? undefined : query.currentData;
  return (
    <section aria-labelledby="payroll-revisions-heading">
      <h3 id="payroll-revisions-heading">Saved draft revisions</h3>
      <RequestState
        loading={query.isFetching && !data}
        loadingMessage="Loading saved revisions..."
        error={query.error ? errorMessage(query.error, 'Could not load revision history.') : ''}
      >
        {data && (
          <>
            <DataTable
              caption="Payroll draft revision history"
              head={
                <tr>
                  <th scope="col">Revision</th>
                  <th scope="col">Saved by</th>
                  <th scope="col">Saved at</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Action</th>
                </tr>
              }
            >
              {data.items.map((row) => (
                <tr key={row.revisionId}>
                  <td>{row.version}</td>
                  <td>{row.updatedByName}</td>
                  <td>
                    {new Intl.DateTimeFormat('en', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(row.updatedAt))}{' '}
                    UTC
                  </td>
                  <td>{row.reason}</td>
                  <td>
                    <Button variant="secondary" onClick={() => setSelected(row)}>
                      View revision {row.version}
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination
              page={page}
              pageSize={data.pageSize}
              total={data.total}
              disabled={query.isFetching}
              onPageChange={(next) => {
                setSelected(null);
                setPage(next);
              }}
              label="Draft revisions"
              previousLabel="Previous"
              nextLabel="Next"
            />
          </>
        )}
      </RequestState>
      {selected && !query.error && <DraftPayslip draft={selected} />}
    </section>
  );
}
