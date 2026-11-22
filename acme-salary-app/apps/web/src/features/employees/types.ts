export type Employee = {
  id: string;
  employee_code: string;
  email: string;
  first_name: string;
  last_name: string;
  joining_date: string;
  version: number;
  country_code: string | null;
  country_name: string | null;
  department: string | null;
  designation: string | null;
  employment_status: string | null;
};
export type Filters = {
  countries: { code: string; name: string; is_active: boolean }[];
  departments: { id: string; name: string; is_active: boolean }[];
};
export const initialFilters = {
  search: '',
  country: '',
  department: '',
  status: '',
  sort: 'code',
  direction: 'asc',
  pageSize: '25',
};
export type EmployeeQuery = typeof initialFilters & { page: number };
