import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';

type FieldProps = { id?: string; label: ReactNode; hint?: string; error?: string };
type FrameProps = FieldProps & { id: string; children: ReactNode; inline?: boolean };
function FieldFrame({ id, label, hint, error, children, inline }: FrameProps) {
  return <div className={`form-field${inline ? ' form-field--checkbox' : ''}`}>
    {inline ? <label htmlFor={id}>{children}{label}</label> : <><label htmlFor={id}>{label}</label>{children}</>}
    {hint && <small id={`${id}-hint`} className="field-hint">{hint}</small>}
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
  </div>;
}
function useField(id: string | undefined, hint: string | undefined, error: string | undefined, describedBy?: string) {
  const generated = useId();
  const fieldId = id ?? generated;
  return { id: fieldId, describedBy: [describedBy, hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined };
}
export type TextInputProps = FieldProps & ComponentProps<'input'>;
export function TextInput({ id, label, hint, error, className = '', ...props }: TextInputProps) {
  const field = useField(id, hint, error, props['aria-describedby']);
  return <FieldFrame {...{ id: field.id, label, hint, error }}><input {...props} id={field.id}
    className={`field-control ${className}`.trim()} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={field.describedBy} /></FieldFrame>;
}
export type SelectProps = FieldProps & ComponentProps<'select'>;
export function Select({ id, label, hint, error, className = '', children, ...props }: SelectProps) {
  const field = useField(id, hint, error, props['aria-describedby']);
  return <FieldFrame {...{ id: field.id, label, hint, error }}><select {...props} id={field.id}
    className={`field-control ${className}`.trim()} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={field.describedBy}>{children}</select></FieldFrame>;
}
export function Textarea({ id, label, hint, error, className = '', ...props }: FieldProps & ComponentProps<'textarea'>) {
  const field = useField(id, hint, error, props['aria-describedby']);
  return <FieldFrame {...{ id: field.id, label, hint, error }}><textarea {...props} id={field.id}
    className={`field-control ${className}`.trim()} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={field.describedBy} /></FieldFrame>;
}
export function Checkbox({ id, label, hint, error, ...props }: FieldProps & Omit<ComponentProps<'input'>, 'type'>) {
  const field = useField(id, hint, error, props['aria-describedby']);
  return <FieldFrame {...{ id: field.id, label, hint, error }} inline><input {...props} id={field.id} type="checkbox"
    aria-invalid={error ? true : props['aria-invalid']} aria-describedby={field.describedBy} /></FieldFrame>;
}
export function Form({ className = '', ...props }: ComponentProps<'form'>) {
  return <form {...props} className={`app-form ${className}`.trim()} />;
}
