import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { useResource } from '../../shared/hooks/use-resource';
import type { Currency } from '../../shared/api/currency-catalogue';
import { fxApi, getCurrencyCatalogue } from './api';
import type { FxQuery, Rate, RateDraft, Resolution, PendingRate } from './types';
const emptyQuery: FxQuery = { base: '', quote: '', asOf: '' };
export function useFxRates(isHrManager: boolean) {
  const [offset, changeOffset] = useState(0), [filter, setFilter] = useState(emptyQuery), [applied, setApplied] = useState(emptyQuery);
  const loader = useCallback(async (signal: AbortSignal) => {
    const [rows, catalogue] = await Promise.all([fxApi.list({ ...applied, offset }, signal), getCurrencyCatalogue(signal)]);
    return { ...rows, currencies: catalogue.items };
  }, [applied, offset]);
  const resource = useResource(loader, { items: [] as Rate[], total: 0, currencies: [] as Currency[] }); const action = useAction();
  const [draft, setDraft] = useState<RateDraft>({ base: '', quote: '', effectiveDate: '', rate: '', source: '', reason: '' }), [revision, setRevision] = useState<number | null>(null);
  const [lookup, setLookup] = useState(emptyQuery), [resolved, setResolved] = useState<Resolution | null>(null), [pending, setPending] = useState<PendingRate | null>(null);
  async function currentRevision(base: string, quote: string, effectiveDate: string, signal: AbortSignal) {
    const rows = await fxApi.list({ base, quote, asOf: effectiveDate }, signal);
    return rows.items[0]?.effective_date === effectiveDate ? rows.items[0].revision : 0;
  }
  function applyFilters(event: FormEvent) { event.preventDefault(); action.setMessage(''); changeOffset(0); setApplied({ ...filter }); }
  function setOffset(value: number) { action.setMessage(''); changeOffset(value); }
  function refresh() { void action.perform(async () => { await resource.refresh(); }); }
  function loadRevision() { void action.perform(async signal => {
    const value = await currentRevision(draft.base, draft.quote, draft.effectiveDate, signal); if (signal.aborted) return;
    setRevision(value); action.setMessage(`Current revision ${value}; next revision ${value + 1}.`);
  }); }
  function prepareCorrection(row: Rate) { void action.perform(async signal => {
    const latest = await currentRevision(row.base_currency, row.quote_currency, row.effective_date, signal); if (signal.aborted) return;
    setDraft({ base: row.base_currency, quote: row.quote_currency, effectiveDate: row.effective_date, rate: row.rate, source: row.source, reason: '' });
    setRevision(latest); action.setMessage(`Loaded current revision ${latest}. Enter a reason and review the new revision.`);
  }); }
  function writeSubmit(event: FormEvent) { event.preventDefault(); if (revision === null) { action.setMessage('Load the current revision before reviewing a rate.'); return; } setPending({ input: { ...draft }, expectedRevision: revision }); }
  function lookupSubmit(event: FormEvent) { event.preventDefault(); setResolved(null); void action.perform(async signal => { const result = await fxApi.resolve(lookup, signal); if (!signal.aborted) setResolved(result); }); }
  function confirmChange() { if (!pending) return; const snapshot = pending; void action.perform(async signal => {
    try { const saved = await fxApi.append(snapshot, signal); if (signal.aborted) return;
      setRevision(saved.revision); setDraft({ ...snapshot.input, reason: '' }); await resource.refresh(); action.setMessage('FX revision saved.');
    } finally { if (!signal.aborted) setPending(null); }
  }); }
  return { isHrManager, items: resource.error ? [] : resource.data.items, total: resource.data.total, offset, setOffset,
    filter, setFilter, draft, setDraft, revision, setRevision, lookup, setLookup, resolved, busy: action.busy, loading: resource.loading,
    message: action.message || resource.error, pending, cancelConfirmation: () => setPending(null), active: resource.data.currencies.filter(c => c.is_active && c.supported),
    applyFilters, refresh, prepareCorrection, loadRevision, writeSubmit, lookupSubmit, confirmChange };
}
export type FxRatesModel = ReturnType<typeof useFxRates>;
