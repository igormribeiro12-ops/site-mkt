import type { FinancePlan } from '../types';

export interface FinanceResult {
  /** Receita estimada por mês = preço × quantidade. */
  revenue: number;
  fixedCosts: number;
  variableCosts: number;
  adsCost: number;
  /** Custos totais por mês. */
  totalCosts: number;
  /** Resultado estimado por mês (lucro ou prejuízo). */
  result: number;
  /** Margem estimada em %; null quando não há receita. */
  margin: number | null;
  /** Vendas por mês necessárias para cobrir os custos; null se o preço não cobre o custo unitário. */
  breakEvenUnits: number | null;
  /** Meses para recuperar o investimento inicial; null se o resultado não é positivo. */
  paybackMonths: number | null;
  /** Diferença entre a receita estimada e a receita esperada (meta). */
  goalGap: number | null;
}

/** Calcula os indicadores. Retorna null enquanto faltarem dados essenciais. */
export function computeFinance(plan: FinancePlan, adBudget: number | null): FinanceResult | null {
  const { price, monthlySales, monthlyCosts } = plan;
  if (price === null || monthlySales === null || monthlyCosts === null) return null;

  const unitCost = plan.unitCost ?? 0;
  const revenue = price * monthlySales;
  const fixedCosts = monthlyCosts;
  const variableCosts = unitCost * monthlySales;
  const adsCost = plan.includeAds ? (adBudget ?? 0) : 0;
  const totalCosts = fixedCosts + variableCosts + adsCost;
  const result = revenue - totalCosts;
  const margin = revenue > 0 ? (result / revenue) * 100 : null;

  const contribution = price - unitCost;
  const breakEvenUnits = contribution > 0 ? Math.ceil((fixedCosts + adsCost) / contribution) : null;

  const investment = plan.initialInvestment ?? 0;
  let paybackMonths: number | null = null;
  if (investment === 0) paybackMonths = 0;
  else if (result > 0) paybackMonths = investment / result;

  const goalGap = plan.expectedRevenue !== null ? revenue - plan.expectedRevenue : null;

  return {
    revenue,
    fixedCosts,
    variableCosts,
    adsCost,
    totalCosts,
    result,
    margin,
    breakEvenUnits,
    paybackMonths,
    goalGap,
  };
}

/** Saldo acumulado mês a mês, começando pelo investimento inicial negativo. */
export function cumulativeProjection(
  plan: FinancePlan,
  result: FinanceResult,
  months = 12,
): { month: number; balance: number }[] {
  const investment = plan.initialInvestment ?? 0;
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    balance: -investment + result.result * (i + 1),
  }));
}
