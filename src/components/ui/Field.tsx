import { useEffect, useState } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '../../lib/cn';

export function inputClass(hasError?: boolean, extra?: string) {
  return cn(
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-slate-900 shadow-sm shadow-slate-900/[0.02]',
    'placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150',
    'focus:outline-none focus:ring-4',
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
      : 'border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-violet-500/15',
    extra,
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
}

export function RequiredMark() {
  return (
    <span className="ml-0.5 text-rose-500" aria-hidden>
      *
    </span>
  );
}

export function ErrorText({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-rose-600">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

interface FieldShellProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  counter?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, required, hint, error, counter, className, children }: FieldShellProps) {
  return (
    <div className={className} data-field-error={error ? 'true' : undefined}>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
          {required && <RequiredMark />}
        </label>
        {counter}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-slate-500">
          {hint}
        </p>
      )}
      <ErrorText id={`${id}-error`}>{error}</ErrorText>
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
  showCount?: boolean;
}

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  showCount,
  maxLength,
  value,
  ...rest
}: TextFieldProps) {
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={wrapperClassName}
      counter={
        showCount && maxLength ? (
          <span className="text-xs tabular-nums text-slate-400">
            {length}/{maxLength}
          </span>
        ) : undefined
      }
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

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
  /** Limite apenas informativo (mostra o contador, sem bloquear). */
  softLimit?: number;
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  maxLength,
  softLimit,
  value,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  const length = typeof value === 'string' ? value.length : 0;
  const limit = softLimit ?? maxLength;
  const over = limit !== undefined && length > limit;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={wrapperClassName}
      counter={
        limit ? (
          <span className={cn('text-xs tabular-nums', over ? 'font-semibold text-amber-600' : 'text-slate-400')}>
            {length}/{limit}
          </span>
        ) : undefined
      }
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

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  placeholder,
  options,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} className={wrapperClassName}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={inputClass(!!error, cn('appearance-none bg-[length:1.1rem] bg-[right_0.8rem_center] bg-no-repeat pr-10', className))}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Converte texto digitado ("1.234,56", "12,5", "99.90") em número. */
export function parseDecimal(raw: string): number | null {
  let text = raw.replace(/R\$|\s/g, '');
  if (!text) return null;
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  if (!/^-?\d*\.?\d*$/.test(text) || text === '.' || text === '-') return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function formatDecimal(value: number | null, integer: boolean): string {
  if (value === null) return '';
  if (integer) return String(value);
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

interface NumberFieldProps {
  id: string;
  label: ReactNode;
  value: number | null;
  onValueChange: (value: number | null) => void;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  /** Aceita apenas números inteiros. */
  integer?: boolean;
  wrapperClassName?: string;
}

/** Campo numérico tolerante ao formato brasileiro (vírgula decimal). */
export function NumberField({
  id,
  label,
  value,
  onValueChange,
  hint,
  error,
  required,
  placeholder,
  prefix,
  suffix,
  integer = false,
  wrapperClassName,
}: NumberFieldProps) {
  const [text, setText] = useState(() => formatDecimal(value, integer));

  // Sincroniza quando o valor muda por fora (ex.: botão "usar preço médio").
  useEffect(() => {
    setText((current) => (parseDecimal(current) === value ? current : formatDecimal(value, integer)));
  }, [value, integer]);

  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-slate-400">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={inputClass(!!error, cn('tabular-nums', prefix && 'pl-10', suffix && 'pr-16'))}
          onChange={(e) => {
            const raw = integer ? e.target.value.replace(/[^\d]/g, '') : e.target.value.replace(/[^\d.,R$\s-]/g, '');
            setText(raw);
            onValueChange(integer ? (raw === '' ? null : parseInt(raw, 10)) : parseDecimal(raw));
          }}
          onBlur={() => setText(formatDecimal(value, integer))}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

interface FieldGroupProps {
  legend: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
  id?: string;
}

/** Agrupa opções (chips, cartões de escolha) com legenda acessível. */
export function FieldGroup({ legend, required, hint, error, className, children, id }: FieldGroupProps) {
  return (
    <fieldset id={id} className={cn('min-w-0', className)} data-field-error={error ? 'true' : undefined}>
      <legend className="mb-1.5 text-sm font-semibold text-slate-700">
        {legend}
        {required && <RequiredMark />}
      </legend>
      {hint && <p className="-mt-0.5 mb-3 text-[13px] leading-snug text-slate-500">{hint}</p>}
      {children}
      <ErrorText>{error}</ErrorText>
    </fieldset>
  );
}
