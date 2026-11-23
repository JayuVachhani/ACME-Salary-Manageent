import { useState } from 'react';
import { useSalaryBulk } from './use-salary-bulk';
import { createBulkSalaryTemplateCsv, exportBulkSalaryResultsCsv } from './csv';
import { Button } from '../../shared/ui/button';
import { TextInput } from '../../shared/ui/form-controls';
import { DataTable } from '../../shared/ui/data-table';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { formatMoney } from '../../shared/format/money';
import { formatBusinessDate } from '../../shared/format/date';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SalaryBulk() {
  const model = useSalaryBulk();
  const [clearOpen, setClearOpen] = useState(false);
  return (
    <section className="team-panel" aria-labelledby="bulk-salary-heading">
      <h2 id="bulk-salary-heading">Update several salaries</h2>
      <p>
        Download the CSV template, enter an exact monthly base salary for each employee, then upload
        and review. Up to 100 employees per batch.
      </p>
      <p className="setup-note">
        Each employee is saved separately. A batch can finish partly; completed rows stay saved.
        Past dates require independent HR approval. This does not calculate or pay payroll.
      </p>
      <Button
        variant="secondary"
        onClick={() => download('salary-revisions-template.csv', createBulkSalaryTemplateCsv())}
      >
        Download CSV template
      </Button>
      {!model.rows.length && (
        <TextInput
          label="Upload salary CSV"
          type="file"
          accept=".csv,text/csv"
          disabled={model.action.busy || model.importing}
          hint="Employee code, amount, currency, effective date and reason. Maximum 256 KB."
          onChange={(event) => {
            void model.importFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      )}
      {model.importing && <p role="status">Reading salary CSV...</p>}
      {model.failure && <p role="alert">{model.failure}</p>}
      {!!model.rows.length && (
        <>
          <div className="form-actions">
            <Button disabled={model.action.busy} onClick={model.prepare}>
              Prepare salary previews
            </Button>
            <Button
              disabled={model.action.busy || !model.ready.length}
              onClick={() => model.setReviewOpen(true)}
            >
              Review & submit {model.ready.length} ready rows
            </Button>
            <Button
              variant="secondary"
              disabled={model.action.busy}
              onClick={() =>
                download('salary-revision-results.csv', exportBulkSalaryResultsCsv(model.rows))
              }
            >
              Download results
            </Button>
            <Button
              variant="secondary"
              disabled={model.action.busy}
              onClick={() => setClearOpen(true)}
            >
              Start another batch
            </Button>
          </div>
          {model.action.busy && (
            <p role="status">Processing employees one at a time. Keep this page open.</p>
          )}
          <p>
            {model.rows.length} imported · {model.ready.length} ready to submit or retry. Rows
            needing attention are excluded from submission.
          </p>
          <DataTable
            caption="Salary revision batch"
            head={
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Current / proposed salary</th>
                <th scope="col">Starts on</th>
                <th scope="col">Reason</th>
                <th scope="col">Result</th>
              </tr>
            }
          >
            {model.rows.map((row) => (
              <tr key={row.rowNumber}>
                <td>
                  <strong>{row.employeeCode}</strong>
                  <br />
                  {row.name}
                </td>
                <td>
                  {row.preview?.before && (
                    <>
                      <span>
                        Before:{' '}
                        {formatMoney(
                          row.preview.before.amount,
                          row.preview.before.currency,
                          row.preview.before.decimalPlaces,
                        )}
                      </span>
                      <br />
                    </>
                  )}
                  <strong>
                    {row.preview
                      ? formatMoney(
                          row.preview.amount,
                          row.preview.currency,
                          row.preview.policy.decimalPlaces,
                        )
                      : `${row.amount} ${row.currency}`}
                  </strong>
                  {row.preview && row.currency !== row.preview.policy.defaultCurrency && (
                    <p>
                      Country equivalent:{' '}
                      {formatMoney(
                        row.preview.convertedAmount,
                        row.preview.policy.defaultCurrency,
                        row.preview.policy.decimalPlaces,
                      )}
                    </p>
                  )}
                </td>
                <td>{formatBusinessDate(row.effectiveFrom)}</td>
                <td>{row.reason}</td>
                <td>
                  <strong>{row.status}</strong>
                  <p>{row.message}</p>
                  {row.preview && (
                    <small>
                      {row.preview.policy.countryName} · {row.preview.policy.roundingMode}
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
      <ConfirmationDialog
        open={model.reviewOpen}
        busy={model.action.busy}
        title="Submit reviewed salary revisions?"
        headingId="bulk-salary-confirm"
        focusHeading
        onCancel={() => model.setReviewOpen(false)}
        onConfirm={model.submit}
        confirmLabel={`Submit ${model.reviewRows.length} rows`}
        busyLabel="Saving..."
        cancelLabel="Keep reviewing"
        confirmDisabled={!model.reviewRows.length || model.reviewChanged}
      >
        <p>
          You are submitting {model.reviewRows.length} rows. All other rows remain unchanged. Each
          row uses its reviewed preview; changed salary or exchange-rate details will stop that row.
        </p>
        {model.reviewChanged && (
          <p role="alert">
            An edit session changed. Close this review, prepare the affected rows again, then review
            before submitting.
          </p>
        )}
        <ul>
          {model.reviewRows.map((row) => (
            <li key={row.rowNumber}>
              <strong>{row.employeeCode}</strong>:{' '}
              {row.preview
                ? formatMoney(
                    row.preview.amount,
                    row.preview.currency,
                    row.preview.policy.decimalPlaces,
                  )
                : ''}{' '}
              from {formatBusinessDate(row.effectiveFrom)} —{' '}
              {row.preview?.requiresApproval
                ? 'request independent approval'
                : 'record with management-review badge'}
              {row.status === 'Result uncertain' ? ' (retry same submission)' : ''}
            </li>
          ))}
        </ul>
        <p>
          Completed rows cannot be undone by canceling this batch. Download results before leaving;
          this CSV and edit sessions are kept only on this page.
        </p>
      </ConfirmationDialog>
      <ConfirmationDialog
        open={clearOpen}
        busy={model.action.busy}
        title="Clear this batch from the page?"
        headingId="bulk-clear-confirm"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          model.clear();
          setClearOpen(false);
        }}
        confirmLabel="Clear batch"
        busyLabel="Clearing..."
        cancelLabel="Keep batch"
      >
        <p>
          Saved salaries stay saved. Download results first. If a result is uncertain, retry the
          same submission before clearing; otherwise check employee history before importing it
          again.
        </p>
      </ConfirmationDialog>
    </section>
  );
}
