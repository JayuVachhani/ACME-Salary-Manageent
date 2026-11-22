import { errorMessage } from '../../shared/api/client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { queryState } from '../../shared/api/query-state';
import { runRequest } from '../../shared/api/run-request';
import { useCurrencyCatalogueQuery } from '../../shared/api/currency-catalogue';
import { useFxRatesQuery, useLazyFxRatesQuery, useLazyResolveFxQuery, useAppendFxMutation } from './api';
import type { FxQuery, Rate, RateDraft, PendingRate } from './types';
const emptyQuery: FxQuery = { base: '', quote: '', asOf: '' };
export function useFxRates(isHrManager: boolean) {
  const [offset, changeOffset] = useState(0), [filter, setFilter] = useState(emptyQuery), [applied, setApplied] = useState(emptyQuery);
  const rowsQuery = queryState(useFxRatesQuery({ ...applied, offset }), { items: [], total: 0 });
  const catalogueQuery = queryState(useCurrencyCatalogueQuery(), { items: [] });
  const resource = { data: { ...rowsQuery.data, currencies: catalogueQuery.data.items },
    error: rowsQuery.error || catalogueQuery.error, loading: rowsQuery.loading || catalogueQuery.loading,
    refresh: () => Promise.all([rowsQuery.refresh(), catalogueQuery.refresh()]) };
  const [loadRates] = useLazyFxRatesQuery(); const [resolveFx, resolution] = useLazyResolveFxQuery();
  const [appendFx] = useAppendFxMutation(); const action = useAction();
  const [draft, setDraft] = useState<RateDraft>({ base: '', quote: '', effectiveDate: '', rate: '', source: '', reason: '' }), [revision, setRevision] = useState<number | null>(null);
  const [lookup, setLookup] = useState(emptyQuery), [showResolution, setShowResolution] = useState(false), [pending, setPending] = useState<PendingRate | null>(null);
  const resolved = showResolution && !resolution.isError ? resolution.currentData ?? null : null;
  async function currentRevision(base: string, quote: string, effectiveDate: string, signal: AbortSignal) {
    const rows = await runRequest(loadRates({ base, quote, asOf: effectiveDate }), signal);
    return rows.items[0]?.effective_date === effectiveDate ? rows.items[0].revision : 0;
  }
  function applyFilters(event: FormEvent) { event.preventDefault(); action.setMessage(''); changeOffset(0); setApplied({ ...filter }); }
  function setOffset(value: number) { action.setMessage(''); changeOffset(value); }
  function refresh() { void action.perform(async () => { await resource.refresh().catch(() => { /* RequestState displays this query failure. */ }); }); }
  function loadRevision() { void action.perform(async signal => {
    const value = await currentRevision(draft.base, draft.quote, draft.effectiveDate, signal); if (signal.aborted) return;
    setRevision(value); action.setMessage(`Current revision ${value}; next revision ${value + 1}.`);
  }); }
  function prepareCorrection(row: Rate) { void action.perform(async signal => {
    const latest = await currentRevision(row.base_currency, row.quote_currency, row.effective_date, signal); if (signal.aborted) return;
    setDraft({ base: row.base_currency, quote: row.quote_currency, effectiveDate: row.effective_date, rate: row.rate, source: row.source, reason: '' });
    setRevision(latest); action.setMessage(`Loaded current revision ${latest}. Enter a reason and review the new revision.`);
  }); }
  function writeSubmit(event: FormEvent) { event.preventDefault(); if (revision === null) { action.setMessage('Load the current revision before reviewing a rate.', 'error'); return; } setPending({ input: { ...draft }, expectedRevision: revision }); }
  function lookupSubmit(event: FormEvent) { event.preventDefault(); setShowResolution(false); void action.perform(async signal => { await runRequest(resolveFx(lookup), signal); if (!signal.aborted) setShowResolution(true); }); }
  function confirmChange() { if (!pending) return; const snapshot = pending; void action.perform(async signal => {
    try { const saved = await runRequest(appendFx(snapshot), signal); if (signal.aborted) return;
      setRevision(saved.revision); setDraft({ ...snapshot.input, reason: '' }); action.announce('FX revision saved.');
    } finally { if (!signal.aborted) setPending(null); }
  }); }
  return { isHrManager, items: resource.error ? [] : resource.data.items, total: resource.data.total, offset, setOffset,
    lookupError: showResolution && resolution.isError ? errorMessage(resolution.error, 'Could not refresh the historical resolution.') : '',
    filter, setFilter, draft, setDraft, revision, setRevision, lookup, setLookup, resolved, busy: action.busy, loading: resource.loading,
    feedback: action.feedback, error: resource.error, pending, cancelConfirmation: () => setPending(null), active: resource.data.currencies.filter(c => c.is_active && c.supported),
    applyFilters, refresh, prepareCorrection, loadRevision, writeSubmit, lookupSubmit, confirmChange };
}
export type FxRatesModel = ReturnType<typeof useFxRates>;
