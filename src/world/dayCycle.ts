// Ciclo do dia, compartilhado pelas cenas: avança o relógio, abre a loja às 8h,
// fecha às 18h (calculando o dia na economia) e passa a noite rapidamente.

import { advanceDay, type DayOutcome } from '../game/engine';
import { gameStore, isTimeRunning, patchUi, uiStore } from '../state/store';
import { CLOSE, DAY_RATE, NIGHT_RATE, OPEN, isBusinessHours } from './clock';
import { LEVELS } from '../game/data';
import { getAchievement } from '../game/achievements';
import { notifyMissions } from './actions';
import { EV, bus, toast } from './bus';

export interface TickResult {
  opened: boolean;
  closed: DayOutcome | null;
}

/** Avança o relógio global. Retorna se a loja abriu ou fechou neste quadro. */
export function tickClock(deltaMs: number): TickResult {
  const ui = uiStore.get();
  const result: TickResult = { opened: false, closed: null };
  const game = gameStore.get();
  if (!game || game.phase !== 'playing' || !isTimeRunning(ui)) return result;
  const rate = isBusinessHours(ui.minute) ? DAY_RATE : NIGHT_RATE;
  let minute = ui.minute + (deltaMs / 1000) * rate * ui.speed;
  const before = ui.minute;
  if (before < CLOSE && minute >= CLOSE) {
    minute = CLOSE;
    result.closed = closeBusinessDay();
  } else if (minute >= 1440) {
    minute -= 1440;
  }
  if (before < OPEN && minute >= OPEN) {
    minute = OPEN;
    result.opened = true;
  }
  if (Math.floor(minute) !== Math.floor(before) || result.closed || result.opened) patchUi({ minute });
  else uiStore.get().minute = minute; // atualização silenciosa (sem re-render)
  return result;
}

/** Fecha o dia na economia e avisa a interface. */
export function closeBusinessDay(): DayOutcome | null {
  const game = gameStore.get();
  if (!game) return null;
  const outcome = advanceDay(game);
  gameStore.set(outcome.state);
  patchUi({ pendingRevenue: 0, day: outcome.state.world.day, monthReportOpen: Boolean(outcome.report) });
  bus.emit(EV.dayClosed, outcome);
  notifyMissions(game, outcome.state);
  if (outcome.levelUp) toast('achievement', `Nova fase da empresa: ${(LEVELS.find((l) => l.level === outcome.levelUp)?.title ?? '')}!`);
  for (const id of outcome.achievements) {
    const a = getAchievement(id);
    if (a) toast('achievement', `Conquista: ${a.title}`);
  }
  return outcome;
}

/** Fração do expediente que ainda falta (1 = o dia está começando). */
export function remainingDayFraction(minute = uiStore.get().minute): number {
  if (minute < OPEN) return 1;
  if (minute >= CLOSE) return 0;
  return (CLOSE - minute) / (CLOSE - OPEN);
}
