// Estado compartilhado entre o motor 2D (Phaser) e a interface (React).
// A partida fica em `gameStore` (salva no navegador); o estado visual
// passageiro (relógio, painéis abertos, modo de construção) fica em `uiStore`.

import type { GameState } from '../game/types';

type Listener = () => void;

export interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set: (next) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const gameStore = createStore<GameState | null>(null);

export type Speed = 0 | 1 | 2 | 4;
export type PanelId = 'build' | 'hire' | 'shop' | 'marketing' | 'computer' | 'missions' | 'decor' | 'pause' | 'howto' | null;

export interface DialogChoice {
  id: string;
  label: string;
  hint?: string;
  cost?: number;
  disabled?: boolean;
  disabledReason?: string;
}

export interface DialogState {
  speaker: string;
  role?: string;
  portrait?: string;
  text: string;
  choices?: DialogChoice[];
  /** Identifica a origem (ex.: evento) para tratar a escolha. */
  kind: 'event' | 'talk' | 'outcome' | 'intro';
}

export interface UiState {
  minute: number;
  day: number;
  speed: Speed;
  /** Velocidade escolhida antes de um painel pausar o jogo. */
  resumeSpeed: Speed;
  panel: PanelId;
  computerApp: string;
  dialog: DialogState | null;
  scene: 'office' | 'city';
  buildItem: string | null;
  editMode: boolean;
  pendingRevenue: number;
  monthReportOpen: boolean;
  missionFlash: string | null;
}

export const uiStore = createStore<UiState>({
  minute: 8 * 60,
  day: 1,
  speed: 1,
  resumeSpeed: 1,
  panel: null,
  computerApp: 'painel',
  dialog: null,
  scene: 'office',
  buildItem: null,
  editMode: false,
  pendingRevenue: 0,
  monthReportOpen: false,
  missionFlash: null,
});

export function patchUi(patch: Partial<UiState>) {
  uiStore.set((u) => ({ ...u, ...patch }));
}

/** O tempo só corre quando nenhuma janela ou diálogo está aberto. */
export function isTimeRunning(u: UiState = uiStore.get()): boolean {
  return u.speed > 0 && !u.panel && !u.dialog && !u.monthReportOpen && !u.buildItem;
}
