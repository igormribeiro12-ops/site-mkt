// Utilitários de desenho em canvas para gerar as artes do jogo (sem imagens externas).

export type Ctx = CanvasRenderingContext2D;

export const OUTLINE = 'rgba(28, 22, 40, 0.55)';

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Clareia (amount > 0) ou escurece (amount < 0) uma cor. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke = OUTLINE, lw = 1.2) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function ellipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, fill: string, stroke?: string, lw = 1.2) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function circle(ctx: Ctx, cx: number, cy: number, r: number, fill: string, stroke?: string, lw = 1.2) {
  ellipse(ctx, cx, cy, r, r, fill, stroke, lw);
}

export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, lw = 1.5) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** Sombra suave no chão. */
export function floorShadow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, alpha = 0.22) {
  ellipse(ctx, cx, cy, rx, ry, `rgba(20, 14, 30, ${alpha})`);
}

/**
 * Caixa em perspectiva 3/4 vista de cima: tampo (topo) + face frontal.
 * (x, y) é o canto superior esquerdo do tampo.
 */
export function box(ctx: Ctx, x: number, y: number, w: number, topH: number, frontH: number, color: string, r = 4) {
  fillRound(ctx, x, y + topH - r, w, frontH + r, r, shade(color, -0.22));
  fillRound(ctx, x, y, w, topH, r, shade(color, 0.08));
  // brilho no tampo
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, x + 3, y + 2, w - 6, Math.max(2, topH * 0.3), 2);
  ctx.fill();
}

export function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);
  const ctx = canvas.getContext('2d')!;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return { canvas, ctx };
}

/** Número pseudoaleatório estável a partir de uma string. */
export function hashRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
