import { DataTable } from '../../shared/ui/data-table';
import { formatMoney } from '../../shared/format/money';
import { formatBusinessDate } from '../../shared/format/date';
import { earningsFields, deductionFields, type PayrollDraft } from './types';

export function DraftPayslip({ draft }: { draft: PayrollDraft }) {
  return (
    <article className="draft-payslip" aria-labelledby="draft-payslip-heading">
      <p className="eyebrow">DRAFT — NOT APPROVED FOR PAYMENT</p>
      <h3 id="draft-payslip-heading">Draft payslip · {draft.period}</h3>
      <dl className="profile-details">
        <div>
          <dt>Employee</dt>
          <dd>
            {draft.employee.name} ({draft.employee.code})
          </dd>
        </div>
        <div>
          <dt>Period</dt>
          <dd>
            {formatBusinessDate(draft.periodStart)} – {formatBusinessDate(draft.periodEnd)}
          </dd>
        </div>
        <div>
          <dt>Planned payment date</dt>
          <dd>{formatBusinessDate(draft.payDate)}</dd>
        </div>
        <div>
          <dt>Country / currency</dt>
          <dd>India · INR</dd>
        </div>
      </dl>
      <DataTable
        caption="Manually entered earnings"
        head={
          <tr>
            <th scope="col">Earning</th>
            <th scope="col">Amount</th>
          </tr>
        }
      >
        {earningsFields.map(([key, label]) => (
          <tr key={key}>
            <th scope="row">{label}</th>
            <td>{formatMoney(draft.earnings[key], 'INR', 2)}</td>
          </tr>
        ))}
      </DataTable>
      <DataTable
        caption="Manually entered deductions"
        head={
          <tr>
            <th scope="col">Deduction</th>
            <th scope="col">Amount</th>
          </tr>
        }
      >
        {deductionFields.map(([key, label]) => (
          <tr key={key}>
            <th scope="row">{label}</th>
            <td>{formatMoney(draft.deductions[key], 'INR', 2)}</td>
          </tr>
        ))}
      </DataTable>
      <p>
        No totals, net pay, statutory calculations or proration have been calculated. Values are
        manually entered draft amounts; this is not a finalized payslip.
      </p>
      <p>
        Revision {draft.version} · Entered by {draft.updatedByName}
      </p>
      <p>Reason: {draft.reason}</p>
    </article>
  );
}
