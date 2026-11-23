import {
  BadgeDollarSign,
  Building,
  Flag,
  Landmark,
  Receipt,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { FinanceChart, MarketingChart } from '../../../components/charts/Charts';
import { Badge, Meter, Panel, PanelHeader, Stat } from '../../../components/ui/Panel';
import { LEVELS, MONTH_LIMIT } from '../../../game/data';
import { victoryProgress } from '../../../game/engine';
import { presentCities, presentStates, unitCount } from '../../../game/expansion';
import { GOAL_INFO, describeGoal, goalValue } from '../../../game/goals';
import { money, moneyShort, num, numShort } from '../../../game/format';
import { capacity, totalDebt, valuation } from '../../../game/simulation';
import type { ModifierKind } from '../../../game/types';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';
import type { TabProps } from '../apps';
import { AdvisorSummary } from './AdvisorTab';
import { nextLevelRequirements } from '../levelProgress';

const MOD_LABEL: Record<ModifierKind, string> = {
  demand: 'Demanda',
  unitCost: 'Custo de produção',
  fixedCost: 'Custos fixos',
  capacity: 'Capacidade',
  socialReach: 'Alcance nas redes',
  conversion: 'Conversão',
  competition: 'Concorrência',
  price: 'Preço',
};

/** Desafio do mês: meta com prêmio, conferida no fechamento do mês. */
export function GoalCard() {
  const { game } = useActiveGame();
  const g = game.goal;
  const last = game.history[game.history.length - 1]?.goal;
  if (!g) {
    return (
      <Panel className="flex items-center gap-3 py-3">
        <Target className="size-5 shrink-0 text-amber-300" aria-hidden />
        <p className="text-sm text-slate-400">
          {game.month === 1 ? 'O primeiro desafio do mês chega no fim deste mês.' : 'Sem desafio no momento.'} Cumpra desafios para ganhar dinheiro e reputação.
        </p>
      </Panel>
    );
  }
  const info = GOAL_INFO[g.kind];
  const value = goalValue(game, g);
  const fmt = (v: number) => (info.format === 'money' ? money(v) : info.format === 'percent' ? `${num(v)}%` : num(v));
  const done = value >= g.target;
  return (
    <Panel className={cn('bg-gradient-to-r', done ? 'from-emerald-600/15 to-transparent' : 'from-amber-500/10 to-transparent')} data-testid="goal-card">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-400/15 text-amber-300')}>
          <Target className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
            Desafio do mês {g.month} · prêmio {money(g.reward)} e +2 de reputação
          </p>
          <p className="font-display text-base font-bold text-white">
            {info.title}: {describeGoal(g).charAt(0).toLowerCase() + describeGoal(g).slice(1)}
          </p>
        </div>
        <p className="text-right text-sm tabular-nums text-slate-300">
          <span className={cn('font-display text-lg font-bold', done ? 'text-emerald-300' : 'text-white')}>{fmt(value)}</span> / {fmt(g.target)}
        </p>
      </div>
      <Meter value={Math.min(1, g.target > 0 ? value / g.target : 0) * 100} size="sm" className="mt-3" label="Progresso do desafio do mês" color={done ? '#34d399' : '#fbbf24'} />
      {last && last.month === g.month - 1 && (
        <p className="mt-2 text-xs text-slate-500">
          Desafio do mês passado: {last.achieved ? `cumprido (+${money(last.reward)})` : 'não cumprido'}.
        </p>
      )}
    </Panel>
  );
}

export function DashboardTab({ goTo }: TabProps) {
  const { game } = useActiveGame();
  const last = game.history[game.history.length - 1];
  const victory = victoryProgress(game);
  const reqs = nextLevelRequirements(game);
  const debt = totalDebt(game);
  const cap = capacity(game);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Painel da empresa</p>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{game.company.name}</h1>
          <p className="text-sm text-slate-400">“{game.company.slogan}”</p>
        </div>
        {game.freePlay && <Badge tone="good">Modo livre: você já venceu!</Badge>}
      </div>

      <AdvisorSummary goTo={goTo} />

      <Panel data-tour="mission" className="bg-gradient-to-br from-violet-600/15 via-ink-850/80 to-emerald-600/10">
        <PanelHeader
          icon={Flag}
          title="Missão: construir seu império"
          subtitle={`Mês ${game.month} de ${MONTH_LIMIT}. Cumpra as quatro metas ao mesmo tempo para vencer.`}
          accent="emerald"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Receita acumulada', done: victory.revenue.done, value: `${moneyShort(victory.revenue.value)} de ${moneyShort(victory.revenue.target)}`, p: victory.revenue.value / victory.revenue.target },
            { label: `Fase ${LEVELS[victory.level.target - 1]?.title ?? ''}`, done: victory.level.done, value: `Nível ${Math.min(victory.level.value, victory.level.target)} de ${victory.level.target}`, p: victory.level.value / victory.level.target },
            { label: 'Estados com a sua marca', done: victory.states.done, value: `${Math.min(victory.states.value, victory.states.target)} de ${victory.states.target}`, p: victory.states.value / victory.states.target },
            { label: 'Meses seguidos com lucro', done: victory.streak.done, value: `${Math.min(victory.streak.value, victory.streak.target)} de ${victory.streak.target}`, p: victory.streak.value / victory.streak.target },
          ].map((g) => (
            <div key={g.label} className={cn('rounded-xl p-3 ring-1', g.done ? 'bg-emerald-500/10 ring-emerald-400/30' : 'bg-white/[0.03] ring-white/10')}>
              <p className="flex items-center justify-between text-xs font-semibold text-slate-300">
                {g.label}
                {g.done && <Badge tone="good">Concluída</Badge>}
              </p>
              <p className="mt-1 font-display text-base font-bold text-white">{g.value}</p>
              <Meter value={Math.min(1, g.p) * 100} size="sm" className="mt-2" label={g.label} color={g.done ? '#34d399' : undefined} />
            </div>
          ))}
        </div>
      </Panel>

      <GoalCard />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Wallet} label="Saldo disponível" value={money(game.cash)} tone={game.cash < 0 ? 'bad' : 'good'} hint={debt > 0 ? `Dívidas: ${money(debt)}` : 'Sem dívidas'} />
        <Stat icon={BadgeDollarSign} label="Receita acumulada" value={moneyShort(game.totalRevenue)} hint={last ? `Último mês: ${money(last.revenue)}` : 'Ainda sem vendas'} />
        <Stat icon={Receipt} label="Despesas do mês" value={last ? money(last.totalCosts) : '—'} hint={`Acumulado: ${moneyShort(game.totalExpenses)}`} />
        <Stat
          icon={last && last.profit < 0 ? TrendingDown : TrendingUp}
          label={last && last.profit < 0 ? 'Prejuízo do mês' : 'Lucro do mês'}
          value={last ? money(last.profit) : '—'}
          tone={!last ? 'default' : last.profit >= 0 ? 'good' : 'bad'}
          hint={`${game.profitStreak} ${game.profitStreak === 1 ? 'mês seguido' : 'meses seguidos'} com lucro`}
        />
        <Stat icon={Users} label="Clientes" value={numShort(game.customersTotal)} hint={`${num(game.activeCustomers)} ativos · ${num(game.leads)} leads`} />
        <Stat icon={Sparkles} label="Seguidores" value={numShort(game.followers)} hint={`Reconhecimento da marca: ${num(game.awareness)}%`} />
        <Stat icon={Zap} label="Nível da empresa" value={`${game.level}`} hint={LEVELS[game.level - 1].title} />
        <Stat icon={Landmark} label="Valor da empresa" value={moneyShort(valuation(game))} hint={game.investorShare > 0 ? `Investidor tem ${Math.round(game.investorShare * 100)}%` : '2× lucro anual + ½ receita anual + caixa − dívidas'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <FinanceChart history={game.history} />
        </Panel>
        <Panel>
          <MarketingChart history={game.history} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={Zap} title={reqs ? `Próximo nível: ${LEVELS[game.level].title}` : 'Nível máximo alcançado!'} subtitle={reqs ? `Libera: ${LEVELS[game.level].unlocks.join(' · ')}` : 'Você é um magnata dos negócios.'} />
          {reqs && (
            <ul className="space-y-2.5">
              {reqs.map((r) => (
                <li key={r.label}>
                  <div className="flex justify-between text-sm">
                    <span className={r.done ? 'text-emerald-300' : 'text-slate-300'}>{r.label}</span>
                    <span className="tabular-nums text-slate-400">
                      {r.format === 'money' ? moneyShort(r.current) : num(r.current)} / {r.format === 'money' ? moneyShort(r.target) : num(r.target)}
                    </span>
                  </div>
                  <Meter value={Math.min(1, r.current / r.target) * 100} size="xs" className="mt-1" color={r.done ? '#34d399' : undefined} label={r.label} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <PanelHeader icon={Building} title="Operação" subtitle="Capacidade, equipe e efeitos ativos" accent="blue" />
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex justify-between text-slate-300">
                <span>Uso da capacidade</span>
                <span className="tabular-nums">{last ? `${num(last.unitsSold)} de ${num(cap)} vendas` : `${num(cap)} vendas/mês`}</span>
              </div>
              <Meter value={last ? (last.orders / cap) * 100 : 0} size="sm" className="mt-1" color={last && last.orders > cap ? '#f87171' : undefined} label="Uso da capacidade" />
            </div>
            <p className="text-slate-400">
              Equipe: {Object.values(game.employees).reduce((a, b) => a + b, 0)} funcionário(s) · Linhas de produto: {game.productLines} · Unidades: {unitCount(game)} em{' '}
              {presentCities(game).size} {presentCities(game).size === 1 ? 'cidade' : 'cidades'} e {presentStates(game).size} {presentStates(game).size === 1 ? 'estado' : 'estados'}
            </p>
            {game.modifiers.length > 0 ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Efeitos de eventos ativos</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.modifiers.map((m) => (
                    <Badge key={m.id} tone={(m.value > 0) === ['demand', 'capacity', 'socialReach', 'conversion'].includes(m.kind) ? 'good' : 'bad'}>
                      {MOD_LABEL[m.kind]} {m.value > 0 ? '+' : ''}
                      {Math.round(m.value * 100)}% · {m.monthsLeft} {m.monthsLeft === 1 ? 'mês' : 'meses'}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhum efeito de evento ativo.</p>
            )}
            {game.lastEventOutcome && (
              <p className="rounded-xl bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-400 ring-1 ring-white/10">
                <strong className="text-slate-200">Último evento: {game.lastEventOutcome.title}.</strong> {game.lastEventOutcome.text}
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
