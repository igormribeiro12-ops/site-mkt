import { FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export function AppLogo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/25', className)}
      aria-label="Startup Lab — página inicial"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-violet-600/25 transition-transform duration-300 group-hover:-rotate-6">
        <FlaskConical className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="text-[17px] font-extrabold tracking-tight text-slate-900">
          Startup<span className="text-gradient">Lab</span>
        </span>
      )}
    </Link>
  );
}
