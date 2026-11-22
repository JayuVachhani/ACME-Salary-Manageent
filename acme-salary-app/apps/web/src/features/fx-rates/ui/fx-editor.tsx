import type { FxRatesModel } from '../use-fx-rates';
export function FxEditor({ model }: { model: FxRatesModel }) {
  const { draft, setDraft, revision, setRevision, busy, active, loadRevision, writeSubmit } = model;
  return <><h3>Add FX revision</h3><p>Only active currencies are available for new revisions. No existing rate is overwritten or deleted.</p>
      <form onSubmit={writeSubmit}>
        <label htmlFor="fx-base">Rate base currency</label><select id="fx-base" required disabled={busy} value={draft.base} onChange={e=>{setDraft({...draft,base:e.target.value});setRevision(null);}}><option value="">Choose base</option>{draft.base&&!active.some(c=>c.code===draft.base)&&<option disabled value={draft.base}>{draft.base} — inactive</option>}{active.map(c=><option key={c.code}>{c.code}</option>)}</select>
        <label htmlFor="fx-quote">Rate quote currency</label><select id="fx-quote" required disabled={busy} value={draft.quote} onChange={e=>{setDraft({...draft,quote:e.target.value});setRevision(null);}}><option value="">Choose quote</option>{draft.quote&&!active.some(c=>c.code===draft.quote)&&<option disabled value={draft.quote}>{draft.quote} — inactive</option>}{active.map(c=><option key={c.code}>{c.code}</option>)}</select>
        <label htmlFor="fx-date">Rate effective date</label><input id="fx-date" required type="date" disabled={busy} value={draft.effectiveDate} onChange={e=>{setDraft({...draft,effectiveDate:e.target.value});setRevision(null);}}/>
        <button type="button" disabled={busy||!draft.base||!draft.quote||!draft.effectiveDate||draft.base===draft.quote} onClick={loadRevision}>Load current FX revision</button>
        <label htmlFor="fx-rate">FX rate</label><input id="fx-rate" required inputMode="decimal" pattern="(0|[1-9][0-9]{0,9})(\.[0-9]{1,8})?" maxLength={19} disabled={busy} value={draft.rate} onChange={e=>setDraft({...draft,rate:e.target.value})}/>
        <label htmlFor="fx-source">Rate source</label><input id="fx-source" required maxLength={500} disabled={busy} value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})}/>
        <label htmlFor="fx-reason">Revision reason</label><textarea id="fx-reason" required maxLength={2000} disabled={busy} value={draft.reason} onChange={e=>setDraft({...draft,reason:e.target.value})}/>
        <button disabled={busy||revision===null} type="submit">Review FX revision</button>
      </form></>;
}
