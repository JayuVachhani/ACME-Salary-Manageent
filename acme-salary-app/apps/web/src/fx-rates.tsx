import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
type Rate={id:string;base_currency:string;quote_currency:string;effective_date:string;revision:number;rate:string;source:string;reason:string;created_by:string;recorded_at:string};
type Currency={code:string;is_active:boolean;supported:boolean};
type Resolution={rate:string;maxStalenessDays:number;path:{inverse:boolean;rate:{id:string;base:string;quote:string;rate:string;effectiveDate:string;revision:number;source:string}}[]};
export function FxRates({isHrManager}:{isHrManager:boolean}){
  const [items,setItems]=useState<Rate[]>([]),[total,setTotal]=useState(0),[offset,setOffset]=useState(0),[currencies,setCurrencies]=useState<Currency[]>([]);
  const [filter,setFilter]=useState({base:'',quote:'',asOf:''}),[applied,setApplied]=useState({base:'',quote:'',asOf:''});
  const [draft,setDraft]=useState({base:'',quote:'',effectiveDate:'',rate:'',source:'',reason:''}),[revision,setRevision]=useState<number|null>(null);
  const [lookup,setLookup]=useState({base:'',quote:'',asOf:''}),[resolved,setResolved]=useState<Resolution|null>(null);
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
  const [pending,setPending]=useState<null|{input:typeof draft;expectedRevision:number}>(null);const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(pending&&!dialog.current?.open)dialog.current?.showModal();else if(!pending&&dialog.current?.open)dialog.current.close();},[pending]);
  async function api(path:string,body?:object){const response=await fetch(`/api/v1/${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',
    'X-CSRF-Token':document.cookie.split('; ').find(v=>v.startsWith('acme_csrf='))?.slice(10)??''},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
    const data=await response.json();if(!response.ok)throw new Error(data.message??'FX request failed');return data;
  }
  function query(values:Record<string,string|number>){return new URLSearchParams(Object.entries(values).filter(([,value])=>value!=='').map(([key,value])=>[key,String(value)])).toString();}
  async function refresh(){const value=await api(`fx-rates?${query({...applied,offset})}`);setItems(value.items);setTotal(value.total);}
  useEffect(()=>{let current=true;Promise.all([api(`fx-rates?${query({...applied,offset})}`),api('currency-catalogue')]).then(([rows,catalogue])=>{
    if(current){setItems(rows.items);setTotal(rows.total);setCurrencies(catalogue.items);}
  }).catch(error=>{if(current)setMessage(error.message);}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[applied,offset]);
  async function perform(work:()=>Promise<void>){setBusy(true);setMessage('');try{await work();}catch(error){setMessage(error instanceof Error?error.message:'Result uncertain; refresh before retrying.');}finally{setBusy(false);setPending(null);}}
  async function currentRevision(base:string,quote:string,effectiveDate:string){const rows=await api(`fx-rates?${query({base,quote,asOf:effectiveDate})}`);return rows.items[0]?.effective_date===effectiveDate?rows.items[0].revision as number:0;}
  function writeSubmit(event:FormEvent){event.preventDefault();if(revision===null){setMessage('Load the current revision before reviewing a rate.');return;}setPending({input:{...draft},expectedRevision:revision});}
  const active=currencies.filter(c=>c.is_active&&c.supported);
  return <section className="team-panel" aria-labelledby="fx-heading"><h2 id="fx-heading">Exchange rates</h2>
    <p>Rates are effective-dated and corrections append history. A rate means one unit of the base currency equals the entered amount of the quote currency.</p>
    {message&&<p role="alert">{message}</p>}
    <form onSubmit={event=>{event.preventDefault();setLoading(true);setOffset(0);setApplied({...filter});}}>
      <label htmlFor="fx-filter-base">Filter base currency</label><input id="fx-filter-base" maxLength={3} pattern="[A-Z]{3}" value={filter.base} onChange={e=>setFilter({...filter,base:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-filter-quote">Filter quote currency</label><input id="fx-filter-quote" maxLength={3} pattern="[A-Z]{3}" value={filter.quote} onChange={e=>setFilter({...filter,quote:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-filter-date">History through date</label><input id="fx-filter-date" type="date" value={filter.asOf} onChange={e=>setFilter({...filter,asOf:e.target.value})}/>
      <button disabled={busy} type="submit">Apply FX filters</button>
    </form>
    <button disabled={busy||loading} onClick={()=>void perform(refresh)}>Refresh FX history</button>
    {loading?<p role="status">Loading exchange rates…</p>:<><div className="team-table" tabIndex={0} role="region" aria-label="Scrollable FX history"><table><caption>FX revision history</caption><thead><tr><th>Pair and date</th><th>Rate / revision</th><th>Provenance</th>{isHrManager&&<th>Actions</th>}</tr></thead><tbody>
      {items.map(row=><tr key={row.id}><td>{row.base_currency} → {row.quote_currency}<br/>{row.effective_date}</td><td>{row.rate}<br/>Revision {row.revision}</td><td>{row.source}<br/>{row.reason}<br/>User {row.created_by}<br/>{row.recorded_at}</td>
        {isHrManager&&<td><button disabled={busy} aria-label={`Prepare FX revision ${row.id}`} onClick={()=>void perform(async()=>{
          const latest=await currentRevision(row.base_currency,row.quote_currency,row.effective_date);setDraft({base:row.base_currency,quote:row.quote_currency,effectiveDate:row.effective_date,rate:row.rate,source:row.source,reason:''});setRevision(latest);setMessage(`Loaded current revision ${latest}. Enter a reason and review the new revision.`);
        })}>Prepare correction</button></td>}</tr>)}
    </tbody></table></div>{!items.length&&<p>No exchange rate revisions match.</p>}<p>{total} FX revisions. Page {Math.floor(offset/20)+1}.</p>
      <button disabled={busy||offset===0} onClick={()=>{setLoading(true);setOffset(offset-20);}}>Previous FX page</button><button disabled={busy||offset+20>=total} onClick={()=>{setLoading(true);setOffset(offset+20);}}>Next FX page</button></>}
    {isHrManager&&<><h3>Add FX revision</h3><p>Only active currencies are available for new revisions. No existing rate is overwritten or deleted.</p>
      <form onSubmit={writeSubmit}>
        <label htmlFor="fx-base">Rate base currency</label><select id="fx-base" required disabled={busy} value={draft.base} onChange={e=>{setDraft({...draft,base:e.target.value});setRevision(null);}}><option value="">Choose base</option>{draft.base&&!active.some(c=>c.code===draft.base)&&<option disabled value={draft.base}>{draft.base} — inactive</option>}{active.map(c=><option key={c.code}>{c.code}</option>)}</select>
        <label htmlFor="fx-quote">Rate quote currency</label><select id="fx-quote" required disabled={busy} value={draft.quote} onChange={e=>{setDraft({...draft,quote:e.target.value});setRevision(null);}}><option value="">Choose quote</option>{draft.quote&&!active.some(c=>c.code===draft.quote)&&<option disabled value={draft.quote}>{draft.quote} — inactive</option>}{active.map(c=><option key={c.code}>{c.code}</option>)}</select>
        <label htmlFor="fx-date">Rate effective date</label><input id="fx-date" required type="date" disabled={busy} value={draft.effectiveDate} onChange={e=>{setDraft({...draft,effectiveDate:e.target.value});setRevision(null);}}/>
        <button type="button" disabled={busy||!draft.base||!draft.quote||!draft.effectiveDate||draft.base===draft.quote} onClick={()=>void perform(async()=>{const v=await currentRevision(draft.base,draft.quote,draft.effectiveDate);setRevision(v);setMessage(`Current revision ${v}; next revision ${v+1}.`);})}>Load current FX revision</button>
        <label htmlFor="fx-rate">FX rate</label><input id="fx-rate" required inputMode="decimal" pattern="(0|[1-9][0-9]{0,9})(\.[0-9]{1,8})?" maxLength={19} disabled={busy} value={draft.rate} onChange={e=>setDraft({...draft,rate:e.target.value})}/>
        <label htmlFor="fx-source">Rate source</label><input id="fx-source" required maxLength={500} disabled={busy} value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})}/>
        <label htmlFor="fx-reason">Revision reason</label><textarea id="fx-reason" required maxLength={2000} disabled={busy} value={draft.reason} onChange={e=>setDraft({...draft,reason:e.target.value})}/>
        <button disabled={busy||revision===null} type="submit">Review FX revision</button>
      </form></>}
    <h3>Historical FX lookup</h3><form onSubmit={event=>{event.preventDefault();setResolved(null);void perform(async()=>{setResolved(await api(`fx-rates/resolve?${query(lookup)}`));});}}>
      <label htmlFor="fx-lookup-base">Lookup base currency</label><input id="fx-lookup-base" required pattern="[A-Z]{3}" maxLength={3} value={lookup.base} onChange={e=>setLookup({...lookup,base:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-lookup-quote">Lookup quote currency</label><input id="fx-lookup-quote" required pattern="[A-Z]{3}" maxLength={3} value={lookup.quote} onChange={e=>setLookup({...lookup,quote:e.target.value.toUpperCase()})}/>
      <label htmlFor="fx-lookup-date">Lookup as-of date</label><input id="fx-lookup-date" type="date" required value={lookup.asOf} onChange={e=>setLookup({...lookup,asOf:e.target.value})}/>
      <button disabled={busy} type="submit">Resolve historical FX</button>
    </form>
    {resolved&&<div role="status" style={{overflowWrap:'anywhere'}}><p>Resolved unit rate: {resolved.rate}. Maximum staleness: {resolved.maxStalenessDays} days.</p>
      {!resolved.path.length&&<p>Same currency: unit factor 1; no FX revision required.</p>}{resolved.path.map(leg=><p key={leg.rate.id}>{leg.inverse?'Inverse':'Direct'} {leg.rate.base} → {leg.rate.quote}, effective {leg.rate.effectiveDate}, revision {leg.rate.revision}, source {leg.rate.source}, rate ID {leg.rate.id}.</p>)}
    </div>}
    <dialog ref={dialog} aria-labelledby="fx-confirm-heading" onCancel={event=>{event.preventDefault();if(!busy)setPending(null);}}><h3 id="fx-confirm-heading">Confirm FX revision</h3>
      <p>Append revision {pending?pending.expectedRevision+1:''}: 1 {pending?.input.base} = {pending?.input.rate} {pending?.input.quote}, effective {pending?.input.effectiveDate}. Current revision {pending?.expectedRevision}. Source: {pending?.input.source}. Reason: {pending?.input.reason}. Previous history is retained.</p>
      <button disabled={busy} onClick={()=>setPending(null)}>Cancel FX change</button><button disabled={busy} onClick={()=>void perform(async()=>{if(!pending)return;const saved=await api('fx-rates',{...pending.input,expectedRevision:pending.expectedRevision});setRevision(saved.revision);setDraft({...pending.input,reason:''});await refresh();setMessage('FX revision saved.');})}>{busy?'Saving FX…':'Confirm FX change'}</button>
    </dialog>
  </section>;
}
