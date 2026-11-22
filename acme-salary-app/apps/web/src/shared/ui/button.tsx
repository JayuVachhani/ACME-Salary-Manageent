import type { ComponentProps } from 'react';
type Props = ComponentProps<'button'> & {
  busy?: boolean;
  busyLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger';
};
export function Button({
  type = 'button',
  busy = false,
  busyLabel,
  disabled,
  variant = 'primary',
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`button button--${variant} ${className}`.trim()}
    >
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}
