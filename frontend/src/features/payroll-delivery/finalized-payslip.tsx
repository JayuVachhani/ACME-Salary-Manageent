import type { Payslip } from './types';
import { DataTable } from '../../shared/ui/data-table';
import { formatMoney } from '../../shared/format/money';
import { formatBusinessDate } from '../../shared/format/date';
const names: Record<string, string> = {
  basic: 'Basic salary',
  hra: 'HRA',
  allowances: 'Allowances',
  bonuses: 'Bonuses',
  incentives: 'Incentives',
  overtime: 'Overtime',
  pf: 'PF',
  esi: 'ESI',
  professionalTax: 'Professional tax',
  tds: 'TDS',
  unpaidLeave: 'Unpaid leave',
  authorized: 'Authorized deductions',
};
function Components({ caption, values }: { caption: string; values: Record<string, string> }) {
  return (
    <DataTable
      caption={caption}
      head={
        <tr>
          <th scope="col">Component</th>
          <th scope="col">Amount</th>
        </tr>
      }
    >
      {Object.entries(values).map(([key, value]) => (
        <tr key={key}>
          <th scope="row">{names[key] ?? key}</th>
          <td>{formatMoney(value, 'INR', 2)}</td>
        </tr>
      ))}
    </DataTable>
  );
}
export function FinalizedPayslip({ payslip }: { payslip: Payslip }) {
  const s = payslip.snapshot;
  const c = s.calculation;
  return (
    <article className="finalized-payslip">
      <p className="eyebrow">FINALIZED PAYSLIP</p>
      <h3>
        {s.employee.name} · {s.period}
      </h3>
      <p>
        {s.employee.code} · {s.employee.email}
      </p>
      <dl className="profile-details">
        <div>
          <dt>Period</dt>
          <dd>
            {formatBusinessDate(s.periodStart)} – {formatBusinessDate(s.periodEnd)}
          </dd>
        </div>
        <div>
          <dt>Planned payment date</dt>
          <dd>{formatBusinessDate(s.payDate)}</dd>
        </div>
        <div>
          <dt>Country / currency</dt>
          <dd>India · INR</dd>
        </div>
        <div>
          <dt>Finalized</dt>
          <dd>{formatBusinessDate(payslip.run.finalizedAt.slice(0, 10))}</dd>
        </div>
      </dl>
      <Components caption="Finalized earnings" values={s.earnings} />
      <Components caption="Finalized deductions" values={s.deductions} />
      <dl className="profile-details">
        <div>
          <dt>Gross earnings</dt>
          <dd>{formatMoney(s.gross, 'INR', 2)}</dd>
        </div>
        <div>
          <dt>Total deductions</dt>
          <dd>{formatMoney(s.deductionTotal, 'INR', 2)}</dd>
        </div>
        <div>
          <dt>Net payable</dt>
          <dd>
            <strong>{formatMoney(s.net, 'INR', 2)}</strong>
          </dd>
        </div>
      </dl>
      <Components
        caption="Employer contributions — not deducted from net payable"
        values={c.employerContributions}
      />
      <section>
        <h4>Proration and eligibility</h4>
        <p>
          {c.calendarDays} calendar days · {c.employmentDays} employment days · {c.paidDays} paid
          days{c.prorationDays === undefined ? '' : ` · ${c.prorationDays} earnings-proration days`}
          .
        </p>
        <p>
          PF eligible: {c.inputs.pfEligible ? 'Yes' : 'No'} · ESI eligible:{' '}
          {c.inputs.esiEligible ? 'Yes' : 'No'} · State: {c.inputs.stateCode}.
        </p>
        <p>
          Unpaid dates:{' '}
          {c.inputs.unpaidDates.length
            ? c.inputs.unpaidDates.map(formatBusinessDate).join(', ')
            : 'None'}
          . {c.inputs.leavingDate && <>Leaving date: {formatBusinessDate(c.inputs.leavingDate)}.</>}
        </p>
        <DataTable
          caption="Frozen salary segments"
          head={
            <tr>
              <th scope="col">From / to</th>
              <th scope="col">Paid / calendar days</th>
              <th scope="col">Monthly basis</th>
            </tr>
          }
        >
          {c.segments.map((segment, index) => (
            <tr key={`${segment.from}:${segment.to}:${segment.salaryRecordId ?? index}`}>
              <td>
                {formatBusinessDate(segment.from)} – {formatBusinessDate(segment.to)}
              </td>
              <td>
                {segment.paidDays} / {segment.calendarDays}
              </td>
              <td>{formatMoney(segment.monthlyAmount, 'INR', 2)}</td>
            </tr>
          ))}
        </DataTable>
      </section>
      {c.warnings.length > 0 && (
        <section>
          <h4>Notes recorded when calculated</h4>
          <ul>
            {c.warnings.map((note, index) => (
              <li key={index}>
                {/preview only/i.test(note) ? 'At calculation time: ' + note : note}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="setup-note">
        Finalized does not mean paid. This is the saved approved payroll snapshot; ACME has not
        transferred money or connected a bank/provider.
      </p>
      <details>
        <summary>Audit references</summary>
        <p>
          Run {payslip.run.id} · version {payslip.run.version}. Policy {c.policyId} · version{' '}
          {c.policyVersion}. Draft revision {s.source.version}.
        </p>
        <p className="payroll-source-reference">
          Run source: {payslip.run.sourceHash}
          <br />
          Policy: {c.policyHash}
          <br />
          Calculation source: {c.sourceHash}
          <br />
          Draft: {s.source.draftId} / {s.source.revisionId}
        </p>
      </details>
    </article>
  );
}
