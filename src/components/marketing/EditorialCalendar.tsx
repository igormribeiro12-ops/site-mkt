import { useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import type { CalendarEntry } from '../../types';
import { getChannel } from '../../lib/constants';
import { formatDateLong, parseISODate, toISODate } from '../../lib/format';
import { cn } from '../../lib/cn';
import { PlatformIcon } from '../brand/PlatformIcon';
import { Button, IconButton } from '../ui/Button';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function monthLabel(date: Date) {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

interface Props {
  entries: CalendarEntry[];
  onAdd: (date: string) => void;
  onEdit: (entry: CalendarEntry) => void;
}

export function EditorialCalendar({ entries, onAdd, onEdit }: Props) {
  const todayISO = toISODate(new Date());
  const [month, setMonth] = useState(() => {
    const upcoming = [...entries].filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date))[0];
    return startOfMonth(upcoming ? parseISODate(upcoming.date) : new Date());
  });

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  const monthEntries = entries
    .filter((e) => {
      const d = parseISODate(e.date);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const shift = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const defaultDate =
    month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear()
      ? todayISO
      : toISODate(month);

  // Remove semanas finais vazias que pertencem ao mês seguinte.
  const visibleDays = days[35].getMonth() !== month.getMonth() ? days.slice(0, 35) : days;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton label="Mês anterior" onClick={() => shift(-1)}>
            <ChevronLeft className="size-5" />
          </IconButton>
          <h3 className="min-w-40 text-center text-base font-bold text-slate-900" aria-live="polite">
            {monthLabel(month)}
          </h3>
          <IconButton label="Próximo mês" onClick={() => shift(1)}>
            <ChevronRight className="size-5" />
          </IconButton>
          <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Hoje
          </Button>
        </div>
        <Button size="sm" icon={<CalendarPlus className="size-4" aria-hidden />} onClick={() => onAdd(defaultDate)}>
          Planejar publicação
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {visibleDays.map((day, i) => {
            const iso = toISODate(day);
            const inMonth = day.getMonth() === month.getMonth();
            const isToday = iso === todayISO;
            const list = byDate.get(iso) ?? [];
            return (
              <div
                key={iso}
                className={cn(
                  'group relative min-h-16 border-slate-100 p-1 sm:min-h-24 sm:p-1.5',
                  i % 7 !== 6 && 'border-r',
                  i < visibleDays.length - 7 && 'border-b',
                  inMonth ? 'bg-white' : 'bg-slate-50/70',
                )}
              >
                <button
                  type="button"
                  onClick={() => onAdd(iso)}
                  className="absolute inset-0 transition hover:bg-violet-50/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500"
                  aria-label={`Planejar publicação em ${formatDateLong(iso)}`}
                />
                <span
                  className={cn(
                    'pointer-events-none relative flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                    isToday ? 'bg-violet-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300',
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="relative mt-1 flex flex-wrap gap-1 sm:flex-col sm:flex-nowrap">
                  {list.slice(0, 3).map((entry) => {
                    const channel = getChannel(entry.channel);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onEdit(entry)}
                        title={`${entry.title} · ${channel?.label} · ${entry.format}`}
                        className="flex min-w-0 items-center gap-1 rounded-md text-left text-[11px] font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 max-sm:size-2.5 max-sm:rounded-full sm:px-1.5 sm:py-0.5"
                        style={{ background: channel?.color }}
                      >
                        <PlatformIcon channel={entry.channel} className="hidden size-3 shrink-0 sm:block" />
                        <span className="truncate max-sm:sr-only">{entry.title}</span>
                      </button>
                    );
                  })}
                  {list.length > 3 && <span className="text-[10px] font-semibold text-slate-500">+{list.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-slate-700">
          Publicações planejadas em {monthLabel(month).toLowerCase()}
        </p>
        {monthEntries.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Nenhuma publicação neste mês. Clique em um dia do calendário para planejar.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {monthEntries.map((entry) => {
              const channel = getChannel(entry.channel);
              return (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: channel?.color }}
                  >
                    <PlatformIcon channel={entry.channel} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{entry.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDateLong(entry.date)} · {channel?.label} · {entry.format}
                    </p>
                  </div>
                  <IconButton label={`Editar ${entry.title}`} onClick={() => onEdit(entry)}>
                    <Pencil className="size-4" />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
