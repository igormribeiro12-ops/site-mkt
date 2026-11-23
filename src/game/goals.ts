// Desafio do mês: a cada mês (a partir do 2º) a empresa recebe uma meta com
// recompensa em dinheiro e reputação. A meta é sorteada com a semente da
// partida e calibrada pelo resultado do mês anterior.

import { clamp, money, num } from './format';
import { rngFor } from './rng';
import type { GameState, GoalKind, GoalResult, MonthReport, MonthlyGoal } from './types';

export const GOAL_INFO: Record<GoalKind, { title: string; describe: (target: number) => string; format: 'number' | 'money' | 'percent' }> = {
  clientes: { title: 'Atrair clientes', describe: (t) => `Conquistar ${num(t)} clientes novos neste mês`, format: 'number' },
  receita: { title: 'Bater a meta de vendas', describe: (t) => `Faturar ${money(t)} neste mês`, format: 'money' },
  lucro: { title: 'Mês lucrativo', describe: (t) => `Fechar o mês com ${money(t)} de lucro`, format: 'money' },
  satisfacao: { title: 'Clientes encantados', describe: (t) => `Terminar o mês com ${num(t)}% de satisfação`, format: 'percent' },
  seguidores: { title: 'Bombar nas redes', describe: (t) => `Ganhar ${num(t)} seguidores neste mês`, format: 'number' },
};

export function describeGoal(g: MonthlyGoal): string {
  return GOAL_INFO[g.kind].describe(g.target);
}

const round = (v: number, step: number) => Math.round(v / step) * step;

/** Cria o desafio do mês atual com base no último relatório. */
export function createGoal(s: GameState): MonthlyGoal | null {
  const last = s.history[s.history.length - 1];
  if (!last || s.phase !== 'playing') return null;
  const kinds: GoalKind[] = ['clientes', 'receita', 'satisfacao', 'seguidores'];
  if (last.profit > 0) kinds.push('lucro', 'lucro');
  const rnd = rngFor(s.seed, s.month, 5);
  const kind = kinds[Math.floor(rnd() * kinds.length)];
  let target = 0;
  if (kind === 'clientes') target = Math.max(15, round(last.newCustomers * 1.2, 5));
  else if (kind === 'receita') target = Math.max(2000, round(last.revenue * 1.15, 100));
  else if (kind === 'lucro') target = Math.max(500, round(last.profit * 1.2, 100));
  else if (kind === 'satisfacao') target = Math.round(clamp(Math.max(70, last.satisfaction + 4), 70, 92));
  else target = Math.max(150, round(last.followersGained * 1.3, 10));
  const reward = round(clamp(last.revenue * 0.08, 500, 15000), 100);
  return { month: s.month, kind, target, reward };
}

/** Valor atual do desafio (no meio do mês usa o acumulado dos dias). */
export function goalValue(s: GameState, g: MonthlyGoal, report?: MonthReport): number {
  if (report) {
    if (g.kind === 'clientes') return report.newCustomers;
    if (g.kind === 'receita') return report.revenue;
    if (g.kind === 'lucro') return report.profit;
    if (g.kind === 'satisfacao') return report.satisfaction;
    return report.followersGained;
  }
  const acc = s.world.monthAcc;
  if (g.kind === 'satisfacao') return s.satisfaction;
  if (!acc) return 0;
  if (g.kind === 'clientes') return acc.newCustomers;
  if (g.kind === 'receita') return acc.revenue;
  if (g.kind === 'lucro') return acc.profit;
  return acc.followersGained;
}

/** Confere o desafio do mês que acabou de fechar e paga a recompensa. */
export function settleGoal(s: GameState, report: MonthReport): { state: GameState; result: GoalResult | null } {
  const g = s.goal;
  if (!g || g.month !== report.month) return { state: s, result: null };
  const value = goalValue(s, g, report);
  const achieved = value >= g.target;
  const result: GoalResult = { ...g, achieved, value };
  if (!achieved) return { state: { ...s, goal: null }, result };
  return {
    state: { ...s, goal: null, cash: s.cash + g.reward, reputation: clamp(s.reputation + 2, 0, 100), goalsDone: s.goalsDone + 1 },
    result,
  };
}
