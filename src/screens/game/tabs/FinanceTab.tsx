import { HandCoins, Landmark, ScrollText, Wallet } from 'lucide-react';
import { FinanceChart } from '../../../components/charts/Charts';
import { Button } from '../../../components/ui/Button';
import { Meter, Panel, PanelHeader, Stat, TipCard } from '../../../components/ui/Panel';
import { getDifficulty } from '../../../game/data';
import { loanLimit, loanPayment, payOffLoan, takeLoan } from '../../../game/engine';
import { money } from '../../../game/format';
import { totalDebt } from '../../../game/simulation';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';

export function FinanceTab() {
  const { game, act } = useActiveGame();
  const diff = getDifficulty(game.player.difficulty);
  const last = game.history[game.history.length - 1];
  const debt = totalDebt(game);
  const limit = loanLimit(game);
  const offers = [3000, 5000, 10000, 15000, 20000].filter((v) => v <= limit);

  const dre = last
    ? [
        { label: 'Receita de vendas', value: last.revenue, strong: true },
        { label: '(−) Custo dos produtos vendidos', value: -last.costs.variable },
        { label: '(−) Impostos', value: -last.costs.taxes },
        { label: '(=) Lucro bruto', value: last.revenue - last.costs.variable - last.costs.taxes, strong: true },
        { label: '(−) Marketing', value: -last.costs.marketing },
        { label: '(−) Salários', value: -last.costs.salaries },
        { label: '(−) Aluguel e ferramentas', value: -(last.costs.rent + last.costs.tools) },
        { label: '(−) Juros', value: -last.costs.interest },
        { label: '(=) Resultado do mês', value: last.profit, strong: true, total: true },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Finanças</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Caixa, resultado e dívidas</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Wallet} label="Saldo" value={money(game.cash)} tone={game.cash < 0 ? 'bad' : 'good'} />
        <Stat icon={Landmark} label="Dívidas" value={money(debt)} tone={debt > diff.debtLimit * 0.6 ? 'bad' : 'default'} hint={`Limite: ${money(diff.debtLimit)}`} />
        <Stat icon={ScrollText} label="Receita acumulada" value={money(game.totalRevenue)} />
        <Stat icon={HandCoins} label="Investido em marketing" value={money(game.totalMarketing)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={ScrollText} title="Demonstrativo do último mês" subtitle="Da receita até o lucro: para onde vai cada real." accent="blue" />
          {last ? (
            <table className="w-full text-sm">
              <tbody>
                {dre.map((row) => (
                  <tr key={row.label} className={cn('border-b border-white/[0.05]', row.total && 'border-t border-white/20')}>
                    <td className={cn('py-1.5', row.strong ? 'font-semibold text-white' : 'text-slate-400')}>{row.label}</td>
                    <td className={cn('py-1.5 text-right tabular-nums', row.total ? (row.value >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-rose-300') : row.strong ? 'font-semibold text-white' : 'text-slate-300')}>
                      {money(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">O demonstrativo aparece depois do primeiro mês.</p>
          )}
        </Panel>

        <Panel>
          <PanelHeader icon={Wallet} title="Fluxo de caixa do último mês" subtitle="Lucro e caixa são coisas diferentes." accent="emerald" />
          {last ? (
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between text-slate-400"><span>Caixa no início</span><span className="tabular-nums text-slate-200">{money(last.cashStart)}</span></li>
              <li className="flex justify-between text-slate-400"><span>(+/−) Resultado do mês</span><span className="tabular-nums text-slate-200">{money(last.profit)}</span></li>
              {last.costs.loan > 0.5 && <li className="flex justify-between text-slate-400"><span>(−) Amortização de empréstimos</span><span className="tabular-nums text-slate-200">{money(-last.costs.loan)}</span></li>}
              <li className="flex justify-between border-t border-white/10 pt-1.5 font-semibold text-white"><span>Caixa no fim</span><span className="tabular-nums">{money(last.cashEnd)}</span></li>
            </ul>
          ) : (
            <p className="text-sm text-slate-500">O fluxo de caixa aparece depois do primeiro mês.</p>
          )}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Dívida total em relação ao limite de falência</span>
              <span>{money(debt)} / {money(diff.debtLimit)}</span>
            </div>
            <Meter value={(debt / diff.debtLimit) * 100} size="md" className="mt-1.5" color={debt > diff.debtLimit * 0.6 ? '#f87171' : '#fbbf24'} label="Dívida em relação ao limite" />
            <p className="mt-2 text-xs text-slate-500">
              Cheque especial: até {money(diff.overdraftLimit)} negativos, com juros de {Math.round(diff.overdraftInterest * 100)}% ao mês. Passou disso, falência.
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader icon={Landmark} title="Empréstimos" subtitle={`Juros de ${(diff.loanInterest * 100).toFixed(1)}% ao mês, pagos em 12 parcelas. Limite disponível: ${money(limit)}.`} accent="amber" />
        {game.loans.length > 0 && (
          <ul className="mb-4 space-y-2">
            {game.loans.map((loan, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] p-3 text-sm ring-1 ring-white/10">
                <span className="flex-1 text-slate-300">
                  Empréstimo de {money(loan.principal)} · saldo devedor <b className="text-white">{money(loan.balance)}</b> · parcela {money(loan.monthlyPayment)} · faltam {loan.monthsLeft} meses
                </span>
                <Button size="sm" variant="secondary" onClick={() => act((s) => payOffLoan(s, i))}>
                  Quitar ({money(loan.balance)})
                </Button>
              </li>
            ))}
          </ul>
        )}
        {offers.length ? (
          <div className="flex flex-wrap gap-2">
            {offers.map((v) => {
              const p = loanPayment(v, diff.loanInterest);
              return (
                <Button key={v} variant="outline" onClick={() => act((s) => takeLoan(s, v))} className="h-auto flex-col items-start py-2">
                  <span className="font-display text-base font-bold text-white">{money(v)}</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    12× {money(p)} · juros {money(p * 12 - v)}
                  </span>
                </Button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sem limite disponível para novos empréstimos no momento.</p>
        )}
      </Panel>

      <Panel>
        <FinanceChart history={game.history} />
      </Panel>

      {game.history.length > 0 && (
        <Panel>
          <PanelHeader icon={ScrollText} title="Histórico mensal" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 font-semibold">Mês</th>
                  <th className="py-2 text-right font-semibold">Receita</th>
                  <th className="py-2 text-right font-semibold">Despesas</th>
                  <th className="py-2 text-right font-semibold">Resultado</th>
                  <th className="py-2 text-right font-semibold">Caixa</th>
                </tr>
              </thead>
              <tbody>
                {[...game.history].reverse().map((h) => (
                  <tr key={h.month} className="border-t border-white/[0.05]">
                    <td className="py-1.5 text-slate-300">Mês {h.month}</td>
                    <td className="py-1.5 text-right tabular-nums">{money(h.revenue)}</td>
                    <td className="py-1.5 text-right tabular-nums">{money(h.totalCosts)}</td>
                    <td className={cn('py-1.5 text-right tabular-nums font-semibold', h.profit >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{money(h.profit)}</td>
                    <td className="py-1.5 text-right tabular-nums">{money(h.cashEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <TipCard title="Fluxo de caixa">
        Uma empresa pode ter lucro e mesmo assim ficar sem dinheiro, se gastar muito de uma vez (expansões, estoque, empréstimos). Planeje
        os grandes investimentos olhando o caixa, não só o lucro.
      </TipCard>
    </div>
  );
}
