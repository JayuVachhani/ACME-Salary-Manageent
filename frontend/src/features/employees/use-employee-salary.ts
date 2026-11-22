import { useState } from 'react';
import type { Employee } from './types';
import { baseApi } from '../../shared/api/base-api';
import { useEmployeeSalaryQuery } from './api';
export function useEmployeeSalary(employee: Employee) {
  const id = employee.id;
  const session = baseApi.useSessionQuery(undefined, { refetchOnMountOrArgChange: false });
  const canCreate =
    session.currentData?.isHrManager ||
    ['read', 'write', 'salary:view'].every((permission) =>
      session.currentData?.permissions.includes(permission),
    );
  const [page, setPage] = useState(1);
  const query = useEmployeeSalaryQuery({ id, page });
  return { page, setPage, query, canCreate };
}
