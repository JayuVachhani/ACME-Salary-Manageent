import type { SalaryEntry } from '../salary-types';
import { salaryChangeLabel } from '../salary-display';
import { MoneyChange } from '../../../shared/ui/money-change';
export function SalaryEntryChanges({
  events,
  expanded = false,
}: {
  events: SalaryEntry['events'];
  expanded?: boolean;
}) {
  if (!events?.length) return null;
  return (
    <details className="salary-entry-changes" open={expanded}>
      <summary>View recorded changes</summary>
      {events.map((event, index) => (
        <section key={event.type + '-' + index}>
          <h5>{salaryChangeLabel(event.type)}</h5>
          <MoneyChange before={event.before} after={event.after} />
        </section>
      ))}
    </details>
  );
}
