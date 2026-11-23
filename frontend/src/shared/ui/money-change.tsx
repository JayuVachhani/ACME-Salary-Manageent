import type { SalaryMoneySnapshot } from '../api/salary-contract';
import { formatMoney } from '../format/money';
import { formatBusinessDate } from '../format/date';
export function MoneyChange({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: {
  before: SalaryMoneySnapshot | null;
  after: SalaryMoneySnapshot;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  return (
    <dl className="money-change">
      <div>
        <dt>{beforeLabel}</dt>
        <dd>
          {before ? (
            <>
              <strong>{formatMoney(before.amount, before.currency, before.decimalPlaces)}</strong>
              <span>Starts {formatBusinessDate(before.effectiveFrom)}</span>
              <span>Country / region: {before.countryCode}</span>
              <span>Default currency: {before.defaultCurrency}</span>
            </>
          ) : (
            'No earlier salary applies'
          )}
        </dd>
      </div>
      <div>
        <dt>{afterLabel}</dt>
        <dd>
          <strong>{formatMoney(after.amount, after.currency, after.decimalPlaces)}</strong>
          <span>Starts {formatBusinessDate(after.effectiveFrom)}</span>
          <span>Country / region: {after.countryCode}</span>
          <span>Default currency: {after.defaultCurrency}</span>
        </dd>
      </div>
    </dl>
  );
}
