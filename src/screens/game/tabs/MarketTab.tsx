import { Compass, Globe2, PieChart, Scale, Target, UserRound } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, Meter, Panel, PanelHeader, Stat, TipCard } from '../../../components/ui/Panel';
import { CHANNELS, SCOPES, getSegment, positioning, qualityExpectation } from '../../../game/data';
import { money, num, pct } from '../../../game/format';
import { competitionLevel, marketSize, offer } from '../../../game/simulation';
import { useActiveGame } from '../../../state/GameContext';
import type { TabProps } from '../apps';

export function MarketTab({ goTo }: TabProps) {
  const { game } = useActiveGame();
  const seg = getSegment(game.company.segment);
  const size = marketSize(game);
  const share = Math.min(1, game.activeCustomers / size);
  const o = offer(game);
  const comp = competitionLevel(game);
  const pos = positioning(o.priceIndex);
  const scope = SCOPES[game.scopeLevel];

  // Perfis de consumidores do mercado (pesos derivados das características do segmento).
  const raw = {
    economico: 100 - seg.purchasingPower,
    exigente: seg.entryDifficulty + 10,
    conectado: (seg.affinity.instagram + seg.affinity.tiktok + seg.affinity.influencer) * 25,
  };
  const total = raw.economico + raw.exigente + raw.conectado;
  const profiles = [
    { id: 'Econômico', share: raw.economico / total, text: 'Compara preços e escolhe o que cabe no bolso.', factor: 'Preço', value: o.price / 1.5 },
    { id: 'Exigente', share: raw.exigente / total, text: 'Paga mais por qualidade e boas avaliações.', factor: 'Qualidade', value: o.quality / 1.2 },
    { id: 'Conectado', share: raw.conectado / total, text: 'Descobre marcas nas redes e confia em indicações.', factor: 'Reputação', value: o.reputation / 1.2 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Mercado</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          {seg.label} · {scope.label}
        </h1>
        <p className="text-sm text-slate-400">{seg.trendLabel}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Globe2} label="Clientes potenciais/mês" value={num(size)} hint={`Cresce ${pct(seg.trend, 0)} ao mês`} />
        <Stat icon={PieChart} label="Sua participação" value={pct(share, 1)} hint={`${num(game.activeCustomers)} clientes ativos`} />
        <Stat icon={Scale} label="Concorrência" value={`${num(comp)}/100`} tone={comp >= 75 ? 'bad' : comp >= 55 ? 'warn' : 'good'} hint={comp > seg.competition ? 'Aumentou com eventos ou expansão' : 'Nível normal do segmento'} />
        <Stat icon={Target} label="Qualidade esperada" value={`${qualityExpectation(seg)}/100`} hint={`Sua qualidade: ${num(game.quality)}`} tone={game.quality >= qualityExpectation(seg) ? 'good' : 'warn'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={Compass} title="Por que os clientes escolhem você?" subtitle="Atratividade da sua oferta frente à concorrência (afeta todas as vendas)." accent="blue" />
          <ul className="space-y-3">
            {[
              { label: `Preço (${pos.label.toLowerCase()}: ${money(game.price)} vs média ${money(seg.refPrice)})`, value: o.price / 1.5 },
              { label: `Qualidade (${num(game.quality)} vs esperado ${qualityExpectation(seg)})`, value: o.quality / 1.2 },
              { label: `Reputação da marca (${num(game.reputation)}/100)`, value: o.reputation / 1.2 },
              { label: `Pressão da concorrência (${num(comp)}/100)`, value: o.competition },
            ].map((f) => (
              <li key={f.label}>
                <p className="text-sm text-slate-300">{f.label}</p>
                <Meter value={f.value * 100} size="sm" className="mt-1" label={f.label} />
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-white/[0.03] p-3 text-sm text-slate-300 ring-1 ring-white/10">
            Atratividade geral da oferta: <strong className="font-display text-lg text-white">{num(o.score * 100)}</strong>
            <span className="text-slate-500"> (quanto maior, mais as campanhas convertem)</span>
          </p>
        </Panel>

        <Panel>
          <PanelHeader icon={UserRound} title={`Persona: ${seg.persona.name}, ${seg.persona.age} anos`} subtitle="O cliente típico do seu mercado (público-alvo)." accent="violet" />
          <p className="text-sm leading-relaxed text-slate-300">{seg.persona.description}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{seg.persona.channels}</p>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Onde o seu público está (afinidade por canal)</p>
          <ul className="space-y-1.5">
            {CHANNELS.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate text-slate-300">{c.label}</span>
                <Meter value={(seg.affinity[c.id] / 1.5) * 100} size="xs" className="flex-1" label={`Afinidade com ${c.label}`} />
                <span className="w-10 text-right text-xs tabular-nums text-slate-400">{seg.affinity[c.id].toFixed(1)}×</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelHeader icon={PieChart} title="Perfis de consumidores" subtitle="Cada perfil valoriza uma coisa. Sua oferta agrada cada um de forma diferente." accent="emerald" />
        <div className="grid gap-3 md:grid-cols-3">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <p className="font-display font-bold text-white">{p.id}</p>
                <Badge>{pct(p.share, 0)} do mercado</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-400">{p.text}</p>
              <p className="mt-3 text-xs text-slate-500">Valoriza: {p.factor}</p>
              <Meter value={p.value * 100} size="sm" className="mt-1" label={`Quanto sua oferta agrada o perfil ${p.id}`} color={p.value >= 0.7 ? '#34d399' : p.value >= 0.5 ? '#fbbf24' : '#f87171'} />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={Globe2} title="Expansão de mercado" subtitle="Atuar em uma região maior aumenta a demanda, e a concorrência também." />
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((s) => (
              <Badge key={s.level} tone={s.level === game.scopeLevel ? 'violet' : s.level < game.scopeLevel ? 'good' : 'default'}>
                {s.label} · {s.multiplier}× demanda
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => goTo('equipe')}>
            Ver opções de expansão
          </Button>
        </Panel>
        <TipCard title="Concorrência e posicionamento">
          Em mercados com muita concorrência, só preço baixo não basta: diferencie-se com qualidade, atendimento e uma marca forte.
          Mercados com mais poder de compra aceitam preços premium.
        </TipCard>
      </div>
    </div>
  );
}
