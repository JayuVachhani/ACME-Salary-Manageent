import type { Employee } from '../types';
import { Form, TextInput, Select, Textarea } from '../../../shared/ui/form-controls';
import { Button } from '../../../shared/ui/button';
import { ConfirmationDialog } from '../../../shared/ui/confirmation-dialog';
import { RequestState } from '../../../shared/ui/request-state';
import { errorMessage } from '../../../shared/api/client';
import { useInitialSalaryEditor } from '../use-initial-salary-editor';
export function InitialSalaryEditor({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee;
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const { options, action, draft, setDraft, review, setReview, confirm } = useInitialSalaryEditor(
    employee,
    onSaved,
  );
  return (
    <section>
      <h3>Submit a corrected initial salary</h3>
      <p>
        The rejected request remains in the approval history. This creates a new request for an
        independent HR manager to review.
      </p>
      <RequestState
        loading={options.isFetching}
        error={options.error ? errorMessage(options.error, 'Could not load salary options.') : ''}
        loadingMessage="Loading salary options…"
      >
        {options.currentData && (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              setReview(true);
            }}
          >
            <TextInput
              label="Monthly amount"
              required
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,4})?"
              maxLength={24}
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
            />
            <Select
              label="Currency"
              required
              value={draft.currency}
              onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
            >
              <option value="">Choose a currency</option>
              {options.currentData.currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </Select>
            <TextInput
              label="Salary starts on"
              type="date"
              required
              min={employee.joining_date}
              value={draft.effectiveFrom}
              onChange={(e) => setDraft((d) => ({ ...d, effectiveFrom: e.target.value }))}
            />
            <Textarea
              label="Reason for this new request"
              required
              maxLength={1000}
              value={draft.reason}
              onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))}
            />
            <Button type="submit" disabled={action.busy}>
              Review salary request
            </Button>
          </Form>
        )}
      </RequestState>
      {onClose && (
        <Button variant="secondary" disabled={action.busy} onClick={onClose}>
          Cancel initial salary editing
        </Button>
      )}
      <ConfirmationDialog
        open={review}
        busy={action.busy}
        className="team-confirm"
        title="Submit this initial salary for approval?"
        headingId="initial-resubmit-confirm"
        onCancel={() => setReview(false)}
        onConfirm={confirm}
        confirmLabel="Submit for approval"
        cancelLabel="Back to details"
        busyLabel="Submitting request…"
      >
        <p>
          {employee.first_name} {employee.last_name}: {draft.currency} {draft.amount} per month,
          starting {draft.effectiveFrom}.
        </p>
        <p>{draft.reason}</p>
        <p>This salary is not active until independently approved.</p>
      </ConfirmationDialog>
    </section>
  );
}
