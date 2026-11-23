import type { CalculationPreview } from '../types';
import { componentLabels } from '../types';
import { DataTable } from '../../../shared/ui/data-table';
import { formatMoney } from '../../../shared/format/money';
import { formatBusinessDate } from '../../../shared/format/date';
export function CalculationResult({ preview }: { preview: CalculationPreview }) {
  return (
    <section aria-labelledby="calculation-result">
      <h3 id="calculation-result">Calculated payroll preview</h3>
      <p className="setup-note">
        Preview only. These values are not saved payroll, finalized payslips or a payment
        instruction. The approved policy replaces raw manual-draft PF, ESI, professional tax and TDS
        values.
      </p>
      <dl className="form-grid">
        <div>
          <dt>Gross pay</dt>
          <dd>{formatMoney(preview.gross, 'INR', 2)}</dd>
        </div>
        <div>
          <dt>Total deductions</dt>
          <dd>{formatMoney(preview.deductionTotal, 'INR', 2)}</dd>
        </div>
        <div>
          <dt>Net pay</dt>
          <dd>{formatMoney(preview.net, 'INR', 2)}</dd>
        </div>
      </dl>
      <DataTable
        caption="Calculated earnings and deductions"
        head={
          <tr>
            <th scope="col">Component</th>
            <th scope="col">Type</th>
            <th scope="col">Amount</th>
          </tr>
        }
      >
        {Object.entries(preview.earnings).map(([key, value]) => (
          <tr key={'earning-' + key}>
            <td>{componentLabels[key] ?? key}</td>
            <td>Earning</td>
            <td>{formatMoney(value, 'INR', 2)}</td>
          </tr>
        ))}
        {Object.entries(preview.deductions).map(([key, value]) => (
          <tr key={'deduction-' + key}>
            <td>{componentLabels[key] ?? key}</td>
            <td>Deduction</td>
            <td>{formatMoney(value, 'INR', 2)}</td>
          </tr>
        ))}
      </DataTable>
      <h4>Employer contributions</h4>
      <p>
        Employer PF: {formatMoney(preview.employerContributions.pf, 'INR', 2)} · Employer ESI:{' '}
        {formatMoney(preview.employerContributions.esi, 'INR', 2)}. These are separate from employee
        net pay.
      </p>
      <h4>Days and salary changes</h4>
      <p>
        {formatBusinessDate(preview.periodStart)} to {formatBusinessDate(preview.periodEnd)} ·{' '}
        {preview.calendarDays} calendar days · {preview.employmentDays} employment days ·{' '}
        {preview.paidDays} paid days · {preview.prorationDays} days used for proration.
      </p>
      <DataTable
        caption="Salary segments used in this preview"
        head={
          <tr>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col">Monthly salary basis</th>
            <th scope="col">Calendar / paid days</th>
            <th scope="col">Source</th>
          </tr>
        }
      >
        {preview.segments.map((segment, index) => (
          <tr key={index}>
            <td>{formatBusinessDate(segment.from)}</td>
            <td>{formatBusinessDate(segment.to)}</td>
            <td>{formatMoney(segment.monthlyAmount, segment.currency, 2)}</td>
            <td>
              {segment.calendarDays} / {segment.paidDays}
            </td>
            <td>
              {segment.salaryRecordId ? (
                <details>
                  <summary>
                    {segment.correctsId ? 'Corrected salary record' : 'Salary ledger record'}
                  </summary>
                  <p>{segment.salaryRecordId}</p>
                  {segment.correctsId && <p>Corrects {segment.correctsId}</p>}
                </details>
              ) : (
                'Approved manual-draft basis'
              )}
            </td>
          </tr>
        ))}
      </DataTable>
      <p>
        Source versions: policy {preview.policyVersion} · manual draft {preview.manualDraftVersion}{' '}
        · employee {preview.employeeVersion}. Later changes require another preview; payroll runs
        recalculate authoritatively.
      </p>
      {!!preview.warnings.length && (
        <aside aria-label="Calculation notes">
          <h4>Calculation notes</h4>
          <ul>
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}
