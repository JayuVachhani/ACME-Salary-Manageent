import { z } from 'zod';
import { timestampText } from '../../common/dto/response-values.js';
export const employeeResponse = z.object({
  id: z.uuid(),
  employee_code: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  joining_date: z.string(),
  version: z.number().int(),
  country_code: z.string().nullable(),
  country_name: z.string().nullable(),
  department_id: z.uuid().nullable(),
  department: z.string().nullable(),
  designation_id: z.uuid().nullable(),
  designation: z.string().nullable(),
  employment_status: z.string().nullable(),
});
export const employeePageResponse = z.object({
  items: z.array(employeeResponse),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const employeeFiltersResponse = z.object({
  countries: z.array(z.object({ code: z.string(), name: z.string(), is_active: z.boolean() })),
  departments: z.array(z.object({ id: z.uuid(), name: z.string(), is_active: z.boolean() })),
});

export type EmployeeResponse = z.output<typeof employeeResponse>;
export type EmployeePageResponse = z.output<typeof employeePageResponse>;
export type EmployeeFiltersResponse = z.output<typeof employeeFiltersResponse>;
export const employeeSalaryEventStateResponse = z.object({
  amount: z.string(),
  currency: z.string(),
  countryCode: z.string(),
  defaultCurrency: z.string(),
  decimalPlaces: z.number().int(),
  effectiveFrom: z.string(),
});
export const employeeSalaryEventResponse = z.object({
  type: z.string(),
  before: employeeSalaryEventStateResponse.nullable(),
  after: employeeSalaryEventStateResponse,
});
export const employeeSalaryEntryResponse = z.object({
  id: z.uuid(),
  amount: z.string(),
  currency: z.string(),
  effectiveFrom: z.string(),
  reason: z.string(),
  approvalStatus: z.enum(['ACTIVE', 'WAITING_MANAGEMENT_APPROVAL']),
  decimalPlaces: z.number().int(),
  createdAt: timestampText,
  createdByName: z.string(),
  changeType: z.string().nullable(),
  correctsId: z.uuid().nullable(),
  isSuperseded: z.boolean(),
  conversionMeta: z.record(z.string(), z.unknown()),
  events: z.array(employeeSalaryEventResponse),
});
export const employeeSalaryRequestResponse = z.object({
  id: z.uuid(),
  amount: z.string(),
  currency: z.string(),
  effectiveFrom: z.string(),
  reason: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  decisionComment: z.string().nullable(),
  requestKind: z.enum(['INITIAL', 'BACKDATED']),
  requestedBy: z.uuid(),
  requestedByName: z.string(),
  decimalPlaces: z.number().int(),
  createdAt: timestampText,
  decidedAt: timestampText.nullable(),
  decidedByName: z.string().nullable(),
  correctsId: z.uuid().nullable(),
});
export const employeeSalaryPendingResponse = z.object({
  id: z.uuid(),
  amount: z.string(),
  currency: z.string(),
  effectiveFrom: z.string(),
  decimalPlaces: z.number().int(),
});
export const employeeSalaryResponse = z.object({
  current: employeeSalaryEntryResponse.nullable(),
  history: z.array(employeeSalaryEntryResponse),
  pending: z.array(employeeSalaryPendingResponse),
  total: z.number().int(),
  page: z.number().int(),
  canResubmitInitial: z.boolean(),
  canChangeSalary: z.boolean(),
  canSubmitBackdated: z.boolean(),
  businessDate: z.string(),
  salaryChangeUnavailableReason: z.string().nullable(),
  requests: z.array(employeeSalaryRequestResponse),
  requestsTotal: z.number().int(),
  requestsPage: z.number().int(),
  currencies: z.array(z.object({ code: z.string() })),
});
export type EmployeeSalaryEntry = z.output<typeof employeeSalaryEntryResponse>;
export type EmployeeSalaryRequest = z.output<typeof employeeSalaryRequestResponse>;
export type EmployeeSalaryPending = z.output<typeof employeeSalaryPendingResponse>;
