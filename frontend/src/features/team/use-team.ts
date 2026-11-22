import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { queryState } from '../../shared/api/query-state';
import { runRequest } from '../../shared/api/run-request';
import {
  useTeamQuery,
  useInviteMutation,
  useChangeMemberMutation,
  useRemoveMemberMutation,
  useReinviteMutation,
} from './api';
import type { Account, MemberInput, TeamProps, Delivery } from './types';
type Pending =
  | { kind: 'save'; editing: Account | null; input: MemberInput & { email: string } }
  | { kind: 'remove' | 'reinvite'; account: Account };
export function useTeam({ userId, onSelfRemoved }: TeamProps) {
  const [linking, setLinking] = useState<Account | null>(null);
  const [offset, changeOffset] = useState(0);
  const resource = queryState(useTeamQuery(offset), { items: [], total: 0 });
  const [invite] = useInviteMutation();
  const [changeMember] = useChangeMemberMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [reinvite] = useReinviteMutation();
  const action = useAction();
  const [editing, setEditing] = useState<Account | null>(null),
    [name, setName] = useState(''),
    [email, setEmail] = useState('');
  const [manager, setManager] = useState(false),
    [permissions, setPermissions] = useState<string[]>(['read']);
  const [pending, setPending] = useState<Pending | null>(null),
    [confirmationDetails, setConfirmationDetails] = useState('');
  function reportDelivery(delivery: Delivery, renewed: boolean) {
    const saved = renewed ? 'Invitation renewed' : 'Invitation saved';
    if (delivery === 'sent') action.announce(`${saved} and email sent.`);
    else
      action.announce(
        `${saved}, but email delivery failed.${delivery === 'failed_audit_unavailable' ? ' The delivery failure could not be recorded in the audit log.' : ''} Use Reinvite to retry.`,
        'warning',
      );
  }
  function reset() {
    setEditing(null);
    setName('');
    setEmail('');
    setManager(false);
    setPermissions(['read']);
  }
  function edit(account: Account) {
    setEditing(account);
    setName(account.full_name);
    setEmail(account.email);
    setManager(account.is_hr_manager);
    setPermissions([...account.permissions]);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    setConfirmationDetails(
      `${editing ? 'Update' : 'Invite'} ${name} (${email}). Role: ${manager ? 'HR Manager with all permissions' : 'Team member'}. Selected permissions: ${permissions.join(', ') || 'none'}.`,
    );
    setPending({
      kind: 'save',
      editing,
      input: { fullName: name, email, isHrManager: manager, permissions: [...permissions] },
    });
  }
  function reviewReinvite(account: Account) {
    setConfirmationDetails(
      `Renew ${account.email}'s invitation for 7 days, invalidate open sign-in codes, and send an invitation email.`,
    );
    setPending({ kind: 'reinvite', account });
  }
  function reviewRemove(account: Account) {
    setConfirmationDetails(
      `Remove access for ${account.full_name} (${account.email}). All sessions and open codes will be revoked. Historical attribution remains.`,
    );
    setPending({ kind: 'remove', account });
  }
  function confirmChange() {
    if (!pending) return;
    const snapshot = pending;
    void action.perform(async (signal) => {
      try {
        if (snapshot.kind === 'save') {
          const { email: address, ...details } = snapshot.input;
          const result = snapshot.editing
            ? await runRequest(
                changeMember({
                  id: snapshot.editing.id,
                  body: { ...details, expectedVersion: snapshot.editing.team_version },
                }),
                signal,
              )
            : await runRequest(invite({ ...details, email: address }), signal);
          if (signal.aborted) return;
          reset();
          if ('delivery' in result) reportDelivery(result.delivery, false);
          else action.announce('Permissions saved.');
        } else if (snapshot.kind === 'reinvite') {
          const result = await runRequest(reinvite(snapshot.account), signal);
          if (!signal.aborted) reportDelivery(result.delivery, true);
        } else {
          await runRequest(removeMember(snapshot.account), signal);
          if (signal.aborted) return;
          if (snapshot.account.id === userId) {
            onSelfRemoved();
            return;
          }
          action.announce('Account removed; access revoked.');
        }
      } finally {
        if (!signal.aborted) setPending(null);
      }
    });
  }
  function refresh() {
    void action.perform(async () => {
      await resource.refresh().catch(() => {
        /* RequestState displays this query failure. */
      });
    });
  }
  function setOffset(value: number) {
    action.setMessage('');
    changeOffset(value);
  }
  return {
    linking,
    setLinking,
    userId,
    items: resource.error ? [] : resource.data.items,
    total: resource.data.total,
    offset,
    setOffset,
    editing,
    name,
    setName,
    email,
    setEmail,
    manager,
    setManager,
    permissions,
    setPermissions,
    feedback: action.feedback,
    error: resource.error,
    busy: action.busy,
    loading: resource.loading,
    confirm: pending !== null,
    confirmationDetails,
    cancelConfirmation: () => setPending(null),
    self: editing?.id === userId,
    reset,
    edit,
    submit,
    reviewReinvite,
    reviewRemove,
    confirmChange,
    refresh,
  };
}
export type TeamModel = ReturnType<typeof useTeam>;
