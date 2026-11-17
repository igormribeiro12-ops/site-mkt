// Consultor da empresa: analisa os números e simula cenários dos próximos meses
// (campanhas, contratações, preço, móveis, expansão...) para recomendar o que
// mais ajuda a empresa a crescer. Roda no navegador, sem serviço externo.

import { CHANNELS, PRODUCT_LAUNCH_UNLOCK, RD_COST, ROLES, getChannel, getRole, getSegment, qualityExpectation } from './data';
import {
  QUICK_ACTIONS,
  type ActionResult,
  buyFurniture,
  expandOffice,
  hire,
  investRD,
  launchProduct,
  payOffLoan,
  quickActionReady,
  saveCampaign,
  setPrice,
  toggleCampaign,
} from './engine';
import { money, num } from './format';
import { catalogFor, getFurniture } from './furniture';
import { canPlace, roomSize } from './layout';
import { currentMission } from './missions';
import { capacity, effectiveQuality, isCampaignRunnable, plannedCosts, simulateMonth } from './simulation';
import type { ChannelId, GameState, RoleId } from './types';

/** O que o botão da recomendação faz na interface. */
export type AdvisorAction =
  | { kind: 'apply'; label: string; run: (s: GameState) => ActionResult }
  | { kind: 'build'; label: string; item: string }
  | { kind: 'panel'; label: string; panel: 'build' | 'hire' | 'shop' | 'marketing' | 'missions' }
  | { kind: 'app'; label: string; app: 'marketing' | 'produto' | 'financas' | 'equipe' | 'vendas' | 'mercado' }
  | { kind: 'quick'; label: string; id: string };

export interface Recommendation {
  id: string;
  /** urgente = risco para a empresa; oportunidade = ganho simulado; dica = boa prática. */
  tone: 'urgente' | 'oportunidade' | 'dica';
  area: 'Marketing' | 'Equipe' | 'Preço' | 'Produto' | 'Estrutura' | 'Finanças' | 'Missão' | 'Atendimento';
  title: string;
  detail: string;
  /** Diferença de caixa em 3 meses (quando foi simulado). */
  gain?: number;
  customers?: number;
  action?: AdvisorAction;
  score: number;
}

export interface Analysis {
  /** Projeção se nada mudar. */
  baseline: { cash: number; profitPerMonth: number; revenuePerMonth: number; customers: number; unmet: number; satisfaction: number };
  health: 'otima' | 'boa' | 'atencao' | 'critica';
  summary: string;
  recommendations: Recommendation[];
  scenarios: number;
}

const HORIZON = 3;

interface Projection {
  cash: number;
  profit: number;
  revenue: number;
  customers: number;
  unmet: number;
  satisfaction: number;
  serviceRatio: number;
}

function project(state: GameState): Projection {
  let s = state;
  let profit = 0;
  let revenue = 0;
  let unmet = 0;
  let satisfaction = 0;
  let serviceRatio = 0;
  for (let m = 0; m < HORIZON; m++) {
    const r = simulateMonth(s, { noNoise: true });
    s = r.state;
    profit += r.report.profit;
    revenue += r.report.revenue;
    unmet += r.report.unmetOrders;
    satisfaction = r.report.satisfaction;
    serviceRatio = r.report.serviceRatio;
  }
  return { cash: s.cash, profit, revenue, customers: s.customersTotal - state.customersTotal, unmet, satisfaction, serviceRatio };
}

/** Primeiro lugar livre do piso onde o móvel cabe. */
function freeSpot(state: GameState, type: string): { x: number; y: number } | null {
  const { w, h } = roomSize(state.infraLevel);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (canPlace(state.world.furniture, state.infraLevel, type, x, y).ok) return { x, y };
  return null;
}

interface Scenario {
  id: string;
  area: Recommendation['area'];
  title: string;
  why: (gain: number, customers: number) => string;
  apply: (s: GameState) => ActionResult;
  action: AdvisorAction;
  /** Só recomenda se o ganho passar deste valor. */
  minGain?: number;
}

function wrap(state: GameState, message: string): ActionResult {
  return { ok: true, state, message };
}

function buildScenarios(s: GameState): Scenario[] {
  const list: Scenario[] = [];
  const seg = getSegment(s.company.segment);
  const free = Math.max(0, s.cash);

  // Campanhas: testa cada canal liberado com alguns valores de investimento.
  const budgets = [500, 1000, 2000, 3500];
  for (const ch of CHANNELS) {
    if (s.level < ch.unlockLevel) continue;
    if (s.campaigns.some((c) => c.channel === ch.id && c.active)) continue;
    for (const b of budgets) {
      const budget = Math.max(ch.minBudget, b);
      if (budget > free * 0.6) continue;
      const data = { channel: ch.id as ChannelId, objective: 'sales' as const, budget };
      list.push({
        id: `camp-${ch.id}-${budget}`,
        area: 'Marketing',
        title: `Criar campanha de vendas no ${ch.label} (${money(budget)}/mês)`,
        why: (gain, c) =>
          `Seu público tem afinidade ${seg.affinity[ch.id] >= 1.2 ? 'alta' : seg.affinity[ch.id] >= 1 ? 'boa' : seg.affinity[ch.id] >= 0.85 ? 'média' : 'baixa'} com ${ch.label}. Na simulação, a campanha traz cerca de ${num(Math.max(0, c))} clientes a mais em 3 meses e o caixa termina ${money(gain)} maior.`,
        apply: (st) => saveCampaign(st, data),
        action: { kind: 'apply', label: 'Criar campanha', run: (st) => saveCampaign(st, data) },
      });
    }
  }

  // Ajustar o valor de campanhas que já existem.
  for (const c of s.campaigns.filter((x) => isCampaignRunnable(s, x))) {
    const ch = getChannel(c.channel);
    list.push({
      id: `pause-${c.id}`,
      area: 'Marketing',
      title: `Pausar a campanha no ${ch.label}`,
      why: (gain) => `Ela custa ${money(c.budget)}/mês e, pelas contas, não está se pagando: sem ela o caixa termina ${money(gain)} maior em 3 meses. Tente outro canal ou outro objetivo.`,
      apply: (st) => wrap(toggleCampaign(st, c.id), `Campanha no ${ch.label} pausada.`),
      action: { kind: 'apply', label: 'Pausar campanha', run: (st) => wrap(toggleCampaign(st, c.id), `Campanha no ${ch.label} pausada.`) },
      minGain: 150,
    });
    const more = Math.round((c.budget * 1.6) / 100) * 100;
    if (more - c.budget <= free * 0.5) {
      const data = { id: c.id, channel: c.channel, objective: c.objective, budget: more };
      list.push({
        id: `boost-${c.id}`,
        area: 'Marketing',
        title: `Aumentar a campanha no ${ch.label} para ${money(more)}/mês`,
        why: (gain, cu) => `Ela está dando retorno: investindo mais, a simulação mostra +${num(Math.max(0, cu))} clientes e caixa ${money(gain)} maior em 3 meses.`,
        apply: (st) => saveCampaign(st, data),
        action: { kind: 'apply', label: 'Aumentar investimento', run: (st) => saveCampaign(st, data) },
      });
    }
  }

  // Contratações.
  for (const r of ROLES) {
    if (s.level < r.unlockLevel || s.employees[r.id] >= r.max) continue;
    list.push({
      id: `hire-${r.id}`,
      area: r.id === 'atendente' ? 'Atendimento' : 'Equipe',
      title: `Contratar ${r.label.toLowerCase()}`,
      why: (gain) => `${r.benefit}. Mesmo pagando ${money(r.salary)}/mês de salário, o caixa termina ${money(gain)} maior em 3 meses na simulação.`,
      apply: (st) => hire(st, r.id as RoleId),
      action: { kind: 'apply', label: `Contratar ${getRole(r.id).label.toLowerCase()}`, run: (st) => hire(st, r.id as RoleId) },
    });
  }

  // Preço.
  for (const f of [0.9, 1.1, 1.2]) {
    const price = Math.round(s.price * f * 100) / 100;
    const up = f > 1;
    list.push({
      id: `price-${f}`,
      area: 'Preço',
      title: `${up ? 'Subir' : 'Baixar'} o preço para ${money(price, true)}`,
      why: (gain, cu) =>
        up
          ? `Seus clientes aceitam pagar um pouco mais (preço médio do mercado: ${money(seg.refPrice)}). A margem maior deixa o caixa ${money(gain)} maior em 3 meses${cu < 0 ? `, mesmo com ${num(-cu)} clientes a menos` : ''}.`
          : `Um preço mais competitivo atrai ${num(Math.max(0, cu))} clientes a mais e o caixa termina ${money(gain)} maior em 3 meses.`,
      apply: (st) => wrap(setPrice(st, price), `Preço ajustado para ${money(price, true)}.`),
      action: { kind: 'apply', label: 'Aplicar novo preço', run: (st) => wrap(setPrice(st, price), `Preço ajustado para ${money(price, true)}.`) },
      minGain: 200,
    });
  }

  // Produto.
  if (s.quality < 95 && free >= RD_COST) {
    list.push({
      id: 'rd',
      area: 'Produto',
      title: `Investir ${money(RD_COST)} na qualidade do produto`,
      why: (gain) => `Qualidade atual ${num(effectiveQuality(s))}/100 (o mercado espera ${qualityExpectation(seg)}). Melhorar o produto aumenta conversão e satisfação: +${money(gain)} no caixa em 3 meses.`,
      apply: investRD,
      action: { kind: 'apply', label: 'Investir em qualidade', run: investRD },
    });
  }
  if (s.level >= PRODUCT_LAUNCH_UNLOCK) {
    list.push({
      id: 'launch',
      area: 'Produto',
      title: 'Lançar uma nova linha de produto',
      why: (gain) => `Mais variedade aumenta o valor de cada compra (ticket médio). Na simulação: caixa ${money(gain)} maior em 3 meses.`,
      apply: launchProduct,
      action: { kind: 'apply', label: 'Lançar produto', run: launchProduct },
    });
  }

  // Móveis (os que mais aumentam capacidade, satisfação ou conversão).
  const affordable = catalogFor(s.company.segment).filter((d) => d.price <= free * 0.7 && !d.missionUnlock && (d.effects.capacity || d.effects.satisfaction || d.effects.conversion || d.effects.quality));
  const best = affordable.sort((a, b) => {
    const v = (d: typeof a) => ((d.effects.capacity ?? 0) * 3 + (d.effects.satisfaction ?? 0) * 60 + (d.effects.conversion ?? 0) * 3000 + (d.effects.quality ?? 0) * 50) / d.price;
    return v(b) - v(a);
  });
  for (const def of best.slice(0, 5)) {
    const spot = freeSpot(s, def.type);
    if (!spot) continue;
    list.push({
      id: `buy-${def.type}`,
      area: 'Estrutura',
      title: `Comprar ${def.name.toLowerCase()} (${money(def.price)})`,
      why: (gain) => `${def.description} Pagando o móvel, o caixa ainda termina ${money(gain)} maior em 3 meses na simulação.`,
      apply: (st) => buyFurniture(st, def.type, spot.x, spot.y),
      action: { kind: 'build', label: 'Escolher onde colocar', item: def.type },
    });
  }

  // Ampliar o espaço.
  list.push({
    id: 'expand',
    area: 'Estrutura',
    title: 'Ampliar o escritório',
    why: (gain) => `Mais espaço e capacidade para atender quem está ficando sem atendimento. Mesmo com o aluguel maior, o caixa termina ${money(gain)} maior em 3 meses.`,
    apply: expandOffice,
    action: { kind: 'panel', label: 'Ver ampliação', panel: 'build' },
  });

  // Dívidas.
  s.loans.forEach((l, i) => {
    if (l.balance > free * 0.8) return;
    list.push({
      id: `payoff-${i}`,
      area: 'Finanças',
      title: `Quitar o empréstimo (${money(l.balance)})`,
      why: (gain) => `Você deixa de pagar ${money(l.monthlyPayment)}/mês e economiza os juros: caixa ${money(gain)} maior em 3 meses.`,
      apply: (st) => payOffLoan(st, i),
      action: { kind: 'apply', label: 'Quitar empréstimo', run: (st) => payOffLoan(st, i) },
      minGain: 50,
    });
  });

  return list;
}

/** Analisa a empresa e devolve as recomendações em ordem de prioridade. */
export function analyze(state: GameState): Analysis {
  const base = project(state);
  const seg = getSegment(state.company.segment);
  const recs: Recommendation[] = [];
  const costs = plannedCosts(state);

  // --- Riscos (diagnóstico) ---------------------------------------------------
  if (base.cash < 0) {
    recs.push({
      id: 'risco-caixa',
      tone: 'urgente',
      area: 'Finanças',
      title: 'Seu caixa vai ficar negativo',
      detail: `Se nada mudar, em ${HORIZON} meses o caixa chega a ${money(base.cash)}. Corte gastos que não dão retorno, ajuste o preço ou consiga um empréstimo antes que os juros do cheque especial apertem.`,
      action: { kind: 'app', label: 'Ver finanças', app: 'financas' },
      score: 1000,
    });
  }
  if (state.campaigns.filter((c) => isCampaignRunnable(state, c)).length === 0) {
    recs.push({
      id: 'sem-divulgacao',
      tone: 'urgente',
      area: 'Marketing',
      title: 'Ninguém está divulgando a sua empresa',
      detail: 'Sem campanhas, só aparecem clientes por acaso. Comece com uma campanha de vendas no canal em que o seu público está (veja a sugestão abaixo) e publique conteúdo todo dia.',
      action: { kind: 'panel', label: 'Abrir marketing', panel: 'marketing' },
      score: 900,
    });
  }
  if (base.unmet > 5) {
    recs.push({
      id: 'capacidade',
      tone: 'urgente',
      area: 'Atendimento',
      title: 'Clientes vão ficar sem atendimento',
      detail: `A simulação prevê ${num(base.unmet)} pedidos não atendidos em ${HORIZON} meses (capacidade atual: ${num(capacity(state))} vendas/mês). Contrate atendentes, compre móveis de produção ou amplie o espaço.`,
      action: { kind: 'panel', label: 'Comprar móveis', panel: 'build' },
      score: 800,
    });
  }
  if (base.satisfaction < 55) {
    const q = effectiveQuality(state) < qualityExpectation(seg);
    const expensive = state.price > seg.refPrice * 1.25;
    recs.push({
      id: 'satisfacao',
      tone: 'urgente',
      area: 'Produto',
      title: 'A satisfação dos clientes está baixa',
      detail: q
        ? `A qualidade (${num(effectiveQuality(state))}) está abaixo do que o mercado espera (${qualityExpectation(seg)}). Invista em qualidade ou trabalhe no computador para melhorar o produto.`
        : expensive
          ? `Seu preço (${money(state.price)}) está bem acima da média do mercado (${money(seg.refPrice)}). Clientes que pagam caro esperam mais.`
          : 'Cuide do atendimento: contrate atendentes, trabalhe no balcão e deixe o ambiente mais agradável com decoração.',
      action: q ? { kind: 'app', label: 'Ver produto', app: 'produto' } : { kind: 'panel', label: 'Contratar', panel: 'hire' },
      score: 700,
    });
  }

  // --- Oportunidades (cenários simulados) -----------------------------------
  const scenarios = buildScenarios(state);
  const results: { sc: Scenario; gain: number; customers: number }[] = [];
  for (const sc of scenarios) {
    const r = sc.apply(state);
    if (!r.ok) continue;
    const p = project(r.state);
    results.push({ sc, gain: p.cash - base.cash, customers: p.customers - base.customers });
  }
  // Para cada grupo (mesmo canal, mesmo móvel...), fica só a melhor opção.
  const bestByGroup = new Map<string, (typeof results)[number]>();
  for (const r of results) {
    const group = r.sc.id.startsWith('camp-') ? 'camp' : r.sc.id.startsWith('price-') ? 'price' : r.sc.id;
    const prev = bestByGroup.get(group);
    if (!prev || r.gain > prev.gain) bestByGroup.set(group, r);
  }
  const revenueScale = Math.max(300, base.revenue / HORIZON);
  for (const r of bestByGroup.values()) {
    const threshold = r.sc.minGain ?? Math.max(100, revenueScale * 0.05);
    if (r.gain < threshold) continue;
    recs.push({
      id: r.sc.id,
      tone: 'oportunidade',
      area: r.sc.area,
      title: r.sc.title,
      detail: r.sc.why(r.gain, r.customers),
      gain: r.gain,
      customers: r.customers,
      action: r.sc.action,
      score: 100 + r.gain / 10 + Math.max(0, r.customers),
    });
  }

  // --- Dicas do dia a dia ------------------------------------------------------
  const post = QUICK_ACTIONS.find((a) => a.id === 'post');
  if (post && quickActionReady(state, 'post')) {
    recs.push({
      id: 'post',
      tone: 'dica',
      area: 'Marketing',
      title: 'Publique conteúdo hoje (grátis)',
      detail: 'Um post por dia aumenta seguidores e reconhecimento da marca sem gastar nada. Pode ser feito uma vez por dia.',
      action: { kind: 'quick', label: 'Publicar agora', id: 'post' },
      score: 60,
    });
  }
  const idleRoles = (['marketing', 'desenvolvedor', 'gerente', 'vendedor'] as RoleId[]).filter((r) => state.employees[r] > 0);
  if (idleRoles.length) {
    const desks = state.world.furniture.filter((f) => {
      const d = getFurniture(f.type);
      return d?.staff && d.roles && f.type !== 'mesa_fundador';
    }).length;
    const staff = Object.values(state.employees).reduce((a, b) => a + b, 0);
    if (desks < staff) {
      recs.push({
        id: 'postos',
        tone: 'dica',
        area: 'Equipe',
        title: 'Tem funcionário sem posto de trabalho',
        detail: `Você tem ${staff} funcionário(s) e ${desks} posto(s). Compre uma estação de trabalho ou móvel de produção para todos trabalharem.`,
        action: { kind: 'build', label: 'Comprar estação', item: 'mesa_trabalho' },
        score: 300,
      });
    }
  }
  const mission = currentMission(state);
  if (mission) {
    recs.push({
      id: `missao-${mission.id}`,
      tone: 'dica',
      area: 'Missão',
      title: `Missão: ${mission.title} (+${money(mission.reward)})`,
      detail: mission.hint,
      action: { kind: 'panel', label: 'Ver missões', panel: 'missions' },
      score: 50,
    });
  }
  if (costs.total > 0 && state.cash > costs.total * 4 && base.cash > state.cash) {
    recs.push({
      id: 'caixa-parado',
      tone: 'dica',
      area: 'Finanças',
      title: 'Dinheiro parado pode trabalhar por você',
      detail: `Seu caixa (${money(state.cash)}) cobre mais de 4 meses de custos. Considere investir em marketing, estrutura ou expansão para crescer mais rápido.`,
      action: { kind: 'panel', label: 'Ver expansões', panel: 'shop' },
      score: 40,
    });
  }

  const tier = { urgente: 3, oportunidade: 2, dica: 1 } as const;
  recs.sort((a, b) => tier[b.tone] - tier[a.tone] || b.score - a.score);

  const monthlyProfit = base.profit / HORIZON;
  const health: Analysis['health'] = base.cash < 0 ? 'critica' : monthlyProfit < 0 ? 'atencao' : monthlyProfit > costs.total * 0.3 ? 'otima' : 'boa';
  const summary =
    health === 'critica'
      ? `Se nada mudar, o caixa fica negativo em ${HORIZON} meses. Siga as recomendações urgentes primeiro.`
      : health === 'atencao'
        ? `A empresa está perdendo cerca de ${money(-monthlyProfit)} por mês na projeção. Dá para virar o jogo com as ações abaixo.`
        : health === 'otima'
          ? `Ótimo ritmo: lucro previsto de ${money(monthlyProfit)} por mês. Hora de investir para crescer.`
          : `A empresa se paga (lucro previsto de ${money(monthlyProfit)}/mês). As oportunidades abaixo aceleram o crescimento.`;

  return {
    baseline: {
      cash: base.cash,
      profitPerMonth: monthlyProfit,
      revenuePerMonth: base.revenue / HORIZON,
      customers: base.customers,
      unmet: base.unmet,
      satisfaction: base.satisfaction,
    },
    health,
    summary,
    recommendations: recs,
    scenarios: scenarios.length,
  };
}
