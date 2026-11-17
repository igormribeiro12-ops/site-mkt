import { Check, Lock, Target } from 'lucide-react';
import { LEVELS } from '../../../game/data';
import { money } from '../../../game/format';
import { MISSIONS, currentMission } from '../../../game/missions';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { nextLevelRequirements } from '../../game/levelProgress';
import { SidePanel } from '../SidePanel';

export function MissionsPanel() {
  const { game } = useActiveGame();
  const current = currentMission(game);
  const reqs = nextLevelRequirements(game);
  const nextLevel = LEVELS[game.level];
  const close = () => patchUi({ panel: null });

  return (
    <SidePanel title="Missões" subtitle={`${game.world.missionsDone.length}/${MISSIONS.length} concluídas`} icon={Target} accent="from-yellow-300 to-amber-500" onClose={close}>
      <ol className="space-y-2">
        {MISSIONS.map((m) => {
          const done = game.world.missionsDone.includes(m.id);
          const active = current?.id === m.id;
          const Icon = m.icon;
          return (
            <li
              key={m.id}
              className={cn(
                'rounded-2xl border p-3 transition',
                done ? 'border-emerald-400/20 bg-emerald-500/[0.06]' : active ? 'border-amber-300/50 bg-amber-400/[0.08] shadow-lg shadow-amber-500/10' : 'border-white/5 bg-white/[0.02] opacity-60',
              )}
              data-testid={`mission-${m.id}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl',
                    done ? 'bg-emerald-500/20 text-emerald-300' : active ? 'bg-amber-400/20 text-amber-300' : 'bg-white/[0.05] text-slate-500',
                  )}
                >
                  {done ? <Check className="size-5" aria-hidden /> : active ? <Icon className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between gap-2">
                    <span className={cn('text-sm font-bold', done ? 'text-emerald-100' : 'text-white')}>{m.title}</span>
                    <span className="shrink-0 text-xs font-bold text-amber-300">+{money(m.reward)}</span>
                  </p>
                  <p className="text-xs text-slate-400">{m.description}</p>
                  {active && <p className="mt-1.5 rounded-lg bg-ink-950/50 px-2 py-1 text-xs text-amber-100">Dica: {m.hint}</p>}
                  {m.unlockText && !done && <p className="mt-1 text-[11px] font-semibold text-violet-300">{m.unlockText}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {reqs && nextLevel && (
        <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Próxima fase</p>
          <p className="font-display text-lg font-bold text-white">{nextLevel.title}</p>
          <ul className="mt-2 space-y-1.5">
            {reqs.map((r) => (
              <li key={r.label} className="flex items-center justify-between text-xs">
                <span className={r.done ? 'text-emerald-300' : 'text-slate-300'}>
                  {r.done ? '✓ ' : ''}
                  {r.label}
                </span>
                <span className="tabular-nums text-slate-400">
                  {r.format === 'money' ? money(r.current) : Math.floor(r.current)} / {r.format === 'money' ? money(r.target) : r.target}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">Libera: {nextLevel.unlocks.join(' · ')}</p>
        </div>
      )}
    </SidePanel>
  );
}
