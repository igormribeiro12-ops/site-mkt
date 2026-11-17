import { useEffect, useState } from 'react';
import { FlaskConical, Layers, Lock, Package, Tag } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, Meter, Panel, PanelHeader, Stat, TipCard } from '../../../components/ui/Panel';
import { MAX_PRODUCT_LINES, PRODUCT_LAUNCH_UNLOCK, RD_COST, TAX_RATE, getSegment, positioning, priceRange, qualityExpectation } from '../../../game/data';
import { investRD, launchProduct, rdGain, setPrice } from '../../../game/engine';
import { money, num, pct } from '../../../game/format';
import { ticketMultiplier, unitCost } from '../../../game/simulation';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';
import { productLaunchCost } from '../../../game/data';

export function ProductTab() {
  const { game, act, update } = useActiveGame();
  const seg = getSegment(game.company.segment);
  const range = priceRange(seg.refPrice);
  const [price, setLocalPrice] = useState(game.price);
  useEffect(() => setLocalPrice(game.price), [game.price]);
  const uc = unitCost(game);
  const margin = price * (1 - TAX_RATE) - uc;
  const pos = positioning(price / seg.refPrice);
  const expect = qualityExpectation(seg);
  const canLaunch = game.level >= PRODUCT_LAUNCH_UNLOCK && game.productLines < MAX_PRODUCT_LINES;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Produto e preço</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{game.company.product}</h1>
        <p className="text-sm text-slate-400">Diferencial: {game.company.differential}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Tag} label="Preço de venda" value={money(game.price, true)} hint={`Média do mercado: ${money(seg.refPrice)}`} />
        <Stat icon={Package} label="Custo por unidade" value={money(uc, true)} hint="Produção, materiais e entrega" />
        <Stat icon={FlaskConical} label="Qualidade" value={`${num(game.quality)}/100`} tone={game.quality >= expect ? 'good' : 'warn'} hint={`Mercado espera ${expect}`} />
        <Stat icon={Layers} label="Linhas de produto" value={`${game.productLines}`} hint={`Ticket médio ×${ticketMultiplier(game).toFixed(2)}`} />
      </div>

      <Panel>
        <PanelHeader icon={Tag} title="Preço e posicionamento" subtitle="A mudança vale para os próximos meses. Veja a projeção na barra inferior." />
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="range"
            aria-label="Preço de venda"
            min={range.min}
            max={range.max}
            step={seg.refPrice >= 60 ? 1 : 0.5}
            value={price}
            onChange={(e) => setLocalPrice(Number(e.target.value))}
            onPointerUp={() => update((s) => setPrice(s, price))}
            onKeyUp={() => update((s) => setPrice(s, price))}
            onBlur={() => price !== game.price && update((s) => setPrice(s, price))}
            className="min-w-[12rem] flex-1"
          />
          <span className="w-28 text-right font-display text-3xl font-bold text-white">{money(price)}</span>
          <Badge tone={pos.tone === 'premium' ? 'violet' : pos.tone === 'econ' ? 'info' : 'good'}>{pos.label}</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.03] p-3 text-sm ring-1 ring-white/10">
            <p className="text-slate-400">Diferença para a média</p>
            <p className={cn('font-display text-lg font-bold', price > seg.refPrice ? 'text-violet-300' : price < seg.refPrice ? 'text-sky-300' : 'text-white')}>
              {price === seg.refPrice ? 'Igual' : `${price > seg.refPrice ? '+' : ''}${pct(price / seg.refPrice - 1, 0)}`}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3 text-sm ring-1 ring-white/10">
            <p className="text-slate-400">Sobra por venda (após imposto)</p>
            <p className={cn('font-display text-lg font-bold', margin > 0 ? 'text-emerald-300' : 'text-rose-300')}>{money(margin, true)}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3 text-sm ring-1 ring-white/10">
            <p className="text-slate-400">Margem de contribuição</p>
            <p className={cn('font-display text-lg font-bold', margin > 0 ? 'text-emerald-300' : 'text-rose-300')}>{pct(margin / price, 0)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Poder de compra do mercado: {seg.purchasingPower}/100. Quanto menor, mais os clientes reagem a aumentos de preço.
        </p>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={FlaskConical} title="Qualidade do produto (P&D)" subtitle="Qualidade aumenta a conversão, a satisfação e a recompra." accent="emerald" />
          <div className="flex justify-between text-sm text-slate-300">
            <span>Qualidade atual</span>
            <span className="tabular-nums">{num(game.quality)} / 100 (esperado: {expect})</span>
          </div>
          <div className="relative mt-1.5">
            <Meter value={game.quality} size="md" label="Qualidade do produto" />
            <span className="absolute top-[-3px] h-4 w-0.5 bg-amber-300" style={{ left: `${expect}%` }} aria-hidden title="Qualidade esperada pelo mercado" />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            A qualidade cai um pouco todo mês (os concorrentes evoluem). Desenvolvedores de produto aumentam a qualidade automaticamente.
          </p>
          <Button className="mt-4" variant="success" disabled={game.quality >= 98} onClick={() => act(investRD)} icon={<FlaskConical className="size-4" aria-hidden />}>
            Investir {money(RD_COST)} em melhorias (+{rdGain(game.quality)})
          </Button>
        </Panel>
        <Panel>
          <PanelHeader icon={Layers} title="Novos produtos" subtitle="Cada nova linha aumenta o ticket médio em 15% e a inovação da empresa." accent="violet" />
          <p className="text-sm text-slate-300">
            Você tem <b className="text-white">{game.productLines}</b> de {MAX_PRODUCT_LINES} linhas de produto possíveis.
          </p>
          {game.level < PRODUCT_LAUNCH_UNLOCK ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Lock className="size-4" aria-hidden /> Lançar novos produtos libera no nível {PRODUCT_LAUNCH_UNLOCK}.
            </p>
          ) : (
            <Button className="mt-4" disabled={!canLaunch} onClick={() => act(launchProduct)} icon={<Layers className="size-4" aria-hidden />}>
              {game.productLines >= MAX_PRODUCT_LINES ? 'Linha completa' : `Lançar novo produto (${money(productLaunchCost(game.productLines))})`}
            </Button>
          )}
        </Panel>
      </div>

      <TipCard title="Preço x valor percebido">
        O cliente compara o preço com o valor que percebe: qualidade, marca e atendimento. Se o valor percebido for alto, ele aceita pagar
        mais. Esse é o segredo do posicionamento premium.
      </TipCard>
    </div>
  );
}
