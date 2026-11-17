import { useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Info, Lock } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-white/[0.07] bg-ink-850/80 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5', className)}
      {...rest}
    />
  );
}

interface PanelHeaderProps {
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  accent?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

const ACCENTS = {
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-300',
  violet: 'from-violet-500/20 to-violet-500/5 text-violet-300',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-300',
  rose: 'from-rose-500/20 to-rose-500/5 text-rose-300',
};

export function PanelHeader({ icon: Icon, title, subtitle, action, accent = 'violet', className }: PanelHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start gap-3', className)}>
      {Icon && (
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10', ACCENTS[accent])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-base font-bold text-white sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Número que "rola" até o novo valor. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    const diff = value - start;
    if (Math.abs(diff) < 0.5) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const duration = 700;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(start + diff * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value]);
  return <>{format(display)}</>;
}

interface StatProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  tone?: 'default' | 'good' | 'bad' | 'warn';
  delta?: ReactNode;
  className?: string;
}

const TONES = {
  default: 'text-white',
  good: 'text-emerald-300',
  bad: 'text-rose-300',
  warn: 'text-amber-300',
};

export function Stat({ label, value, icon: Icon, hint, tone = 'default', delta, className }: StatProps) {
  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5', className)}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </p>
      <p className={cn('mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl', TONES[tone])}>{value}</p>
      {delta && <div className="mt-0.5 text-xs">{delta}</div>}
      {hint && <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

interface MeterProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export function Meter({ value, max = 100, label, color, className, size = 'sm' }: MeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('overflow-hidden rounded-full bg-white/[0.07]', size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', !color && 'bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400')}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function Badge({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'good' | 'bad' | 'warn' | 'info' | 'violet'; className?: string }) {
  const tones = {
    default: 'bg-white/[0.06] text-slate-300 ring-white/10',
    good: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
    bad: 'bg-rose-500/10 text-rose-300 ring-rose-400/20',
    warn: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
    info: 'bg-sky-500/10 text-sky-300 ring-sky-400/20',
    violet: 'bg-violet-500/15 text-violet-200 ring-violet-400/25',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', tones[tone], className)}>
      {children}
    </span>
  );
}

export function LockedNote({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold text-slate-400 ring-1 ring-white/10">
      <Lock className="size-3" aria-hidden /> Nível {level}
    </span>
  );
}

export function TipCard({ title = 'Você sabia?', children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-3 rounded-2xl border border-sky-400/15 bg-sky-500/[0.06] p-4', className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
        <Info className="size-4" aria-hidden />
      </span>
      <div className="text-sm leading-relaxed text-slate-300">
        <p className="font-semibold text-white">{title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
