import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6',
        className,
      )}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}

export function CardHeader({ icon: Icon, title, description, action, className, as = 'h2' }: CardHeaderProps) {
  const Heading = as;
  return (
    <div className={cn('mb-5 flex items-start gap-3', className)}>
      {Icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-100 text-violet-600">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Heading className="text-base font-bold text-slate-900 sm:text-lg">{title}</Heading>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
