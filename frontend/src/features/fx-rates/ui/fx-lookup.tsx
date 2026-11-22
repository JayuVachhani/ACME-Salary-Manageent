import { ErrorState } from '../../../shared/ui/request-state';
import { Button } from '../../../shared/ui/button';
import { Form, TextInput } from '../../../shared/ui/form-controls';
import type { FxRatesModel } from '../use-fx-rates';
export function FxLookup({ model }: { model: FxRatesModel }) {
  const { lookup, setLookup, resolved, lookupError, busy, lookupSubmit } = model;
  return (
    <>
      <h3>Historical FX lookup</h3>
      <Form onSubmit={lookupSubmit}>
        <TextInput
          label="Lookup base currency"
          id="fx-lookup-base"
          required
          pattern="[A-Z]{3}"
          maxLength={3}
          value={lookup.base}
          onChange={(e) => setLookup({ ...lookup, base: e.target.value.toUpperCase() })}
        />
        <TextInput
          label="Lookup quote currency"
          id="fx-lookup-quote"
          required
          pattern="[A-Z]{3}"
          maxLength={3}
          value={lookup.quote}
          onChange={(e) => setLookup({ ...lookup, quote: e.target.value.toUpperCase() })}
        />
        <TextInput
          label="Lookup as-of date"
          id="fx-lookup-date"
          type="date"
          required
          value={lookup.asOf}
          onChange={(e) => setLookup({ ...lookup, asOf: e.target.value })}
        />
        <Button busy={busy} busyLabel="Saving…" type="submit">
          Resolve historical FX
        </Button>
      </Form>
      <ErrorState message={lookupError} />
      {resolved && (
        <div role="status" style={{ overflowWrap: 'anywhere' }}>
          <p>
            Resolved unit rate: {resolved.rate}. Maximum staleness: {resolved.maxStalenessDays}{' '}
            days.
          </p>
          {!resolved.path.length && <p>Same currency: unit factor 1; no FX revision required.</p>}
          {resolved.path.map((leg) => (
            <p key={leg.rate.id}>
              {leg.inverse ? 'Inverse' : 'Direct'} {leg.rate.base} → {leg.rate.quote}, effective{' '}
              {leg.rate.effectiveDate}, revision {leg.rate.revision}, source {leg.rate.source}, rate
              ID {leg.rate.id}.
            </p>
          ))}
        </div>
      )}
    </>
  );
}
