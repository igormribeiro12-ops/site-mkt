import { useMemo } from 'react';
import { AlertTriangle, ArrowRight, BrainCircuit, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, Panel, PanelHeader } from '../../../components/ui/Panel';
import { type AdvisorAction, type Analysis, type Recommendation, analyze } from '../../../game/advisor';
import { money, num } from '../../../game/format';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { applyGameAction, doQuickAction } from '../../../world/actions';
import type { TabId, TabProps } from '../apps';

const TONE = {
  urgente: { icon: AlertTriangle, label: 'Urgente', box: 'border-rose-400/30 bg-rose-500/[0.07]', iconBox: 'bg-rose-500/20 text-rose-300', badge: 'bad' as const },
  oportunidade: { icon: TrendingUp, label: 'Oportunidade', box: 'border-emerald-400/25 bg-emerald-500/[0.06]', iconBox: 'bg-emerald-500/20 text-emerald-300', badge: 'good' as const },
  dica: { icon: Lightbulb, label: 'Dica', box: 'border-white/10 bg-white/[0.03]', iconBox: 'bg-amber-400/15 text-amber-300', badge: 'warn' as const },
};

const HEALTH = {
  otima: { label: 'Saúde ótima', tone: 'good' as const },
  boa: { label: 'Saúde boa', tone: 'info' as const },
  atencao: { label: 'Atenção', tone: 'warn' as const },
  critica: { label: 'Situação crítica', tone: 'bad' as const },
};

/** Executa a ação sugerida pelo consultor. */
function runAction(a: AdvisorAction, goTo: (t: TabId) => void) {
  switch (a.kind) {
    case 'apply':
      applyGameAction(a.run);
      break;
    case 'build':
      patchUi({ panel: null, buildItem: a.item, scene: 'office', editMode: false });
      break;
    case 'panel':
      patchUi({ panel: a.panel });
      break;
    case 'app':
      goTo(a.app);
      break;
    case 'quick':
      doQuickAction(a.id);
      break;
  }
}

export function useAnalysis(): Analysis {
  const { game } = useActiveGame();
  return useMemo(() => analyze(game), [game]);
}

function RecommendationCard({ r, goTo, compact }: { r: Recommendation; goTo: (t: TabId) => void; compact?: boolean }) {
  const t = TONE[r.tone];
  const Icon = t.icon;
  return (
    <li className={cn('flex gap-3 rounded-2xl border p-3.5', t.box)} data-testid={`rec-${r.id}`}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', t.iconBox)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={t.badge}>{t.label}</Badge>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{r.area}</span>
          {r.gain !== undefined && <span className="ml-auto text-xs font-bold text-emerald-300">+{money(r.gain)} em 3 meses</span>}
        </div>
        <p className="mt-1 text-sm font-bold text-white">{r.title}</p>
        {!compact && <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{r.detail}</p>}
        {compact && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{r.detail}</p>}
        {r.action && (
          <Button size="sm" variant={r.tone === 'oportunidade' ? 'success' : 'secondary'} className="mt-2" onClick={() => runAction(r.action!, goTo)} iconRight={<ArrowRight className="size-4" aria-hidden />}>
            {r.action.label}
          </Button>
        )}
      </div>
    </li>
  );
}

/** Resumo do consultor para o topo do painel. */
export function AdvisorSummary({ goTo }: TabProps) {
  const a = useAnalysis();
  const h = HEALTH[a.health];
  const top = a.recommendations.slice(0, 3);
  return (
    <Panel className="border-violet-400/25 bg-gradient-to-br from-violet-600/15 via-ink-850/80 to-ink-850/80" data-testid="advisor-summary">
      <PanelHeader
        icon={BrainCircuit}
        title="Consultor da empresa"
        subtitle={a.summary}
        action={<Badge tone={h.tone}>{h.label}</Badge>}
      />
      <ul className="space-y-2">
        {top.map((r) => (
          <RecommendationCard key={r.id} r={r} goTo={goTo} compact />
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => goTo('consultor')} iconRight={<ArrowRight className="size-4" aria-hidden />}>
        Ver todas as {a.recommendations.length} recomendações
      </Button>
    </Panel>
  );
}

export function AdvisorTab({ goTo }: TabProps) {
  const a = useAnalysis();
  const h = HEALTH[a.health];
  const groups = (['urgente', 'oportunidade', 'dica'] as const).map((tone) => ({ tone, items: a.recommendations.filter((r) => r.tone === tone) }));
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Consultor da empresa</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">O que fazer agora</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          O consultor analisou seus números e simulou {a.scenarios} decisões possíveis nos próximos 3 meses (campanhas, contratações, preço, móveis,
          expansão…). As recomendações abaixo são as que mais ajudam a empresa a crescer. A decisão final é sua!
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Diagnóstico', h.label],
          ['Lucro previsto', `${money(a.baseline.profitPerMonth)}/mês`],
          ['Novos clientes (3 meses)', num(a.baseline.customers)],
          ['Caixa em 3 meses', money(a.baseline.cash)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="font-display text-lg font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
      <p className={cn('rounded-2xl border p-3 text-sm', a.health === 'critica' ? 'border-rose-400/30 text-rose-100' : 'border-white/10 text-slate-200')}>{a.summary}</p>
      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.tone}>
              <h2 className="mb-2 font-display text-lg font-bold text-white">
                {g.tone === 'urgente' ? 'Resolva primeiro' : g.tone === 'oportunidade' ? 'Oportunidades de crescimento' : 'Dicas do dia a dia'}
              </h2>
              <ul className="space-y-2.5">
                {g.items.map((r) => (
                  <RecommendationCard key={r.id} r={r} goTo={goTo} />
                ))}
              </ul>
            </section>
          ),
      )}
      <p className="text-xs text-slate-500">
        Como funciona: o consultor usa as mesmas regras do jogo para projetar 3 meses com e sem cada decisão, sem a oscilação do mercado e sem eventos
        inesperados. Os valores são estimativas.
      </p>
    </div>
  );
}
