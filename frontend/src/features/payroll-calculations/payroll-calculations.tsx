import { usePayrollCalculations } from './use-payroll-calculations';
import { CalculationResult } from './ui/calculation-result';
import { Button } from '../../shared/ui/button';
import { TextInput, Textarea, Select } from '../../shared/ui/form-controls';
import { DataTable } from '../../shared/ui/data-table';
import { Pagination } from '../../shared/ui/pagination';
export function PayrollCalculations({ isHrManager }: { isHrManager: boolean }) {
  return isHrManager ? (
    <CalculatorWorkspace />
  ) : (
    <p role="alert">Only HR managers can preview payroll calculations.</p>
  );
}
function CalculatorWorkspace() {
  const m = usePayrollCalculations();
  const policies = m.policies.isError ? undefined : m.policies.currentData;
  const drafts = m.drafts.isError ? undefined : m.drafts.currentData;
  return (
    <section className="team-panel" aria-labelledby="payroll-calculator-heading">
      <h2 id="payroll-calculator-heading">Preview monthly payroll</h2>
      <p>
        Choose an approved policy and saved manual draft, then enter explicit eligibility and tax
        inputs. Nothing is saved, approved, finalized or paid here.
      </p>
      {m.action.feedback && <p role="status">{m.action.feedback.message}</p>}
      {m.metadataDenied && (
        <p role="alert">
          Access or source availability changed. Refresh your session or ask an HR manager to review
          access before continuing.
        </p>
      )}
      <fieldset disabled={m.action.busy || m.metadataDenied}>
        <legend>1. Choose payroll sources</legend>
        <TextInput
          label="Payroll month"
          type="month"
          value={m.period}
          onChange={(e) => m.setPeriod(e.target.value)}
        />
        <h3>Approved policies</h3>
        <p>
          Only independently approved policies can be selected. The server checks that your choice
          is current for the selected month; an older approval cannot override a newer policy.
        </p>
        {m.policy && !m.metadataDenied && (
          <p>
            Selected: {m.policy.policyKey} · version {m.policy.version} · effective{' '}
            {m.policy.effectiveFrom}
          </p>
        )}
        {m.policies.isError && <p role="alert">Could not load policies. Retry loading the list.</p>}
        <Button
          variant="secondary"
          disabled={m.policies.isFetching}
          onClick={() => void m.policies.refetch()}
        >
          Reload policies
        </Button>
        <DataTable
          caption="Approved policy choices"
          head={
            <tr>
              <th scope="col">Policy</th>
              <th scope="col">Version / effective date</th>
              <th scope="col">Independent approver</th>
              <th scope="col">Choice</th>
            </tr>
          }
        >
          {policies?.items
            .filter((policy) => policy.status === 'ACTIVE')
            .map((policy) => (
              <tr key={policy.id}>
                <td>{policy.policyKey}</td>
                <td>
                  {policy.version} · {policy.effectiveFrom}
                </td>
                <td>{policy.approvedByName}</td>
                <td>
                  <Button variant="secondary" onClick={() => m.choosePolicy(policy)}>
                    {m.policy?.id === policy.id ? 'Selected' : 'Use policy'}
                  </Button>
                </td>
              </tr>
            ))}
        </DataTable>
        <Pagination
          page={m.policyPage}
          pageSize={25}
          total={policies?.total ?? 0}
          disabled={m.policies.isFetching}
          onPageChange={m.setPolicyPage}
          label="Policy choices"
          previousLabel="Previous policies"
          nextLabel="Next policies"
        />
        <h3>Select an employee's manual draft</h3>
        <TextInput
          label="Find employee by name, code or email"
          value={m.search}
          onChange={(e) => m.setSearch(e.target.value)}
          disabled={!m.period}
        />
        {!m.period && <p>Choose a month to load its manual drafts.</p>}
        {m.drafts.isError && (
          <p role="alert">Could not load manual drafts. Your inputs remain on this page.</p>
        )}
        {m.period && (
          <Button
            variant="secondary"
            disabled={m.drafts.isFetching}
            onClick={() => void m.drafts.refetch()}
          >
            Reload drafts
          </Button>
        )}
        <DataTable
          caption="Manual draft choices"
          head={
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Draft version</th>
              <th scope="col">Choice</th>
            </tr>
          }
        >
          {drafts?.items.map((draft) => (
            <tr key={draft.id}>
              <td>
                {draft.employee.name} · {draft.employee.code}
              </td>
              <td>{draft.version}</td>
              <td>
                <Button variant="secondary" onClick={() => m.chooseDraft(draft)}>
                  {m.draft?.id === draft.id ? 'Selected' : 'Use draft'}
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
        <Pagination
          page={m.draftPage}
          pageSize={25}
          total={drafts?.total ?? 0}
          disabled={m.drafts.isFetching || !m.period}
          onPageChange={m.setDraftPage}
          label="Draft choices"
          previousLabel="Previous employees"
          nextLabel="Next employees"
        />
        {m.draft && !m.metadataDenied && (
          <p>
            Selected employee: {m.draft.employee.name} · {m.draft.employee.code} · draft version{' '}
            {m.draft.version}
          </p>
        )}
      </fieldset>
      <fieldset disabled={m.action.busy || m.metadataDenied}>
        <legend>2. Enter eligibility and tax inputs</legend>
        <p>
          No eligibility or leave is inferred. Policy calculations and these inputs replace
          manual-draft PF, ESI, professional tax and TDS. Enter explicit zeros where policy requires
          no manual tax.
        </p>
        <div className="form-grid">
          <Select
            label="PF eligible?"
            value={m.fields.pfEligible}
            onChange={(e) => m.change('pfEligible', e.target.value)}
          >
            <option value="">Choose eligibility</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
          <Select
            label="ESI eligible?"
            value={m.fields.esiEligible}
            onChange={(e) => m.change('esiEligible', e.target.value)}
          >
            <option value="">Choose eligibility</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
          <TextInput
            label="State code"
            maxLength={20}
            value={m.fields.stateCode}
            onChange={(e) => m.change('stateCode', e.target.value)}
            hint="Use the state code configured in the approved policy."
          />
          <TextInput
            label="Manual professional tax (INR)"
            inputMode="decimal"
            value={m.fields.ptAmount}
            onChange={(e) => m.change('ptAmount', e.target.value)}
            hint="Enter 0 when policy calculates professional tax or disables it."
          />
          <TextInput
            label="TDS (INR)"
            inputMode="decimal"
            value={m.fields.tdsAmount}
            onChange={(e) => m.change('tdsAmount', e.target.value)}
          />
          <TextInput
            label="Leaving date, if applicable"
            type="date"
            value={m.fields.leavingDate}
            onChange={(e) => m.change('leavingDate', e.target.value)}
          />
          <Textarea
            label="Unpaid dates, if any"
            value={m.fields.unpaidDates}
            onChange={(e) => m.change('unpaidDates', e.target.value)}
            hint="One YYYY-MM-DD date per line. Leave blank only when there are no unpaid dates."
          />
        </div>
        <Button disabled={!m.period || !m.policy || !m.draft} onClick={m.calculate}>
          Calculate preview
        </Button>
      </fieldset>
      {m.action.busy && (
        <p role="status">Calculating with the current approved policy and source versions...</p>
      )}
      {m.preview && <CalculationResult preview={m.preview} />}
    </section>
  );
}
