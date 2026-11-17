import { getSegment } from '../game/data';
import type { GameState, SetupDraft } from '../game/types';

export const SAVE_KEY = 'startup-tycoon:save:v1';
export const DRAFT_KEY = 'startup-tycoon:setup:v1';

export function emptyDraft(): SetupDraft {
  return {
    step: 0,
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
  if (!data || data.version !== 1 || !data.company || !data.player) return null;
  if (!getSegment(data.company.segment)) return null;
  return data;
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
  return data ? { ...emptyDraft(), ...data, logo: { ...emptyDraft().logo, ...data.logo } } : emptyDraft();
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
