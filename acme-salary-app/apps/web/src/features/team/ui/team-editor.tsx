import { Button } from '../../../shared/ui/button';
import { Checkbox, Form, TextInput } from '../../../shared/ui/form-controls';
import type { TeamModel } from '../use-team';
import { rights } from '../types';
export function TeamEditor({ model }: { model: TeamModel }) {
  const { editing, name, setName, email, setEmail, manager, setManager, permissions, setPermissions, busy, self, reset, submit } = model;
  return <><Form onSubmit={submit}><h3>{editing?'Edit team member':'Invite team member'}</h3>
      <TextInput label="Full name" id="team-name" required maxLength={200} value={name} onChange={event=>setName(event.target.value)} disabled={busy}/>
      <TextInput label="Team email" id="team-email" type="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy||Boolean(editing)}/>
      <Checkbox label="HR Manager (all permissions)" checked={manager} disabled={busy||self} onChange={event=>setManager(event.target.checked)}/>
      <fieldset disabled={busy||self}><legend>Permissions</legend>{rights.map(right=><Checkbox key={right} label={right} checked={permissions.includes(right)} onChange={event=>setPermissions(event.target.checked?[...permissions,right]:permissions.filter(value=>value!==right))}/>)}</fieldset>
      {self&&<p>Your own role and permissions cannot be changed here.</p>}
      <Button busy={busy} busyLabel="Saving…" type="submit">{editing?'Save member':'Send invitation'}</Button>{editing&&<Button disabled={busy} type="button" onClick={reset}>Cancel edit</Button>}
    </Form></>;
}
