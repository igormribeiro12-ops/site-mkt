import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { money } from '../../game/format';
import { cn } from '../../lib/cn';
import { useUi } from '../../state/GameContext';
import { chooseDialog } from '../../world/actions';

/** Caixa de diálogo dos personagens (eventos, conversas, resultados). */
export function DialogBox() {
  const dialog = useUi((u) => u.dialog);
  const [shown, setShown] = useState(0);
  const text = dialog?.text ?? '';

  // Efeito de "digitação" do texto.
  useEffect(() => {
    setShown(0);
    if (!text) return;
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(id);
          return n;
        }
        return Math.min(text.length, n + 3);
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [text]);

  if (!dialog) return null;
  const done = shown >= text.length;

  return (
    <div className="absolute inset-x-0 bottom-24 z-40 flex justify-center px-3 sm:bottom-28" role="dialog" aria-modal="true" aria-label={`Conversa com ${dialog.speaker}`}>
      <div className="w-full max-w-2xl animate-scale-in rounded-3xl border-2 border-violet-400/40 bg-ink-900/97 p-4 shadow-2xl shadow-black/60">
        <div className="flex gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-violet-500/30 to-ink-800 max-sm:size-14">
            {dialog.portrait ? (
              <img src={dialog.portrait} alt="" className="size-full object-cover object-top [image-rendering:auto] scale-[1.6] translate-y-3" />
            ) : (
              <MessageCircle className="size-8 text-violet-200" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-white">{dialog.speaker}</p>
            {dialog.role && <p className="text-xs font-semibold text-violet-300">{dialog.role}</p>}
            <p
              className="mt-2 min-h-12 cursor-pointer text-sm leading-relaxed text-slate-200"
              onClick={() => setShown(text.length)}
              aria-live="polite"
            >
              {text.slice(0, shown)}
              {!done && <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-violet-300" aria-hidden />}
            </p>
          </div>
        </div>
        {dialog.choices && (
          <div className={cn('mt-4 grid gap-2', dialog.choices.length > 1 && 'sm:grid-cols-2', !done && 'pointer-events-none opacity-0')}>
            {dialog.choices.map((c, i) => (
              <button
                key={c.id}
                type="button"
                disabled={c.disabled}
                onClick={() => chooseDialog(c.id)}
                autoFocus={i === 0 && done}
                className={cn(
                  'rounded-2xl border px-3.5 py-2.5 text-left transition',
                  c.disabled ? 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50' : 'border-white/10 bg-white/[0.05] hover:border-violet-400/60 hover:bg-violet-500/15',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{c.label}</span>
                  {c.cost ? <span className="shrink-0 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-200">{money(c.cost)}</span> : null}
                </span>
                {c.hint && <span className="mt-0.5 block text-xs text-slate-400">{c.hint}</span>}
                {c.disabled && c.disabledReason && <span className="mt-0.5 block text-xs font-semibold text-rose-300">{c.disabledReason}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
