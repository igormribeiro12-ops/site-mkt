import { Flame, Landmark, PiggyBank, ScrollText, Umbrella, Wallet } from 'lucide-react';
import { FinanceChart } from '../../../components/charts/Charts';
import { Button } from '../../../components/ui/Button';
import { Meter, Panel, PanelHeader, Stat, TipCard } from '../../../components/ui/Panel';
import { INSURANCE_COVERAGE, INSURANCE_UNLOCK, getDifficulty } from '../../../game/data';
import { depositSavings, loanLimit, loanPayment, payOffLoan, takeLoan, toggleInsurance, withdrawSavings } from '../../../game/engine';
import { money } from '../../../game/format';
import { costIndex, debtLimit, insurancePremium, interestFactor, overdraftLimit, savingsRate, totalDebt } from '../../../game/simulation';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';

export function FinanceTab() {
  const { game, act } = useActiveGame();
  const diff = getDifficulty(game.player.difficulty);
  const last = game.history[game.history.length - 1];
  const debt = totalDebt(game);
  const limit = loanLimit(game);
  const offers = [3000, 5000, 10000, 15000, 20000, 30000, 50000].filter((v) => v <= limit);
  const maxDebt = debtLimit(game);
  const overdraft = overdraftLimit(game);
  const loanRate = diff.loanInterest * interestFactor(game);
  const inflation = costIndex(game) - 1;
  const rate = savingsRate(game);
  const deposits = [1000, 5000, 10000, 25000].filter((v) => v <= game.cash);
  const withdrawals = [1000, 5000, 10000].filter((v) => v < game.savings);

  const dre = last
    ? [
        { label: 'Receita de vendas', value: last.revenue, strong: true },
        { label: '(−) Custo dos produtos vendidos', value: -last.costs.variable },
        { label: '(−) Impostos', value: -last.costs.taxes },
        { label: '(=) Lucro bruto', value: last.revenue - last.costs.variable - last.costs.taxes, strong: true },
        { label: '(−) Marketing', value: -last.costs.marketing },
        { label: '(−) Salários', value: -last.costs.salaries },
        { label: '(−) Aluguel e ferramentas', value: -(last.costs.rent + last.costs.tools) },
        ...((last.costs.services ?? 0) > 0.5 ? [{ label: '(−) Fidelidade e seguro', value: -last.costs.services }] : []),
        ...((last.savingsIncome ?? 0) > 0.5 ? [{ label: '(+) Rendimento da aplicação', value: last.savingsIncome }] : []),
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
        <Stat icon={Landmark} label="Dívidas" value={money(debt)} tone={debt > maxDebt * 0.6 ? 'bad' : 'default'} hint={`Limite: ${money(maxDebt)}`} />
        <Stat icon={PiggyBank} label="Aplicação" value={money(game.savings)} tone={game.savings > 0 ? 'good' : 'default'} hint={`Rende ${(rate * 100).toFixed(1).replace('.', ',')}% ao mês`} />
        <Stat
          icon={Flame}
          label="Inflação acumulada"
          value={`+${(inflation * 100).toFixed(1).replace('.', ',')}%`}
          tone={inflation > 0.1 ? 'warn' : 'default'}
          hint={`${(diff.inflation * 100).toFixed(1).replace('.', ',')}% ao mês em custos e preços do mercado`}
        />
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
              <span>{money(debt)} / {money(maxDebt)}</span>
            </div>
            <Meter value={(debt / maxDebt) * 100} size="md" className="mt-1.5" color={debt > maxDebt * 0.6 ? '#f87171' : '#fbbf24'} label="Dívida em relação ao limite" />
            <p className="mt-2 text-xs text-slate-500">
              Cheque especial: até {money(overdraft)} negativos, com juros de {(diff.overdraftInterest * interestFactor(game) * 100).toFixed(1).replace('.', ',')}% ao mês. Passou disso,
              falência. Os limites crescem com o nível da empresa.
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          icon={Landmark}
          title="Empréstimos"
          subtitle={`Juros de ${(loanRate * 100).toFixed(1).replace('.', ',')}% ao mês${game.employees.financeiro > 0 ? ' (negociados pelo analista financeiro)' : ''}, pagos em 12 parcelas. Limite disponível: ${money(limit)}.`}
          accent="amber"
        />
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            icon={PiggyBank}
            title="Aplicação financeira"
            subtitle={`Rende ${(rate * 100).toFixed(1).replace('.', ',')}% ao mês e cobre o caixa sozinha se ele ficar negativo.`}
            accent="emerald"
          />
          <p className="text-sm text-slate-300">
            Aplicado: <b className="font-display text-lg text-white">{money(game.savings)}</b>
            {game.savings > 0 && <span className="text-slate-400"> · rende cerca de {money(game.savings * rate)} por mês</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Aplicar dinheiro">
            {deposits.map((v) => (
              <Button key={v} size="sm" variant="outline" onClick={() => act((s) => depositSavings(s, v))}>
                Aplicar {money(v)}
              </Button>
            ))}
            {deposits.length === 0 && <p className="text-xs text-slate-500">Sem caixa sobrando para aplicar agora.</p>}
          </div>
          {game.savings >= 1 && (
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Resgatar dinheiro">
              {withdrawals.map((v) => (
                <Button key={v} size="sm" variant="secondary" onClick={() => act((s) => withdrawSavings(s, v))}>
                  Resgatar {money(v)}
                </Button>
              ))}
              <Button size="sm" variant="secondary" onClick={() => act((s) => withdrawSavings(s, s.savings))}>
                Resgatar tudo
              </Button>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">Dinheiro aplicado não paga contas no dia a dia, mas é a sua reserva de emergência e conta no valor da empresa.</p>
        </Panel>

        <Panel>
          <PanelHeader
            icon={Umbrella}
            title="Seguro empresarial"
            subtitle={`Devolve ${Math.round(INSURANCE_COVERAGE * 100)}% do prejuízo de eventos ruins (multas, crises, falhas).`}
            accent="blue"
          />
          <p className="text-sm text-slate-300">
            Mensalidade hoje: <b className="text-white">{money(insurancePremium(game))}/mês</b>
            <span className="text-slate-400"> (cresce com o tamanho da empresa)</span>
          </p>
          {game.level < INSURANCE_UNLOCK && !game.insurance ? (
            <p className="mt-3 text-sm text-slate-400">Libera no nível {INSURANCE_UNLOCK}.</p>
          ) : (
            <Button className="mt-3" size="sm" variant={game.insurance ? 'secondary' : 'primary'} onClick={() => act(toggleInsurance)} icon={<Umbrella className="size-4" aria-hidden />}>
              {game.insurance ? 'Cancelar o seguro' : 'Contratar o seguro'}
            </Button>
          )}
          {game.insurance && <p className="mt-2 text-xs font-semibold text-emerald-300">Seguro ativo.</p>}
          <p className="mt-3 text-xs text-slate-500">Seguro é um custo fixo que protege o caixa de surpresas. Vale mais quando um prejuízo grande poderia levar à falência.</p>
        </Panel>
      </div>

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
