import type { ReactNode } from 'react';
import { CalendarDays, CircleDollarSign, Flag, Megaphone, Newspaper, Repeat, Star } from 'lucide-react';
import type { MarketingPlan } from '../../types';
import { getChannel } from '../../lib/constants';
import { formatCurrency, formatDateShort, toISODate } from '../../lib/format';
import { cn } from '../../lib/cn';
import { PlatformIcon } from '../brand/PlatformIcon';

function Row({ icon: Icon, label, children }: { icon: typeof Flag; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 print-avoid-break">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-slate-600">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {children}
      </div>
    </div>
  );
}

function Missing() {
  return <span className="italic text-slate-400">Ainda não definido</span>;
}

interface Props {
  marketing: MarketingPlan;
  className?: string;
  /** Quantas publicações do calendário mostrar. */
  calendarLimit?: number;
}

export function MarketingSummary({ marketing: m, className, calendarLimit = 4 }: Props) {
  const today = toISODate(new Date());
  const sorted = [...m.calendar].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((e) => e.date >= today);
  const entries = (upcoming.length ? upcoming : sorted).slice(0, calendarLimit);

  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex flex-wrap gap-2">
        {m.channels.length === 0 ? (
          <Missing />
        ) : (
          m.channels.map((id) => {
            const channel = getChannel(id)!;
            const main = m.mainChannel === id;
            return (
              <span
                key={id}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold',
                  main ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-700',
                )}
              >
                <span className="flex size-7 items-center justify-center rounded-full text-white" style={{ background: channel.color }}>
                  <PlatformIcon channel={id} className="size-3.5" />
                </span>
                {channel.label}
                {main && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-violet-600">
                    <Star className="size-3 fill-violet-500 text-violet-500" aria-hidden /> principal
                  </span>
                )}
              </span>
            );
          })
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Row icon={Megaphone} label="Como vai divulgar">
          {m.promotion.trim() ? <p className="whitespace-pre-line">{m.promotion}</p> : <Missing />}
          {m.tactics.length > 0 && <p className="mt-1 text-xs text-slate-500">{m.tactics.join(' · ')}</p>}
        </Row>
        <Row icon={Newspaper} label="Estratégia de conteúdo">
          {m.contentStrategy.trim() ? <p className="whitespace-pre-line">{m.contentStrategy}</p> : <Missing />}
          {m.contentPillars.length > 0 && <p className="mt-1 text-xs text-slate-500">{m.contentPillars.join(' · ')}</p>}
        </Row>
        <Row icon={Repeat} label="Frequência">
          {m.frequency ? <p>{m.frequency}</p> : <Missing />}
        </Row>
        <Row icon={CircleDollarSign} label="Investimento em anúncios">
          {m.adBudget === null ? (
            <Missing />
          ) : m.adBudget === 0 ? (
            <p>Sem anúncios pagos — apenas divulgação orgânica</p>
          ) : (
            <p>{formatCurrency(m.adBudget)} por mês</p>
          )}
        </Row>
        <Row icon={Flag} label="Resultado desejado">
          {m.goalType && <p className="font-semibold text-slate-800">{m.goalType}</p>}
          {m.goal.trim() ? <p className="whitespace-pre-line">{m.goal}</p> : <Missing />}
        </Row>
        <Row icon={CalendarDays} label={upcoming.length ? 'Próximas publicações' : 'Calendário editorial'}>
          {entries.length === 0 ? (
            <Missing />
          ) : (
            <ul className="mt-0.5 space-y-1">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2">
                  <span className="w-[4.5rem] shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums text-slate-500">{formatDateShort(entry.date)}</span>
                  <PlatformIcon channel={entry.channel} className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{entry.title}</span>
                </li>
              ))}
              {m.calendar.length > entries.length && (
                <li className="text-xs text-slate-400">+ {m.calendar.length - entries.length} no calendário</li>
              )}
            </ul>
          )}
        </Row>
      </div>
    </div>
  );
}
