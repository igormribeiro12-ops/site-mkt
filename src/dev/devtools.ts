// Ferramentas de desenvolvimento (só carregadas com `npm run dev`).
// Permitem iniciar uma partida de teste pelo console: __tycoon.quickStart('alimentacao')

import { createGame } from '../game/engine';
import type { SegmentId } from '../game/types';
import { emptyDraft } from '../state/storage';
import { gameStore, patchUi, uiStore } from '../state/store';

function quickStart(segment: SegmentId = 'alimentacao', overrides: Record<string, unknown> = {}) {
  const draft = {
    ...emptyDraft(),
    playerName: 'Alex',
    segment,
    name: 'Sabor da Vila',
    slogan: 'Feito com carinho',
    description: 'Um negócio do bairro feito para você',
    product: 'Produto principal',
    differential: 'Atendimento caprichado',
    price: null,
    ...overrides,
  };
  const game = createGame(draft, 12345);
  gameStore.set(game);
  patchUi({ minute: 8 * 60, day: 1, speed: 1, panel: null, dialog: null, scene: 'office', buildItem: null, editMode: false, pendingRevenue: 0, monthReportOpen: false });
  return game;
}

(window as unknown as Record<string, unknown>).__tycoon = { gameStore, uiStore, patchUi, quickStart };
