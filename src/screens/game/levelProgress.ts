import { LEVELS } from '../../game/data';
import { employeeCount } from '../../game/simulation';
import type { GameState } from '../../game/types';

export interface Requirement {
  label: string;
  current: number;
  target: number;
  done: boolean;
  format: 'money' | 'number';
}

/** Lista os requisitos do próximo nível (ou null se já está no máximo). */
export function nextLevelRequirements(s: GameState): Requirement[] | null {
  const next = LEVELS[s.level];
  if (!next) return null;
  const r = next.requirements;
  const list: Requirement[] = [
    { label: 'Receita acumulada', current: s.totalRevenue, target: r.revenue, done: s.totalRevenue >= r.revenue, format: 'money' },
    { label: 'Clientes conquistados', current: s.customersTotal, target: r.customers, done: s.customersTotal >= r.customers, format: 'number' },
  ];
  if (r.reputation !== undefined) list.push({ label: 'Reputação', current: s.reputation, target: r.reputation, done: s.reputation >= r.reputation, format: 'number' });
  if (r.satisfaction !== undefined)
    list.push({ label: 'Satisfação dos clientes', current: s.satisfaction, target: r.satisfaction, done: s.satisfaction >= r.satisfaction, format: 'number' });
  if (r.employees !== undefined) list.push({ label: 'Funcionários', current: employeeCount(s), target: r.employees, done: employeeCount(s) >= r.employees, format: 'number' });
  if (r.expansions !== undefined) {
    const exp = s.units - 1 + s.scopeLevel;
    list.push({ label: 'Expansões (unidades ou mercados)', current: exp, target: r.expansions, done: exp >= r.expansions, format: 'number' });
  }
  return list;
}

export function levelProgress(s: GameState): number | null {
  const reqs = nextLevelRequirements(s);
  if (!reqs) return null;
  return reqs.reduce((sum, r) => sum + Math.min(1, r.target > 0 ? r.current / r.target : 1), 0) / reqs.length;
}
