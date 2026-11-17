// Página de desenvolvimento para conferir a arte gerada em código.
import { FRAMES, renderCharacterSheet, randomLook, type Look } from '../world/art/characters';
import { PAINTED_TYPES, renderFurniture, chairArt } from '../world/art/furnitureArt';
import * as env from '../world/art/environmentArt';
import { hashRandom } from '../world/art/draw';

const root = document.getElementById('root')!;
const add = (c: HTMLCanvasElement, scale = 1, label?: string) => {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:inline-block;margin:6px;vertical-align:bottom;text-align:center;font-size:10px';
  c.style.width = `${c.width * scale}px`;
  wrap.appendChild(c);
  if (label) wrap.appendChild(Object.assign(document.createElement('div'), { textContent: label }));
  root.appendChild(wrap);
};
const looks: Look[] = [
  { skin: '#e0ac69', hairStyle: 'curto', hairColor: '#3b2416', shirt: '#6d5dfc', pants: '#2f3a56', style: 'casual' },
  { skin: '#8d5524', hairStyle: 'cacheado', hairColor: '#1f1612', shirt: '#ec4899', pants: '#1e293b', style: 'criativo', glasses: true },
  { skin: '#f6d2b8', hairStyle: 'longo', hairColor: '#d6a75c', shirt: '#14b8a6', pants: '#334155', style: 'esportivo', apron: '#f97316' },
  { skin: '#b07444', hairStyle: 'coque', hairColor: '#6b3f1f', shirt: '#1e3a8a', pants: '#1f2937', style: 'social', accessory: 'briefcase' },
  { gender: 'feminino', skin: '#eab995', hairStyle: 'longo', hairColor: '#3b2416', shirt: '#ec4899', pants: '#7c3aed', style: 'casual', skirt: true },
  { gender: 'masculino', beard: true, skin: '#d39b6a', hairStyle: 'curto', hairColor: '#1f1612', shirt: '#0ea5e9', pants: '#1e293b', style: 'esportivo' },
];
const r = hashRandom('x');
for (let i = 0; i < 2; i++) looks.push(randomLook(r));
for (const l of looks) add(renderCharacterSheet(l), 1);
root.appendChild(Object.assign(document.createElement('div'), { textContent: FRAMES.map((f) => f.name).join(' · '), style: 'font-size:9px;opacity:.6' }));
const only = new URLSearchParams(location.search).get('only');
for (const t of PAINTED_TYPES.filter((x) => !only || only.split(',').includes(x))) {
  const a = renderFurniture(t, '#7c3aed');
  if (a) add(a.canvas, 1, t);
}
add(chairArt(), 1, 'chair');
for (const s of ['madeira', 'piso', 'concreto', 'carpete'] as const) add(env.floorTile(s), 1, s);
add(env.wallTile('#e9e4f5'), 1, 'wall');
add(env.windowArt(), 1, 'window');
add(env.doorArt(false, '#7c3aed'), 1, 'door');
add(env.doorArt(true, '#7c3aed'), 1, 'door open');
add(env.sidewalkTile(), 1); add(env.curbTile(), 1); add(env.roadTile(true), 1); add(env.grassTile(), 1);
add(env.treeArt(), 1); add(env.lampPostArt(), 1); add(env.benchArt(), 1); add(env.carArt('#ef4444'), 1); add(env.carArt('#3b82f6', true), 1);
for (const b of ['heart', 'angry', 'question', 'alert', 'idea', 'bag', 'star', 'zzz', 'money'] as const) add(env.bubbleArt(b), 1.5);
add(env.coinArt(), 2); add(env.facadeSign('Vibe Store', '#ec4899', '#a855f7'), 1); add(env.openSign(true), 1); add(env.glowArt(80), 1);
