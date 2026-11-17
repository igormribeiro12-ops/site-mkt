import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { gameStore, patchUi } from '../state/store';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  // O estado do jogo é compartilhado entre telas: limpa entre os testes.
  gameStore.set(null);
  patchUi({ minute: 8 * 60, day: 1, speed: 1, resumeSpeed: 1, panel: null, dialog: null, scene: 'office', buildItem: null, editMode: false, pendingRevenue: 0, monthReportOpen: false, missionFlash: null, computerApp: 'painel' });
});

// O jsdom não desenha em canvas: devolve "sem contexto" sem poluir o console.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.toDataURL = () => '';

// APIs que não existem no jsdom.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollIntoView = vi.fn();
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver ??= ResizeObserverStub;
