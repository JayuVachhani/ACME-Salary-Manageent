import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { queryState } from '../../shared/api/query-state';
import { runRequest } from '../../shared/api/run-request';
import { useCurrencyCatalogueQuery } from '../../shared/api/currency-catalogue';
import type { Currency } from '../../shared/api/currency-catalogue';
import { useCountriesQuery, useSaveCountryMutation, useActivateCurrencyMutation } from './api';
import { emptyCountry } from './types';
import type { Country, Draft } from './types';
type Confirmation =
  | { details: string; kind: 'country'; draft: Draft; editing: Country | null }
  | { details: string; kind: 'currency'; currency: Currency };
export function useCountryCurrency(isHrManager: boolean) {
  const [offset, changeOffset] = useState(0);
  const catalogueQuery = queryState(useCurrencyCatalogueQuery(), { items: [] });
  const countriesQuery = queryState(useCountriesQuery(offset, { skip: !isHrManager }), {
    items: [],
    total: 0,
  });
  const resource = {
    data: {
      catalogue: catalogueQuery.data.items,
      countries: countriesQuery.data.items,
      total: countriesQuery.data.total,
    },
    error: catalogueQuery.error || (isHrManager ? countriesQuery.error : ''),
    loading: catalogueQuery.loading || (isHrManager && countriesQuery.loading),
    refresh: () =>
      Promise.all([catalogueQuery.refresh(), ...(isHrManager ? [countriesQuery.refresh()] : [])]),
  };
  const [saveCountry] = useSaveCountryMutation();
  const [activateCurrency] = useActivateCurrencyMutation();
  const action = useAction();
  const [search, setSearch] = useState(''),
    [draft, setDraft] = useState<Draft>(emptyCountry),
    [editing, setEditing] = useState<Country | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  function reset() {
    setDraft(emptyCountry);
    setEditing(null);
  }
  function edit(country: Country) {
    setEditing(country);
    setDraft({
      countryCode: country.country_code,
      countryName: country.country_name,
      defaultCurrency: country.default_currency,
      decimalPlaces: country.decimal_places,
      roundingMode: country.rounding_mode,
      regulatoryNotes: country.regulatory_notes ?? '',
      retentionNotes: country.retention_notes ?? '',
      isActive: country.is_active,
    });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.countryName.trim()) {
      action.setMessage('Enter a country name.', 'error');
      return;
    }
    const value = { ...draft };
    setConfirmation({
      kind: 'country',
      draft: value,
      editing,
      details: `${editing ? 'Update' : 'Create'} ${value.countryName.trim()} (${value.countryCode}). Currency ${value.defaultCurrency}; ${value.decimalPlaces} decimal places; ${value.roundingMode}; ${value.isActive ? 'Active' : 'Inactive'}. Regulatory notes: ${value.regulatoryNotes || 'none'}. Retention notes: ${value.retentionNotes || 'none'}. Notes do not enforce legal retention. Historical salary snapshots stay unchanged.`,
    });
  }
  function reviewCurrency(currency: Currency) {
    setConfirmation({
      kind: 'currency',
      currency: { ...currency },
      details: `${currency.is_active ? 'Deactivate' : 'Activate'} ${currency.code}. ${currency.minor_units ?? 'N.A.'} minor units. Deactivation blocks new financial records using this currency, including active countries that still reference it. Existing history is retained.`,
    });
  }
  function confirmChange() {
    if (!confirmation) return;
    const snapshot = confirmation;
    void action.perform(async (signal) => {
      try {
        if (snapshot.kind === 'country') {
          await runRequest(
            saveCountry({ draft: snapshot.draft, editing: snapshot.editing }),
            signal,
          );
          if (!signal.aborted) reset();
        } else await runRequest(activateCurrency(snapshot.currency), signal);
        if (signal.aborted) return;
        action.announce(snapshot.kind === 'country' ? 'Country saved.' : 'Currency status saved.');
      } finally {
        if (!signal.aborted) setConfirmation(null);
      }
    });
  }
  function refresh() {
    void action.perform(async () => {
      await resource.refresh().catch(() => {
        /* RequestState displays this query failure. */
      });
    });
  }
  function setOffset(value: number) {
    action.setMessage('');
    changeOffset(value);
  }
  const catalogue = resource.error ? [] : resource.data.catalogue;
  return {
    isHrManager,
    catalogue,
    countries: resource.error ? [] : resource.data.countries,
    total: resource.data.total,
    offset,
    setOffset,
    search,
    setSearch,
    draft,
    setDraft,
    editing,
    loading: resource.loading,
    busy: action.busy,
    feedback: action.feedback,
    error: resource.error,
    confirmation,
    cancelConfirmation: () => setConfirmation(null),
    reset,
    edit,
    submit,
    reviewCurrency,
    confirmChange,
    refresh,
    active: catalogue.filter((currency) => currency.is_active && currency.supported),
    filtered: catalogue.filter((currency) =>
      `${currency.code} ${currency.currency_name}`.toLowerCase().includes(search.toLowerCase()),
    ),
  };
}
export type CountryCurrencyModel = ReturnType<typeof useCountryCurrency>;
