// Planeja os clientes que aparecem no cenário ao longo do expediente, a partir
// da simulação da economia. Cada cliente visível representa uma fração da
// receita do dia; o valor real é calculado no fechamento do dia.

import { simulateDay } from '../game/simulation';
import type { GameState } from '../game/types';
import { CLOSE, OPEN } from './clock';

export interface CustomerPlan {
  /** Minutos do dia em que cada cliente chega (negativo = vai embora sem comprar). */
  times: number[];
  /** Valor exibido para cada compra. */
  value: number;
}

export function planCustomers(state: GameState, minuteNow: number, fraction: number): CustomerPlan {
  if (state.phase !== 'playing' || fraction <= 0) return { times: [], value: 0 };
  const preview = simulateDay(state).day;
  const buyers = preview.unitsSold;
  const k = buyers < 0.3 ? 0 : Math.min(12, Math.max(1, Math.round(buyers <= 6 ? buyers : 6 + Math.sqrt(buyers - 6))));
  const value = k ? preview.revenue / k : 0;
  const remaining = Math.round(k * fraction);
  const angry = preview.unmetOrders > 0.5 ? Math.min(3, Math.round(1 + Math.sqrt(preview.unmetOrders) / 3)) : 0;
  const angryLeft = Math.round(angry * fraction);
  const start = Math.max(minuteNow, OPEN + 10);
  const end = CLOSE - 50;
  const times: number[] = [];
  if (end <= start) return { times, value };
  for (let i = 0; i < remaining + angryLeft; i++) {
    const t = start + Math.random() * (end - start);
    times.push(i < remaining ? t : -t);
  }
  times.sort((a, b) => Math.abs(a) - Math.abs(b));
  return { times, value };
}
