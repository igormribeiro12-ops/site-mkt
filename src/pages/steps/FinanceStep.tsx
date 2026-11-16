import { BookOpenText, ChartColumn, Coins, Info, ShoppingCart } from 'lucide-react';
import { CumulativeChart } from '../../components/finance/CumulativeChart';
import { EducationalDisclaimer, FinanceInsights, FinanceKpis } from '../../components/finance/FinanceSummary';
import { StepFooter, StepHeader, useStepForm } from '../../components/layout/StepLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Callout, EmptyState } from '../../components/ui/Feedback';
import { NumberField } from '../../components/ui/Field';
import { useProject } from '../../context/ProjectContext';
import { computeFinance, cumulativeProjection } from '../../lib/finance';
import { formatCurrency } from '../../lib/format';

const GLOSSARY = [
  { term: 'Receita', text: 'Todo o dinheiro que entra com as vendas (preço × quantidade).' },
  { term: 'Custos', text: 'Tudo o que a empresa gasta para funcionar: aluguel, materiais, internet, anúncios…' },
  { term: 'Resultado', text: 'Receita menos custos. Se for positivo é lucro; se for negativo, prejuízo.' },
  { term: 'Margem', text: 'Quanto do valor vendido vira lucro, em porcentagem.' },
  { term: 'Ponto de equilíbrio', text: 'Quantidade mínima de vendas para não ter prejuízo.' },
];

export function FinanceStep() {
  const { project, updateFinance } = useProject();
  const { errors, allErrors, showErrors, submit } = useStepForm('financeiro');
  const f = project.finance;
  const adBudget = project.marketing.adBudget;
  const result = computeFinance(f, adBudget);
  const projection = result ? cumulativeProjection(f, result) : [];
  const products = project.products;
  const averagePrice = products.length
    ? Math.round((products.reduce((sum, p) => sum + p.price, 0) / products.length) * 100) / 100
    : null;

  return (
    <div>
      <StepHeader stepId="financeiro">
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <p>
            <strong>Esta é uma simulação educacional.</strong> Os cálculos ajudam a entender como uma empresa funciona,
            mas não são projeções financeiras garantidas. Na vida real, os números mudam e precisam ser acompanhados.
          </p>
        </div>
      </StepHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card className="min-w-0 animate-fade-up xl:self-start">
          <CardHeader icon={Coins} title="Seus números" description="Valores por mês, exceto o investimento inicial." />
          <div className="space-y-5">
            <NumberField
              id="fin-investment"
              label="Investimento inicial"
              required
              prefix="R$"
              placeholder="0,00"
              value={f.initialInvestment}
              hint="Quanto precisa gastar para abrir a empresa (equipamentos, estoque inicial…)."
              error={errors.initialInvestment}
              onValueChange={(initialInvestment) => updateFinance({ initialInvestment })}
            />
            <NumberField
              id="fin-costs"
              label="Custos mensais"
              required
              prefix="R$"
              suffix="/mês"
              placeholder="0,00"
              value={f.monthlyCosts}
              hint="Gastos fixos de todo mês: aluguel, internet, embalagens, salários…"
              error={errors.monthlyCosts}
              onValueChange={(monthlyCosts) => updateFinance({ monthlyCosts })}
            />
            <div>
              <NumberField
                id="fin-price"
                label="Preço de venda"
                required
                prefix="R$"
                placeholder="0,00"
                value={f.price}
                hint="Preço médio de cada venda."
                error={errors.price}
                onValueChange={(price) => updateFinance({ price })}
              />
              {averagePrice !== null && averagePrice > 0 && f.price !== averagePrice && (
                <Button
                  variant="soft"
                  size="sm"
                  className="mt-2"
                  icon={<ShoppingCart className="size-4" aria-hidden />}
                  onClick={() => updateFinance({ price: averagePrice })}
                >
                  Usar o preço médio da vitrine ({formatCurrency(averagePrice)})
                </Button>
              )}
            </div>
            <NumberField
              id="fin-unit-cost"
              label="Custo de cada unidade vendida"
              prefix="R$"
              placeholder="0,00"
              value={f.unitCost}
              hint="Opcional: quanto custa produzir ou entregar cada item (ingredientes, frete…)."
              error={errors.unitCost}
              onValueChange={(unitCost) => updateFinance({ unitCost })}
            />
            <NumberField
              id="fin-sales"
              label="Quantidade estimada de vendas"
              required
              integer
              suffix="por mês"
              placeholder="0"
              value={f.monthlySales}
              error={errors.monthlySales}
              onValueChange={(monthlySales) => updateFinance({ monthlySales })}
            />
            <NumberField
              id="fin-expected"
              label="Receita esperada"
              required
              prefix="R$"
              suffix="/mês"
              placeholder="0,00"
              value={f.expectedRevenue}
              hint="Quanto você gostaria de faturar por mês? Vamos comparar com a estimativa."
              error={errors.expectedRevenue}
              onValueChange={(expectedRevenue) => updateFinance({ expectedRevenue })}
            />
            {adBudget !== null && adBudget > 0 && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <input
                  type="checkbox"
                  checked={f.includeAds}
                  onChange={(e) => updateFinance({ includeAds: e.target.checked })}
                  className="mt-0.5 size-4 rounded accent-violet-600"
                />
                <span className="text-sm text-slate-600">
                  <strong className="text-slate-800">Somar os anúncios aos custos</strong>
                  <br />
                  Na etapa de marketing você planejou investir {formatCurrency(adBudget)} por mês em anúncios.
                </span>
              </label>
            )}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="animate-fade-up">
            <CardHeader icon={ChartColumn} title="Resultado da simulação" description="Calculado automaticamente enquanto você digita." />
            {result ? (
              <div className="space-y-6">
                <FinanceKpis result={result} plan={f} adBudget={adBudget} />
                <FinanceInsights result={result} plan={f} />
                <div className="border-t border-slate-100 pt-5">
                  <p className="mb-1 text-sm font-bold text-slate-800">Saldo acumulado em 12 meses</p>
                  <p className="mb-4 text-xs text-slate-500">
                    Começa negativo pelo investimento inicial e soma o resultado de cada mês.
                  </p>
                  <CumulativeChart data={projection} />
                </div>
                <EducationalDisclaimer />
              </div>
            ) : (
              <EmptyState
                icon={ChartColumn}
                title="Preencha os seus números"
                description="Informe pelo menos os custos mensais, o preço de venda e a quantidade de vendas para ver os cálculos."
              />
            )}
          </Card>

          <Card className="animate-fade-up">
            <CardHeader icon={BookOpenText} title="Entenda os termos" />
            <dl className="grid gap-3 sm:grid-cols-2">
              {GLOSSARY.map((item) => (
                <div key={item.term} className="rounded-2xl bg-slate-50 p-3.5">
                  <dt className="text-sm font-bold text-slate-800">{item.term}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-slate-500">{item.text}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Callout>
            Lucro não é o mesmo que receita! Uma empresa pode vender muito e ainda assim ter prejuízo, se os custos forem
            maiores do que o dinheiro que entra.
          </Callout>
        </div>
      </div>

      <StepFooter stepId="financeiro" onContinue={submit} missingCount={Object.keys(allErrors).length} showErrors={showErrors} />
    </div>
  );
}
