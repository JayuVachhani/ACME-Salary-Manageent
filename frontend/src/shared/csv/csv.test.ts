import { describe, it, expect } from 'vitest';
import { readCsvRecords, writeCsv } from './csv';
describe('spreadsheet-safe CSV exports', () => {
  it('neutralizes formulas after whitespace and control prefixes while preserving quoted text', () => {
    const values = [
      '=HYPERLINK("https://example.invalid")',
      ' \u0000\u001f+SUM(1,2)',
      '\tplain',
      '\rplain',
      '\nplain',
      '@SUM(A1)',
      '-123',
      '+123',
      'normal, "quoted" text',
      'INR 100.00',
    ];
    const exported = readCsvRecords(writeCsv([values]))[0]!.fields;
    expect(exported).toEqual(values.map((value, index) => (index < 8 ? "'" + value : value)));
  });
  it('keeps exact decimal amounts as text without financial rounding', () => {
    expect(readCsvRecords(writeCsv([['99999999999999.99', '0.01', '0.00']]))[0]!.fields).toEqual([
      '99999999999999.99',
      '0.01',
      '0.00',
    ]);
  });
});
