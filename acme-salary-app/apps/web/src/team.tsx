import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

type Account = { id:string; email:string; full_name:string; is_hr_manager:boolean; permissions:string[]; status:string; team_version:number; invite_expires_at:string|null };
const rights=['read','write','edit','delete','salary:view','export'];
export function Team({ userId,onSelfRemoved }: { userId:string; onSelfRemoved:()=>void }) {
  const [items,setItems]=useState<Account[]>([]); const [total,setTotal]=useState(0); const [offset,setOffset]=useState(0);
  const [editing,setEditing]=useState<Account|null>(null); const [name,setName]=useState(''); const [email,setEmail]=useState('');
  const [manager,setManager]=useState(false); const [permissions,setPermissions]=useState<string[]>(['read']);
  const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false); const [confirm,setConfirm]=useState<null|(()=>Promise<void>)>(null);
  const [confirmationDetails,setConfirmationDetails]=useState(''); const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(confirm&&!dialog.current?.open)dialog.current?.showModal();else if(!confirm&&dialog.current?.open)dialog.current.close();},[confirm]);
  async function api(path='',method='GET',body?:object) {
    const response=await fetch(`/api/v1/team${path}`, {method,headers:{'Content-Type':'application/json',
      'X-CSRF-Token':document.cookie.split('; ').find(s=>s.startsWith('acme_csrf='))?.slice(10)??''},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
    const result=await response.json(); if(!response.ok) throw new Error(result.message??'Team request failed'); return result;
  }
  async function load(page=offset) { const result=await api(`?offset=${page}`); setItems(result.items); setTotal(result.total); }
  useEffect(()=>{let active=true; api(`?offset=${offset}`).then(result=>{if(active){setItems(result.items);setTotal(result.total);}}).catch(error=>{if(active)setMessage(String(error.message));});return()=>{active=false;};},[offset]);
  function reset() {setEditing(null);setName('');setEmail('');setManager(false);setPermissions(['read']);}
  async function act(work:()=>Promise<void>) {setBusy(true);setMessage('');try{await work();}catch(error){setMessage(error instanceof Error?error.message:'Could not confirm the result. Refresh before retrying.');}finally{setBusy(false);setConfirm(null);}}
  function submit(event:FormEvent) {
    event.preventDefault(); setConfirmationDetails(`${editing?'Update':'Invite'} ${name} (${email}). Role: ${manager?'HR Manager with all permissions':'Team member'}. Selected permissions: ${permissions.join(', ')||'none'}.`); setConfirm(()=>async()=>{
      const details={fullName:name,isHrManager:manager,permissions};
      const result=editing?await api(`/${editing.id}`,'PATCH',{...details,expectedVersion:editing.team_version}):await api('','POST',{...details,email});
      setMessage(result.delivery==='failed'?'Invitation saved, but email delivery failed. Use Reinvite to retry.':editing?'Permissions saved.':'Invitation saved and email sent.');
      reset();await load();
    });
  }
  const self=editing?.id===userId;
  return <section className="team-panel" aria-labelledby="team-heading"><h2 id="team-heading">Team</h2>
    <p>Invite colleagues and manage access. HR Managers have all permissions. Removing access preserves historical records.</p>
    {message&&<p role="alert">{message}</p>}
    <button disabled={busy} onClick={()=>void act(()=>load())}>Refresh team</button>
    <div className="team-table"><table><caption>Team members</caption><thead><tr><th>Name and email</th><th>Role and permissions</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{items.map(account=><tr key={account.id}><td>{account.full_name}<br/>{account.email}{account.id===userId?' (you)':''}</td>
        <td>{account.is_hr_manager?'HR Manager — all permissions':account.permissions.join(', ')||'No permissions'}</td>
        <td>{account.status}{account.status==='INVITED'&&account.invite_expires_at&&<><br/>Expires {new Date(account.invite_expires_at).toLocaleDateString()}</>}</td>
        <td><button disabled={busy} aria-label={`Edit ${account.email}`} onClick={()=>{setEditing(account);setName(account.full_name);setEmail(account.email);setManager(account.is_hr_manager);setPermissions(account.permissions);}}>Edit</button>
          {account.status==='INVITED'&&<button disabled={busy} aria-label={`Reinvite ${account.email}`} onClick={()=>{setConfirmationDetails(`Renew ${account.email}'s invitation for 7 days, invalidate open sign-in codes, and send an invitation email.`);setConfirm(()=>async()=>{const result=await api(`/${account.id}/reinvite`,'POST',{expectedVersion:account.team_version});await load();setMessage(result.delivery==='failed'?'Invitation renewed; email delivery failed.':'Invitation renewed and email sent.');});}}>Reinvite</button>}
          <button disabled={busy} aria-label={`Remove ${account.email}`} onClick={()=>{setConfirmationDetails(`Remove access for ${account.full_name} (${account.email}). All sessions and open codes will be revoked. Historical attribution remains.`);setConfirm(()=>async()=>{await api(`/${account.id}`,'DELETE',{expectedVersion:account.team_version});if(account.id===userId){onSelfRemoved();return;}await load();setMessage('Account removed; access revoked.');});}}>Remove access</button></td></tr>)}</tbody></table></div>
    {!items.length&&<p>No team members on this page.</p>}
    <div className="team-pagination"><button disabled={busy||offset===0} onClick={()=>setOffset(Math.max(0,offset-20))}>Previous page</button><span>{total} members</span><button disabled={busy||offset+20>=total} onClick={()=>setOffset(offset+20)}>Next page</button></div>
    <form onSubmit={submit}><h3>{editing?'Edit team member':'Invite team member'}</h3>
      <label htmlFor="team-name">Full name</label><input id="team-name" required maxLength={200} value={name} onChange={event=>setName(event.target.value)} disabled={busy}/>
      <label htmlFor="team-email">Team email</label><input id="team-email" type="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy||Boolean(editing)}/>
      <label><input type="checkbox" checked={manager} disabled={busy||self} onChange={event=>setManager(event.target.checked)}/> HR Manager (all permissions)</label>
      <fieldset disabled={busy||self}><legend>Permissions</legend>{rights.map(right=><label key={right}><input type="checkbox" checked={permissions.includes(right)} onChange={event=>setPermissions(event.target.checked?[...permissions,right]:permissions.filter(value=>value!==right))}/>{right}</label>)}</fieldset>
      {self&&<p>Your own role and permissions cannot be changed here.</p>}
      <button disabled={busy} type="submit">{editing?'Save member':'Send invitation'}</button>{editing&&<button disabled={busy} type="button" onClick={reset}>Cancel edit</button>}
    </form>
    <dialog ref={dialog} onCancel={event=>{if(busy)event.preventDefault();else setConfirm(null);}} aria-labelledby="confirm-team" className="team-confirm"><h3 id="confirm-team">Confirm team change</h3><p>{confirmationDetails}</p><p>Changes take effect immediately.</p><button autoFocus disabled={busy} onClick={()=>{if(confirm)void act(confirm);}}>{busy?'Saving…':'Confirm change'}</button><button disabled={busy} onClick={()=>setConfirm(null)}>Cancel change</button></dialog>
  </section>;
}
