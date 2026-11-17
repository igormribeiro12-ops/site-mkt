// Registra no Phaser as texturas geradas em canvas (personagens, móveis, cenário).

import Phaser from 'phaser';
import { CH, CW, FRAMES, type Look, renderCharacterSheet } from './art/characters';
import { chairArt, renderFurniture, type FurnitureArt } from './art/furnitureArt';
import * as env from './art/environmentArt';

/** Chave estável para uma aparência (mesma aparência = mesma textura). */
export function lookKey(look: Look): string {
  return `char-${[look.gender ?? 'masculino', look.beard ? 'b' : '', look.skirt ? 's' : '', look.skin, look.hairStyle, look.hairColor, look.shirt, look.pants, look.style, look.glasses ? 1 : 0, look.apron ?? '', look.accessory ?? ''].join('-')}`;
}

const ANIMS: { name: string; frames: string[]; rate: number; repeat: number }[] = [
  ...(['down', 'up', 'right', 'left'] as const).map((d) => ({ name: `walk-${d}`, frames: [0, 1, 2, 3].map((i) => `walk-${d}-${i}`), rate: 8, repeat: -1 })),
  { name: 'idle-down', frames: ['idle-down-0', 'idle-down-1'], rate: 1.6, repeat: -1 },
  { name: 'idle-up', frames: ['idle-up-0'], rate: 1, repeat: -1 },
  { name: 'idle-right', frames: ['idle-right-0'], rate: 1, repeat: -1 },
  { name: 'idle-left', frames: ['idle-left-0'], rate: 1, repeat: -1 },
  { name: 'sit-up', frames: ['sit-up-0', 'sit-up-1'], rate: 5, repeat: -1 },
  { name: 'workup', frames: ['workup-0', 'workup-1'], rate: 4, repeat: -1 },
  { name: 'work-down', frames: ['work-down-0', 'work-down-1'], rate: 4, repeat: -1 },
  { name: 'talk', frames: ['talk-0', 'talk-1'], rate: 4, repeat: -1 },
  { name: 'cheer', frames: ['cheer-0', 'cheer-1'], rate: 5, repeat: -1 },
  { name: 'sad', frames: ['sad-0', 'sad-1'], rate: 1.5, repeat: -1 },
  { name: 'sitfront', frames: ['sitfront-0'], rate: 1, repeat: -1 },
  { name: 'sitright', frames: ['sitright-0'], rate: 1, repeat: -1 },
  { name: 'sitleft', frames: ['sitleft-0'], rate: 1, repeat: -1 },
];

export function ensureCharacter(scene: Phaser.Scene, look: Look): string {
  const key = lookKey(look);
  if (!scene.textures.exists(key)) {
    const canvas = renderCharacterSheet(look);
    const tex = scene.textures.addCanvas(key, canvas)!;
    FRAMES.forEach((f, i) => tex.add(f.name, 0, i * CW, 0, CW, CH));
  }
  for (const a of ANIMS) {
    const animKey = `${key}:${a.name}`;
    if (scene.anims.exists(animKey)) continue;
    scene.anims.create({ key: animKey, frames: a.frames.map((frame) => ({ key, frame })), frameRate: a.rate, repeat: a.repeat });
  }
  return key;
}

const furnitureMeta = new Map<string, FurnitureArt>();

export function ensureFurniture(scene: Phaser.Scene, type: string, accent: string): { key: string; art: FurnitureArt } | null {
  const key = `furn-${type}-${accent}`;
  let art = furnitureMeta.get(key);
  if (!art) {
    const rendered = renderFurniture(type, accent);
    if (!rendered) return null;
    art = rendered;
    furnitureMeta.set(key, art);
  }
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, art.canvas);
  return { key, art };
}

function addOnce(scene: Phaser.Scene, key: string, make: () => HTMLCanvasElement) {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, make());
  return key;
}

export function ensureEnvironment(scene: Phaser.Scene, accent: string) {
  addOnce(scene, 'chair', () => chairArt());
  for (const s of ['madeira', 'piso', 'concreto', 'carpete'] as const) addOnce(scene, `floor-${s}`, () => env.floorTile(s));
  addOnce(scene, 'window', () => env.windowArt());
  addOnce(scene, `door-closed-${accent}`, () => env.doorArt(false, accent));
  addOnce(scene, `door-open-${accent}`, () => env.doorArt(true, accent));
  addOnce(scene, 'sidewalk', () => env.sidewalkTile());
  addOnce(scene, 'curb', () => env.curbTile());
  addOnce(scene, 'road', () => env.roadTile(false));
  addOnce(scene, 'road-dash', () => env.roadTile(true));
  addOnce(scene, 'grass', () => env.grassTile());
  addOnce(scene, 'grass2', () => env.grassTile(3));
  addOnce(scene, 'tree', () => env.treeArt());
  addOnce(scene, 'lamp-post', () => env.lampPostArt());
  addOnce(scene, 'bench', () => env.benchArt());
  for (const c of ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#e5e7eb', '#8b5cf6']) {
    addOnce(scene, `car-h-${c}`, () => env.carArt(c));
    addOnce(scene, `car-v-${c}`, () => env.carArt(c, true));
  }
  addOnce(scene, 'coin', () => env.coinArt());
  addOnce(scene, 'heart', () => env.heartArt());
  for (const b of ['heart', 'angry', 'question', 'alert', 'idea', 'bag', 'star', 'zzz', 'money'] as const) addOnce(scene, `bubble-${b}`, () => env.bubbleArt(b));
  addOnce(scene, 'glow', () => env.glowArt(220));
  addOnce(scene, 'glow-small', () => env.glowArt(90));
  addOnce(scene, 'dust', () => env.dustArt());
  addOnce(scene, 'sparkle', () => env.sparkleArt());
  addOnce(scene, 'sign-open', () => env.openSign(true));
  addOnce(scene, 'sign-closed', () => env.openSign(false));
  for (const c of ['#f43f5e', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f97316']) addOnce(scene, `confetti-${c}`, () => env.confettiArt(c));
}

export function ensureWall(scene: Phaser.Scene, color: string): string {
  return addOnce(scene, `wall-${color}`, () => env.wallTile(color));
}

export function ensureSign(scene: Phaser.Scene, name: string, primary: string, secondary: string): string {
  const key = `sign-${name}-${primary}-${secondary}`;
  return addOnce(scene, key, () => env.facadeSign(name, primary, secondary));
}

export const CONFETTI_COLORS = ['#f43f5e', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];
