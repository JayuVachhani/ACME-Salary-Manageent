import type { FxRatesModel } from '../use-fx-rates';
export function FxHistory({ model }: { model: FxRatesModel }) {
  const { isHrManager, items, total, offset, setOffset, filter, setFilter, busy, loading, applyFilters, refresh, prepareCorrection } = model;
  return <><form onSubmit={applyFilters}>
      <label htmlFor="fx-filter-base">Filter base currency</label><input id="fx-filter-base" maxLength={3} pattern="[A-Z]{3}" value={filter.base} onChange={e=>setFilter({...filter,base:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-filter-quote">Filter quote currency</label><input id="fx-filter-quote" maxLength={3} pattern="[A-Z]{3}" value={filter.quote} onChange={e=>setFilter({...filter,quote:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-filter-date">History through date</label><input id="fx-filter-date" type="date" value={filter.asOf} onChange={e=>setFilter({...filter,asOf:e.target.value})}/>
      <button disabled={busy} type="submit">Apply FX filters</button>
    </form>
    <button disabled={busy||loading} onClick={refresh}>Refresh FX history</button>
    {loading?<p role="status">Loading exchange rates…</p>:<><div className="team-table" tabIndex={0} role="region" aria-label="Scrollable FX history"><table><caption>FX revision history</caption><thead><tr><th>Pair and date</th><th>Rate / revision</th><th>Provenance</th>{isHrManager&&<th>Actions</th>}</tr></thead><tbody>
      {items.map(row=><tr key={row.id}><td>{row.base_currency} → {row.quote_currency}<br/>{row.effective_date}</td><td>{row.rate}<br/>Revision {row.revision}</td><td>{row.source}<br/>{row.reason}<br/>User {row.created_by}<br/>{row.recorded_at}</td>
        {isHrManager&&<td><button disabled={busy} aria-label={`Prepare FX revision ${row.id}`} onClick={()=>prepareCorrection(row)}>Prepare correction</button></td>}</tr>)}
    </tbody></table></div>{!items.length&&<p>No exchange rate revisions match.</p>}<p>{total} FX revisions. Page {Math.floor(offset/20)+1}.</p>
      <button disabled={busy||offset===0} onClick={()=>{setOffset(offset-20);}}>Previous FX page</button><button disabled={busy||offset+20>=total} onClick={()=>{setOffset(offset+20);}}>Next FX page</button></>}
    </>;
}
