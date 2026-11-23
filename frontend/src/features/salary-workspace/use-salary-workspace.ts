import { useState } from 'react';
import type { FormEvent } from 'react';
import { queryState } from '../../shared/api/query-state';
import { useSalaryWorkspaceQuery, useSalaryWorkspaceFiltersQuery } from './api';
import { initialSalaryWorkspaceFilters } from './types';
import type { SalaryWorkspaceDraft, SalaryWorkspaceQuery } from './types';

export function useSalaryWorkspace() {
  const [draft, setDraft] = useState(initialSalaryWorkspaceFilters);
  const [query, setQuery] = useState<SalaryWorkspaceQuery>({
    ...initialSalaryWorkspaceFilters,
    page: 1,
  });
  const rows = queryState(useSalaryWorkspaceQuery(query), {
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    businessDate: '',
  });
  const filters = queryState(useSalaryWorkspaceFiltersQuery(), { countries: [], departments: [] });
  const error = rows.error || filters.error;
  function change(field: keyof SalaryWorkspaceDraft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }
  function apply(event: FormEvent) {
    event.preventDefault();
    setQuery({ ...draft, page: 1 });
  }
  function clear() {
    setDraft(initialSalaryWorkspaceFilters);
    setQuery({ ...initialSalaryWorkspaceFilters, page: 1 });
  }
  function refresh() {
    void Promise.all([rows.refresh(), filters.refresh()]).catch(() => {
      /* Resource state presents the error. */
    });
  }
  return {
    draft,
    change,
    query,
    apply,
    clear,
    refresh,
    setPage: (page: number) => setQuery((previous) => ({ ...previous, page })),
    items: error ? [] : rows.data.items,
    total: error ? 0 : rows.data.total,
    businessDate: rows.data.businessDate,
    filters: filters.data,
    loading: rows.loading || filters.loading,
    error,
  };
}
export type SalaryWorkspaceModel = ReturnType<typeof useSalaryWorkspace>;
