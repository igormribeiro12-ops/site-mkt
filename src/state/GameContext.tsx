import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createGame, type ActionResult } from '../game/engine';
import type { GameState, SetupDraft } from '../game/types';
import { applyGameAction } from '../world/actions';
import { clearClock, clearDraft, clearGame, loadClock, loadDraft, loadGame, saveClock, saveDraft, saveGame } from './storage';
import { gameStore, patchUi, uiStore, type UiState } from './store';

interface GameContextValue {
  game: GameState | null;
  draft: SetupDraft;
  setDraft: (patch: Partial<SetupDraft>) => void;
  resetDraft: () => void;
  startGame: () => void;
  /** Executa uma ação que pode falhar (mostra o aviso de sucesso ou erro). */
  act: (fn: (s: GameState) => ActionResult) => boolean;
  /** Atualização direta, sem mensagem. */
  update: (fn: (s: GameState) => GameState) => void;
  deleteGame: () => void;
  saveNow: () => boolean;
  lastSavedAt: Date | null;
}

const GameContext = createContext<GameContextValue | null>(null);

/** Carrega a partida salva (uma vez) para o estado compartilhado. */
function hydrate() {
  if (gameStore.get()) return;
  const saved = loadGame();
  if (!saved) return;
  gameStore.set(saved);
  const clock = loadClock();
  if (clock && clock.month === saved.month && clock.day === saved.world.day) patchUi({ minute: clock.minute, day: clock.day });
  else patchUi({ minute: 8 * 60, day: saved.world.day });
}

export function GameProvider({ children }: { children: ReactNode }) {
  useState(hydrate);
  const game = useSyncExternalStore(gameStore.subscribe, gameStore.get);
  const [draft, setDraftState] = useState<SetupDraft>(() => loadDraft());
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Salvamento automático (com um pequeno intervalo para não gravar a cada quadro).
  useEffect(() => {
    if (!game) return;
    const id = window.setTimeout(() => {
      if (saveGame(game)) setLastSavedAt(new Date());
    }, 400);
    return () => window.clearTimeout(id);
  }, [game]);

  // O horário do dia também é salvo, para continuar de onde parou.
  useEffect(() => {
    const id = window.setInterval(() => {
      const g = gameStore.get();
      if (g) saveClock({ minute: uiStore.get().minute, day: g.world.day, month: g.month });
    }, 3000);
    const flush = () => {
      const g = gameStore.get();
      if (!g) return;
      saveGame(g);
      saveClock({ minute: uiStore.get().minute, day: g.world.day, month: g.month });
    };
    window.addEventListener('beforeunload', flush);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const setDraft = useCallback((patch: Partial<SetupDraft>) => setDraftState((d) => ({ ...d, ...patch })), []);
  const resetDraft = useCallback(() => {
    clearDraft();
    setDraftState(loadDraft());
  }, []);

  const startGame = useCallback(() => {
    const created = createGame(draft);
    clearClock();
    gameStore.set(created);
    patchUi({ minute: 7 * 60 + 40, day: created.world.day, speed: 1, resumeSpeed: 1, panel: null, dialog: null, scene: 'office', buildItem: null, editMode: false, pendingRevenue: 0, monthReportOpen: false });
    clearDraft();
    setDraftState(loadDraft());
  }, [draft]);

  const act = useCallback((fn: (s: GameState) => ActionResult) => applyGameAction(fn), []);

  const update = useCallback((fn: (s: GameState) => GameState) => {
    gameStore.set((g) => (g ? fn(g) : g));
  }, []);

  const deleteGame = useCallback(() => {
    clearGame();
    clearClock();
    gameStore.set(null);
  }, []);

  const saveNow = useCallback(() => {
    const current = gameStore.get();
    if (!current) return false;
    const ok = saveGame(current);
    saveClock({ minute: uiStore.get().minute, day: current.world.day, month: current.month });
    if (ok) setLastSavedAt(new Date());
    return ok;
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({ game, draft, setDraft, resetDraft, startGame, act, update, deleteGame, saveNow, lastSavedAt }),
    [game, draft, setDraft, resetDraft, startGame, act, update, deleteGame, saveNow, lastSavedAt],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de <GameProvider>.');
  return ctx;
}

/** Atalho para telas que só existem com uma partida em andamento. */
export function useActiveGame(): GameContextValue & { game: GameState } {
  const ctx = useGame();
  if (!ctx.game) throw new Error('Nenhuma partida em andamento.');
  return ctx as GameContextValue & { game: GameState };
}

/** Lê um pedaço do estado visual (relógio, painel aberto...). */
export function useUi<T>(select: (u: UiState) => T): T {
  return useSyncExternalStore(uiStore.subscribe, () => select(uiStore.get()));
}
