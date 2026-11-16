import { useEffect, useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import { SWATCHES, describeColor, isHexColor, readableText } from '../../lib/colors';
import { cn } from '../../lib/cn';
import { ErrorText, RequiredMark, inputClass } from '../ui/Field';

interface ColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export function ColorPicker({ id, label, value, onChange, error, required }: ColorPickerProps) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const meaning = describeColor(value);
  const hasValue = isHexColor(value);

  return (
    <fieldset className="min-w-0" data-field-error={error ? 'true' : undefined}>
      <legend className="mb-2 text-sm font-semibold text-slate-700">
        {label}
        {required && <RequiredMark />}
      </legend>
      <div className="flex items-center gap-3">
        <label
          className={cn(
            'relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 shadow-inner transition',
            'has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet-500/25',
            hasValue ? 'border-white shadow-slate-900/10 ring-1 ring-slate-200' : 'border-dashed border-slate-300 bg-slate-50',
          )}
          style={hasValue ? { background: value } : undefined}
          title="Escolher qualquer cor"
        >
          <Pipette className="size-5" style={{ color: hasValue ? readableText(value) : '#94a3b8' }} aria-hidden />
          <input
            id={id}
            type="color"
            value={hasValue ? value : '#7c3aed'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label}: escolher qualquer cor`}
          />
        </label>
        <div className="min-w-0 flex-1">
          <input
            value={hex}
            onChange={(e) => {
              const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
              setHex(next);
              if (isHexColor(next)) onChange(next.toLowerCase());
            }}
            onBlur={() => setHex(value)}
            placeholder="#000000"
            maxLength={7}
            aria-label={`${label}: código hexadecimal`}
            aria-invalid={error ? true : undefined}
            className={inputClass(!!error, 'font-mono text-sm uppercase')}
          />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-10 gap-1.5" role="group" aria-label={`Cores sugeridas para ${label.toLowerCase()}`}>
        {SWATCHES.map((swatch) => {
          const selected = value.toLowerCase() === swatch;
          return (
            <button
              key={swatch}
              type="button"
              onClick={() => onChange(swatch)}
              aria-label={`Usar a cor ${swatch}`}
              aria-pressed={selected}
              className={cn(
                'flex aspect-square items-center justify-center rounded-lg ring-1 ring-black/5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30',
                selected && 'scale-110 ring-2 ring-slate-900/70',
              )}
              style={{ background: swatch }}
            >
              {selected && <Check className="size-3.5" style={{ color: readableText(swatch) }} strokeWidth={3} aria-hidden />}
            </button>
          );
        })}
      </div>
      {meaning && (
        <p className="mt-2.5 text-[13px] leading-snug text-slate-500">
          <strong className="text-slate-700">{meaning.name}</strong> costuma transmitir {meaning.meaning}.
        </p>
      )}
      <ErrorText>{error}</ErrorText>
    </fieldset>
  );
}
