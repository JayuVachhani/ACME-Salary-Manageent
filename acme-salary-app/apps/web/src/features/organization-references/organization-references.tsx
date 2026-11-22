import { ActionFeedback } from '../../shared/ui/action-feedback';
import { Button } from '../../shared/ui/button';
import { Select } from '../../shared/ui/form-controls';
import { ReferenceList } from './ui/reference-list';
import { ReferenceEditor } from './ui/reference-editor';
import { useOrganizationReferences } from './use-organization-references';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
export function OrganizationReferences() {
  const model = useOrganizationReferences();
  const { kind, changeKind, busy, loading, feedback, pending, cancelConfirmation, refresh, confirmChange } = model;
  return <section className="team-panel" aria-labelledby="organization-heading">
    <h2 id="organization-heading">Organization references</h2>
    <p>Manage departments and designations. Inactive entries remain in history and cannot be used for new assignments.</p>
    <Select label="Reference type" id="reference-kind" value={kind} disabled={busy||Boolean(pending)} onChange={event=>changeKind(event.target.value === 'designations' ? 'designations' : 'departments')}><option value="departments">Departments</option><option value="designations">Designations</option></Select>
    <ActionFeedback feedback={feedback} />
    <Button disabled={busy||loading} onClick={refresh}>Refresh references</Button>
    <ReferenceList model={model}/><ReferenceEditor model={model}/>
    <ConfirmationDialog open={Boolean(pending)} busy={busy} title="Confirm reference" headingId="reference-confirm-heading" onCancel={cancelConfirmation} onConfirm={confirmChange} confirmLabel="Confirm reference change" busyLabel="Saving reference…" cancelLabel="Cancel reference change"><p>{pending?.kind}: {pending?.name}. Status: {pending?.isActive?'Active':'Inactive'}. Historical records will be preserved.</p></ConfirmationDialog>
  </section>;
}
