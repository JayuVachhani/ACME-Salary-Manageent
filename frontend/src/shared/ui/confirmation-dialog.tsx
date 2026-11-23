import { Button } from './button';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  busy: boolean;
  title: string;
  headingId: string;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  busyLabel: string;
  cancelLabel: string;
  className?: string;
  confirmFirst?: boolean;
  focusHeading?: boolean;
  confirmDisabled?: boolean;
};

export function ConfirmationDialog({
  open,
  busy,
  title,
  headingId,
  children,
  onCancel,
  onConfirm,
  confirmLabel,
  busyLabel,
  cancelLabel,
  className,
  confirmFirst = false,
  focusHeading = false,
  confirmDisabled = false,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (open && !node?.open) {
      node?.showModal();
      if (focusHeading) heading.current?.focus();
    } else if (!open && node?.open) node.close();
    return () => {
      if (node?.open) node.close();
    };
  }, [open, focusHeading]);
  const confirm = (
    <Button
      autoFocus={confirmFirst}
      busy={busy}
      disabled={confirmDisabled}
      busyLabel={busyLabel}
      onClick={onConfirm}
    >
      {confirmLabel}
    </Button>
  );
  const cancel = (
    <Button disabled={busy} onClick={onCancel}>
      {cancelLabel}
    </Button>
  );
  return (
    <dialog
      ref={dialog}
      className={className}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h3 id={headingId} ref={heading} tabIndex={focusHeading ? -1 : undefined}>
        {title}
      </h3>
      {children}
      {confirmFirst ? (
        <>
          {confirm}
          {cancel}
        </>
      ) : (
        <>
          {cancel}
          {confirm}
        </>
      )}
    </dialog>
  );
}
