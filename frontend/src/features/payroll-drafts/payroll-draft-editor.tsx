import { useState } from 'react';
import type { FormEvent } from 'react';
import { payrollDraftsApi } from './api';
import {
  earningsFields,
  deductionFields,
  type DraftInput,
  type Earnings,
  type Deductions,
  type PayrollDraft,
} from './types';
import { Form, TextInput, Textarea } from '../../shared/ui/form-controls';
import { Button } from '../../shared/ui/button';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { Tabs } from '../../shared/ui/tabs';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
import { useAppDispatch } from '../../shared/state/hooks';
import { errorMessage } from '../../shared/api/client';

type Props = {
  employeeId: string;
  period: string;
  initial?: PayrollDraft;
  onSaved: (draft: PayrollDraft) => void;
  onCancel: () => void;
};
type Submission = DraftInput & { expectedVersion?: number };
export function PayrollDraftEditor({ employeeId, period, initial, onSaved, onCancel }: Props) {
  const [earnings, setEarnings] = useState<Earnings>(
    () =>
      initial?.earnings ?? {
        basic: '0',
        hra: '0',
        allowances: '0',
        bonuses: '0',
        incentives: '0',
        overtime: '0',
      },
  );
  const [deductions, setDeductions] = useState<Deductions>(
    () =>
      initial?.deductions ?? {
        pf: '0',
        esi: '0',
        professionalTax: '0',
        tds: '0',
        unpaidLeave: '0',
        authorized: '0',
      },
  );
  const [reason, setReason] = useState('');
  const [tab, setTab] = useState('earnings');
  const [review, setReview] = useState<Submission | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [failure, setFailure] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const action = useAction();
  const dispatch = useAppDispatch();
  function prepare(event: FormEvent) {
    event.preventDefault();
    if (action.busy || uncertain) return;
    if (!reason.trim()) {
      setFailure('Enter a reason or payroll note before reviewing.');
      return;
    }
    // Tabs mount only the visible panel; validate all financial fields before review.
    if (
      ![...Object.values(earnings), ...Object.values(deductions)].every((value) =>
        /^(0|[1-9]\d{0,13})(?:\.\d{1,2})?$/.test(value),
      )
    ) {
      setFailure(
        'Every earning and deduction must be a nonnegative INR amount with up to two decimal places.',
      );
      return;
    }
    setReview({
      commandId: crypto.randomUUID(),
      employeeId,
      period,
      earnings: { ...earnings },
      deductions: { ...deductions },
      reason: reason.trim(),
      confirmed: true,
      ...(initial ? { expectedVersion: initial.version } : {}),
    });
    setReviewOpen(true);
    setFailure('');
  }
  function save() {
    if (!review) return;
    const snapshot = review;
    void action.perform(async (signal) => {
      try {
        const result = initial
          ? await runRequest(
              dispatch(
                payrollDraftsApi.endpoints.revisePayrollDraft.initiate({
                  id: initial.id,
                  body: {
                    commandId: snapshot.commandId,
                    expectedVersion: snapshot.expectedVersion ?? initial.version,
                    earnings: snapshot.earnings,
                    deductions: snapshot.deductions,
                    reason: snapshot.reason,
                    confirmed: true,
                  },
                }),
              ),
              signal,
            )
          : await runRequest(
              dispatch(
                payrollDraftsApi.endpoints.createPayrollDraft.initiate({
                  commandId: snapshot.commandId,
                  employeeId: snapshot.employeeId,
                  period: snapshot.period,
                  earnings: snapshot.earnings,
                  deductions: snapshot.deductions,
                  reason: snapshot.reason,
                  confirmed: true,
                }),
              ),
              signal,
            );
        if (signal.aborted) return;
        action.announce(
          result.replayed
            ? 'Previously saved payroll draft confirmed.'
            : 'Payroll draft saved. No payment or salary change was made.',
        );
        onSaved(result);
      } catch (cause) {
        if (signal.aborted) return;
        const status =
          typeof cause === 'object' && cause !== null && 'status' in cause
            ? cause.status
            : undefined;
        const unknown =
          status === undefined ||
          status === 'NETWORK_ERROR' ||
          (typeof status === 'number' && status >= 500);
        setUncertain(unknown);
        setReviewOpen(false);
        setFailure(
          errorMessage(
            cause,
            'Could not confirm whether this draft was saved. Retry the same submission.',
          ) +
            (status === 409
              ? ' Your values are still here. Cancel editing, refresh the saved draft, and reopen it to review the current version.'
              : ''),
        );
        if (!unknown) setReview(null);
        throw cause;
      }
    });
  }
  const fields = (kind: 'earnings' | 'deductions') => (
    <div className="form-grid">
      {(kind === 'earnings' ? earningsFields : deductionFields).map(([key, label]) => (
        <TextInput
          key={key}
          label={label + ' (INR)'}
          required
          inputMode="decimal"
          pattern="(0|[1-9][0-9]{0,13})(\.[0-9]{1,2})?"
          maxLength={17}
          value={
            kind === 'earnings'
              ? earnings[key as keyof Earnings]
              : deductions[key as keyof Deductions]
          }
          onChange={(event) => {
            const value = event.target.value;
            if (kind === 'earnings') setEarnings((old) => ({ ...old, [key]: value }));
            else setDeductions((old) => ({ ...old, [key]: value }));
          }}
        />
      ))}
    </div>
  );
  return (
    <section aria-labelledby="payroll-draft-editor-heading">
      <h3 id="payroll-draft-editor-heading">
        {initial ? 'Revise payroll draft' : 'Enter payroll draft'} · {period}
      </h3>
      <p>
        Enter the payable amounts manually, including any proration or deductions you have worked
        out. Nothing is calculated automatically. Use 0 for components that do not apply.
      </p>
      {failure && <p role="alert">{failure}</p>}
      {uncertain && (
        <div className="setup-note">
          <p>
            The save result is uncertain. Fields are locked so the same submission can be retried
            without creating a duplicate.
          </p>
          <Button disabled={action.busy} onClick={() => setReviewOpen(true)}>
            Review & retry same draft
          </Button>
        </div>
      )}
      <Form onSubmit={prepare}>
        <fieldset disabled={action.busy || uncertain}>
          <legend>Manual monthly components</legend>
          <Tabs
            label="Payroll draft components"
            selected={tab}
            onSelect={setTab}
            tabs={[
              { id: 'earnings', label: 'Earnings', content: fields('earnings') },
              { id: 'deductions', label: 'Deductions', content: fields('deductions') },
            ]}
          />
          <Textarea
            label="Reason / payroll note"
            required
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </fieldset>
        <div className="form-actions">
          <Button type="submit" disabled={action.busy || uncertain}>
            Review draft
          </Button>
          <Button variant="secondary" disabled={action.busy} onClick={() => setCancelOpen(true)}>
            Cancel editing
          </Button>
        </div>
      </Form>
      <ConfirmationDialog
        open={reviewOpen}
        busy={action.busy}
        title="Save draft payroll components?"
        headingId="save-payroll-draft"
        focusHeading
        onCancel={() => setReviewOpen(false)}
        onConfirm={save}
        confirmLabel="Save draft only"
        busyLabel="Saving..."
        cancelLabel="Keep reviewing"
      >
        <p>
          Period: {period}. India / INR. This saves a draft revision and does not alter the employee
          salary ledger, approve payroll or make a payment.
        </p>
        {review && (
          <>
            <dl>
              {earningsFields.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>INR {review.earnings[key]}</dd>
                </div>
              ))}
              {deductionFields.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>INR {review.deductions[key]}</dd>
                </div>
              ))}
            </dl>
            <p>{review.reason}</p>
          </>
        )}
      </ConfirmationDialog>
      <ConfirmationDialog
        open={cancelOpen}
        busy={action.busy}
        title="Discard local draft changes?"
        headingId="cancel-payroll-edit"
        onCancel={() => setCancelOpen(false)}
        onConfirm={onCancel}
        confirmLabel="Discard local changes"
        busyLabel="Discarding..."
        cancelLabel="Keep editing"
      >
        <p>
          Saved revisions remain saved. Unsaved values and the local retry command will be cleared.
        </p>
        {uncertain && (
          <p>
            The save result is uncertain. Retry first, or refresh saved payroll drafts before
            entering another revision.
          </p>
        )}
      </ConfirmationDialog>
    </section>
  );
}
