// Cena da cidade: o bairro onde fica a empresa. O jogador caminha pelas
// calçadas e visita prédios (banco, gráfica, agência, imobiliária...). Novas
// áreas e prédios aparecem conforme a empresa cresce.

import Phaser from 'phaser';
import { SCOPES } from '../../game/data';
import { getEvent } from '../../game/events';
import { money } from '../../game/format';
import { findPath } from '../../game/layout';
import { competitionLevel, valuation } from '../../game/simulation';
import type { GameState } from '../../game/types';
import { gameStore, patchUi, uiStore } from '../../state/store';
import { doQuickAction, openEventDialog, say, speakerFor } from '../actions';
import { withGender } from '../roleLooks';
import { type Look, randomLook } from '../art/characters';
import { type BuildingIcon, type BuildingSpec, billboardArt, buildingArt, buildingHeight, fenceArt, fountainArt, tentArt } from '../art/cityArt';
import { hashRandom } from '../art/draw';
import { T } from '../art/furnitureArt';
import { EV, bus } from '../bus';
import { CLOSE, isBusinessHours, lightingAt } from '../clock';
import { planCustomers } from '../customerPlan';
import { remainingDayFraction, tickClock } from '../dayCycle';
import { Actor, type Dir, type Point } from '../entities/Actor';
import { pointerBlocked } from './OfficeScene';
import { CONFETTI_COLORS, ensureEnvironment } from '../textures';

const COLS = 36;
const ROWS = 26;
/** Linhas (em tiles) de cada faixa da cidade. */
const BAND1_BASE = 9; // calçada logo abaixo dos prédios do bairro
const ROAD1 = 11;
const PARK_TOP = 13;
const BAND2_BASE = 21;
const ROAD2 = 23;
const ALLEY = [15, 16];
const PLAYER_SPEED = 175;

interface Lot {
  id: string;
  x: number;
  w: number;
  band: 1 | 2;
}

interface Building {
  lot: Lot;
  label: string;
  sprite: Phaser.GameObjects.Image;
  door: Point;
  options: { label: string; run: () => void }[];
}

interface Walker {
  actor: Actor;
  kind: 'customer' | 'angry' | 'pedestrian' | 'visitor' | 'crowd';
  done?: () => void;
}

const LOTS: Lot[] = [
  { id: 'hq', x: 1, w: 5, band: 1 },
  { id: 'banco', x: 7, w: 4, band: 1 },
  { id: 'grafica', x: 11, w: 3, band: 1 },
  { id: 'agencia', x: 18, w: 4, band: 1 },
  { id: 'moveis', x: 23, w: 4, band: 1 },
  { id: 'imobiliaria', x: 28, w: 3, band: 1 },
  { id: 'rival', x: 32, w: 3, band: 1 },
  { id: 'eventos', x: 1, w: 5, band: 2 },
  { id: 'filial1', x: 7, w: 3, band: 2 },
  { id: 'filial2', x: 11, w: 3, band: 2 },
  { id: 'empresarial', x: 18, w: 5, band: 2 },
  { id: 'filial3', x: 24, w: 3, band: 2 },
  { id: 'outdoor', x: 28, w: 4, band: 2 },
  { id: 'torre', x: 33, w: 3, band: 2 },
];

export class CityScene extends Phaser.Scene {
  private grid: boolean[][] = [];
  private player!: Actor;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private buildings: Building[] = [];
  private staticObjects: Phaser.GameObjects.GameObject[] = [];
  private walkers: Walker[] = [];
  private schedule: number[] = [];
  private value = 0;
  private darkness!: Phaser.GameObjects.RenderTexture;
  private lastLightKey = '';
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private focused: Building | null = null;
  private menu: Phaser.GameObjects.Container | null = null;
  private clickedObject = false;
  private ambientTimer = 0;
  private unsubs: (() => void)[] = [];
  private sig = '';
  private leaving = false;
  private visitor: Walker | null = null;
  private visitorState: 'coming' | 'talking' | 'leaving' = 'coming';

  constructor() {
    super('city');
  }

  private get state(): GameState {
    return gameStore.get()!;
  }

  private tileCenter(tx: number, ty: number): Point {
    return { x: tx * T + T / 2, y: ty * T + T / 2 + 10 };
  }

  private pxToTile(x: number, y: number) {
    return { x: Math.floor(x / T), y: Math.floor((y - 10) / T) };
  }

  private get centerUnlocked() {
    return this.state.scopeLevel >= 1;
  }

  create() {
    this.leaving = false;
    this.buildings = [];
    this.staticObjects = [];
    this.walkers = [];
    this.visitor = null;
    this.menu = null;
    this.sig = '';
    const s = this.state;
    ensureEnvironment(this, s.company.logo.primary);
    patchUi({ scene: 'city' });

    this.drawGround();
    this.buildCity();

    const hq = this.buildings.find((b) => b.lot.id === 'hq')!;
    this.player = new Actor(this, { ...s.avatar }, hq.door.x, hq.door.y, s.player.name);
    this.player.speed = PLAYER_SPEED;
    this.player.idle('down');

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
    this.cursors = this.input.keyboard!.createCursorKeys();
    // Não bloqueia as teclas para os campos de texto da interface.
    this.input.keyboard!.clearCaptures();
    this.input.keyboard!.on('keydown-E', () => this.interactFocused());
    this.input.keyboard!.on('keydown-SPACE', () => this.interactFocused());
    this.input.keyboard!.on('keydown-ESC', () => this.closeMenu());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.mouse?.disableContextMenu();
    this.buildPrompt();

    this.darkness = this.add.renderTexture(0, 0, COLS * T, ROWS * T).setOrigin(0, 0).setDepth(9000);
    this.lastLightKey = '';

    this.setupCamera();
    this.scale.on('resize', this.setupCamera, this);
    this.planDay(remainingDayFraction());

    this.unsubs.push(gameStore.subscribe(() => this.onStateChange()));
    this.unsubs.push(uiStore.subscribe(() => this.onUiChange()));
    this.unsubs.push(bus.on(EV.quickAction, (p) => this.playQuickAction(p as string)));
    this.unsubs.push(bus.on(EV.celebrate, () => this.celebrate()));
    this.unsubs.push(bus.on(EV.dialogClosed, () => this.onDialogClosed()));
    this.events.once('shutdown', () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.scale.off('resize', this.setupCamera, this);
    });
    this.cameras.main.fadeIn(350, 5, 7, 15);
    this.time.delayedCall(500, () => {
      if (!this.state.world.missionsDone.includes('unidade') && !this.centerUnlocked) this.player.say('Este é o bairro da minha empresa!', 2400);
    });
  }

  update(_t: number, delta: number) {
    const dt = Math.min(delta, 50);
    const ui = uiStore.get();
    const speed = ui.panel || ui.dialog || ui.monthReportOpen ? 0 : ui.speed;
    const tick = tickClock(dt);
    if (tick.closed) {
      const net = tick.closed.day.revenue - tick.closed.day.totalCosts;
      this.floatText(this.player.x, this.player.y - 80, `Fechamento do dia: ${net >= 0 ? '+' : '-'}${money(Math.abs(net))}`, net >= 0 ? '#86efac' : '#fca5a5');
      this.schedule = [];
    }
    if (tick.opened) this.planDay(1);
    this.updatePlayer(dt);
    this.updateWalkers(dt, speed);
    this.updateVisitor();
    this.updateAmbient(dt, speed);
    this.updateLighting();
    this.updateFocus();
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, COLS * T, ROWS * T);
    cam.setBackgroundColor('#7cc46b');
    const zoom = Phaser.Math.Clamp(Math.min(this.scale.height / (11 * T), this.scale.width / (14 * T)), 0.55, 1.4);
    cam.setZoom(zoom);
    if (this.player) cam.startFollow(this.player.sprite, true, 0.1, 0.1);
  }

  // --- Mapa ----------------------------------------------------------------------------

  private drawGround() {
    const g = this.add.graphics().setDepth(-10);
    const W = COLS * T;
    // grama
    g.fillStyle(0x7cc46b, 1);
    g.fillRect(0, 0, W, ROWS * T);
    g.fillStyle(0x6fb85f, 1);
    for (let i = 0; i < 260; i++) g.fillRect((i * 97) % W, (i * 53) % (ROWS * T), 4, 3);
    const sidewalk = (y0: number, rows: number) => {
      g.fillStyle(0xd8d4cc, 1);
      g.fillRect(0, y0 * T, W, rows * T);
      g.lineStyle(1, 0xb9b3a8, 0.8);
      for (let x = 0; x <= W; x += T) g.lineBetween(x, y0 * T, x, (y0 + rows) * T);
      for (let r = 0; r <= rows; r++) g.lineBetween(0, (y0 + r) * T, W, (y0 + r) * T);
    };
    const road = (y0: number) => {
      g.fillStyle(0x9ca3af, 1);
      g.fillRect(0, y0 * T - 6, W, 6);
      g.fillStyle(0x4b5563, 1);
      g.fillRect(0, y0 * T, W, 2 * T);
      g.fillStyle(0xfacc15, 1);
      for (let x = 10; x < W; x += 60) g.fillRect(x, y0 * T + T - 2, 32, 4);
      g.fillStyle(0x9ca3af, 1);
      g.fillRect(0, (y0 + 2) * T, W, 6);
      // faixa de pedestres
      g.fillStyle(0xf8fafc, 0.92);
      for (let i = 0; i < 6; i++) g.fillRect(ALLEY[0] * T + 4, y0 * T + 6 + i * 15, 2 * T - 8, 8);
    };
    sidewalk(BAND1_BASE, 2);
    road(ROAD1);
    sidewalk(PARK_TOP, 1);
    sidewalk(BAND2_BASE, 2);
    road(ROAD2);
    sidewalk(ROAD2 + 2, 1);
    // ruela que liga ao centro
    g.fillStyle(0xd8d4cc, 1);
    g.fillRect(ALLEY[0] * T, (PARK_TOP + 1) * T, 2 * T, (BAND2_BASE - PARK_TOP - 1) * T);
    g.lineStyle(1, 0xb9b3a8, 0.8);
    for (let r = PARK_TOP + 1; r < BAND2_BASE; r++) g.lineBetween(ALLEY[0] * T, r * T, (ALLEY[0] + 2) * T, r * T);
    // canteiros nos fundos
    g.fillStyle(0x5a9e4b, 0.5);
    g.fillRect(0, 0, W, 10);
  }

  private add2(obj: Phaser.GameObjects.GameObject) {
    this.staticObjects.push(obj);
    return obj;
  }

  private buildCity() {
    this.staticObjects.forEach((o) => o.destroy());
    this.staticObjects = [];
    this.buildings.forEach((b) => b.sprite.destroy());
    this.buildings = [];
    const s = this.state;
    this.sig = this.citySig(s);
    const grid = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(true));
    const open = (x: number, y: number) => {
      if (grid[y]?.[x] !== undefined) grid[y][x] = false;
    };
    for (let x = 0; x < COLS; x++) {
      open(x, BAND1_BASE);
      open(x, BAND1_BASE + 1);
      open(x, PARK_TOP);
    }
    for (const x of ALLEY) {
      open(x, ROAD1);
      open(x, ROAD1 + 1);
    }
    if (this.centerUnlocked) {
      for (let y = PARK_TOP + 1; y < BAND2_BASE; y++) for (const x of ALLEY) open(x, y);
      for (let x = 0; x < COLS; x++) {
        open(x, BAND2_BASE);
        open(x, BAND2_BASE + 1);
        open(x, PARK_TOP + 1);
      }
      for (const x of ALLEY) {
        open(x, ROAD2);
        open(x, ROAD2 + 1);
      }
      for (let x = 0; x < COLS; x++) open(x, ROAD2 + 2);
    }

    // árvores ao fundo e no parque
    for (let x = 1; x < COLS; x += 3) {
      const tree = this.add.image(x * T + 20, 4 * T + ((x * 7) % 3) * 10, 'tree').setOrigin(0.5, 1);
      tree.setDepth(tree.y);
      this.add2(tree);
    }
    for (const x of [3, 8, 12, 20, 25, 30, 34]) {
      const tree = this.add.image(x * T + T / 2, (PARK_TOP + 2) * T + 10, 'tree').setOrigin(0.5, 1).setDepth((PARK_TOP + 2) * T + 10);
      this.add2(tree);
    }
    if (!this.textures.exists('fountain')) this.textures.addCanvas('fountain', fountainArt());
    this.add2(this.add.image(ALLEY[0] * T + T - 140, (PARK_TOP + 2) * T + 30, 'fountain').setOrigin(0.5, 1).setDepth((PARK_TOP + 2) * T + 30));
    for (const x of [4, 10, 21, 27, 33]) {
      const lamp = this.add.image(x * T + T / 2, (BAND1_BASE + 2) * T - 2, 'lamp-post').setOrigin(0.5, 1).setDepth((BAND1_BASE + 2) * T);
      this.add2(lamp);
      if (this.centerUnlocked) this.add2(this.add.image(x * T + T / 2, (BAND2_BASE + 2) * T - 2, 'lamp-post').setOrigin(0.5, 1).setDepth((BAND2_BASE + 2) * T));
    }
    this.add2(this.add.image(25 * T, (BAND1_BASE + 2) * T - 8, 'bench').setOrigin(0.5, 1).setDepth((BAND1_BASE + 2) * T - 8));

    // prédios
    for (const lot of LOTS) this.placeLot(lot, grid);

    // barreira do centro
    if (!this.centerUnlocked) {
      const key = 'fence-centro';
      if (!this.textures.exists(key)) this.textures.addCanvas(key, fenceArt(COLS, `Centro da cidade · libera ao expandir para a ${SCOPES[1].label} (nível ${SCOPES[1].unlockLevel})`));
      const fence = this.add.image(0, (PARK_TOP + 2) * T + 8, key).setOrigin(0, 1).setDepth((PARK_TOP + 2) * T + 60);
      fence.setInteractive({ useHandCursor: true });
      fence.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (pointerBlocked(this, p)) return;
        this.clickedObject = true;
        this.player.say(`Para abrir o centro, expanda para a ${SCOPES[1].label} na imobiliária.`, 3000);
      });
      this.add2(fence);
    }
    this.grid = grid;
  }

  private citySig(s: GameState) {
    return [s.infraLevel, s.scopeLevel, s.units, s.world.competitorOpen, s.company.name, s.level >= 2].join('|');
  }

  private specFor(lot: Lot): BuildingSpec | null {
    const s = this.state;
    const c = s.company.logo;
    switch (lot.id) {
      case 'hq': {
        const floors = [1, 1, 2, 3, 4][Math.min(4, s.infraLevel)];
        return { w: lot.w, floors, wall: s.world.wallColor, roof: '#475569', awning: c.primary, sign: s.company.name, signColor: c.primary, icon: 'home', doorCol: 2 };
      }
      case 'banco':
        return { w: lot.w, floors: 2, wall: '#e2e8f0', roof: '#334155', sign: 'Banco do Bairro', signColor: '#1d4ed8', icon: 'bank', doorCol: 1 };
      case 'grafica':
        return { w: lot.w, floors: 1, wall: '#fde68a', roof: '#92400e', awning: '#f97316', sign: 'Gráfica Rápida', signColor: '#ea580c', icon: 'print', doorCol: 1 };
      case 'agencia':
        return { w: lot.w, floors: 2, wall: '#fbcfe8', roof: '#831843', sign: 'Agência Criativa', signColor: '#db2777', icon: 'megaphone', doorCol: 1 };
      case 'moveis':
        return { w: lot.w, floors: 1, wall: '#d9f99d', roof: '#3f6212', awning: '#65a30d', sign: 'Casa dos Móveis', signColor: '#4d7c0f', icon: 'sofa', doorCol: 2 };
      case 'imobiliaria':
        return { w: lot.w, floors: 2, wall: '#bae6fd', roof: '#0c4a6e', sign: 'Imobiliária', signColor: '#0369a1', icon: 'key', doorCol: 1 };
      case 'rival':
        if (!s.world.competitorOpen) return null;
        return { w: lot.w, floors: 1, wall: '#fecaca', roof: '#7f1d1d', awning: '#dc2626', sign: 'Concorrente', signColor: '#b91c1c', icon: 'rival', doorCol: 1 };
      case 'eventos':
        return { w: lot.w, floors: 2, wall: '#ddd6fe', roof: '#4c1d95', sign: 'Centro de Eventos', signColor: '#7c3aed', icon: 'star', doorCol: 2 };
      case 'empresarial':
        return { w: lot.w, floors: 4, wall: '#cbd5e1', roof: '#1e293b', sign: 'Centro Empresarial', signColor: '#0f172a', icon: 'briefcase', doorCol: 2 };
      case 'filial1':
      case 'filial2':
      case 'filial3': {
        const n = Number(lot.id.slice(-1));
        if (s.units < n + 1) return null;
        return { w: lot.w, floors: 1, wall: s.world.wallColor, roof: '#475569', awning: c.secondary, sign: `${s.company.name} ${n + 1}`, signColor: c.primary, icon: 'store', doorCol: 1 };
      }
      case 'torre':
        if (s.scopeLevel < 3) return null;
        return { w: lot.w, floors: 6, wall: '#e0e7ff', roof: '#312e81', sign: s.company.name, signColor: c.primary, icon: 'star', doorCol: 1 };
      default:
        return null;
    }
  }

  private placeLot(lot: Lot, grid: boolean[][]) {
    const s = this.state;
    const base = lot.band === 1 ? BAND1_BASE : BAND2_BASE;
    if (lot.band === 2 && !this.centerUnlocked) return;
    const x0 = lot.x * T;
    const y0 = base * T;
    if (lot.id === 'outdoor') {
      if (s.scopeLevel < 2) return;
      const key = `billboard-${s.company.name}-${s.company.logo.primary}`;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, billboardArt(s.company.name, s.company.logo.primary, s.company.logo.secondary));
      this.add2(this.add.image(x0, y0 - 4, key).setOrigin(0, 1).setDepth(y0 - 4));
      return;
    }
    const spec = this.specFor(lot);
    if (!spec) {
      const label = lot.id.startsWith('filial') ? 'Lote para nova unidade' : 'Aluga-se';
      const key = `fence-${lot.w}-${label}`;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, fenceArt(lot.w, label));
      const fence = this.add.image(x0, y0, key).setOrigin(0, 1).setDepth(y0 - 2);
      this.add2(fence);
      for (let x = lot.x; x < lot.x + lot.w; x++) grid[base - 1][x] = true;
      return;
    }
    const key = `bld-${lot.id}-${JSON.stringify(spec)}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, buildingArt(spec));
    const sprite = this.add.image(x0, y0 + T * 0.25, key).setOrigin(0, 1).setDepth(y0 - 2);
    sprite.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 40 });
    const door = this.tileCenter(lot.x + spec.doorCol, base);
    const building: Building = { lot, label: spec.sign, sprite, door, options: this.optionsFor(lot.id, spec.icon) };
    sprite.on('pointerover', () => sprite.setTint(0xfff3c4));
    sprite.on('pointerout', () => sprite.clearTint());
    sprite.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || pointerBlocked(this, p)) return;
      this.clickedObject = true;
      this.openMenu(building);
    });
    this.buildings.push(building);
    const depthTiles = Math.ceil((buildingHeight(spec) - T * 0.25) / T);
    for (let y = Math.max(0, base - depthTiles); y < base; y++) for (let x = lot.x; x < lot.x + lot.w; x++) grid[y][x] = true;
  }

  private optionsFor(id: string, _icon: BuildingIcon): Building['options'] {
    const s = () => this.state;
    switch (id) {
      case 'hq':
        return [{ label: 'Entrar na empresa', run: () => this.goToOffice() }];
      case 'banco':
        return [
          { label: 'Falar sobre empréstimos', run: () => patchUi({ panel: 'computer', computerApp: 'financas' }) },
          {
            label: 'Perguntar sobre o saldo',
            run: () => say('Gerente do banco', `Seu saldo atual é de ${money(s().cash)}. Empréstimos ajudam a crescer, mas os juros pesam no caixa: use com cuidado!`, 'Banco do Bairro'),
          },
        ];
      case 'grafica':
        return [{ label: 'Imprimir e distribuir panfletos (R$ 300)', run: () => doQuickAction('panfletos') }];
      case 'agencia':
        return [
          { label: 'Planejar campanhas de marketing', run: () => patchUi({ panel: 'marketing' }) },
          { label: 'Contratar um influenciador', run: () => doQuickAction('influencer') },
        ];
      case 'moveis':
        return [{ label: 'Ver o catálogo de móveis', run: () => patchUi({ panel: 'build' }) }];
      case 'imobiliaria':
        return [{ label: 'Ampliar ou expandir a empresa', run: () => patchUi({ panel: 'shop' }) }];
      case 'rival':
        return [
          {
            label: 'Espiar o concorrente',
            run: () => {
              const comp = competitionLevel(s());
              say(
                'Vitrine do concorrente',
                `A concorrência no seu mercado está em ${Math.round(comp)}/100. Para não perder clientes, cuide da qualidade, do atendimento e de um preço justo — e não pare de divulgar.`,
                'Concorrente',
              );
            },
          },
        ];
      case 'eventos':
        return [{ label: 'Montar estande na feira (R$ 1.500)', run: () => doQuickAction('feira') }];
      case 'empresarial':
        return [
          {
            label: 'Reunião com investidores',
            run: () =>
              say(
                'Helena Prado',
                `Pelas minhas contas, sua empresa vale cerca de ${money(valuation(s()))}. Cresça a receita com lucro e a reputação, e o valor sobe junto!`,
                'Investidora-anjo',
              ),
          },
          { label: 'Ver finanças da empresa', run: () => patchUi({ panel: 'computer', computerApp: 'financas' }) },
        ];
      default:
        return [{ label: 'Visitar a unidade', run: () => say('Gerente da unidade', 'Tudo funcionando por aqui! Esta unidade aumenta a capacidade de atendimento da empresa.', 'Nova unidade') }];
    }
  }

  // --- Interação --------------------------------------------------------------------------

  private buildPrompt() {
    this.promptText = this.add.text(0, 0, '', { fontFamily: '"Plus Jakarta Sans Variable", sans-serif', fontSize: '12px', color: '#ffffff', fontStyle: '700' }).setOrigin(0.5);
    const bg = this.add.graphics();
    this.prompt = this.add.container(0, 0, [bg, this.promptText]).setDepth(21000).setVisible(false);
  }

  private updateFocus() {
    if (this.player.moving || this.menu) {
      this.focused = null;
      this.prompt.setVisible(false);
      return;
    }
    let best: Building | null = null;
    let bestD = 60;
    for (const b of this.buildings) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.door.x, b.door.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    this.focused = best;
    if (!best) {
      this.prompt.setVisible(false);
      return;
    }
    const text = `E  ·  ${best.options[0].label}`;
    if (this.promptText.text !== text) {
      this.promptText.setText(text);
      const bg = this.prompt.list[0] as Phaser.GameObjects.Graphics;
      bg.clear();
      bg.fillStyle(0x0f0b24, 0.85);
      const w = this.promptText.width + 20;
      bg.fillRoundedRect(-w / 2, -12, w, 24, 12);
    }
    this.prompt.setPosition(this.player.x, this.player.y + 26).setVisible(true);
  }

  private interactFocused() {
    const ui = uiStore.get();
    if (ui.panel || ui.dialog || ui.monthReportOpen || this.menu || !this.focused) return;
    if (this.focused.options.length === 1) this.focused.options[0].run();
    else this.openMenu(this.focused);
  }

  private openMenu(b: Building) {
    this.closeMenu();
    const items: Phaser.GameObjects.GameObject[] = [];
    const title = this.add.text(0, 0, b.label, { fontFamily: '"Space Grotesk Variable", sans-serif', fontSize: '13px', color: '#c4b5fd', fontStyle: '700' });
    const rows = b.options.map((o) => this.add.text(0, 0, o.label, { fontFamily: '"Plus Jakarta Sans Variable", sans-serif', fontSize: '13px', color: '#ffffff', fontStyle: '600' }));
    const width = Math.max(title.width, ...rows.map((r) => r.width)) + 30;
    const height = 34 + rows.length * 28;
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0b24, 0.94);
    bg.lineStyle(1.5, 0x8b5cf6, 0.8);
    bg.fillRoundedRect(-width / 2, -height, width, height, 12);
    bg.strokeRoundedRect(-width / 2, -height, width, height, 12);
    items.push(bg);
    title.setPosition(-width / 2 + 14, -height + 9);
    items.push(title);
    rows.forEach((r, i) => {
      const y = -height + 32 + i * 28;
      const hit = this.add.rectangle(0, y + 10, width - 10, 26, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => hit.setFillStyle(0x8b5cf6, 0.35));
      hit.on('pointerout', () => hit.setFillStyle(0xffffff, 0.001));
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (pointerBlocked(this, p)) return;
        this.clickedObject = true;
        this.closeMenu();
        this.walkTo(b.door, 'up', b.options[i].run);
      });
      r.setPosition(-width / 2 + 16, y);
      items.push(hit, r);
    });
    this.menu = this.add.container(b.door.x, b.door.y - 70, items).setDepth(22000);
    this.menu.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: this.menu, scale: 1 / this.cameras.main.zoom, alpha: 1, duration: 150, ease: 'Back.Out' });
  }

  private closeMenu() {
    this.menu?.destroy();
    this.menu = null;
  }

  private walkTo(target: Point, face: Dir, then?: () => void) {
    const from = this.pxToTile(this.player.x, this.player.y);
    const to = this.pxToTile(target.x, target.y);
    const path = findPath(this.grid, from, to);
    if (!path) {
      this.player.say('Não consigo chegar até lá.');
      return;
    }
    this.player.walk([...path.slice(1).map((t) => this.tileCenter(t.x, t.y)), target], () => {
      this.player.idle(face);
      then?.();
    });
  }

  private onPointerDown(p: Phaser.Input.Pointer) {
    if (pointerBlocked(this, p)) return;
    this.time.delayedCall(0, () => {
      if (this.clickedObject) {
        this.clickedObject = false;
        return;
      }
      if (this.menu) {
        this.closeMenu();
        return;
      }
      const t = this.pxToTile(p.worldX, p.worldY);
      if (this.grid[t.y]?.[t.x] === false) {
        const path = findPath(this.grid, this.pxToTile(this.player.x, this.player.y), t);
        if (path) this.player.walk(path.slice(1).map((s) => this.tileCenter(s.x, s.y)));
        const c = this.add.circle(p.worldX, p.worldY, 10, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0.8).setDepth(5);
        this.tweens.add({ targets: c, scale: 0.3, alpha: 0, duration: 400, onComplete: () => c.destroy() });
      }
    });
  }

  private updatePlayer(dt: number) {
    const ui = uiStore.get();
    const blocked = Boolean(ui.panel || ui.dialog || ui.monthReportOpen);
    let dx = 0;
    let dy = 0;
    if (!blocked) {
      if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
    }
    if (dx || dy) {
      this.closeMenu();
      const len = Math.hypot(dx, dy);
      const step = (PLAYER_SPEED * dt) / 1000;
      const mx = (dx / len) * step;
      const my = (dy / len) * step;
      const nx = this.canStand(this.player.x + mx, this.player.y) ? mx : 0;
      const ny = this.canStand(this.player.x + nx, this.player.y + my) ? my : 0;
      this.player.step(nx, ny);
    } else if (!this.player.moving) this.player.step(0, 0);
    this.player.update(dt, 1);
  }

  private canStand(x: number, y: number) {
    return [
      [x - 9, y - 6],
      [x + 9, y - 6],
      [x - 9, y + 2],
      [x + 9, y + 2],
    ].every(([px, py]) => {
      const t = this.pxToTile(px, py);
      return this.grid[t.y]?.[t.x] === false;
    });
  }

  // --- Clientes indo até a empresa ----------------------------------------------------------

  private planDay(fraction: number) {
    const plan = planCustomers(this.state, uiStore.get().minute, fraction);
    this.schedule = plan.times;
    this.value = plan.value;
  }

  private spawnCustomer(angry: boolean) {
    const hq = this.buildings.find((b) => b.lot.id === 'hq');
    if (!hq) return;
    const fromLeft = Math.random() < 0.5;
    const row = BAND1_BASE + (Math.random() < 0.5 ? 0 : 1);
    const start = this.tileCenter(fromLeft ? 0 : COLS - 1, row);
    const actor = new Actor(this, randomLook(hashRandom(String(Math.random()))), start.x, start.y);
    actor.speed = 100 + Math.random() * 20;
    const w: Walker = { actor, kind: angry ? 'angry' : 'customer' };
    this.walkers.push(w);
    const path = findPath(this.grid, this.pxToTile(start.x, start.y), this.pxToTile(hq.door.x, hq.door.y));
    actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
      if (angry) {
        actor.emote('angry', 1800);
        actor.say('Está lotado… volto outro dia.', 1800);
        this.time.delayedCall(1200, () => this.walkAway(w));
        return;
      }
      patchUi({ pendingRevenue: uiStore.get().pendingRevenue + this.value });
      this.coinBurst(hq.door.x, hq.door.y - 60, this.value);
      this.tweens.add({ targets: actor.sprite, alpha: 0, duration: 250, onComplete: () => this.removeWalker(w) });
    });
  }

  private walkAway(w: Walker) {
    const exit = { x: Math.random() < 0.5 ? 0 : COLS - 1, y: BAND1_BASE + 1 };
    const path = findPath(this.grid, this.pxToTile(w.actor.x, w.actor.y), exit);
    w.actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => this.removeWalker(w));
  }

  private removeWalker(w: Walker) {
    w.actor.destroy();
    this.walkers = this.walkers.filter((x) => x !== w);
    w.done?.();
  }

  private updateWalkers(dt: number, speed: number) {
    const minute = uiStore.get().minute;
    while (this.schedule.length && isBusinessHours(minute) && Math.abs(this.schedule[0]) <= minute) {
      const t = this.schedule.shift()!;
      this.spawnCustomer(t < 0);
    }
    for (const w of [...this.walkers]) w.actor.update(dt, w.kind === 'pedestrian' || w.kind === 'crowd' || w === this.visitor ? Math.max(1, speed) : speed);
    if (minute >= CLOSE) this.schedule = [];
  }

  // --- Visitantes de eventos (quando o jogador está na cidade) --------------------------------

  private updateVisitor() {
    const s = this.state;
    const ui = uiStore.get();
    if (this.visitor || !s.pendingEvent || s.world.eventDay === null || s.world.day < s.world.eventDay || ui.minute < 600 || !isBusinessHours(ui.minute) || ui.dialog || ui.panel)
      return;
    if (!getEvent(s.pendingEvent.eventId)) return;
    const look: Look = { ...withGender(randomLook(hashRandom(s.pendingEvent.eventId)), speakerFor(s.pendingEvent.eventId).gender), style: 'social', accessory: 'briefcase' };
    const start = this.tileCenter(COLS - 1, BAND1_BASE + 1);
    const actor = new Actor(this, look, start.x, start.y);
    actor.speed = 140;
    const w: Walker = { actor, kind: 'visitor' };
    this.visitor = w;
    this.visitorState = 'coming';
    this.walkers.push(w);
    const target = this.pxToTile(this.player.x + T, this.player.y);
    const dest = this.grid[target.y]?.[target.x] === false ? target : this.pxToTile(this.player.x, this.player.y);
    const path = findPath(this.grid, this.pxToTile(start.x, start.y), dest);
    actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
      this.visitorState = 'talking';
      actor.setPose('talk', 'left');
      actor.emote('alert', 1400);
      this.player.idle('right');
      this.time.delayedCall(600, () => {
        let portrait = '';
        try {
          portrait = this.textures.getBase64(actor.key, 'idle-down-0');
        } catch {
          portrait = '';
        }
        openEventDialog(portrait);
      });
    });
  }

  private onDialogClosed() {
    if (!this.visitor || this.visitorState !== 'talking') return;
    const v = this.visitor;
    this.visitorState = 'leaving';
    v.done = () => {
      if (this.visitor === v) this.visitor = null;
    };
    this.time.delayedCall(800, () => this.walkAway(v));
  }

  // --- Ações animadas -------------------------------------------------------------------------

  private playQuickAction(id: string) {
    if (id === 'panfletos') {
      this.player.setPose('talk', 'down');
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 650, () => {
          const fromLeft = i % 2 === 0;
          const row = BAND1_BASE + 1;
          const start = this.tileCenter(fromLeft ? Math.max(0, this.pxToTile(this.player.x, 0).x - 6) : Math.min(COLS - 1, this.pxToTile(this.player.x, 0).x + 6), row);
          const actor = new Actor(this, randomLook(hashRandom(`flyer-${i}-${Math.random()}`)), start.x, start.y);
          actor.speed = 120;
          const w: Walker = { actor, kind: 'crowd' };
          this.walkers.push(w);
          actor.walk([{ x: this.player.x + (fromLeft ? -30 : 30), y: this.player.y + 6 }], () => {
            const paper = this.add.rectangle(this.player.x, this.player.y - 40, 10, 13, 0xffffff).setStrokeStyle(1, 0x94a3b8).setDepth(30000);
            this.tweens.add({ targets: paper, x: actor.x, y: actor.y - 40, angle: 160, duration: 300, onComplete: () => paper.destroy() });
            actor.emote(Math.random() < 0.6 ? 'idea' : 'heart', 1300);
            this.time.delayedCall(700, () => this.walkAway(w));
          });
        });
      }
      this.time.delayedCall(3800, () => {
        this.player.setPose('cheer', 'down');
        this.time.delayedCall(900, () => this.player.idle('down'));
      });
    } else if (id === 'feira') {
      const eventos = this.buildings.find((b) => b.lot.id === 'eventos');
      const spot = eventos ? { x: eventos.door.x, y: eventos.door.y + T } : { x: this.player.x, y: this.player.y + T };
      const tents: Phaser.GameObjects.Image[] = [];
      ['#7c3aed', '#f97316', '#0ea5e9'].forEach((c, i) => {
        const key = `tent-${c}`;
        if (!this.textures.exists(key)) this.textures.addCanvas(key, tentArt(c));
        const tent = this.add.image(spot.x - T * 2 + i * T * 2, spot.y + 30, key).setOrigin(0.5, 1).setDepth(spot.y + 30).setScale(0.1);
        this.tweens.add({ targets: tent, scale: 1, duration: 400, delay: i * 150, ease: 'Back.Out' });
        tents.push(tent);
      });
      if (eventos) this.walkTo({ x: spot.x, y: spot.y - 6 }, 'down', () => this.player.setPose('talk', 'down'));
      for (let i = 0; i < 6; i++) {
        const start = this.tileCenter(i % 2 ? 0 : COLS - 1, (this.centerUnlocked ? BAND2_BASE : BAND1_BASE) + 1);
        const actor = new Actor(this, randomLook(hashRandom(`feira-${i}-${Math.random()}`)), start.x, start.y);
        actor.speed = 150;
        const w: Walker = { actor, kind: 'crowd' };
        this.walkers.push(w);
        actor.walk([{ x: spot.x - 90 + i * 36, y: spot.y + 50 }], () => {
          actor.idle('up');
          actor.emote(i % 2 ? 'star' : 'heart', 1600);
        });
        this.time.delayedCall(5200, () => this.walkAway(w));
      }
      this.time.delayedCall(5600, () => {
        tents.forEach((t) => this.tweens.add({ targets: t, alpha: 0, duration: 400, onComplete: () => t.destroy() }));
        this.player.idle('down');
      });
    } else {
      this.player.setPose('talk', 'down');
      this.time.delayedCall(1500, () => {
        this.player.setPose('cheer', 'down');
        this.time.delayedCall(900, () => this.player.idle('down'));
      });
    }
    this.time.delayedCall(500, () => this.replanSoon());
  }

  private replanSoon() {
    const minute = uiStore.get().minute;
    if (isBusinessHours(minute)) this.planDay(remainingDayFraction(minute));
  }

  // --- Reações ----------------------------------------------------------------------------------

  private onStateChange() {
    const s = gameStore.get();
    if (!s || !this.scene.isActive() || this.leaving) return;
    const sig = this.citySig(s);
    if (sig !== this.sig) {
      this.buildCity();
      this.cameras.main.flash(300, 255, 255, 255, false);
      this.sparkleAt(this.player.x, this.player.y - 40);
    }
  }

  private onUiChange() {
    const ui = uiStore.get();
    if (this.leaving) return;
    if (ui.scene === 'office' || ui.buildItem) this.goToOffice();
  }

  private goToOffice() {
    if (this.leaving) return;
    this.leaving = true;
    this.closeMenu();
    if (uiStore.get().scene !== 'office') patchUi({ scene: 'office' });
    this.cameras.main.fadeOut(300, 5, 7, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('office'));
  }

  // --- Ambiente ---------------------------------------------------------------------------------

  private updateAmbient(dt: number, speed: number) {
    if (speed === 0) return;
    this.ambientTimer -= dt * speed;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 1400 + Math.random() * 2200;
    const minute = uiStore.get().minute;
    const night = minute < 7 * 60 || minute > 20 * 60;
    const roads = this.centerUnlocked ? [ROAD1, ROAD2] : [ROAD1];
    if (Math.random() < 0.55) {
      const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#e5e7eb', '#8b5cf6'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      const ltr = Math.random() < 0.5;
      const road = roads[Math.floor(Math.random() * roads.length)];
      const y = road * T + (ltr ? T * 1.45 : T * 0.6);
      const car = this.add.image(ltr ? -100 : COLS * T + 100, y, `car-h-${c}`).setDepth(y + 20).setFlipX(!ltr);
      this.tweens.add({ targets: car, x: ltr ? COLS * T + 100 : -100, duration: (6500 + Math.random() * 2000) / speed, onComplete: () => car.destroy() });
    } else if (!night && this.walkers.filter((w) => w.kind === 'pedestrian').length < 8) {
      const ltr = Math.random() < 0.5;
      const rows = this.centerUnlocked ? [BAND1_BASE, BAND1_BASE + 1, PARK_TOP, BAND2_BASE, BAND2_BASE + 1] : [BAND1_BASE, BAND1_BASE + 1, PARK_TOP];
      const row = rows[Math.floor(Math.random() * rows.length)];
      const start = this.tileCenter(ltr ? 0 : COLS - 1, row);
      const end = this.tileCenter(ltr ? COLS - 1 : 0, row);
      const actor = new Actor(this, randomLook(hashRandom(String(Math.random()))), start.x, start.y);
      actor.speed = 60 + Math.random() * 35;
      const w: Walker = { actor, kind: 'pedestrian' };
      this.walkers.push(w);
      actor.walk([end], () => this.removeWalker(w));
    }
  }

  private updateLighting() {
    const light = lightingAt(uiStore.get().minute);
    const key = `${Math.round(light.alpha * 40)}-${light.lightsOn}-${this.sig}`;
    if (key === this.lastLightKey) return;
    this.lastLightKey = key;
    this.darkness.clear();
    if (light.alpha <= 0.01) return;
    this.darkness.fill(light.color, light.alpha);
    if (!light.lightsOn) return;
    const glow = this.make.image({ key: 'glow', add: false });
    const small = this.make.image({ key: 'glow-small', add: false });
    for (const x of [4, 10, 21, 27, 33]) {
      this.darkness.erase(glow, x * T + T / 2, (BAND1_BASE + 1) * T);
      if (this.centerUnlocked) this.darkness.erase(glow, x * T + T / 2, (BAND2_BASE + 1) * T);
    }
    for (const b of this.buildings) this.darkness.erase(small, b.door.x, b.door.y - 40);
    glow.destroy();
    small.destroy();
  }

  // --- Efeitos ---------------------------------------------------------------------------------

  private floatText(x: number, y: number, text: string, color = '#ffffff') {
    const t = this.add
      .text(x, y, text, { fontFamily: '"Space Grotesk Variable", sans-serif', fontSize: '15px', color, fontStyle: '700', stroke: '#1e1b2e', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(30000);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1800, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  }

  private coinBurst(x: number, y: number, value: number) {
    for (let i = 0; i < 5; i++) {
      const coin = this.add.image(x, y, 'coin').setDepth(30000);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      this.tweens.add({ targets: coin, x: x + Math.cos(a) * 40, y: y + Math.sin(a) * 40, alpha: 0, duration: 800, onComplete: () => coin.destroy() });
    }
    if (value >= 1) this.floatText(x, y - 10, `+${money(value)}`, '#fde047');
  }

  private sparkleAt(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const s = this.add.image(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50, 'sparkle').setDepth(30000);
      this.tweens.add({ targets: s, scale: 0, angle: 90, duration: 800 + i * 80, onComplete: () => s.destroy() });
    }
  }

  private celebrate() {
    this.player.setPose('cheer', 'down');
    for (let i = 0; i < 30; i++) {
      const c = this.add.image(this.player.x, this.player.y - 60, `confetti-${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`).setDepth(30000);
      const a = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 80;
      this.tweens.add({
        targets: c,
        x: this.player.x + Math.cos(a) * r,
        y: this.player.y + Math.sin(a) * r * 0.6,
        angle: Math.random() * 720,
        alpha: 0,
        duration: 1400,
        onComplete: () => c.destroy(),
      });
    }
    this.time.delayedCall(1500, () => this.player.pose === 'cheer' && this.player.idle('down'));
  }
}
