import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean; busy: boolean; title: string; headingId: string; children: ReactNode;
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; busyLabel: string; cancelLabel: string;
  className?: string; confirmFirst?: boolean;
};

export function ConfirmationDialog({ open, busy, title, headingId, children, onCancel, onConfirm,
  confirmLabel, busyLabel, cancelLabel, className, confirmFirst = false }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (open && !node?.open) node?.showModal();
    else if (!open && node?.open) node.close();
    return () => { if (node?.open) node.close(); };
  }, [open]);
  const confirm = <button autoFocus={confirmFirst} disabled={busy} onClick={onConfirm}>{busy ? busyLabel : confirmLabel}</button>;
  const cancel = <button disabled={busy} onClick={onCancel}>{cancelLabel}</button>;
  return <dialog ref={dialog} className={className} aria-labelledby={headingId} onCancel={event => {
    event.preventDefault(); if (!busy) onCancel();
  }}><h3 id={headingId}>{title}</h3>{children}{confirmFirst ? <>{confirm}{cancel}</> : <>{cancel}{confirm}</>}</dialog>;
}
