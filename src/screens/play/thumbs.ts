// Miniaturas (imagens) geradas a partir da arte do jogo, para os painéis.

import { type Look, renderCharacterFrame } from '../../world/art/characters';
import { renderFurniture } from '../../world/art/furnitureArt';

const cache = new Map<string, string>();

function canvasUrl(key: string, make: () => HTMLCanvasElement | null): string {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let url = '';
  try {
    const canvas = make();
    url = canvas ? canvas.toDataURL('image/png') : '';
  } catch {
    url = '';
  }
  cache.set(key, url);
  return url;
}

export function furnitureThumb(type: string, accent: string): string {
  return canvasUrl(`f-${type}-${accent}`, () => renderFurniture(type, accent)?.canvas ?? null);
}

export function characterThumb(look: Look, frame = 'idle-down-0', scale = 2): string {
  return canvasUrl(`c-${JSON.stringify(look)}-${frame}-${scale}`, () => renderCharacterFrame(look, frame, scale));
}
