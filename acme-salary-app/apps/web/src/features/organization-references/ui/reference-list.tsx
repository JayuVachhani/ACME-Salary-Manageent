import { OffsetPagination } from '../../../shared/ui/pagination';
import { DataTable } from '../../../shared/ui/data-table';
import { RequestState, EmptyState } from '../../../shared/ui/request-state';
import { Button } from '../../../shared/ui/button';
import type { ReferencesModel } from '../use-organization-references';
export function ReferenceList({ model }: { model: ReferencesModel }) {
  const { kind, offset, setOffset, items, total, busy, loading, error, edit } = model;
  return <RequestState loading={loading} error={error} loadingMessage="Loading references…">
      <DataTable caption={kind==='departments'?'Departments':'Designations'} head={<tr><th>Name</th><th>Status</th><th>Actions</th></tr>}>{items.map(item=><tr key={item.id}><td>{item.name}</td><td>{item.is_active?'Active':'Inactive'}</td><td><Button disabled={busy} aria-label={`Edit reference ${item.name}`} onClick={()=>edit(item)}>Edit</Button></td></tr>)}</DataTable>
      {!items.length&&<EmptyState>No {kind} yet.</EmptyState>}
      <OffsetPagination label="References" offset={offset} pageSize={20} total={total} disabled={busy} onOffsetChange={setOffset} previousLabel="Previous references" nextLabel="Next references" summary={`${total} ${kind}. Page ${Math.floor(offset / 20) + 1}.`} />
    </RequestState>;
}
