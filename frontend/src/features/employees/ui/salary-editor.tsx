import type { Employee } from '../types';
import type { SalaryEditContext, SalaryEditorSession } from '../salary-types';
import type { EditLease } from '../edit-api';
import { useSalaryEditor } from '../use-salary-editor';
import { Form, TextInput, Select, Textarea } from '../../../shared/ui/form-controls';
import { Button } from '../../../shared/ui/button';
import { ConfirmationDialog } from '../../../shared/ui/confirmation-dialog';
import { formatMoney } from '../../../shared/format/money';
import { formatBusinessDate } from '../../../shared/format/date';
import { SalaryConversion } from './salary-conversion';

type Props = {
  employee: Employee;
  session: SalaryEditorSession;
  leaseFailure: string;
  writeAllowed: boolean;
  replaceLease: (lease: EditLease, context: SalaryEditContext) => void;
  onFinish: () => void;
};
export function SalaryEditor(props: Props) {
  const model = useSalaryEditor(props);
  const { session, employee, leaseFailure, writeAllowed, onFinish } = props;
  const { draft, change, review } = model;
  const correction = session.mode === 'correction';
  return (
    <section className="salary-editor" aria-labelledby="salary-editor-heading">
      <h3 id="salary-editor-heading">
        {correction ? 'Correct a salary typo' : 'Add a salary revision'}
      </h3>
      <p>
        {correction
          ? 'This keeps the original start date and appends a correction. The original entry remains in history.'
          : 'Enter the new monthly base salary and when it starts. Existing and later scheduled entries remain in history.'}
      </p>
      <p className="field-hint">
        Your protected edit session stays open while you edit. It expires after 15 minutes without
        renewal.
      </p>
      {!writeAllowed && (
        <p role="alert">
          Your access to change this salary is no longer available. Your draft is preserved; cancel
          editing to return.
        </p>
      )}
      {model.failure && <p role="alert">{model.failure}</p>}
      {leaseFailure && <p role="alert">{leaseFailure}</p>}
      {(leaseFailure || model.needsRefresh) && !model.uncertain && (
        <div className="setup-note">
          <p>
            Your draft is preserved. Refresh the edit session, then review it again before saving.
            {correction
              ? ' If someone corrected this entry, cancel and choose its latest version.'
              : ''}
          </p>
          <Button disabled={model.busy || !writeAllowed} onClick={model.refreshLease}>
            Refresh edit session
          </Button>
        </div>
      )}
      {model.uncertain && (
        <div className="setup-note" role="status">
          <p>
            The result could not be confirmed. Retry the same reviewed submission to check its
            result without adding a duplicate. Your fields are locked until that result is
            confirmed. If you cancel, refresh salary history before starting another change.
          </p>
          <Button disabled={model.busy} onClick={model.reopenReview}>
            Review & retry the same submission
          </Button>
        </div>
      )}
      <Form onSubmit={model.preview}>
        <fieldset disabled={!model.canEditDraft || !writeAllowed}>
          <legend>Monthly salary details</legend>
          <div className="form-grid">
            <TextInput
              label="New monthly amount"
              required
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,4})?"
              maxLength={24}
              value={draft.amount}
              onChange={(event) => change('amount', event.target.value)}
              hint="Enter the exact amount. Country precision is checked before you confirm."
            />
            <Select
              label="Salary currency"
              required
              value={draft.currency}
              onChange={(event) => change('currency', event.target.value)}
            >
              <option value="">Choose a currency</option>
              {!session.currencies.some((currency) => currency.code === draft.currency) &&
                draft.currency && (
                  <option value={draft.currency} disabled>
                    {draft.currency} (not active)
                  </option>
                )}
              {session.currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </Select>
            <TextInput
              label={correction ? 'Original salary start date' : 'Salary starts on'}
              type="date"
              required
              min={model.minimumDate}
              readOnly={correction}
              value={draft.effectiveFrom}
              onChange={(event) => change('effectiveFrom', event.target.value)}
            />
          </div>
          {!session.canSubmitBackdated && (
            <p className="field-hint">
              Only HR managers can submit backdated changes for independent approval.
            </p>
          )}
          <Textarea
            label="Reason for this salary change"
            required
            maxLength={1000}
            value={draft.reason}
            onChange={(event) => change('reason', event.target.value)}
          />
        </fieldset>
        <div className="form-actions">
          <Button type="submit" disabled={model.busy || model.blocked || model.uncertain}>
            Review salary change
          </Button>
          <Button variant="secondary" disabled={model.busy} onClick={onFinish}>
            Cancel salary editing
          </Button>
        </div>
      </Form>
      <ConfirmationDialog
        open={model.reviewOpen && Boolean(review)}
        busy={model.busy}
        confirmDisabled={!writeAllowed || (!model.uncertain && model.blocked)}
        focusHeading
        className="team-confirm salary-review"
        title={
          review?.preview.requiresApproval
            ? 'Submit this backdated salary for approval?'
            : 'Record this salary change?'
        }
        headingId="salary-change-confirm"
        onCancel={model.backToDraft}
        onConfirm={model.confirm}
        confirmLabel={
          model.uncertain
            ? 'Retry the same submission'
            : review?.preview.requiresApproval
              ? 'Submit for independent approval'
              : 'Record salary change'
        }
        busyLabel="Saving salary change…"
        cancelLabel={model.uncertain ? 'Keep draft' : 'Back to editing'}
      >
        {review && (
          <>
            <p>
              <strong>
                {employee.first_name} {employee.last_name}
              </strong>{' '}
              · {employee.employee_code}
            </p>
            <p className="field-hint">
              Review date: {formatBusinessDate(review.preview.businessDate)} (UTC)
            </p>
            <dl className="salary-review-details">
              <div>
                <dt>Salary before this change</dt>
                <dd>
                  {review.preview.before
                    ? formatMoney(
                        review.preview.before.amount,
                        review.preview.before.currency,
                        review.preview.before.decimalPlaces,
                      )
                    : 'No earlier salary applies on this date'}
                </dd>
              </div>
              <div>
                <dt>New monthly salary</dt>
                <dd>
                  <strong>
                    {formatMoney(
                      review.preview.amount,
                      review.preview.currency,
                      review.preview.policy.decimalPlaces,
                    )}
                  </strong>
                </dd>
              </div>
              <div>
                <dt>Starts on</dt>
                <dd>{formatBusinessDate(review.preview.effectiveFrom)}</dd>
              </div>
              <div>
                <dt>Country policy</dt>
                <dd>
                  {review.preview.policy.countryName} · {review.preview.policy.decimalPlaces}{' '}
                  decimal places
                </dd>
              </div>
              <div>
                <dt>In the country’s default currency</dt>
                <dd>
                  {formatMoney(
                    review.preview.convertedAmount,
                    review.preview.policy.defaultCurrency,
                    review.preview.policy.decimalPlaces,
                  )}{' '}
                  per month
                </dd>
              </div>
            </dl>
            <p>
              <strong>Reason:</strong> {review.input.reason}
            </p>
            <SalaryConversion legs={review.preview.conversionLegs} />
            <p className="setup-note">
              {review.preview.requiresApproval
                ? 'Awaiting approval · not active. A different eligible HR manager must approve this request before it changes compensation.'
                : 'Recorded · management review pending. This entry counts in compensation from its start date. Later scheduled entries remain unchanged.'}
            </p>
            {review.preview.correction && (
              <p>
                This is a same-date typo correction. The original entry remains in permanent
                history.
              </p>
            )}
            {model.failure && <p role="alert">{model.failure}</p>}
            {leaseFailure && !model.uncertain && (
              <p role="alert">
                {leaseFailure} Return to editing and refresh the edit session before saving.
              </p>
            )}
            {!writeAllowed && (
              <p role="alert">
                Your salary access changed. Return to your preserved draft and cancel editing.
              </p>
            )}
            {model.uncertain && (
              <p>
                The previous result is unknown. Retrying keeps the same submission and cannot create
                a duplicate.
              </p>
            )}
          </>
        )}
      </ConfirmationDialog>
    </section>
  );
}
