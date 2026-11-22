import type { CountryCurrencyModel } from '../use-country-currency';
export function CurrencyCatalogue({ model }: { model: CountryCurrencyModel }) {
  const { isHrManager, catalogue, search, setSearch, busy, reviewCurrency, filtered } = model;
  return <><h3>Currency catalogue</h3><p>SIX ISO 4217 snapshot: {catalogue[0]?.published_on??'unavailable'}. Entries with N.A. minor units are unavailable for salary use.</p>
      <label htmlFor="currency-search">Find currency</label><input id="currency-search" value={search} onChange={event=>setSearch(event.target.value)} maxLength={100}/>
      <div className="team-table"><table><caption>ISO currency catalogue</caption><thead><tr><th>Code and name</th><th>Minor units</th><th>Status</th>{isHrManager&&<th>Actions</th>}</tr></thead><tbody>
        {filtered.map(currency=><tr key={currency.code}><td>{currency.code} — {currency.currency_name}</td><td>{currency.minor_units??'N.A.'}</td><td>{currency.is_active?'Active':'Inactive'}{!currency.supported?' — unavailable for salary use':''}</td>
          {isHrManager&&<td><button disabled={busy||(!currency.supported&&!currency.is_active)} aria-label={`${currency.is_active?'Deactivate':'Activate'} currency ${currency.code}`} onClick={()=>reviewCurrency(currency)}>{currency.is_active?'Deactivate':'Activate'}</button></td>}</tr>)}
      </tbody></table></div>{!filtered.length&&<p>No currencies match.</p>}
      </>;
}
