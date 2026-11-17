import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, Check, Megaphone, ShoppingCart, Star, Users } from 'lucide-react';
import { cn } from '../../lib/cn';

const STEPS = [
  { label: 'Calculando despesas', icon: Calculator },
  { label: 'Rodando campanhas de marketing', icon: Megaphone },
  { label: 'Simulando vendas', icon: ShoppingCart },
  { label: 'Atualizando clientes', icon: Users },
  { label: 'Atualizando reputação', icon: Star },
];

export const SIMULATION_MS = 1500;

/** Transição animada enquanto o mês é simulado. */
export function SimulatingOverlay({ month, onDone }: { month: number; onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const per = SIMULATION_MS / STEPS.length;
    const timers = STEPS.map((_, i) => window.setTimeout(() => setStep(i + 1), per * (i + 1)));
    const done = window.setTimeout(onDone, SIMULATION_MS + 150);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [onDone]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/85 p-6 backdrop-blur-md" role="status" aria-live="polite">
      <div className="w-full max-w-sm animate-scale-in rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Simulando</p>
        <p className="mt-1 text-center font-display text-3xl font-bold text-white">Mês {month}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400 transition-[width] duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
        <ul className="mt-5 space-y-2.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.label} className={cn('flex items-center gap-3 text-sm transition', done ? 'text-slate-300' : active ? 'text-white' : 'text-slate-600')}>
                <span className={cn('flex size-7 items-center justify-center rounded-lg', done ? 'bg-emerald-500/20 text-emerald-300' : active ? 'bg-violet-500/25 text-violet-200' : 'bg-white/[0.04]')}>
                  {done ? <Check className="size-4" aria-hidden /> : <Icon className={cn('size-4', active && 'animate-pulse')} aria-hidden />}
                </span>
                {s.label}…
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
