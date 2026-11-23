import { useState } from 'react';
import { baseApi } from '../../shared/api/base-api';
import { useEmployeeProfile } from './use-employee-profile';
export function useEmployeeDetails(id: string, initialTab: 'details' | 'salary' = 'details') {
  const [editing, setEditing] = useState(false);
  const [salaryEditing, setSalaryEditing] = useState(false);
  const [tab, setTab] = useState<string>(initialTab);
  const session = baseApi.useSessionQuery(undefined, { refetchOnMountOrArgChange: false });
  const identity = session.currentData;
  const canViewSalary = Boolean(
    identity?.isHrManager ||
    (identity?.permissions.includes('read') && identity?.permissions.includes('salary:view')),
  );
  const canEdit = Boolean(
    identity?.isHrManager ||
    (identity?.permissions.includes('read') && identity?.permissions.includes('edit')),
  );
  const { data: selected, loading, error } = useEmployeeProfile(id);
  function selectTab(next: string) {
    if (editing || salaryEditing) return;
    setTab(next);
  }
  return {
    editing,
    setEditing,
    salaryEditing,
    setSalaryEditing,
    tab,
    setTab: selectTab,
    canViewSalary,
    canEdit,
    selected,
    loading,
    error,
  };
}
