import { useState } from 'react';
import type { FormEvent } from 'react';
import { useEmployeeCreateOptionsQuery, useCreateEmployeeMutation } from './api';
import type { EmployeeCreateInput } from './create-types';
import { Form, TextInput, Select, Textarea } from '../../shared/ui/form-controls';
import { Button } from '../../shared/ui/button';
import { RequestState } from '../../shared/ui/request-state';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
import { errorMessage } from '../../shared/api/client';

const blank = () => ({
  commandId: crypto.randomUUID(),
  employeeCode: '',
  email: '',
  firstName: '',
  lastName: '',
  joiningDate: '',
  countryCode: '',
  departmentId: '',
  designationId: '',
  employmentStatus: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  effectiveFrom: '',
  amount: '',
  currency: '',
  reason: '',
});
export function EmployeeCreate() {
  const [draft, setDraft] = useState(blank);
  const [pending, setPending] = useState<EmployeeCreateInput | null>(null);
  const [saved, setSaved] = useState(false);
  const options = useEmployeeCreateOptionsQuery();
  const [create] = useCreateEmployeeMutation();
  const action = useAction();
  function change(field: keyof typeof draft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setSaved(false);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    setPending({ ...draft, confirmed: true });
  }
  function confirm() {
    if (!pending) return;
    void action.perform(async (signal) => {
      await runRequest(create(pending), signal);
      if (signal.aborted) return;
      setPending(null);
      setDraft(blank());
      setSaved(true);
      action.announce(
        'Employee added. Their initial salary is waiting for another HR manager’s approval.',
      );
    });
  }
  const policy = options.currentData?.countries.find(
    (country) => country.code === draft.countryCode,
  );
  const missing =
    options.currentData &&
    (!options.currentData.countries.length ||
      !options.currentData.departments.length ||
      !options.currentData.designations.length ||
      !options.currentData.currencies.length);
  return (
    <section className="team-panel">
      <h2>Add an employee</h2>
      <p>Save their details and submit the initial monthly salary for approval in one step.</p>
      {saved && (
        <div className="success-banner" role="status">
          Employee added. The salary stays out of active compensation until a different HR manager
          approves it. <a href="#/employees">View employees →</a>
        </div>
      )}
      <RequestState
        loading={options.isFetching}
        error={
          options.error ? errorMessage(options.error, 'Could not load employee setup options.') : ''
        }
        loadingMessage="Loading departments, job titles and countries…"
      >
        {missing ? (
          <p className="setup-note">
            Before adding employees, an HR manager must set up an active country, currency,
            department and job title. Use the setup pages in the navigation, then return here.
          </p>
        ) : (
          options.currentData && (
            <Form onSubmit={submit} className="employee-create-form">
              <fieldset disabled={action.busy}>
                <legend>1. Employee details</legend>
                <div className="form-grid">
                  <TextInput
                    label="Employee code"
                    hint="Your organization’s unique employee identifier."
                    required
                    maxLength={100}
                    value={draft.employeeCode}
                    onChange={(e) => change('employeeCode', e.target.value)}
                  />
                  <TextInput
                    label="Work email"
                    type="email"
                    required
                    maxLength={254}
                    value={draft.email}
                    onChange={(e) => change('email', e.target.value)}
                  />
                  <TextInput
                    label="First name"
                    required
                    maxLength={100}
                    value={draft.firstName}
                    onChange={(e) => change('firstName', e.target.value)}
                  />
                  <TextInput
                    label="Last name"
                    required
                    maxLength={100}
                    value={draft.lastName}
                    onChange={(e) => change('lastName', e.target.value)}
                  />
                  <TextInput
                    label="Joining date"
                    type="date"
                    required
                    value={draft.joiningDate}
                    onChange={(e) =>
                      setDraft((previous) => ({
                        ...previous,
                        joiningDate: e.target.value,
                        effectiveFrom: previous.effectiveFrom || e.target.value,
                      }))
                    }
                  />
                  <Select
                    label="Employment status"
                    value={draft.employmentStatus}
                    onChange={(e) => change('employmentStatus', e.target.value)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>
              </fieldset>
              <fieldset disabled={action.busy}>
                <legend>2. Where they work</legend>
                <div className="form-grid">
                  <Select
                    label="Country"
                    required
                    value={draft.countryCode}
                    onChange={(e) => {
                      const country = options.currentData?.countries.find(
                        (c) => c.code === e.target.value,
                      );
                      setDraft((previous) => ({
                        ...previous,
                        countryCode: e.target.value,
                        currency: country?.currency ?? '',
                      }));
                    }}
                  >
                    <option value="">Choose a country</option>
                    {options.currentData.countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Department"
                    required
                    value={draft.departmentId}
                    onChange={(e) => change('departmentId', e.target.value)}
                  >
                    <option value="">Choose a department</option>
                    {options.currentData.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Job title"
                    required
                    value={draft.designationId}
                    onChange={(e) => change('designationId', e.target.value)}
                  >
                    <option value="">Choose a job title</option>
                    {options.currentData.designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </fieldset>
              <fieldset disabled={action.busy}>
                <legend>3. Initial monthly salary</legend>
                <p>
                  This is monthly base salary. A different HR manager must approve it before it
                  becomes active.
                </p>
                <div className="form-grid">
                  <TextInput
                    label="Monthly amount"
                    inputMode="decimal"
                    required
                    maxLength={24}
                    pattern="[0-9]+(\.[0-9]{1,4})?"
                    hint={
                      policy
                        ? `Up to ${policy.decimalPlaces} decimal places for this country.`
                        : 'Choose a country first.'
                    }
                    value={draft.amount}
                    onChange={(e) => change('amount', e.target.value)}
                  />
                  <Select
                    label="Salary currency"
                    required
                    value={draft.currency}
                    onChange={(e) => change('currency', e.target.value)}
                  >
                    <option value="">Choose a currency</option>
                    {options.currentData.currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </Select>
                  <TextInput
                    label="Salary starts on"
                    type="date"
                    required
                    min={draft.joiningDate}
                    value={draft.effectiveFrom}
                    onChange={(e) => change('effectiveFrom', e.target.value)}
                  />
                </div>
                <Textarea
                  label="Reason / approval note"
                  required
                  maxLength={1000}
                  value={draft.reason}
                  onChange={(e) => change('reason', e.target.value)}
                />
              </fieldset>
              <div className="form-actions">
                <Button type="submit" disabled={action.busy}>
                  Review employee & salary
                </Button>
                <a href="#/employees">Cancel</a>
              </div>
            </Form>
          )
        )}
      </RequestState>
      <ConfirmationDialog
        open={Boolean(pending)}
        busy={action.busy}
        title="Add employee and request salary approval?"
        headingId="employee-create-confirm"
        className="team-confirm"
        onCancel={() => setPending(null)}
        onConfirm={confirm}
        confirmLabel="Add employee & submit for approval"
        busyLabel="Saving employee…"
        cancelLabel="Back to details"
      >
        {pending && (
          <>
            <p>
              <strong>
                {pending.firstName} {pending.lastName}
              </strong>{' '}
              · {pending.employeeCode} · {pending.email}
            </p>
            <p>
              Joining: {pending.joiningDate}. Initial monthly salary:{' '}
              <strong>
                {pending.currency} {pending.amount}
              </strong>
              , starting {pending.effectiveFrom}.
            </p>
            <p>Reason: {pending.reason}</p>
            <p>
              The employee and pending request will be saved together. No active salary is created
              yet.
            </p>
          </>
        )}
      </ConfirmationDialog>
    </section>
  );
}
