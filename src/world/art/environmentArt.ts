// Cenário: piso, paredes, janelas, porta, calçada, rua e elementos externos.

import { OUTLINE, circle, ellipse, fillRound, floorShadow, line, makeCanvas, roundRect, shade } from './draw';
import { T } from './furnitureArt';

export type FloorStyle = 'madeira' | 'piso' | 'concreto' | 'carpete';

export function floorTile(style: FloorStyle): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T);
  if (style === 'madeira') {
    const colors = ['#c99a6b', '#c08f5f', '#d1a477'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i % 3];
      ctx.fillRect(0, i * 12, T, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, i * 12 + 11, T, 1);
      ctx.fillRect(i % 2 ? 30 : 12, i * 12, 1, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(4, i * 12 + 3, 20, 2);
    }
  } else if (style === 'piso') {
    ctx.fillStyle = '#eef2f6';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, T / 2, T / 2);
    ctx.fillRect(T / 2, T / 2, T / 2, T / 2);
    ctx.strokeStyle = 'rgba(100,116,139,0.25)';
    ctx.strokeRect(0.5, 0.5, T - 1, T - 1);
  } else if (style === 'concreto') {
    ctx.fillStyle = '#b8bcc4';
    ctx.fillRect(0, 0, T, T);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.03 + (i % 3) * 0.02})`;
      ctx.fillRect((i * 17) % T, (i * 29) % T, 3, 2);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.strokeRect(0.5, 0.5, T - 1, T - 1);
  } else {
    ctx.fillStyle = '#7c6fb0';
    ctx.fillRect(0, 0, T, T);
    for (let y = 2; y < T; y += 4)
      for (let x = (y / 4) % 2 ? 2 : 0; x < T; x += 4) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(x, y, 2, 2);
      }
  }
  return canvas;
}

/** Parede de fundo (2 tiles de altura) com rodapé. */
export function wallTile(color: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T * 2);
  const g = ctx.createLinearGradient(0, 0, 0, T * 2);
  g.addColorStop(0, shade(color, -0.05));
  g.addColorStop(1, shade(color, 0.05));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, T, T * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let x = 0; x < T; x += 12) ctx.fillRect(x, 10, 1, T * 2 - 20);
  ctx.fillStyle = shade(color, -0.45);
  ctx.fillRect(0, 0, T, 8);
  ctx.fillStyle = shade(color, -0.3);
  ctx.fillRect(0, T * 2 - 9, T, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, T * 2 - 9, T, 1.5);
  return canvas;
}

export function windowArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T * 1.6, T * 1.1);
  const w = canvas.width;
  const h = canvas.height;
  fillRound(ctx, 0, 0, w, h, 4, '#f8fafc', 'rgba(0,0,0,0.35)', 1.5);
  fillRound(ctx, 5, 5, w - 10, h - 10, 2, '#9ad4f5', undefined);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(10, h - 10);
  ctx.lineTo(24, 5);
  ctx.lineTo(32, 5);
  ctx.lineTo(18, h - 10);
  ctx.fill();
  line(ctx, w / 2, 5, w / 2, h - 5, '#f8fafc', 3);
  fillRound(ctx, -3, h - 6, w + 6, 6, 2, '#e2e8f0');
  return canvas;
}

/** Folhas da porta de vidro: 0 = fechada, 1 = aberta. */
export function doorArt(open: boolean, accent: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T);
  fillRound(ctx, 0, 0, T, T, 2, '#475569');
  if (open) {
    fillRound(ctx, 3, 3, 9, T - 3, 2, 'rgba(165, 216, 245, 0.7)', '#334155');
    fillRound(ctx, T - 12, 3, 9, T - 3, 2, 'rgba(165, 216, 245, 0.7)', '#334155');
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(12, 3, T - 24, T - 3);
  } else {
    fillRound(ctx, 3, 3, T / 2 - 4, T - 3, 2, 'rgba(165, 216, 245, 0.85)', '#334155');
    fillRound(ctx, T / 2 + 1, 3, T / 2 - 4, T - 3, 2, 'rgba(165, 216, 245, 0.85)', '#334155');
    line(ctx, T / 2 - 4, 20, T / 2 - 4, 30, '#e2e8f0', 2);
    line(ctx, T / 2 + 4, 20, T / 2 + 4, 30, '#e2e8f0', 2);
  }
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, T, 4);
  return canvas;
}

export function sidewalkTile(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T);
  ctx.fillStyle = '#d4d0c8';
  ctx.fillRect(0, 0, T, T);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, T / 2, T / 2);
  ctx.strokeRect(T / 2 + 0.5, T / 2 + 0.5, T / 2 - 1, T / 2 - 1);
  ctx.strokeRect(0.5, T / 2 + 0.5, T / 2, T / 2 - 1);
  ctx.strokeRect(T / 2 + 0.5, 0.5, T / 2 - 1, T / 2);
  return canvas;
}

export function curbTile(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T);
  ctx.fillStyle = '#4b5060';
  ctx.fillRect(0, 0, T, T);
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(0, 0, T, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 10; i++) ctx.fillRect((i * 13) % T, 10 + ((i * 7) % 30), 2, 2);
  return canvas;
}

export function roadTile(dashes: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T);
  ctx.fillStyle = '#4b5060';
  ctx.fillRect(0, 0, T, T);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 10; i++) ctx.fillRect((i * 13) % T, (i * 19) % T, 2, 2);
  if (dashes) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(6, T / 2 - 2, 18, 4);
  }
  return canvas;
}

export function grassTile(seed = 0): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T, T);
  ctx.fillStyle = '#7cc46a';
  ctx.fillRect(0, 0, T, T);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,80,0,0.1)';
    ctx.fillRect((i * 17 + seed * 7) % T, (i * 23 + seed * 11) % T, 3, 2);
  }
  return canvas;
}

export function treeArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T * 1.4, T * 2);
  const cx = canvas.width / 2;
  floorShadow(ctx, cx, T * 2 - 6, 20, 6, 0.25);
  fillRound(ctx, cx - 4, T * 2 - 34, 8, 30, 3, '#7c4a1e');
  circle(ctx, cx - 12, T * 2 - 46, 16, '#2f9e44', OUTLINE);
  circle(ctx, cx + 12, T * 2 - 46, 16, '#2b8a3e', OUTLINE);
  circle(ctx, cx, T * 2 - 62, 18, '#40c057', OUTLINE);
  circle(ctx, cx - 5, T * 2 - 68, 6, 'rgba(255,255,255,0.18)');
  return canvas;
}

export function lampPostArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T * 0.7, T * 2);
  const cx = canvas.width / 2;
  floorShadow(ctx, cx, T * 2 - 4, 8, 3);
  fillRound(ctx, cx - 2, 12, 4, T * 2 - 16, 2, '#374151');
  fillRound(ctx, cx - 9, 2, 18, 12, 4, '#1f2937');
  ellipse(ctx, cx, 13, 6, 3, '#fde68a');
  return canvas;
}

export function benchArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(T * 1.5, T);
  floorShadow(ctx, canvas.width / 2, T - 6, 30, 5);
  fillRound(ctx, 4, 8, canvas.width - 8, 10, 3, '#a16207');
  fillRound(ctx, 4, 22, canvas.width - 8, 10, 3, '#ca8a04');
  line(ctx, 10, 32, 10, T - 6, '#374151', 3);
  line(ctx, canvas.width - 10, 32, canvas.width - 10, T - 6, '#374151', 3);
  return canvas;
}

export function carArt(color: string, vertical = false): HTMLCanvasElement {
  const w = vertical ? T * 0.9 : T * 1.8;
  const h = vertical ? T * 1.8 : T * 0.9;
  const { canvas, ctx } = makeCanvas(w, h);
  floorShadow(ctx, w / 2, h / 2 + 4, w / 2 - 2, h / 2 - 4, 0.3);
  fillRound(ctx, 2, 2, w - 4, h - 6, 10, color);
  if (vertical) {
    fillRound(ctx, 7, h * 0.22, w - 14, h * 0.2, 4, 'rgba(186, 230, 253, 0.85)');
    fillRound(ctx, 7, h * 0.62, w - 14, h * 0.14, 4, 'rgba(186, 230, 253, 0.6)');
  } else {
    fillRound(ctx, w * 0.58, 7, w * 0.18, h - 18, 4, 'rgba(186, 230, 253, 0.85)');
    fillRound(ctx, w * 0.2, 7, w * 0.14, h - 18, 4, 'rgba(186, 230, 253, 0.6)');
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, 6, 5, w - 12, 5, 2);
  ctx.fill();
  return canvas;
}

// --- Efeitos -------------------------------------------------------------------------

export function coinArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(18, 18);
  circle(ctx, 9, 9, 7.5, '#facc15', '#a16207', 1.5);
  circle(ctx, 9, 9, 4.5, '#fde047');
  ctx.fillStyle = '#a16207';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', 9, 12);
  return canvas;
}

export function heartArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(20, 18);
  ctx.beginPath();
  ctx.moveTo(10, 16);
  ctx.bezierCurveTo(-4, 6, 4, -4, 10, 4);
  ctx.bezierCurveTo(16, -4, 24, 6, 10, 16);
  ctx.fillStyle = '#f43f5e';
  ctx.fill();
  ctx.strokeStyle = '#9f1239';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  return canvas;
}

/** Balão com ícone (coração, cara brava, interrogação, exclamação, lâmpada, nota musical, sacola). */
export function bubbleArt(icon: 'heart' | 'angry' | 'question' | 'alert' | 'idea' | 'bag' | 'star' | 'zzz' | 'money'): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(30, 32);
  fillRound(ctx, 2, 2, 26, 22, 9, '#ffffff', 'rgba(15,23,42,0.45)', 1.4);
  ctx.beginPath();
  ctx.moveTo(10, 23);
  ctx.lineTo(15, 30);
  ctx.lineTo(18, 23);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const cx = 15;
  const cy = 13;
  switch (icon) {
    case 'heart':
      ctx.beginPath();
      ctx.moveTo(cx, cy + 6);
      ctx.bezierCurveTo(cx - 10, cy - 1, cx - 4, cy - 8, cx, cy - 3);
      ctx.bezierCurveTo(cx + 4, cy - 8, cx + 10, cy - 1, cx, cy + 6);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      break;
    case 'angry':
      circle(ctx, cx, cy, 7, '#f87171');
      line(ctx, cx - 4, cy - 3, cx - 1, cy - 1, '#7f1d1d', 1.5);
      line(ctx, cx + 4, cy - 3, cx + 1, cy - 1, '#7f1d1d', 1.5);
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 3, Math.PI * 1.2, Math.PI * 1.8);
      ctx.strokeStyle = '#7f1d1d';
      ctx.stroke();
      break;
    case 'question':
    case 'alert':
      ctx.fillStyle = icon === 'question' ? '#6366f1' : '#f59e0b';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(icon === 'question' ? '?' : '!', cx, cy + 6);
      break;
    case 'idea':
      circle(ctx, cx, cy - 1, 5.5, '#fde047', '#a16207');
      fillRound(ctx, cx - 3, cy + 4, 6, 4, 1, '#9ca3af');
      break;
    case 'bag':
      fillRound(ctx, cx - 6, cy - 3, 12, 10, 2, '#8b5cf6');
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 3.5, Math.PI, 0);
      ctx.strokeStyle = '#5b21b6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 3 : 7;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fillStyle = '#facc15';
      ctx.fill();
      break;
    case 'zzz':
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('z z', cx, cy + 4);
      break;
    case 'money':
      circle(ctx, cx, cy, 6.5, '#facc15', '#a16207');
      ctx.fillStyle = '#a16207';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', cx, cy + 3);
      break;
  }
  return canvas;
}

export function glowArt(size = 160, color = '255, 214, 140'): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${color}, 1)`);
  g.addColorStop(0.45, `rgba(${color}, 0.6)`);
  g.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export function dustArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(16, 16);
  circle(ctx, 8, 8, 7, 'rgba(226, 232, 240, 0.9)');
  return canvas;
}

export function confettiArt(color: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(8, 5);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 8, 5);
  return canvas;
}

export function sparkleArt(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(16, 16);
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(10, 6);
  ctx.lineTo(16, 8);
  ctx.lineTo(10, 10);
  ctx.lineTo(8, 16);
  ctx.lineTo(6, 10);
  ctx.lineTo(0, 8);
  ctx.lineTo(6, 6);
  ctx.closePath();
  ctx.fillStyle = '#fff7ae';
  ctx.fill();
  return canvas;
}

/** Placa da fachada com o nome da empresa. */
export function facadeSign(name: string, primary: string, secondary: string): HTMLCanvasElement {
  const width = Math.max(T * 3, Math.min(T * 6, name.length * 11 + 40));
  const { canvas, ctx } = makeCanvas(width, 30);
  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, primary);
  g.addColorStop(1, secondary);
  fillRound(ctx, 1, 1, width - 2, 28, 8, g as unknown as string, 'rgba(0,0,0,0.4)', 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Space Grotesk Variable", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name.slice(0, 26), width / 2, 20);
  return canvas;
}

/** Plaquinha "ABERTO" / "FECHADO" na porta. */
export function openSign(open: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 18);
  fillRound(ctx, 1, 1, 54, 16, 5, open ? '#16a34a' : '#b91c1c', 'rgba(0,0,0,0.35)', 1);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'ABERTO' : 'FECHADO', 28, 13);
  return canvas;
}

export function shadowBlob(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(40, 14);
  ellipse(ctx, 20, 7, 18, 6, 'rgba(15, 10, 30, 0.25)');
  return canvas;
}
