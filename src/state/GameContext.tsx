import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getAchievement } from '../game/achievements';
import { advanceMonth, createGame, resolveEvent, type ActionResult } from '../game/engine';
import type { GameState, MonthReport, SetupDraft } from '../game/types';
import { clearDraft, clearGame, loadDraft, loadGame, saveDraft, saveGame } from './storage';
import { useToast } from './ToastContext';

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
  advance: () => MonthReport | null;
  resolve: (choiceId: string) => string | null;
  deleteGame: () => void;
  saveNow: () => boolean;
  lastSavedAt: Date | null;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  const [draft, setDraftState] = useState<SetupDraft>(() => loadDraft());
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    if (game && saveGame(game)) setLastSavedAt(new Date());
  }, [game]);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const announceAchievements = useCallback(
    (before: GameState, after: GameState) => {
      for (const id of Object.keys(after.achievements)) {
        if (!(id in before.achievements)) {
          const a = getAchievement(id);
          if (a) toast.achievement(`Conquista desbloqueada: ${a.title}`);
        }
      }
    },
    [toast],
  );

  const setDraft = useCallback((patch: Partial<SetupDraft>) => setDraftState((d) => ({ ...d, ...patch })), []);
  const resetDraft = useCallback(() => {
    clearDraft();
    setDraftState(loadDraft());
  }, []);

  const startGame = useCallback(() => {
    const created = createGame(draft);
    setGame(created);
    clearDraft();
    setDraftState(loadDraft());
  }, [draft]);

  const act = useCallback(
    (fn: (s: GameState) => ActionResult) => {
      const current = gameRef.current;
      if (!current) return false;
      const result = fn(current);
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      setGame(result.state);
      toast.success(result.message);
      announceAchievements(current, result.state);
      return true;
    },
    [toast, announceAchievements],
  );

  const update = useCallback((fn: (s: GameState) => GameState) => {
    setGame((g) => (g ? fn(g) : g));
  }, []);

  const advance = useCallback(() => {
    const current = gameRef.current;
    if (!current) return null;
    try {
      const { state, report } = advanceMonth(current);
      setGame(state);
      return report;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível avançar.');
      return null;
    }
  }, [toast]);

  const resolve = useCallback(
    (choiceId: string) => {
      const current = gameRef.current;
      if (!current) return null;
      const result = resolveEvent(current, choiceId);
      if (!result.ok) {
        toast.error(result.error);
        return null;
      }
      setGame(result.state);
      announceAchievements(current, result.state);
      return result.message;
    },
    [toast, announceAchievements],
  );

  const deleteGame = useCallback(() => {
    clearGame();
    setGame(null);
  }, []);

  const saveNow = useCallback(() => {
    const current = gameRef.current;
    if (!current) return false;
    const ok = saveGame(current);
    if (ok) setLastSavedAt(new Date());
    return ok;
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({ game, draft, setDraft, resetDraft, startGame, act, update, advance, resolve, deleteGame, saveNow, lastSavedAt }),
    [game, draft, setDraft, resetDraft, startGame, act, update, advance, resolve, deleteGame, saveNow, lastSavedAt],
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
