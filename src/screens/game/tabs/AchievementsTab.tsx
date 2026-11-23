import { Award, Check, History, Lock, Medal, Star } from 'lucide-react';
import { Badge, Meter, Panel, PanelHeader } from '../../../components/ui/Panel';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../../../game/achievements';
import { LEVELS } from '../../../game/data';
import { moneyShort, num } from '../../../game/format';
import { computeScore } from '../../../game/scoring';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';

export function AchievementsTab() {
  const { game } = useActiveGame();
  const score = computeScore(game);
  const unlocked = Object.keys(game.achievements).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Evolução</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Níveis, conquistas e pontuação</h1>
      </div>

      <Panel>
        <PanelHeader icon={Star} title="Níveis" subtitle="Cada nível desbloqueia novas possibilidades." />
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {LEVELS.map((l) => {
            const reached = game.level >= l.level;
            const current = game.level === l.level;
            const r = l.requirements;
            return (
              <li key={l.level} className={cn('rounded-2xl border p-4', current ? 'border-violet-400/60 bg-violet-500/10' : reached ? 'border-emerald-400/20 bg-emerald-500/[0.05]' : 'border-white/[0.07] bg-white/[0.02]')}>
                <div className="flex items-center gap-3">
                  <span className={cn('flex size-9 items-center justify-center rounded-xl font-display font-bold', reached ? 'bg-emerald-500 text-ink-950' : 'bg-white/[0.07] text-slate-500')}>
                    {reached ? <Check className="size-4" strokeWidth={3} aria-hidden /> : l.level}
                  </span>
                  <p className="font-display font-bold text-white">{l.title}</p>
                  {current && <Badge tone="violet">Atual</Badge>}
                </div>
                {l.level > 1 && (
                  <p className="mt-2 text-xs text-slate-400">
                    Requisitos: {moneyShort(r.revenue)} de receita · {num(r.customers)} clientes
                    {r.reputation !== undefined && ` · reputação ${r.reputation}`}
                    {r.satisfaction !== undefined && ` · satisfação ${r.satisfaction}%`}
                    {r.employees !== undefined && ` · ${r.employees} funcionários`}
                    {r.cities !== undefined && ` · ${r.cities} cidades`}
                    {r.states !== undefined && ` · ${r.states} estados`}
                  </p>
                )}
                <ul className="mt-2 space-y-0.5 text-xs text-slate-300">
                  {l.unlocks.map((u) => (
                    <li key={u}>• {u}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel>
        <PanelHeader icon={Award} title={`Conquistas (${unlocked}/${ACHIEVEMENTS.length})`} accent="amber" />
        <div className="space-y-5">
          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const list = ACHIEVEMENTS.filter((a) => a.category === cat.id);
            const got = list.filter((a) => a.id in game.achievements).length;
            return (
              <section key={cat.id} aria-label={cat.label}>
                <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {cat.label}
                  <span className="tabular-nums text-slate-500">
                    {got}/{list.length}
                  </span>
                </h3>
                <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                  {list.map((a) => {
                    const month = game.achievements[a.id];
                    const done = month !== undefined;
                    const Icon = done ? a.icon : Lock;
                    return (
                      <li key={a.id} className={cn('flex items-center gap-3 rounded-2xl border p-3', done ? 'border-amber-300/30 bg-amber-500/[0.07]' : 'border-white/[0.06] bg-white/[0.02]')}>
                        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', done ? 'bg-amber-400/20 text-amber-300' : 'bg-white/[0.05] text-slate-600')}>
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className={cn('text-sm font-semibold', done ? 'text-white' : 'text-slate-400')}>{a.title}</p>
                          <p className="text-xs text-slate-500">{done ? `Mês ${month}` : a.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={Medal} title={`Pontuação atual: ${score.total} / 1000`} subtitle={`Classificação: ${score.rank.title}`} accent="emerald" />
          <ul className="space-y-3">
            {score.pillars.map((p) => (
              <li key={p.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{p.label}</span>
                  <span className="tabular-nums text-slate-400">
                    {p.value}/{p.max}
                  </span>
                </div>
                <Meter value={(p.value / p.max) * 100} size="sm" className="mt-1" label={p.label} />
                <p className="mt-0.5 text-xs text-slate-500">{p.comment}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader icon={History} title="Principais decisões" subtitle="Seu histórico de escolhas aparece no relatório final." accent="blue" />
          <ol className="max-h-80 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {[...game.decisions].reverse().slice(0, 30).map((d, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-14 shrink-0 text-xs font-semibold text-slate-500">Mês {d.month}</span>
                <span className="text-slate-300">{d.text}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
