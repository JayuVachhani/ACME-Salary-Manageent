import type { TeamModel } from '../use-team';
import { rights } from '../types';
export function TeamEditor({ model }: { model: TeamModel }) {
  const { editing, name, setName, email, setEmail, manager, setManager, permissions, setPermissions, busy, self, reset, submit } = model;
  return <><form onSubmit={submit}><h3>{editing?'Edit team member':'Invite team member'}</h3>
      <label htmlFor="team-name">Full name</label><input id="team-name" required maxLength={200} value={name} onChange={event=>setName(event.target.value)} disabled={busy}/>
      <label htmlFor="team-email">Team email</label><input id="team-email" type="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy||Boolean(editing)}/>
      <label><input type="checkbox" checked={manager} disabled={busy||self} onChange={event=>setManager(event.target.checked)}/> HR Manager (all permissions)</label>
      <fieldset disabled={busy||self}><legend>Permissions</legend>{rights.map(right=><label key={right}><input type="checkbox" checked={permissions.includes(right)} onChange={event=>setPermissions(event.target.checked?[...permissions,right]:permissions.filter(value=>value!==right))}/>{right}</label>)}</fieldset>
      {self&&<p>Your own role and permissions cannot be changed here.</p>}
      <button disabled={busy} type="submit">{editing?'Save member':'Send invitation'}</button>{editing&&<button disabled={busy} type="button" onClick={reset}>Cancel edit</button>}
    </form></>;
}
