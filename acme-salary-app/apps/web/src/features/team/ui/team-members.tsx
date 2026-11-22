import type { TeamModel } from '../use-team';
export function TeamMembers({ model }: { model: TeamModel }) {
  const { userId, items, total, offset, setOffset, busy, edit, reviewReinvite, reviewRemove } = model;
  return <><div className="team-table"><table><caption>Team members</caption><thead><tr><th>Name and email</th><th>Role and permissions</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{items.map(account=><tr key={account.id}><td>{account.full_name}<br/>{account.email}{account.id===userId?' (you)':''}</td>
        <td>{account.is_hr_manager?'HR Manager — all permissions':account.permissions.join(', ')||'No permissions'}</td>
        <td>{account.status}{account.status==='INVITED'&&account.invite_expires_at&&<><br/>Expires {new Date(account.invite_expires_at).toLocaleDateString()}</>}</td>
        <td><button disabled={busy} aria-label={`Edit ${account.email}`} onClick={()=>edit(account)}>Edit</button>
          {account.status==='INVITED'&&<button disabled={busy} aria-label={`Reinvite ${account.email}`} onClick={()=>reviewReinvite(account)}>Reinvite</button>}
          <button disabled={busy} aria-label={`Remove ${account.email}`} onClick={()=>reviewRemove(account)}>Remove access</button></td></tr>)}</tbody></table></div>
    {!items.length&&<p>No team members on this page.</p>}
    <div className="team-pagination"><button disabled={busy||offset===0} onClick={()=>setOffset(Math.max(0,offset-20))}>Previous page</button><span>{total} members</span><button disabled={busy||offset+20>=total} onClick={()=>setOffset(offset+20)}>Next page</button></div>
    </>;
}
