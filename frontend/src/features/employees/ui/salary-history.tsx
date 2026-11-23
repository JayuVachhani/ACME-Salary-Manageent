import type { EmployeeSalaryModel } from '../use-employee-salary';
import { salaryChangeLabel, salaryEntryStatus, savedConversionLegs } from '../salary-display';
import { DataTable } from '../../../shared/ui/data-table';
import { Button } from '../../../shared/ui/button';
import { formatMoney } from '../../../shared/format/money';
import { formatBusinessDate, formatTimestampDate } from '../../../shared/format/date';
import { SalaryConversion } from './salary-conversion';
import { SalaryEntryChanges } from './salary-entry-changes';

export function SalaryHistory({ model }: { model: EmployeeSalaryModel }) {
  const { data, historyView, setHistoryView } = model;
  if (!data) return null;
  const editing = Boolean(model.editor) || model.initialOpen || model.busy;
  const canCorrect = (row: (typeof data.history)[number]) =>
    model.canChangeSalary &&
    !row.isSuperseded &&
    (model.canSubmitBackdated || row.effectiveFrom >= data.businessDate);
  return (
    <section className="salary-history" aria-labelledby="salary-history-heading">
      <div className="salary-section-heading">
        <h3 id="salary-history-heading">Salary history</h3>
        <div className="salary-view-switch" role="group" aria-label="Salary history format">
          <Button
            variant={historyView === 'table' ? 'primary' : 'secondary'}
            aria-pressed={historyView === 'table'}
            onClick={() => setHistoryView('table')}
          >
            Table
          </Button>
          <Button
            variant={historyView === 'timeline' ? 'primary' : 'secondary'}
            aria-pressed={historyView === 'timeline'}
            onClick={() => setHistoryView('timeline')}
          >
            Timeline
          </Button>
        </div>
      </div>
      <p className="field-hint">
        History is permanent. Corrections add a new entry and preserve the original. Entries are
        shown newest first.
      </p>
      {historyView === 'table' ? (
        <DataTable
          caption="Salary history entries"
          head={
            <tr>
              <th scope="col">Starts on</th>
              <th scope="col">Monthly salary</th>
              <th scope="col">Status</th>
              <th scope="col">Recorded by</th>
              <th scope="col">Reason / details</th>
              <th scope="col">Actions</th>
            </tr>
          }
        >
          {data.history.length ? (
            data.history.map((row) => (
              <tr key={row.id} className={row.isSuperseded ? 'salary-row--superseded' : undefined}>
                <td>
                  {formatBusinessDate(row.effectiveFrom)}
                  <br />
                  <small>{salaryChangeLabel(row.changeType)}</small>
                </td>
                <td>{formatMoney(row.amount, row.currency, row.decimalPlaces)}</td>
                <td>
                  <span
                    className={`salary-status ${row.isSuperseded ? 'salary-status--old' : row.approvalStatus === 'WAITING_MANAGEMENT_APPROVAL' ? 'salary-status--review' : 'salary-status--approved'}`}
                  >
                    {salaryEntryStatus(row, data.businessDate)}
                  </span>
                </td>
                <td>
                  {row.createdByName}
                  <br />
                  <small>
                    <time dateTime={row.createdAt} title={row.createdAt}>
                      {formatTimestampDate(row.createdAt)}
                    </time>
                  </small>
                </td>
                <td>
                  {row.reason}
                  {row.correctsId && (
                    <p className="field-hint">Corrects an earlier entry on the same date.</p>
                  )}
                  <SalaryEntryChanges events={row.events} />
                  <SalaryConversion legs={savedConversionLegs(row.conversionMeta)} />
                </td>
                <td>
                  {canCorrect(row) ? (
                    <Button
                      variant="secondary"
                      disabled={editing}
                      aria-label={`Correct typo in salary starting ${formatBusinessDate(row.effectiveFrom)}`}
                      onClick={() => model.begin('correction', row)}
                    >
                      Correct typo
                    </Button>
                  ) : row.isSuperseded ? (
                    <small>Use the latest correction.</small>
                  ) : (
                    <span aria-label="No available action">—</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>No recorded salary entries yet.</td>
            </tr>
          )}
        </DataTable>
      ) : (
        <ol className="salary-timeline" aria-label="Salary history timeline">
          {data.history.map((row) => (
            <li key={row.id}>
              <div className="salary-timeline-date">{formatBusinessDate(row.effectiveFrom)}</div>
              <div className="salary-timeline-entry">
                <h4>
                  {salaryChangeLabel(row.changeType)} ·{' '}
                  {formatMoney(row.amount, row.currency, row.decimalPlaces)}
                </h4>
                <p>
                  <span className="salary-status">{salaryEntryStatus(row, data.businessDate)}</span>
                </p>
                <p>{row.reason}</p>
                <p className="field-hint">
                  Recorded by {row.createdByName} on {formatTimestampDate(row.createdAt)}
                  {row.correctsId ? ' · corrects an earlier entry on the same date.' : ''}
                </p>
                <SalaryEntryChanges events={row.events} expanded />
                <SalaryConversion legs={savedConversionLegs(row.conversionMeta)} />
                {canCorrect(row) && (
                  <Button
                    variant="secondary"
                    disabled={editing}
                    onClick={() => model.begin('correction', row)}
                    aria-label={`Correct typo in salary starting ${formatBusinessDate(row.effectiveFrom)}`}
                  >
                    Correct typo
                  </Button>
                )}
              </div>
            </li>
          ))}
          {!data.history.length && <li>No recorded salary entries yet.</li>}
        </ol>
      )}
      <div className="pagination">
        <Button
          variant="secondary"
          disabled={model.page === 1 || editing}
          onClick={() => model.setPage((page) => page - 1)}
        >
          Previous salary entries
        </Button>
        <span>
          Page {model.page} · {data.total} entries
        </span>
        <Button
          variant="secondary"
          disabled={model.page * 25 >= data.total || editing}
          onClick={() => model.setPage((page) => page + 1)}
        >
          Next salary entries
        </Button>
      </div>
    </section>
  );
}
