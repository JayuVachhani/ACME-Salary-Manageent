import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { useResource } from '../../shared/hooks/use-resource';
import { employeesApi } from './api';
import { initialFilters } from './types';
import type { Employee, EmployeeQuery, Filters } from './types';
export function useEmployees() {
  const [draft, setDraft] = useState(initialFilters), [query, changeQuery] = useState<EmployeeQuery>({ ...initialFilters, page: 1 });
  const [selectedId, setSelectedId] = useState('');
  const loader = useCallback(async (signal: AbortSignal) => {
    const [rows, filters] = await Promise.all([employeesApi.list(query, signal), employeesApi.filters(signal)]);
    return { ...rows, filters };
  }, [query]);
  const resource = useResource(loader, { items: [] as Employee[], total: 0, filters: { countries: [], departments: [] } as Filters });
  function setQuery(value: EmployeeQuery) { setSelectedId(''); changeQuery(value); }
  function applyFilters(event: FormEvent) { event.preventDefault(); setQuery({ ...draft, page: 1 }); }
  function clearFilters() { setDraft(initialFilters); setQuery({ ...initialFilters, page: 1 }); }
  function refresh() { setSelectedId(''); void resource.refresh().catch(() => { /* Render the resource error. */ }); }
  return { draft, setDraft, query, setQuery, selectedId, setSelectedId, refresh, applyFilters, clearFilters,
    items: resource.error ? [] : resource.data.items, total: resource.data.total, filters: resource.data.filters,
    loading: resource.loading, error: resource.error };
}
export type EmployeesModel = ReturnType<typeof useEmployees>;
