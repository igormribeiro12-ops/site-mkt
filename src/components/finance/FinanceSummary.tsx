import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Calculator, CircleDollarSign, Flag, Percent, Receipt, Scale, Timer, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { FinancePlan } from '../../types';
import type { FinanceResult } from '../../lib/finance';
import { formatCurrency, formatPercent, pluralize } from '../../lib/format';
import { cn } from '../../lib/cn';

const GOOD = '#0ca30c';
const CRITICAL = '#d03b3b';

function Kpi({
  icon: Icon,
  label,
  value,
  note,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 print-avoid-break">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      {badge}
      {note && <p className="mt-1 text-[11px] leading-snug text-slate-500">{note}</p>}
    </div>
  );
}

function ResultBadge({ result }: { result: number }) {
  const positive = result > 0;
  const zero = result === 0;
  const Icon = positive ? TrendingUp : zero ? Scale : TrendingDown;
  const color = positive ? GOOD : zero ? '#64748b' : CRITICAL;
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold" style={{ color }}>
      <Icon className="size-3.5" aria-hidden />
      {positive ? 'Lucro estimado' : zero ? 'Empate' : 'Prejuízo estimado'}
    </span>
  );
}

export function FinanceKpis({ result, plan, adBudget, className }: { result: FinanceResult; plan: FinancePlan; adBudget: number | null; className?: string }) {
  return (
    <div className={cn('@container', className)}>
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
      <Kpi
        icon={Receipt}
        label="Receita estimada"
        value={formatCurrency(result.revenue)}
        note={`${formatCurrency(plan.price)} × ${pluralize(plan.monthlySales ?? 0, 'venda', 'vendas')}/mês`}
      />
      <Kpi
        icon={Wallet}
        label="Custos totais"
        value={formatCurrency(result.totalCosts)}
        note={
          result.adsCost > 0
            ? `Inclui ${formatCurrency(result.adsCost)} de anúncios`
            : result.variableCosts > 0
              ? `Fixos + ${formatCurrency(result.variableCosts)} de produção`
              : adBudget && !plan.includeAds
                ? 'Anúncios não incluídos'
                : 'Custos fixos do mês'
        }
      />
      <Kpi icon={CircleDollarSign} label="Resultado estimado" value={formatCurrency(result.result)} badge={<ResultBadge result={result.result} />} />
      <Kpi
        icon={Percent}
        label="Margem estimada"
        value={formatPercent(result.margin)}
        note={result.margin === null ? 'Sem receita, não há margem' : 'Quanto sobra de cada R$ 100 vendidos'}
      />
      </div>
    </div>
  );
}

function Insight({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 print-avoid-break">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-slate-600">
        <p className="font-bold text-slate-800">{title}</p>
        {children}
      </div>
    </li>
  );
}

export function FinanceInsights({ result, plan }: { result: FinanceResult; plan: FinancePlan }) {
  const sales = plan.monthlySales ?? 0;
  const payback = result.paybackMonths;
  return (
    <ul className="space-y-4">
      <Insight icon={Calculator} title="Ponto de equilíbrio">
        {result.breakEvenUnits === null ? (
          <p>
            O preço de venda não cobre o custo de cada unidade: cada venda gera prejuízo. Reveja o preço ou o custo por
            unidade.
          </p>
        ) : (
          <p>
            É preciso vender pelo menos <strong>{pluralize(result.breakEvenUnits, 'unidade', 'unidades')} por mês</strong> para
            cobrir os custos.{' '}
            {sales >= result.breakEvenUnits
              ? `Sua estimativa de ${sales} vendas está acima desse número.`
              : `Sua estimativa de ${sales} vendas ainda não chega lá.`}
          </p>
        )}
      </Insight>
      <Insight icon={Timer} title="Retorno do investimento">
        {payback === 0 ? (
          <p>Não há investimento inicial a recuperar.</p>
        ) : payback === null ? (
          <p>Com o resultado mensal atual, o investimento inicial de {formatCurrency(plan.initialInvestment)} não seria recuperado.</p>
        ) : (
          <p>
            O investimento inicial de {formatCurrency(plan.initialInvestment)} seria recuperado em cerca de{' '}
            <strong>{pluralize(Math.ceil(payback), 'mês', 'meses')}</strong>.
          </p>
        )}
      </Insight>
      {result.goalGap !== null && plan.expectedRevenue !== null && (
        <Insight icon={Flag} title="Receita esperada × estimada">
          {result.goalGap >= 0 ? (
            <p>
              A receita estimada alcança a sua meta de {formatCurrency(plan.expectedRevenue)} por mês
              {plan.expectedRevenue > 0 && ` (${formatPercent((result.revenue / plan.expectedRevenue) * 100)} da meta)`}.
            </p>
          ) : (
            <p>
              Faltam <strong>{formatCurrency(-result.goalGap)} por mês</strong> para chegar à receita esperada de{' '}
              {formatCurrency(plan.expectedRevenue)}. Dá para ajustar o preço, a quantidade de vendas ou a meta.
            </p>
          )}
        </Insight>
      )}
    </ul>
  );
}

export function EducationalDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn('rounded-xl bg-slate-100 px-3 py-2 text-xs leading-relaxed text-slate-500', className)}>
      <strong className="text-slate-600">Simulação educacional.</strong> Estes números são estimativas feitas com os dados
      que você informou e não são projeções financeiras garantidas.
    </p>
  );
}
