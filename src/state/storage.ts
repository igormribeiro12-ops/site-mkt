import { getSegment } from '../game/data';
import { DEFAULT_AVATAR } from '../game/engine';
import { DEFAULT_HOME_CITY } from '../game/geo';
import { migrateGame } from '../game/migrate';
import type { GameState, SetupDraft } from '../game/types';

export const SAVE_KEY = 'startup-tycoon:save:v2';
export const DRAFT_KEY = 'startup-tycoon:setup:v2';
export const CLOCK_KEY = 'startup-tycoon:clock:v2';

export function emptyDraft(): SetupDraft {
  return {
    step: 0,
    avatar: { ...DEFAULT_AVATAR },
    playerName: '',
    difficulty: 'normal',
    segment: '',
    name: '',
    slogan: '',
    description: '',
    product: '',
    differential: '',
    logo: { primary: '#3b82f6', secondary: '#8b5cf6', icon: 'rocket', shape: 'rounded', font: 'grotesk', layout: 'horizontal' },
    designPackage: 'freelancer',
    structure: 'home',
    productTier: 'bom',
    price: null,
    homeCity: DEFAULT_HOME_CITY,
  };
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Carrega a partida salva, descartando dados corrompidos ou de outra versão. */
export function loadGame(): GameState | null {
  const data = read<GameState>(SAVE_KEY);
  if (!data || data.version !== 1 || !data.company || !data.player || !data.world || !data.avatar) return null;
  if (!getSegment(data.company.segment)) return null;
  return migrateGame({ ...data, avatar: { ...DEFAULT_AVATAR, ...data.avatar } });
}

export function saveGame(state: GameState): boolean {
  return write(SAVE_KEY, state);
}

export function clearGame(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // sem acesso ao armazenamento
  }
}

export function loadDraft(): SetupDraft {
  const data = read<SetupDraft>(DRAFT_KEY);
  return data ? { ...emptyDraft(), ...data, avatar: { ...DEFAULT_AVATAR, ...data.avatar }, logo: { ...emptyDraft().logo, ...data.logo } } : emptyDraft();
}

export function saveDraft(draft: SetupDraft): void {
  write(DRAFT_KEY, draft);
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // sem acesso ao armazenamento
  }
}

export interface SavedClock {
  minute: number;
  day: number;
  month: number;
}

export function loadClock(): SavedClock | null {
  const c = read<SavedClock>(CLOCK_KEY);
  return c && typeof c.minute === 'number' ? c : null;
}

export function saveClock(clock: SavedClock): void {
  write(CLOCK_KEY, clock);
}

export function clearClock(): void {
  try {
    window.localStorage.removeItem(CLOCK_KEY);
  } catch {
    // sem acesso ao armazenamento
  }
}
