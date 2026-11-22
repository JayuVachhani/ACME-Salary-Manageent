import type { FxRatesModel } from '../use-fx-rates';
export function FxLookup({ model }: { model: FxRatesModel }) {
  const { lookup, setLookup, resolved, busy, lookupSubmit } = model;
  return <><h3>Historical FX lookup</h3><form onSubmit={lookupSubmit}>
      <label htmlFor="fx-lookup-base">Lookup base currency</label><input id="fx-lookup-base" required pattern="[A-Z]{3}" maxLength={3} value={lookup.base} onChange={e=>setLookup({...lookup,base:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-lookup-quote">Lookup quote currency</label><input id="fx-lookup-quote" required pattern="[A-Z]{3}" maxLength={3} value={lookup.quote} onChange={e=>setLookup({...lookup,quote:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-lookup-date">Lookup as-of date</label><input id="fx-lookup-date" type="date" required value={lookup.asOf} onChange={e=>setLookup({...lookup,asOf:e.target.value})}/>
      <button disabled={busy} type="submit">Resolve historical FX</button>
    </form>
    {resolved&&<div role="status" style={{overflowWrap:'anywhere'}}><p>Resolved unit rate: {resolved.rate}. Maximum staleness: {resolved.maxStalenessDays} days.</p>
      {!resolved.path.length&&<p>Same currency: unit factor 1; no FX revision required.</p>}{resolved.path.map(leg=><p key={leg.rate.id}>{leg.inverse?'Inverse':'Direct'} {leg.rate.base} → {leg.rate.quote}, effective {leg.rate.effectiveDate}, revision {leg.rate.revision}, source {leg.rate.source}, rate ID {leg.rate.id}.</p>)}
    </div>}
    </>;
}
