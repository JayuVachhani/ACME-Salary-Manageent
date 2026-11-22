import type { Employee } from '../types';
import { Form, TextInput, Textarea } from '../../../shared/ui/form-controls';
import { Button } from '../../../shared/ui/button';
import { ConfirmationDialog } from '../../../shared/ui/confirmation-dialog';
import { useEmployeeEditor } from '../use-employee-editor';
export function EmployeeEditor({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const { lease, leaseError, draft, setDraft, review, setReview, action, startEditing, confirm } =
    useEmployeeEditor(employee, onClose);
  return (
    <section className="employee-editor">
      <h3>Edit employee details</h3>
      <p>
        Update the name or work email. Country transfers, job changes and joining-date changes are
        separate workflows.
      </p>
      {leaseError && <p role="alert">{leaseError}</p>}
      {!lease && (
        <Button disabled={action.busy} onClick={startEditing}>
          {action.busy ? 'Opening edit session…' : 'Start protected editing'}
        </Button>
      )}
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          setReview(true);
        }}
      >
        <fieldset disabled={!lease || Boolean(leaseError) || action.busy}>
          <legend>Personal details</legend>
          <div className="form-grid">
            <TextInput
              label="First name"
              required
              maxLength={100}
              value={draft.firstName}
              onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
            />
            <TextInput
              label="Last name"
              required
              maxLength={100}
              value={draft.lastName}
              onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
            />
            <TextInput
              label="Work email"
              type="email"
              required
              maxLength={254}
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            />
          </div>
          <Textarea
            label="Reason for this change"
            required
            maxLength={1000}
            value={draft.reason}
            onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))}
          />
          <Button type="submit">Review changes</Button>
        </fieldset>
        <Button disabled={action.busy} variant="secondary" onClick={onClose}>
          Cancel editing
        </Button>
      </Form>
      <ConfirmationDialog
        open={review}
        busy={action.busy}
        className="team-confirm"
        title="Save employee details?"
        headingId="employee-edit-confirm"
        onCancel={() => setReview(false)}
        onConfirm={confirm}
        confirmLabel="Save employee details"
        busyLabel="Saving details…"
        cancelLabel="Back to editing"
      >
        <p>
          Name: {employee.first_name} {employee.last_name} → {draft.firstName} {draft.lastName}
        </p>
        <p>
          Email: {employee.email} → {draft.email}
        </p>
        <p>Reason: {draft.reason}</p>
        <p>
          History is preserved. Pending salary requests may require a fresh review after an employee
          change.
        </p>
      </ConfirmationDialog>
    </section>
  );
}
