import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Info, Lightbulb, TriangleAlert } from 'lucide-react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-center',
        compact ? 'px-4 py-6' : 'px-6 py-12',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 text-violet-600',
          compact ? 'mb-3 size-11' : 'mb-4 size-14',
        )}
      >
        <Icon className={compact ? 'size-5' : 'size-6'} aria-hidden />
      </span>
      <p className={cn('font-bold text-slate-800', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && (
        <p className={cn('mx-auto mt-1 max-w-sm text-slate-500', compact ? 'text-xs' : 'text-sm')}>{description}</p>
      )}
      {action && <div className={compact ? 'mt-3' : 'mt-5'}>{action}</div>}
    </div>
  );
}

interface CalloutProps {
  tone?: 'tip' | 'info' | 'warning';
  title?: string;
  children: ReactNode;
  className?: string;
}

const CALLOUT: Record<NonNullable<CalloutProps['tone']>, { icon: LucideIcon; box: string; icon_: string; title: string }> = {
  tip: {
    icon: Lightbulb,
    box: 'border-amber-200/80 bg-amber-50/70',
    icon_: 'bg-amber-100 text-amber-600',
    title: 'Dica de marketing',
  },
  info: {
    icon: Info,
    box: 'border-indigo-200/80 bg-indigo-50/60',
    icon_: 'bg-indigo-100 text-indigo-600',
    title: 'Para saber',
  },
  warning: {
    icon: TriangleAlert,
    box: 'border-orange-200 bg-orange-50/80',
    icon_: 'bg-orange-100 text-orange-600',
    title: 'Atenção',
  },
};

export function Callout({ tone = 'tip', title, children, className }: CalloutProps) {
  const style = CALLOUT[tone];
  const Icon = style.icon;
  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4', style.box, className)}>
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-xl', style.icon_)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-slate-700">
        <p className="font-bold text-slate-900">{title ?? style.title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, label = 'Progresso', className, size = 'md' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn('overflow-hidden rounded-full bg-slate-200/70', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-[width] duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  trackColor?: string;
  color?: string;
  children?: ReactNode;
}

export function ProgressRing({
  value,
  size = 88,
  stroke = 8,
  className,
  trackColor = 'rgb(226 232 240)',
  color = 'url(#ring-gradient)',
  children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% concluído`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
