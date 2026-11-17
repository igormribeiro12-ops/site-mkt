// Regras de espaço do escritório, compartilhadas pelo motor do jogo e pela cena 2D:
// tamanho do piso, porta, colisão dos móveis e garantia de que nada bloqueie a passagem.

import { ROOM_SIZES, getFurniture, type FurnitureDef, type Spot } from './furniture';
import type { PlacedItem } from './types';

export interface Tile {
  x: number;
  y: number;
}

export function roomSize(infraLevel: number): { w: number; h: number } {
  return ROOM_SIZES[Math.min(Math.max(infraLevel, 0), ROOM_SIZES.length - 1)];
}

/** Coluna da porta (no meio da parede de baixo). */
export function doorColumn(w: number): number {
  return Math.floor(w / 2);
}

/** Tile do piso logo na frente da porta, por dentro. */
export function entryTile(w: number, h: number): Tile {
  return { x: doorColumn(w), y: h - 1 };
}

export function footprint(item: { type: string; x: number; y: number }): Tile[] {
  const def = getFurniture(item.type);
  if (!def) return [];
  const tiles: Tile[] = [];
  for (let dx = 0; dx < def.w; dx++) for (let dy = 0; dy < def.h; dy++) tiles.push({ x: item.x + dx, y: item.y + dy });
  return tiles;
}

/** Grade de tiles bloqueados (true = não dá para andar). */
export function blockedGrid(items: PlacedItem[], w: number, h: number, ignoreId?: string): boolean[][] {
  const grid = Array.from({ length: h }, () => Array<boolean>(w).fill(false));
  for (const item of items) {
    if (item.id === ignoreId) continue;
    const def = getFurniture(item.type);
    if (!def || def.walkable) continue;
    for (const t of footprint(item)) if (t.y >= 0 && t.y < h && t.x >= 0 && t.x < w) grid[t.y][t.x] = true;
  }
  return grid;
}

/** Tile onde o personagem fica para usar o móvel (e o tile de aproximação, se for assento). */
export function spotTiles(item: { x: number; y: number }, spot: Spot): { stand: Tile; approach: Tile } {
  const stand = { x: item.x + spot.dx, y: item.y + spot.dy };
  return { stand, approach: spot.seat ? { x: stand.x, y: stand.y + 1 } : stand };
}

function reachableFrom(start: Tile, grid: boolean[][]): boolean[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const seen = Array.from({ length: h }, () => Array<boolean>(w).fill(false));
  if (grid[start.y]?.[start.x] !== false) return seen;
  const queue = [start];
  seen[start.y][start.x] = true;
  while (queue.length) {
    const t = queue.shift()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = t.x + dx;
      const ny = t.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny][nx] || grid[ny][nx]) continue;
      seen[ny][nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

export interface PlacementCheck {
  ok: boolean;
  reason?: string;
}

/** Verifica se um móvel pode ser colocado na posição (dentro do piso, sem sobrepor e sem bloquear caminhos). */
export function canPlace(items: PlacedItem[], infraLevel: number, type: string, x: number, y: number, ignoreId?: string): PlacementCheck {
  const def: FurnitureDef | undefined = getFurniture(type);
  if (!def) return { ok: false, reason: 'Item desconhecido.' };
  const { w, h } = roomSize(infraLevel);
  if (x < 0 || y < 0 || x + def.w > w || y + def.h > h) return { ok: false, reason: 'Fora do espaço do escritório.' };

  const others = items.filter((i) => i.id !== ignoreId);
  const newTiles = footprint({ type, x, y });
  for (const other of others) {
    const odef = getFurniture(other.type);
    if (!odef) continue;
    // Tapetes só não podem ficar em cima de outros tapetes; móveis podem ficar sobre tapetes.
    if (Boolean(odef.walkable) !== Boolean(def.walkable)) continue;
    const overlap = footprint(other).some((t) => newTiles.some((n) => n.x === t.x && n.y === t.y));
    if (overlap) return { ok: false, reason: 'Já existe um móvel nesse lugar.' };
  }
  if (def.walkable) return { ok: true };

  const candidate: PlacedItem[] = [...others, { id: '__new__', type, x, y }];
  const grid = blockedGrid(candidate, w, h);
  const entry = entryTile(w, h);
  if (grid[entry.y][entry.x]) return { ok: false, reason: 'Não bloqueie a entrada da porta.' };

  // Todos os pontos de uso (trabalho e atendimento) precisam continuar alcançáveis.
  const reach = reachableFrom(entry, grid);
  for (const item of candidate) {
    const idef = getFurniture(item.type);
    if (!idef) continue;
    for (const spot of [idef.staff, idef.customer]) {
      if (!spot) continue;
      const { approach } = spotTiles(item, spot);
      if (approach.x < 0 || approach.y < 0 || approach.x >= w || approach.y >= h || !reach[approach.y][approach.x]) {
        return { ok: false, reason: item.id === '__new__' ? 'Deixe espaço livre na frente deste móvel.' : 'Isso bloquearia a passagem para outro móvel.' };
      }
    }
  }
  return { ok: true };
}

/** Caminho mais curto (A*) entre dois tiles numa grade de bloqueios. */
export function findPath(grid: boolean[][], from: Tile, to: Tile): Tile[] | null {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const key = (t: Tile) => t.y * w + t.x;
  const inside = (t: Tile) => t.x >= 0 && t.y >= 0 && t.x < w && t.y < h;
  if (!inside(from) || !inside(to) || grid[to.y][to.x]) return null;
  const open: { t: Tile; f: number }[] = [{ t: from, f: 0 }];
  const came = new Map<number, number>();
  const g = new Map<number, number>([[key(from), 0]]);
  const closed = new Set<number>();
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const { t } = open.shift()!;
    const k = key(t);
    if (t.x === to.x && t.y === to.y) {
      const path: Tile[] = [t];
      let cur = k;
      while (came.has(cur)) {
        cur = came.get(cur)!;
        path.unshift({ x: cur % w, y: Math.floor(cur / w) });
      }
      return path;
    }
    if (closed.has(k)) continue;
    closed.add(k);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: t.x + dx, y: t.y + dy };
      if (!inside(n) || grid[n.y][n.x]) continue;
      const nk = key(n);
      const cost = (g.get(k) ?? 0) + 1;
      if (cost < (g.get(nk) ?? Infinity)) {
        g.set(nk, cost);
        came.set(nk, k);
        open.push({ t: n, f: cost + Math.abs(n.x - to.x) + Math.abs(n.y - to.y) });
      }
    }
  }
  return null;
}
