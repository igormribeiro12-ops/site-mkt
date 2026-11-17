import { useMemo, useState } from 'react';
import { Check, Eye, Lock, Megaphone, Pause, Play, Plus, Rocket, Sparkles, Trash2, Users } from 'lucide-react';
import { AudienceChart, MarketingChart } from '../../../components/charts/Charts';
import { Button, IconButton } from '../../../components/ui/Button';
import { Badge, LockedNote, Panel, PanelHeader, Stat, TipCard } from '../../../components/ui/Panel';
import { CHANNELS, OBJECTIVES, getChannel, getObjective, getSegment } from '../../../game/data';
import { removeCampaign, saveCampaign, toggleCampaign } from '../../../game/engine';
import { money, num, numShort, pct } from '../../../game/format';
import { estimateCampaign, isCampaignRunnable } from '../../../game/simulation';
import type { ChannelId, ObjectiveId } from '../../../game/types';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';

function efficiencyLabel(ratio: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (ratio >= 0.66) return { label: 'Alta', tone: 'good' };
  if (ratio >= 0.33) return { label: 'Média', tone: 'warn' };
  return { label: 'Baixa', tone: 'bad' };
}

export function MarketingTab() {
  const { game, act, update } = useActiveGame();
  const seg = getSegment(game.company.segment);
  const [channel, setChannel] = useState<ChannelId>('instagram');
  const [objective, setObjective] = useState<ObjectiveId>('sales');
  const ch = getChannel(channel);
  const [budget, setBudget] = useState(500);
  const effectiveBudget = Math.max(ch.minBudget, budget);
  const est = estimateCampaign(game, channel, objective, effectiveBudget);
  const last = game.history[game.history.length - 1];

  // Eficiência de cada canal para o seu mercado: clientes por R$ investido (objetivo vendas).
  const efficiency = useMemo(() => {
    const values = CHANNELS.map((c) => ({ id: c.id, v: estimateCampaign(game, c.id, 'sales', Math.max(c.minBudget, 800)).customers / Math.max(c.minBudget, 800) }));
    const max = Math.max(...values.map((x) => x.v), 1e-9);
    return Object.fromEntries(values.map((x) => [x.id, x.v / max])) as Record<ChannelId, number>;
  }, [game]);

  const activeBudget = game.campaigns.filter((c) => isCampaignRunnable(game, c)).reduce((s, c) => s + c.budget, 0);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Marketing digital</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Painel de marketing</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} label="Seguidores" value={numShort(game.followers)} />
        <Stat icon={Eye} label="Reconhecimento" value={`${num(game.awareness)}%`} hint="Quantas pessoas do mercado conhecem a marca" />
        <Stat icon={Sparkles} label="Leads em aberto" value={num(game.leads)} hint="Interessados que ainda não compraram" />
        <Stat icon={Megaphone} label="Investimento mensal" value={money(activeBudget)} hint={`${game.campaigns.filter((c) => c.active).length} campanha(s) ativa(s)`} />
      </div>

      <Panel data-tour="new-campaign">
        <PanelHeader icon={Plus} title="Nova campanha" subtitle="Escolha o canal, o objetivo e quanto investir por mês. A campanha roda todo mês até você pausar." />

        <p className="mb-2 text-sm font-semibold text-slate-200">1. Canal</p>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {CHANNELS.map((c) => {
            const locked = game.level < c.unlockLevel;
            const eff = efficiencyLabel(efficiency[c.id]);
            const selected = channel === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={locked}
                aria-pressed={selected}
                onClick={() => {
                  setChannel(c.id);
                  setBudget((b) => Math.max(b, c.minBudget));
                }}
                className={cn(
                  'relative flex flex-col gap-2 rounded-2xl border p-3.5 text-left transition',
                  selected ? 'border-violet-400/70 bg-violet-500/[0.12] ring-1 ring-violet-400/50' : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20',
                  locked && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: c.color }} aria-hidden />
                  <span className="font-display text-sm font-bold text-white">{c.label}</span>
                  {selected && <Check className="ml-auto size-4 text-violet-300" aria-hidden />}
                  {locked && <span className="ml-auto"><LockedNote level={c.unlockLevel} /></span>}
                </span>
                <span className="text-[11px] leading-snug text-slate-400">{c.audience}</span>
                <span className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                  <span>Mínimo: <b className="text-slate-300">{money(c.minBudget)}</b></span>
                  <span>Alcance/R$100: <b className="text-slate-300">{numShort(c.reachPer100 * seg.affinity[c.id])}</b></span>
                  <span>Conversão: <b className="text-slate-300">{pct(c.conversion, 1)}</b></span>
                  <span>
                    Eficiência: <b className={eff.tone === 'good' ? 'text-emerald-300' : eff.tone === 'warn' ? 'text-amber-300' : 'text-rose-300'}>{eff.label}</b>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">{ch.description}</p>

        <p className="mb-2 mt-5 text-sm font-semibold text-slate-200">2. Objetivo da campanha</p>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Objetivo da campanha">
          {OBJECTIVES.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={objective === o.id}
              onClick={() => setObjective(o.id)}
              className={cn(
                'rounded-2xl border p-3 text-left transition',
                objective === o.id ? 'border-violet-400/70 bg-violet-500/[0.12] ring-1 ring-violet-400/50' : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20',
              )}
            >
              <span className="font-display text-sm font-bold text-white">{o.label}</span>
              <span className="mt-1 block text-[11px] leading-snug text-slate-400">{o.description}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <label htmlFor="budget" className="mb-2 block text-sm font-semibold text-slate-200">
              3. Investimento por mês: <span className="font-display text-lg text-white">{money(effectiveBudget)}</span>
            </label>
            <input
              id="budget"
              type="range"
              min={ch.minBudget}
              max={Math.max(3000, ch.minBudget * 6, Math.round(game.cash / 100) * 100)}
              step={50}
              value={effectiveBudget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>{money(ch.minBudget)}</span>
              <span>Saldo atual: {money(game.cash)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[ch.minBudget, 300, 500, 1000, 2000].filter((v, i, arr) => v >= ch.minBudget && arr.indexOf(v) === i).map((v) => (
                <Button key={v} size="sm" variant={effectiveBudget === v ? 'outline' : 'secondary'} onClick={() => setBudget(v)}>
                  {money(v)}
                </Button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-4 ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimativa mensal</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex justify-between"><span className="text-slate-400">Alcance</span><b className="tabular-nums text-white">{num(est.reach)} pessoas</b></li>
              <li className="flex justify-between"><span className="text-slate-400">Novos clientes</span><b className="tabular-nums text-white">≈ {num(est.customers)}</b></li>
              <li className="flex justify-between"><span className="text-slate-400">Novos seguidores</span><b className="tabular-nums text-white">≈ {num(est.followers)}</b></li>
              <li className="flex justify-between"><span className="text-slate-400">Leads</span><b className="tabular-nums text-white">≈ {num(est.leads)}</b></li>
              <li className="flex justify-between"><span className="text-slate-400">CAC estimado</span><b className="tabular-nums text-white">{est.cac !== null ? money(est.cac, true) : '—'}</b></li>
            </ul>
            {ch.baseLimited && <p className="mt-2 text-[11px] text-amber-300">O WhatsApp só alcança sua base de contatos ({num(game.followers + game.customersTotal + game.leads)} pessoas).</p>}
            {ch.buildsOrganic && <p className="mt-2 text-[11px] text-emerald-300">SEO gera visitas orgânicas que continuam nos próximos meses.</p>}
            <Button
              className="mt-4 w-full"
              disabled={game.level < ch.unlockLevel}
              icon={<Rocket className="size-4" aria-hidden />}
              onClick={() => act((s) => saveCampaign(s, { channel, objective, budget: effectiveBudget }))}
            >
              Criar campanha
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader icon={Megaphone} title="Campanhas" subtitle="Pausadas não são cobradas. Os resultados aparecem no relatório de cada mês." />
        {game.campaigns.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">Você ainda não tem campanhas. Crie a primeira acima!</p>
        ) : (
          <ul className="space-y-2.5">
            {game.campaigns.map((c) => {
              const cc = getChannel(c.channel);
              const result = last?.campaigns.find((r) => r.campaignId === c.id);
              const runnable = isCampaignRunnable(game, c);
              return (
                <li key={c.id} className={cn('flex flex-wrap items-center gap-3 rounded-2xl border p-3.5', c.active ? 'border-white/10 bg-white/[0.03]' : 'border-white/[0.05] opacity-60')}>
                  <span className="size-3 shrink-0 rounded-full" style={{ background: cc.color }} aria-hidden />
                  <div className="min-w-[10rem] flex-1">
                    <p className="font-semibold text-white">
                      {cc.label} <span className="font-normal text-slate-400">· {getObjective(c.objective).short}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {money(c.budget)}/mês {!c.active && '· pausada'} {c.active && !runnable && game.level < cc.unlockLevel && <><Lock className="inline size-3" /> bloqueada</>}
                    </p>
                  </div>
                  {result && (
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span>{num(result.customers)} clientes</span>
                      <span>CAC {result.cac !== null ? money(result.cac) : '—'}</span>
                      <Badge tone={result.roi >= 0 ? 'good' : 'bad'}>ROI {pct(result.roi, 0)}</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={cc.minBudget}
                      step={50}
                      aria-label={`Investimento mensal em ${cc.label}`}
                      defaultValue={c.budget}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== c.budget) act((s) => saveCampaign(s, { id: c.id, channel: c.channel, objective: c.objective, budget: v }));
                      }}
                      className="h-9 w-24 rounded-lg border border-white/10 bg-ink-950/60 px-2 text-right text-sm text-white focus:border-violet-400 focus:outline-none"
                    />
                    <IconButton label={c.active ? `Pausar ${cc.label}` : `Retomar ${cc.label}`} onClick={() => update((s) => toggleCampaign(s, c.id))}>
                      {c.active ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </IconButton>
                    <IconButton label={`Excluir campanha em ${cc.label}`} onClick={() => update((s) => removeCampaign(s, c.id))} className="hover:text-rose-300">
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <MarketingChart history={game.history} />
        </Panel>
        <Panel>
          <AudienceChart history={game.history} />
        </Panel>
      </div>

      <TipCard title="CAC e ROI">
        CAC é quanto custa conquistar um cliente (investimento ÷ novos clientes). Se o lucro de cada venda for maior que o CAC, a campanha
        se paga. ROI mostra quanto o investimento devolveu: positivo significa que valeu a pena.
      </TipCard>
    </div>
  );
}
