import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}

/** Janela lateral do jogo (abre por cima do cenário e pausa o tempo). */
export function SidePanel({ title, subtitle, icon: Icon, accent = 'from-violet-500 to-blue-500', onClose, children, wide, footer }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Fechar janela" tabIndex={-1} onClick={onClose} className="pointer-events-auto absolute inset-0 cursor-default bg-ink-950/40 backdrop-blur-[1px] animate-fade-in" />
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'pointer-events-auto relative flex h-full w-full flex-col border-l border-white/10 bg-ink-900/97 shadow-2xl shadow-black/60 animate-slide-in',
          wide ? 'sm:w-[min(980px,94vw)]' : 'sm:w-[440px]',
        )}
      >
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <span className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', accent)}>
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-white">{title}</h2>
            {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
          </div>
          <span className="hidden rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:inline">Jogo pausado</span>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer && <footer className="border-t border-white/[0.07] p-3">{footer}</footer>}
      </section>
    </div>
  );
}
