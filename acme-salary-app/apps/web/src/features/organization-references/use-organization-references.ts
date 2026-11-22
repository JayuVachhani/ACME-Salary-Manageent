import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { queryState } from '../../shared/api/query-state';
import { runRequest } from '../../shared/api/run-request';
import { useReferencesQuery, useSaveReferenceMutation } from './api';
import type { Reference, Kind, PendingReference } from './types';
export function useOrganizationReferences() {
  const [kind, setKind] = useState<Kind>('departments'),
    [offset, changeOffset] = useState(0);
  const resource = queryState(useReferencesQuery({ kind, offset }), { items: [], total: 0 });
  const [saveReference] = useSaveReferenceMutation();
  const action = useAction();
  const [name, setName] = useState(''),
    [editing, setEditing] = useState<Reference | null>(null),
    [active, setActive] = useState(true);
  const [pending, setPending] = useState<PendingReference | null>(null);
  function reset() {
    setEditing(null);
    setName('');
    setActive(true);
  }
  function edit(item: Reference) {
    setEditing(item);
    setName(item.name);
    setActive(item.is_active);
  }
  function changeKind(value: Kind) {
    setKind(value);
    changeOffset(0);
    action.setMessage('');
    reset();
  }
  function setOffset(value: number) {
    action.setMessage('');
    changeOffset(value);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      action.setMessage('Enter a reference name.', 'error');
      return;
    }
    setPending({ kind, name: name.trim(), isActive: active, editing });
  }
  function refresh() {
    void action.perform(async () => {
      await resource.refresh().catch(() => {
        /* RequestState displays this query failure. */
      });
    });
  }
  function confirmChange() {
    if (!pending) return;
    const snapshot = pending;
    void action.perform(async (signal) => {
      try {
        await runRequest(saveReference(snapshot), signal);
        if (signal.aborted) return;
        reset();
        action.announce('Reference saved.');
      } finally {
        if (!signal.aborted) setPending(null);
      }
    });
  }
  return {
    kind,
    changeKind,
    offset,
    setOffset,
    items: resource.error ? [] : resource.data.items,
    total: resource.data.total,
    name,
    setName,
    editing,
    active,
    setActive,
    busy: action.busy,
    loading: resource.loading,
    feedback: action.feedback,
    error: resource.error,
    pending,
    cancelConfirmation: () => setPending(null),
    reset,
    edit,
    submit,
    refresh,
    confirmChange,
  };
}
export type ReferencesModel = ReturnType<typeof useOrganizationReferences>;
