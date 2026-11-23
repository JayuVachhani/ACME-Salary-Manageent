import { useState } from 'react';
import { Form, TextInput, Select, Checkbox, Textarea } from '../../shared/ui/form-controls';
import { Button } from '../../shared/ui/button';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
import { useCreatePayrollPolicyMutation, usePolicyApproversQuery } from './api';
const components = ['basic', 'hra', 'allowances', 'bonuses', 'incentives', 'overtime'];
export function PayrollPolicyEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [finance, setFinance] = useState<string[]>([]),
    [directors, setDirectors] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState(''),
    [query, setQuery] = useState({ search: '', page: 1 });
  const users = usePolicyApproversQuery(query);
  const [states, setStates] = useState<{ stateCode: string; amount: string; proration: string }[]>(
    [],
  );
  const [ack, setAck] = useState(false);
  const [pending, setPending] = useState<{
    policyKey: string;
    effectiveFrom: string;
    config: object;
    reason: string;
    confirmed: true;
  } | null>(null);
  const [create] = useCreatePayrollPolicyMutation();
  const action = useAction();
  const value = (key: string) => values[key] ?? '';
  const change = (key: string, next: string) => setValues((v) => ({ ...v, [key]: next }));
  const field = (key: string, label: string, options?: [string, string][], type = 'text') =>
    options ? (
      <Select
        key={key}
        label={label}
        required
        value={value(key)}
        onChange={(e) => change(key, e.target.value)}
      >
        <option value="">Choose explicitly</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
    ) : (
      <TextInput
        key={key}
        label={label}
        type={type}
        min={type === 'date' ? '2000-01-01' : undefined}
        max={type === 'date' ? '9998-12-01' : undefined}
        required
        inputMode={/Percent|\.cap$|\.ceiling$/.test(key) ? 'decimal' : undefined}
        value={value(key)}
        onChange={(e) => change(key, e.target.value)}
      />
    );
  const yes: [string, string][] = [
    ['true', 'Enabled / yes'],
    ['false', 'Disabled / no'],
  ];
  const prorate: [string, string][] = [
    ['CALENDAR_DAYS', 'Calendar-day proration'],
    ['FULL_MONTH', 'Full monthly amount'],
  ];
  const rule = (kind: string) => ({
    enabled: value(kind + '.enabled') === 'true',
    employeePercent: value(kind + '.employeePercent'),
    employerPercent: value(kind + '.employerPercent'),
    base: value(kind + '.base'),
    wageCap: value(kind + '.capMode') === 'NONE' ? null : value(kind + '.cap'),
    capProration: value(kind + '.capProration'),
    eligibilityCeiling: value(kind + '.ceilingMode') === 'NONE' ? null : value(kind + '.ceiling'),
    eligibilityCeilingBasis: value(kind + '.ceilingBasis'),
  });
  function submit() {
    if (!ack || !finance.length || (value('requiresDirector') === 'true' && !directors.length))
      return;
    setPending({
      policyKey: value('key'),
      effectiveFrom: value('effectiveFrom'),
      reason: value('reason'),
      confirmed: true,
      config: {
        name: value('name'),
        countryCode: 'IN',
        currency: 'INR',
        roundingMode: value('roundingMode'),
        basicSource: value('basicSource'),
        fullMonthLedgerRateDate: value('fullMonthLedgerRateDate'),
        manualStatutoryTreatment: 'REPLACE_WITH_POLICY_AND_INPUTS',
        employerContributionTreatment: 'EMPLOYER_ONLY_NOT_DEDUCTED',
        proration: Object.fromEntries(components.map((key) => [key, value('prorate.' + key)])),
        unpaidLeaveTreatment: value('unpaidLeaveTreatment'),
        pf: rule('pf'),
        esi: rule('esi'),
        professionalTax: { mode: value('ptMode'), rules: states },
        tdsMode: value('tdsMode'),
        finalizerRole: value('finalizerRole'),
        financeApproverIds: finance,
        directorApproverIds: directors,
        requiresDirector: value('requiresDirector') === 'true',
      },
    });
  }
  function confirm() {
    if (!pending) return;
    void action.perform(async (signal) => {
      await runRequest(create(pending), signal);
      if (signal.aborted) return;
      setPending(null);
      action.announce(
        'Inactive policy version saved. A different linked HR manager must approve it.',
      );
    });
  }
  return (
    <section className="team-panel">
      <h2>Create a payroll policy version</h2>
      <p>
        India / INR only. Nothing is active until another linked HR manager approves. No statutory
        rates are prefilled.
      </p>
      <Form
        className="employee-create-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={action.busy}>
          <legend>Policy identity and payroll basis</legend>
          <div className="form-grid">
            {field('key', 'Policy code')}
            {field('name', 'Policy name')}
            {field('effectiveFrom', 'First payroll month — first day only', undefined, 'date')}
            {field('roundingMode', 'Rounding for calculated INR amounts', [
              ['HALF_UP', 'Half up'],
              ['FLOOR', 'Round down'],
              ['CEIL', 'Round up'],
            ])}
            {field('basicSource', 'Monthly basic amount comes from', [
              ['LEDGER', 'Effective salary ledger'],
              ['MANUAL_DRAFT', 'Manual payroll draft basic'],
            ])}
            {field('fullMonthLedgerRateDate', 'Full-month ledger rate date', [
              ['PERIOD_END', 'Last calendar day of month'],
              ['EMPLOYMENT_END', 'Last employment day in month'],
            ])}
            {field('unpaidLeaveTreatment', 'Unpaid leave treatment', [
              ['PRORATE_EARNINGS', 'Reduce prorated earnings using unpaid dates'],
              ['MANUAL_DEDUCTION', 'Use the manual unpaid-leave deduction once'],
            ])}
          </div>
        </fieldset>
        <fieldset disabled={action.busy}>
          <legend>Proration for each monthly component</legend>
          <div className="form-grid">
            {components.map((key) => field('prorate.' + key, key.toUpperCase(), prorate))}
          </div>
        </fieldset>
        {['pf', 'esi'].map((kind) => (
          <fieldset key={kind} disabled={action.busy}>
            <legend>{kind.toUpperCase()} — supplied company policy, not legal advice</legend>
            <div className="form-grid">
              {field(kind + '.enabled', 'Apply this contribution?', yes)}
              {field(kind + '.employeePercent', 'Employee percentage')}
              {field(kind + '.employerPercent', 'Employer percentage')}
              {field(kind + '.base', 'Contribution base', [
                ['BASIC', 'Basic'],
                ['BASIC_HRA', 'Basic + HRA'],
                ['GROSS', 'Gross earnings'],
              ])}
              {field(kind + '.capMode', 'Wage cap', [
                ['NONE', 'Explicitly uncapped'],
                ['FIXED', 'Configured cap'],
              ])}
              {value(kind + '.capMode') === 'FIXED' && field(kind + '.cap', 'Wage cap amount')}
              {field(kind + '.capProration', 'Cap proration', [
                ['FULL_CAP', 'Full configured cap'],
                ['CALENDAR_PAID_DAYS', 'Prorate cap by paid calendar days'],
              ])}
              {field(kind + '.ceilingMode', 'Eligibility ceiling', [
                ['NONE', 'No configured ceiling'],
                ['FIXED', 'Configured ceiling'],
              ])}
              {value(kind + '.ceilingMode') === 'FIXED' &&
                field(kind + '.ceiling', 'Eligibility ceiling amount')}
              {field(kind + '.ceilingBasis', 'Compare eligibility against', [
                ['PAYABLE_EARNINGS', 'Payable earnings after proration'],
                ['FULL_MONTH_BASE', 'Full monthly component rates'],
              ])}
            </div>
          </fieldset>
        ))}
        <fieldset disabled={action.busy}>
          <legend>Professional tax and TDS</legend>
          {field('ptMode', 'Professional tax mode', [
            ['DISABLED', 'Disabled'],
            ['MANUAL_INPUT', 'Explicit amount supplied per calculation'],
            ['STATE_RULES', 'Configured state amounts'],
          ])}
          {value('ptMode') === 'STATE_RULES' && (
            <>
              <Button
                onClick={() =>
                  setStates((s) => [...s, { stateCode: '', amount: '', proration: '' }])
                }
              >
                Add state rule
              </Button>
              {states.map((state, index) => (
                <div className="form-grid" key={index}>
                  <TextInput
                    label="State code"
                    required
                    value={state.stateCode}
                    onChange={(e) =>
                      setStates((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, stateCode: e.target.value.toUpperCase() } : r,
                        ),
                      )
                    }
                  />
                  <TextInput
                    label="Monthly PT amount"
                    required
                    inputMode="decimal"
                    value={state.amount}
                    onChange={(e) =>
                      setStates((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, amount: e.target.value } : r)),
                      )
                    }
                  />
                  <Select
                    label="PT proration"
                    required
                    value={state.proration}
                    onChange={(e) =>
                      setStates((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, proration: e.target.value } : r)),
                      )
                    }
                  >
                    <option value="">Choose</option>
                    {prorate.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </>
          )}
          {field('tdsMode', 'TDS mode', [
            ['DISABLED', 'Disabled'],
            ['MANUAL_INPUT', 'Explicit amount supplied per calculation'],
          ])}
        </fieldset>
        <fieldset disabled={action.busy}>
          <legend>Approval responsibilities</legend>
          {field('requiresDirector', 'Is Director approval required?', yes)}
          {field('finalizerRole', 'Who may finalize an approved run?', [
            ['HR', 'HR manager'],
            ['FINANCE', 'Assigned Finance approver'],
          ])}
          <TextInput
            label="Find approvers by name, email or employee code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => setQuery({ search, page: 1 })}>Find approvers</Button>
          <p>Only active, linked users with salary read access are listed.</p>
          {users.error && (
            <p role="alert">
              Could not load eligible approvers. Check your HR access and try the search again.
            </p>
          )}
          {users.currentData?.items.map((user) => (
            <div key={user.id}>
              <strong>{user.name}</strong> · {user.employeeCode ?? user.email}
              <Checkbox
                label="Finance approver"
                checked={finance.includes(user.id)}
                onChange={(e) => {
                  setNames((n) => ({ ...n, [user.id]: user.name }));
                  setFinance((ids) =>
                    e.target.checked ? [...ids, user.id] : ids.filter((id) => id !== user.id),
                  );
                }}
              />
              <Checkbox
                label="Director approver"
                checked={directors.includes(user.id)}
                onChange={(e) => {
                  setNames((n) => ({ ...n, [user.id]: user.name }));
                  setDirectors((ids) =>
                    e.target.checked ? [...ids, user.id] : ids.filter((id) => id !== user.id),
                  );
                }}
              />
            </div>
          ))}
          <div className="pagination">
            <Button
              disabled={query.page === 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              Previous users
            </Button>
            <Button
              disabled={!users.currentData || query.page * 25 >= users.currentData.total}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              Next users
            </Button>
          </div>
          <p>
            Finance: {finance.map((id) => names[id]).join(', ') || 'Choose at least one'}.
            Directors: {directors.map((id) => names[id]).join(', ') || 'None selected'}.
          </p>
        </fieldset>
        <Textarea
          label="Reason for this policy version"
          required
          maxLength={1000}
          value={value('reason')}
          onChange={(e) => change('reason', e.target.value)}
        />
        <Checkbox
          label="I explicitly confirm employer contributions are not deducted from net pay, and manual PF/ESI/PT/TDS fields will be replaced by approved rules and supplied inputs."
          required
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <Button
          type="submit"
          disabled={
            action.busy ||
            !finance.length ||
            !ack ||
            (value('requiresDirector') === 'true' && !directors.length)
          }
        >
          Review inactive policy
        </Button>
      </Form>
      <ConfirmationDialog
        open={Boolean(pending)}
        busy={action.busy}
        className="team-confirm"
        title="Save this inactive policy version?"
        headingId="policy-create-confirm"
        confirmLabel="Save inactive policy"
        cancelLabel="Back to policy"
        busyLabel="Saving policy…"
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      >
        <p>
          {value('name')} · {value('key')} · starts {value('effectiveFrom')}.
        </p>
        <p>
          Finance: {finance.map((id) => names[id]).join(', ')}. Director step:{' '}
          {value('requiresDirector') === 'true' ? 'Required' : 'Not required'}. Finalizer:{' '}
          {value('finalizerRole')}.
        </p>
        <p>
          No rates or pay rules are active until a different linked HR manager approves this
          version.
        </p>
      </ConfirmationDialog>
    </section>
  );
}
