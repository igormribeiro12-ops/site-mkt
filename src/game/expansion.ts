// Expansão pelo Brasil: filiais na cidade da sede, em outras cidades e em
// outros estados. Aqui ficam as regras (custos, desbloqueios e efeitos no
// mercado); as ações do jogador estão em engine.ts.

import {
  BRANCH_RAMP_MONTHS,
  BRANCH_UNLOCK,
  MAX_HOME_UNITS,
  NATIONAL_UNLOCK,
  NEW_UNIT_COST,
  NEW_UNIT_RENT,
  NEW_UNIT_UNLOCK,
  REGION_FEE,
  SCOPES,
  STATE_FEE,
} from './data';
import { money } from './format';
import { type CityDef, type RegionId, CITIES, DEFAULT_HOME_CITY, STATES, getCity, getState, marketFactor, regionOfCity } from './geo';
import type { Branch, GameState } from './types';

export function homeCity(s: GameState): CityDef {
  return getCity(s.homeCity) ?? getCity(DEFAULT_HOME_CITY)!;
}

/** Filiais em outros bairros da cidade da sede. */
export function homeUnits(s: GameState): Branch[] {
  return s.branches.filter((b) => b.city === s.homeCity);
}

/** Sede + filiais. */
export function unitCount(s: GameState): number {
  return 1 + s.branches.length;
}

export function presentCities(s: GameState): Set<string> {
  return new Set([homeCity(s).id, ...s.branches.map((b) => b.city)]);
}

export function presentStates(s: GameState): Set<string> {
  return new Set([...presentCities(s)].map((id) => getCity(id)?.uf).filter((uf): uf is string => Boolean(uf)));
}

export function presentRegions(s: GameState): Set<RegionId> {
  return new Set([...presentStates(s)].map((uf) => getState(uf)!.region));
}

/** Regiões em que a empresa está em todos os estados. */
export function completeRegions(s: GameState): RegionId[] {
  const states = presentStates(s);
  const regions = new Set(STATES.map((st) => st.region));
  return [...regions].filter((r) => STATES.filter((st) => st.region === r).every((st) => states.has(st.uf)));
}

/** De 0 a 1: a filial leva alguns meses para conquistar a clientela da cidade. */
export function branchRamp(s: GameState, b: Branch): number {
  return Math.min(1, Math.max(0, (s.month - b.month + 1) / BRANCH_RAMP_MONTHS));
}

/** Quanto a filial soma ao mercado (em "bairros"). */
export function branchMarket(s: GameState, b: Branch): number {
  const city = getCity(b.city);
  if (!city) return 0;
  const base = b.city === s.homeCity ? 0.25 : marketFactor(city);
  return base * branchRamp(s, b);
}

/** Tamanho do mercado alcançado, em múltiplos do mercado de um bairro. */
export function marketReach(s: GameState): number {
  return SCOPES[Math.min(s.scopeLevel, SCOPES.length - 1)].multiplier + s.branches.reduce((sum, b) => sum + branchMarket(s, b), 0);
}

/** Aluguel e equipe local de uma filial, por mês (antes da inflação). */
export function branchMonthlyCost(s: GameState, cityId: string): number {
  const city = getCity(cityId);
  if (!city || cityId === s.homeCity) return NEW_UNIT_RENT;
  return Math.round((1400 + 1500 * marketFactor(city)) / 100) * 100;
}

export function branchesMonthlyCost(s: GameState): number {
  return s.branches.reduce((sum, b) => sum + branchMonthlyCost(s, b.city), 0);
}

/** Concorrência extra: grandes centros têm mais concorrentes. */
export function expansionCompetition(s: GameState): number {
  const extra = [...presentCities(s)]
    .filter((id) => id !== s.homeCity)
    .reduce((sum, id) => {
      const c = getCity(id);
      return sum + (c ? Math.round(marketFactor(c) * 1.6) : 0);
    }, 0);
  return Math.min(15, extra);
}

export interface OpenCost {
  total: number;
  base: number;
  stateFee: number;
  regionFee: number;
}

export function branchOpenCost(s: GameState, cityId: string): OpenCost {
  const city = getCity(cityId);
  if (!city) return { total: 0, base: 0, stateFee: 0, regionFee: 0 };
  if (cityId === s.homeCity) {
    const base = NEW_UNIT_COST * (homeUnits(s).length + 1);
    return { total: base, base, stateFee: 0, regionFee: 0 };
  }
  const base = Math.round((9000 + 10000 * marketFactor(city)) / 100) * 100;
  const stateFee = presentStates(s).has(city.uf) ? 0 : STATE_FEE;
  const regionFee = presentRegions(s).has(regionOfCity(city)) ? 0 : REGION_FEE;
  return { total: base + stateFee + regionFee, base, stateFee, regionFee };
}

/** Nível exigido para abrir uma filial na cidade. */
export function cityUnlockLevel(s: GameState, cityId: string): number {
  const city = getCity(cityId);
  if (!city) return 99;
  if (cityId === s.homeCity) return NEW_UNIT_UNLOCK;
  const home = homeCity(s);
  if (city.uf === home.uf || regionOfCity(city) === regionOfCity(home)) return BRANCH_UNLOCK;
  return NATIONAL_UNLOCK;
}

export type CityStatus = 'sede' | 'aberta' | 'disponivel' | 'bloqueada';

export interface CityCheck {
  status: CityStatus;
  /** Por que não dá para abrir (quando bloqueada ou já aberta). */
  reason: string | null;
}

export function checkCity(s: GameState, cityId: string): CityCheck {
  const city = getCity(cityId);
  if (!city) return { status: 'bloqueada', reason: 'Cidade desconhecida.' };
  const isHome = cityId === s.homeCity;
  if (!isHome && s.branches.some((b) => b.city === cityId)) return { status: 'aberta', reason: 'Você já tem uma filial aqui.' };
  if (isHome && homeUnits(s).length >= MAX_HOME_UNITS) return { status: 'sede', reason: `Limite de ${MAX_HOME_UNITS} filiais na cidade da sede.` };
  const level = cityUnlockLevel(s, cityId);
  if (s.level < level) {
    const where = isHome ? 'Novas unidades na sua cidade' : level === BRANCH_UNLOCK ? 'Filiais no seu estado e na sua região' : 'Filiais no resto do Brasil';
    return { status: isHome ? 'sede' : 'bloqueada', reason: `${where} liberam no nível ${level}.` };
  }
  if (s.scopeLevel < 1) return { status: isHome ? 'sede' : 'bloqueada', reason: `Primeiro conquiste a sua cidade: expanda para a ${SCOPES[1].label.toLowerCase()} (${money(SCOPES[1].cost)}).` };
  return { status: isHome ? 'sede' : 'disponivel', reason: null };
}

/** Cidades onde dá para abrir filial agora (sem olhar o caixa). */
export function openableCities(s: GameState): CityDef[] {
  return CITIES.filter((c) => checkCity(s, c.id).reason === null);
}

/** Valor que volta para o caixa ao fechar uma filial (venda de equipamentos e ponto). */
export function branchCloseRefund(s: GameState, b: Branch): number {
  const city = getCity(b.city);
  if (!city) return 0;
  const base = b.city === s.homeCity ? NEW_UNIT_COST : Math.round((9000 + 10000 * marketFactor(city)) / 100) * 100;
  return Math.round(base * 0.3);
}
