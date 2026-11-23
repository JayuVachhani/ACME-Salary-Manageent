import { readCsvRecords, writeCsv } from '../../shared/csv/csv';
export const MAX_BULK_ROWS = 100;
export const MAX_BULK_CSV_BYTES = 256 * 1024;
export const BULK_CSV_HEADERS = [
  'employeeCode',
  'amount',
  'currency',
  'effectiveFrom',
  'reason',
] as const;

export type BulkDraftRow = {
  rowNumber: number;
  employeeCode: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  reason: string;
};
export type BulkCsvResultRow = {
  rowNumber?: number;
  employeeCode: string;
  amount?: string;
  currency?: string;
  effectiveFrom?: string;
  reason?: string;
  status: string;
  message: string;
};
export function parseBulkSalaryCsv(text: string): BulkDraftRow[] {
  if (new TextEncoder().encode(text).byteLength > MAX_BULK_CSV_BYTES)
    throw new Error('CSV must be 256 KB or smaller.');
  const records = readCsvRecords(text);
  const header = records.shift()?.fields.map((value) => value.trim());
  if (
    !header ||
    header.length !== BULK_CSV_HEADERS.length ||
    new Set(header).size !== header.length ||
    !BULK_CSV_HEADERS.every((name) => header.includes(name))
  )
    throw new Error(`CSV must have exactly these headers: ${BULK_CSV_HEADERS.join(', ')}.`);
  if (!records.length) throw new Error('CSV has no salary rows.');
  if (records.length > MAX_BULK_ROWS)
    throw new Error(`Import at most ${MAX_BULK_ROWS} employees at a time.`);
  const seen = new Set<string>();
  return records.map((record) => {
    const fail = (message: string): never => {
      throw new Error(`CSV line ${record.line}: ${message}`);
    };
    if (record.fields.length !== header.length)
      fail(`expected ${header.length} fields, found ${record.fields.length}.`);
    const read = (name: (typeof BULK_CSV_HEADERS)[number]) =>
      record.fields[header.indexOf(name)]!.trim();
    const employeeCode = read('employeeCode').toUpperCase();
    const amount = read('amount');
    const currency = read('currency');
    const effectiveFrom = read('effectiveFrom');
    const reason = read('reason');
    if (!employeeCode || employeeCode.length > 100)
      fail('employeeCode must contain 1–100 characters.');
    if (seen.has(employeeCode)) fail(`employeeCode ${employeeCode} appears more than once.`);
    seen.add(employeeCode);
    if (
      amount.length > 24 ||
      !/^(0|[1-9]\d{0,13})(\.\d{1,4})?$/.test(amount) ||
      !/[1-9]/.test(amount)
    )
      fail(
        'amount must be a positive decimal with at most 14 integer digits and four decimal places; do not include commas or a currency symbol.',
      );
    if (!/^[A-Z]{3}$/.test(currency))
      fail('currency must be an uppercase three-letter code, such as INR.');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)
      ? new Date(`${effectiveFrom}T00:00:00Z`)
      : null;
    if (
      !date ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== effectiveFrom
    )
      fail('effectiveFrom must be a valid calendar date in YYYY-MM-DD format.');
    if (!reason || reason.length > 1000) fail('reason must contain 1–1000 characters.');
    return { rowNumber: record.line, employeeCode, amount, currency, effectiveFrom, reason };
  });
}

export function createBulkSalaryTemplateCsv(): string {
  return writeCsv([BULK_CSV_HEADERS]);
}
export function exportBulkSalaryResultsCsv(rows: readonly BulkCsvResultRow[]): string {
  return writeCsv([
    [
      'Source row',
      'Employee code',
      'Monthly amount',
      'Currency',
      'Effective from',
      'Reason',
      'Result',
      'Message',
    ],
    ...rows.map((row) => [
      row.rowNumber?.toString() ?? '',
      row.employeeCode,
      row.amount ?? '',
      row.currency ?? '',
      row.effectiveFrom ?? '',
      row.reason ?? '',
      row.status,
      row.message,
    ]),
  ]);
}
