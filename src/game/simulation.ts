// Motor de simulação do STARTUP TYCOON.
// Todas as fórmulas ficam aqui e são determinísticas: os resultados dependem
// das decisões do jogador. A única variação é uma oscilação de mercado de ±5%
// sorteada com a semente da partida.
//
// O jogo roda dia a dia (cada mês tem DAYS_PER_MONTH dias úteis). As fórmulas
// são escritas em "valores por mês" e cada dia aplica a fração correspondente,
// de modo que um mês de dias equivale a um mês da economia.

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
import { furnitureTotals } from './furniture';
import { rngFor } from './rng';
import type {
  Campaign,
  CampaignResult,
  ChannelId,
  CostBreakdown,
  DayResult,
  GameState,
  ModifierKind,
  MonthReport,
  ObjectiveId,
} from './types';

export const DAYS_PER_MONTH = 10;
const DT = 1 / DAYS_PER_MONTH;

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

export function furnitureEffects(state: GameState) {
  return furnitureTotals(state.world?.furniture ?? []);
}

function personality(state: GameState) {
  const p = state.avatar?.personality;
  return {
    reach: p === 'criativo' ? 1.1 : 1,
    conversion: p === 'negociador' ? 1.05 : 1,
    fixedCost: p === 'organizado' ? 0.9 : 1,
    quality: p === 'visionario' ? 1 : 0,
  };
}

/** Vendas possíveis por mês (estrutura + móveis + unidades + gerente). */
export function capacity(state: GameState): number {
  const factor = capacityFactor(getSegment(state.company.segment).refPrice);
  const base = (INFRA[state.infraLevel].capacity + furnitureEffects(state).capacity) * factor;
  return Math.round(base * (1 + 0.6 * (state.units - 1)) * (1 + 0.15 * state.employees.gerente) * (1 + modifierTotal(state, 'capacity')));
}

export function ticketMultiplier(state: GameState): number {
  return 1 + 0.15 * (state.productLines - 1);
}

/** Qualidade percebida: produto + equipamentos do escritório. */
export function effectiveQuality(state: GameState): number {
  return Math.min(100, state.quality + furnitureEffects(state).quality);
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
  const competitor = state.world?.competitorOpen ? 3 : 0;
  return clamp(seg.competition + state.scopeLevel * 5 + competitor + modifierTotal(state, 'competition') * 100, 0, 100);
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
  const quality = 0.5 + 0.5 * clamp(effectiveQuality(state) / qualityExpectation(seg), 0, 1.4);
  const reputation = 0.6 + (0.6 * state.reputation) / 100;
  const competition = 1 - (competitionLevel(state) / 100) * 0.45;
  const extras = (1 + furnitureEffects(state).conversion) * personality(state).conversion;
  const score = price * quality * reputation * competition * (1 + modifierTotal(state, 'conversion')) * extras;
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

/** Resultado esperado de uma campanha em um mês (sem a oscilação do mercado). */
export function estimateCampaign(state: GameState, channelId: ChannelId, objectiveId: ObjectiveId, budget: number): CampaignEstimate {
  const seg = getSegment(state.company.segment);
  const ch = getChannel(channelId);
  const obj = getObjective(objectiveId);
  const size = marketSize(state);
  const o = offer(state);
  const eff = effectiveBudget(budget, size);
  const marketer = 1 + 0.2 * state.employees.marketing;
  const social = ch.social ? 1 + modifierTotal(state, 'socialReach') : 1;
  let reach = (eff / 100) * ch.reachPer100 * seg.affinity[channelId] * obj.reach * marketer * social * personality(state).reach;
  if (ch.baseLimited) {
    const base = state.followers + state.customersTotal + state.leads;
    reach = Math.min(reach, base);
  }
  const customers =
    reach * ch.conversion * obj.conversion * o.score * priceConversionFactor(seg.refPrice) * awarenessConversion(state) * (1 + 0.05 * state.employees.vendedor);
  const followers = reach * ch.followRate * obj.follow * (0.6 + 0.4 * o.quality);
  const leads = reach * ch.leadRate * obj.lead * 0.5;
  const awareness = Math.min(8, (reach / Math.max(1, size)) * obj.awareness * 0.6);
  const organicVisitors = ch.buildsOrganic ? (eff / 100) * 120 : 0;
  return { reach, followers, leads, customers, awareness, organicVisitors, cac: customers >= 1 ? budget / customers : null };
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

/** Gastos mensais já comprometidos (antes das vendas). */
export function plannedCosts(state: GameState): PlannedCosts {
  const diff = getDifficulty(state.player.difficulty);
  const fixedMod = (1 + modifierTotal(state, 'fixedCost')) * (1 - 0.08 * state.employees.gerente) * personality(state).fixedCost;
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

const zeroCosts = (): CostBreakdown => ({ variable: 0, salaries: 0, rent: 0, tools: 0, marketing: 0, taxes: 0, interest: 0, loan: 0 });

/** Simula um dia útil. Não avança o calendário: isso é feito pelo motor do jogo. */
export function simulateDay(state: GameState, options: SimulationOptions = {}): { state: GameState; day: DayResult } {
  const seg = getSegment(state.company.segment);
  const diff = getDifficulty(state.player.difficulty);
  const rng = rngFor(state.seed, state.month * 100 + (state.world?.day ?? 1), 1);
  const noise = options.noNoise ? 1 : 0.95 + rng() * 0.1;
  const noise2 = options.noNoise ? 1 : 0.95 + rng() * 0.1;
  const work = state.world?.workHours ?? { desk: 0, counter: 0, production: 0 };
  const furn = furnitureEffects(state);
  const pers = personality(state);

  const size = marketSize(state);
  const o = offer(state);
  const pcf = priceConversionFactor(seg.refPrice);
  const marketers = state.employees.marketing;
  const sellers = state.employees.vendedor;
  const socialMod = 1 + modifierTotal(state, 'socialReach');

  // --- Campanhas (estimativas mensais, aplicadas na fração do dia) ----------
  const running = state.campaigns.filter((c) => isCampaignRunnable(state, c));
  let seoScore = state.seoScore * 0.97 ** DT;
  let whatsappReach = 0;
  const raw = running.map((c) => {
    const est = estimateCampaign(state, c.channel, c.objective, c.budget);
    seoScore += est.organicVisitors * DT;
    if (c.channel === 'whatsapp') whatsappReach += est.reach;
    return { campaign: c, est };
  });

  // --- Fontes orgânicas e leads (por mês) ----------------------------------
  const organicVisitors = size * (state.awareness / 100) * 0.12 + state.followers * 0.08 * (1 + 0.15 * marketers) * socialMod + state.seoScore;
  const organicNewRaw = organicVisitors * 0.02 * o.score * pcf;
  const leadConv = clamp((0.1 + 0.06 * sellers) * o.score, 0, 0.5);
  const leadNewRaw = state.leads * leadConv;
  const campaignNewRaw = raw.reduce((s, r) => s + r.est.customers, 0);

  const rawNew = (campaignNewRaw + organicNewRaw + leadNewRaw) * noise;
  // Saturação: o mercado não absorve infinitos clientes novos por mês.
  const newDemandMonthly = rawNew / (1 + rawNew / (0.18 * size));
  const satFactor = rawNew > 0 ? newDemandMonthly / rawNew : 0;
  const newDemand = newDemandMonthly * DT;

  // --- Recompra -------------------------------------------------------------
  const whatsappBoost = state.activeCustomers > 0 ? 0.15 * Math.min(1, whatsappReach / state.activeCustomers) : 0;
  const returning = state.activeCustomers * seg.repeatRate * clamp(state.satisfaction / 70, 0.4, 1.3) * (1 + whatsappBoost) * noise2 * DT;

  // --- Capacidade e vendas ----------------------------------------------------
  const monthlyCap = capacity(state);
  const cap = monthlyCap * DT * (1 + Math.min(0.2, 0.02 * work.production));
  const orders = newDemand + returning;
  const unitsSold = Math.min(orders, cap);
  const fulfillment = orders > 0 ? unitsSold / orders : 1;
  const unmet = orders - unitsSold;
  const newServed = newDemand * fulfillment;

  const tMult = ticketMultiplier(state);
  const ticket = effectivePrice(state) * tMult;
  const revenue = unitsSold * ticket;
  const uCost = unitCost(state);

  // --- Atendimento e satisfação ----------------------------------------------
  const factor = capacityFactor(seg.refPrice);
  const serviceCapMonthly = (80 + 180 * state.employees.atendente + 40 * sellers + 60 * state.employees.gerente) * factor + 0.3 * monthlyCap;
  const serviceRatio = unitsSold > 0 ? clamp((serviceCapMonthly * DT) / unitsSold, 0, 1) : 1;
  // Qualidade igual à esperada pelo mercado = 0,5; 30 pontos acima = 1.
  const q = clamp((effectiveQuality(state) - qualityExpectation(seg) + 30) / 60, 0, 1);
  // Preço igual à média = 0,5; mais barato agrada, mais caro desagrada.
  const p = clamp(1.5 - o.priceIndex, 0, 1);
  const target = clamp(100 * (0.4 * q + 0.25 * serviceRatio + 0.2 * p + 0.15 * fulfillment) + furn.satisfaction + Math.min(5, 0.5 * work.counter), 0, 100);
  const satisfaction = orders > 0.05 ? clamp(state.satisfaction + (target - state.satisfaction) * (1 - 0.5 ** DT), 0, 100) : state.satisfaction;

  // --- Resultados das campanhas no dia ---------------------------------------
  const campaigns: CampaignResult[] = raw.map(({ campaign, est }) => {
    const customers = est.customers * DT * noise * satFactor * fulfillment;
    const budget = campaign.budget * DT;
    const rev = customers * ticket;
    const contribution = rev - customers * uCost * tMult - budget;
    return {
      campaignId: campaign.id,
      channel: campaign.channel,
      objective: campaign.objective,
      budget,
      reach: est.reach * DT,
      followers: est.followers * DT,
      leads: est.leads * DT,
      customers,
      revenue: rev,
      contribution,
      cac: customers > 0 ? budget / customers : null,
      roi: budget > 0 ? contribution / budget : 0,
    };
  });

  const followersFromCampaigns = raw.reduce((s, r) => s + r.est.followers, 0) * DT;
  const leadsFromCampaigns = raw.reduce((s, r) => s + r.est.leads, 0) * DT;
  const awarenessMonthly = raw.reduce((s, r) => s + r.est.awareness, 0);
  const reach = (raw.reduce((s, r) => s + r.est.reach, 0) + organicVisitors) * DT;

  // --- Custos do dia ------------------------------------------------------------
  const planned = plannedCosts(state);
  const costs: CostBreakdown = {
    ...zeroCosts(),
    variable: unitsSold * uCost * tMult,
    salaries: planned.salaries * DT,
    rent: planned.rent * DT,
    tools: planned.tools * DT,
    marketing: planned.marketing * DT,
    taxes: revenue * TAX_RATE,
    interest: state.cash < 0 ? -state.cash * diff.overdraftInterest * DT : 0,
  };
  const totalCosts = costs.variable + costs.salaries + costs.rent + costs.tools + costs.marketing + costs.taxes + costs.interest;
  const profit = revenue - totalCosts;

  // --- Atualização do estado ------------------------------------------------------
  const retention = clamp(0.55 + (satisfaction / 100) * 0.35, 0.5, 0.92);
  const leadsConverted = leadNewRaw * DT * noise * satFactor;
  const followersGained = followersFromCampaigns + 250 * marketers * socialMod * DT + newServed * 0.3;
  const next: GameState = {
    ...state,
    cash: state.cash + profit,
    satisfaction,
    reputation: clamp(state.reputation + ((satisfaction - 55) * 0.1 + Math.min(3, awarenessMonthly * 0.1)) * DT, 0, 100),
    awareness: clamp(state.awareness * 0.88 ** DT + awarenessMonthly * DT, 0, 100),
    followers: Math.max(0, state.followers * 0.99 ** DT + followersGained),
    leads: Math.max(0, (state.leads - leadsConverted) * 0.6 ** DT + leadsFromCampaigns),
    quality: clamp(state.quality + (-0.5 + 3 * state.employees.desenvolvedor + pers.quality) * DT + 0.04 * work.desk, 20, 98),
    seoScore,
    activeCustomers: state.activeCustomers * retention ** DT + newServed,
    customersTotal: state.customersTotal + newServed,
    totalRevenue: state.totalRevenue + revenue,
    totalExpenses: state.totalExpenses + totalCosts,
    totalMarketing: state.totalMarketing + costs.marketing,
    world: state.world ? { ...state.world, workHours: { desk: 0, counter: 0, production: 0 } } : state.world,
  };

  return {
    state: next,
    day: {
      revenue,
      unitsSold,
      orders,
      unmetOrders: unmet,
      newCustomers: newServed,
      newFromCampaigns: campaignNewRaw * DT * noise * satFactor * fulfillment,
      newFromOrganic: organicNewRaw * DT * noise * satFactor * fulfillment,
      newFromLeads: leadNewRaw * DT * noise * satFactor * fulfillment,
      returningOrders: returning * fulfillment,
      reach,
      followersGained,
      capacity: cap,
      costs,
      totalCosts,
      profit,
      serviceWeighted: serviceRatio * unitsSold,
      campaigns,
    },
  };
}

/** Soma o resultado de um dia ao acumulado do mês. */
export function addDay(acc: DayResult | null, d: DayResult): DayResult {
  if (!acc) return { ...d, costs: { ...d.costs }, campaigns: d.campaigns.map((c) => ({ ...c })) };
  const costs = { ...acc.costs };
  (Object.keys(costs) as (keyof CostBreakdown)[]).forEach((k) => (costs[k] += d.costs[k]));
  const campaigns = acc.campaigns.map((c) => ({ ...c }));
  for (const c of d.campaigns) {
    const found = campaigns.find((x) => x.campaignId === c.campaignId);
    if (!found) campaigns.push({ ...c });
    else {
      found.budget += c.budget;
      found.reach += c.reach;
      found.followers += c.followers;
      found.leads += c.leads;
      found.customers += c.customers;
      found.revenue += c.revenue;
      found.contribution += c.contribution;
    }
  }
  for (const c of campaigns) {
    c.cac = c.customers >= 1 ? c.budget / c.customers : null;
    c.roi = c.budget > 0 ? c.contribution / c.budget : 0;
  }
  return {
    revenue: acc.revenue + d.revenue,
    unitsSold: acc.unitsSold + d.unitsSold,
    orders: acc.orders + d.orders,
    unmetOrders: acc.unmetOrders + d.unmetOrders,
    newCustomers: acc.newCustomers + d.newCustomers,
    newFromCampaigns: acc.newFromCampaigns + d.newFromCampaigns,
    newFromOrganic: acc.newFromOrganic + d.newFromOrganic,
    newFromLeads: acc.newFromLeads + d.newFromLeads,
    returningOrders: acc.returningOrders + d.returningOrders,
    reach: acc.reach + d.reach,
    followersGained: acc.followersGained + d.followersGained,
    capacity: acc.capacity + d.capacity,
    costs,
    totalCosts: acc.totalCosts + d.totalCosts,
    profit: acc.profit + d.profit,
    serviceWeighted: acc.serviceWeighted + d.serviceWeighted,
    campaigns,
  };
}

export type BaseReport = Omit<MonthReport, 'insights' | 'concept' | 'achievements' | 'levelUp'>;

/** Fecha o mês: parcelas de empréstimos, efeitos temporários e relatório. */
export function closeMonth(state: GameState, acc: DayResult, cashStart: number): { state: GameState; report: BaseReport } {
  const diff = getDifficulty(state.player.difficulty);
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

  const costs = { ...acc.costs, interest: acc.costs.interest + loanInterest, loan: principalPaid };
  const totalCosts = acc.totalCosts + loanInterest;
  const profit = acc.profit - loanInterest;
  const cashEnd = state.cash - loanInterest - principalPaid;
  const size = marketSize(state);
  const o = offer(state);

  const modifiers = state.modifiers.map((m) => ({ ...m, monthsLeft: m.monthsLeft - 1 })).filter((m) => m.monthsLeft > 0);

  const next: GameState = {
    ...state,
    cash: cashEnd,
    loans,
    modifiers,
    totalExpenses: state.totalExpenses + loanInterest,
    profitStreak: profit > 0 ? state.profitStreak + 1 : 0,
    negativeMonths: cashEnd < 0 ? state.negativeMonths + 1 : 0,
    month: state.month + 1,
    updatedAt: new Date().toISOString(),
    world: state.world ? { ...state.world, monthAcc: null, monthCashStart: cashEnd, day: 1 } : state.world,
  };
  const debt = loans.reduce((s, l) => s + l.balance, 0) + Math.max(0, -cashEnd);

  return {
    state: next,
    report: {
      month: state.month,
      marketSize: size,
      offerScore: o.score,
      reach: acc.reach,
      newCustomers: acc.newCustomers,
      newFromCampaigns: acc.newFromCampaigns,
      newFromOrganic: acc.newFromOrganic,
      newFromLeads: acc.newFromLeads,
      returningOrders: acc.returningOrders,
      orders: acc.orders,
      unitsSold: acc.unitsSold,
      unmetOrders: acc.unmetOrders,
      capacity: acc.capacity,
      revenue: acc.revenue,
      ticket: acc.unitsSold > 0 ? acc.revenue / acc.unitsSold : effectivePrice(state) * ticketMultiplier(state),
      conversionRate: acc.reach > 0 ? acc.newCustomers / acc.reach : 0,
      activeCustomers: state.activeCustomers,
      customersTotal: state.customersTotal,
      satisfaction: state.satisfaction,
      reputation: state.reputation,
      awareness: state.awareness,
      followers: state.followers,
      followersGained: acc.followersGained,
      leads: state.leads,
      serviceRatio: acc.unitsSold > 0 ? acc.serviceWeighted / acc.unitsSold : 1,
      costs,
      totalCosts,
      profit,
      cashStart,
      cashEnd,
      debt,
      marketShare: clamp(state.activeCustomers / size, 0, 1),
      campaigns: acc.campaigns,
    },
  };
}

export interface SimulationResult {
  state: GameState;
  report: BaseReport;
}

/** Simula um mês completo (todos os dias + fechamento). Usado nos testes e projeções. */
export function simulateMonth(state: GameState, options: SimulationOptions = {}): SimulationResult {
  const cashStart = state.cash;
  let s = state;
  let acc: DayResult | null = null;
  for (let d = 1; d <= DAYS_PER_MONTH; d++) {
    if (s.world) s = { ...s, world: { ...s.world, day: d } };
    const r = simulateDay(s, options);
    s = r.state;
    acc = addDay(acc, r.day);
  }
  return closeMonth(s, acc!, cashStart);
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
