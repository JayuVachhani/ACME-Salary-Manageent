import { CurrencySelect } from '../../../shared/ui/currency-select';
import { Button } from '../../../shared/ui/button';
import { Checkbox, Form, Select, TextInput, Textarea } from '../../../shared/ui/form-controls';
import type { CountryCurrencyModel } from '../use-country-currency';
export function CountryEditor({ model }: { model: CountryCurrencyModel }) {
  const { draft, setDraft, editing, busy, reset, submit, active } = model;
  return (
    <>
      <Form onSubmit={submit}>
        <TextInput
          label="Country code"
          id="country-code"
          required
          pattern="[A-Z]{2}"
          maxLength={2}
          value={draft.countryCode}
          disabled={busy || Boolean(editing)}
          onChange={(e) => setDraft({ ...draft, countryCode: e.target.value.toUpperCase() })}
        />
        <TextInput
          label="Country name"
          id="country-name"
          required
          maxLength={200}
          disabled={busy}
          value={draft.countryName}
          onChange={(e) => setDraft({ ...draft, countryName: e.target.value })}
        />
        <CurrencySelect
          label="Default currency"
          id="country-currency"
          required
          disabled={busy}
          value={draft.defaultCurrency}
          onChange={(e) => setDraft({ ...draft, defaultCurrency: e.target.value })}
          currencies={active}
          placeholder="Select active currency"
          showNames
        />
        <TextInput
          label="Decimal places"
          id="country-decimals"
          type="number"
          required
          min={0}
          max={4}
          step={1}
          disabled={busy}
          value={draft.decimalPlaces}
          onChange={(e) => setDraft({ ...draft, decimalPlaces: Number(e.target.value) })}
        />
        <Select
          label="Rounding mode"
          id="country-rounding"
          disabled={busy}
          value={draft.roundingMode}
          onChange={(e) => setDraft({ ...draft, roundingMode: e.target.value })}
        >
          {['HALF_UP', 'FLOOR', 'CEIL'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </Select>
        <Textarea
          label="Regulatory notes"
          id="regulatory-notes"
          maxLength={4000}
          disabled={busy}
          value={draft.regulatoryNotes}
          onChange={(e) => setDraft({ ...draft, regulatoryNotes: e.target.value })}
        />
        <Textarea
          label="Retention notes"
          id="retention-notes"
          maxLength={4000}
          disabled={busy}
          value={draft.retentionNotes}
          onChange={(e) => setDraft({ ...draft, retentionNotes: e.target.value })}
        />
        {editing && (
          <Checkbox
            label="Country active"
            disabled={busy}
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
          />
        )}
        <Button busy={busy} busyLabel="Saving…" type="submit">
          Review country policy
        </Button>
        {editing && (
          <Button disabled={busy} type="button" onClick={reset}>
            Cancel country edit
          </Button>
        )}
      </Form>
    </>
  );
}
