import { useMemo } from 'react';
import { ChevronsRight, TriangleAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getDifficulty } from '../../game/data';
import { money } from '../../game/format';
import { plannedCosts, projectMonth } from '../../game/simulation';
import { cn } from '../../lib/cn';
import { useActiveGame } from '../../state/GameContext';

export function AdvanceBar({ onAdvance, disabled }: { onAdvance: () => void; disabled: boolean }) {
  const { game } = useActiveGame();
  const planned = plannedCosts(game);
  const projection = useMemo(() => projectMonth(game), [game]);
  const diff = getDifficulty(game.player.difficulty);
  const risk = projection.cashEnd < -diff.overdraftLimit * 0.6;
  const blocked = disabled || game.phase !== 'playing' || Boolean(game.pendingEvent);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-900/95 backdrop-blur-xl" data-tour="advance">
      <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-3 py-3 sm:px-5">
        <div className="hidden min-w-0 flex-1 gap-6 text-xs sm:flex">
          <div>
            <p className="font-semibold uppercase tracking-wider text-slate-500">Gastos previstos do mês</p>
            <p className="font-display text-base font-bold text-rose-300">{money(planned.total)}</p>
            <p className="text-slate-500">
              Marketing {money(planned.marketing)} · Salários {money(planned.salaries)} · Estrutura {money(planned.rent + planned.tools)}
              {planned.loan > 0 && ` · Empréstimos ${money(planned.loan)}`}
            </p>
          </div>
          <div className="hidden md:block">
            <p className="font-semibold uppercase tracking-wider text-slate-500">Projeção do mês</p>
            <p className={cn('font-display text-base font-bold', projection.profit >= 0 ? 'text-emerald-300' : 'text-amber-300')}>
              {projection.profit >= 0 ? 'Lucro' : 'Prejuízo'} ≈ {money(Math.abs(projection.profit))}
            </p>
            <p className="text-slate-500">
              Receita ≈ {money(projection.revenue)} · Caixa ao final ≈ {money(projection.cashEnd)}
            </p>
          </div>
          {risk && (
            <p className="flex max-w-xs items-center gap-2 self-center rounded-xl bg-rose-500/10 px-3 py-2 font-semibold text-rose-300 ring-1 ring-rose-400/20">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              Risco de falência! Reduza gastos ou aumente as vendas.
            </p>
          )}
        </div>
        <div className="flex-1 text-xs sm:hidden">
          <p className="text-slate-500">Gastos previstos</p>
          <p className="font-display text-sm font-bold text-rose-300">{money(planned.total)}</p>
        </div>
        <Button size="lg" onClick={onAdvance} disabled={blocked} iconRight={<ChevronsRight className="size-5" aria-hidden />} className="shrink-0">
          Avançar para o mês {game.month + 1}
        </Button>
      </div>
    </div>
  );
}
