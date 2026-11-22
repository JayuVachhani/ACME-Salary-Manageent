import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { useResource } from '../../shared/hooks/use-resource';
import type { Currency } from '../../shared/api/currency-catalogue';
import { countryCurrencyApi, getCurrencyCatalogue } from './api';
import { emptyCountry } from './types';
import type { Country, Draft } from './types';
type Confirmation = { details: string; kind: 'country'; draft: Draft; editing: Country | null } | { details: string; kind: 'currency'; currency: Currency };
export function useCountryCurrency(isHrManager: boolean) {
  const [offset, changeOffset] = useState(0);
  const loader = useCallback(async (signal: AbortSignal) => {
    const [catalogue, countries] = await Promise.all([getCurrencyCatalogue(signal), isHrManager ? countryCurrencyApi.list(offset, signal) : Promise.resolve({ items: [], total: 0 })]);
    return { catalogue: catalogue.items, countries: countries.items, total: countries.total };
  }, [offset, isHrManager]);
  const resource = useResource(loader, { catalogue: [] as Currency[], countries: [] as Country[], total: 0 }); const action = useAction();
  const [search, setSearch] = useState(''), [draft, setDraft] = useState<Draft>(emptyCountry), [editing, setEditing] = useState<Country | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  function reset() { setDraft(emptyCountry); setEditing(null); }
  function edit(country: Country) { setEditing(country); setDraft({ countryCode: country.country_code, countryName: country.country_name, defaultCurrency: country.default_currency, decimalPlaces: country.decimal_places, roundingMode: country.rounding_mode, regulatoryNotes: country.regulatory_notes ?? '', retentionNotes: country.retention_notes ?? '', isActive: country.is_active }); }
  function submit(event: FormEvent) {
    event.preventDefault(); if (!draft.countryName.trim()) { action.setMessage('Enter a country name.'); return; }
    const value = { ...draft };
    setConfirmation({ kind: 'country', draft: value, editing,
      details: `${editing ? 'Update' : 'Create'} ${value.countryName.trim()} (${value.countryCode}). Currency ${value.defaultCurrency}; ${value.decimalPlaces} decimal places; ${value.roundingMode}; ${value.isActive ? 'Active' : 'Inactive'}. Regulatory notes: ${value.regulatoryNotes || 'none'}. Retention notes: ${value.retentionNotes || 'none'}. Notes do not enforce legal retention. Historical salary snapshots stay unchanged.` });
  }
  function reviewCurrency(currency: Currency) { setConfirmation({ kind: 'currency', currency: { ...currency }, details: `${currency.is_active ? 'Deactivate' : 'Activate'} ${currency.code}. ${currency.minor_units ?? 'N.A.'} minor units. Deactivation blocks new financial records using this currency, including active countries that still reference it. Existing history is retained.` }); }
  function confirmChange() { if (!confirmation) return; const snapshot = confirmation; void action.perform(async signal => {
    try {
      if (snapshot.kind === 'country') { await countryCurrencyApi.save(snapshot.draft, snapshot.editing, signal); if (!signal.aborted) reset(); }
      else await countryCurrencyApi.activate(snapshot.currency, signal);
      if (signal.aborted) return;
      await resource.refresh(); action.setMessage(snapshot.kind === 'country' ? 'Country saved.' : 'Currency status saved.');
    } finally { if (!signal.aborted) setConfirmation(null); }
  }); }
  function refresh() { void action.perform(async () => { await resource.refresh(); }); }
  function setOffset(value: number) { action.setMessage(''); changeOffset(value); }
  const catalogue = resource.error ? [] : resource.data.catalogue;
  return { isHrManager, catalogue, countries: resource.error ? [] : resource.data.countries, total: resource.data.total, offset, setOffset,
    search, setSearch, draft, setDraft, editing, loading: resource.loading, busy: action.busy, message: action.message || resource.error,
    confirmation, cancelConfirmation: () => setConfirmation(null), reset, edit, submit, reviewCurrency, confirmChange, refresh,
    active: catalogue.filter(currency => currency.is_active && currency.supported),
    filtered: catalogue.filter(currency => `${currency.code} ${currency.currency_name}`.toLowerCase().includes(search.toLowerCase())) };
}
export type CountryCurrencyModel = ReturnType<typeof useCountryCurrency>;
