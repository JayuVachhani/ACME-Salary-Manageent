import type { ReferencesModel } from '../use-organization-references';
export function ReferenceEditor({ model }: { model: ReferencesModel }) {
  const { name, setName, editing, active, setActive, busy, reset, submit } = model;
  return <><h3>{editing?'Edit reference':'Add reference'}</h3>
    <form onSubmit={submit}>
      <label htmlFor="reference-name">Reference name</label><input id="reference-name" required maxLength={200} value={name} disabled={busy} onChange={event=>setName(event.target.value)}/>
      {editing&&<label><input type="checkbox" checked={active} disabled={busy} onChange={event=>setActive(event.target.checked)}/>Reference active</label>}
      <button disabled={busy} type="submit">Review reference</button>
      {editing&&<button type="button" disabled={busy} onClick={reset}>Cancel reference edit</button>}
    </form></>;
}
