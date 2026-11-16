import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  /** Rótulo acessível quando o conteúdo é apenas visual. */
  ariaLabel?: string;
  hideCheck?: boolean;
}

/** Cartão selecionável que funciona como um botão de rádio nativo (teclado e leitores de tela). */
export function RadioCard({ name, value, checked, onChange, children, className, ariaLabel, hideCheck }: RadioCardProps) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer rounded-2xl border bg-white transition-all duration-150',
        'has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet-500/25',
        checked
          ? 'border-violet-500 bg-violet-50/60 shadow-sm shadow-violet-600/10 ring-1 ring-violet-500'
          : 'border-slate-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md hover:shadow-slate-900/5',
        className,
      )}
    >
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        aria-label={ariaLabel}
      />
      {children}
      {checked && !hideCheck && (
        <span className="absolute right-2 top-2 flex size-5 animate-scale-in items-center justify-center rounded-full bg-violet-600 text-white">
          <Check className="size-3" strokeWidth={3} aria-hidden />
        </span>
      )}
    </label>
  );
}
