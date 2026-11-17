import {
  BadgeDollarSign,
  Building,
  CircleAlert,
  Flag,
  Landmark,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { FinanceChart, MarketingChart } from '../../../components/charts/Charts';
import { Button } from '../../../components/ui/Button';
import { Badge, Meter, Panel, PanelHeader, Stat } from '../../../components/ui/Panel';
import { LEVELS, MONTH_LIMIT, getDifficulty } from '../../../game/data';
import { victoryProgress } from '../../../game/engine';
import { money, moneyShort, num, numShort } from '../../../game/format';
import { capacity, totalDebt, valuation } from '../../../game/simulation';
import type { ModifierKind } from '../../../game/types';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';
import type { TabProps } from '../apps';
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

export function DashboardTab({ goTo }: TabProps) {
  const { game } = useActiveGame();
  const last = game.history[game.history.length - 1];
  const victory = victoryProgress(game);
  const reqs = nextLevelRequirements(game);
  const diff = getDifficulty(game.player.difficulty);
  const debt = totalDebt(game);
  const cap = capacity(game);

  const alerts: { text: string; action?: () => void; actionLabel?: string; tone: 'bad' | 'warn' | 'info' }[] = [];
  if (game.campaigns.filter((c) => c.active).length === 0)
    alerts.push({ text: 'Nenhuma campanha ativa: sem divulgação, poucas pessoas conhecem a empresa.', action: () => goTo('marketing'), actionLabel: 'Criar campanha', tone: 'warn' });
  if (last && last.unmetOrders >= 5)
    alerts.push({ text: `Faltou capacidade: ${num(last.unmetOrders)} pedidos não atendidos no último mês.`, action: () => goTo('equipe'), actionLabel: 'Aumentar capacidade', tone: 'bad' });
  if (game.cash < 0) alerts.push({ text: `Caixa negativo: você está pagando juros do cheque especial (limite ${money(-diff.overdraftLimit)}).`, action: () => goTo('financas'), actionLabel: 'Ver finanças', tone: 'bad' });
  if (last && last.satisfaction < 55) alerts.push({ text: 'Clientes insatisfeitos: melhore qualidade, preço ou atendimento.', action: () => goTo('produto'), actionLabel: 'Ver produto', tone: 'warn' });
  if (last && last.serviceRatio < 0.75) alerts.push({ text: 'O atendimento está sobrecarregado.', action: () => goTo('equipe'), actionLabel: 'Contratar', tone: 'warn' });

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

      <Panel data-tour="mission" className="bg-gradient-to-br from-violet-600/15 via-ink-850/80 to-emerald-600/10">
        <PanelHeader
          icon={Flag}
          title="Missão: construir seu império"
          subtitle={`Mês ${game.month} de ${MONTH_LIMIT}. Cumpra as três metas ao mesmo tempo para vencer.`}
          accent="emerald"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Receita acumulada', done: victory.revenue.done, value: `${moneyShort(victory.revenue.value)} de ${moneyShort(victory.revenue.target)}`, p: victory.revenue.value / victory.revenue.target },
            { label: `Fase ${LEVELS[victory.level.target - 1]?.title ?? ''}`, done: victory.level.done, value: `Nível ${Math.min(victory.level.value, victory.level.target)} de ${victory.level.target}`, p: victory.level.value / victory.level.target },
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

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.text}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm ring-1',
                a.tone === 'bad' ? 'bg-rose-500/10 text-rose-100 ring-rose-400/25' : a.tone === 'warn' ? 'bg-amber-500/10 text-amber-100 ring-amber-400/25' : 'bg-sky-500/10 text-sky-100 ring-sky-400/25',
              )}
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{a.text}</span>
              {a.action && (
                <Button size="sm" variant="secondary" onClick={a.action}>
                  {a.actionLabel}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

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
              Equipe: {Object.values(game.employees).reduce((a, b) => a + b, 0)} funcionário(s) · Linhas de produto: {game.productLines} · Unidades: {game.units}
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
