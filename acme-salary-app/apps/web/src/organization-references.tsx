import { useEffect,useRef,useState } from 'react';
import type { FormEvent } from 'react';

type Reference={id:string;name:string;is_active:boolean;version:number};
type Kind='departments'|'designations';
export function OrganizationReferences() {
  const [kind,setKind]=useState<Kind>('departments');
  const [items,setItems]=useState<Reference[]>([]),[total,setTotal]=useState(0),[offset,setOffset]=useState(0);
  const [name,setName]=useState(''),[editing,setEditing]=useState<Reference|null>(null),[active,setActive]=useState(true);
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
  const [pending,setPending]=useState<null|{kind:Kind;name:string;isActive:boolean;editing:Reference|null}>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(pending&&!dialog.current?.open)dialog.current?.showModal();else if(!pending&&dialog.current?.open)dialog.current.close();},[pending]);
  async function api(path:string,method='GET',body?:object) {
    const response=await fetch(`/api/v1/organization-references/${path}`,{method,headers:{'Content-Type':'application/json',
      'X-CSRF-Token':document.cookie.split('; ').find(v=>v.startsWith('acme_csrf='))?.slice(10)??''},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
    const result=await response.json();if(!response.ok)throw new Error(result.message??'Reference request failed');return result;
  }
  useEffect(()=>{
    let current=true;api(`${kind}?offset=${offset}`).then(result=>{if(current){setItems(result.items);setTotal(result.total);}})
      .catch(error=>{if(current)setMessage(error.message);}).finally(()=>{if(current)setLoading(false);});
    return()=>{current=false;};
  },[kind,offset]);
  function reset(){setEditing(null);setName('');setActive(true);}
  async function refresh(){const result=await api(`${kind}?offset=${offset}`);setItems(result.items);setTotal(result.total);}
  async function perform(work:()=>Promise<void>){setBusy(true);setMessage('');try{await work();}catch(error){setMessage(error instanceof Error?error.message:'Result uncertain. Refresh before retrying.');}finally{setBusy(false);setPending(null);}}
  function submit(event:FormEvent){event.preventDefault();if(!name.trim()){setMessage('Enter a reference name.');return;}setPending({kind,name:name.trim(),isActive:active,editing});}
  return <section className="team-panel" aria-labelledby="organization-heading">
    <h2 id="organization-heading">Organization references</h2>
    <p>Manage departments and designations. Inactive entries remain in history and cannot be used for new assignments.</p>
    <label htmlFor="reference-kind">Reference type</label><select id="reference-kind" value={kind} disabled={busy||Boolean(pending)} onChange={event=>{
      setKind(event.target.value as Kind);setOffset(0);setItems([]);setTotal(0);setLoading(true);setMessage('');reset();
    }}><option value="departments">Departments</option><option value="designations">Designations</option></select>
    {message&&<p role="alert">{message}</p>}
    <button disabled={busy||loading} onClick={()=>void perform(refresh)}>Refresh references</button>
    {loading?<p role="status">Loading references…</p>:<>
      <div className="team-table"><table><caption>{kind==='departments'?'Departments':'Designations'}</caption><thead><tr><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item=><tr key={item.id}><td>{item.name}</td><td>{item.is_active?'Active':'Inactive'}</td><td><button disabled={busy} aria-label={`Edit reference ${item.name}`} onClick={()=>{setEditing(item);setName(item.name);setActive(item.is_active);}}>Edit</button></td></tr>)}</tbody></table></div>
      {!items.length&&<p>No {kind} yet.</p>}
      <p>{total} {kind}. Page {Math.floor(offset/20)+1}.</p>
      <button disabled={busy||offset===0} onClick={()=>{setLoading(true);setOffset(offset-20);}}>Previous references</button>
      <button disabled={busy||offset+20>=total} onClick={()=>{setLoading(true);setOffset(offset+20);}}>Next references</button>
    </>}
    <h3>{editing?'Edit reference':'Add reference'}</h3>
    <form onSubmit={submit}>
      <label htmlFor="reference-name">Reference name</label><input id="reference-name" required maxLength={200} value={name} disabled={busy} onChange={event=>setName(event.target.value)}/>
      {editing&&<label><input type="checkbox" checked={active} disabled={busy} onChange={event=>setActive(event.target.checked)}/>Reference active</label>}
      <button disabled={busy} type="submit">Review reference</button>
      {editing&&<button type="button" disabled={busy} onClick={reset}>Cancel reference edit</button>}
    </form>
    <dialog ref={dialog} onCancel={event=>{event.preventDefault();if(!busy)setPending(null);}} aria-labelledby="reference-confirm-heading">
      <h3 id="reference-confirm-heading">Confirm reference</h3>
      <p>{pending?.kind}: {pending?.name}. Status: {pending?.isActive?'Active':'Inactive'}. Historical records will be preserved.</p>
      <button disabled={busy} onClick={()=>setPending(null)}>Cancel reference change</button>
      <button disabled={busy} onClick={()=>void perform(async()=>{
        if(!pending)return;
        await api(`${pending.kind}${pending.editing?`/${pending.editing.id}`:''}`,pending.editing?'PATCH':'POST',pending.editing?
          {name:pending.name,isActive:pending.isActive,expectedVersion:pending.editing.version}:{name:pending.name});
        reset();await refresh();setMessage('Reference saved.');
      })}>{busy?'Saving reference…':'Confirm reference change'}</button>
    </dialog>
  </section>;
}
