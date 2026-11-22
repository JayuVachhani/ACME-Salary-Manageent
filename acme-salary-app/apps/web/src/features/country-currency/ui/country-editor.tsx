import type { CountryCurrencyModel } from '../use-country-currency';
export function CountryEditor({ model }: { model: CountryCurrencyModel }) {
  const { draft, setDraft, editing, busy, reset, submit, active } = model;
  return <><form onSubmit={submit}>
          <label htmlFor="country-code">Country code</label><input id="country-code" required pattern="[A-Z]{2}" maxLength={2} value={draft.countryCode} disabled={busy||Boolean(editing)} onChange={e=>setDraft({...draft,countryCode:e.target.value.toUpperCase()})}/>
          <label htmlFor="country-name">Country name</label><input id="country-name" required maxLength={200} disabled={busy} value={draft.countryName} onChange={e=>setDraft({...draft,countryName:e.target.value})}/>
          <label htmlFor="country-currency">Default currency</label><select id="country-currency" required disabled={busy} value={draft.defaultCurrency} onChange={e=>setDraft({...draft,defaultCurrency:e.target.value})}><option value="">Select active currency</option>
            {draft.defaultCurrency&&!active.some(c=>c.code===draft.defaultCurrency)&&<option value={draft.defaultCurrency} disabled>{draft.defaultCurrency} — inactive/unavailable</option>}
            {active.map(c=><option key={c.code} value={c.code}>{c.code} — {c.currency_name}</option>)}</select>
          <label htmlFor="country-decimals">Decimal places</label><input id="country-decimals" type="number" required min={0} max={4} step={1} disabled={busy} value={draft.decimalPlaces} onChange={e=>setDraft({...draft,decimalPlaces:Number(e.target.value)})}/>
          <label htmlFor="country-rounding">Rounding mode</label><select id="country-rounding" disabled={busy} value={draft.roundingMode} onChange={e=>setDraft({...draft,roundingMode:e.target.value})}>{['HALF_UP','FLOOR','CEIL'].map(v=><option key={v}>{v}</option>)}</select>
          <label htmlFor="regulatory-notes">Regulatory notes</label><textarea id="regulatory-notes" maxLength={4000} disabled={busy} value={draft.regulatoryNotes} onChange={e=>setDraft({...draft,regulatoryNotes:e.target.value})}/>
          <label htmlFor="retention-notes">Retention notes</label><textarea id="retention-notes" maxLength={4000} disabled={busy} value={draft.retentionNotes} onChange={e=>setDraft({...draft,retentionNotes:e.target.value})}/>
          {editing&&<label><input type="checkbox" disabled={busy} checked={draft.isActive} onChange={e=>setDraft({...draft,isActive:e.target.checked})}/>Country active</label>}
          <button disabled={busy} type="submit">Review country policy</button>{editing&&<button disabled={busy} type="button" onClick={reset}>Cancel country edit</button>}
        </form></>;
}
