import { Decimal } from 'decimal.js';
const Exact = Decimal.clone({ precision: 60, rounding: Decimal.ROUND_HALF_UP });
export type RoundingMode = 'HALF_UP' | 'FLOOR' | 'CEIL';
const modes = {
  HALF_UP: Decimal.ROUND_HALF_UP,
  FLOOR: Decimal.ROUND_FLOOR,
  CEIL: Decimal.ROUND_CEIL,
} as const;

export function validateSalary(value: string, decimalPlaces: number): string {
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 4)
    throw new Error('INVALID_PRECISION');
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) throw new Error('INVALID_AMOUNT');
  const amount = new Exact(value);
  if (!amount.isPositive() || amount.isZero()) throw new Error('SALARY_MUST_BE_POSITIVE');
  if ((value.split('.')[1]?.length ?? 0) > decimalPlaces)
    throw new Error('EXCESS_COUNTRY_PRECISION');
  if (amount.greaterThan('99999999999999.9999')) throw new Error('AMOUNT_OUT_OF_RANGE');
  return amount.toFixed(decimalPlaces);
}

export function roundCalculated(value: string, decimalPlaces: number, mode: RoundingMode): string {
  if (
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 4 ||
    !(mode in modes)
  )
    throw new Error('INVALID_ROUNDING');
  const amount = new Exact(value);
  if (!amount.isFinite()) throw new Error('INVALID_AMOUNT');
  return amount.toDecimalPlaces(decimalPlaces, modes[mode]).toFixed(decimalPlaces);
}

export interface FxRate {
  id: string;
  base: string;
  quote: string;
  effectiveDate: string;
  revision: number;
  rate: string;
  source: string;
}
export interface ConversionLeg {
  rate: FxRate;
  inverse: boolean;
}

export function businessDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
export function dateOrdinal(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('INVALID_DATE');
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== date)
    throw new Error('INVALID_DATE');
  return ms / 86400000;
}

export function resolveFx(
  rates: readonly FxRate[],
  from: string,
  to: string,
  asOf: string,
  staleDays = 7,
): ConversionLeg[] {
  const targetDay = dateOrdinal(asOf);
  if (!Number.isInteger(staleDays) || staleDays < 0) throw new Error('INVALID_STALENESS');
  if (from === to) return [];
  const lookup = (base: string, quote: string): FxRate | undefined =>
    rates
      .filter((rate) => {
        const age = targetDay - dateOrdinal(rate.effectiveDate);
        return rate.base === base && rate.quote === quote && age >= 0 && age <= staleDays;
      })
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.revision - a.revision)[0];
  const pair = (base: string, quote: string): ConversionLeg[] | undefined => {
    const direct = lookup(base, quote);
    if (direct) return [{ rate: direct, inverse: false }];
    const inverse = lookup(quote, base);
    return inverse ? [{ rate: inverse, inverse: true }] : undefined;
  };
  const direct = pair(from, to);
  if (direct) return direct;
  if (from !== 'USD' && to !== 'USD') {
    const first = pair(from, 'USD');
    const second = pair('USD', to);
    if (first && second) return [...first, ...second];
  }
  throw new Error('FX_RATE_UNAVAILABLE');
}

export function convertExact(amount: string, legs: readonly ConversionLeg[]): string {
  let result = new Exact(amount);
  if (!result.isFinite()) throw new Error('INVALID_AMOUNT');
  for (const leg of legs) {
    const rate = new Exact(leg.rate.rate);
    if (!rate.isFinite() || !rate.isPositive() || rate.isZero()) throw new Error('INVALID_FX_RATE');
    result = leg.inverse ? result.div(rate) : result.mul(rate);
  }
  return result.toFixed();
}

export function sumConverted(amounts: readonly string[], decimals: number): string {
  return roundCalculated(
    amounts.reduce((sum, value) => sum.plus(value), new Exact(0)).toFixed(),
    decimals,
    'HALF_UP',
  );
}
