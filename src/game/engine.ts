// Regras de progressão e ações do jogador. Todas as funções são puras:
// recebem o estado e devolvem um novo estado (ou um erro explicando o motivo).

import { unlockAchievements } from './achievements';
import {
  DESIGN_PACKAGES,
  INFRA,
  LEVELS,
  MAX_PRODUCT_LINES,
  MONTH_LIMIT,
  NEW_UNIT_COST,
  NEW_UNIT_UNLOCK,
  PRODUCT_LAUNCH_UNLOCK,
  PRODUCT_TIERS,
  RD_COST,
  ROLES,
  SCOPES,
  START_STRUCTURES,
  STARTING_CAPITAL,
  VICTORY_LEVEL,
  VICTORY_REVENUE,
  VICTORY_STREAK,
  getChannel,
  getDifficulty,
  getRole,
  getSegment,
  productLaunchCost,
} from './data';
import { getEvent, isChoiceAvailable } from './events';
import { rollEvent } from './events';
import { clamp, money } from './format';
import { createId } from './id';
import { buildInsights } from './insights';
import { newSeed } from './rng';
import { getFurniture, ROOM_SIZES, starterLayout } from './furniture';
import { canPlace } from './layout';
import { completeMissions, isUnlocked, type MissionDef } from './missions';
import { rngFor } from './rng';
import { DAYS_PER_MONTH, addDay, closeMonth, employeeCount, simulateDay, simulateMonth, totalDebt, type BaseReport } from './simulation';
import type { Campaign, DayResult, DecisionLog, GameState, Loan, MonthReport, PlacedItem, RoleId, SetupDraft, WorldState } from './types';

export type ActionResult = { ok: true; state: GameState; message: string } | { ok: false; error: string };

function log(s: GameState, kind: DecisionLog['kind'], text: string): GameState {
  return { ...s, decisions: [...s.decisions, { month: s.month, kind, text }] };
}

function touch(s: GameState): GameState {
  return { ...s, updatedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Criação da partida
// ---------------------------------------------------------------------------

export function setupCosts(d: SetupDraft) {
  const opening = d.segment ? getSegment(d.segment).openingCost : 0;
  const design = DESIGN_PACKAGES.find((p) => p.id === d.designPackage)!.cost;
  const structure = START_STRUCTURES.find((s) => s.id === d.structure)!.cost;
  const product = PRODUCT_TIERS.find((p) => p.id === d.productTier)!.cost;
  const total = opening + design + structure + product;
  return { opening, design, structure, product, total, remaining: STARTING_CAPITAL - total };
}

export const DEFAULT_AVATAR: SetupDraft['avatar'] = {
  skin: '#eab995',
  hairStyle: 'curto',
  hairColor: '#3b2416',
  shirt: '#6d5dfc',
  pants: '#2f3a56',
  style: 'casual',
  personality: 'criativo',
};

export function initialWorld(segment: SetupDraft['segment'], cash: number): WorldState {
  const furniture: PlacedItem[] = segment
    ? starterLayout(segment).map((f, i) => ({ id: f.type === 'mesa_fundador' ? 'founder-desk' : `starter-${i}`, ...f, starter: true }))
    : [];
  return {
    furniture,
    day: 1,
    minute: 8 * 60,
    wallColor: '#e9e4f5',
    floorStyle: 'madeira',
    missionsDone: [],
    workHours: { desk: 0, counter: 0, production: 0 },
    monthAcc: null,
    monthCashStart: cash,
    eventDay: null,
    competitorOpen: false,
    lastDay: null,
    cooldowns: {},
  };
}

export function createGame(d: SetupDraft, seed = newSeed()): GameState {
  if (!d.segment) throw new Error('Escolha um segmento.');
  const seg = getSegment(d.segment);
  const design = DESIGN_PACKAGES.find((p) => p.id === d.designPackage)!;
  const structure = START_STRUCTURES.find((s) => s.id === d.structure)!;
  const tier = PRODUCT_TIERS.find((p) => p.id === d.productTier)!;
  const costs = setupCosts(d);
  const now = new Date().toISOString();
  const state: GameState = {
    version: 1,
    seed,
    createdAt: now,
    updatedAt: now,
    player: { name: d.playerName.trim(), difficulty: d.difficulty },
    avatar: d.avatar ?? DEFAULT_AVATAR,
    world: initialWorld(d.segment, costs.remaining),
    company: {
      name: d.name.trim(),
      slogan: d.slogan.trim(),
      description: d.description.trim(),
      product: d.product.trim(),
      differential: d.differential.trim(),
      segment: d.segment,
      logo: d.logo,
    },
    phase: 'playing',
    freePlay: false,
    endReason: null,
    month: 1,
    cash: costs.remaining,
    loans: [],
    price: d.price ?? seg.refPrice,
    quality: tier.quality,
    rdInvestments: 0,
    productLines: 1,
    infraLevel: structure.infraLevel,
    units: 1,
    scopeLevel: 0,
    employees: { atendente: 0, vendedor: 0, marketing: 0, desenvolvedor: 0, gerente: 0 },
    salaryBonus: 0,
    satisfaction: 70,
    reputation: 25 + design.reputation,
    awareness: 3 + design.awareness,
    followers: 30,
    leads: 0,
    activeCustomers: 0,
    customersTotal: 0,
    seoScore: 0,
    campaigns: [],
    modifiers: [],
    investorShare: 0,
    level: 1,
    achievements: {},
    history: [],
    totalRevenue: 0,
    totalExpenses: costs.total,
    totalMarketing: 0,
    profitStreak: 0,
    negativeMonths: 0,
    pendingEvent: null,
    lastEventOutcome: null,
    recentEvents: [],
    decisions: [],
    tutorialDone: false,
    unseenReport: false,
  };
  // A primeira missão ("Crie sua primeira empresa") é cumprida ao abrir a empresa.
  const opened = completeMissions(state).state;
  return log(
    opened,
    'setup',
    `Abriu a ${state.company.name} em ${seg.label} com ${money(costs.total)} de investimento inicial (identidade: ${design.label.toLowerCase()}, produto ${tier.label.toLowerCase()}, ${structure.label.toLowerCase()}).`,
  );
}

// ---------------------------------------------------------------------------
// Níveis e fim de jogo
// ---------------------------------------------------------------------------

export function meetsLevel(s: GameState, level: number): boolean {
  const req = LEVELS[level - 1].requirements;
  return (
    s.totalRevenue >= req.revenue &&
    s.customersTotal >= req.customers &&
    (req.reputation === undefined || s.reputation >= req.reputation) &&
    (req.satisfaction === undefined || s.satisfaction >= req.satisfaction) &&
    (req.employees === undefined || employeeCount(s) >= req.employees) &&
    (req.expansions === undefined || s.units - 1 + s.scopeLevel >= req.expansions)
  );
}

/** Nível alcançado (nunca diminui). */
export function computeLevel(s: GameState): number {
  let level = s.level;
  while (level < LEVELS.length && meetsLevel(s, level + 1)) level++;
  return level;
}

export function victoryProgress(s: GameState) {
  return {
    revenue: { done: s.totalRevenue >= VICTORY_REVENUE, value: s.totalRevenue, target: VICTORY_REVENUE },
    level: { done: s.level >= VICTORY_LEVEL, value: s.level, target: VICTORY_LEVEL },
    streak: { done: s.profitStreak >= VICTORY_STREAK, value: s.profitStreak, target: VICTORY_STREAK },
  };
}

export function isVictory(s: GameState): boolean {
  const v = victoryProgress(s);
  return v.revenue.done && v.level.done && v.streak.done;
}

export function defeatReason(s: GameState): string | null {
  const diff = getDifficulty(s.player.difficulty);
  if (s.cash < -diff.overdraftLimit)
    return `Falência: o caixa ficou em ${money(s.cash)}, além do limite do cheque especial (${money(-diff.overdraftLimit)}). Sem dinheiro para pagar as contas, a empresa fechou.`;
  const debt = totalDebt(s);
  if (debt > diff.debtLimit)
    return `Falência: as dívidas chegaram a ${money(debt)}, acima do limite de ${money(diff.debtLimit)}. Os credores pediram a falência da empresa.`;
  return null;
}

// ---------------------------------------------------------------------------
// Rodada (mês)
// ---------------------------------------------------------------------------

/** Pós-processamento do fechamento do mês: aprendizados, níveis, conquistas, missões, fim de jogo e eventos. */
function finalizeMonth(before: GameState, closed: GameState, base: BaseReport): { state: GameState; report: MonthReport; missions: MissionDef[]; achievements: string[] } {
  const { insights, concept } = buildInsights(before, base);
  let s = closed;
  const newLevel = computeLevel(s);
  const levelUp = newLevel > before.level ? newLevel : null;
  s = { ...s, level: newLevel };

  const partial: MonthReport = { ...base, insights, concept, achievements: [], levelUp };
  const ach = unlockAchievements(s, partial);
  s = ach.state;
  const report: MonthReport = { ...partial, achievements: ach.unlocked };
  s = { ...s, history: [...s.history, report], unseenReport: true, lastEventOutcome: null };
  const ms = completeMissions(s);
  s = ms.state;

  const lost = defeatReason(s);
  if (lost) {
    s = { ...s, phase: 'lost', endReason: lost };
  } else if (!s.freePlay && isVictory(s)) {
    s = {
      ...s,
      phase: 'won',
      endReason: `Vitória! A ${s.company.name} faturou ${money(s.totalRevenue)}, virou uma grande companhia e lucrou ${s.profitStreak} meses seguidos.`,
    };
  } else if (!s.freePlay && s.month > MONTH_LIMIT) {
    s = {
      ...s,
      phase: 'ended',
      endReason: `Fim do prazo: depois de ${MONTH_LIMIT} meses, a ${s.company.name} chegou ao nível ${s.level}.`,
    };
  } else if (!s.pendingEvent) {
    const eventId = rollEvent(s);
    if (eventId) {
      const eventDay = 1 + Math.floor(rngFor(s.seed, s.month, 3)() * 4);
      s = {
        ...s,
        pendingEvent: { eventId, month: s.month },
        recentEvents: [...s.recentEvents, { id: eventId, month: s.month }],
        world: s.world ? { ...s.world, eventDay } : s.world,
      };
    }
  }
  return { state: touch(s), report, missions: ms.completed, achievements: ach.unlocked };
}

/** Simula um mês inteiro de uma vez (usado nos testes de equilíbrio). */
export function advanceMonth(state: GameState): { state: GameState; report: MonthReport } {
  if (state.pendingEvent) throw new Error('Resolva o evento antes de avançar.');
  const { state: closed, report: base } = simulateMonth(state);
  const { state: s, report } = finalizeMonth(state, closed, base);
  return { state: s, report };
}

export interface DayOutcome {
  state: GameState;
  day: DayResult;
  /** Preenchido quando o dia fechou o mês. */
  report: MonthReport | null;
  levelUp: number | null;
  missions: MissionDef[];
  achievements: string[];
}

/** Simula um dia útil; no último dia do mês, fecha o mês. */
export function advanceDay(state: GameState): DayOutcome {
  const cashStart = state.world.monthAcc ? state.world.monthCashStart : state.cash;
  const { state: simulated, day } = simulateDay(state);
  const acc = addDay(state.world.monthAcc, day);
  let s: GameState = {
    ...simulated,
    world: {
      ...simulated.world,
      monthAcc: acc,
      monthCashStart: cashStart,
      lastDay: { revenue: day.revenue, costs: day.totalCosts, customers: day.newCustomers },
    },
  };

  const level = computeLevel(s);
  const levelUp = level > s.level ? level : null;
  s = { ...s, level };
  const ach = unlockAchievements(s);
  s = ach.state;
  const ms = completeMissions(s);
  s = ms.state;

  const monthEnd = state.world.day >= DAYS_PER_MONTH || defeatReason(s) !== null;
  if (monthEnd) {
    const { state: closed, report: base } = closeMonth(s, acc, cashStart);
    const fin = finalizeMonth(s, closed, base);
    return {
      state: fin.state,
      day,
      report: fin.report,
      levelUp,
      missions: [...ms.completed, ...fin.missions],
      achievements: [...ach.unlocked, ...fin.achievements],
    };
  }
  s = { ...s, world: { ...s.world, day: s.world.day + 1 } };
  return { state: touch(s), day, report: null, levelUp, missions: ms.completed, achievements: ach.unlocked };
}

export function resolveEvent(state: GameState, choiceId: string): ActionResult {
  if (!state.pendingEvent) return { ok: false, error: 'Não há evento pendente.' };
  const event = getEvent(state.pendingEvent.eventId);
  const choice = event?.choices.find((c) => c.id === choiceId);
  if (!event || !choice) return { ok: false, error: 'Escolha inválida.' };
  if (!isChoiceAvailable(state, choice)) return { ok: false, error: choice.unavailableReason ?? 'Saldo insuficiente.' };
  const { state: applied, text } = choice.apply(state);
  let s: GameState = {
    ...applied,
    pendingEvent: null,
    lastEventOutcome: { eventId: event.id, title: event.title, choiceLabel: choice.label, text, month: state.month },
    world: { ...applied.world, eventDay: null, competitorOpen: applied.world.competitorOpen || event.id === 'concorrente' },
  };
  s = log(s, 'event', `${event.title}: ${choice.label.toLowerCase()}.`);
  s = unlockAchievements(s).state;
  return { ok: true, state: touch(s), message: text };
}

export function continueAfterVictory(state: GameState): GameState {
  return touch({ ...state, phase: 'playing', freePlay: true });
}

// ---------------------------------------------------------------------------
// Ações do jogador
// ---------------------------------------------------------------------------

function spend(state: GameState, cost: number): ActionResult | null {
  if (state.cash < cost) return { ok: false, error: `Saldo insuficiente: custa ${money(cost)} e você tem ${money(state.cash)}.` };
  return null;
}

function finish(s: GameState, kind: DecisionLog['kind'], logText: string, message: string): ActionResult {
  const withLog = log(s, kind, logText);
  return { ok: true, state: touch(completeMissions(unlockAchievements(withLog).state).state), message };
}

export function setPrice(state: GameState, price: number): GameState {
  return touch({ ...state, price: Math.round(price * 100) / 100 });
}

export function saveCampaign(state: GameState, data: Omit<Campaign, 'id' | 'createdMonth' | 'active'> & { id?: string }): ActionResult {
  const ch = getChannel(data.channel);
  if (state.level < ch.unlockLevel) return { ok: false, error: `${ch.label} libera no nível ${ch.unlockLevel}.` };
  if (data.budget < ch.minBudget) return { ok: false, error: `O investimento mínimo em ${ch.label} é ${money(ch.minBudget)}.` };
  if (data.id) {
    const campaigns = state.campaigns.map((c) => (c.id === data.id ? { ...c, ...data, id: c.id } : c));
    return finish({ ...state, campaigns }, 'marketing', `Ajustou a campanha em ${ch.label} para ${money(data.budget)}/mês.`, 'Campanha atualizada.');
  }
  const campaign: Campaign = { ...data, id: createId('camp'), active: true, createdMonth: state.month };
  return finish(
    { ...state, campaigns: [...state.campaigns, campaign] },
    'marketing',
    `Criou campanha em ${ch.label} com ${money(data.budget)}/mês.`,
    `Campanha em ${ch.label} criada! Ela roda todo mês até você pausar.`,
  );
}

export function toggleCampaign(state: GameState, id: string): GameState {
  return touch({ ...state, campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) });
}

export function removeCampaign(state: GameState, id: string): GameState {
  return touch({ ...state, campaigns: state.campaigns.filter((c) => c.id !== id) });
}

export function hire(state: GameState, role: RoleId): ActionResult {
  const def = getRole(role);
  if (state.level < def.unlockLevel) return { ok: false, error: `${def.label} libera no nível ${def.unlockLevel}.` };
  if (state.employees[role] >= def.max) return { ok: false, error: `Limite de ${def.max} para ${def.label.toLowerCase()}.` };
  return finish(
    { ...state, employees: { ...state.employees, [role]: state.employees[role] + 1 } },
    'team',
    `Contratou ${def.label.toLowerCase()} (${money(def.salary)}/mês).`,
    `${def.label} contratado! O salário de ${money(def.salary)} entra nos custos do mês.`,
  );
}

export function severanceCost(role: RoleId): number {
  return Math.round(getRole(role).salary * 0.5);
}

export function fire(state: GameState, role: RoleId): ActionResult {
  const def = getRole(role);
  if (state.employees[role] <= 0) return { ok: false, error: 'Ninguém nessa função.' };
  const cost = severanceCost(role);
  const err = spend(state, cost);
  if (err) return err;
  return finish(
    { ...state, cash: state.cash - cost, employees: { ...state.employees, [role]: state.employees[role] - 1 } },
    'team',
    `Desligou ${def.label.toLowerCase()} (rescisão de ${money(cost)}).`,
    `${def.label} desligado. Rescisão paga: ${money(cost)}.`,
  );
}

export function rdGain(quality: number): number {
  return Math.max(1, Math.round(8 * (1 - quality / 110)));
}

export function investRD(state: GameState): ActionResult {
  if (state.quality >= 98) return { ok: false, error: 'O produto já está na qualidade máxima.' };
  const err = spend(state, RD_COST);
  if (err) return err;
  const gain = rdGain(state.quality);
  return finish(
    { ...state, cash: state.cash - RD_COST, quality: clamp(state.quality + gain, 0, 98), rdInvestments: state.rdInvestments + 1 },
    'product',
    `Investiu ${money(RD_COST)} em melhoria do produto (+${gain} de qualidade).`,
    `Produto melhorado: +${gain} de qualidade.`,
  );
}

export function launchProduct(state: GameState): ActionResult {
  if (state.level < PRODUCT_LAUNCH_UNLOCK) return { ok: false, error: `Lançar produtos libera no nível ${PRODUCT_LAUNCH_UNLOCK}.` };
  if (state.productLines >= MAX_PRODUCT_LINES) return { ok: false, error: 'Você já tem o máximo de linhas de produto.' };
  const cost = productLaunchCost(state.productLines);
  const err = spend(state, cost);
  if (err) return err;
  return finish(
    {
      ...state,
      cash: state.cash - cost,
      productLines: state.productLines + 1,
      awareness: clamp(state.awareness + 5, 0, 100),
    },
    'product',
    `Lançou a linha de produto nº ${state.productLines + 1} (${money(cost)}).`,
    'Novo produto lançado! O ticket médio sobe 15%.',
  );
}

export function upgradeInfra(state: GameState): ActionResult {
  const next = INFRA[state.infraLevel + 1];
  if (!next) return { ok: false, error: 'Infraestrutura já está no nível máximo.' };
  const err = spend(state, next.upgradeCost);
  if (err) return err;
  return finish(
    { ...state, cash: state.cash - next.upgradeCost, infraLevel: next.level },
    'expansion',
    `Melhorou a infraestrutura para ${next.label.toLowerCase()} (${money(next.upgradeCost)}).`,
    `Infraestrutura: ${next.label}. Capacidade de ${next.capacity} vendas por unidade.`,
  );
}

export function newUnitCost(state: GameState): number {
  return NEW_UNIT_COST * state.units;
}

export function openUnit(state: GameState): ActionResult {
  if (state.level < NEW_UNIT_UNLOCK) return { ok: false, error: `Novas unidades liberam no nível ${NEW_UNIT_UNLOCK}.` };
  const cost = newUnitCost(state);
  const err = spend(state, cost);
  if (err) return err;
  return finish(
    { ...state, cash: state.cash - cost, units: state.units + 1 },
    'expansion',
    `Abriu a unidade nº ${state.units + 1} (${money(cost)}).`,
    'Nova unidade aberta! Mais capacidade e mais clientes na região.',
  );
}

export function expandScope(state: GameState): ActionResult {
  const next = SCOPES[state.scopeLevel + 1];
  if (!next) return { ok: false, error: 'Você já atua no Brasil todo.' };
  if (state.level < next.unlockLevel) return { ok: false, error: `Expandir para ${next.label.toLowerCase()} libera no nível ${next.unlockLevel}.` };
  const err = spend(state, next.cost);
  if (err) return err;
  return finish(
    { ...state, cash: state.cash - next.cost, scopeLevel: next.level },
    'expansion',
    `Expandiu para ${next.label.toLowerCase()} (${money(next.cost)}).`,
    `Expansão concluída: agora você atua em ${next.label.toLowerCase()}. O mercado ficou maior, e a concorrência também.`,
  );
}

export function loanLimit(state: GameState): number {
  const diff = getDifficulty(state.player.difficulty);
  const factor = state.level >= 2 ? 1 : 0.5;
  const outstanding = state.loans.reduce((s, l) => s + l.balance, 0);
  return Math.max(0, Math.round(diff.maxLoan * factor - outstanding));
}

export function loanPayment(amount: number, rate: number, months = 12): number {
  return (amount * rate) / (1 - (1 + rate) ** -months);
}

export function takeLoan(state: GameState, amount: number): ActionResult {
  const limit = loanLimit(state);
  if (amount <= 0 || amount > limit) return { ok: false, error: `Limite disponível para empréstimo: ${money(limit)}.` };
  const rate = getDifficulty(state.player.difficulty).loanInterest;
  const loan: Loan = { principal: amount, balance: amount, monthlyPayment: loanPayment(amount, rate), monthsLeft: 12 };
  return finish(
    { ...state, cash: state.cash + amount, loans: [...state.loans, loan] },
    'finance',
    `Pegou empréstimo de ${money(amount)} (12 parcelas de ${money(loan.monthlyPayment)}).`,
    `Empréstimo de ${money(amount)} aprovado. Parcela: ${money(loan.monthlyPayment)} por 12 meses.`,
  );
}

export function payOffLoan(state: GameState, index: number): ActionResult {
  const loan = state.loans[index];
  if (!loan) return { ok: false, error: 'Empréstimo não encontrado.' };
  const err = spend(state, loan.balance);
  if (err) return err;
  return finish(
    { ...state, cash: state.cash - loan.balance, loans: state.loans.filter((_, i) => i !== index) },
    'finance',
    `Quitou um empréstimo antecipadamente (${money(loan.balance)}).`,
    'Empréstimo quitado! Sem juros nos próximos meses.',
  );
}

export function rolesAvailable(state: GameState) {
  return ROLES.map((r) => ({ role: r, unlocked: state.level >= r.unlockLevel }));
}

export function markTutorialDone(state: GameState): GameState {
  return { ...state, tutorialDone: true };
}

export function markReportSeen(state: GameState): GameState {
  return { ...state, unseenReport: false };
}

// ---------------------------------------------------------------------------
// Mundo 2D: móveis, decoração, trabalho do fundador e ações de marketing
// ---------------------------------------------------------------------------

export function buyFurniture(state: GameState, type: string, x: number, y: number): ActionResult {
  const def = getFurniture(type);
  if (!def || type === 'mesa_fundador') return { ok: false, error: 'Item indisponível.' };
  if (def.segments !== 'all' && !def.segments.includes(state.company.segment)) return { ok: false, error: 'Esse item não combina com o seu negócio.' };
  if (!isUnlocked(state, def.missionUnlock)) return { ok: false, error: 'Conclua mais missões para liberar este item.' };
  const check = canPlace(state.world.furniture, state.infraLevel, type, x, y);
  if (!check.ok) return { ok: false, error: check.reason ?? 'Não cabe aqui.' };
  const err = spend(state, def.price);
  if (err) return err;
  const item: PlacedItem = { id: createId('mov'), type, x, y };
  return finish(
    { ...state, cash: state.cash - def.price, world: { ...state.world, furniture: [...state.world.furniture, item] } },
    'expansion',
    `Comprou ${def.name.toLowerCase()} (${money(def.price)}).`,
    `${def.name} instalado!`,
  );
}

export function moveFurniture(state: GameState, id: string, x: number, y: number): ActionResult {
  const item = state.world.furniture.find((f) => f.id === id);
  if (!item) return { ok: false, error: 'Móvel não encontrado.' };
  const check = canPlace(state.world.furniture, state.infraLevel, item.type, x, y, id);
  if (!check.ok) return { ok: false, error: check.reason ?? 'Não cabe aqui.' };
  return {
    ok: true,
    state: touch({ ...state, world: { ...state.world, furniture: state.world.furniture.map((f) => (f.id === id ? { ...f, x, y } : f)) } }),
    message: 'Móvel reposicionado.',
  };
}

export function sellFurniture(state: GameState, id: string): ActionResult {
  const item = state.world.furniture.find((f) => f.id === id);
  const def = item && getFurniture(item.type);
  if (!item || !def) return { ok: false, error: 'Móvel não encontrado.' };
  if (item.type === 'mesa_fundador') return { ok: false, error: 'Sua mesa não pode ser vendida.' };
  if (item.type === 'caixa' && state.world.furniture.filter((f) => f.type === 'caixa').length <= 1)
    return { ok: false, error: 'Você precisa de pelo menos um balcão para atender os clientes.' };
  const refund = Math.round(def.price * 0.5);
  return finish(
    { ...state, cash: state.cash + refund, world: { ...state.world, furniture: state.world.furniture.filter((f) => f.id !== id) } },
    'expansion',
    `Vendeu ${def.name.toLowerCase()} (+${money(refund)}).`,
    `${def.name} vendido por ${money(refund)} (metade do preço).`,
  );
}

export const DECOR_COST = 150;

export function setDecor(state: GameState, patch: Partial<Pick<WorldState, 'wallColor' | 'floorStyle'>>): ActionResult {
  const err = spend(state, DECOR_COST);
  if (err) return err;
  return {
    ok: true,
    state: touch({ ...state, cash: state.cash - DECOR_COST, world: { ...state.world, ...patch } }),
    message: `Decoração atualizada (${money(DECOR_COST)}).`,
  };
}

/** Horas trabalhadas pelo fundador no dia (mesa, balcão ou produção). */
export function addWork(state: GameState, kind: keyof WorldState['workHours'], hours: number): GameState {
  const work = { ...state.world.workHours, [kind]: Math.min(10, state.world.workHours[kind] + hours) };
  return { ...state, world: { ...state.world, workHours: work } };
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  cost: number;
  unlockLevel: number;
  /** Onde a animação acontece. */
  scene: 'office' | 'city';
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'post', label: 'Publicar conteúdo', description: 'Um post nas redes da empresa. Gratuito, uma vez por dia.', cost: 0, unlockLevel: 1, scene: 'office' },
  { id: 'video', label: 'Gravar vídeo', description: 'Vídeo curto para as redes. Rende mais com o kit de gravação.', cost: 200, unlockLevel: 1, scene: 'office' },
  { id: 'panfletos', label: 'Distribuir panfletos', description: 'Divulgação na rua do bairro: gera contatos interessados.', cost: 300, unlockLevel: 1, scene: 'city' },
  { id: 'influencer', label: 'Post com influenciador', description: 'Um criador de conteúdo fala da sua marca.', cost: 1200, unlockLevel: 2, scene: 'office' },
  { id: 'feira', label: 'Feira de negócios', description: 'Estande em um evento comercial: muitos contatos e reputação.', cost: 1500, unlockLevel: 2, scene: 'city' },
];

function dayStamp(s: GameState): number {
  return s.month * 100 + s.world.day;
}

export function quickActionReady(state: GameState, id: string): boolean {
  return state.world.cooldowns[id] !== dayStamp(state);
}

export function runQuickAction(state: GameState, id: string): ActionResult {
  const action = QUICK_ACTIONS.find((a) => a.id === id);
  if (!action) return { ok: false, error: 'Ação desconhecida.' };
  if (state.level < action.unlockLevel) return { ok: false, error: `Libera no nível ${action.unlockLevel}.` };
  if (!quickActionReady(state, id)) return { ok: false, error: 'Você já fez isso hoje. Tente amanhã!' };
  const err = spend(state, action.cost);
  if (err) return err;
  const seg = getSegment(state.company.segment);
  const social = (seg.affinity.instagram + seg.affinity.tiktok) / 2;
  const hasCamera = state.world.furniture.some((f) => f.type === 'camera');
  const marketer = 1 + 0.3 * state.employees.marketing;
  let followers = 0;
  let leads = 0;
  let awareness = 0;
  let reputation = 0;
  if (id === 'post') {
    followers = Math.round((25 + state.followers * 0.01) * social * marketer);
    awareness = 0.5;
  } else if (id === 'video') {
    followers = Math.round((120 + state.followers * 0.04) * social * marketer * (hasCamera ? 2 : 1));
    awareness = hasCamera ? 3 : 1.5;
  } else if (id === 'panfletos') {
    leads = Math.round(25 + marketSizeLocal(state) * 0.02);
    awareness = 2;
  } else if (id === 'influencer') {
    followers = Math.round(900 * seg.affinity.influencer);
    awareness = 6;
    leads = 30;
  } else if (id === 'feira') {
    leads = Math.round(90 + marketSizeLocal(state) * 0.04);
    awareness = 4;
    reputation = 2;
  }
  const next: GameState = {
    ...state,
    cash: state.cash - action.cost,
    followers: state.followers + followers,
    leads: state.leads + leads,
    awareness: clamp(state.awareness + awareness, 0, 100),
    reputation: clamp(state.reputation + reputation, 0, 100),
    world: { ...state.world, cooldowns: { ...state.world.cooldowns, [id]: dayStamp(state) } },
  };
  const parts = [followers ? `+${followers} seguidores` : '', leads ? `+${leads} contatos interessados` : '', awareness ? `+${awareness} de reconhecimento` : '']
    .filter(Boolean)
    .join(' · ');
  return finish(next, 'marketing', `${action.label}${action.cost ? ` (${money(action.cost)})` : ''}.`, `${action.label}: ${parts}`);
}

function marketSizeLocal(state: GameState): number {
  return getSegment(state.company.segment).baseDemand;
}

/** Ampliar o escritório: infraestrutura sobe de nível e o piso cresce. */
export function expandOffice(state: GameState): ActionResult {
  const result = upgradeInfra(state);
  if (!result.ok) return result;
  const size = ROOM_SIZES[Math.min(result.state.infraLevel, ROOM_SIZES.length - 1)];
  return { ...result, message: `Escritório ampliado para ${size.w}×${size.h}! ${result.message}` };
}
