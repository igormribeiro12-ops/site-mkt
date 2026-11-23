// Atualiza partidas salvas em versões anteriores do jogo para o formato atual:
// as antigas "unidades" viram filiais na cidade da sede, os mercados "Estado" e
// "Brasil" (que agora vêm das filiais) voltam para "Cidade toda", e as funções
// novas começam desligadas.

import { BRANCH_RAMP_MONTHS, SCOPES } from './data';
import { emptyTeam } from './engine';
import { DEFAULT_HOME_CITY, getCity } from './geo';
import { createId } from './id';
import type { Branch, CostBreakdown, GameState, MonthReport } from './types';

type LegacyState = GameState & { units?: number };

function fixCosts(c: CostBreakdown): CostBreakdown {
  return { ...c, services: c.services ?? 0 };
}

function fixReport(r: MonthReport): MonthReport {
  return { ...r, costs: fixCosts(r.costs), savingsIncome: r.savingsIncome ?? 0, goal: r.goal ?? null };
}

export function migrateGame(raw: GameState): GameState {
  const data = raw as LegacyState;
  const homeCity = data.homeCity && getCity(data.homeCity) ? data.homeCity : DEFAULT_HOME_CITY;
  let branches: Branch[] = Array.isArray(data.branches) ? data.branches.filter((b) => b && getCity(b.city)) : [];
  if (!Array.isArray(data.branches) && typeof data.units === 'number' && data.units > 1) {
    // Unidades antigas já estavam funcionando: entram como filiais maduras.
    const month = Math.max(1, (data.month ?? 1) - BRANCH_RAMP_MONTHS);
    branches = Array.from({ length: data.units - 1 }, () => ({ id: createId('filial'), city: homeCity, month }));
  }
  const { units: _units, ...rest } = data;
  const monthAcc = rest.world?.monthAcc ? { ...rest.world.monthAcc, costs: fixCosts(rest.world.monthAcc.costs) } : (rest.world?.monthAcc ?? null);
  return {
    ...rest,
    homeCity,
    branches,
    scopeLevel: Math.min(Math.max(0, rest.scopeLevel ?? 0), SCOPES.length - 1),
    supplier: rest.supplier ?? 'padrao',
    loyalty: rest.loyalty ?? 0,
    insurance: rest.insurance ?? false,
    savings: rest.savings ?? 0,
    goal: rest.goal ?? null,
    goalsDone: rest.goalsDone ?? 0,
    employees: { ...emptyTeam(), ...rest.employees },
    history: (rest.history ?? []).map(fixReport),
    world: { ...rest.world, monthAcc },
  };
}
