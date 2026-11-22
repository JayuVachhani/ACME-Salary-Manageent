import type { ReferencesModel } from '../use-organization-references';
export function ReferenceList({ model }: { model: ReferencesModel }) {
  const { kind, offset, setOffset, items, total, busy, loading, edit } = model;
  return <>{loading?<p role="status">Loading references…</p>:<>
      <div className="team-table"><table><caption>{kind==='departments'?'Departments':'Designations'}</caption><thead><tr><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item=><tr key={item.id}><td>{item.name}</td><td>{item.is_active?'Active':'Inactive'}</td><td><button disabled={busy} aria-label={`Edit reference ${item.name}`} onClick={()=>edit(item)}>Edit</button></td></tr>)}</tbody></table></div>
      {!items.length&&<p>No {kind} yet.</p>}
      <p>{total} {kind}. Page {Math.floor(offset/20)+1}.</p>
      <button disabled={busy||offset===0} onClick={()=>{setOffset(offset-20);}}>Previous references</button>
      <button disabled={busy||offset+20>=total} onClick={()=>{setOffset(offset+20);}}>Next references</button>
    </>}
    </>;
}
