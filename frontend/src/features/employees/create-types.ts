export type EmployeeCreateInput = {
  commandId: string;
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  joiningDate: string;
  countryCode: string;
  departmentId: string;
  designationId: string;
  employmentStatus: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string;
  amount: string;
  currency: string;
  reason: string;
  confirmed: true;
};
export type EmployeeCreateOptions = {
  countries: { code: string; name: string; currency: string; decimalPlaces: number }[];
  departments: { id: string; name: string }[];
  designations: { id: string; name: string }[];
  currencies: { code: string }[];
};
