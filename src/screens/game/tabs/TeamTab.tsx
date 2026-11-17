import { Building2, Globe2, Lock, Minus, Plus, Store, Users, Warehouse } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, LockedNote, Panel, PanelHeader, TipCard } from '../../../components/ui/Panel';
import { INFRA, NEW_UNIT_UNLOCK, ROLES, SCOPES, getSegment } from '../../../game/data';
import { expandScope, fire, hire, newUnitCost, openUnit, severanceCost, upgradeInfra } from '../../../game/engine';
import { money, num } from '../../../game/format';
import { capacity, capacityFactor, monthlySalaries } from '../../../game/simulation';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';

export function TeamTab() {
  const { game, act } = useActiveGame();
  const seg = getSegment(game.company.segment);
  const infra = INFRA[game.infraLevel];
  const nextInfra = INFRA[game.infraLevel + 1];
  const nextScope = SCOPES[game.scopeLevel + 1];
  const cap = capacity(game);
  const factor = capacityFactor(seg.refPrice);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Equipe e expansão</p>
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

        <Panel>
          <PanelHeader icon={Store} title="Novas unidades" subtitle={`Você tem ${game.units} unidade(s)`} accent="emerald" />
          <p className="text-sm text-slate-300">Cada nova unidade aumenta a capacidade em 60% e a demanda local em 25%, com aluguel extra de R$ 1.500/mês.</p>
          {game.level < NEW_UNIT_UNLOCK ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Lock className="size-4" aria-hidden /> Libera no nível {NEW_UNIT_UNLOCK}.
            </p>
          ) : (
            <Button size="sm" className="mt-4 w-full" onClick={() => act(openUnit)} icon={<Building2 className="size-4" aria-hidden />}>
              Abrir unidade por {money(newUnitCost(game))}
            </Button>
          )}
        </Panel>

        <Panel>
          <PanelHeader icon={Globe2} title="Outros mercados" subtitle={`Atuação: ${SCOPES[game.scopeLevel].label}`} accent="violet" />
          <p className="text-sm text-slate-300">Expandir multiplica o número de clientes potenciais, mas aumenta a concorrência.</p>
          {nextScope ? (
            game.level < nextScope.unlockLevel ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                <Lock className="size-4" aria-hidden /> {nextScope.label}: libera no nível {nextScope.unlockLevel}.
              </p>
            ) : (
              <Button size="sm" className="mt-4 w-full" onClick={() => act(expandScope)} icon={<Globe2 className="size-4" aria-hidden />}>
                Expandir para {nextScope.label.toLowerCase()} ({money(nextScope.cost)})
              </Button>
            )
          ) : (
            <p className="mt-4 text-sm text-emerald-300">Você já atua no Brasil todo!</p>
          )}
        </Panel>
      </div>

      <TipCard title="Crescer com equilíbrio">
        Contratar e expandir aumenta os custos fixos antes de aumentar as vendas. Cresça quando a demanda pedir (pedidos não atendidos,
        atendimento sobrecarregado) e quando o caixa aguentar alguns meses do novo custo.
      </TipCard>
    </div>
  );
}
