import type { SalaryPreview } from '../salary-types';
import { formatBusinessDate } from '../../../shared/format/date';
export function SalaryConversion({ legs }: { legs: SalaryPreview['conversionLegs'] }) {
  if (!legs.length) return <p className="field-hint">No currency conversion was needed.</p>;
  return (
    <details className="salary-conversion">
      <summary>Exchange rate details</summary>
      <ul>
        {legs.map((leg) => (
          <li key={leg.rateId}>
            <strong>
              1 {leg.base} = {leg.rate} {leg.quote}
            </strong>
            {leg.inverse ? ' · applied in the reverse direction' : ''}
            <br />
            Rate date: {formatBusinessDate(leg.effectiveDate)} · revision {leg.revision} · source:{' '}
            {leg.source}
          </li>
        ))}
      </ul>
    </details>
  );
}
