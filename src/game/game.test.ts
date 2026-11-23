import { describe, expect, it } from 'vitest';
import { balanced, draft, passive, play, reckless } from '../test/bots';
import { PAINTED_TYPES } from '../world/art/furnitureArt';
import { ACHIEVEMENTS } from './achievements';
import { analyze } from './advisor';
import { getEvent } from './events';
import { catalogFor } from './furniture';
import { suggestAll, suggestDifferentials, suggestNames, suggestProducts } from './ideas';
import { canPlace } from './layout';
import { rngFor } from './rng';
import { BRANCH_RAMP_MONTHS, LEVELS, MONTH_LIMIT, REGION_FEE, SEGMENTS, STARTING_CAPITAL, STATE_FEE, VICTORY_STATES, getRole, getSegment } from './data';
import {
  advanceMonth,
  buyFurniture,
  closeBranch,
  computeLevel,
  createGame,
  defeatReason,
  depositSavings,
  emptyTeam,
  hire,
  investRD,
  isVictory,
  openBranch,
  resolveEvent,
  saveCampaign,
  setLoyalty,
  setSupplier,
  setupCosts,
  takeLoan,
  toggleInsurance,
  upgradeInfra,
  withdrawSavings,
} from './engine';
import { branchOpenCost, branchRamp, checkCity, marketReach, presentCities, presentStates } from './expansion';
import { CITIES, STATES, getCity } from './geo';
import { createGoal, settleGoal } from './goals';
import { migrateGame } from './migrate';
import { ACHIEVEMENT_CATEGORIES } from './achievements';
import { EVENTS, isChoiceAvailable, rollEvent } from './events';
import { computeScore } from './scoring';
import { costIndex, effectiveQuality, estimateCampaign, marketPrice, plannedCosts, simulateMonth, unitCost } from './simulation';
import type { GameState } from './types';

function newGame(): GameState {
  return createGame(draft('alimentacao'), 42);
}

describe('criação da partida', () => {
  it('começa com R$ 10.000 e desconta os investimentos iniciais', () => {
    const d = draft('alimentacao');
    const costs = setupCosts(d);
    expect(costs.total).toBe(1500 + 600 + 0 + 1500);
    const s = createGame(d, 1);
    // + R$ 500 da missão "Crie sua primeira empresa"
    expect(s.cash).toBe(STARTING_CAPITAL - costs.total + 500);
    expect(s.world.missionsDone).toEqual(['empresa']);
    expect(s.world.furniture.some((f) => f.type === 'mesa_fundador')).toBe(true);
    expect(s.month).toBe(1);
    expect(s.level).toBe(1);
    expect(s.phase).toBe('playing');
  });
});

describe('simulação', () => {
  it('é determinística: mesmas decisões, mesmo resultado', () => {
    const a = play('moda', balanced, 'normal', 99);
    const b = play('moda', balanced, 'normal', 99);
    expect(a.state.history.map((h) => h.revenue)).toEqual(b.state.history.map((h) => h.revenue));
  });

  it('marketing gera vendas; sem marketing quase não há clientes', () => {
    const base = newGame();
    const without = simulateMonth(base).report;
    const withAds = simulateMonth((saveCampaign(base, { channel: 'instagram', objective: 'sales', budget: 500 }) as { state: GameState }).state).report;
    expect(without.newCustomers).toBeLessThan(2);
    expect(withAds.newCustomers).toBeGreaterThan(20);
    expect(withAds.costs.marketing).toBe(500);
  });

  it('o objetivo da campanha muda o resultado', () => {
    const s = newGame();
    const sales = estimateCampaign(s, 'instagram', 'sales', 500);
    const followers = estimateCampaign(s, 'instagram', 'followers', 500);
    const awareness = estimateCampaign(s, 'instagram', 'awareness', 500);
    expect(sales.customers).toBeGreaterThan(followers.customers);
    expect(followers.followers).toBeGreaterThan(sales.followers);
    expect(awareness.reach).toBeGreaterThan(sales.reach);
  });

  it('preço alto reduz conversões e qualidade maior aumenta', () => {
    const s = newGame();
    const normal = estimateCampaign(s, 'instagram', 'sales', 500).customers;
    const expensive = estimateCampaign({ ...s, price: s.price * 1.6 }, 'instagram', 'sales', 500).customers;
    const better = estimateCampaign({ ...s, quality: 85 }, 'instagram', 'sales', 500).customers;
    expect(expensive).toBeLessThan(normal);
    expect(better).toBeGreaterThan(normal);
  });

  it('a capacidade limita as vendas e gera pedidos não atendidos', () => {
    let s = newGame();
    s = { ...s, activeCustomers: 3000, satisfaction: 80 };
    const r = simulateMonth(s).report;
    expect(r.unitsSold).toBeLessThanOrEqual(r.capacity);
    expect(r.unmetOrders).toBeGreaterThan(0);
  });

  it('cobra salários, aluguel e marketing previstos', () => {
    let s = newGame();
    s = (hire(s, 'atendente') as { state: GameState }).state;
    s = (saveCampaign(s, { channel: 'facebook', objective: 'leads', budget: 300 }) as { state: GameState }).state;
    const planned = plannedCosts(s);
    expect(planned.salaries).toBe(getRole('atendente').salary);
    expect(planned.marketing).toBe(300);
    const r = simulateMonth(s).report;
    expect(r.costs.salaries).toBe(getRole('atendente').salary);
    expect(r.profit).toBeCloseTo(r.revenue - r.totalCosts, 5);
  });
});

describe('ações', () => {
  it('bloqueia compras sem saldo e recursos de nível maior', () => {
    const s = { ...newGame(), cash: 100 };
    expect(investRD(s).ok).toBe(false);
    expect(upgradeInfra(s).ok).toBe(false);
    expect(hire(newGame(), 'gerente').ok).toBe(false);
    expect(saveCampaign(newGame(), { channel: 'tiktok', objective: 'sales', budget: 300 }).ok).toBe(false);
  });

  it('empréstimo entra no caixa e gera parcelas', () => {
    const s = newGame();
    const r = takeLoan(s, 3000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.cash).toBe(s.cash + 3000);
    expect(r.state.loans[0].monthlyPayment).toBeGreaterThan(250);
    expect(takeLoan(s, 999999).ok).toBe(false);
  });

  it('nível sobe quando os requisitos são atingidos', () => {
    const req = LEVELS[1].requirements;
    expect(computeLevel({ ...newGame(), totalRevenue: req.revenue - 1, customersTotal: req.customers })).toBe(1);
    expect(computeLevel({ ...newGame(), totalRevenue: req.revenue, customersTotal: req.customers })).toBe(2);
  });

  it('falência quando o caixa passa do limite', () => {
    expect(defeatReason({ ...newGame(), cash: -6000 })).toMatch(/Falência/);
    expect(defeatReason(newGame())).toBeNull();
  });
});

describe('eventos', () => {
  it('há pelo menos 15 eventos e todas as escolhas funcionam', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(15);
    const rich: GameState = {
      ...newGame(),
      month: 8,
      cash: 50000,
      followers: 2000,
      level: 3,
      reputation: 70,
      totalRevenue: 30000,
      employees: { ...emptyTeam(), atendente: 1, vendedor: 1, desenvolvedor: 1 },
      homeCity: 'sao-paulo',
      branches: [
        { id: 'f1', city: 'campinas', month: 3 },
        { id: 'f2', city: 'rio-de-janeiro', month: 5 },
      ],
    };
    for (const ev of EVENTS) {
      expect(ev.choices.length).toBeGreaterThanOrEqual(2);
      for (const choice of ev.choices) {
        const s = { ...rich, pendingEvent: { eventId: ev.id, month: 8 } };
        if (!isChoiceAvailable(s, choice)) continue;
        const r = resolveEvent(s, choice.id);
        expect(r.ok).toBe(true);
        if (r.ok) {
          expect(r.state.pendingEvent).toBeNull();
          expect(r.message.length).toBeGreaterThan(10);
          expect(Number.isFinite(r.state.cash)).toBe(true);
        }
      }
    }
  });

  it('o sorteio de eventos é estável para a mesma partida e mês', () => {
    const s = { ...newGame(), month: 5, followers: 500 };
    expect(rollEvent(s)).toBe(rollEvent(s));
  });

  it('não deixa avançar com evento pendente', () => {
    const s = { ...newGame(), pendingEvent: { eventId: 'viral', month: 1 } };
    expect(() => advanceMonth(s)).toThrow();
  });
});

describe('equilíbrio do jogo', () => {
  const winMonths: number[] = [];

  it.each(SEGMENTS.map((s) => s.id))('%s: estratégia equilibrada vence; passiva e imprudente não', (segment) => {
    const good = play(segment, balanced);
    expect(good.phase).toBe('won');
    expect(good.month).toBeLessThanOrEqual(MONTH_LIMIT);
    winMonths.push(good.month);
    expect(play(segment, passive).phase).not.toBe('won');
    const bad = play(segment, reckless);
    expect(bad.phase).toBe('lost');
    expect(bad.month).toBeLessThanOrEqual(6);
  });

  it('construir o império leva tempo: em média, uma boa estratégia vence entre 16 e 30 meses', () => {
    expect(winMonths).toHaveLength(SEGMENTS.length);
    const avg = winMonths.reduce((a, b) => a + b, 0) / winMonths.length;
    expect(avg).toBeGreaterThanOrEqual(16);
    expect(avg).toBeLessThanOrEqual(30);
  });

  it('a vitória exige presença em vários estados', () => {
    const r = play('beleza', balanced);
    expect(r.phase).toBe('won');
    expect(presentStates(r.state).size).toBeGreaterThanOrEqual(VICTORY_STATES);
    expect(r.state.level).toBe(LEVELS.length);
  });

  it('a partida termina no prazo máximo', () => {
    const r = play('tecnologia', passive, 'facil');
    expect(r.month).toBeLessThanOrEqual(MONTH_LIMIT);
  });
});

describe('pontuação e conquistas', () => {
  it('gera pontuação de 0 a 1000 com 5 pilares', () => {
    const r = play('beleza', balanced);
    const score = computeScore(r.state);
    expect(score.pillars).toHaveLength(5);
    expect(score.total).toBeGreaterThan(0);
    expect(score.total).toBeLessThanOrEqual(1000);
    expect(score.rank.title.length).toBeGreaterThan(3);
  });

  it('desbloqueia as conquistas pedidas', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    for (const id of ['primeira_venda', 'primeiro_cliente', 'receita_5k', 'campanha_lucrativa', 'clientes_100', 'primeiro_funcionario', 'expansao']) {
      expect(ids).toContain(id);
    }
    const r = play('moda', balanced);
    expect(Object.keys(r.state.achievements)).toEqual(expect.arrayContaining(['primeira_venda', 'primeiro_cliente', 'receita_5k', 'clientes_100']));
  });
});

describe('tipos de negócio, móveis e ideias', () => {
  it.each(SEGMENTS.map((s) => s.id))('%s: escritório inicial válido, móveis com arte e compra possível', (segment) => {
    const g = createGame(draft(segment), 3);
    // cada móvel inicial respeita as regras de espaço (nada bloqueado)
    for (const item of g.world.furniture) expect(canPlace(g.world.furniture, g.infraLevel, item.type, item.x, item.y, item.id).ok).toBe(true);
    // todo item do catálogo do segmento tem desenho
    for (const def of catalogFor(segment)) expect(PAINTED_TYPES).toContain(def.type);
    // o segmento tem móveis próprios (além dos comuns a todos)
    expect(catalogFor(segment).filter((d) => d.segments !== 'all').length).toBeGreaterThanOrEqual(2);
    const bought = buyFurniture({ ...g, cash: 50_000 }, 'planta', 2, 2);
    expect(bought.ok).toBe(true);
  });

  it.each(SEGMENTS.map((s) => s.id))('%s: o assistente sugere nome, produto, slogan, descrição e diferencial', (segment) => {
    const rnd = rngFor(7, 1, 1);
    expect(suggestNames(segment, 'Ana', 'feminino', 4, rnd).length).toBeGreaterThanOrEqual(3);
    expect(suggestProducts(segment, 4, rnd)).toHaveLength(4);
    expect(suggestDifferentials(segment, 4, rnd)).toHaveLength(4);
    const all = suggestAll(segment, { name: '', product: '', slogan: '', description: '', differential: '' }, 'Ana', 'feminino', rnd);
    for (const v of Object.values(all)) expect(v.trim().length).toBeGreaterThan(2);
    expect(all.description.length).toBeLessThanOrEqual(200);
    expect(all.name.length).toBeLessThanOrEqual(32);
    // o que já foi escrito é mantido
    expect(suggestAll(segment, { ...all, name: 'Minha Marca' }, 'Ana').name).toBe('Minha Marca');
  });

  it('nome com o dono usa o artigo certo', () => {
    const names = Array.from({ length: 30 }, (_, i) => suggestNames('lanchonete', 'Pedro', 'masculino', 6, rngFor(i, 1, 1))).flat();
    expect(names.some((n) => n.endsWith('do Pedro'))).toBe(true);
    expect(names.some((n) => n.endsWith('da Pedro'))).toBe(false);
  });
});

describe('consultor da empresa', () => {
  it('empresa nova: aponta a falta de divulgação primeiro e sugere uma campanha que dá lucro', () => {
    const g = createGame(draft('lanchonete'), 5);
    const a = analyze(g);
    expect(a.recommendations[0].tone).toBe('urgente');
    expect(a.recommendations.map((r) => r.id)).toContain('sem-divulgacao');
    const camp = a.recommendations.find((r) => r.id.startsWith('camp-'));
    expect(camp?.gain).toBeGreaterThan(0);
    // aplicar a sugestão funciona de verdade
    expect(camp?.action?.kind).toBe('apply');
    if (camp?.action?.kind === 'apply') {
      const r = camp.action.run(g);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.state.campaigns).toHaveLength(1);
    }
  });

  it('caixa a caminho do vermelho vira alerta urgente', () => {
    const g = createGame(draft('tecnologia'), 5);
    const broke = { ...g, cash: 300, employees: { ...g.employees, atendente: 3 } };
    const a = analyze(broke);
    expect(a.health).toBe('critica');
    expect(a.recommendations[0].id).toBe('risco-caixa');
  });

  it('as recomendações de oportunidade realmente melhoram o caixa projetado', () => {
    let g = createGame(draft('moda'), 9);
    for (let i = 0; i < 3; i++) {
      g = advanceMonth(balanced(g)).state;
      if (g.pendingEvent) {
        const ev = getEvent(g.pendingEvent.eventId)!;
        for (const c of ev.choices) {
          const r = resolveEvent(g, c.id);
          if (r.ok) {
            g = r.state;
            break;
          }
        }
      }
    }
    const a = analyze(g);
    for (const r of a.recommendations.filter((x) => x.tone === 'oportunidade')) expect(r.gain ?? 0).toBeGreaterThan(0);
  });
});

describe('expansão pelo Brasil', () => {
  /** Empresa no nível pedido, já atuando na cidade toda e com caixa de sobra. */
  function grown(level: number, extra: Partial<GameState> = {}): GameState {
    return { ...newGame(), level, scopeLevel: 1, cash: 200_000, month: 10, ...extra };
  }

  it('o mapa tem os 27 estados, as 5 regiões e cidades em todos os estados', () => {
    expect(STATES).toHaveLength(27);
    expect(new Set(STATES.map((s) => s.region)).size).toBe(5);
    for (const st of STATES) expect(CITIES.some((c) => c.uf === st.uf)).toBe(true);
    // não há dois estados no mesmo quadrado do mapa
    expect(new Set(STATES.map((s) => `${s.col},${s.row}`)).size).toBe(27);
  });

  it('filiais liberam por nível: estado e região no nível 4, resto do Brasil no 5', () => {
    expect(openBranch(grown(3), 'campinas').ok).toBe(false);
    expect(checkCity(grown(4), 'campinas').reason).toBeNull();
    expect(checkCity(grown(4), 'rio-de-janeiro').reason).toBeNull(); // Sudeste, mesma região
    expect(checkCity(grown(4), 'recife').reason).toMatch(/nível 5/);
    expect(checkCity(grown(5), 'recife').reason).toBeNull();
    // antes, é preciso conquistar a cidade toda
    expect(checkCity(grown(4, { scopeLevel: 0 }), 'campinas').reason).toMatch(/cidade/i);
  });

  it('estado novo cobra inscrição estadual e região nova cobra centro de distribuição', () => {
    const s = grown(5);
    expect(branchOpenCost(s, 'campinas').stateFee).toBe(0);
    expect(branchOpenCost(s, 'rio-de-janeiro').stateFee).toBe(STATE_FEE);
    expect(branchOpenCost(s, 'rio-de-janeiro').regionFee).toBe(0);
    const recife = branchOpenCost(s, 'recife');
    expect(recife.stateFee).toBe(STATE_FEE);
    expect(recife.regionFee).toBe(REGION_FEE);
    const r = openBranch(s, 'recife');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.cash).toBe(s.cash - recife.total);
    expect(presentStates(r.state).has('PE')).toBe(true);
    // a segunda filial no mesmo estado não paga a taxa de novo
    expect(branchOpenCost(r.state, 'caruaru').stateFee).toBe(0);
    expect(openBranch(r.state, 'recife').ok).toBe(false);
  });

  it('a filial cresce aos poucos e aumenta o mercado, os custos e a capacidade', () => {
    const s = grown(5);
    const r = openBranch(s, 'belo-horizonte');
    if (!r.ok) throw new Error(r.error);
    const b = r.state.branches[0];
    expect(branchRamp(r.state, b)).toBeCloseTo(1 / BRANCH_RAMP_MONTHS);
    const later = { ...r.state, month: r.state.month + BRANCH_RAMP_MONTHS };
    expect(branchRamp(later, b)).toBe(1);
    expect(marketReach(later)).toBeGreaterThan(marketReach(r.state));
    expect(marketReach(r.state)).toBeGreaterThan(marketReach(s));
    expect(plannedCosts(r.state).rent).toBeGreaterThan(plannedCosts(s).rent);
  });

  it('fechar a filial devolve parte do investimento e corta o custo mensal', () => {
    const opened = openBranch(grown(5), 'curitiba');
    if (!opened.ok) throw new Error(opened.error);
    const r = closeBranch(opened.state, opened.state.branches[0].id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.branches).toHaveLength(0);
    expect(r.state.cash).toBeGreaterThan(opened.state.cash);
    expect(plannedCosts(r.state).rent).toBeLessThan(plannedCosts(opened.state).rent);
  });

  it('vencer exige nível 6 e 3 estados ao mesmo tempo', () => {
    const top = LEVELS[LEVELS.length - 1].requirements;
    const base = grown(6, { totalRevenue: top.revenue, customersTotal: top.customers, reputation: 90, profitStreak: 6 });
    expect(isVictory(base)).toBe(false);
    const branches = [
      { id: 'a', city: 'rio-de-janeiro', month: 1 },
      { id: 'b', city: 'belo-horizonte', month: 1 },
    ];
    expect(isVictory({ ...base, branches })).toBe(true);
    expect(presentCities({ ...base, branches }).size).toBe(3);
  });
});

describe('desafio do mês', () => {
  it('é criado a partir do 2º mês e paga a recompensa quando é cumprido', () => {
    let s = advanceMonth(newGame()).state;
    if (s.pendingEvent) s = { ...s, pendingEvent: null };
    const goal = createGoal(s);
    expect(goal).not.toBeNull();
    if (!goal) return;
    expect(goal.month).toBe(s.month);
    expect(goal.reward).toBeGreaterThanOrEqual(500);
    const last = s.history[s.history.length - 1];
    const report = { ...last, month: s.month, newCustomers: 1e6, revenue: 1e9, profit: 1e9, satisfaction: 100, followersGained: 1e6, goal: null };
    const done = settleGoal({ ...s, goal }, report);
    expect(done.result?.achieved).toBe(true);
    expect(done.state.cash).toBe(s.cash + goal.reward);
    expect(done.state.goalsDone).toBe(s.goalsDone + 1);
    const failed = settleGoal({ ...s, goal }, { ...report, newCustomers: 0, revenue: 0, profit: -1, satisfaction: 0, followersGained: 0 });
    expect(failed.result?.achieved).toBe(false);
    expect(failed.state.cash).toBe(s.cash);
  });

  it('o fechamento do mês confere o desafio e já cria o próximo', () => {
    let s = newGame();
    s = advanceMonth(s).state;
    expect(s.goal?.month).toBe(s.month);
    s = { ...s, pendingEvent: null };
    const r = advanceMonth(s);
    expect(r.report.goal?.month).toBe(s.month);
    expect(r.state.goal?.month).toBe(r.state.month);
  });
});

describe('finanças, fornecedores e fidelidade', () => {
  it('a aplicação rende todo mês e cobre o caixa negativo sozinha', () => {
    const s = { ...newGame(), cash: 20_000 };
    const dep = depositSavings(s, 10_000);
    if (!dep.ok) throw new Error(dep.error);
    expect(dep.state.savings).toBe(10_000);
    const month = simulateMonth(dep.state).report;
    expect(month.savingsIncome).toBeGreaterThan(0);
    // caixa negativo usa a aplicação antes do cheque especial
    const broke = simulateMonth({ ...dep.state, cash: -2000 }).state;
    expect(broke.savings).toBeLessThan(10_000);
    expect(broke.cash).toBeGreaterThanOrEqual(-1);
    const back = withdrawSavings(dep.state, 4000);
    expect(back.ok && back.state.cash).toBe(dep.state.cash + 4000);
  });

  it('o seguro só libera no nível 2 e devolve parte do prejuízo de eventos ruins', () => {
    expect(toggleInsurance(newGame()).ok).toBe(false);
    const ins = toggleInsurance({ ...newGame(), level: 2 });
    if (!ins.ok) throw new Error(ins.error);
    expect(plannedCosts(ins.state).services).toBeGreaterThan(0);
    const s = { ...ins.state, cash: 10_000, month: 5, pendingEvent: { eventId: 'fiscalizacao', month: 5 } };
    const without = resolveEvent({ ...s, insurance: false }, 'arriscar');
    const covered = resolveEvent(s, 'arriscar');
    if (!without.ok || !covered.ok) throw new Error('evento');
    expect(covered.state.cash).toBeGreaterThan(without.state.cash);
    expect(covered.message).toMatch(/seguro/i);
  });

  it('fornecedor premium melhora a qualidade e encarece a produção', () => {
    const s = { ...newGame(), cash: 5000 };
    const r = setSupplier(s, 'premium');
    if (!r.ok) throw new Error(r.error);
    expect(effectiveQuality(r.state)).toBeGreaterThan(effectiveQuality(s));
    expect(unitCost(r.state)).toBeGreaterThan(unitCost(s));
    expect(setSupplier(r.state, 'premium').ok).toBe(false);
  });

  it('o programa de fidelidade aumenta a recompra', () => {
    const s = { ...newGame(), level: 4, activeCustomers: 400, satisfaction: 75 };
    expect(setLoyalty(newGame(), 1).ok).toBe(false);
    const vip = setLoyalty(s, 2);
    if (!vip.ok) throw new Error(vip.error);
    expect(simulateMonth(vip.state, { noNoise: true }).report.returningOrders).toBeGreaterThan(simulateMonth(s, { noNoise: true }).report.returningOrders);
  });

  it('a inflação sobe os custos e também o preço médio do mercado', () => {
    const s = newGame();
    const later = { ...s, month: 25 };
    expect(costIndex(later)).toBeGreaterThan(1.05);
    expect(unitCost(later)).toBeGreaterThan(unitCost(s));
    expect(marketPrice(later)).toBeCloseTo(getSegment(s.company.segment).refPrice * costIndex(later));
  });
});

describe('saves antigos e conquistas', () => {
  it('partidas antigas continuam abrindo: unidades viram filiais na cidade da sede', () => {
    const current = newGame();
    const { homeCity: _h, branches: _b, supplier: _s, loyalty: _l, insurance: _i, savings: _v, goal: _g, goalsDone: _d, ...old } = current;
    const legacy = { ...old, units: 3, scopeLevel: 3, employees: { atendente: 2, vendedor: 1, marketing: 0, desenvolvedor: 0, gerente: 0 } } as unknown as GameState;
    const m = migrateGame(legacy);
    expect(m.homeCity).toBe('sao-paulo');
    expect(m.branches).toHaveLength(2);
    expect(m.branches.every((b) => b.city === 'sao-paulo')).toBe(true);
    expect(m.scopeLevel).toBe(1);
    expect(m.employees.financeiro).toBe(0);
    expect(m.supplier).toBe('padrao');
    expect('units' in m).toBe(false);
    // e o jogo segue normalmente
    expect(() => advanceMonth(m)).not.toThrow();
    expect(getCity(m.homeCity)).toBeDefined();
  });

  it('há mais de 50 conquistas, todas com categoria e id único', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    const cats = new Set(ACHIEVEMENT_CATEGORIES.map((c) => c.id));
    for (const a of ACHIEVEMENTS) expect(cats.has(a.category)).toBe(true);
  });
});
