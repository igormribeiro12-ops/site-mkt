// Jogadores automáticos usados para testar o equilíbrio da simulação.

import {
  CHANNELS,
  INFRA,
  MONTH_LIMIT,
  SCOPES,
  getRole,
  getSegment,
  productLaunchCost,
  qualityExpectation,
} from '../game/data';
import {
  DEFAULT_AVATAR,
  advanceMonth,
  createGame,
  expandScope,
  hire,
  investRD,
  launchProduct,
  loanLimit,
  newUnitCost,
  openUnit,
  resolveEvent,
  saveCampaign,
  takeLoan,
  upgradeInfra,
  type ActionResult,
} from '../game/engine';
import { choiceCost, getEvent, isChoiceAvailable } from '../game/events';
import { capacity } from '../game/simulation';
import type { DifficultyId, GameState, SegmentId, SetupDraft } from '../game/types';

export type Strategy = (s: GameState) => GameState;

function apply(s: GameState, r: ActionResult): GameState {
  return r.ok ? r.state : s;
}

export function draft(segment: SegmentId, difficulty: DifficultyId = 'normal', overrides: Partial<SetupDraft> = {}): SetupDraft {
  return {
    step: 6,
    avatar: { ...DEFAULT_AVATAR },
    playerName: 'Bot',
    difficulty,
    segment,
    name: 'Empresa Teste',
    slogan: 'Teste',
    description: 'Empresa criada para testes',
    product: 'Produto',
    differential: 'Diferencial',
    logo: { primary: '#2563eb', secondary: '#7c3aed', icon: 'rocket', shape: 'rounded', font: 'grotesk', layout: 'horizontal' },
    designPackage: 'freelancer',
    structure: 'home',
    productTier: 'bom',
    price: getSegment(segment).refPrice,
    ...overrides,
  };
}

/** Escolhe a opção de evento mais barata que não seja "não fazer nada" quando há caixa. */
function handleEvent(s: GameState): GameState {
  if (!s.pendingEvent) return s;
  const ev = getEvent(s.pendingEvent.eventId)!;
  const available = ev.choices.filter((c) => isChoiceAvailable(s, c));
  const affordable = available.filter((c) => choiceCost(s, c) <= s.cash * 0.15);
  const pick = (affordable.find((c) => choiceCost(s, c) > 0) ?? affordable[0] ?? available[available.length - 1])!;
  const r = resolveEvent(s, pick.id);
  return r.ok ? r.state : { ...s, pendingEvent: null };
}

export const passive: Strategy = (s) => s;

export const reckless: Strategy = (s) => {
  if (s.campaigns.length === 0) {
    s = apply(s, saveCampaign(s, { channel: 'instagram', objective: 'awareness', budget: 3000 }));
    s = apply(s, saveCampaign(s, { channel: 'facebook', objective: 'awareness', budget: 2000 }));
  }
  if (s.employees.atendente < 2) s = apply(s, hire(s, 'atendente'));
  if (s.employees.vendedor < 2) s = apply(s, hire(s, 'vendedor'));
  return s;
};

/** Estratégia simples de iniciante: um canal fixo e reação básica à falta de capacidade. */
export const novice: Strategy = (s) => {
  const last = s.history[s.history.length - 1];
  if (s.campaigns.length === 0) s = apply(s, saveCampaign(s, { channel: 'instagram', objective: 'sales', budget: 400 }));
  if (last && last.unmetOrders > 0) {
    const nextInfra = INFRA[s.infraLevel + 1];
    if (nextInfra && s.cash > nextInfra.upgradeCost * 1.2) s = apply(s, upgradeInfra(s));
  }
  if (last && last.serviceRatio < 0.7 && s.cash > 6000 && s.employees.atendente < 3) s = apply(s, hire(s, 'atendente'));
  if (last && last.profit > 1500 && s.campaigns[0] && s.campaigns[0].budget < 2000) {
    s = { ...s, campaigns: s.campaigns.map((c, i) => (i === 0 ? { ...c, budget: c.budget + 200 } : c)) };
  }
  return s;
};

export const balanced: Strategy = (s) => {
  const seg = getSegment(s.company.segment);
  const last = s.history[s.history.length - 1];
  const monthlyRevenue = last?.revenue ?? 0;

  // Mantém o preço na média do mercado (desfaz cortes feitos em eventos).
  if (s.price < seg.refPrice) s = { ...s, price: seg.refPrice };

  // 0. Sem caixa para investir, pega um empréstimo pequeno (uma vez).
  if (s.cash < 1500 && s.loans.length === 0 && loanLimit(s) >= 3000 && s.month <= 12) s = apply(s, takeLoan(s, 3000));

  // 1. Capacidade
  const cap = capacity(s);
  const nextInfra = INFRA[s.infraLevel + 1];
  if (last && last.orders > cap * 0.85) {
    if (nextInfra && s.cash > nextInfra.upgradeCost * 1.4) s = apply(s, upgradeInfra(s));
    else if (!nextInfra && s.cash > newUnitCost(s) * 1.4) s = apply(s, openUnit(s));
  }

  // 2. Qualidade
  if (s.quality < qualityExpectation(seg) + 8 && s.cash > 3500) s = apply(s, investRD(s));

  // 3. Equipe
  const lastProfit = last?.profit ?? 0;
  const salaryOk = (role: Parameters<typeof getRole>[0]) =>
    s.cash > getRole(role).salary * 3 && monthlyRevenue > getRole(role).salary * 2.5 && lastProfit > getRole(role).salary * 0.4;
  // No máximo uma contratação por mês.
  if (last && last.serviceRatio < 0.85 && salaryOk('atendente')) s = apply(s, hire(s, 'atendente'));
  else if (s.employees.marketing === 0 && salaryOk('marketing')) s = apply(s, hire(s, 'marketing'));
  else if (s.leads > 150 && s.employees.vendedor < 2 && salaryOk('vendedor')) s = apply(s, hire(s, 'vendedor'));
  else if (s.employees.desenvolvedor === 0 && salaryOk('desenvolvedor') && monthlyRevenue > 12000) s = apply(s, hire(s, 'desenvolvedor'));
  else if (s.employees.gerente === 0 && salaryOk('gerente') && monthlyRevenue > 18000) s = apply(s, hire(s, 'gerente'));

  // 4. Produto e expansão
  if (s.cash > productLaunchCost(s.productLines) * 3 && s.productLines < 3) s = apply(s, launchProduct(s));
  const scope = SCOPES[s.scopeLevel + 1];
  if (scope && s.level >= scope.unlockLevel && s.cash > scope.cost * 1.6 && last && last.marketShare > 0.15) s = apply(s, expandScope(s));

  // 5. Marketing: os 2 canais mais eficientes para o segmento, com objetivo de vendas.
  const budget = Math.max(200, Math.min(s.cash * 0.3, 400 + monthlyRevenue * 0.18));
  const channels = CHANNELS.filter((c) => !c.baseLimited && !c.buildsOrganic && s.level >= c.unlockLevel && c.minBudget <= budget / 2)
    .map((c) => ({ c, score: seg.affinity[c.id] * c.reachPer100 * c.conversion }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const campaigns = channels.map(({ c }, i) => ({
    id: `bot_${i}`,
    channel: c.id,
    objective: 'sales' as const,
    budget: Math.round(Math.max(c.minBudget, (budget * (i === 0 ? 0.6 : 0.4)))),
    active: true,
    createdMonth: s.month,
  }));
  if (s.activeCustomers > 80) campaigns.push({ id: 'bot_w', channel: 'whatsapp', objective: 'sales', budget: 100, active: true, createdMonth: s.month });
  return { ...s, campaigns };
};

export interface RunResult {
  phase: GameState['phase'];
  month: number;
  revenue: number;
  cash: number;
  level: number;
  customers: number;
  state: GameState;
}

export function play(segment: SegmentId, strategy: Strategy, difficulty: DifficultyId = 'normal', seed = 12345): RunResult {
  let s = createGame(draft(segment, difficulty), seed);
  for (let i = 0; i < MONTH_LIMIT + 2 && s.phase === 'playing'; i++) {
    s = strategy(s);
    s = advanceMonth(s).state;
    s = handleEvent(s);
  }
  return {
    phase: s.phase,
    month: s.month - 1,
    revenue: Math.round(s.totalRevenue),
    cash: Math.round(s.cash),
    level: s.level,
    customers: Math.round(s.customersTotal),
    state: s,
  };
}
