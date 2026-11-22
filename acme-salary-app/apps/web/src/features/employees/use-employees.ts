import { useState } from 'react';
import type { FormEvent } from 'react';
import { queryState } from '../../shared/api/query-state';
import { useEmployeesQuery, useEmployeeFiltersQuery } from './api';
import { initialFilters } from './types';
import type { EmployeeQuery } from './types';
export function useEmployees() {
  const [draft, setDraft] = useState(initialFilters), [query, changeQuery] = useState<EmployeeQuery>({ ...initialFilters, page: 1 });
  const [selectedId, setSelectedId] = useState('');
  const rowsQuery = queryState(useEmployeesQuery(query), { items: [], total: 0 });
  const filtersQuery = queryState(useEmployeeFiltersQuery(), { countries: [], departments: [] });
  const resource = { data: { ...rowsQuery.data, filters: filtersQuery.data },
    error: rowsQuery.error || filtersQuery.error, loading: rowsQuery.loading || filtersQuery.loading,
    refresh: () => Promise.all([rowsQuery.refresh(), filtersQuery.refresh()]) };
  function setQuery(value: EmployeeQuery) { setSelectedId(''); changeQuery(value); }
  function applyFilters(event: FormEvent) { event.preventDefault(); setQuery({ ...draft, page: 1 }); }
  function clearFilters() { setDraft(initialFilters); setQuery({ ...initialFilters, page: 1 }); }
  function refresh() { setSelectedId(''); void resource.refresh().catch(() => { /* Render the resource error. */ }); }
  return { draft, setDraft, query, setQuery, selectedId, setSelectedId, refresh, applyFilters, clearFilters,
    items: resource.error ? [] : resource.data.items, total: resource.data.total, filters: resource.data.filters,
    loading: resource.loading, error: resource.error };
}
export type EmployeesModel = ReturnType<typeof useEmployees>;
