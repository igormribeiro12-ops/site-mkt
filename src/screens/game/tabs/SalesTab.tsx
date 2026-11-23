import { Check, Gauge, Gift, HeartHandshake, Lock, Package, Percent, Receipt, ShoppingBag, Smile, Users } from 'lucide-react';
import { CustomersChart, SatisfactionChart } from '../../../components/charts/Charts';
import { Button } from '../../../components/ui/Button';
import { Badge, Meter, Panel, PanelHeader, Stat, TipCard } from '../../../components/ui/Panel';
import { LOYALTY_PROGRAMS, getSegment } from '../../../game/data';
import { setLoyalty } from '../../../game/engine';
import { cn } from '../../../lib/cn';
import { money, num, pct } from '../../../game/format';
import { capacity, capacityFactor, offer } from '../../../game/simulation';
import { useActiveGame } from '../../../state/GameContext';

export function SalesTab() {
  const { game, act } = useActiveGame();
  const last = game.history[game.history.length - 1];
  const seg = getSegment(game.company.segment);
  const cap = capacity(game);
  const o = offer(game);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Comercial</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Painel de vendas</h1>
        <p className="text-sm text-slate-400">{last ? `Resultados do mês ${last.month}.` : 'Os números aparecem depois do primeiro mês.'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} label="Clientes ativos" value={num(game.activeCustomers)} hint={`${num(game.customersTotal)} conquistados no total`} />
        <Stat icon={ShoppingBag} label="Produtos vendidos" value={last ? num(last.unitsSold) : '—'} hint={last ? `${num(last.newCustomers)} novos · ${num(last.returningOrders)} recorrentes` : undefined} />
        <Stat icon={Receipt} label="Receita" value={last ? money(last.revenue) : '—'} />
        <Stat icon={Package} label="Ticket médio" value={last ? money(last.ticket, true) : money(game.price, true)} hint={game.productLines > 1 ? `${game.productLines} linhas de produto elevam o ticket` : undefined} />
        <Stat icon={Percent} label="Taxa de conversão" value={last ? pct(last.conversionRate, 2) : '—'} hint="Clientes novos ÷ pessoas alcançadas" />
        <Stat icon={Smile} label="Satisfação" value={`${num(game.satisfaction)}%`} tone={game.satisfaction >= 70 ? 'good' : game.satisfaction < 50 ? 'bad' : 'warn'} />
        <Stat icon={HeartHandshake} label="Reputação" value={`${num(game.reputation)}/100`} />
        <Stat icon={Gauge} label="Capacidade" value={`${num(cap)}/mês`} hint={last && last.unmetOrders >= 1 ? `${num(last.unmetOrders)} pedidos perdidos` : 'Sem pedidos perdidos'} tone={last && last.unmetOrders >= 5 ? 'bad' : 'default'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <CustomersChart history={game.history} />
        </Panel>
        <Panel>
          <SatisfactionChart history={game.history} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={Gauge} title="Operação" subtitle="Capacidade de produção e de atendimento" accent="blue" />
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between text-slate-300">
                <span>Pedidos x capacidade</span>
                <span className="tabular-nums">{last ? `${num(last.orders)} / ${num(cap)}` : `0 / ${num(cap)}`}</span>
              </div>
              <Meter value={last ? (last.orders / cap) * 100 : 0} size="md" className="mt-1.5" label="Pedidos em relação à capacidade" color={last && last.orders > cap ? '#f87171' : undefined} />
            </div>
            <div>
              <div className="flex justify-between text-slate-300">
                <span>Qualidade do atendimento</span>
                <span className="tabular-nums">{last ? pct(last.serviceRatio, 0) : '100%'}</span>
              </div>
              <Meter value={(last?.serviceRatio ?? 1) * 100} size="md" className="mt-1.5" label="Qualidade do atendimento" color={last && last.serviceRatio < 0.75 ? '#fbbf24' : '#34d399'} />
              <p className="mt-1 text-xs text-slate-500">Cada atendente dá conta de cerca de {num(180 * capacityFactor(seg.refPrice))} vendas por mês; parte do atendimento é automatizada pela estrutura.</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader icon={ShoppingBag} title="O que faz as vendas acontecerem" subtitle="As vendas dependem de demanda, marketing, preço, qualidade e atendimento." accent="emerald" />
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• <b className="text-white">Demanda:</b> mercado de {seg.label.toLowerCase()} com tendência de {pct(seg.trend, 0)} ao mês.</li>
            <li>• <b className="text-white">Marketing:</b> campanhas, seguidores e reconhecimento trazem clientes novos.</li>
            <li>• <b className="text-white">Oferta:</b> atratividade atual {num(o.score * 100)} (preço, qualidade, reputação e concorrência).</li>
            <li>• <b className="text-white">Recompra:</b> cerca de {pct(seg.repeatRate, 0)} dos clientes ativos compram de novo todo mês, se estiverem satisfeitos.</li>
            <li>• <b className="text-white">Leads:</b> {num(game.leads)} interessados. Vendedores aumentam a conversão de leads.</li>
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          icon={Gift}
          title="Programa de fidelidade"
          subtitle="Recompensar quem volta aumenta a recompra e a satisfação, em troca de um desconto e de uma mensalidade."
          accent="rose"
        />
        <div className="grid gap-3 md:grid-cols-3">
          {LOYALTY_PROGRAMS.map((p) => {
            const current = game.loyalty === p.level;
            const locked = game.level < p.unlockLevel;
            return (
              <div key={p.level} className={cn('flex flex-col rounded-2xl border p-4', current ? 'border-rose-300/50 bg-rose-500/[0.08]' : 'border-white/10 bg-white/[0.03]', locked && 'opacity-60')}>
                <p className="flex items-center justify-between font-display font-bold text-white">
                  {p.label}
                  {current && <Badge tone="bad">Ativo</Badge>}
                </p>
                <p className="mt-1 flex-1 text-sm text-slate-400">{p.description}</p>
                {p.level > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-slate-300">
                    <li>+{Math.round(p.repeatBoost * 100)}% de recompra · +{Math.round(p.retention * 100)} p.p. de clientes que ficam</li>
                    <li>
                      +{p.satisfaction} de satisfação · {Math.round(p.discount * 100)}% de desconto · {money(p.monthlyCost)}/mês
                    </li>
                  </ul>
                )}
                {locked ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-400">
                    <Lock className="size-4" aria-hidden /> Libera no nível {p.unlockLevel}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    className="mt-3"
                    variant={current ? 'secondary' : 'outline'}
                    disabled={current}
                    onClick={() => act((s) => setLoyalty(s, p.level))}
                    icon={current ? <Check className="size-4" aria-hidden /> : undefined}
                  >
                    {current ? 'Em uso' : p.level === 0 ? 'Encerrar programa' : 'Ativar'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <TipCard title="Cliente satisfeito compra de novo">
        Conquistar um cliente novo custa caro (CAC). Manter os clientes atuais satisfeitos gera recompra quase de graça. Por isso,
        qualidade e atendimento são tão importantes quanto o marketing.
      </TipCard>
    </div>
  );
}
