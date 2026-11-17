import { describe, expect, it } from 'vitest';
import { balanced, draft, passive, play, reckless } from '../test/bots';
import { ACHIEVEMENTS } from './achievements';
import { MONTH_LIMIT, SEGMENTS, STARTING_CAPITAL } from './data';
import {
  advanceMonth,
  computeLevel,
  createGame,
  defeatReason,
  hire,
  investRD,
  resolveEvent,
  saveCampaign,
  setupCosts,
  takeLoan,
  upgradeInfra,
} from './engine';
import { EVENTS, isChoiceAvailable, rollEvent } from './events';
import { computeScore } from './scoring';
import { estimateCampaign, plannedCosts, simulateMonth } from './simulation';
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
    expect(s.cash).toBe(STARTING_CAPITAL - costs.total);
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
    expect(planned.salaries).toBe(1600);
    expect(planned.marketing).toBe(300);
    const r = simulateMonth(s).report;
    expect(r.costs.salaries).toBe(1600);
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
    const s = { ...newGame(), totalRevenue: 6000, customersTotal: 60 };
    expect(computeLevel(s)).toBe(2);
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
      employees: { atendente: 1, vendedor: 1, marketing: 0, desenvolvedor: 1, gerente: 0 },
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

  it('em média, uma boa estratégia vence em até 20 meses', () => {
    expect(winMonths).toHaveLength(SEGMENTS.length);
    const avg = winMonths.reduce((a, b) => a + b, 0) / winMonths.length;
    expect(avg).toBeLessThanOrEqual(20);
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
