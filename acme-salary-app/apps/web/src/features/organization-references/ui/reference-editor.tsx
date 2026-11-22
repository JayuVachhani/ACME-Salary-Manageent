import { Button } from '../../../shared/ui/button';
import { Checkbox, Form, TextInput } from '../../../shared/ui/form-controls';
import type { ReferencesModel } from '../use-organization-references';
export function ReferenceEditor({ model }: { model: ReferencesModel }) {
  const { name, setName, editing, active, setActive, busy, reset, submit } = model;
  return <><h3>{editing?'Edit reference':'Add reference'}</h3>
    <Form onSubmit={submit}>
      <TextInput label="Reference name" id="reference-name" required maxLength={200} value={name} disabled={busy} onChange={event=>setName(event.target.value)}/>
      {editing&&<Checkbox label="Reference active" checked={active} disabled={busy} onChange={event=>setActive(event.target.checked)}/>}
      <Button busy={busy} busyLabel="Saving…" type="submit">Review reference</Button>
      {editing&&<Button type="button" disabled={busy} onClick={reset}>Cancel reference edit</Button>}
    </Form></>;
}
