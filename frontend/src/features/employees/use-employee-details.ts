import { useState } from 'react';
import { baseApi } from '../../shared/api/base-api';
import { useEmployeeProfile } from './use-employee-profile';
export function useEmployeeDetails(id: string) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('details');
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
  return { editing, setEditing, tab, setTab, canViewSalary, canEdit, selected, loading, error };
}
