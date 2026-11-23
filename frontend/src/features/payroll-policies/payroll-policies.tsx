import { PolicyConfiguration } from './policy-configuration';
import { useState } from 'react';
import { usePayrollPoliciesQuery, useApprovePayrollPolicyMutation, type Policy } from './api';
import { PayrollPolicyEditor } from './payroll-policy-editor';
import { Tabs } from '../../shared/ui/tabs';
import { Button } from '../../shared/ui/button';
import { Textarea } from '../../shared/ui/form-controls';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
import { useAction } from '../../shared/hooks/use-action';
import { runRequest } from '../../shared/api/run-request';
import { baseApi } from '../../shared/api/base-api';
export function PayrollPolicies() {
  const [tab, setTab] = useState('versions'),
    [page, setPage] = useState(1);
  const query = usePayrollPoliciesQuery(page);
  const session = baseApi.useSessionQuery(undefined, { refetchOnMountOrArgChange: false });
  const [selected, setSelected] = useState<Policy | null>(null),
    [comment, setComment] = useState('');
  const [approve] = useApprovePayrollPolicyMutation();
  const action = useAction();
  function confirm() {
    if (!selected || !comment.trim()) return;
    void action.perform(async (signal) => {
      await runRequest(approve({ id: selected.id, comment, confirmed: true }), signal);
      if (signal.aborted) return;
      setSelected(null);
      action.announce(
        'Policy approved. Its immutable version can be used from its effective payroll month.',
      );
    });
  }
  return (
    <section className="team-panel">
      <h2>Payroll policies</h2>
      <p>
        Versioned India/INR rules with no inferred statutory rates. A different linked HR manager
        approves every version.
      </p>
      <Tabs
        label="Payroll policy tools"
        selected={tab}
        onSelect={setTab}
        tabs={[
          {
            id: 'versions',
            label: 'Policy history',
            content: (
              <>
                {query.isFetching && <p role="status">Loading policies…</p>}
                {query.error && (
                  <p role="alert">
                    Could not load policies. Retry after signing in as an HR manager.
                  </p>
                )}
                {query.currentData?.items.map((policy) => (
                  <section className="profile-section" key={policy.id}>
                    <h3>
                      {policy.config.name} · version {policy.version}
                    </h3>
                    <p>
                      {policy.policyKey} · starts {policy.effectiveFrom} ·{' '}
                      {policy.status === 'ACTIVE'
                        ? 'Approved'
                        : 'Inactive — awaiting independent approval'}
                    </p>
                    <p>
                      Created by {policy.createdByName}. Approved by{' '}
                      {policy.approvedByName ?? 'Not approved yet'}. Finance approvers:{' '}
                      {policy.config.financeApproverIds.length}. Director approval:{' '}
                      {policy.config.requiresDirector ? 'Required' : 'Not required'}. Finalizer:{' '}
                      {policy.config.finalizerRole}.
                    </p>
                    <details>
                      <summary>Review saved rules and assigned colleagues</summary>
                      <PolicyConfiguration policy={policy} />
                    </details>
                    {policy.status === 'INACTIVE' &&
                      policy.createdBy !== session.currentData?.id && (
                        <Button
                          onClick={() => {
                            setSelected(policy);
                            setComment('');
                          }}
                        >
                          Approve policy version
                        </Button>
                      )}
                  </section>
                ))}
                <div className="pagination">
                  <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Previous policies
                  </Button>
                  <Button
                    disabled={!query.currentData || page * 25 >= query.currentData.total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next policies
                  </Button>
                </div>
              </>
            ),
          },
          { id: 'create', label: 'Create policy', content: <PayrollPolicyEditor /> },
        ]}
      />
      <ConfirmationDialog
        open={Boolean(selected)}
        busy={action.busy}
        className="team-confirm"
        title="Approve this immutable policy version?"
        headingId="policy-approval-confirm"
        confirmLabel="Approve policy"
        busyLabel="Approving policy…"
        cancelLabel="Cancel approval"
        onCancel={() => setSelected(null)}
        onConfirm={confirm}
      >
        <p>
          {selected?.config.name} · version {selected?.version} · effective{' '}
          {selected?.effectiveFrom}.
        </p>
        {selected && <PolicyConfiguration policy={selected} />}
        <p>Approval activates this exact version and assigned responsibilities.</p>
        <Textarea
          label="Approval comment"
          required
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {!comment.trim() && <p>Enter an approval comment before confirming.</p>}
      </ConfirmationDialog>
    </section>
  );
}
