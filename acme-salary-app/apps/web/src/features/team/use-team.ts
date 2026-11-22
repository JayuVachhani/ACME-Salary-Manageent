import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { useResource } from '../../shared/hooks/use-resource';
import { teamApi } from './api';
import type { Account, MemberInput, TeamProps } from './types';
type Pending = { kind: 'save'; editing: Account | null; input: MemberInput & { email: string } } | { kind: 'remove' | 'reinvite'; account: Account };
export function useTeam({ userId, onSelfRemoved }: TeamProps) {
  const [offset, changeOffset] = useState(0);
  const loadPage = useCallback((signal: AbortSignal) => teamApi.list(offset, signal), [offset]);
  const resource = useResource(loadPage, { items: [] as Account[], total: 0 }); const action = useAction();
  const [editing, setEditing] = useState<Account | null>(null), [name, setName] = useState(''), [email, setEmail] = useState('');
  const [manager, setManager] = useState(false), [permissions, setPermissions] = useState<string[]>(['read']);
  const [pending, setPending] = useState<Pending | null>(null), [confirmationDetails, setConfirmationDetails] = useState('');
  function reset() { setEditing(null); setName(''); setEmail(''); setManager(false); setPermissions(['read']); }
  function edit(account: Account) { setEditing(account); setName(account.full_name); setEmail(account.email); setManager(account.is_hr_manager); setPermissions([...account.permissions]); }
  function submit(event: FormEvent) {
    event.preventDefault();
    setConfirmationDetails(`${editing ? 'Update' : 'Invite'} ${name} (${email}). Role: ${manager ? 'HR Manager with all permissions' : 'Team member'}. Selected permissions: ${permissions.join(', ') || 'none'}.`);
    setPending({ kind: 'save', editing, input: { fullName: name, email, isHrManager: manager, permissions: [...permissions] } });
  }
  function reviewReinvite(account: Account) {
    setConfirmationDetails(`Renew ${account.email}'s invitation for 7 days, invalidate open sign-in codes, and send an invitation email.`);
    setPending({ kind: 'reinvite', account });
  }
  function reviewRemove(account: Account) {
    setConfirmationDetails(`Remove access for ${account.full_name} (${account.email}). All sessions and open codes will be revoked. Historical attribution remains.`);
    setPending({ kind: 'remove', account });
  }
  function confirmChange() { if (!pending) return; const snapshot = pending; void action.perform(async signal => {
    try {
      if (snapshot.kind === 'save') {
        const { email: address, ...details } = snapshot.input;
        const result = snapshot.editing ? await teamApi.change(snapshot.editing.id, { ...details, expectedVersion: snapshot.editing.team_version }, signal)
          : await teamApi.invite({ ...details, email: address }, signal);
        if (signal.aborted) return;
        reset(); await resource.refresh();
        action.setMessage('delivery' in result && result.delivery === 'failed' ? 'Invitation saved, but email delivery failed. Use Reinvite to retry.' : snapshot.editing ? 'Permissions saved.' : 'Invitation saved and email sent.');
      } else if (snapshot.kind === 'reinvite') {
        const result = await teamApi.reinvite(snapshot.account, signal); await resource.refresh();
        if (!signal.aborted) action.setMessage(result.delivery === 'failed' ? 'Invitation renewed; email delivery failed.' : 'Invitation renewed and email sent.');
      } else {
        await teamApi.remove(snapshot.account, signal); if (signal.aborted) return;
        if (snapshot.account.id === userId) { onSelfRemoved(); return; }
        await resource.refresh(); action.setMessage('Account removed; access revoked.');
      }
    } finally { if (!signal.aborted) setPending(null); }
  }); }
  function refresh() { void action.perform(async () => { await resource.refresh(); }); }
  function setOffset(value: number) { action.setMessage(''); changeOffset(value); }
  return { userId, items: resource.error ? [] : resource.data.items, total: resource.data.total, offset, setOffset,
    editing, name, setName, email, setEmail, manager, setManager, permissions, setPermissions, message: action.message || resource.error,
    busy: action.busy, loading: resource.loading, confirm: pending !== null, confirmationDetails, cancelConfirmation: () => setPending(null),
    self: editing?.id === userId, reset, edit, submit, reviewReinvite, reviewRemove, confirmChange, refresh };
}
export type TeamModel = ReturnType<typeof useTeam>;
