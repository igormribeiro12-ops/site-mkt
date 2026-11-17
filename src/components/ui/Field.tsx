import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '../../lib/cn';

export function inputClass(hasError?: boolean, extra?: string) {
  return cn(
    'w-full rounded-xl border bg-ink-950/60 px-3.5 py-2.5 text-[15px] text-white placeholder:text-slate-500 transition',
    'focus:outline-none focus:ring-4',
    hasError ? 'border-rose-400/60 focus:ring-rose-500/20' : 'border-white/10 hover:border-white/20 focus:border-violet-400 focus:ring-violet-500/20',
    extra,
  );
}

interface ShellProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  counter?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, required, hint, error, counter, className, children }: ShellProps) {
  return (
    <div className={className} data-field-error={error ? 'true' : undefined}>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-slate-200">
          {label}
          {required && (
            <span className="ml-0.5 text-rose-400" aria-hidden>
              *
            </span>
          )}
        </label>
        {counter}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-snug text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-rose-300">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return [hint && !error ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export function TextField({ id, label, hint, error, required, wrapperClassName, className, maxLength, value, ...rest }: TextFieldProps) {
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={wrapperClassName}
      counter={maxLength ? <span className="text-xs tabular-nums text-slate-500">{length}/{maxLength}</span> : undefined}
    >
      <input
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={inputClass(!!error, className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export function TextArea({ id, label, hint, error, required, wrapperClassName, className, maxLength, value, rows = 2, ...rest }: TextAreaProps) {
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={wrapperClassName}
      counter={maxLength ? <span className="text-xs tabular-nums text-slate-500">{length}/{maxLength}</span> : undefined}
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={inputClass(!!error, cn('resize-y leading-relaxed', className))}
        {...rest}
      />
    </FieldShell>
  );
}

interface ChoiceCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/** Cartão selecionável acessível (botão de rádio nativo). */
export function ChoiceCard({ name, value, checked, onChange, children, className, disabled }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer rounded-2xl border transition-all duration-200',
        'has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet-500/40',
        checked
          ? 'border-violet-400/70 bg-violet-500/[0.12] shadow-lg shadow-violet-900/30 ring-1 ring-violet-400/50'
          : 'border-white/[0.08] bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <input type="radio" className="sr-only" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} />
      {children}
    </label>
  );
}
