import { TeamMembers } from './ui/team-members';
import { TeamEditor } from './ui/team-editor';
import { useTeam } from './use-team';
import type { TeamProps } from './types';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
export function Team(props: TeamProps) {
  const model = useTeam(props);
  const { message, busy, loading, confirm, confirmationDetails, cancelConfirmation, confirmChange, refresh } = model;
  return <section className="team-panel" aria-labelledby="team-heading"><h2 id="team-heading">Team</h2>
    <p>Invite colleagues and manage access. HR Managers have all permissions. Removing access preserves historical records.</p>
    {message&&<p role="alert">{message}</p>}
    <button disabled={busy} onClick={refresh}>Refresh team</button>
    {loading?<p role="status">Loading team…</p>:<TeamMembers model={model}/>}<TeamEditor model={model}/>
    <ConfirmationDialog open={confirm} busy={busy} title="Confirm team change" headingId="confirm-team" className="team-confirm" confirmFirst onCancel={cancelConfirmation} onConfirm={confirmChange} confirmLabel="Confirm change" busyLabel="Saving…" cancelLabel="Cancel change"><p>{confirmationDetails}</p><p>Changes take effect immediately.</p></ConfirmationDialog>
  </section>;
}
