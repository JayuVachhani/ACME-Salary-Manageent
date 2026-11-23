import type { SalaryPreview } from './salary-types';
export { formatSalaryStatus as salaryEntryStatus } from '../../shared/format/salary-status';

export function salaryChangeLabel(changeType: string | null): string {
  const labels: Record<string, string> = {
    INITIAL: 'Initial salary',
    REVISION: 'Salary revision',
    TYPO_CORRECTION: 'Typo correction',
    COUNTRY_TRANSFER: 'Country transfer',
    CURRENCY_CHANGE: 'Currency change',
  };
  return changeType ? (labels[changeType] ?? 'Salary entry') : 'Salary entry';
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
/** Project only recognized saved provenance fields; never render an arbitrary JSON payload. */
export function savedConversionLegs(value: unknown): SalaryPreview['conversionLegs'] {
  if (!isRecord(value) || !Array.isArray(value.path)) return [];
  return value.path.flatMap((item) => {
    if (!isRecord(item) || !isRecord(item.rate)) return [];
    const rate = item.rate;
    if (
      typeof rate.id !== 'string' ||
      typeof rate.base !== 'string' ||
      typeof rate.quote !== 'string' ||
      typeof rate.rate !== 'string' ||
      typeof rate.effectiveDate !== 'string' ||
      typeof rate.revision !== 'number' ||
      typeof rate.source !== 'string' ||
      typeof item.inverse !== 'boolean'
    )
      return [];
    return [
      {
        rateId: rate.id,
        base: rate.base,
        quote: rate.quote,
        rate: rate.rate,
        effectiveDate: rate.effectiveDate,
        revision: rate.revision,
        inverse: item.inverse,
        source: rate.source,
      },
    ];
  });
}
