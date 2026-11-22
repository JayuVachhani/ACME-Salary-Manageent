import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  canClose?: boolean;
  contextLabel?: string;
  closeLabel?: string;
};

/** Native modal semantics provide focus containment and inert background content. */
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  canClose = true,
  contextLabel = 'Details',
  closeLabel = 'Close details',
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node?.showModal();
    heading.current?.focus();
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="detail-modal"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        if (canClose) onClose();
      }}
    >
      <div className="detail-modal-header">
        <div>
          <p className="eyebrow">{contextLabel}</p>
          <h2 id={headingId} ref={heading} tabIndex={-1}>
            {title}
          </h2>
          {subtitle && <p className="detail-modal-subtitle">{subtitle}</p>}
        </div>
        <Button variant="secondary" disabled={!canClose} onClick={onClose} aria-label={closeLabel}>
          Close
        </Button>
      </div>
      <div className="detail-modal-body">{children}</div>
    </dialog>,
    document.body,
  );
}
