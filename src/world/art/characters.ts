// Personagens cartoon 2D desenhados em canvas: gera uma "folha de sprites"
// com todas as poses (andar em 4 direções, parado, sentado, trabalhando,
// conversando, comemorando e triste).

import type { Gender, HairStyle, OutfitStyle } from '../../game/types';
import { type Ctx, OUTLINE, circle, ellipse, fillRound, floorShadow, line, makeCanvas, roundRect, shade } from './draw';

export interface Look {
  /** Padrão: masculino. */
  gender?: Gender;
  beard?: boolean;
  skirt?: boolean;
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  shirt: string;
  pants: string;
  style: OutfitStyle;
  glasses?: boolean;
  apron?: string;
  accessory?: 'briefcase' | 'box' | 'camera' | 'none';
}

export const CW = 48;
export const CH = 64;
const GROUND = 61;

type Dir = 'down' | 'up' | 'right' | 'left';
type Mouth = 'smile' | 'neutral' | 'sad' | 'open';
type Arms = 'down' | 'up' | 'forward' | 'gesture' | 'type';
type Seat = 'none' | 'back' | 'front' | 'side';

interface Pose {
  dir: Dir;
  leg: number;
  arm: number;
  bob: number;
  arms: Arms;
  mouth: Mouth;
  seat: Seat;
  tilt?: number;
}

/** Ordem dos quadros na folha de sprites. */
export const FRAMES: { name: string; pose: Pose }[] = (() => {
  const list: { name: string; pose: Pose }[] = [];
  const walk = [0, 1, 0, -1];
  for (const dir of ['down', 'up', 'right', 'left'] as Dir[]) {
    walk.forEach((leg, i) =>
      list.push({ name: `walk-${dir}-${i}`, pose: { dir, leg, arm: -leg, bob: leg === 0 ? 0 : -1, arms: 'down', mouth: 'smile', seat: 'none' } }),
    );
  }
  list.push({ name: 'idle-down-0', pose: { dir: 'down', leg: 0, arm: 0, bob: 0, arms: 'down', mouth: 'smile', seat: 'none' } });
  list.push({ name: 'idle-down-1', pose: { dir: 'down', leg: 0, arm: 0, bob: 1, arms: 'down', mouth: 'smile', seat: 'none' } });
  for (const dir of ['up', 'right', 'left'] as Dir[])
    list.push({ name: `idle-${dir}-0`, pose: { dir, leg: 0, arm: 0, bob: 0, arms: 'down', mouth: 'smile', seat: 'none' } });
  list.push({ name: 'sit-up-0', pose: { dir: 'up', leg: 0, arm: 1, bob: 0, arms: 'type', mouth: 'neutral', seat: 'back' } });
  list.push({ name: 'sit-up-1', pose: { dir: 'up', leg: 0, arm: -1, bob: 0, arms: 'type', mouth: 'neutral', seat: 'back' } });
  list.push({ name: 'workup-0', pose: { dir: 'up', leg: 0, arm: 1, bob: 0, arms: 'type', mouth: 'neutral', seat: 'none' } });
  list.push({ name: 'workup-1', pose: { dir: 'up', leg: 0, arm: -1, bob: -1, arms: 'type', mouth: 'neutral', seat: 'none' } });
  list.push({ name: 'work-down-0', pose: { dir: 'down', leg: 0, arm: 1, bob: 0, arms: 'forward', mouth: 'smile', seat: 'none' } });
  list.push({ name: 'work-down-1', pose: { dir: 'down', leg: 0, arm: -1, bob: 0, arms: 'forward', mouth: 'smile', seat: 'none' } });
  list.push({ name: 'talk-0', pose: { dir: 'down', leg: 0, arm: 0, bob: 0, arms: 'gesture', mouth: 'open', seat: 'none' } });
  list.push({ name: 'talk-1', pose: { dir: 'down', leg: 0, arm: 1, bob: 0, arms: 'down', mouth: 'smile', seat: 'none' } });
  list.push({ name: 'cheer-0', pose: { dir: 'down', leg: 0, arm: 0, bob: -5, arms: 'up', mouth: 'open', seat: 'none' } });
  list.push({ name: 'cheer-1', pose: { dir: 'down', leg: 0, arm: 0, bob: 0, arms: 'up', mouth: 'smile', seat: 'none' } });
  list.push({ name: 'sad-0', pose: { dir: 'down', leg: 0, arm: 0, bob: 1, arms: 'down', mouth: 'sad', seat: 'none', tilt: 3 } });
  list.push({ name: 'sad-1', pose: { dir: 'down', leg: 0, arm: 0, bob: 2, arms: 'down', mouth: 'sad', seat: 'none', tilt: 4 } });
  list.push({ name: 'sitfront-0', pose: { dir: 'down', leg: 0, arm: 0, bob: 0, arms: 'down', mouth: 'smile', seat: 'front' } });
  list.push({ name: 'sitright-0', pose: { dir: 'right', leg: 0, arm: 0, bob: 0, arms: 'forward', mouth: 'smile', seat: 'side' } });
  list.push({ name: 'sitleft-0', pose: { dir: 'left', leg: 0, arm: 0, bob: 0, arms: 'forward', mouth: 'smile', seat: 'side' } });
  return list;
})();

const SHOE = '#2b2833';

function drawHairBack(ctx: Ctx, look: Look, cx: number, hy: number) {
  // Cabelo que fica atrás da cabeça (longo, coque visto de frente).
  if (look.hairStyle === 'longo') fillRound(ctx, cx - 13.5, hy - 6, 27, 26, 9, shade(look.hairColor, -0.1));
  if (look.hairStyle === 'cacheado') {
    for (const [dx, dy] of [
      [-12, 2],
      [12, 2],
      [-10, 9],
      [10, 9],
    ])
      circle(ctx, cx + dx, hy + dy, 6.5, shade(look.hairColor, -0.08), OUTLINE);
  }
}

function drawHairFront(ctx: Ctx, look: Look, cx: number, hy: number) {
  const c = look.hairColor;
  switch (look.hairStyle) {
    case 'curto':
      ctx.beginPath();
      ctx.arc(cx, hy, 12.6, Math.PI * 1.02, Math.PI * 1.98);
      ctx.quadraticCurveTo(cx + 6, hy - 7, cx - 4, hy - 6);
      ctx.quadraticCurveTo(cx - 9, hy - 5, cx - 12.4, hy - 1);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      break;
    case 'longo':
      ctx.beginPath();
      ctx.arc(cx, hy, 12.8, Math.PI * 1.0, Math.PI * 2.0);
      ctx.lineTo(cx + 12.8, hy + 4);
      ctx.quadraticCurveTo(cx + 9, hy - 6, cx + 1, hy - 7);
      ctx.quadraticCurveTo(cx - 9, hy - 6, cx - 12.8, hy + 4);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      break;
    case 'cacheado':
      for (const [dx, dy, r] of [
        [-9, -6, 6.5],
        [-3, -10, 7],
        [4, -10, 7],
        [10, -5, 6.5],
        [0, -5, 6],
      ])
        circle(ctx, cx + dx, hy + dy, r, c, OUTLINE);
      break;
    case 'coque':
      circle(ctx, cx, hy - 14, 6, c, OUTLINE);
      ctx.beginPath();
      ctx.arc(cx, hy, 12.6, Math.PI * 1.02, Math.PI * 1.98);
      ctx.quadraticCurveTo(cx, hy - 8, cx - 12.4, hy - 1);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      break;
    case 'moicano':
      ctx.beginPath();
      ctx.moveTo(cx - 4, hy - 9);
      ctx.lineTo(cx - 2, hy - 19);
      ctx.lineTo(cx + 1, hy - 13);
      ctx.lineTo(cx + 4, hy - 20);
      ctx.lineTo(cx + 5, hy - 9);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      break;
    case 'careca':
      ellipse(ctx, cx - 4, hy - 7, 3.5, 2, 'rgba(255,255,255,0.35)');
      break;
  }
}

const isFem = (look: Look) => look.gender === 'feminino';
const LIPS = '#c2185b';

function drawBeardFront(ctx: Ctx, look: Look, cx: number, hy: number) {
  ctx.save();
  ctx.strokeStyle = shade(look.hairColor, 0.08);
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, hy + 0.5, 10.6, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.restore();
  fillRound(ctx, cx - 3.6, hy + 3, 7.2, 1.8, 0.9, shade(look.hairColor, 0.08), undefined);
}

function drawFace(ctx: Ctx, look: Look, cx: number, hy: number, mouth: Mouth) {
  const eye = '#2a1c18';
  const browY = hy - 3.5;
  const fem = isFem(look);
  const browW = fem ? 1 : 1.6;
  if (mouth === 'sad') {
    line(ctx, cx - 7, browY - 1, cx - 3, browY + 1, shade(look.hairColor, -0.2), browW + 0.1);
    line(ctx, cx + 7, browY - 1, cx + 3, browY + 1, shade(look.hairColor, -0.2), browW + 0.1);
  } else {
    line(ctx, cx - 7, browY, cx - 3, browY - 0.6, shade(look.hairColor, -0.2), browW);
    line(ctx, cx + 7, browY, cx + 3, browY - 0.6, shade(look.hairColor, -0.2), browW);
  }
  ellipse(ctx, cx - 5, hy + 1, 1.9, 2.5, eye);
  ellipse(ctx, cx + 5, hy + 1, 1.9, 2.5, eye);
  circle(ctx, cx - 4.4, hy + 0.2, 0.7, '#fff');
  circle(ctx, cx + 5.6, hy + 0.2, 0.7, '#fff');
  if (fem) {
    // cílios
    line(ctx, cx - 6.6, hy - 0.6, cx - 8.6, hy - 2.2, eye, 1.1);
    line(ctx, cx - 5.6, hy - 1.3, cx - 6.6, hy - 3.1, eye, 1);
    line(ctx, cx + 6.6, hy - 0.6, cx + 8.6, hy - 2.2, eye, 1.1);
    line(ctx, cx + 5.6, hy - 1.3, cx + 6.6, hy - 3.1, eye, 1);
  }
  ellipse(ctx, cx - 8, hy + 5, 2.4, 1.4, fem ? 'rgba(255, 110, 140, 0.45)' : 'rgba(255, 110, 120, 0.3)');
  ellipse(ctx, cx + 8, hy + 5, 2.4, 1.4, fem ? 'rgba(255, 110, 140, 0.45)' : 'rgba(255, 110, 120, 0.3)');
  if (look.beard && !fem) drawBeardFront(ctx, look, cx, hy);
  ctx.lineWidth = fem ? 1.7 : 1.4;
  ctx.strokeStyle = fem ? LIPS : '#5b2a2a';
  ctx.beginPath();
  if (mouth === 'smile') ctx.arc(cx, hy + 4.5, 3.2, Math.PI * 0.18, Math.PI * 0.82);
  else if (mouth === 'neutral') {
    ctx.moveTo(cx - 2.5, hy + 7);
    ctx.lineTo(cx + 2.5, hy + 7);
  } else if (mouth === 'sad') ctx.arc(cx, hy + 9.5, 3, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  if (mouth === 'open') ellipse(ctx, cx, hy + 7, 2.8, 2.4, '#7a2734');
  if (look.glasses) {
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = '#1f2433';
    ctx.beginPath();
    ctx.arc(cx - 5, hy + 1, 3.6, 0, Math.PI * 2);
    ctx.moveTo(cx + 8.6, hy + 1);
    ctx.arc(cx + 5, hy + 1, 3.6, 0, Math.PI * 2);
    ctx.moveTo(cx - 1.4, hy + 0.5);
    ctx.lineTo(cx + 1.4, hy + 0.5);
    ctx.stroke();
  }
}

function drawStyleFront(ctx: Ctx, look: Look, cx: number, top: number) {
  const accent = shade(look.shirt, -0.35);
  switch (look.style) {
    case 'social':
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx - 5, top);
      ctx.lineTo(cx, top + 6);
      ctx.lineTo(cx + 5, top);
      ctx.closePath();
      ctx.fill();
      fillRound(ctx, cx - 1.6, top + 3, 3.2, 11, 1.2, '#c0392b', 'rgba(0,0,0,0.25)', 0.8);
      line(ctx, cx - 9, top + 2, cx - 4, top + 16, 'rgba(0,0,0,0.18)', 1.2);
      line(ctx, cx + 9, top + 2, cx + 4, top + 16, 'rgba(0,0,0,0.18)', 1.2);
      break;
    case 'criativo':
      ctx.save();
      roundRect(ctx, cx - 10, top, 20, 19, 6);
      ctx.clip();
      for (let i = -2; i < 4; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(cx - 10, top + 2 + i * 6, 20, 2.5);
      }
      ctx.restore();
      fillRound(ctx, cx - 7, top - 1, 14, 4, 2, '#fbbf24', 'rgba(0,0,0,0.2)', 0.8);
      break;
    case 'esportivo':
      ellipse(ctx, cx, top + 1, 8, 3, shade(look.shirt, -0.2));
      line(ctx, cx, top + 3, cx, top + 18, accent, 1.2);
      line(ctx, cx - 3, top + 3, cx - 3, top + 8, '#f8fafc', 1);
      line(ctx, cx + 3, top + 3, cx + 3, top + 8, '#f8fafc', 1);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(cx - 10, top + 9, 20, 2);
      break;
    default:
      circle(ctx, cx + 3, top + 9, 3, 'rgba(255,255,255,0.35)');
      ctx.beginPath();
      ctx.arc(cx, top - 1, 5, 0, Math.PI);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
  }
}

function drawCharacter(ctx: Ctx, ox: number, oy: number, look: Look, pose: Pose) {
  const flip = pose.dir === 'left';
  ctx.save();
  if (flip) {
    ctx.translate(ox + CW, oy);
    ctx.scale(-1, 1);
  } else ctx.translate(ox, oy);
  const dir: Dir = flip ? 'right' : pose.dir;
  const cx = CW / 2;
  const seated = pose.seat !== 'none';
  const ground = GROUND;
  const bob = pose.bob;
  const torsoTop = ground - 33 + bob + (seated ? 8 : 0);
  const hy = torsoTop - 11 + (pose.tilt ?? 0);

  floorShadow(ctx, cx, ground - 1, 13, 3.6);

  if (dir === 'down' || dir === 'up') {
    // Pernas
    if (pose.seat === 'front') {
      fillRound(ctx, cx - 9, ground - 15, 8, 9, 3, look.skirt ? look.skin : look.pants);
      fillRound(ctx, cx + 1, ground - 15, 8, 9, 3, look.skirt ? look.skin : look.pants);
      ellipse(ctx, cx - 5, ground - 5, 4.5, 2.6, SHOE, OUTLINE);
      ellipse(ctx, cx + 5, ground - 5, 4.5, 2.6, SHOE, OUTLINE);
    } else if (pose.seat === 'back') {
      // pernas escondidas pela cadeira
    } else {
      for (const side of [-1, 1]) {
        const lift = side === -1 ? Math.max(0, pose.leg) * 3 : Math.max(0, -pose.leg) * 3;
        if (look.skirt) fillRound(ctx, cx + side * 5 - 2.5, ground - 15 - lift + bob * 0.5, 5, 12, 2.2, side === -1 ? look.skin : shade(look.skin, -0.06));
        else fillRound(ctx, cx + side * 5 - 3.5, ground - 16 - lift + bob * 0.5, 7, 13, 2.5, side === -1 ? look.pants : shade(look.pants, -0.06));
        ellipse(ctx, cx + side * 5, ground - 3 - lift, 4.6, 2.6, SHOE, OUTLINE);
      }
    }

    if (dir === 'down') drawHairBack(ctx, look, cx, hy);

    // Braços atrás do corpo (quando levantados para trabalhar de costas)
    const armColor = shade(look.shirt, -0.08);
    // Tronco
    fillRound(ctx, cx - 10, torsoTop, 20, 19, 6, look.shirt);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    roundRect(ctx, cx - 10, torsoTop + 13, 20, 6, 4);
    ctx.fill();
    if (look.skirt) {
      // saia
      ctx.beginPath();
      ctx.moveTo(cx - 10, torsoTop + 15);
      ctx.lineTo(cx + 10, torsoTop + 15);
      ctx.lineTo(cx + 13, torsoTop + 25);
      ctx.quadraticCurveTo(cx, torsoTop + 27.5, cx - 13, torsoTop + 25);
      ctx.closePath();
      ctx.fillStyle = look.pants;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1;
      ctx.stroke();
      line(ctx, cx - 4, torsoTop + 17, cx - 5, torsoTop + 25, 'rgba(0,0,0,0.15)', 1);
      line(ctx, cx + 4, torsoTop + 17, cx + 5, torsoTop + 25, 'rgba(0,0,0,0.15)', 1);
    } else if (!seated) fillRound(ctx, cx - 10, torsoTop + 16, 20, 3.5, 1.5, shade(look.pants, -0.1), 'rgba(0,0,0,0.25)', 0.8);
    if (dir === 'down') drawStyleFront(ctx, look, cx, torsoTop);
    if (dir === 'down' && look.apron) {
      fillRound(ctx, cx - 7.5, torsoTop + 5, 15, 16, 3, look.apron, 'rgba(0,0,0,0.3)', 0.9);
      line(ctx, cx - 6, torsoTop + 5, cx - 9, torsoTop, look.apron, 1.6);
      line(ctx, cx + 6, torsoTop + 5, cx + 9, torsoTop, look.apron, 1.6);
    }

    // Braços
    const hand = look.skin;
    if (pose.arms === 'up') {
      fillRound(ctx, cx - 16, torsoTop - 13, 5.5, 16, 2.5, armColor);
      fillRound(ctx, cx + 10.5, torsoTop - 13, 5.5, 16, 2.5, armColor);
      circle(ctx, cx - 13.3, torsoTop - 14, 3.2, hand, OUTLINE);
      circle(ctx, cx + 13.3, torsoTop - 14, 3.2, hand, OUTLINE);
    } else if (pose.arms === 'forward' || pose.arms === 'type') {
      const a = pose.arm;
      if (dir === 'up') {
        fillRound(ctx, cx - 15, torsoTop + 1 + a, 5.5, 11, 2.5, armColor);
        fillRound(ctx, cx + 9.5, torsoTop + 1 - a, 5.5, 11, 2.5, armColor);
      } else {
        fillRound(ctx, cx - 14, torsoTop + 3, 5.5, 10, 2.5, armColor);
        fillRound(ctx, cx + 8.5, torsoTop + 3, 5.5, 10, 2.5, armColor);
        circle(ctx, cx - 6 + a * 1.5, torsoTop + 13, 3, hand, OUTLINE);
        circle(ctx, cx + 6 - a * 1.5, torsoTop + 13, 3, hand, OUTLINE);
      }
    } else if (pose.arms === 'gesture') {
      fillRound(ctx, cx - 15, torsoTop + 2, 5.5, 14, 2.5, armColor);
      circle(ctx, cx - 12.3, torsoTop + 16, 3, hand, OUTLINE);
      ctx.save();
      ctx.translate(cx + 12, torsoTop + 3);
      ctx.rotate(-0.9);
      fillRound(ctx, -2.7, -1, 5.5, 13, 2.5, armColor);
      circle(ctx, 0, 13, 3, hand, OUTLINE);
      ctx.restore();
    } else {
      const s = pose.arm * 2;
      fillRound(ctx, cx - 15, torsoTop + 2 + s, 5.5, 14, 2.5, armColor);
      fillRound(ctx, cx + 9.5, torsoTop + 2 - s, 5.5, 14, 2.5, armColor);
      circle(ctx, cx - 12.3, torsoTop + 16 + s, 3, hand, OUTLINE);
      circle(ctx, cx + 12.3, torsoTop + 16 - s, 3, hand, OUTLINE);
    }

    // Acessórios
    if (dir === 'down' && look.accessory === 'briefcase') fillRound(ctx, cx + 11, torsoTop + 15, 9, 7, 1.5, '#6b4423');
    if (dir === 'down' && look.accessory === 'box') {
      fillRound(ctx, cx - 9, torsoTop + 6, 18, 12, 1.5, '#c8a26b');
      line(ctx, cx - 9, torsoTop + 10, cx + 9, torsoTop + 10, 'rgba(0,0,0,0.2)', 1);
    }
    if (dir === 'down' && look.accessory === 'camera') fillRound(ctx, cx - 6, torsoTop + 4, 12, 8, 2, '#1f2937');

    // Pescoço e cabeça
    fillRound(ctx, cx - 3, torsoTop - 3, 6, 5, 1.5, shade(look.skin, -0.1), undefined);
    if (dir === 'down') {
      circle(ctx, cx - 12, hy + 2, 2.6, shade(look.skin, -0.05), OUTLINE);
      circle(ctx, cx + 12, hy + 2, 2.6, shade(look.skin, -0.05), OUTLINE);
      circle(ctx, cx, hy, 12, look.skin, OUTLINE);
      ellipse(ctx, cx, hy + 7, 8, 3, 'rgba(0,0,0,0.05)');
      drawFace(ctx, look, cx, hy, pose.mouth);
      drawHairFront(ctx, look, cx, hy);
      if (isFem(look)) {
        circle(ctx, cx - 12.4, hy + 5.6, 1.5, '#facc15', OUTLINE, 0.7);
        circle(ctx, cx + 12.4, hy + 5.6, 1.5, '#facc15', OUTLINE, 0.7);
      }
    } else {
      circle(ctx, cx - 12, hy + 2, 2.6, shade(look.skin, -0.05), OUTLINE);
      circle(ctx, cx + 12, hy + 2, 2.6, shade(look.skin, -0.05), OUTLINE);
      circle(ctx, cx, hy, 12, look.skin, OUTLINE);
      if (look.hairStyle === 'careca') ellipse(ctx, cx - 3, hy - 6, 4, 2, 'rgba(255,255,255,0.3)');
      else if (look.hairStyle === 'moicano') fillRound(ctx, cx - 3, hy - 14, 6, 22, 3, look.hairColor);
      else {
        // De costas, o cabelo cobre quase toda a cabeça; só a nuca aparece.
        circle(ctx, cx, hy - 0.5, 12.7, look.hairColor, OUTLINE);
        if (look.hairStyle === 'curto') ellipse(ctx, cx, hy + 9, 6.5, 3, shade(look.skin, -0.08));
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.ellipse(cx - 4, hy - 6, 5, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();
        if (look.hairStyle === 'longo') fillRound(ctx, cx - 12.6, hy, 25.2, 20, 8, look.hairColor);
        if (look.hairStyle === 'coque') circle(ctx, cx, hy - 10, 6, shade(look.hairColor, 0.05), OUTLINE);
        if (look.hairStyle === 'cacheado') for (const dx of [-8, 0, 8]) circle(ctx, cx + dx, hy - 7, 6, look.hairColor, OUTLINE);
      }
    }
  } else {
    // Vista lateral (direita; esquerda é espelhada)
    if (pose.seat === 'side') {
      fillRound(ctx, cx - 3, ground - 18, 13, 6, 2.5, look.pants);
      fillRound(ctx, cx + 6, ground - 15, 6, 11, 2.5, shade(look.skirt ? look.skin : look.pants, -0.08));
      ellipse(ctx, cx + 11, ground - 4, 4.6, 2.4, SHOE, OUTLINE);
    } else {
      const stride = pose.leg * 4;
      const legColor = look.skirt ? look.skin : look.pants;
      const legW = look.skirt ? 5 : 7;
      fillRound(ctx, cx - legW / 2 - stride, ground - 16 + bob * 0.5, legW, 13, 2.5, shade(legColor, -0.12));
      ellipse(ctx, cx + 1 - stride, ground - 3, 4.6, 2.5, SHOE, OUTLINE);
      fillRound(ctx, cx - legW / 2 + stride, ground - 16 + bob * 0.5, legW, 13, 2.5, legColor);
      ellipse(ctx, cx + 1 + stride, ground - 3, 4.6, 2.5, SHOE, OUTLINE);
    }
    if (look.hairStyle === 'longo') fillRound(ctx, cx - 12, hy - 4, 14, 24, 7, shade(look.hairColor, -0.1));
    fillRound(ctx, cx - 7, torsoTop, 14, 19, 6, look.shirt);
    if (look.apron) fillRound(ctx, cx + 1, torsoTop + 5, 6, 15, 2, look.apron, 'rgba(0,0,0,0.3)', 0.8);
    if (look.skirt) {
      ctx.beginPath();
      ctx.moveTo(cx - 7, torsoTop + 15);
      ctx.lineTo(cx + 7, torsoTop + 15);
      ctx.lineTo(cx + 10, torsoTop + 25);
      ctx.lineTo(cx - 9, torsoTop + 25);
      ctx.closePath();
      ctx.fillStyle = look.pants;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (!seated) fillRound(ctx, cx - 7, torsoTop + 16, 14, 3.5, 1.5, shade(look.pants, -0.1), 'rgba(0,0,0,0.25)', 0.8);
    // braço
    if (pose.arms === 'forward') {
      fillRound(ctx, cx - 1, torsoTop + 4, 12, 5.5, 2.5, shade(look.shirt, -0.08));
      circle(ctx, cx + 12, torsoTop + 7, 3, look.skin, OUTLINE);
    } else {
      const swing = pose.arm * 3;
      ctx.save();
      ctx.translate(cx, torsoTop + 3);
      ctx.rotate(swing * 0.08);
      fillRound(ctx, -2.7, 0, 5.5, 14, 2.5, shade(look.shirt, -0.08));
      circle(ctx, 0, 14.5, 3, look.skin, OUTLINE);
      ctx.restore();
    }
    fillRound(ctx, cx - 2.5, torsoTop - 3, 5, 5, 1.5, shade(look.skin, -0.1), undefined);
    circle(ctx, cx + 1, hy, 12, look.skin, OUTLINE);
    // nariz, olho e boca
    ellipse(ctx, cx + 12.2, hy + 2.5, 2, 1.8, shade(look.skin, -0.05));
    ellipse(ctx, cx + 6.5, hy + 0.5, 1.8, 2.4, '#2a1c18');
    circle(ctx, cx + 7, hy - 0.2, 0.6, '#fff');
    if (look.glasses) {
      ctx.strokeStyle = '#1f2433';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(cx + 7, hy + 0.5, 3.4, 0, Math.PI * 2);
      ctx.moveTo(cx + 3.6, hy);
      ctx.lineTo(cx - 6, hy - 1);
      ctx.stroke();
    }
    if (isFem(look)) line(ctx, cx + 7.6, hy - 1.4, cx + 9.8, hy - 3, '#2a1c18', 1.1);
    if (look.beard && !isFem(look)) {
      ctx.save();
      ctx.strokeStyle = shade(look.hairColor, 0.08);
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(cx + 1, hy + 0.5, 10.6, Math.PI * 0.05, Math.PI * 0.6);
      ctx.stroke();
      ctx.restore();
      fillRound(ctx, cx + 7, hy + 3.6, 4.5, 1.8, 0.9, shade(look.hairColor, 0.08), undefined);
    }
    line(ctx, cx + 7, hy + 6.5, cx + 10, hy + 6, isFem(look) ? LIPS : '#5b2a2a', isFem(look) ? 1.6 : 1.3);
    circle(ctx, cx - 3, hy + 2, 2.6, shade(look.skin, -0.05), OUTLINE);
    if (isFem(look)) circle(ctx, cx - 3, hy + 5.8, 1.5, '#facc15', OUTLINE, 0.7);
    // cabelo de lado
    const c = look.hairColor;
    if (look.hairStyle !== 'careca') {
      ctx.beginPath();
      if (look.hairStyle === 'moicano') {
        ctx.moveTo(cx - 6, hy - 10);
        ctx.lineTo(cx - 2, hy - 20);
        ctx.lineTo(cx + 2, hy - 12);
        ctx.lineTo(cx + 6, hy - 18);
        ctx.lineTo(cx + 7, hy - 9);
      } else {
        ctx.arc(cx + 1, hy, 12.6, Math.PI * 0.75, Math.PI * 1.85);
        ctx.quadraticCurveTo(cx + 6, hy - 6, cx - 2, hy - 4);
        ctx.quadraticCurveTo(cx - 5, hy + 2, cx - 10, hy + 6);
      }
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (look.hairStyle === 'coque') circle(ctx, cx - 9, hy - 9, 5.5, c, OUTLINE);
      if (look.hairStyle === 'cacheado') for (const [dx, dy] of [[-8, -8], [0, -11], [-11, 1]]) circle(ctx, cx + dx, hy + dy, 6, c, OUTLINE);
    } else ellipse(ctx, cx - 2, hy - 7, 4, 2, 'rgba(255,255,255,0.3)');
  }
  ctx.restore();
}

/** Desenha a folha de sprites completa de um personagem. */
export function renderCharacterSheet(look: Look): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(CW * FRAMES.length, CH);
  FRAMES.forEach((f, i) => drawCharacter(ctx, i * CW, 0, look, f.pose));
  return canvas;
}

/** Desenha um único quadro (usado no criador de personagem e nos retratos). */
export function renderCharacterFrame(look: Look, frameName = 'idle-down-0', scale = 3): HTMLCanvasElement {
  const frame = FRAMES.find((f) => f.name === frameName) ?? FRAMES[0];
  const { canvas, ctx } = makeCanvas(CW * scale, CH * scale);
  ctx.scale(scale, scale);
  drawCharacter(ctx, 0, 0, look, frame.pose);
  return canvas;
}

export function drawCharacterFrameTo(ctx: Ctx, look: Look, frameName: string, x: number, y: number) {
  const frame = FRAMES.find((f) => f.name === frameName) ?? FRAMES[0];
  drawCharacter(ctx, x, y, look, frame.pose);
}

// --- Aparências aleatórias para clientes e funcionários -----------------------

export const SKINS = ['#f6d2b8', '#eab995', '#d39b6a', '#b07444', '#8d5524', '#5f3a22'];
export const HAIR_COLORS = ['#1f1612', '#3b2416', '#6b3f1f', '#a0522d', '#d6a75c', '#e9d38a', '#8e8e9a', '#b0303b', '#2f4f9e'];
const SHIRTS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f8fafc', '#64748b'];
const PANTS = ['#1e293b', '#334155', '#3f3f46', '#1d4ed8', '#78350f', '#065f46', '#57534e'];
const HAIRS_F: HairStyle[] = ['longo', 'longo', 'coque', 'cacheado', 'curto'];
const HAIRS_M: HairStyle[] = ['curto', 'curto', 'moicano', 'careca', 'cacheado'];
const STYLES: OutfitStyle[] = ['casual', 'casual', 'esportivo', 'criativo', 'social'];

export function randomLook(rand: () => number): Look {
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length) % list.length];
  const gender: Gender = rand() < 0.5 ? 'feminino' : 'masculino';
  const fem = gender === 'feminino';
  return {
    gender,
    skin: pick(SKINS),
    hairStyle: pick(fem ? HAIRS_F : HAIRS_M),
    hairColor: pick(HAIR_COLORS),
    shirt: pick(SHIRTS),
    pants: pick(PANTS),
    style: pick(STYLES),
    glasses: rand() < 0.2,
    beard: !fem && rand() < 0.3,
    skirt: fem && rand() < 0.35,
  };
}
