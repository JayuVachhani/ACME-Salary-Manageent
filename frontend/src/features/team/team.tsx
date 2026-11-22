import { RequestState } from '../../shared/ui/request-state';
import { ActionFeedback } from '../../shared/ui/action-feedback';
import { Button } from '../../shared/ui/button';
import { TeamMembers } from './ui/team-members';
import { TeamEditor } from './ui/team-editor';
import { useTeam } from './use-team';
import type { TeamProps } from './types';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
export function Team(props: TeamProps) {
  const model = useTeam(props);
  const {
    feedback,
    error,
    busy,
    loading,
    confirm,
    confirmationDetails,
    cancelConfirmation,
    confirmChange,
    refresh,
  } = model;
  return (
    <section className="team-panel" aria-labelledby="team-heading">
      <h2 id="team-heading">Team</h2>
      <p>
        Invite colleagues and manage access. HR Managers have all permissions. Removing access
        preserves historical records.
      </p>
      <ActionFeedback feedback={feedback} />
      <Button disabled={busy} onClick={refresh}>
        Refresh team
      </Button>
      <RequestState loading={loading} error={error} loadingMessage="Loading team…">
        <TeamMembers model={model} />
      </RequestState>
      <TeamEditor model={model} />
      <ConfirmationDialog
        open={confirm}
        busy={busy}
        title="Confirm team change"
        headingId="confirm-team"
        className="team-confirm"
        confirmFirst
        onCancel={cancelConfirmation}
        onConfirm={confirmChange}
        confirmLabel="Confirm change"
        busyLabel="Saving…"
        cancelLabel="Cancel change"
      >
        <p>{confirmationDetails}</p>
        <p>Changes take effect immediately.</p>
      </ConfirmationDialog>
    </section>
  );
}
