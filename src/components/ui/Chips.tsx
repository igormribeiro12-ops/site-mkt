import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { inputClass } from './Field';

export function chipClass(active: boolean, extra?: string) {
  return cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20',
    active
      ? 'border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-600/25'
      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700',
    extra,
  );
}

interface ChipGroupProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Rótulo opcional exibido ao lado de cada opção. */
  renderIcon?: (option: string) => ReactNode;
  max?: number;
}

/** Seleção múltipla em formato de "pílulas". */
export function ChipGroup({ options, value, onChange, renderIcon, max }: ChipGroupProps) {
  const toggle = (option: string) => {
    if (value.includes(option)) onChange(value.filter((v) => v !== option));
    else if (!max || value.length < max) onChange([...value, option]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option)}
            className={chipClass(active)}
          >
            {active ? <Check className="size-3.5" aria-hidden /> : renderIcon?.(option)}
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface SingleChipGroupProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

/** Seleção única em formato de "pílulas" (comporta-se como grupo de rádio). */
export function SingleChipGroup({ options, value, onChange, label }: SingleChipGroupProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? '' : option)}
            className={chipClass(active)}
          >
            {active && <Check className="size-3.5" aria-hidden />}
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  hasError?: boolean;
}

/** Campo para digitar etiquetas livres (Enter ou vírgula para adicionar). */
export function TagInput({ id, value, onChange, suggestions = [], placeholder, max = 12, hasError }: TagInputProps) {
  const [text, setText] = useState('');
  const full = value.length >= max;

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, '').trim();
    if (!tag || full) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag.charAt(0).toUpperCase() + tag.slice(1)]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
      setText('');
    } else if (e.key === 'Backspace' && !text && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <div
        className={cn(
          inputClass(hasError, 'flex min-h-12 flex-wrap items-center gap-1.5 px-2 py-1.5'),
          'focus-within:ring-4',
          hasError ? 'focus-within:ring-rose-500/15' : 'focus-within:border-violet-500 focus-within:ring-violet-500/15',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-50 py-1 pl-2.5 pr-1 text-sm font-medium text-violet-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="rounded p-0.5 text-violet-400 hover:bg-violet-100 hover:text-violet-700"
              aria-label={`Remover ${tag}`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          disabled={full}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (text.trim()) {
              add(text);
              setText('');
            }
          }}
          placeholder={full ? 'Limite de interesses atingido' : value.length ? 'Adicionar outro…' : placeholder}
          className="min-w-[10rem] flex-1 bg-transparent px-1.5 py-1 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          aria-invalid={hasError || undefined}
        />
      </div>
      {remaining.length > 0 && !full && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="mr-1 self-center text-xs font-medium text-slate-400">Sugestões:</span>
          {remaining.slice(0, 12).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
            >
              <Plus className="size-3" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
