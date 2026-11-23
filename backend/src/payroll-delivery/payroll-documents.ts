import type {
  DeliveryRun,
  FinalizedLineSnapshot,
  ManifestEntry,
} from './dto/payroll-delivery.dto.js';

function escape(value: string | number) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
const labels: Record<string, string> = {
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
function componentTable(title: string, values: Record<string, string>) {
  return `<h2>${escape(title)}</h2><table><thead><tr><th>Component</th><th>INR amount</th></tr></thead><tbody>${Object.entries(
    values,
  )
    .map(
      ([key, amount]) =>
        `<tr><th scope="row">${escape(labels[key] ?? key)}</th><td>${escape(amount)}</td></tr>`,
    )
    .join('')}</tbody></table>`;
}
export function renderFinalizedPayslipHtml(
  run: DeliveryRun,
  snapshot: FinalizedLineSnapshot,
): string {
  const s = snapshot;
  const c = s.calculation;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Finalized payslip ${escape(s.period)}</title><style>body{font:15px system-ui,sans-serif;color:#20362e;max-width:850px;margin:2rem auto;padding:1rem}h1{font-size:1.7rem}h2{font-size:1.1rem;margin-top:1.5rem}p{line-height:1.6}table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{padding:.6rem;text-align:left;border-bottom:1px solid #d9e2dc}th{font-weight:600}.status{font-weight:700;color:#235a42}.note{padding:1rem;background:#f3f6f4}.references{font-size:.8rem;overflow-wrap:anywhere}@media print{body{margin:0;max-width:none}tr{break-inside:avoid}.note{border:1px solid #ddd}}</style></head><body>
  <p class="status">FINALIZED PAYSLIP</p><h1>${escape(s.employee.name)} · ${escape(s.period)}</h1><p>${escape(s.employee.code)} · ${escape(s.employee.email)}<br>India · INR</p>
  <p>Period: ${escape(s.periodStart)} – ${escape(s.periodEnd)}<br>Planned payment date: ${escape(s.payDate)}</p>
  ${componentTable('Earnings', s.earnings)}${componentTable('Deductions', s.deductions)}
  <table><tbody><tr><th>Gross earnings</th><td>INR ${escape(s.gross)}</td></tr><tr><th>Total deductions</th><td>INR ${escape(s.deductionTotal)}</td></tr><tr><th>Net payable</th><td><strong>INR ${escape(s.net)}</strong></td></tr></tbody></table>
  ${componentTable('Employer contributions (not deducted from net payable)', c.employerContributions)}
  <h2>Proration and eligibility</h2><p>${escape(c.calendarDays)} calendar days · ${escape(c.employmentDays)} employment days · ${escape(c.paidDays)} paid days${c.prorationDays === undefined ? '' : ' · ' + escape(c.prorationDays) + ' earnings-proration days'}.<br>PF eligibility: ${c.inputs.pfEligible ? 'Yes' : 'No'} · ESI eligibility: ${c.inputs.esiEligible ? 'Yes' : 'No'} · State: ${escape(c.inputs.stateCode)}.<br>Unpaid dates: ${escape(c.inputs.unpaidDates.join(', ') || 'None')}${c.inputs.leavingDate ? '<br>Leaving date: ' + escape(c.inputs.leavingDate) : ''}</p>
  <table><thead><tr><th>Salary segment</th><th>Paid / calendar days</th><th>Monthly basis</th></tr></thead><tbody>${c.segments.map((segment) => `<tr><td>${escape(segment.from)} – ${escape(segment.to)}</td><td>${escape(segment.paidDays)} / ${escape(segment.calendarDays)}</td><td>INR ${escape(segment.monthlyAmount)}</td></tr>`).join('')}</tbody></table>
  ${c.warnings.length ? '<h2>Notes recorded when calculated</h2><ul>' + c.warnings.map((note) => '<li>' + escape(/preview only/i.test(note) ? 'At calculation time: ' + note : note) + '</li>').join('') + '</ul>' : ''}
  <p class="note">This document reproduces the immutable finalized payroll snapshot. Finalized does not mean paid. ACME has not transferred money or connected a bank/payment provider.</p>
  <p class="references">Run ${escape(run.id)} · version ${escape(run.version)} · finalized ${escape(run.finalizedAt)}<br>Policy ${escape(c.policyId)} · version ${escape(c.policyVersion)} · ${escape(c.policyHash)}<br>Draft ${escape(s.source.draftId)} · revision ${escape(s.source.version)} (${escape(s.source.revisionId)})<br>Run source: ${escape(run.sourceHash)} · Calculation source: ${escape(c.sourceHash)}</p>
  </body></html>`;
}
function csvCell(value: string) {
  const firstContent = [...value].find(
    (character) => character.charCodeAt(0) > 31 && !/\s/u.test(character),
  );
  const safe =
    /^[\t\r\n]/.test(value) || (firstContent !== undefined && '=+-@'.includes(firstContent))
      ? "'" + value
      : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function renderPreparationCsv(
  preparationId: string,
  run: DeliveryRun,
  entries: readonly ManifestEntry[],
): string {
  const rows = [
    [
      'Preparation ID',
      'Finalized run ID',
      'Period',
      'Employee ID',
      'Employee code',
      'Currency',
      'Exact net amount',
      'Run source hash',
    ],
    ...entries.map((entry) => [
      preparationId,
      run.id,
      run.period,
      entry.employeeId,
      entry.employeeCode,
      'INR',
      entry.netAmount,
      run.sourceHash,
    ]),
  ];
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
