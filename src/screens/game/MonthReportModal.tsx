import { ArrowRight, BookOpenText, Flag, GraduationCap, Lightbulb, PartyPopper, Skull, Target, ThumbsDown, ThumbsUp, Trophy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Panel';
import { getAchievement } from '../../game/achievements';
import { CONCEPTS, LEVELS, getChannel, getObjective } from '../../game/data';
import { money, num, pct } from '../../game/format';
import { GOAL_INFO } from '../../game/goals';
import type { GoalKind, MonthReport } from '../../game/types';
import { cn } from '../../lib/cn';
import { useActiveGame } from '../../state/GameContext';

function goalFmt(kind: GoalKind, v: number): string {
  const f = GOAL_INFO[kind].format;
  return f === 'money' ? money(v) : f === 'percent' ? `${num(v)}%` : num(v);
}

function Kpi({ label, value, tone = 'default', sub }: { label: string; value: string; tone?: 'default' | 'good' | 'bad'; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('mt-0.5 font-display text-lg font-bold tabular-nums', tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-rose-300' : 'text-white')}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function MonthReportModal({ report: r, onClose }: { report: MonthReport; onClose: () => void }) {
  const { game } = useActiveGame();
  const ended = game.phase !== 'playing';
  const concept = CONCEPTS[r.concept];
  const costRows = [
    ['Produção (custo variável)', r.costs.variable],
    ['Marketing', r.costs.marketing],
    ['Salários', r.costs.salaries],
    ['Aluguel e estrutura', r.costs.rent + r.costs.tools],
    ['Fidelidade e seguro', r.costs.services ?? 0],
    ['Impostos', r.costs.taxes],
    ['Juros', r.costs.interest],
  ].filter(([, v]) => (v as number) > 0.5) as [string, number][];

  return (
    <Modal
      open
      locked
      size="xl"
      labelledBy="report-title"
      footer={
        <Button size="lg" onClick={onClose} data-autofocus iconRight={<ArrowRight className="size-5" aria-hidden />} variant={ended ? (game.phase === 'won' ? 'success' : 'primary') : 'primary'}>
          {ended ? 'Ver relatório final' : game.pendingEvent ? 'Continuar (há um evento!)' : `Planejar o mês ${game.month}`}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Relatório mensal</p>
            <h2 id="report-title" className="font-display text-3xl font-bold text-white">
              Mês {r.month}
            </h2>
          </div>
          <div className={cn('rounded-2xl px-4 py-2 text-right ring-1', r.profit >= 0 ? 'bg-emerald-500/10 ring-emerald-400/30' : 'bg-rose-500/10 ring-rose-400/30')}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{r.profit >= 0 ? 'Lucro do mês' : 'Prejuízo do mês'}</p>
            <p className={cn('font-display text-2xl font-bold tabular-nums', r.profit >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{money(r.profit)}</p>
          </div>
        </div>

        {game.phase === 'won' && (
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-violet-500/20 p-4 ring-1 ring-emerald-400/30">
            <Trophy className="size-8 shrink-0 text-amber-300" aria-hidden />
            <p className="font-semibold text-white">{game.endReason}</p>
          </div>
        )}
        {game.phase === 'lost' && (
          <div className="flex items-center gap-3 rounded-2xl bg-rose-500/15 p-4 ring-1 ring-rose-400/30">
            <Skull className="size-8 shrink-0 text-rose-300" aria-hidden />
            <p className="font-semibold text-rose-100">{game.endReason}</p>
          </div>
        )}
        {game.phase === 'ended' && (
          <div className="flex items-center gap-3 rounded-2xl bg-sky-500/10 p-4 ring-1 ring-sky-400/30">
            <Flag className="size-8 shrink-0 text-sky-300" aria-hidden />
            <p className="font-semibold text-white">{game.endReason}</p>
          </div>
        )}
        {r.levelUp && (
          <div className="flex animate-pop items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-600/30 to-blue-600/20 p-4 ring-1 ring-violet-400/40">
            <PartyPopper className="size-9 shrink-0 text-amber-300" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Subiu de nível!</p>
              <p className="font-display text-xl font-bold text-white">
                Nível {r.levelUp}: {LEVELS[r.levelUp - 1].title}
              </p>
              <p className="text-sm text-slate-300">Desbloqueado: {LEVELS[r.levelUp - 1].unlocks.join(' · ')}</p>
            </div>
          </div>
        )}

        {r.goal && (
          <div
            className={cn('flex items-center gap-3 rounded-2xl p-4 ring-1', r.goal.achieved ? 'bg-emerald-500/10 ring-emerald-400/30' : 'bg-white/[0.03] ring-white/10')}
            data-testid="report-goal"
          >
            <Target className={cn('size-7 shrink-0', r.goal.achieved ? 'text-emerald-300' : 'text-slate-500')} aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Desafio do mês: {GOAL_INFO[r.goal.kind].title}</p>
              <p className={cn('font-semibold', r.goal.achieved ? 'text-emerald-200' : 'text-slate-300')}>
                {r.goal.achieved
                  ? `Cumprido! Você ganhou ${money(r.goal.reward)} e +2 de reputação.`
                  : `Não deu desta vez: a meta era ${goalFmt(r.goal.kind, r.goal.target)} e você fez ${goalFmt(r.goal.kind, r.goal.value)}.`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Kpi label="Receita" value={money(r.revenue)} />
          <Kpi label="Despesas" value={money(r.totalCosts)} />
          <Kpi label="Caixa no fim do mês" value={money(r.cashEnd)} tone={r.cashEnd >= 0 ? 'default' : 'bad'} sub={`Começou com ${money(r.cashStart)}`} />
          <Kpi label="Satisfação" value={`${num(r.satisfaction)}%`} tone={r.satisfaction >= 65 ? 'good' : r.satisfaction < 50 ? 'bad' : 'default'} />
          <Kpi label="Clientes novos" value={num(r.newCustomers)} sub={`${num(r.activeCustomers)} clientes ativos`} />
          <Kpi label="Vendas" value={num(r.unitsSold)} sub={r.unmetOrders >= 1 ? `${num(r.unmetOrders)} pedidos não atendidos` : `Capacidade: ${num(r.capacity)}`} tone={r.unmetOrders >= 5 ? 'bad' : 'default'} />
          <Kpi label="Ticket médio" value={money(r.ticket, true)} />
          <Kpi label="Taxa de conversão" value={pct(r.conversionRate, 2)} sub={`${num(r.reach)} pessoas alcançadas`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-white">
              <GraduationCap className="size-5 text-sky-300" aria-hidden /> O que você aprendeu este mês
            </h3>
            <ul className="space-y-2">
              {r.insights.map((ins, i) => {
                const Icon = ins.tone === 'good' ? ThumbsUp : ins.tone === 'bad' ? ThumbsDown : Lightbulb;
                return (
                  <li
                    key={i}
                    className={cn(
                      'flex gap-3 rounded-xl p-3 text-sm leading-relaxed ring-1',
                      ins.tone === 'good' ? 'bg-emerald-500/[0.07] text-slate-200 ring-emerald-400/20' : ins.tone === 'bad' ? 'bg-rose-500/[0.07] text-slate-200 ring-rose-400/20' : 'bg-white/[0.03] text-slate-300 ring-white/10',
                    )}
                  >
                    <Icon className={cn('mt-0.5 size-4 shrink-0', ins.tone === 'good' ? 'text-emerald-300' : ins.tone === 'bad' ? 'text-rose-300' : 'text-amber-300')} aria-hidden />
                    <span>{ins.text}</span>
                  </li>
                );
              })}
            </ul>
          </section>
          <aside className="rounded-2xl bg-gradient-to-br from-sky-500/15 to-violet-500/10 p-4 ring-1 ring-sky-400/20">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-200">
              <BookOpenText className="size-4" aria-hidden /> Conceito do mês
            </p>
            <p className="mt-2 font-display text-lg font-bold text-white">{concept.term}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{concept.definition}</p>
          </aside>
        </div>

        {r.campaigns.length > 0 && (
          <section>
            <h3 className="mb-2 font-display text-base font-bold text-white">Resultado das campanhas</h3>
            <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Canal</th>
                    <th className="px-3 py-2 text-right font-semibold">Investimento</th>
                    <th className="px-3 py-2 text-right font-semibold">Alcance</th>
                    <th className="px-3 py-2 text-right font-semibold">Seguidores</th>
                    <th className="px-3 py-2 text-right font-semibold">Leads</th>
                    <th className="px-3 py-2 text-right font-semibold">Clientes</th>
                    <th className="px-3 py-2 text-right font-semibold">CAC</th>
                    <th className="px-3 py-2 text-right font-semibold">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {r.campaigns.map((c) => (
                    <tr key={c.campaignId} className="border-t border-white/[0.05]">
                      <td className="px-3 py-2">
                        <span className="font-semibold text-white">{getChannel(c.channel).label}</span>
                        <span className="block text-[11px] text-slate-500">{getObjective(c.objective).short}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(c.budget)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(c.reach)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(c.followers)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(c.leads)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(c.customers)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.cac !== null ? money(c.cac, true) : '—'}</td>
                      <td className={cn('px-3 py-2 text-right font-semibold tabular-nums', c.roi >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{pct(c.roi, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-white/[0.07] p-3">
            <h3 className="mb-2 text-sm font-semibold text-white">Para onde foi o dinheiro</h3>
            <ul className="space-y-1 text-sm">
              {costRows.map(([label, value]) => (
                <li key={label} className="flex justify-between text-slate-400">
                  <span>{label}</span>
                  <span className="tabular-nums text-slate-200">{money(value)}</span>
                </li>
              ))}
              {(r.savingsIncome ?? 0) > 0.5 && (
                <li className="flex justify-between text-emerald-300/90">
                  <span>(+) Rendimento da aplicação</span>
                  <span className="tabular-nums">{money(r.savingsIncome)}</span>
                </li>
              )}
              {r.costs.loan > 0.5 && (
                <li className="flex justify-between border-t border-white/[0.06] pt-1 text-slate-500">
                  <span>Amortização de empréstimo (sai do caixa, não é despesa)</span>
                  <span className="tabular-nums">{money(r.costs.loan)}</span>
                </li>
              )}
            </ul>
          </section>
          <section className="rounded-xl border border-white/[0.07] p-3">
            <h3 className="mb-2 text-sm font-semibold text-white">De onde vieram os clientes</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              <li className="flex justify-between"><span>Campanhas pagas</span><span className="tabular-nums text-slate-200">{num(r.newFromCampaigns)}</span></li>
              <li className="flex justify-between"><span>Orgânico (marca, seguidores, SEO)</span><span className="tabular-nums text-slate-200">{num(r.newFromOrganic)}</span></li>
              <li className="flex justify-between"><span>Leads convertidos</span><span className="tabular-nums text-slate-200">{num(r.newFromLeads)}</span></li>
              <li className="flex justify-between"><span>Compras recorrentes</span><span className="tabular-nums text-slate-200">{num(r.returningOrders)}</span></li>
            </ul>
          </section>
        </div>

        {r.achievements.length > 0 && (
          <section>
            <h3 className="mb-2 font-display text-base font-bold text-white">Conquistas desbloqueadas</h3>
            <div className="flex flex-wrap gap-2">
              {r.achievements.map((id) => {
                const a = getAchievement(id);
                if (!a) return null;
                const Icon = a.icon;
                return (
                  <Badge key={id} tone="warn" className="animate-pop px-3 py-1.5 text-xs">
                    <Icon className="size-4" aria-hidden /> {a.title}
                  </Badge>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
