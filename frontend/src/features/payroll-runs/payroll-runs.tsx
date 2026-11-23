import { usePayrollRuns } from './use-payroll-runs';
import { actionLabels } from './types';
import { CalculationInputs } from './ui/calculation-inputs';
import { Button } from '../../shared/ui/button';
import { TextInput, Textarea, Select, Checkbox } from '../../shared/ui/form-controls';
import { DataTable } from '../../shared/ui/data-table';
import { Pagination } from '../../shared/ui/pagination';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { formatMoney } from '../../shared/format/money';
import { formatBusinessDate } from '../../shared/format/date';
export function PayrollRuns({ isHrManager }: { isHrManager: boolean }) {
  const m = usePayrollRuns(isHrManager);
  const run = m.detail.isError ? undefined : m.detail.currentData;
  const setup = m.setup.isError ? undefined : m.setup.currentData;
  const list = m.list.isError ? undefined : m.list.currentData;
  const drafts = m.drafts.isError ? undefined : m.drafts.currentData;
  const candidates = setup?.candidates ?? [];
  return (
    <section className="team-panel" aria-labelledby="payroll-runs-heading">
      <h2 id="payroll-runs-heading">Monthly payroll review</h2>
      <p>
        Select manual drafts, confirm calculation inputs, then complete HR, Finance and any required
        Director review. Finalization locks the record; it does not send money.
      </p>
      <TextInput
        label="Payroll month"
        type="month"
        value={m.period}
        disabled={m.action.busy || !!m.pending || m.creating}
        onChange={(e) => m.setPeriod(e.target.value)}
      />
      {m.action.feedback && <p role="status">{m.action.feedback.message}</p>}
      {!m.creating && (
        <>
          <Button disabled={!isHrManager || !m.period || m.action.busy} onClick={m.start}>
            Prepare a payroll run
          </Button>
          {!isHrManager && <p>HR prepares runs. Assigned reviewers can open their runs below.</p>}
          {m.list.isError && (
            <p role="alert">Could not load payroll runs. Refresh the page to retry.</p>
          )}
          <DataTable
            caption="Payroll runs"
            head={
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Progress</th>
                <th scope="col">Employees</th>
                <th scope="col">Action</th>
              </tr>
            }
          >
            {list?.items.map((item) => (
              <tr key={item.id}>
                <td>{item.period}</td>
                <td>
                  {item.status.replaceAll('_', ' ')} · version {item.version}
                </td>
                <td>{item.employeeCount}</td>
                <td>
                  <Button variant="secondary" onClick={() => m.open(item.id)}>
                    Open payroll run
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination
            page={m.page}
            pageSize={25}
            total={list?.total ?? 0}
            disabled={m.list.isFetching}
            onPageChange={m.setPage}
            label="Payroll runs"
            previousLabel="Previous runs"
            nextLabel="Next runs"
          />
        </>
      )}
      {m.creating && (
        <>
          <p role="status">
            Step {m.step} of 3 · {m.values.length} employees selected (maximum 100 per run)
          </p>
          <p>
            For larger teams, create separate runs with distinct employees. Every selected employee
            is included explicitly.
          </p>
          {m.setup.isError && (
            <p role="alert">
              An approved payroll policy and eligible reviewers are required. Complete policy setup
              before preparing this month.
            </p>
          )}
          {m.step === 1 && (
            <>
              <h3>Choose the approved policy family</h3>
              <p>
                Choose the approved policy for this run. The server requires its current effective
                version for the selected month. Later reviews stay within this policy family.
              </p>
              {m.policyChoices.isError && (
                <p role="alert">Could not load approved policies. Refresh before continuing.</p>
              )}
              <DataTable
                caption="Payroll run policy choices"
                head={
                  <tr>
                    <th scope="col">Policy family</th>
                    <th scope="col">Version / effective date</th>
                    <th scope="col">Choice</th>
                  </tr>
                }
              >
                {!m.policyChoices.isError &&
                  m.policyChoices.currentData?.items
                    .filter((policy) => policy.status === 'ACTIVE')
                    .map((policy) => (
                      <tr key={policy.id}>
                        <td>{policy.policyKey}</td>
                        <td>
                          {policy.version} · {policy.effectiveFrom}
                        </td>
                        <td>
                          <Button variant="secondary" onClick={() => m.choosePolicy(policy)}>
                            {m.policyChoice?.id === policy.id ? 'Selected' : 'Use this policy'}
                          </Button>
                        </td>
                      </tr>
                    ))}
              </DataTable>
              <Pagination
                page={m.policyPage}
                pageSize={25}
                total={m.policyChoices.isError ? 0 : (m.policyChoices.currentData?.total ?? 0)}
                disabled={m.policyChoices.isFetching}
                onPageChange={m.setPolicyPage}
                label="Run policy choices"
                previousLabel="Previous policies"
                nextLabel="Next policies"
              />
              {m.policyChoice && !m.policyChoices.isError && (
                <p>
                  Selected: {m.policyChoice.policyKey} · version {m.policyChoice.version}
                </p>
              )}
              <TextInput
                label="Find a manual draft"
                value={m.search}
                onChange={(e) => {
                  m.setSearch(e.target.value);
                  m.setDraftPage(1);
                }}
              />
              {m.drafts.isError && (
                <p role="alert">Could not load manual drafts. Your selection is preserved.</p>
              )}
              <DataTable
                caption="Select employees for this run"
                head={
                  <tr>
                    <th scope="col">Include</th>
                    <th scope="col">Employee</th>
                    <th scope="col">Draft version</th>
                  </tr>
                }
              >
                {drafts?.items.map((draft) => (
                  <tr key={draft.id}>
                    <td>
                      <Checkbox
                        label={`Include ${draft.employee.code}`}
                        checked={!!m.selected[draft.id]}
                        disabled={!m.selected[draft.id] && m.values.length >= 100}
                        onChange={(e) => m.select(draft, e.target.checked)}
                      />
                    </td>
                    <td>
                      {draft.employee.name} · {draft.employee.code}
                    </td>
                    <td>{draft.version}</td>
                  </tr>
                ))}
              </DataTable>
              <Pagination
                page={m.draftPage}
                pageSize={25}
                total={drafts?.total ?? 0}
                disabled={m.drafts.isFetching}
                onPageChange={m.setDraftPage}
                label="Manual drafts"
                previousLabel="Previous employees"
                nextLabel="Next employees"
              />
              <Button
                disabled={!m.values.length || !setup || m.policyChoices.isError}
                onClick={() => m.setStep(2)}
              >
                Continue to calculation inputs
              </Button>
            </>
          )}
          {m.step === 2 && (
            <>
              <h3>Calculation inputs</h3>
              <p>
                Approved policy replaces the raw manual-draft PF, ESI, professional tax and TDS
                values. This run uses policy calculations and the explicit inputs below. Nothing is
                inferred about eligibility or leave. Enter shared values only when they apply to
                every selected employee, then review individual employees below.
              </p>
              <CalculationInputs
                fields={m.fields}
                onChange={(key, value) => m.setFields({ ...m.fields, [key]: value })}
              />
              <Button variant="secondary" onClick={m.applyFields}>
                Apply these inputs to all {m.values.length} selected employees
              </Button>
              {m.values
                .slice((m.selectedPage - 1) * 25, m.selectedPage * 25)
                .map(({ draft, fields }) => (
                  <details key={draft.id}>
                    <summary>
                      {draft.employee.name} · {draft.employee.code}
                    </summary>
                    <CalculationInputs
                      fields={fields}
                      onChange={(key, value) => m.update(draft.id, key, value)}
                    />
                  </details>
                ))}
              <Pagination
                page={m.selectedPage}
                pageSize={25}
                total={m.values.length}
                onPageChange={m.setSelectedPage}
                label="Selected employees"
                previousLabel="Previous selected"
                nextLabel="Next selected"
              />
              <Button variant="secondary" onClick={() => m.setStep(1)}>
                Back to employees
              </Button>
              <Button onClick={() => m.setStep(3)}>Continue to reviewers</Button>
            </>
          )}
          {m.step === 3 && (
            <>
              <h3>Assign reviewers</h3>
              <p>
                Reviewers must be different people, have live employee links and cannot approve
                their own payroll. Split the run or choose independent reviewers when needed.
              </p>
              <Select
                label="HR reviewer"
                value={m.hrReviewerId}
                onChange={(e) => m.setHr(e.target.value)}
              >
                <option value="">Choose HR reviewer</option>
                {candidates
                  .filter((c) => c.isHrManager)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.employeeCode}
                    </option>
                  ))}
              </Select>
              <Select
                label="Finance approver"
                value={m.financeApproverId}
                onChange={(e) => m.setFinance(e.target.value)}
              >
                <option value="">Choose policy-assigned Finance approver</option>
                {candidates
                  .filter((c) => setup?.policy.financeApproverIds.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.employeeCode}
                    </option>
                  ))}
              </Select>
              {setup?.policy.requiresDirector && (
                <Select
                  label="Director approver"
                  value={m.directorApproverId}
                  onChange={(e) => m.setDirector(e.target.value)}
                >
                  <option value="">Choose policy-assigned Director</option>
                  {candidates
                    .filter((c) => setup?.policy.directorApproverIds.includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.employeeCode}
                      </option>
                    ))}
                </Select>
              )}
              <Textarea
                label="Reason for this run"
                value={m.reason}
                onChange={(e) => m.setReason(e.target.value)}
              />
              <p>
                Approved policy version {setup?.policy.version ?? 'unavailable'}. Finalizer:{' '}
                {setup?.policy.config.finalizerRole ?? 'not configured'}.
              </p>
              <Button variant="secondary" onClick={() => m.setStep(2)}>
                Back to inputs
              </Button>
              <Button disabled={!setup} onClick={m.reviewCreate}>
                Review selected employees and create draft run
              </Button>
            </>
          )}
          <Button variant="secondary" disabled={m.action.busy || !!m.pending} onClick={m.reset}>
            Cancel preparation
          </Button>
        </>
      )}
      {!m.creating && m.id && (
        <section aria-label="Payroll run detail">
          <h3>Run {run?.period ?? ''}</h3>
          {m.detail.isError && (
            <p role="alert">Could not refresh payroll details. Reload before taking an action.</p>
          )}
          {run && (
            <>
              <ol>
                <li>Draft</li>
                <li>HR reviewed</li>
                <li>Finance approved</li>
                {run.requiresDirector && <li>Director approved</li>}
                <li>Finalized</li>
              </ol>
              <p role="status">
                Current stage: {run.status.replaceAll('_', ' ')} · version {run.version} · snapshot{' '}
                {run.generation}
              </p>
              {run.blockedReason && <p role="alert">{run.blockedReason}</p>}
              {run.status === 'FINALIZED' && (
                <p>
                  This payroll is locked. Later salary or policy changes do not change this
                  historical record. No payment has been initiated.
                </p>
              )}
              <p className="setup-note">
                The amounts below are calculated payroll values. PF, ESI, professional tax and TDS
                replace the corresponding raw manual-draft amounts. Review every employee page and
                component before completing HR review. Refreshing sources requires reviewing the new
                snapshot again.
              </p>
              <DataTable
                caption="Immutable payroll employee snapshots"
                head={
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Gross</th>
                    <th scope="col">Deductions</th>
                    <th scope="col">Net</th>
                    <th scope="col">Components</th>
                  </tr>
                }
              >
                {run.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      {line.snapshot.employee.name}
                      <br />
                      {line.snapshot.employee.code}
                    </td>
                    <td>{formatMoney(line.snapshot.gross, 'INR', 2)}</td>
                    <td>{formatMoney(line.snapshot.deductionTotal, 'INR', 2)}</td>
                    <td>{formatMoney(line.snapshot.net, 'INR', 2)}</td>
                    <td>
                      <p>
                        Calculated PF: {formatMoney(line.snapshot.deductions.pf, 'INR', 2)}
                        <br />
                        ESI: {formatMoney(line.snapshot.deductions.esi, 'INR', 2)}
                        <br />
                        Professional tax:{' '}
                        {formatMoney(line.snapshot.deductions.professionalTax, 'INR', 2)}
                        <br />
                        TDS: {formatMoney(line.snapshot.deductions.tds, 'INR', 2)}
                      </p>
                      <details>
                        <summary>View all calculated components</summary>
                        <p>
                          Manual draft version {line.snapshot.source.version} · pay date{' '}
                          {formatBusinessDate(line.snapshot.payDate)}
                        </p>
                        <dl>
                          {Object.entries(line.snapshot.earnings).map(([key, value]) => (
                            <div key={key}>
                              <dt>{key}</dt>
                              <dd>{formatMoney(value, 'INR', 2)}</dd>
                            </div>
                          ))}
                          {Object.entries(line.snapshot.deductions).map(([key, value]) => (
                            <div key={key}>
                              <dt>{key}</dt>
                              <dd>{formatMoney(value, 'INR', 2)}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    </td>
                  </tr>
                ))}
              </DataTable>
              <Pagination
                page={m.linePage}
                pageSize={25}
                total={run.linesTotal}
                disabled={m.detail.isFetching}
                onPageChange={m.setLinePage}
                label="Payroll snapshots"
                previousLabel="Previous employees"
                nextLabel="Next employees"
              />
              {run.status !== 'FINALIZED' && (
                <>
                  <Textarea
                    label="Reason for the next action"
                    value={m.reason}
                    onChange={(e) => m.setReason(e.target.value)}
                  />
                  {run.availableActions.map((kind) => (
                    <Button
                      key={kind}
                      disabled={m.action.busy || m.detail.isError}
                      onClick={() => m.reviewAction(kind)}
                    >
                      {actionLabels[kind]}
                    </Button>
                  ))}
                  {isHrManager && run.status === 'DRAFT' && (
                    <Button
                      disabled={m.action.busy || m.detail.isError}
                      onClick={() => m.reviewAction('REFRESH')}
                    >
                      Refresh source snapshots
                    </Button>
                  )}
                  {!run.availableActions.length && (
                    <p>
                      No approval is available to your account at this stage. Ask the assigned
                      independent reviewer; missing linkage, own payroll or stale sources must be
                      resolved first.
                    </p>
                  )}
                </>
              )}
              <h3>Review history</h3>
              <ol>
                {run.events.map((event) => (
                  <li key={event.id}>
                    {event.action.replaceAll('_', ' ')} · {event.actorName} · {event.createdAt}
                    <p>{event.reason}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
      <ConfirmationDialog
        open={!!m.pending}
        busy={m.action.busy}
        title={m.uncertain ? 'Confirm the previous submission result' : 'Confirm payroll action'}
        headingId="payroll-run-confirm"
        onCancel={m.cancelReview}
        onConfirm={m.submit}
        confirmLabel={m.uncertain ? 'Retry same submission' : 'Confirm action'}
        busyLabel="Saving..."
        cancelLabel="Keep reviewing"
        focusHeading
      >
        {m.uncertain ? (
          <p role="alert">
            The result is uncertain. Retry this same submission key to confirm it. Do not create a
            replacement run.
          </p>
        ) : (
          <p>
            This acts on the reviewed month, selected employees and current version. Approved stages
            lock financial inputs. Finalization is irreversible and does not execute payment.
          </p>
        )}
        {m.pending && 'calculations' in m.pending.body && (
          <>
            <p>
              {m.pending.body.period} · {m.pending.body.calculations.length} selected employees
            </p>
            <ul>
              {m.values.map(({ draft }) => (
                <li key={draft.id}>
                  {draft.employee.name} · {draft.employee.code} · draft version {draft.version}
                </li>
              ))}
            </ul>
          </>
        )}
      </ConfirmationDialog>
    </section>
  );
}
