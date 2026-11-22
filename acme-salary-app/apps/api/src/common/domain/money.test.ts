import { describe, expect, it } from 'vitest';
import {
  businessDate,
  convertExact,
  dateOrdinal,
  resolveFx,
  roundCalculated,
  sumConverted,
  validateSalary,
  type FxRate,
} from './money.js';
const rate = (
  id: string,
  base: string,
  quote: string,
  value: string,
  date = '2026-11-20',
  revision = 1,
): FxRate => ({ id, base, quote, rate: value, effectiveDate: date, revision, source: 'SYNTHETIC' });

describe('exact compensation arithmetic', () => {
  it('rejects excess input precision rather than rounding user input', () => {
    expect(() => validateSalary('10.001', 2)).toThrow('EXCESS_COUNTRY_PRECISION');
    expect(() => validateSalary('10.000', 2)).toThrow('EXCESS_COUNTRY_PRECISION');
    expect(validateSalary('10.5', 2)).toBe('10.50');
  });
  it('rejects nonpositive, exponent, malformed and overflowing amounts', () => {
    for (const input of ['0', '-1', '1e3', ' 12', '01.2', 'Infinity', '100000000000000'])
      expect(() => validateSalary(input, 4)).toThrow();
    expect(validateSalary('99999999999999.9999', 4)).toBe('99999999999999.9999');
  });
  it('rounds all country modes and exact decimal sums correctly', () => {
    expect(roundCalculated('1.005', 2, 'HALF_UP')).toBe('1.01');
    expect(roundCalculated('1.009', 2, 'FLOOR')).toBe('1.00');
    expect(roundCalculated('1.001', 2, 'CEIL')).toBe('1.01');
    expect(sumConverted(['0.005', '0.005'], 2)).toBe('0.01');
    expect(sumConverted(['0.1', '0.2'], 2)).toBe('0.30');
  });
  it('maintains exactness across deterministic generated salaries', () => {
    for (let minor = 1; minor < 1000; minor += 7) {
      const value = `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`;
      expect(validateSalary(value, 2)).toBe(value);
      expect(
        convertExact(
          value,
          resolveFx([rate('r', 'USD', 'INR', '100')], 'USD', 'INR', '2026-11-21'),
        ),
      ).toBe(String(minor));
    }
  });
});
describe('historical FX basis', () => {
  it('uses historical effective dates and latest correction without selecting future rates', () => {
    const rates = [
      rate('old', 'USD', 'INR', '80'),
      rate('corrected', 'USD', 'INR', '81', '2026-11-20', 2),
      rate('future', 'USD', 'INR', '90', '2026-12-01'),
    ];
    const legs = resolveFx(rates, 'USD', 'INR', '2026-11-21');
    expect(legs[0]?.rate.id).toBe('corrected');
    expect(convertExact('10', legs)).toBe('810');
  });
  it('supports inverse and USD triangulation with provenance', () => {
    const rates = [rate('inr', 'USD', 'INR', '80'), rate('eur', 'USD', 'EUR', '0.9')];
    const legs = resolveFx(rates, 'INR', 'EUR', '2026-11-21');
    expect(legs.map((l) => [l.rate.id, l.inverse])).toEqual([
      ['inr', true],
      ['eur', false],
    ]);
    expect(convertExact('800', legs)).toBe('9');
    expect(resolveFx([], 'USD', 'USD', '2026-11-21')).toEqual([]);
  });
  it('checks every leg for staleness and rejects missing/zero rates', () => {
    expect(() =>
      resolveFx([rate('old', 'USD', 'INR', '80', '2026-11-01')], 'USD', 'INR', '2026-11-21'),
    ).toThrow('FX_RATE_UNAVAILABLE');
    expect(() =>
      convertExact('1', [{ rate: rate('bad', 'USD', 'INR', '0'), inverse: true }]),
    ).toThrow('INVALID_FX_RATE');
  });
  it('uses UTC date and rejects invalid calendar dates', () => {
    expect(businessDate(new Date('2026-11-21T02:00:00+05:30'))).toBe('2026-11-20');
    expect(() => dateOrdinal('2026-02-30')).toThrow('INVALID_DATE');
  });
});
