// Motor de simulação do STARTUP TYCOON.
// Todas as fórmulas ficam aqui e são determinísticas: os resultados dependem
// das decisões do jogador. A única variação é uma oscilação de mercado de ±5%
// sorteada com a semente da partida (o mesmo mês sempre dá o mesmo resultado).

import {
  INFRA,
  NEW_UNIT_RENT,
  ROLES,
  SCOPES,
  TAX_RATE,
  TOOLS_COST,
  getChannel,
  getDifficulty,
  getObjective,
  getSegment,
  qualityExpectation,
} from './data';
import { clamp } from './format';
import { rngFor } from './rng';
import type {
  Campaign,
  CampaignResult,
  ChannelId,
  CostBreakdown,
  GameState,
  ModifierKind,
  MonthReport,
  ObjectiveId,
} from './types';

export function modifierTotal(state: GameState, kind: ModifierKind): number {
  return state.modifiers.filter((m) => m.kind === kind).reduce((sum, m) => sum + m.value, 0);
}

export function employeeCount(state: GameState): number {
  return Object.values(state.employees).reduce((a, b) => a + b, 0);
}

export function totalDebt(state: GameState): number {
  const loans = state.loans.reduce((sum, l) => sum + l.balance, 0);
  return loans + Math.max(0, -state.cash);
}

export function marketSize(state: GameState, month = state.month): number {
  const seg = getSegment(state.company.segment);
  const diff = getDifficulty(state.player.difficulty);
  const scope = SCOPES[state.scopeLevel].multiplier;
  const units = 1 + 0.25 * (state.units - 1);
  const growth = (1 + seg.trend) ** (month - 1);
  return seg.baseDemand * scope * units * growth * diff.demandMult * (1 + modifierTotal(state, 'demand'));
}

/** A capacidade é medida em vendas: produtos baratos saem em volume maior que produtos caros. */
export function capacityFactor(refPrice: number): number {
  return clamp(60 / refPrice, 0.35, 2.5);
}

export function capacity(state: GameState): number {
  const base = INFRA[state.infraLevel].capacity * capacityFactor(getSegment(state.company.segment).refPrice);
  return Math.round(
    base * (1 + 0.6 * (state.units - 1)) * (1 + 0.15 * state.employees.gerente) * (1 + modifierTotal(state, 'capacity')),
  );
}

export function ticketMultiplier(state: GameState): number {
  return 1 + 0.15 * (state.productLines - 1);
}

export function unitCost(state: GameState): number {
  const seg = getSegment(state.company.segment);
  return (
    seg.refPrice *
    seg.unitCostRatio *
    (0.75 + (0.5 * state.quality) / 100) *
    (1 - 0.04 * state.infraLevel) *
    (1 - 0.03 * state.employees.desenvolvedor) *
    (1 + modifierTotal(state, 'unitCost'))
  );
}

/** Preço praticado no mês (considera promoções temporárias de eventos). */
export function effectivePrice(state: GameState): number {
  return state.price * (1 + modifierTotal(state, 'price'));
}

export function competitionLevel(state: GameState): number {
  const seg = getSegment(state.company.segment);
  return clamp(seg.competition + state.scopeLevel * 5 + modifierTotal(state, 'competition') * 100, 0, 100);
}

export interface OfferBreakdown {
  priceIndex: number;
  price: number;
  quality: number;
  reputation: number;
  competition: number;
  score: number;
}

/** Atratividade da oferta: preço, qualidade, reputação e concorrência. */
export function offer(state: GameState): OfferBreakdown {
  const seg = getSegment(state.company.segment);
  const priceIndex = effectivePrice(state) / seg.refPrice;
  const k = 1.6 - seg.purchasingPower / 100;
  let price = clamp(1 - k * (priceIndex - 1), 0.25, 1.5);
  if (priceIndex < 0.65) price *= 0.9; // preço baixo demais gera desconfiança
  const quality = 0.5 + 0.5 * clamp(state.quality / qualityExpectation(seg), 0, 1.4);
  const reputation = 0.6 + (0.6 * state.reputation) / 100;
  const competition = 1 - (competitionLevel(state) / 100) * 0.45;
  const score = price * quality * reputation * competition * (1 + modifierTotal(state, 'conversion'));
  return { priceIndex, price, quality, reputation, competition, score };
}

/** Clientes de produtos caros convertem menos que os de produtos baratos. */
function priceConversionFactor(refPrice: number): number {
  return 40 / refPrice;
}

function awarenessConversion(state: GameState): number {
  return 0.8 + (0.4 * state.awareness) / 100;
}

/** Investimentos acima do ponto de saturação rendem cada vez menos. */
export function effectiveBudget(budget: number, size: number): number {
  const saturation = Math.max(300, size * 0.6);
  if (budget <= saturation) return budget;
  return saturation + saturation * Math.log(1 + (budget - saturation) / saturation);
}

export interface CampaignEstimate {
  reach: number;
  followers: number;
  leads: number;
  customers: number;
  awareness: number;
  organicVisitors: number;
  cac: number | null;
}

/** Resultado esperado de uma campanha (sem a oscilação do mercado). */
export function estimateCampaign(
  state: GameState,
  channelId: ChannelId,
  objectiveId: ObjectiveId,
  budget: number,
): CampaignEstimate {
  const seg = getSegment(state.company.segment);
  const ch = getChannel(channelId);
  const obj = getObjective(objectiveId);
  const size = marketSize(state);
  const o = offer(state);
  const eff = effectiveBudget(budget, size);
  const marketer = 1 + 0.2 * state.employees.marketing;
  const social = ch.social ? 1 + modifierTotal(state, 'socialReach') : 1;
  let reach = (eff / 100) * ch.reachPer100 * seg.affinity[channelId] * obj.reach * marketer * social;
  if (ch.baseLimited) {
    const base = state.followers + state.customersTotal + state.leads;
    reach = Math.min(reach, base);
  }
  const customers =
    reach *
    ch.conversion *
    obj.conversion *
    o.score *
    priceConversionFactor(seg.refPrice) *
    awarenessConversion(state) *
    (1 + 0.05 * state.employees.vendedor);
  const followers = reach * ch.followRate * obj.follow * (0.6 + 0.4 * o.quality);
  const leads = reach * ch.leadRate * obj.lead * 0.5;
  const awareness = Math.min(8, (reach / Math.max(1, size)) * obj.awareness * 0.6);
  const organicVisitors = ch.buildsOrganic ? (eff / 100) * 120 : 0;
  return {
    reach,
    followers,
    leads,
    customers,
    awareness,
    organicVisitors,
    cac: customers >= 1 ? budget / customers : null,
  };
}

export function isCampaignRunnable(state: GameState, campaign: Campaign): boolean {
  const ch = getChannel(campaign.channel);
  return campaign.active && campaign.budget >= ch.minBudget && state.level >= ch.unlockLevel;
}

export function monthlySalaries(state: GameState): number {
  return ROLES.reduce((sum, r) => sum + r.salary * state.employees[r.id], 0) * (1 + state.salaryBonus);
}

export interface PlannedCosts {
  rent: number;
  tools: number;
  salaries: number;
  marketing: number;
  loan: number;
  overdraftInterest: number;
  total: number;
}

/** Gastos já comprometidos para o mês atual (antes das vendas). */
export function plannedCosts(state: GameState): PlannedCosts {
  const diff = getDifficulty(state.player.difficulty);
  const fixedMod = (1 + modifierTotal(state, 'fixedCost')) * (1 - 0.08 * state.employees.gerente);
  const rent = (INFRA[state.infraLevel].rent + NEW_UNIT_RENT * (state.units - 1)) * fixedMod;
  const tools = (TOOLS_COST + 120 * (state.productLines - 1)) * fixedMod;
  const salaries = monthlySalaries(state);
  const marketing = state.campaigns.filter((c) => isCampaignRunnable(state, c)).reduce((s, c) => s + c.budget, 0);
  const loan = state.loans.reduce((s, l) => s + l.monthlyPayment, 0);
  const overdraftInterest = state.cash < 0 ? -state.cash * diff.overdraftInterest : 0;
  return { rent, tools, salaries, marketing, loan, overdraftInterest, total: rent + tools + salaries + marketing + loan + overdraftInterest };
}

export interface SimulationOptions {
  /** Desliga a oscilação de mercado (usado nas projeções). */
  noNoise?: boolean;
}

export interface SimulationResult {
  state: GameState;
  report: Omit<MonthReport, 'insights' | 'concept' | 'achievements' | 'levelUp'>;
}

/** Simula um mês completo de operação e devolve o novo estado e o relatório. */
export function simulateMonth(state: GameState, options: SimulationOptions = {}): SimulationResult {
  const seg = getSegment(state.company.segment);
  const diff = getDifficulty(state.player.difficulty);
  const rng = rngFor(state.seed, state.month, 1);
  const noise = options.noNoise ? 1 : 0.95 + rng() * 0.1;
  const noise2 = options.noNoise ? 1 : 0.95 + rng() * 0.1;

  const size = marketSize(state);
  const o = offer(state);
  const pcf = priceConversionFactor(seg.refPrice);
  const marketers = state.employees.marketing;
  const sellers = state.employees.vendedor;
  const socialMod = 1 + modifierTotal(state, 'socialReach');

  // --- Campanhas -----------------------------------------------------------
  const running = state.campaigns.filter((c) => isCampaignRunnable(state, c));
  let seoScore = state.seoScore * 0.97;
  let whatsappReach = 0;
  const raw = running.map((c) => {
    const est = estimateCampaign(state, c.channel, c.objective, c.budget);
    seoScore += est.organicVisitors;
    if (c.channel === 'whatsapp') whatsappReach += est.reach;
    return { campaign: c, est };
  });

  // --- Fontes orgânicas e leads -------------------------------------------
  const organicVisitors =
    size * (state.awareness / 100) * 0.12 + state.followers * 0.08 * (1 + 0.15 * marketers) * socialMod + state.seoScore;
  const organicNewRaw = organicVisitors * 0.02 * o.score * pcf;
  const leadConv = clamp((0.1 + 0.06 * sellers) * o.score, 0, 0.5);
  const leadNewRaw = state.leads * leadConv;
  const campaignNewRaw = raw.reduce((s, r) => s + r.est.customers, 0);

  const rawNew = (campaignNewRaw + organicNewRaw + leadNewRaw) * noise;
  // Saturação: o mercado não absorve infinitos clientes novos por mês.
  const newCustomersDemand = rawNew / (1 + rawNew / (0.18 * size));
  const satFactor = rawNew > 0 ? newCustomersDemand / rawNew : 0;

  // --- Recompra -----------------------------------------------------------
  const whatsappBoost = state.activeCustomers > 0 ? 0.15 * Math.min(1, whatsappReach / state.activeCustomers) : 0;
  const returning =
    state.activeCustomers * seg.repeatRate * clamp(state.satisfaction / 70, 0.4, 1.3) * (1 + whatsappBoost) * noise2;

  // --- Capacidade e vendas --------------------------------------------------
  const cap = capacity(state);
  const orders = newCustomersDemand + returning;
  const unitsSold = Math.min(orders, cap);
  const fulfillment = orders > 0 ? unitsSold / orders : 1;
  const unmet = orders - unitsSold;
  const newServed = newCustomersDemand * fulfillment;

  const tMult = ticketMultiplier(state);
  const ticket = effectivePrice(state) * tMult;
  const revenue = unitsSold * ticket;
  const uCost = unitCost(state);

  // --- Atendimento e satisfação --------------------------------------------
  // Atendimento medido em vendas: cada pessoa atende ~R$ 11 mil/mês em vendas; parte é automatizada pela estrutura.
  const serviceCap =
    (80 + 180 * state.employees.atendente + 40 * sellers + 60 * state.employees.gerente) * capacityFactor(seg.refPrice) + 0.3 * cap;
  const serviceRatio = unitsSold > 0 ? clamp(serviceCap / unitsSold, 0, 1) : 1;
  // Qualidade igual à esperada pelo mercado = 0,5; 30 pontos acima = 1.
  const q = clamp((state.quality - qualityExpectation(seg) + 30) / 60, 0, 1);
  // Preço igual à média = 0,5; mais barato agrada, mais caro desagrada.
  const p = clamp(1.5 - o.priceIndex, 0, 1);
  const target = 100 * (0.4 * q + 0.25 * serviceRatio + 0.2 * p + 0.15 * fulfillment);
  const satisfaction = orders >= 1 ? clamp(state.satisfaction + (target - state.satisfaction) * 0.5, 0, 100) : state.satisfaction;

  // --- Resultados das campanhas --------------------------------------------
  const campaigns: CampaignResult[] = raw.map(({ campaign, est }) => {
    const customers = est.customers * noise * satFactor * fulfillment;
    const rev = customers * ticket;
    const contribution = rev - customers * uCost * tMult - campaign.budget;
    return {
      campaignId: campaign.id,
      channel: campaign.channel,
      objective: campaign.objective,
      budget: campaign.budget,
      reach: est.reach,
      followers: est.followers,
      leads: est.leads,
      customers,
      revenue: rev,
      contribution,
      cac: customers >= 1 ? campaign.budget / customers : null,
      roi: campaign.budget > 0 ? contribution / campaign.budget : 0,
    };
  });

  const followersFromCampaigns = raw.reduce((s, r) => s + r.est.followers, 0);
  const leadsFromCampaigns = raw.reduce((s, r) => s + r.est.leads, 0);
  const awarenessGain = raw.reduce((s, r) => s + r.est.awareness, 0);
  const reach = raw.reduce((s, r) => s + r.est.reach, 0) + organicVisitors;

  // --- Custos --------------------------------------------------------------
  const planned = plannedCosts(state);
  let loanInterest = 0;
  let principalPaid = 0;
  const loans = state.loans
    .map((loan) => {
      const interest = loan.balance * diff.loanInterest;
      const principal = Math.min(loan.balance, loan.monthlyPayment - interest);
      loanInterest += interest;
      principalPaid += principal;
      return { ...loan, balance: Math.max(0, loan.balance - principal), monthsLeft: loan.monthsLeft - 1 };
    })
    .filter((l) => l.monthsLeft > 0 && l.balance > 0.5);

  const costs: CostBreakdown = {
    variable: unitsSold * uCost * tMult,
    salaries: planned.salaries,
    rent: planned.rent,
    tools: planned.tools,
    marketing: planned.marketing,
    taxes: revenue * TAX_RATE,
    interest: loanInterest + planned.overdraftInterest,
    loan: principalPaid,
  };
  const totalCosts =
    costs.variable + costs.salaries + costs.rent + costs.tools + costs.marketing + costs.taxes + costs.interest;
  const profit = revenue - totalCosts;
  const cashEnd = state.cash + profit - principalPaid;

  // --- Atualização do estado ------------------------------------------------
  const retention = clamp(0.55 + (satisfaction / 100) * 0.35, 0.5, 0.92);
  const activeCustomers = state.activeCustomers * retention + newServed;
  const followersGained = followersFromCampaigns + 250 * marketers * socialMod + newServed * 0.3;
  const followers = Math.max(0, state.followers * 0.99 + followersGained);
  const leads = Math.max(0, (state.leads - leadNewRaw * satFactor) * 0.6 + leadsFromCampaigns);
  const awareness = clamp(state.awareness * 0.88 + awarenessGain, 0, 100);
  const reputation = clamp(state.reputation + (satisfaction - 55) * 0.1 + Math.min(3, awarenessGain * 0.1), 0, 100);
  const quality = clamp(state.quality - 0.5 + 3 * state.employees.desenvolvedor, 20, 98);

  const modifiers = state.modifiers
    .map((m) => ({ ...m, monthsLeft: m.monthsLeft - 1 }))
    .filter((m) => m.monthsLeft > 0);

  const next: GameState = {
    ...state,
    cash: cashEnd,
    loans,
    satisfaction,
    reputation,
    awareness,
    followers,
    leads,
    quality,
    seoScore,
    activeCustomers,
    customersTotal: state.customersTotal + newServed,
    modifiers,
    totalRevenue: state.totalRevenue + revenue,
    totalExpenses: state.totalExpenses + totalCosts,
    totalMarketing: state.totalMarketing + costs.marketing,
    profitStreak: profit > 0 ? state.profitStreak + 1 : 0,
    negativeMonths: cashEnd < 0 ? state.negativeMonths + 1 : 0,
    month: state.month + 1,
    updatedAt: new Date().toISOString(),
  };

  const debt = loans.reduce((s, l) => s + l.balance, 0) + Math.max(0, -cashEnd);

  return {
    state: next,
    report: {
      month: state.month,
      marketSize: size,
      offerScore: o.score,
      reach,
      newCustomers: newServed,
      newFromCampaigns: campaignNewRaw * noise * satFactor * fulfillment,
      newFromOrganic: organicNewRaw * noise * satFactor * fulfillment,
      newFromLeads: leadNewRaw * noise * satFactor * fulfillment,
      returningOrders: returning * fulfillment,
      orders,
      unitsSold,
      unmetOrders: unmet,
      capacity: cap,
      revenue,
      ticket,
      conversionRate: reach > 0 ? newServed / reach : 0,
      activeCustomers,
      customersTotal: next.customersTotal,
      satisfaction,
      reputation,
      awareness,
      followers,
      followersGained,
      leads,
      serviceRatio,
      costs,
      totalCosts,
      profit,
      cashStart: state.cash,
      cashEnd,
      debt,
      marketShare: clamp(activeCustomers / size, 0, 1),
      campaigns,
    },
  };
}

/** Projeção do mês com as decisões atuais (sem oscilação nem eventos novos). */
export function projectMonth(state: GameState) {
  return simulateMonth(state, { noNoise: true }).report;
}

/** Valor estimado da empresa = 2× lucro anual + 0,5× receita anual + caixa − dívidas
 *  (lucro e receita anuais projetados pela média dos últimos 3 meses). */
export function valuation(state: GameState): number {
  const recent = state.history.slice(-3);
  const avgProfit = recent.length ? recent.reduce((s, r) => s + r.profit, 0) / recent.length : 0;
  const avgRevenue = recent.length ? recent.reduce((s, r) => s + r.revenue, 0) / recent.length : 0;
  const value = Math.max(0, avgProfit) * 12 * 2 + avgRevenue * 12 * 0.5 + state.cash - totalDebt(state);
  return Math.max(0, value);
}
