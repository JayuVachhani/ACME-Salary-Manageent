import type { Policy } from './api';
const labels: Record<string, string> = {
  pf: 'PF',
  esi: 'ESI',
  tdsMode: 'TDS mode',
  hra: 'HRA',
  employeePercent: 'Employee contribution (%)',
  employerPercent: 'Employer contribution (%)',
  wageCap: 'Wage cap (INR)',
  eligibilityCeiling: 'Eligibility ceiling (INR)',
  eligibilityCeilingBasis: 'Eligibility compared against',
  manualStatutoryTreatment: 'Treatment of manual PF / ESI / PT / TDS',
  employerContributionTreatment: 'Employer contributions',
  fullMonthLedgerRateDate: 'Full-month ledger rate date',
  finalizerRole: 'Authorized finalizer role',
};
const label = (key: string) =>
  labels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (v) => v.toUpperCase());
function Fields({ value }: { value: unknown }) {
  if (Array.isArray(value))
    return (
      <>
        {value.map((item, index) => (
          <div key={index}>
            <Fields value={item} />
          </div>
        ))}
      </>
    );
  if (value && typeof value === 'object')
    return (
      <dl className="policy-setting-list">
        {Object.entries(value)
          .filter(([key]) => !['financeApproverIds', 'directorApproverIds'].includes(key))
          .map(([key, item]) => (
            <div key={key}>
              <dt>{label(key)}</dt>
              <dd>
                {item && typeof item === 'object' ? (
                  <Fields value={item} />
                ) : item === null ? (
                  'None (explicitly configured)'
                ) : typeof item === 'boolean' ? (
                  item ? (
                    'Yes'
                  ) : (
                    'No'
                  )
                ) : (
                  String(item).replaceAll('_', ' ')
                )}
              </dd>
            </div>
          ))}
      </dl>
    );
  return <span>{String(value)}</span>;
}
export function PolicyConfiguration({ policy }: { policy: Policy }) {
  return (
    <section>
      <h3>Saved policy settings</h3>
      <p>Creation reason: {policy.reason}</p>
      <Fields value={policy.config} />
      <h3>Assigned colleagues</h3>
      {policy.assignees.map((person) => (
        <p key={person.role + person.id}>
          <strong>{person.role === 'FINANCE' ? 'Finance' : 'Director'}</strong>: {person.name}
          {person.employeeCode ? ' · ' + person.employeeCode : ''}
          {person.active ? '' : ' — unavailable; update assignments in a new policy version'}
        </p>
      ))}
    </section>
  );
}
