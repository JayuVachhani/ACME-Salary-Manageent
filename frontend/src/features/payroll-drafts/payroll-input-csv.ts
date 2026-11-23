import { readCsvRecords, writeCsv } from '../../shared/csv/csv';
import { earningsFields, deductionFields, type Earnings, type Deductions } from './types';
export const payrollInputHeaders = [
  'employeeCode',
  ...earningsFields.map(([key]) => key),
  ...deductionFields.map(([key]) => key),
  'reason',
];
export type PayrollInputRow = {
  rowNumber: number;
  employeeCode: string;
  earnings: Earnings;
  deductions: Deductions;
  reason: string;
};
export const payrollInputTemplate = () => writeCsv([payrollInputHeaders]);
export function parsePayrollInputs(text: string): PayrollInputRow[] {
  if (new TextEncoder().encode(text).byteLength > 262144)
    throw new Error('Use a CSV file smaller than 256 KB.');
  const records = readCsvRecords(text);
  const headers = records.shift()?.fields.map((field) => field.trim());
  if (
    !headers ||
    headers.length !== payrollInputHeaders.length ||
    new Set(headers).size !== headers.length ||
    !payrollInputHeaders.every((header) => headers.includes(header))
  )
    throw new Error('Use the downloaded template with every earning, deduction and reason column.');
  if (!records.length || records.length > 100) throw new Error('Upload 1–100 employees per batch.');
  const seen = new Set<string>();
  return records.map(({ line, fields }) => {
    const fail = (message: string): never => {
      throw new Error(`CSV line ${line}: ${message}`);
    };
    if (fields.length !== headers.length) fail('The number of columns does not match the header.');
    const get = (name: string) => fields[headers.indexOf(name)]!.trim();
    const employeeCode = get('employeeCode').toUpperCase();
    if (!employeeCode || employeeCode.length > 100 || seen.has(employeeCode))
      fail('Provide a unique employee code (1–100 characters).');
    seen.add(employeeCode);
    const money = (key: string) => {
      const value = get(key);
      if (!/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/.test(value))
        fail(
          `${key} must be a nonnegative INR amount with up to two decimal places. Enter 0 when not applicable.`,
        );
      return value;
    };
    const reason = get('reason');
    if (!reason || reason.length > 1000) fail('Provide a reason of 1–1000 characters.');
    return {
      rowNumber: line,
      employeeCode,
      earnings: {
        basic: money('basic'),
        hra: money('hra'),
        allowances: money('allowances'),
        bonuses: money('bonuses'),
        incentives: money('incentives'),
        overtime: money('overtime'),
      },
      deductions: {
        pf: money('pf'),
        esi: money('esi'),
        professionalTax: money('professionalTax'),
        tds: money('tds'),
        unpaidLeave: money('unpaidLeave'),
        authorized: money('authorized'),
      },
      reason,
    };
  });
}
