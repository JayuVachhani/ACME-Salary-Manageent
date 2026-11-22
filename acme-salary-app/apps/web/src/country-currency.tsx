import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
type Currency={code:string;currency_name:string;minor_units:number|null;configured_minor_units:number|null;is_active:boolean;version:number;supported:boolean;published_on:string;source:string};
type Country={country_code:string;country_name:string;default_currency:string;decimal_places:number;rounding_mode:string;regulatory_notes:string|null;retention_notes:string|null;is_active:boolean;version:number};
type Draft={countryCode:string;countryName:string;defaultCurrency:string;decimalPlaces:number;roundingMode:string;regulatoryNotes:string;retentionNotes:string;isActive:boolean};
const empty:Draft={countryCode:'',countryName:'',defaultCurrency:'',decimalPlaces:2,roundingMode:'HALF_UP',regulatoryNotes:'',retentionNotes:'',isActive:true};
export function CountryCurrency({isHrManager}:{isHrManager:boolean}){
  const [catalogue,setCatalogue]=useState<Currency[]>([]),[countries,setCountries]=useState<Country[]>([]),[total,setTotal]=useState(0),[offset,setOffset]=useState(0);
  const [search,setSearch]=useState(''),[draft,setDraft]=useState<Draft>(empty),[editing,setEditing]=useState<Country|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [confirmation,setConfirmation]=useState<null|{details:string;save:()=>Promise<void>}>(null);const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(confirmation&&!dialog.current?.open)dialog.current?.showModal();else if(!confirmation&&dialog.current?.open)dialog.current.close();},[confirmation]);
  async function api(path:string,method='GET',body?:object){
    const response=await fetch(`/api/v1/${path}`,{method,headers:{'Content-Type':'application/json','X-CSRF-Token':document.cookie.split('; ').find(v=>v.startsWith('acme_csrf='))?.slice(10)??''},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
    const value=await response.json();if(!response.ok)throw new Error(value.message??'Country/currency request failed');return value;
  }
  async function load(page=offset){const [c,r]=await Promise.all([api('currency-catalogue'),isHrManager?api(`countries?offset=${page}`):Promise.resolve({items:[],total:0})]);return {catalogue:c.items,countries:r.items,total:r.total};}
  function apply(value:{catalogue:Currency[];countries:Country[];total:number}){setCatalogue(value.catalogue);setCountries(value.countries);setTotal(value.total);}
  useEffect(()=>{let current=true;load(offset).then(value=>{if(current)apply(value);}).catch(error=>{if(current)setMessage(error.message);}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[offset,isHrManager]);
  async function perform(work:()=>Promise<void>){setBusy(true);setMessage('');try{await work();}catch(error){setMessage(error instanceof Error?error.message:'Result uncertain; refresh before retrying.');}finally{setBusy(false);setConfirmation(null);}}
  function reset(){setDraft(empty);setEditing(null);}
  function edit(country:Country){setEditing(country);setDraft({countryCode:country.country_code,countryName:country.country_name,defaultCurrency:country.default_currency,decimalPlaces:country.decimal_places,roundingMode:country.rounding_mode,
    regulatoryNotes:country.regulatory_notes??'',retentionNotes:country.retention_notes??'',isActive:country.is_active});}
  function submit(event:FormEvent){
    event.preventDefault();if(!draft.countryName.trim()){setMessage('Enter a country name.');return;}
    const value={...draft};const target=editing;
    setConfirmation({details:`${target?'Update':'Create'} ${value.countryName.trim()} (${value.countryCode}). Currency ${value.defaultCurrency}; ${value.decimalPlaces} decimal places; ${value.roundingMode}; ${value.isActive?'Active':'Inactive'}. Regulatory notes: ${value.regulatoryNotes||'none'}. Retention notes: ${value.retentionNotes||'none'}. Notes do not enforce legal retention. Historical salary snapshots stay unchanged.`,save:async()=>{
      const {isActive,countryCode,...fields}=value;
      await api(`countries${target?`/${target.country_code}`:''}`,target?'PATCH':'POST',target?{...fields,isActive,expectedVersion:target.version}:{...fields,countryCode});
      reset();apply(await load());setMessage('Country saved.');
    }});
  }
  const active=catalogue.filter(c=>c.is_active&&c.supported);
  const filtered=catalogue.filter(c=>`${c.code} ${c.currency_name}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="team-panel" aria-labelledby="country-currency-heading"><h2 id="country-currency-heading">Countries and currencies</h2>
    <p>ISO codes and minor units are read-only. Country policies apply to new salary records; historical snapshots remain unchanged.</p>
    {message&&<p role="alert">{message}</p>}
    <button disabled={busy||loading} onClick={()=>void perform(async()=>{apply(await load());})}>Refresh countries and currencies</button>
    {loading?<p role="status">Loading countries and currencies…</p>:<>
      <h3>Currency catalogue</h3><p>SIX ISO 4217 snapshot: {catalogue[0]?.published_on??'unavailable'}. Entries with N.A. minor units are unavailable for salary use.</p>
      <label htmlFor="currency-search">Find currency</label><input id="currency-search" value={search} onChange={event=>setSearch(event.target.value)} maxLength={100}/>
      <div className="team-table"><table><caption>ISO currency catalogue</caption><thead><tr><th>Code and name</th><th>Minor units</th><th>Status</th>{isHrManager&&<th>Actions</th>}</tr></thead><tbody>
        {filtered.map(currency=><tr key={currency.code}><td>{currency.code} — {currency.currency_name}</td><td>{currency.minor_units??'N.A.'}</td><td>{currency.is_active?'Active':'Inactive'}{!currency.supported?' — unavailable for salary use':''}</td>
          {isHrManager&&<td><button disabled={busy||(!currency.supported&&!currency.is_active)} aria-label={`${currency.is_active?'Deactivate':'Activate'} currency ${currency.code}`} onClick={()=>setConfirmation({details:`${currency.is_active?'Deactivate':'Activate'} ${currency.code}. ${currency.minor_units??'N.A.'} minor units. Deactivation blocks new financial records using this currency, including active countries that still reference it. Existing history is retained.`,save:async()=>{
            await api(`currencies/${currency.code}`,'PATCH',{isActive:!currency.is_active,expectedVersion:currency.version});apply(await load());setMessage('Currency status saved.');
          }})}>{currency.is_active?'Deactivate':'Activate'}</button></td>}</tr>)}
      </tbody></table></div>{!filtered.length&&<p>No currencies match.</p>}
      {isHrManager&&<><h3>Country policies</h3><p>Regulatory and retention notes are descriptive. Active retention holds remain enforced separately. Country codes are immutable two-letter organization identifiers; no complete ISO country catalogue is claimed.</p>
        <div className="team-table"><table><caption>Country policies</caption><thead><tr><th>Country</th><th>Policy</th><th>Status</th><th>Actions</th></tr></thead><tbody>{countries.map(country=><tr key={country.country_code}>
          <td>{country.country_name} ({country.country_code})</td><td>{country.default_currency}; {country.decimal_places} decimals; {country.rounding_mode}</td><td>{country.is_active?'Active':'Inactive'}</td>
          <td><button disabled={busy} aria-label={`Edit country ${country.country_code}`} onClick={()=>edit(country)}>Edit</button></td></tr>)}</tbody></table></div>
        {!countries.length&&<p>No country policies yet.</p>}<p>{total} countries. Page {Math.floor(offset/20)+1}.</p>
        <button disabled={busy||offset===0} onClick={()=>{setLoading(true);setOffset(offset-20);}}>Previous countries</button>
        <button disabled={busy||offset+20>=total} onClick={()=>{setLoading(true);setOffset(offset+20);}}>Next countries</button>
        <h3>{editing?'Edit country policy':'Add country policy'}</h3>
        <form onSubmit={submit}>
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
        </form>
      </>}
    </>}
    <dialog ref={dialog} aria-labelledby="country-confirm-heading" onCancel={event=>{event.preventDefault();if(!busy)setConfirmation(null);}}><h3 id="country-confirm-heading">Confirm country or currency change</h3><p>{confirmation?.details}</p>
      <button disabled={busy} onClick={()=>setConfirmation(null)}>Cancel policy change</button><button disabled={busy} onClick={()=>void perform(async()=>{await confirmation?.save();})}>{busy?'Saving policy…':'Confirm policy change'}</button>
    </dialog>
  </section>;
}
