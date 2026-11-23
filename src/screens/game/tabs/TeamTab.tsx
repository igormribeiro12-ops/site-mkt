import { MapPinned, Minus, Plus, Users, Warehouse } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, LockedNote, Panel, PanelHeader, TipCard } from '../../../components/ui/Panel';
import { INFRA, ROLES, SCOPES, getSegment } from '../../../game/data';
import { fire, hire, severanceCost, upgradeInfra } from '../../../game/engine';
import { homeCity, presentCities, presentStates, unitCount } from '../../../game/expansion';
import { STATES } from '../../../game/geo';
import { money, num } from '../../../game/format';
import { capacity, capacityFactor, monthlySalaries } from '../../../game/simulation';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';
import type { TabProps } from '../apps';

export function TeamTab({ goTo }: TabProps) {
  const { game, act } = useActiveGame();
  const home = homeCity(game);
  const seg = getSegment(game.company.segment);
  const infra = INFRA[game.infraLevel];
  const nextInfra = INFRA[game.infraLevel + 1];
  const cap = capacity(game);
  const factor = capacityFactor(seg.refPrice);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Equipe e estrutura</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Cresça com estrutura</h1>
        <p className="text-sm text-slate-400">Folha de pagamento: {money(monthlySalaries(game))}/mês · Capacidade: {num(cap)} vendas/mês</p>
      </div>

      <Panel>
        <PanelHeader icon={Users} title="Funcionários" subtitle="Cada contratação tem custo mensal e um benefício para a empresa. Desligar custa meio salário de rescisão." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const locked = game.level < r.unlockLevel;
            const count = game.employees[r.id];
            return (
              <div key={r.id} className={cn('flex flex-col rounded-2xl border p-4', locked ? 'border-white/[0.05] bg-white/[0.02] opacity-60' : 'border-white/10 bg-white/[0.03]')}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-white">{r.label}</p>
                    <p className="text-xs text-slate-400">{money(r.salary)}/mês</p>
                  </div>
                  {locked ? <LockedNote level={r.unlockLevel} /> : <Badge tone={count > 0 ? 'violet' : 'default'}>{count} de {r.max}</Badge>}
                </div>
                <p className="mt-3 text-sm text-emerald-300">{r.benefit}</p>
                <p className="mt-1 flex-1 text-xs text-slate-500">{r.impact}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" disabled={locked || count >= r.max} onClick={() => act((s) => hire(s, r.id))} icon={<Plus className="size-4" aria-hidden />}>
                    Contratar
                  </Button>
                  <Button size="sm" variant="secondary" disabled={count === 0} onClick={() => act((s) => fire(s, r.id))} icon={<Minus className="size-4" aria-hidden />} title={`Rescisão: ${money(severanceCost(r.id))}`}>
                    Desligar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <PanelHeader icon={Warehouse} title="Infraestrutura" subtitle={`Atual: ${infra.label}`} accent="blue" />
          <p className="text-sm text-slate-300">{infra.description}</p>
          <p className="mt-2 text-sm text-slate-400">
            Capacidade: <b className="text-white">{num(infra.capacity * factor)}</b> vendas/mês por unidade · Aluguel: {money(infra.rent)}/mês
          </p>
          {nextInfra ? (
            <div className="mt-4 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              <p className="text-sm font-semibold text-white">Próximo: {nextInfra.label}</p>
              <p className="text-xs text-slate-400">
                {num(nextInfra.capacity * factor)} vendas/mês · aluguel {money(nextInfra.rent)}/mês
              </p>
              <Button size="sm" className="mt-3 w-full" onClick={() => act(upgradeInfra)}>
                Melhorar por {money(nextInfra.upgradeCost)}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-300">Infraestrutura no nível máximo.</p>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader icon={MapPinned} title="Expansão pelo Brasil" subtitle={`Sede em ${home.name} (${home.uf}) · atuação: ${SCOPES[game.scopeLevel].label.toLowerCase()}`} accent="emerald" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              <p className="text-xs text-slate-400">Cidades</p>
              <p className="font-display text-xl font-bold text-white">{presentCities(game).size}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              <p className="text-xs text-slate-400">Estados</p>
              <p className="font-display text-xl font-bold text-white">
                {presentStates(game).size} <span className="text-sm font-semibold text-slate-500">de {STATES.length}</span>
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              <p className="text-xs text-slate-400">Unidades no total</p>
              <p className="font-display text-xl font-bold text-white">{unitCount(game)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Cada unidade aumenta a capacidade em 60%. Filiais em outras cidades também trazem o mercado daquela cidade, mas cobram aluguel e equipe local.
          </p>
          <Button size="sm" className="mt-4" onClick={() => goTo('expansao')} icon={<MapPinned className="size-4" aria-hidden />}>
            Abrir o mapa do Brasil
          </Button>
        </Panel>
      </div>

      <TipCard title="Crescer com equilíbrio">
        Contratar e expandir aumenta os custos fixos antes de aumentar as vendas. Cresça quando a demanda pedir (pedidos não atendidos,
        atendimento sobrecarregado) e quando o caixa aguentar alguns meses do novo custo.
      </TipCard>
    </div>
  );
}
