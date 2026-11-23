import { Flag, Home, Play, Printer, RotateCcw, Skull, Trophy } from 'lucide-react';
import { FinanceChart } from '../components/charts/Charts';
import { CompanyLogo } from '../components/CompanyLogo';
import { Button } from '../components/ui/Button';
import { Meter, Panel, PanelHeader } from '../components/ui/Panel';
import { LEVELS, getDifficulty, getSegment } from '../game/data';
import { continueAfterVictory } from '../game/engine';
import { presentCities, presentStates } from '../game/expansion';
import { money, num, pct } from '../game/format';
import { computeScore, marketingTotals } from '../game/scoring';
import { valuation } from '../game/simulation';
import { cn } from '../lib/cn';
import { useActiveGame } from '../state/GameContext';

interface Props {
  onMenu: () => void;
  onNewGame: () => void;
  onContinue: () => void;
}

export function FinalReport({ onMenu, onNewGame, onContinue }: Props) {
  const { game, update, deleteGame } = useActiveGame();
  const score = computeScore(game);
  const mkt = marketingTotals(game);
  const seg = getSegment(game.company.segment);
  const months = game.history.length;
  const profitTotal = game.history.reduce((s, h) => s + h.profit, 0);
  const best = [...game.history].sort((a, b) => b.profit - a.profit)[0];
  const decisions = game.decisions.filter((d) => d.kind !== 'marketing' || game.decisions.length < 20).slice(-14);

  const header =
    game.phase === 'won'
      ? { icon: Trophy, title: 'Vitória!', tone: 'from-emerald-500/30 via-violet-500/20 to-blue-500/20', color: 'text-amber-300' }
      : game.phase === 'lost'
        ? { icon: Skull, title: 'Falência', tone: 'from-rose-600/30 via-ink-850 to-ink-850', color: 'text-rose-300' }
        : { icon: Flag, title: game.freePlay ? 'Relatório do império' : 'Fim da jornada', tone: 'from-sky-500/25 via-violet-500/15 to-ink-850', color: 'text-sky-300' };
  const Icon = header.icon;

  return (
    <div className="game-backdrop min-h-dvh print:bg-white">
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onMenu} icon={<Home className="size-4" aria-hidden />}>
            Menu
          </Button>
          <div className="flex-1" />
          {game.phase === 'won' && !game.freePlay && (
            <Button
              size="sm"
              variant="success"
              icon={<Play className="size-4" aria-hidden />}
              onClick={() => {
                update(continueAfterVictory);
                onContinue();
              }}
            >
              Continuar jogando
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => window.print()} icon={<Printer className="size-4" aria-hidden />}>
            Imprimir / PDF
          </Button>
          <Button
            size="sm"
            onClick={() => {
              deleteGame();
              onNewGame();
            }}
            icon={<RotateCcw className="size-4" aria-hidden />}
          >
            Novo jogo
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 print:space-y-4 print:p-0 print:text-slate-900">
        <section className={cn('overflow-hidden rounded-3xl bg-gradient-to-br p-6 ring-1 ring-white/10 sm:p-8 print:bg-none print:ring-slate-300', header.tone)}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1">
              <p className={cn('flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.3em]', header.color)}>
                <Icon className="size-5" aria-hidden /> {header.title}
              </p>
              <div className="mt-3">
                <CompanyLogo logo={game.company.logo} name={game.company.name} slogan={game.company.slogan} size="lg" />
              </div>
              <p className="mt-3 text-sm text-slate-300 print:text-slate-700">
                Empreendedor(a): <b className="text-white print:text-slate-900">{game.player.name}</b> · {seg.label} · {getDifficulty(game.player.difficulty).label} · {months}{' '}
                {months === 1 ? 'mês' : 'meses'} de operação
              </p>
              {game.endReason && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200 print:text-slate-800">{game.endReason}</p>}
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pontuação final</p>
              <p className="font-display text-6xl font-bold text-white print:text-slate-900">{score.total}</p>
              <p className="text-xs text-slate-400">de 1000</p>
              <p className="mt-2 rounded-full bg-white/10 px-4 py-1.5 font-display font-bold text-amber-200 print:bg-amber-100 print:text-amber-900">{score.rank.title}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-300 print:text-slate-700">{score.rank.description}</p>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <Panel className="print-avoid-break print:border-slate-300 print:bg-white">
            <PanelHeader title="Pontuação por área" />
            <ul className="space-y-3">
              {score.pillars.map((p) => (
                <li key={p.id}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 print:text-slate-800">{p.label}</span>
                    <span className="tabular-nums text-slate-400">{p.value}/{p.max}</span>
                  </div>
                  <Meter value={(p.value / p.max) * 100} size="sm" className="mt-1" label={p.label} />
                  <p className="mt-0.5 text-xs text-slate-500">{p.comment}</p>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="print-avoid-break print:border-slate-300 print:bg-white">
            <PanelHeader title="Desempenho financeiro" />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Receita acumulada', money(game.totalRevenue)],
                ['Lucro acumulado', money(profitTotal)],
                ['Caixa final', money(game.cash)],
                ['Valor da empresa', money(valuation(game))],
                ['Clientes conquistados', num(game.customersTotal)],
                ['Nível alcançado', `${game.level} · ${LEVELS[game.level - 1].title}`],
                ['Melhor mês', best ? `Mês ${best.month} (${money(best.profit)})` : '—'],
                ['Seguidores', num(game.followers)],
                ['Presença no Brasil', `${presentCities(game).size} ${presentCities(game).size === 1 ? 'cidade' : 'cidades'} · ${presentStates(game).size} ${presentStates(game).size === 1 ? 'estado' : 'estados'}`],
                ['Desafios do mês cumpridos', num(game.goalsDone)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06] print:bg-slate-50">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-display font-bold text-white print:text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        <Panel className="print-avoid-break print:border-slate-300 print:bg-white">
          <FinanceChart history={game.history} height={240} />
        </Panel>

        <Panel className="print-avoid-break print:border-slate-300 print:bg-white">
          <PanelHeader
            title="Estratégia de marketing"
            subtitle={
              mkt.spend > 0
                ? `Investimento total de ${money(mkt.spend)} · CAC médio ${mkt.cac !== null ? money(mkt.cac, true) : '—'} · ROI ${pct(mkt.roi, 0)}`
                : 'Quase nenhum investimento em marketing.'
            }
          />
          {mkt.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2 font-semibold">Canal</th>
                    <th className="py-2 text-right font-semibold">Investimento</th>
                    <th className="py-2 text-right font-semibold">Clientes</th>
                    <th className="py-2 text-right font-semibold">CAC</th>
                    <th className="py-2 text-right font-semibold">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {mkt.rows.map((r) => (
                    <tr key={r.channel} className="border-t border-white/[0.05] print:border-slate-200">
                      <td className="py-1.5 text-slate-200 print:text-slate-900">{r.label}</td>
                      <td className="py-1.5 text-right tabular-nums">{money(r.spend)}</td>
                      <td className="py-1.5 text-right tabular-nums">{num(r.customers)}</td>
                      <td className="py-1.5 text-right tabular-nums">{r.cac !== null ? money(r.cac, true) : '—'}</td>
                      <td className={cn('py-1.5 text-right font-semibold tabular-nums', r.roi >= 0 ? 'text-emerald-300 print:text-emerald-700' : 'text-rose-300 print:text-rose-700')}>{pct(r.roi, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sem campanhas registradas.</p>
          )}
        </Panel>

        <Panel className="print-avoid-break print:border-slate-300 print:bg-white">
          <PanelHeader title="Principais decisões" />
          <ol className="space-y-2">
            {decisions.map((d, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">Mês {d.month}</span>
                <span className="text-slate-300 print:text-slate-800">{d.text}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <p className="pb-6 text-center text-xs text-slate-500">CONSTRUA SEU IMPÉRIO · Simulação educacional de empreendedorismo e marketing digital.</p>
      </main>
    </div>
  );
}
