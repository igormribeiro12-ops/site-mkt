// Arte dos móveis em perspectiva 3/4 (vista de cima, com face frontal).
// Cada desenho ocupa a área do móvel no piso e pode "subir" acima dela (top).

import { getFurniture } from '../../game/furniture';
import { type Ctx, OUTLINE, box, circle, ellipse, fillRound, floorShadow, line, makeCanvas, roundRect, shade } from './draw';

export const T = 48;

export interface FurnitureArt {
  canvas: HTMLCanvasElement;
  /** Pixels extras à esquerda e acima da área do móvel. */
  left: number;
  top: number;
}

type Painter = (ctx: Ctx, w: number, h: number) => void;

function make(type: string, top: number, paint: Painter, left = 0, bottom = 0): FurnitureArt {
  const def = getFurniture(type)!;
  const w = def.w * T;
  const h = def.h * T;
  const { canvas, ctx } = makeCanvas(w + left, h + top + bottom);
  ctx.translate(left, top);
  paint(ctx, w, h);
  return { canvas, left, top };
}

const WOOD = '#b9845a';
const METAL = '#9aa3b2';
const DARK = '#2d3142';

function screen(ctx: Ctx, x: number, y: number, w: number, h: number, glow = '#4cc9f0') {
  fillRound(ctx, x, y, w, h, 3, DARK);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(glow, 0.35));
  g.addColorStop(1, shade(glow, -0.25));
  fillRound(ctx, x + 2.5, y + 2.5, w - 5, h - 5, 2, g as unknown as string, undefined);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(x + 5, y + 5, w * 0.4, 2);
  ctx.fillRect(x + 5, y + 9, w * 0.25, 2);
}

function desk(ctx: Ctx, w: number, color: string, accent: string, founder: boolean) {
  floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
  fillRound(ctx, 6, 30, 4, 16, 1, shade(color, -0.35));
  fillRound(ctx, w - 10, 30, 4, 16, 1, shade(color, -0.35));
  box(ctx, 2, 6, w - 4, 26, 12, color);
  // monitor
  fillRound(ctx, w / 2 - 4, 6, 8, 8, 1, '#3b3f51');
  screen(ctx, w / 2 - 19, -16, 38, 24, founder ? '#7c5cff' : '#4cc9f0');
  // teclado e mouse
  fillRound(ctx, w / 2 - 14, 18, 24, 7, 2, '#e5e7eb');
  for (let i = 0; i < 5; i++) ctx.fillRect(w / 2 - 12 + i * 4.5, 20, 3, 1.5);
  ellipse(ctx, w / 2 + 16, 21, 3, 4, '#e5e7eb', OUTLINE);
  // detalhes
  if (founder) {
    fillRound(ctx, 8, 10, 9, 10, 2, '#f8fafc');
    ellipse(ctx, 12.5, 11, 3.5, 1.5, '#7c3f1e');
    fillRound(ctx, w - 18, 8, 11, 14, 2, accent);
    line(ctx, w - 15, 12, w - 10, 12, 'rgba(255,255,255,0.6)', 1.2);
    line(ctx, w - 15, 16, w - 11, 16, 'rgba(255,255,255,0.6)', 1.2);
  } else {
    fillRound(ctx, 9, 11, 12, 9, 1.5, '#fde68a');
    fillRound(ctx, w - 18, 10, 9, 10, 2, '#f8fafc');
  }
}

export function chairArt(color = '#374151'): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T);
  floorShadow(ctx, 24, 40, 15, 4);
  line(ctx, 24, 32, 14, 41, '#4b5563', 2.5);
  line(ctx, 24, 32, 34, 41, '#4b5563', 2.5);
  fillRound(ctx, 11, 8, 26, 22, 8, shade(color, 0.1));
  fillRound(ctx, 9, 24, 30, 13, 6, color);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, 13, 26, 22, 4, 2);
  ctx.fill();
  return canvas;
}

function plant(ctx: Ctx, cx: number, base: number, scale = 1, potColor = '#c2683c') {
  floorShadow(ctx, cx, base - 2, 13 * scale, 4);
  const leaves = '#3fa34d';
  for (const [dx, dy, rx, ry, rot] of [
    [-8, -28, 7, 15, -0.6],
    [8, -28, 7, 15, 0.6],
    [0, -34, 7, 16, 0],
    [-12, -18, 6, 12, -1.1],
    [12, -18, 6, 12, 1.1],
  ]) {
    ctx.save();
    ctx.translate(cx + dx * scale, base - 6 + dy * scale);
    ctx.rotate(rot);
    ellipse(ctx, 0, 0, rx * scale, ry * scale, dx === 0 ? shade(leaves, 0.12) : leaves, OUTLINE);
    line(ctx, 0, -ry * scale * 0.7, 0, ry * scale * 0.7, 'rgba(0,0,0,0.15)', 1);
    ctx.restore();
  }
  fillRound(ctx, cx - 11 * scale, base - 20 * scale, 22 * scale, 18 * scale, 4, potColor);
  fillRound(ctx, cx - 13 * scale, base - 22 * scale, 26 * scale, 6 * scale, 2, shade(potColor, 0.15));
}

function shelfProducts(ctx: Ctx, x: number, y: number, w: number, colors: string[], rows: number, rowH: number) {
  for (let r = 0; r < rows; r++) {
    const ry = y + r * rowH;
    line(ctx, x, ry + rowH - 1, x + w, ry + rowH - 1, 'rgba(0,0,0,0.25)', 1.5);
    let px = x + 2;
    let i = r;
    while (px < x + w - 6) {
      const pw = 5 + ((i * 7) % 4);
      const ph = rowH - 4 - ((i * 5) % 4);
      fillRound(ctx, px, ry + rowH - 1 - ph, pw, ph, 1.2, colors[i % colors.length], 'rgba(0,0,0,0.25)', 0.7);
      px += pw + 1.5;
      i++;
    }
  }
}

function dog(ctx: Ctx, cx: number, base: number, color = '#d6a26a') {
  for (const dx of [-6, -2, 3, 7]) fillRound(ctx, cx + dx - 1.5, base - 6, 3, 6, 1, shade(color, -0.15));
  ellipse(ctx, cx, base - 8, 10, 6, color, OUTLINE);
  line(ctx, cx - 9, base - 10, cx - 14, base - 17, shade(color, -0.1), 2.5);
  circle(ctx, cx + 9, base - 15, 6, color, OUTLINE);
  ellipse(ctx, cx + 6, base - 16, 2.5, 4.5, shade(color, -0.3));
  circle(ctx, cx + 11, base - 16, 1, '#1f2937');
  circle(ctx, cx + 14.5, base - 13.5, 1.4, '#1f2937');
}

function dumbbell(ctx: Ctx, x: number, y: number, color: string) {
  line(ctx, x - 4, y, x + 4, y, '#d1d5db', 1.6);
  fillRound(ctx, x - 7, y - 3.5, 3.5, 7, 1, color, 'rgba(0,0,0,0.35)', 0.7);
  fillRound(ctx, x + 3.5, y - 3.5, 3.5, 7, 1, color, 'rgba(0,0,0,0.35)', 0.7);
}

const PRODUCT_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15'];

const PAINTERS: Record<string, (accent: string) => FurnitureArt> = {
  mesa_fundador: (accent) => make('mesa_fundador', 24, (ctx, w) => desk(ctx, w, WOOD, accent, true)),
  mesa_trabalho: () => make('mesa_trabalho', 24, (ctx, w) => desk(ctx, w, '#d6c7b0', '#64748b', false)),
  caixa: (accent) =>
    make('caixa', 18, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
      box(ctx, 2, 4, w - 4, 20, 22, '#e7e2d8');
      fillRound(ctx, 6, 26, w - 12, 15, 3, accent);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAIXA', w / 2, 37);
      // registradora
      fillRound(ctx, w - 34, -8, 26, 18, 3, '#4b5563');
      screen(ctx, w - 30, -14, 18, 10, '#34d399');
      fillRound(ctx, w - 32, 6, 22, 6, 2, '#9ca3af');
      fillRound(ctx, 10, 6, 14, 10, 2, '#f8fafc');
      fillRound(ctx, 28, 8, 9, 7, 1.5, '#1f2937');
    }),
  planta: () => make('planta', 30, (ctx, w) => plant(ctx, w / 2, 44, 0.9)),
  palmeira: () =>
    make('palmeira', 56, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 16, 5);
      fillRound(ctx, w / 2 - 3, -6, 6, 34, 3, '#8b5a2b');
      for (let i = 0; i < 7; i++) {
        ctx.save();
        ctx.translate(w / 2, -10);
        ctx.rotate(-1.4 + i * 0.47);
        ellipse(ctx, 0, -14, 5, 17, i % 2 ? '#2f9e44' : '#40c057', OUTLINE);
        ctx.restore();
      }
      fillRound(ctx, w / 2 - 12, 24, 24, 18, 4, '#5c7cfa');
      fillRound(ctx, w / 2 - 14, 22, 28, 6, 2, shade('#5c7cfa', 0.2));
    }),
  tapete: (accent) =>
    make('tapete', 0, (ctx, w, h) => {
      fillRound(ctx, 4, 6, w - 8, h - 12, 10, shade(accent, 0.25), 'rgba(0,0,0,0.2)');
      ctx.setLineDash([5, 4]);
      roundRect(ctx, 10, 12, w - 20, h - 24, 7);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      circle(ctx, w / 2, h / 2, 12, shade(accent, -0.1), 'rgba(255,255,255,0.5)');
    }),
  luminaria: () =>
    make('luminaria', 52, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 10, 3);
      ellipse(ctx, w / 2, 40, 9, 3.5, '#374151', OUTLINE);
      fillRound(ctx, w / 2 - 1.5, -26, 3, 66, 1.5, '#4b5563');
      ctx.beginPath();
      ctx.moveTo(w / 2 - 15, -30);
      ctx.lineTo(w / 2 + 15, -30);
      ctx.lineTo(w / 2 + 9, -48);
      ctx.lineTo(w / 2 - 9, -48);
      ctx.closePath();
      ctx.fillStyle = '#fde68a';
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }),
  sofa: (accent) =>
    make('sofa', 18, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2, 5);
      const c = shade(accent, -0.05);
      fillRound(ctx, 4, -10, w - 8, 24, 8, shade(c, -0.15));
      fillRound(ctx, 6, 10, w - 12, 26, 7, c);
      fillRound(ctx, 0, 0, 12, 38, 6, shade(c, -0.2));
      fillRound(ctx, w - 12, 0, 12, 38, 6, shade(c, -0.2));
      line(ctx, w / 2, 12, w / 2, 34, 'rgba(0,0,0,0.2)', 1.5);
    }),
  cafeteira: () =>
    make('cafeteira', 26, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 4);
      box(ctx, 4, 8, w - 8, 14, 26, '#8d6e63');
      fillRound(ctx, 12, -18, 24, 28, 4, '#374151');
      fillRound(ctx, 16, -14, 16, 8, 2, '#111827');
      circle(ctx, 30, -10, 2, '#ef4444');
      fillRound(ctx, 19, 2, 10, 7, 2, '#f8fafc');
    }),
  bebedouro: () =>
    make('bebedouro', 40, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 13, 4);
      box(ctx, 10, 4, w - 20, 8, 34, '#e5e7eb');
      fillRound(ctx, 14, -32, 20, 34, 9, 'rgba(96, 165, 250, 0.8)');
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(18, -26, 4, 22);
      circle(ctx, 20, 22, 2, '#3b82f6');
      circle(ctx, 28, 22, 2, '#ef4444');
    }),
  camera: () =>
    make('camera', 52, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 14, 4);
      line(ctx, w / 2, -6, w / 2 - 14, 40, '#4b5563', 2.5);
      line(ctx, w / 2, -6, w / 2 + 14, 40, '#4b5563', 2.5);
      line(ctx, w / 2, -6, w / 2, 40, '#4b5563', 2.5);
      fillRound(ctx, w / 2 - 12, -20, 24, 15, 3, '#111827');
      circle(ctx, w / 2 + 4, -12, 5, '#374151', '#9ca3af');
      circle(ctx, w / 2 - 8, -17, 2, '#ef4444');
      ctx.beginPath();
      ctx.arc(w / 2 - 15, -36, 11, 0, Math.PI * 2);
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 4;
      ctx.stroke();
    }),
  letreiro: (accent) =>
    make('letreiro', 34, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 6, 4);
      line(ctx, 14, 8, 14, 42, '#4b5563', 3);
      line(ctx, w - 14, 8, w - 14, 42, '#4b5563', 3);
      fillRound(ctx, 2, -28, w - 4, 38, 6, '#151225');
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = shade(accent, 0.5);
      ctx.fillText('ABERTO', w / 2, -3);
      ctx.restore();
      roundRect(ctx, 7, -23, w - 14, 28, 5);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }),
  servidor: () =>
    make('servidor', 46, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 4);
      box(ctx, 6, -38, w - 12, 10, 78, '#1f2937');
      for (let i = 0; i < 6; i++) {
        fillRound(ctx, 10, -24 + i * 11, w - 20, 8, 1.5, '#111827');
        circle(ctx, 14, -20 + i * 11, 1.6, i % 2 ? '#22c55e' : '#38bdf8', undefined);
        circle(ctx, 19, -20 + i * 11, 1.6, '#22c55e', undefined);
      }
    }),
  quadro_branco: () =>
    make('quadro_branco', 44, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 4, 4);
      line(ctx, 12, 0, 8, 42, '#6b7280', 3);
      line(ctx, w - 12, 0, w - 8, 42, '#6b7280', 3);
      fillRound(ctx, 2, -38, w - 4, 44, 4, '#f8fafc', '#94a3b8', 2);
      line(ctx, 10, -28, 40, -28, '#3b82f6', 2);
      line(ctx, 10, -20, 50, -20, '#3b82f6', 2);
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(24, -12);
      ctx.lineTo(36, -6);
      ctx.lineTo(50, -18);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.stroke();
      fillRound(ctx, w - 30, -32, 12, 12, 1, '#fde047', undefined);
      fillRound(ctx, w - 30, -16, 12, 12, 1, '#f9a8d4', undefined);
      fillRound(ctx, w - 16, -26, 10, 10, 1, '#86efac', undefined);
    }),
  fogao: () =>
    make('fogao', 22, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
      box(ctx, 2, 4, w - 4, 22, 20, '#cbd5e1');
      for (const [x, y] of [
        [20, 10],
        [44, 10],
        [20, 20],
        [44, 20],
      ]) {
        circle(ctx, x, y, 6, '#374151', OUTLINE);
        circle(ctx, x, y, 3, '#1f2937');
      }
      fillRound(ctx, 58, 6, 30, 18, 3, '#94a3b8');
      fillRound(ctx, 10, 29, w - 20, 13, 3, '#1f2937');
      fillRound(ctx, 14, 31, w - 28, 8, 2, 'rgba(251, 146, 60, 0.55)', undefined);
      // panela
      fillRound(ctx, 34, -10, 20, 16, 4, '#9ca3af');
      ellipse(ctx, 44, -10, 10, 3, '#6b7280', OUTLINE);
      line(ctx, 54, -4, 62, -6, '#4b5563', 2.5);
    }),
  mesa_clientes: () =>
    make(
      'mesa_clientes',
      14,
      (ctx, w) => {
        // cadeira à esquerda (lugar do cliente)
        floorShadow(ctx, -24, 42, 14, 4);
        fillRound(ctx, -38, 8, 8, 30, 3, '#a16207');
        fillRound(ctx, -34, 18, 22, 18, 4, '#ca8a04');
        floorShadow(ctx, w / 2, 42, 18, 5);
        fillRound(ctx, w / 2 - 3, 18, 6, 22, 2, '#78350f');
        ellipse(ctx, w / 2, 16, 20, 12, '#fef3c7', OUTLINE);
        ellipse(ctx, w / 2, 14, 15, 8, '#fff7ed');
        circle(ctx, w / 2 - 4, 13, 4, '#f8fafc', OUTLINE);
        ellipse(ctx, w / 2 + 7, 12, 3, 4, '#ef4444', OUTLINE);
      },
      T,
    ),
  vitrine_doces: () =>
    make('vitrine_doces', 18, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
      box(ctx, 2, 6, w - 4, 16, 26, '#f1f5f9');
      fillRound(ctx, 6, -10, w - 12, 32, 6, 'rgba(186, 230, 253, 0.55)', '#7dd3fc', 1.5);
      const sweets = ['#f472b6', '#a16207', '#fde047', '#fb7185', '#c084fc'];
      for (let i = 0; i < 5; i++) {
        ellipse(ctx, 16 + i * 15, 8, 6, 4, sweets[i], OUTLINE);
        ellipse(ctx, 16 + i * 15, 6, 5, 2, shade(sweets[i], 0.3));
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(10, -6, 30, 3);
    }),
  geladeira: () =>
    make('geladeira', 46, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 4);
      box(ctx, 6, -38, w - 12, 10, 78, '#e2e8f0');
      line(ctx, 8, 0, w - 8, 0, 'rgba(0,0,0,0.25)', 1.5);
      line(ctx, w - 12, -22, w - 12, -8, '#94a3b8', 3);
      line(ctx, w - 12, 8, w - 12, 26, '#94a3b8', 3);
    }),
  arara: () =>
    make('arara', 44, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 4);
      line(ctx, 6, -34, 6, 42, '#9ca3af', 3);
      line(ctx, w - 6, -34, w - 6, 42, '#9ca3af', 3);
      line(ctx, 4, -34, w - 4, -34, '#cbd5e1', 3);
      const clothes = ['#ef4444', '#f8fafc', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#111827'];
      for (let i = 0; i < 7; i++) {
        const x = 12 + i * 11;
        line(ctx, x, -34, x, -28, '#6b7280', 1.2);
        ctx.beginPath();
        ctx.moveTo(x - 6, -28);
        ctx.lineTo(x + 6, -28);
        ctx.lineTo(x + 8, -2 - (i % 3) * 3);
        ctx.lineTo(x - 8, -2 - (i % 3) * 3);
        ctx.closePath();
        ctx.fillStyle = clothes[i];
        ctx.fill();
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }),
  provador: (accent) =>
    make('provador', 54, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 20, 4);
      fillRound(ctx, 2, -48, w - 4, 90, 3, '#d6d3d1');
      line(ctx, 4, -44, w - 4, -44, '#78716c', 3);
      for (let i = 0; i < 4; i++) fillRound(ctx, 5 + i * 10, -43, 10, 82, 4, i % 2 ? accent : shade(accent, -0.15), 'rgba(0,0,0,0.2)', 0.8);
    }),
  manequim: (accent) =>
    make('manequim', 48, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 12, 4);
      ellipse(ctx, w / 2, 40, 10, 3.5, '#57534e', OUTLINE);
      line(ctx, w / 2, 40, w / 2, 8, '#57534e', 2.5);
      circle(ctx, w / 2, -38, 6, '#e7e5e4', OUTLINE);
      ctx.beginPath();
      ctx.moveTo(w / 2 - 9, -30);
      ctx.lineTo(w / 2 + 9, -30);
      ctx.lineTo(w / 2 + 6, -14);
      ctx.lineTo(w / 2 + 13, 10);
      ctx.lineTo(w / 2 - 13, 10);
      ctx.lineTo(w / 2 - 6, -14);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }),
  espelho: () =>
    make('espelho', 46, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 14, 4);
      ellipse(ctx, w / 2, -6, 16, 36, '#d4a373', OUTLINE, 1.5);
      ellipse(ctx, w / 2, -6, 12, 32, '#bae6fd');
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(w / 2 - 6, -28, 3, 30);
      line(ctx, w / 2 - 8, 28, w / 2 - 12, 42, '#a16207', 2.5);
      line(ctx, w / 2 + 8, 28, w / 2 + 12, 42, '#a16207', 2.5);
    }),
  cadeira_salao: () =>
    make('cadeira_salao', 22, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 16, 5);
      fillRound(ctx, w / 2 - 3, 28, 6, 12, 2, '#9ca3af');
      ellipse(ctx, w / 2, 41, 12, 3, '#6b7280', OUTLINE);
      fillRound(ctx, 6, 12, w - 12, 18, 6, '#991b1b');
      fillRound(ctx, 8, -16, w - 16, 32, 7, '#b91c1c');
      fillRound(ctx, w / 2 - 7, -22, 14, 8, 4, '#7f1d1d');
      fillRound(ctx, 2, 6, 8, 18, 3, '#1f2937');
      fillRound(ctx, w - 10, 6, 8, 18, 3, '#1f2937');
    }),
  lavatorio: () =>
    make('lavatorio', 22, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 4);
      box(ctx, 4, 6, w - 8, 14, 24, '#e5e7eb');
      ellipse(ctx, w / 2, 0, 16, 9, '#f8fafc', OUTLINE);
      ellipse(ctx, w / 2, 1, 11, 5, '#bfdbfe');
      line(ctx, w / 2, -12, w / 2, -4, '#9ca3af', 3);
    }),
  estante_cosmeticos: () =>
    make('estante_cosmeticos', 44, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 4);
      box(ctx, 2, -38, w - 4, 8, 80, '#f5f5f4');
      shelfProducts(ctx, 6, -28, w - 12, ['#f9a8d4', '#c4b5fd', '#fde68a', '#99f6e4', '#fda4af'], 3, 20);
    }),
  carteira: () =>
    make('carteira', 10, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 16, 4);
      box(ctx, 8, 0, w - 16, 14, 8, '#d6a26a');
      fillRound(ctx, 12, 26, w - 24, 14, 4, '#3b82f6');
      fillRound(ctx, 14, 36, w - 28, 8, 3, '#2563eb');
      fillRound(ctx, 16, 2, 10, 8, 1, '#f8fafc');
    }),
  estante_livros: () =>
    make('estante_livros', 46, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 4);
      box(ctx, 2, -40, w - 4, 8, 82, '#92400e');
      shelfProducts(ctx, 6, -30, w - 12, ['#1d4ed8', '#b91c1c', '#15803d', '#a16207', '#7c3aed', '#0f766e'], 3, 21);
    }),
  projetor: () =>
    make('projetor', 28, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 14, 4);
      line(ctx, w / 2, -2, w / 2 - 10, 40, '#4b5563', 2.5);
      line(ctx, w / 2, -2, w / 2 + 10, 40, '#4b5563', 2.5);
      fillRound(ctx, w / 2 - 14, -18, 28, 16, 4, '#e5e7eb');
      circle(ctx, w / 2 + 6, -10, 5, '#1f2937', '#9ca3af');
      ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
      ctx.beginPath();
      ctx.moveTo(w / 2 + 6, -14);
      ctx.lineTo(w / 2 + 6 - 20, -26);
      ctx.lineTo(w / 2 + 6 + 20, -26);
      ctx.closePath();
      ctx.fill();
    }),
  gondola: () =>
    make('gondola', 38, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 4);
      box(ctx, 2, -30, w - 4, 10, 72, '#e2e8f0');
      shelfProducts(ctx, 6, -20, w - 12, PRODUCT_COLORS, 3, 19);
    }),
  geladeira_bebidas: () =>
    make('geladeira_bebidas', 46, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 4);
      box(ctx, 4, -40, w - 8, 8, 82, '#dc2626');
      fillRound(ctx, 8, -30, w - 16, 64, 3, 'rgba(186, 230, 253, 0.6)', '#e5e7eb');
      shelfProducts(ctx, 10, -28, w - 20, ['#22c55e', '#f97316', '#3b82f6', '#facc15'], 3, 20);
    }),
  cesto_ofertas: () =>
    make('cesto_ofertas', 16, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 5);
      fillRound(ctx, 6, 8, w - 12, 30, 8, '#d97706');
      for (let i = 0; i < 5; i++) circle(ctx, 14 + i * 5, 8, 5, PRODUCT_COLORS[i], OUTLINE);
      fillRound(ctx, w - 22, -12, 18, 14, 3, '#ef4444');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('%', w - 13, -2);
    }),
  bancada: () =>
    make('bancada', 28, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
      fillRound(ctx, 6, 26, 5, 18, 1, '#57534e');
      fillRound(ctx, w - 11, 26, 5, 18, 1, '#57534e');
      box(ctx, 2, 4, w - 4, 22, 10, '#a8a29e');
      fillRound(ctx, 12, 8, 16, 10, 2, '#1f2937');
      screen(ctx, 14, 9, 12, 8, '#a3e635');
      line(ctx, 40, 14, 58, 10, '#ef4444', 3);
      line(ctx, 62, 18, 74, 12, '#3b82f6', 3);
      line(ctx, w - 16, 4, w - 16, -18, '#4b5563', 2);
      line(ctx, w - 16, -18, w - 30, -22, '#4b5563', 2);
      ellipse(ctx, w - 32, -20, 6, 4, '#fde68a', OUTLINE);
    }),
  estante_pecas: () =>
    make('estante_pecas', 42, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 4);
      for (const x of [4, w - 8]) line(ctx, x + 2, -36, x + 2, 44, METAL, 3);
      for (let r = 0; r < 4; r++) {
        const y = -32 + r * 20;
        line(ctx, 4, y + 16, w - 4, y + 16, '#64748b', 2.5);
        for (let i = 0; i < 3; i++) fillRound(ctx, 10 + i * 26, y + 4, 20, 12, 2, i % 2 ? '#93c5fd' : '#fdba74');
      }
    }),
  painel_ferramentas: () =>
    make('painel_ferramentas', 46, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 14, 4);
      line(ctx, 12, 0, 10, 42, '#6b7280', 3);
      line(ctx, w - 12, 0, w - 10, 42, '#6b7280', 3);
      fillRound(ctx, 2, -40, w - 4, 44, 3, '#d6a26a');
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let x = 8; x < w - 4; x += 7) for (let y = -34; y < 0; y += 7) ctx.fillRect(x, y, 1.5, 1.5);
      line(ctx, 12, -32, 12, -14, '#ef4444', 3);
      line(ctx, 22, -30, 22, -10, '#1f2937', 3);
      circle(ctx, 34, -24, 6, 'transparent', '#3b82f6', 2.5);
    }),
  fliperama: (accent) =>
    make('fliperama', 48, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 4);
      box(ctx, 6, -40, w - 12, 10, 82, '#312e81');
      fillRound(ctx, 6, -40, w - 12, 12, 3, accent);
      screen(ctx, 10, -24, w - 20, 22, '#f472b6');
      fillRound(ctx, 8, 2, w - 16, 10, 2, '#1e1b4b');
      circle(ctx, 18, 6, 3, '#ef4444', OUTLINE);
      circle(ctx, 28, 6, 2.5, '#facc15', OUTLINE);
      circle(ctx, 34, 6, 2.5, '#22c55e', OUTLINE);
    }),
  sinuca: () =>
    make('sinuca', 10, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2, 5);
      fillRound(ctx, 8, 30, 6, 14, 2, '#5b3a1a');
      fillRound(ctx, w - 14, 30, 6, 14, 2, '#5b3a1a');
      box(ctx, 0, 0, w, 30, 8, '#7c4a1e');
      fillRound(ctx, 5, 4, w - 10, 22, 4, '#15803d', undefined);
      const balls = ['#f8fafc', '#facc15', '#ef4444', '#2563eb', '#111827', '#f97316'];
      balls.forEach((c, i) => circle(ctx, 20 + i * 11, 12 + (i % 2) * 6, 3, c, OUTLINE, 0.8));
      line(ctx, 10, 22, w - 30, 8, '#d6a26a', 2);
    }),
  caixa_som: () =>
    make('caixa_som', 34, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 16, 4);
      box(ctx, 8, -26, w - 16, 8, 68, '#1f2937');
      circle(ctx, w / 2, -6, 9, '#374151', '#6b7280');
      circle(ctx, w / 2, -6, 4, '#111827');
      circle(ctx, w / 2, 22, 7, '#374151', '#6b7280');
      circle(ctx, w / 2, 22, 3, '#111827');
    }),

  // --- Barbearia ---------------------------------------------------------------
  cadeira_barbeiro: () =>
    make('cadeira_barbeiro', 28, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 16, 5);
      fillRound(ctx, w / 2 - 4, 28, 8, 12, 2, '#d1d5db');
      ellipse(ctx, w / 2, 41, 13, 3.5, '#9ca3af', OUTLINE);
      fillRound(ctx, 6, 12, w - 12, 18, 6, '#3f2a1d');
      fillRound(ctx, 8, -16, w - 16, 32, 7, '#5b3a26');
      for (let y = -10; y <= 8; y += 6) line(ctx, 12, y, w - 12, y, 'rgba(255,255,255,0.12)', 1);
      line(ctx, w / 2, -16, w / 2, -19, '#d1d5db', 2);
      fillRound(ctx, w / 2 - 8, -26, 16, 9, 4, '#3f2a1d');
      fillRound(ctx, 1, 6, 9, 18, 3, '#d1d5db');
      fillRound(ctx, w - 10, 6, 9, 18, 3, '#d1d5db');
      fillRound(ctx, w / 2 - 9, 34, 18, 4, 2, '#e5e7eb');
    }),
  poste_barbeiro: () =>
    make('poste_barbeiro', 46, (ctx, w) => {
      const cx = w / 2;
      floorShadow(ctx, cx, 42, 10, 3);
      fillRound(ctx, cx - 7, 32, 14, 9, 3, '#d1d5db');
      ctx.save();
      roundRect(ctx, cx - 6, -30, 12, 64, 6);
      ctx.clip();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 6, -30, 12, 64);
      for (let i = -2; i < 10; i++) {
        ctx.fillStyle = i % 2 ? '#dc2626' : '#2563eb';
        ctx.beginPath();
        ctx.moveTo(cx - 6, -24 + i * 9);
        ctx.lineTo(cx + 6, -32 + i * 9);
        ctx.lineTo(cx + 6, -28 + i * 9);
        ctx.lineTo(cx - 6, -20 + i * 9);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      roundRect(ctx, cx - 6, -30, 12, 64, 6);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(cx - 4, -26, 2, 56);
      fillRound(ctx, cx - 8, -38, 16, 9, 4, '#d1d5db');
      circle(ctx, cx, -40, 4, '#e5e7eb', OUTLINE);
    }),

  // --- Assistência técnica ----------------------------------------------------
  vitrine_celulares: () =>
    make('vitrine_celulares', 20, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
      box(ctx, 2, 6, w - 4, 16, 26, '#e5e7eb');
      fillRound(ctx, 6, -10, w - 12, 32, 6, 'rgba(186, 230, 253, 0.5)', '#7dd3fc', 1.5);
      const colors = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa'];
      for (let i = 0; i < 5; i++) {
        const x = 11 + i * 15;
        fillRound(ctx, x, -4, 10, 17, 2.5, '#1f2937');
        fillRound(ctx, x + 1.5, -2, 7, 12, 1.5, colors[i], undefined);
      }
      for (let i = 0; i < 4; i++) fillRound(ctx, 14 + i * 18, 28, 12, 6, 2, i % 2 ? '#f8fafc' : '#cbd5e1');
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(10, -6, 30, 3);
    }),

  // --- Pet shop ----------------------------------------------------------------
  banho_tosa: () =>
    make('banho_tosa', 26, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
      box(ctx, 2, 4, 50, 22, 18, '#cbd5e1');
      fillRound(ctx, 7, 7, 40, 14, 4, '#93c5fd', undefined);
      for (const [x, y, r] of [
        [14, 8, 3],
        [20, 6, 2.5],
        [32, 9, 3.2],
        [40, 7, 2.2],
      ])
        circle(ctx, x, y, r, '#f8fafc', 'rgba(59,130,246,0.5)', 0.8);
      line(ctx, 46, 6, 46, -14, '#94a3b8', 3);
      line(ctx, 46, -14, 36, -14, '#94a3b8', 3);
      ellipse(ctx, 35, -12, 3, 2, '#64748b', OUTLINE);
      fillRound(ctx, 58, 26, 4, 18, 1, '#6b7280');
      fillRound(ctx, w - 10, 26, 4, 18, 1, '#6b7280');
      box(ctx, 54, 10, w - 58, 14, 6, '#e5e7eb');
      dog(ctx, 72, 18, '#e0b07a');
      line(ctx, w - 8, 8, w - 8, -18, '#94a3b8', 2);
      line(ctx, w - 8, -18, w - 16, -18, '#94a3b8', 2);
    }),
  prateleira_racao: () =>
    make('prateleira_racao', 44, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 4);
      box(ctx, 2, -38, w - 4, 8, 80, '#fef3c7');
      const colors = ['#f97316', '#22c55e', '#3b82f6', '#ef4444'];
      for (let r = 0; r < 3; r++) {
        const y = -28 + r * 21;
        line(ctx, 4, y + 19, w - 4, y + 19, '#d6a26a', 2.5);
        for (let i = 0; i < 4; i++) {
          fillRound(ctx, 8 + i * 21, y + 2, 16, 16, 3, colors[(i + r) % 4]);
          circle(ctx, 16 + i * 21, y + 10, 3.2, 'rgba(255,255,255,0.75)');
          circle(ctx, 16 + i * 21, y + 10, 1.4, colors[(i + r) % 4]);
        }
      }
    }),
  casinha_pet: () =>
    make('casinha_pet', 22, (ctx, w) => {
      floorShadow(ctx, w / 2, 42, 18, 4);
      fillRound(ctx, 6, 8, w - 12, 32, 3, '#d97706');
      for (let y = 14; y < 40; y += 7) line(ctx, 8, y, w - 8, y, 'rgba(0,0,0,0.12)', 1);
      ctx.beginPath();
      ctx.moveTo(1, 13);
      ctx.lineTo(w / 2, -14);
      ctx.lineTo(w - 1, 13);
      ctx.closePath();
      ctx.fillStyle = '#b91c1c';
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      fillRound(ctx, w / 2 - 7, 20, 14, 20, 7, '#3f2a1d', undefined);
      fillRound(ctx, w / 2 - 8, 2, 16, 6, 2, '#fde68a');
      fillRound(ctx, w - 18, 34, 12, 4, 2, '#f8fafc');
      circle(ctx, w - 18, 34, 2.2, '#f8fafc');
      circle(ctx, w - 6, 38, 2.2, '#f8fafc');
    }),

  // --- Academia ------------------------------------------------------------------
  esteira: () =>
    make('esteira', 34, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, 18, 4);
      fillRound(ctx, 6, 4, w - 12, 38, 5, '#374151');
      fillRound(ctx, 10, 6, w - 20, 32, 3, '#111827');
      for (let y = 10; y < 36; y += 5) line(ctx, 11, y, w - 11, y, 'rgba(255,255,255,0.08)', 1);
      line(ctx, 8, 8, 8, -16, '#9ca3af', 3);
      line(ctx, w - 8, 8, w - 8, -16, '#9ca3af', 3);
      fillRound(ctx, 5, -28, w - 10, 14, 3, '#4b5563');
      screen(ctx, 11, -26, w - 22, 10, '#22d3ee');
    }),
  supino: () =>
    make('supino', 30, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 4, 5);
      fillRound(ctx, 22, 30, 4, 14, 1, '#6b7280');
      fillRound(ctx, w - 26, 30, 4, 14, 1, '#6b7280');
      fillRound(ctx, 14, 18, w - 28, 14, 5, '#1f2937');
      fillRound(ctx, 16, 19, w - 32, 6, 3, '#374151');
      line(ctx, 22, 18, 22, -14, '#9ca3af', 3);
      line(ctx, w - 22, 18, w - 22, -14, '#9ca3af', 3);
      line(ctx, 4, -12, w - 4, -12, '#d1d5db', 3);
      for (const x of [9, w - 9]) {
        fillRound(ctx, x - 4, -24, 8, 24, 2, '#111827');
        fillRound(ctx, x - 2, -20, 4, 16, 1, '#374151', undefined);
      }
    }),
  rack_halteres: () =>
    make('rack_halteres', 22, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 4);
      fillRound(ctx, 6, 24, 4, 20, 1, '#4b5563');
      fillRound(ctx, w - 10, 24, 4, 20, 1, '#4b5563');
      box(ctx, 2, 6, w - 4, 10, 18, '#374151');
      box(ctx, 2, -14, w - 4, 8, 14, '#4b5563');
      const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
      for (let i = 0; i < 5; i++) {
        dumbbell(ctx, 13 + i * 17, 10, colors[i]);
        dumbbell(ctx, 13 + i * 17, -10, colors[4 - i]);
      }
    }),

  // --- Lanchonete ----------------------------------------------------------------
  chapa: () =>
    make('chapa', 28, (ctx, w) => {
      floorShadow(ctx, w / 2, 44, w / 2 - 2, 5);
      box(ctx, 2, 4, w - 4, 22, 20, '#9ca3af');
      fillRound(ctx, 6, 7, w - 12, 16, 3, '#1f2937');
      for (let i = 0; i < 4; i++) {
        ellipse(ctx, 16 + i * 17, 15, 6, 4, '#7c2d12', OUTLINE);
        ellipse(ctx, 16 + i * 17, 14, 4.5, 2, '#9a3412');
      }
      fillRound(ctx, 10, 29, w - 20, 13, 3, '#4b5563');
      for (const x of [22, 36, 50]) circle(ctx, x, 35, 3, '#111827', OUTLINE);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      for (const x of [24, 54]) {
        ctx.beginPath();
        ctx.moveTo(x, 4);
        ctx.quadraticCurveTo(x - 6, -6, x, -14);
        ctx.quadraticCurveTo(x + 6, -20, x, -26);
        ctx.stroke();
      }
      line(ctx, w - 12, 10, w - 4, -6, '#6b7280', 2.5);
      fillRound(ctx, w - 20, 8, 10, 6, 1, '#d1d5db');
    }),
};

export function renderFurniture(type: string, accent: string): FurnitureArt | null {
  const painter = PAINTERS[type];
  return painter ? painter(accent) : null;
}

export const PAINTED_TYPES = Object.keys(PAINTERS);
