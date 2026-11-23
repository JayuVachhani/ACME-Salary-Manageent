import { baseApi } from '../../shared/api/base-api';

export const salaryBulkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    resolveSalaryEmployees: build.mutation<
      { employeeCode: string; id: string; version: number; firstName: string; lastName: string }[],
      string[]
    >({
      query: (employeeCodes) => ({
        path: '/api/v1/salary/bulk/resolve',
        method: 'POST',
        body: { employeeCodes },
      }),
    }),
  }),
});
