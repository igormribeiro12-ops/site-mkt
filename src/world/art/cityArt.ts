// Prédios e elementos da cidade em perspectiva 3/4 (telhado visto de cima + fachada).

import { OUTLINE, circle, ellipse, fillRound, floorShadow, line, makeCanvas, roundRect, shade } from './draw';
import { T } from './furnitureArt';

export type BuildingIcon = 'bank' | 'print' | 'megaphone' | 'sofa' | 'key' | 'star' | 'briefcase' | 'store' | 'rival' | 'home';

export interface BuildingSpec {
  /** Largura em tiles. */
  w: number;
  /** Andares visíveis na fachada. */
  floors: number;
  wall: string;
  roof: string;
  /** Cor do toldo sobre a porta (opcional). */
  awning?: string;
  sign: string;
  signColor: string;
  icon: BuildingIcon;
  /** Coluna (em tiles, a partir da esquerda) da porta. */
  doorCol: number;
}

const ROOF_H = T * 1.1;
const FLOOR_H = T * 0.95;

/** Altura total do desenho de um prédio. */
export function buildingHeight(spec: Pick<BuildingSpec, 'floors'>): number {
  return Math.round(ROOF_H + spec.floors * FLOOR_H + T * 0.25);
}

function drawIcon(ctx: CanvasRenderingContext2D, icon: BuildingIcon, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  switch (icon) {
    case 'bank':
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 2);
      ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx + 8, cy - 2);
      ctx.closePath();
      ctx.fill();
      for (const dx of [-6, -2, 2, 6]) ctx.fillRect(cx + dx - 0.8, cy - 1, 1.6, 7);
      ctx.fillRect(cx - 8, cy + 6, 16, 2);
      break;
    case 'print':
      ctx.strokeRect(cx - 7, cy - 3, 14, 8);
      ctx.fillRect(cx - 4, cy - 8, 8, 5);
      ctx.fillRect(cx - 4, cy + 4, 8, 4);
      break;
    case 'megaphone':
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 2);
      ctx.lineTo(cx + 6, cy - 7);
      ctx.lineTo(cx + 6, cy + 7);
      ctx.lineTo(cx - 7, cy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - 9, cy - 2, 3, 4);
      break;
    case 'sofa':
      ctx.fillRect(cx - 8, cy - 2, 16, 6);
      ctx.fillRect(cx - 9, cy - 5, 3, 9);
      ctx.fillRect(cx + 6, cy - 5, 3, 9);
      ctx.fillRect(cx - 6, cy - 6, 12, 4);
      break;
    case 'key':
      ctx.beginPath();
      ctx.arc(cx - 4, cy, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(cx, cy - 1, 9, 2);
      ctx.fillRect(cx + 5, cy, 2, 4);
      break;
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 3.5 : 8;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'briefcase':
      ctx.fillRect(cx - 8, cy - 3, 16, 10);
      ctx.strokeRect(cx - 3, cy - 7, 6, 4);
      break;
    case 'rival':
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 7);
      ctx.lineTo(cx + 7, cy + 7);
      ctx.moveTo(cx + 7, cy - 7);
      ctx.lineTo(cx - 7, cy + 7);
      ctx.stroke();
      break;
    case 'home':
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy);
      ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx + 8, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - 5, cy, 10, 7);
      break;
    default:
      ctx.fillRect(cx - 7, cy - 4, 14, 10);
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 5, Math.PI, 0);
      ctx.stroke();
  }
  ctx.restore();
}

function windowPane(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lit = false) {
  fillRound(ctx, x, y, w, h, 3, lit ? '#fde68a' : '#9fd3f2', 'rgba(30, 27, 46, 0.5)', 1.2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + 3, y + 3, w * 0.3, 2);
  ctx.fillStyle = 'rgba(30, 27, 46, 0.25)';
  ctx.fillRect(x + w / 2 - 0.5, y + 2, 1, h - 4);
}

/** Desenha um prédio. O pé do prédio (linha da calçada) é a base do canvas. */
export function buildingArt(spec: BuildingSpec): HTMLCanvasElement {
  const width = spec.w * T;
  const height = buildingHeight(spec);
  const { canvas, ctx } = makeCanvas(width, height);
  const facadeTop = ROOF_H;
  const base = height - T * 0.25;

  // sombra
  floorShadow(ctx, width / 2, base + 4, width / 2, 8, 0.25);
  // telhado (visto de cima)
  fillRound(ctx, 2, 4, width - 4, ROOF_H + 4, 6, spec.roof);
  ctx.fillStyle = shade(spec.roof, 0.12);
  roundRect(ctx, 8, 9, width - 16, ROOF_H - 14, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 14; x < width - 14; x += 10) ctx.fillRect(x, 12, 1, ROOF_H - 20);
  // detalhes do telhado: caixa d'água / ar-condicionado
  fillRound(ctx, width - 30, 14, 18, 14, 3, '#cbd5e1');
  line(ctx, width - 27, 18, width - 15, 18, '#94a3b8', 1);
  line(ctx, width - 27, 22, width - 15, 22, '#94a3b8', 1);
  if (spec.w >= 4) fillRound(ctx, 14, 12, 14, 16, 3, '#64748b');

  // fachada
  const wallG = ctx.createLinearGradient(0, facadeTop, 0, base);
  wallG.addColorStop(0, shade(spec.wall, 0.04));
  wallG.addColorStop(1, shade(spec.wall, -0.1));
  ctx.fillStyle = wallG;
  ctx.fillRect(2, facadeTop, width - 4, base - facadeTop);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(2, facadeTop, width - 4, base - facadeTop);
  // beiral
  ctx.fillStyle = shade(spec.roof, -0.3);
  ctx.fillRect(0, facadeTop - 2, width, 6);

  // andares superiores: janelas
  for (let f = 0; f < spec.floors - 1; f++) {
    const y = facadeTop + 10 + f * FLOOR_H;
    for (let c = 0; c < spec.w; c++) windowPane(ctx, c * T + 10, y, T - 20, FLOOR_H - 22);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(2, y + FLOOR_H - 8, width - 4, 2);
  }

  // térreo
  const groundTop = base - FLOOR_H;
  const doorX = spec.doorCol * T + 8;
  const doorW = T - 16;
  // vitrines
  for (let c = 0; c < spec.w; c++) {
    if (c === spec.doorCol) continue;
    windowPane(ctx, c * T + 6, groundTop + 26, T - 12, FLOOR_H - 34);
  }
  // porta
  fillRound(ctx, doorX - 3, groundTop + 18, doorW + 6, base - groundTop - 16, 4, shade(spec.wall, -0.35));
  fillRound(ctx, doorX, groundTop + 22, doorW, base - groundTop - 22, 3, '#7dd3fc', 'rgba(30,27,46,0.6)');
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(doorX + 4, groundTop + 26, 3, base - groundTop - 32);
  circle(ctx, doorX + doorW - 6, groundTop + (base - groundTop) / 2 + 10, 1.8, '#475569');

  // toldo listrado
  if (spec.awning) {
    const ay = groundTop + 6;
    for (let x = 4, i = 0; x < width - 4; x += 12, i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : spec.awning;
      ctx.fillRect(x, ay, Math.min(12, width - 4 - x), 14);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(4, ay + 12, width - 8, 2);
    for (let x = 4, i = 0; x < width - 4; x += 12, i++) {
      ctx.beginPath();
      ctx.arc(x + 6, ay + 14, 6, 0, Math.PI);
      ctx.fillStyle = i % 2 ? '#ffffff' : spec.awning;
      ctx.fill();
    }
  }

  // placa com nome
  ctx.font = 'bold 13px "Space Grotesk Variable", sans-serif';
  const label = spec.sign.slice(0, 22);
  const textW = ctx.measureText(label).width;
  const signW = Math.min(width - 10, textW + 40);
  const signX = (width - signW) / 2;
  const signY = spec.floors > 1 ? groundTop - 12 : facadeTop + 4;
  fillRound(ctx, signX, signY, signW, 24, 7, spec.signColor, 'rgba(0,0,0,0.4)', 1.4);
  drawIcon(ctx, spec.icon, signX + 14, signY + 12, '#ffffff');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(label, signX + 26, signY + 17, signW - 30);
  return canvas;
}

/** Tapume de obra para áreas ainda bloqueadas. */
export function fenceArt(widthTiles: number, label: string): HTMLCanvasElement {
  const width = widthTiles * T;
  const { canvas, ctx } = makeCanvas(width, T * 1.4);
  floorShadow(ctx, width / 2, T * 1.4 - 4, width / 2, 5, 0.2);
  for (let x = 0; x < width; x += 16) {
    fillRound(ctx, x + 1, 10, 14, T * 1.4 - 16, 2, x % 32 ? '#f59e0b' : '#fbbf24', 'rgba(0,0,0,0.35)', 1);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 22, width, 3);
  ctx.fillRect(0, T * 1.4 - 20, width, 3);
  ctx.font = 'bold 12px "Plus Jakarta Sans Variable", sans-serif';
  const tw = Math.min(width - 20, ctx.measureText(label).width + 20);
  fillRound(ctx, (width - tw) / 2, 26, tw, 22, 6, '#1e1b2e', 'rgba(0,0,0,0.5)', 1);
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.fillText(label, width / 2, 41, tw - 12);
  return canvas;
}

/** Outdoor com o nome da empresa (aparece quando a marca cresce). */
export function billboardArt(name: string, primary: string, secondary: string): HTMLCanvasElement {
  const width = T * 4;
  const { canvas, ctx } = makeCanvas(width, T * 2.6);
  floorShadow(ctx, width / 2, T * 2.6 - 4, width / 2 - 20, 5);
  line(ctx, 40, T * 1.4, 40, T * 2.6 - 4, '#475569', 5);
  line(ctx, width - 40, T * 1.4, width - 40, T * 2.6 - 4, '#475569', 5);
  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, primary);
  g.addColorStop(1, secondary);
  fillRound(ctx, 4, 4, width - 8, T * 1.4, 8, g as unknown as string, 'rgba(0,0,0,0.5)', 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Space Grotesk Variable", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name.slice(0, 18), width / 2, T * 0.7 + 4, width - 24);
  ctx.font = '600 11px "Plus Jakarta Sans Variable", sans-serif';
  ctx.fillText('A marca que a cidade escolheu', width / 2, T * 1.1 + 4, width - 24);
  return canvas;
}

/** Fonte da praça. */
export function fountainArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T * 2, T * 1.6);
  const cx = T;
  floorShadow(ctx, cx, T * 1.6 - 8, T - 4, 10, 0.2);
  ellipse(ctx, cx, T * 1.6 - 22, T - 6, 18, '#cbd5e1', OUTLINE);
  ellipse(ctx, cx, T * 1.6 - 26, T - 14, 12, '#60a5fa');
  ellipse(ctx, cx, T * 1.6 - 28, T - 24, 6, '#93c5fd');
  fillRound(ctx, cx - 5, 18, 10, T * 1.6 - 44, 3, '#cbd5e1');
  ellipse(ctx, cx, 20, 12, 5, '#e2e8f0', OUTLINE);
  circle(ctx, cx, 12, 4, '#bfdbfe');
  return canvas;
}

/** Barraca de evento (feira de negócios). */
export function tentArt(color: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T * 2, T * 1.8);
  floorShadow(ctx, T, T * 1.8 - 6, T - 6, 6);
  ctx.beginPath();
  ctx.moveTo(6, T * 0.9);
  ctx.lineTo(T, 6);
  ctx.lineTo(T * 2 - 6, T * 0.9);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  fillRound(ctx, 10, T * 0.9, T * 2 - 20, T * 0.8, 3, '#f8fafc');
  fillRound(ctx, 16, T * 1.15, T * 2 - 32, T * 0.4, 3, shade(color, -0.1));
  return canvas;
}
