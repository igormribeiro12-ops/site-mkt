// Personagem animado no cenário (jogador, funcionários, clientes e visitantes).

import Phaser from 'phaser';
import type { Look } from '../art/characters';
import { ensureCharacter } from '../textures';

export type Dir = 'down' | 'up' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

const FEET = 61 / 64;

export class Actor {
  readonly scene: Phaser.Scene;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly key: string;
  look: Look;
  facing: Dir = 'down';
  /** Velocidade de caminhada (px/s). */
  speed = 110;
  private path: Point[] = [];
  private onArrive: (() => void) | null = null;
  private bubble: Phaser.GameObjects.Container | null = null;
  private bubbleTimer = 0;
  private emoteSprite: Phaser.GameObjects.Image | null = null;
  private emoteTimer = 0;
  /** Animação "fixa" (sentado, trabalhando...) enquanto parado. */
  pose: string | null = null;
  name: string;
  data: Record<string, unknown> = {};

  constructor(scene: Phaser.Scene, look: Look, x: number, y: number, name = '') {
    this.scene = scene;
    this.look = look;
    this.name = name;
    this.key = ensureCharacter(scene, look);
    this.sprite = scene.add.sprite(x, y, this.key, 'idle-down-0');
    this.sprite.setOrigin(0.5, FEET);
    this.sprite.setDepth(y);
    this.idle();
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }
  get moving() {
    return this.path.length > 0;
  }

  setPosition(x: number, y: number) {
    if (this.destroyed) return;
    this.sprite.setPosition(x, y);
    this.sprite.setDepth(y);
  }

  play(anim: string) {
    if (this.destroyed) return;
    this.sprite.play(`${this.key}:${anim}`, true);
  }

  idle(dir: Dir = this.facing) {
    this.facing = dir;
    this.pose = null;
    this.play(`idle-${dir}`);
  }

  setPose(anim: string, dir?: Dir) {
    if (dir) this.facing = dir;
    this.pose = anim;
    this.path = [];
    this.play(anim);
  }

  walk(points: Point[], onArrive?: () => void) {
    this.pose = null;
    this.path = points.slice();
    this.onArrive = onArrive ?? null;
    if (!this.path.length) {
      this.idle();
      onArrive?.();
    }
  }

  stop() {
    this.path = [];
    this.onArrive = null;
    if (!this.pose) this.idle();
  }

  /** Move-se diretamente por um deslocamento (usado no controle por teclado). */
  step(dx: number, dy: number) {
    if (dx === 0 && dy === 0) {
      if (!this.pose && !this.path.length) this.play(`idle-${this.facing}`);
      return;
    }
    this.pose = null;
    this.path = [];
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    this.setPosition(this.x + dx, this.y + dy);
    this.play(`walk-${this.facing}`);
  }

  /** Mostra um balão com texto acima da cabeça. */
  say(text: string, ms = 2600) {
    if (this.destroyed) return;
    this.bubble?.destroy();
    const t = this.scene.add.text(0, 0, text, {
      fontFamily: '"Plus Jakarta Sans Variable", sans-serif',
      fontSize: '13px',
      color: '#1e1b2e',
      fontStyle: '600',
      align: 'center',
      wordWrap: { width: 170 },
    });
    t.setOrigin(0.5, 1);
    const w = t.width + 18;
    const h = t.height + 12;
    const g = this.scene.add.graphics();
    g.fillStyle(0xffffff, 0.97);
    g.lineStyle(1.5, 0x1e1b2e, 0.35);
    g.fillRoundedRect(-w / 2, -h - 8, w, h, 9);
    g.strokeRoundedRect(-w / 2, -h - 8, w, h, 9);
    g.fillTriangle(-6, -9, 6, -9, 0, 0);
    t.setPosition(0, -14);
    this.bubble = this.scene.add.container(this.x, this.y - 58, [g, t]);
    this.bubble.setDepth(20000);
    this.bubble.setScale(0.6);
    this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 180, ease: 'Back.Out' });
    this.bubbleTimer = ms;
  }

  emote(icon: string, ms = 1800) {
    if (this.destroyed) return;
    this.emoteSprite?.destroy();
    this.emoteSprite = this.scene.add.image(this.x, this.y - 66, `bubble-${icon}`).setDepth(19000);
    this.emoteSprite.setScale(0.2);
    this.scene.tweens.add({ targets: this.emoteSprite, scale: 1, duration: 220, ease: 'Back.Out' });
    this.emoteTimer = ms;
  }

  /** Atualiza movimento e balões. `time` = multiplicador de velocidade do jogo. */
  update(deltaMs: number, time = 1) {
    if (this.destroyed) return;
    if (this.path.length && time > 0) {
      const target = this.path[0];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const stepLen = (this.speed * time * deltaMs) / 1000;
      if (dist <= stepLen) {
        this.setPosition(target.x, target.y);
        this.path.shift();
        if (!this.path.length) {
          const cb = this.onArrive;
          this.onArrive = null;
          this.idle();
          cb?.();
          if (this.destroyed) return;
        }
      } else {
        this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        this.setPosition(this.x + (dx / dist) * stepLen, this.y + (dy / dist) * stepLen);
        this.play(`walk-${this.facing}`);
      }
    }
    this.sprite.anims.timeScale = time > 0 ? Math.min(2, Math.max(1, time)) : 0;
    if (this.bubble) {
      this.bubble.setPosition(this.x, this.y - 58);
      this.bubbleTimer -= deltaMs;
      if (this.bubbleTimer <= 0) {
        const b = this.bubble;
        this.bubble = null;
        this.scene.tweens.add({ targets: b, alpha: 0, duration: 200, onComplete: () => b.destroy() });
      }
    }
    if (this.emoteSprite) {
      this.emoteSprite.setPosition(this.x, this.y - 66);
      this.emoteTimer -= deltaMs;
      if (this.emoteTimer <= 0) {
        const e = this.emoteSprite;
        this.emoteSprite = null;
        this.scene.tweens.add({ targets: e, alpha: 0, y: e.y - 10, duration: 250, onComplete: () => e.destroy() });
      }
    }
  }

  private removed = false;

  /** Já foi removido do cenário (por nós ou porque a cena foi encerrada). */
  get destroyed(): boolean {
    return this.removed || !this.sprite.scene || !this.sprite.anims;
  }

  destroy() {
    if (this.removed) return;
    this.removed = true;
    this.path = [];
    this.onArrive = null;
    this.bubble?.destroy();
    this.emoteSprite?.destroy();
    this.sprite.destroy();
  }
}
