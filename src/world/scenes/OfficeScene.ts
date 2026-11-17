// Cena principal: o escritório/loja da empresa, com a calçada e a rua na frente.
// Controla o personagem, os móveis, os clientes, os funcionários, os visitantes
// de eventos, o relógio (dia e noite) e o modo de construção.

import Phaser from 'phaser';
import { addWork, buyFurniture, moveFurniture, sellFurniture } from '../../game/engine';
import { getEvent } from '../../game/events';
import { getFurniture, type FurnitureDef, type Spot } from '../../game/furniture';
import { canPlace, entryTile, findPath, roomSize, spotTiles } from '../../game/layout';
import type { GameState, PlacedItem, RoleId } from '../../game/types';
import { gameStore, isTimeRunning, patchUi, uiStore } from '../../state/store';
import { type Look, randomLook } from '../art/characters';
import { hashRandom } from '../art/draw';
import { T } from '../art/furnitureArt';
import { applyGameAction, doQuickAction, openEventDialog, speakerFor } from '../actions';
import { EV, bus } from '../bus';
import { CLOSE, isBusinessHours, lightingAt } from '../clock';
import { planCustomers } from '../customerPlan';
import { remainingDayFraction, tickClock } from '../dayCycle';
import { Actor, type Dir, type Point } from '../entities/Actor';
import { ROLE_LOOK, roleTitle, withGender } from '../roleLooks';
import { CONFETTI_COLORS, ensureEnvironment, ensureFurniture, ensureSign, ensureWall } from '../textures';

const MARGIN = 4;
const TOP = 3;
/** Topo da parede do fundo (2 tiles de altura, logo acima do piso). */
const WALL_Y = (TOP - 2) * T;
const PLAYER_SPEED = 165;

interface FurnitureView {
  item: PlacedItem;
  def: FurnitureDef;
  sprite: Phaser.GameObjects.Image;
  chair?: Phaser.GameObjects.Image;
}

interface MenuOption {
  label: string;
  run: () => void;
}

interface Interactable {
  id: string;
  label: string;
  stand: { x: number; y: number };
  face: Dir;
  anchor: Point;
  options: MenuOption[];
}

interface Customer {
  actor: Actor;
  state: 'arrive' | 'browse' | 'toCounter' | 'queue' | 'pay' | 'leave';
  value: number;
  angry: boolean;
  wait: number;
  seat?: { stand: { x: number; y: number }; approach: { x: number; y: number } };
  spotKey?: string;
  /** Só veio dar uma olhada (não compra). */
  curious?: boolean;
}

interface Employee {
  actor: Actor;
  role: RoleId;
  index: number;
  stationId: string | null;
  state: 'arriving' | 'working' | 'idle' | 'leaving' | 'away';
  nextMove: number;
}


const ROLE_LINES: Record<RoleId, string[]> = {
  atendente: ['Atendimento caprichado hoje!', 'Os clientes estão gostando.', 'Mais um cliente satisfeito!'],
  vendedor: ['Converti mais alguns contatos!', 'Tem muita gente interessada.', 'Bora bater a meta!'],
  marketing: ['Preparando o próximo post!', 'O engajamento está subindo.', 'Tenho uma ideia de campanha!'],
  desenvolvedor: ['Melhorando o produto…', 'Corrigi um problema hoje.', 'A qualidade está subindo!'],
  gerente: ['Organizando a operação.', 'Os custos estão sob controle.', 'Equipe alinhada!'],
};

const CUSTOMER_HAPPY = ['Adorei!', 'Voltarei com certeza!', 'Ótimo atendimento!', 'Que lugar legal!', 'Valeu a pena!'];
const CURIOUS_LINES = ['Só estou olhando!', 'Volto outro dia.', 'Interessante…', 'Vou contar para os amigos.'];
const CUSTOMER_ANGRY = ['Fila muito grande!', 'Demorou demais…', 'Não consegui ser atendido.'];

export class OfficeScene extends Phaser.Scene {
  private W = 9;
  private H = 6;
  private cols = 0;
  private rows = 0;
  private grid: boolean[][] = [];
  private accent = '#7c3aed';
  private roomObjects: Phaser.GameObjects.GameObject[] = [];
  private door!: Phaser.GameObjects.Image;
  private doorSign!: Phaser.GameObjects.Image;
  private furniture = new Map<string, FurnitureView>();
  private player!: Actor;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private menu: Phaser.GameObjects.Container | null = null;
  private interactables: Interactable[] = [];
  private focused: Interactable | null = null;
  private working: { kind: 'desk' | 'counter' | 'production'; minuteAcc: number; itemId: string } | null = null;
  private customers: Customer[] = [];
  private schedule: number[] = [];
  private visualValue = 0;
  private employees: Employee[] = [];
  private visitor: { actor: Actor; eventId: string; state: 'coming' | 'talking' | 'leaving' } | null = null;
  private darkness!: Phaser.GameObjects.RenderTexture;
  private lastLightKey = '';
  private ghost: Phaser.GameObjects.Image | null = null;
  private ghostItem: { type: string; moveId?: string } | null = null;
  private ambientTimer = 0;
  private idleTime = 0;
  private unsubs: (() => void)[] = [];
  private lastInfra = -1;
  private lastFurnitureSig = '';
  private lastEmployeeSig = '';
  private replanTimer: Phaser.Time.TimerEvent | null = null;
  private clickedObject = false;
  private leaving = false;
  /** Figurantes (pedestres, influenciador) atualizados pela própria cena. */
  private extras: Actor[] = [];
  private curiousTimer = 30;
  private ghostArea: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super('office');
  }

  private get state(): GameState {
    return gameStore.get()!;
  }

  // --- Coordenadas ---------------------------------------------------------------

  /** Centro (em pixels) de um tile do mundo. */
  private tileCenter(tx: number, ty: number): Point {
    return { x: tx * T + T / 2, y: ty * T + T / 2 + 10 };
  }

  /** Tile do piso (interior) → tile do mundo. */
  private wt(ix: number, iy: number) {
    return { x: ix + MARGIN + 1, y: iy + TOP };
  }

  private pxToTile(x: number, y: number) {
    return { x: Math.floor(x / T), y: Math.floor((y - 10) / T) };
  }

  private get doorTile() {
    return { x: MARGIN + 1 + Math.floor(this.W / 2), y: this.H + TOP };
  }

  private get sidewalkRow() {
    return this.H + TOP + 1;
  }

  // --- Ciclo de vida ----------------------------------------------------------------

  create() {
    this.leaving = false;
    this.extras = [];
    this.player = undefined as unknown as Actor;
    this.ghostArea = null;
    this.roomObjects = [];
    this.furniture.clear();
    this.customers = [];
    this.employees = [];
    this.visitor = null;
    this.ghost = null;
    this.ghostItem = null;
    this.menu = null;
    this.working = null;
    this.lastFurnitureSig = '';
    this.lastEmployeeSig = '';
    this.econSig = '';
    const s = this.state;
    this.accent = s.company.logo.primary;
    ensureEnvironment(this, this.accent);
    patchUi({ scene: 'office' });
    this.buildRoom();
    this.syncFurniture(true);

    const desk = s.world.furniture.find((f) => f.type === 'mesa_fundador');
    const start = desk ? this.wt(desk.x + 1, desk.y + 1) : entryTile(this.W, this.H);
    const startPx = this.tileCenter(start.x, start.y);
    const look: Look = { ...s.avatar };
    this.player = new Actor(this, look, startPx.x, startPx.y, s.player.name);
    this.player.speed = PLAYER_SPEED;

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
    this.cursors = this.input.keyboard!.createCursorKeys();
    // Não bloqueia as teclas para os campos de texto da interface.
    this.input.keyboard!.clearCaptures();
    this.input.keyboard!.on('keydown-E', () => this.interactFocused());
    this.input.keyboard!.on('keydown-SPACE', () => this.interactFocused());
    this.input.keyboard!.on('keydown-ESC', () => this.cancelModes());

    this.buildPrompt();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.mouse?.disableContextMenu();

    this.setupCamera();
    this.scale.on('resize', this.setupCamera, this);

    this.syncEmployees(true);
    this.planDay(remainingDayFraction());

    this.unsubs.push(gameStore.subscribe(() => this.onStateChange()));
    this.unsubs.push(uiStore.subscribe(() => this.onUiChange()));
    this.unsubs.push(bus.on(EV.quickAction, (p) => this.playQuickAction(p as string)));
    this.unsubs.push(bus.on(EV.celebrate, () => this.celebrate()));
    this.unsubs.push(bus.on(EV.dialogClosed, (p) => this.onDialogClosed(p as { mood?: 'good' | 'bad' } | undefined)));
    this.events.once('shutdown', () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.scale.off('resize', this.setupCamera, this);
    });

    this.cameras.main.fadeIn(350, 5, 7, 15);
    const pending = uiStore.get().buildItem;
    if (pending) this.startGhost(pending);
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50);
    const ui = uiStore.get();
    const running = isTimeRunning(ui);
    const speed = running ? ui.speed : 0;

    const tick = tickClock(dt);
    if (tick.closed) this.onDayClosed(tick.closed.day.revenue - tick.closed.day.totalCosts);
    if (tick.opened) this.onDayOpened();

    this.updatePlayer(dt, running);
    this.updateCustomers(dt, speed);
    this.updateEmployees(dt, speed);
    this.updateVisitor(dt, speed);
    this.updateWork(dt, speed);
    this.updateAmbient(dt, speed);
    this.extras = this.extras.filter((a) => !a.destroyed);
    for (const a of this.extras) a.update(dt, Math.max(1, speed));
    this.updateDoor();
    this.updateLighting();
    this.updateFocus();
    if (!this.ghost && this.ghostArea?.visible) this.ghostArea.clear().setVisible(false);
  }

  // --- Construção do ambiente ------------------------------------------------------

  private setupCamera() {
    const cam = this.cameras.main;
    const worldW = this.cols * T;
    const worldH = this.rows * T;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setBackgroundColor('#7cc46b');
    // Preenche a tela com o cenário (o mundo ocupa a maior parte da tela).
    const cover = Math.max(this.scale.width / worldW, this.scale.height / worldH);
    const zoom = Phaser.Math.Clamp(cover, 0.6, 1.6);
    cam.setZoom(zoom);
    if (worldW * zoom > this.scale.width + 4 || worldH * zoom > this.scale.height + 4) {
      if (this.player) cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    } else {
      cam.stopFollow();
      cam.centerOn(worldW / 2, worldH / 2);
    }
  }

  private buildRoom() {
    this.roomObjects.forEach((o) => o.destroy());
    this.roomObjects = [];
    const s = this.state;
    const size = roomSize(s.infraLevel);
    this.W = size.w;
    this.H = size.h;
    this.lastInfra = s.infraLevel;
    this.cols = this.W + 2 + MARGIN * 2;
    this.rows = this.H + TOP + 5;
    const worldW = this.cols * T;
    const worldH = this.rows * T;

    const bg = this.add.renderTexture(0, 0, worldW, worldH).setOrigin(0, 0).setDepth(-10);
    this.roomObjects.push(bg);
    const roomL = (MARGIN + 1) * T;
    const roomR = (MARGIN + 1 + this.W) * T;
    const floorTop = TOP * T;
    const floorBottom = (TOP + this.H) * T;
    // gramado ao redor
    for (let ty = 0; ty < this.H + TOP + 1; ty++)
      for (let tx = 0; tx < this.cols; tx++) bg.draw((tx + ty) % 3 ? 'grass' : 'grass2', tx * T, ty * T);
    // piso
    for (let iy = 0; iy < this.H; iy++) for (let ix = 0; ix < this.W; ix++) bg.draw(`floor-${s.world.floorStyle}`, roomL + ix * T, floorTop + iy * T);
    // parede do fundo
    const wallKey = ensureWall(this, s.world.wallColor);
    for (let ix = -1; ix <= this.W; ix++) bg.draw(wallKey, roomL + ix * T, WALL_Y);
    // paredes laterais (finas) e a de baixo
    const g = this.add.graphics().setDepth(-9);
    this.roomObjects.push(g);
    g.fillStyle(0x3a3150, 1);
    g.fillRect(roomL - 14, WALL_Y, 14, floorBottom + T - WALL_Y);
    g.fillRect(roomR, WALL_Y, 14, floorBottom + T - WALL_Y);
    // telhado (borda de cima da construção)
    g.fillStyle(0x2b2440, 1);
    g.fillRect(roomL - 14 - T * 0, WALL_Y - 10, this.W * T + 28, 10);
    g.fillStyle(0x000000, 0.12);
    g.fillRect(roomL, floorTop, this.W * T, 6);
    // fachada (parede de baixo vista da rua)
    const facadeTop = floorBottom;
    const facade = this.add.graphics().setDepth(floorBottom + T - 2);
    this.roomObjects.push(facade);
    const wallC = Phaser.Display.Color.HexStringToColor(s.world.wallColor).darken(18).color;
    facade.fillStyle(0x3a3150, 1);
    facade.fillRect(roomL - 14, facadeTop, this.W * T + 28, 12);
    facade.fillStyle(wallC, 1);
    facade.fillRect(roomL - 14, facadeTop + 12, this.W * T + 28, T - 12);
    facade.fillStyle(0x000000, 0.18);
    facade.fillRect(roomL - 14, facadeTop + T - 6, this.W * T + 28, 6);
    // letreiro com o nome da empresa na parede do fundo
    const signKey = ensureSign(this, s.company.name, s.company.logo.primary, s.company.logo.secondary);
    const signCx = roomL + (this.W * T) / 2;
    const sign = this.add.image(signCx, WALL_Y + 40, signKey).setDepth(-7);
    this.roomObjects.push(sign);
    const signL = signCx - sign.width / 2 - 8;
    const signR = signCx + sign.width / 2 + 8;
    // janelas no fundo (sem ficar atrás do letreiro)
    for (let ix = 1; ix < this.W - 1; ix += 3) {
      const cx = roomL + ix * T + T / 2;
      const half = (T * 1.6) / 2;
      if (cx + half > signL && cx - half < signR) continue;
      const win = this.add.image(cx, WALL_Y + 30, 'window').setDepth(-8);
      this.roomObjects.push(win);
    }
    // vitrines na fachada
    const doorX = this.doorTile.x * T;
    for (const wx of [roomL + 18, doorX + T + 18, doorX - T * 2 + 6]) {
      if (wx < roomL || wx > roomR - T) continue;
      const win = this.add.image(wx + T * 0.8, facadeTop + T * 0.58, 'window').setScale(0.8, 0.55).setDepth(floorBottom + T);
      this.roomObjects.push(win);
    }
    // porta, placa e letreiro
    this.door = this.add.image(doorX, facadeTop, `door-closed-${this.accent}`).setOrigin(0, 0).setDepth(floorBottom + T + 1);
    this.door.setInteractive({ useHandCursor: true });
    this.door.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (pointerBlocked(this, p)) return;
      this.clickedObject = true;
      this.openMenuFor(this.doorInteractable());
    });
    this.roomObjects.push(this.door);
    this.doorSign = this.add.image(doorX + T + 30, facadeTop + 30, 'sign-open').setDepth(floorBottom + T + 2);
    this.roomObjects.push(this.doorSign);

    // calçada e rua
    const sw = this.sidewalkRow;
    for (let tx = 0; tx < this.cols; tx++) {
      bg.draw('sidewalk', tx * T, sw * T);
      bg.draw('sidewalk', tx * T, (sw + 1) * T);
      bg.draw('curb', tx * T, (sw + 2) * T);
      bg.draw(tx % 2 ? 'road' : 'road-dash', tx * T, (sw + 3) * T);
    }
    // árvores e postes decorativos
    for (const tx of [1, this.cols - 2]) {
      const tree = this.add.image(tx * T + T / 2, (TOP + 3) * T, 'tree').setOrigin(0.5, 1).setDepth((TOP + 3) * T);
      const tree2 = this.add.image(tx * T + T / 2 + (tx === 1 ? 40 : -40), (TOP + this.H) * T, 'tree').setOrigin(0.5, 1).setDepth((TOP + this.H) * T);
      this.roomObjects.push(tree, tree2);
    }
    const lampCols = [2, this.cols - 3, Math.floor(this.cols / 2) + 3];
    for (const tx of lampCols) {
      const lamp = this.add.image(tx * T + T / 2, (sw + 2) * T - 4, 'lamp-post').setOrigin(0.5, 1).setDepth((sw + 2) * T);
      this.roomObjects.push(lamp);
    }
    const bench = this.add.image(4 * T, (sw + 2) * T - 6, 'bench').setOrigin(0.5, 1).setDepth((sw + 2) * T - 6);
    this.roomObjects.push(bench);

    // escuridão da noite
    this.darkness?.destroy();
    this.darkness = this.add.renderTexture(0, 0, worldW, worldH).setOrigin(0, 0).setDepth(9000);
    this.lastLightKey = '';
    this.rebuildGrid();
  }

  /** Recalcula a grade de passagem (paredes, móveis, calçada). */
  private rebuildGrid() {
    const s = this.state;
    const grid = Array.from({ length: this.rows }, () => Array<boolean>(this.cols).fill(true));
    for (let iy = 0; iy < this.H; iy++) for (let ix = 0; ix < this.W; ix++) grid[iy + TOP][ix + MARGIN + 1] = false;
    for (const item of s.world.furniture) {
      const def = getFurniture(item.type);
      if (!def || def.walkable) continue;
      for (let dx = 0; dx < def.w; dx++) for (let dy = 0; dy < def.h; dy++) grid[item.y + dy + TOP][item.x + dx + MARGIN + 1] = true;
    }
    const door = this.doorTile;
    grid[door.y][door.x] = false;
    const sw = this.sidewalkRow;
    for (let tx = 0; tx < this.cols; tx++) {
      grid[sw][tx] = false;
      grid[sw + 1][tx] = false;
    }
    this.grid = grid;
  }

  private furnitureKey(items: PlacedItem[]) {
    return items.map((i) => `${i.id}:${i.type}:${i.x}:${i.y}`).join('|');
  }

  private syncFurniture(initial = false) {
    const s = this.state;
    const sig = this.furnitureKey(s.world.furniture) + `#${s.world.wallColor}#${s.world.floorStyle}`;
    if (!initial && sig === this.lastFurnitureSig) return;
    this.lastFurnitureSig = sig;
    const present = new Set(s.world.furniture.map((f) => f.id));
    for (const [id, view] of this.furniture) {
      if (!present.has(id)) {
        this.dust(view.sprite.x + view.sprite.displayWidth / 2, view.sprite.y - 10);
        view.sprite.destroy();
        view.chair?.destroy();
        this.furniture.delete(id);
      }
    }
    for (const item of s.world.furniture) {
      const existing = this.furniture.get(item.id);
      if (existing && existing.item.x === item.x && existing.item.y === item.y) continue;
      existing?.sprite.destroy();
      existing?.chair?.destroy();
      const view = this.createFurnitureView(item);
      if (!view) continue;
      this.furniture.set(item.id, view);
      if (!initial) {
        view.sprite.setScale(0.2);
        this.tweens.add({ targets: view.sprite, scale: 1, duration: 380, ease: 'Back.Out' });
        this.dust(view.sprite.x + view.sprite.displayWidth / 2, view.sprite.y - 6);
      }
    }
    this.rebuildGrid();
    this.buildInteractables();
    this.unstickAll();
  }

  /** Se um móvel foi colocado onde alguém estava, a pessoa dá um passo para o lado. */
  private unstickAll() {
    const actors = [this.player, ...this.customers.filter((c) => !c.seat).map((c) => c.actor), ...this.employees.map((e) => e.actor)];
    for (const a of actors) {
      if (!a || a.destroyed) continue;
      const t = this.pxToTile(a.x, a.y);
      if (this.grid[t.y]?.[t.x] === false) continue;
      const free = this.nearestFree(t);
      if (!free) continue;
      const c = this.tileCenter(free.x, free.y);
      a.stop();
      a.setPosition(c.x, c.y);
    }
  }

  private createFurnitureView(item: PlacedItem): FurnitureView | null {
    const def = getFurniture(item.type);
    const tex = def && ensureFurniture(this, item.type, this.accent);
    if (!def || !tex) return null;
    const tile = this.wt(item.x, item.y);
    const x = tile.x * T - tex.art.left;
    const bottom = (tile.y + def.h) * T;
    const sprite = this.add.image(x, bottom, tex.key).setOrigin(0, 1);
    sprite.setDepth(def.walkable ? 1 : bottom - 2);
    sprite.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 30 });
    sprite.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || pointerBlocked(this, p)) return;
      this.clickedObject = true;
      this.onFurnitureClick(item.id);
    });
    sprite.on('pointerover', () => sprite.setTint(0xfff3c4));
    sprite.on('pointerout', () => sprite.clearTint());
    let chair: Phaser.GameObjects.Image | undefined;
    if (item.type === 'mesa_fundador' || item.type === 'mesa_trabalho') {
      const c = this.wt(item.x + 1, item.y + 1);
      chair = this.add.image(c.x * T - T / 2, (c.y + 1) * T - 2, 'chair').setOrigin(0.5, 1).setDepth(c.y * T + 12);
    }
    return { item, def, sprite, chair };
  }

  // --- Interações -------------------------------------------------------------------

  private spotPx(item: PlacedItem, spot: Spot) {
    const { stand, approach } = spotTiles(item, spot);
    const st = this.wt(stand.x, stand.y);
    const ap = this.wt(approach.x, approach.y);
    // Mesas: o ponto de uso fica entre os dois tiles da frente.
    const def = getFurniture(item.type)!;
    const offset = def.w === 2 && spot.dx === 0 ? T / 2 : 0;
    return {
      stand: { ...this.tileCenter(st.x, st.y), x: this.tileCenter(st.x, st.y).x + offset },
      approachTile: ap,
      standTile: st,
    };
  }

  private buildInteractables() {
    const list: Interactable[] = [];
    for (const view of this.furniture.values()) {
      const { item, def } = view;
      const options: MenuOption[] = [];
      let label = def.name;
      let spot: Spot | undefined = def.staff;
      if (item.type === 'mesa_fundador') {
        label = 'Computador';
        options.push({ label: 'Abrir o sistema da empresa', run: () => this.useComputer(item.id) });
        options.push({ label: 'Trabalhar no produto', run: () => this.startWork('desk', item.id) });
      } else if (item.type === 'caixa') {
        options.push({ label: 'Atender no balcão', run: () => this.startWork('counter', item.id) });
      } else if (item.type === 'camera') {
        options.push({ label: 'Gravar vídeo para as redes', run: () => doQuickAction('video') });
      } else if (def.staff && def.category === 'producao') {
        options.push({ label: 'Trabalhar aqui', run: () => this.startWork('production', item.id) });
      } else {
        spot = undefined;
        options.push({ label: 'Personalizar o escritório', run: () => patchUi({ panel: 'decor' }) });
      }
      options.push({ label: 'Ver efeito do item', run: () => this.describe(def) });
      const tile = this.wt(item.x, item.y);
      const anchor = { x: tile.x * T + (def.w * T) / 2, y: tile.y * T - 10 };
      let stand = { x: anchor.x, y: (tile.y + def.h) * T + T / 2 + 10 };
      let face: Dir = 'up';
      if (spot) {
        const sp = this.spotPx(item, spot);
        stand = sp.stand;
        face = spot.face;
      } else {
        // fica na frente do móvel, se possível
        const below = { x: tile.x, y: tile.y + def.h };
        if (this.grid[below.y]?.[below.x] !== false) stand = { ...this.tileCenter(tile.x, tile.y), y: tile.y * T - 20 };
      }
      list.push({ id: item.id, label, stand, face, anchor, options });
    }
    this.interactables = list;
  }

  private doorInteractable(): Interactable {
    const d = this.doorTile;
    const c = this.tileCenter(d.x, d.y - 1);
    return {
      id: 'door',
      label: 'Porta',
      stand: c,
      face: 'down',
      anchor: { x: d.x * T + T / 2, y: d.y * T },
      options: [{ label: 'Sair para a cidade', run: () => this.goToCity() }],
    };
  }

  private describe(def: FurnitureDef) {
    const e = def.effects;
    const parts = [
      e.capacity ? `+${e.capacity} vendas/mês de capacidade` : '',
      e.satisfaction ? `+${e.satisfaction} de satisfação` : '',
      e.quality ? `+${e.quality} de qualidade` : '',
      e.conversion ? `+${Math.round(e.conversion * 100)}% de conversão` : '',
    ].filter(Boolean);
    this.player.say(`${def.name}: ${parts.length ? parts.join(', ') : def.description}`, 3200);
  }

  private buildPrompt() {
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: '"Plus Jakarta Sans Variable", sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: '700',
    });
    this.promptText.setOrigin(0.5);
    const bg = this.add.graphics();
    this.prompt = this.add.container(0, 0, [bg, this.promptText]).setDepth(21000).setVisible(false);
  }

  private showPrompt(target: Interactable | null) {
    if (!target || this.menu || uiStore.get().buildItem) {
      this.prompt.setVisible(false);
      return;
    }
    const text = `E  ·  ${target.options[0].label}`;
    if (this.promptText.text !== text) {
      this.promptText.setText(text);
      const bg = this.prompt.list[0] as Phaser.GameObjects.Graphics;
      bg.clear();
      bg.fillStyle(0x0f0b24, 0.85);
      const w = this.promptText.width + 20;
      bg.fillRoundedRect(-w / 2, -12, w, 24, 12);
      bg.fillStyle(0x8b5cf6, 1);
      bg.fillRoundedRect(-w / 2 + 4, -8, 16, 16, 5);
    }
    this.prompt.setPosition(target.anchor.x, target.anchor.y - 18).setVisible(true);
  }

  private updateFocus() {
    if (this.player.moving || this.working) {
      this.focused = null;
      this.showPrompt(null);
      return;
    }
    let best: Interactable | null = null;
    let bestD = 70;
    for (const it of [...this.interactables, this.doorInteractable()]) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.stand.x, it.stand.y);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    this.focused = best;
    this.showPrompt(best);
  }

  private interactFocused() {
    if (this.menu) return;
    if (!this.focused || !isTimeRunningOrIdle()) return;
    const it = this.focused;
    if (it.options.length <= 2 && it.options.length > 0) {
      this.player.facing = it.face;
      it.options[0].run();
    } else this.openMenuFor(it);
  }

  private walkPlayerTo(stand: Point, face: Dir, then: () => void) {
    this.stopWork();
    const from = this.pxToTile(this.player.x, this.player.y);
    const to = this.pxToTile(stand.x, stand.y);
    if (from.x === to.x && from.y === to.y) {
      this.player.walk([stand], () => {
        this.player.idle(face);
        then();
      });
      return;
    }
    const target = this.grid[to.y]?.[to.x] === false ? to : this.nearestFree(to);
    const path = target && findPath(this.grid, from, target);
    if (!path) {
      this.player.say('Não consigo chegar até lá.');
      return;
    }
    const points = path.slice(1).map((t) => this.tileCenter(t.x, t.y));
    points.push(stand);
    this.player.walk(points, () => {
      this.player.idle(face);
      then();
    });
  }

  private nearestFree(t: { x: number; y: number }) {
    let best: { x: number; y: number } | null = null;
    let bd = Infinity;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const n = { x: t.x + dx, y: t.y + dy };
        if (this.grid[n.y]?.[n.x] === false) {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < bd) {
            bd = d;
            best = n;
          }
        }
      }
    return best;
  }

  private openMenuFor(it: Interactable) {
    this.closeMenu();
    const items: Phaser.GameObjects.GameObject[] = [];
    const title = this.add.text(0, 0, it.label, { fontFamily: '"Space Grotesk Variable", sans-serif', fontSize: '13px', color: '#c4b5fd', fontStyle: '700' });
    const rows = it.options.map((o) =>
      this.add.text(0, 0, o.label, { fontFamily: '"Plus Jakarta Sans Variable", sans-serif', fontSize: '13px', color: '#ffffff', fontStyle: '600' }),
    );
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
        const option = it.options[i];
        if (it.id.startsWith('npc:')) option.run();
        else this.walkPlayerTo(it.stand, it.face, option.run);
      });
      r.setPosition(-width / 2 + 16, y);
      items.push(hit, r);
    });
    this.menu = this.add.container(it.anchor.x, it.anchor.y - 6, items).setDepth(22000);
    this.menu.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: this.menu, scale: 1 / this.cameras.main.zoom, alpha: 1, duration: 150, ease: 'Back.Out' });
  }

  private closeMenu() {
    this.menu?.destroy();
    this.menu = null;
  }

  private onFurnitureClick(id: string) {
    const ui = uiStore.get();
    if (ui.buildItem) return;
    const view = this.furniture.get(id);
    if (!view) return;
    if (ui.editMode) {
      this.openMenuFor({
        id: `edit:${id}`,
        label: view.def.name,
        stand: { x: this.player.x, y: this.player.y },
        face: this.player.facing,
        anchor: { x: view.sprite.x + view.sprite.displayWidth / 2, y: view.sprite.y - view.sprite.displayHeight },
        options: [
          { label: 'Mover', run: () => this.startGhost(view.item.type, id) },
          ...(view.item.type === 'mesa_fundador' ? [] : [{ label: `Vender (+R$ ${Math.round(view.def.price / 2)})`, run: () => this.applyAction((s) => sellFurniture(s, id)) }]),
        ],
      });
      return;
    }
    const it = this.interactables.find((i) => i.id === id);
    if (it) this.openMenuFor(it);
  }

  private onPointerDown(p: Phaser.Input.Pointer) {
    if (pointerBlocked(this, p)) return;
    if (p.rightButtonDown()) {
      this.cancelModes();
      return;
    }
    if (this.ghost && this.ghostItem) {
      this.placeGhost(p);
      return;
    }
    // Deixa o clique em objetos ser tratado pelos próprios objetos.
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
        this.stopWork();
        const from = this.pxToTile(this.player.x, this.player.y);
        const path = findPath(this.grid, from, t);
        if (path) this.player.walk(path.slice(1).map((s) => this.tileCenter(s.x, s.y)));
        this.marker(p.worldX, p.worldY);
      }
    });
  }

  private marker(x: number, y: number) {
    const c = this.add.circle(x, y, 10, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0.8).setDepth(5);
    this.tweens.add({ targets: c, scale: 0.3, alpha: 0, duration: 400, onComplete: () => c.destroy() });
  }

  private cancelModes() {
    this.closeMenu();
    if (this.ghost) {
      if (this.ghostItem?.moveId) this.furniture.get(this.ghostItem.moveId)?.sprite.setAlpha(1);
      this.ghost.destroy();
      this.ghost = null;
      this.ghostItem = null;
      patchUi({ buildItem: null });
    }
  }

  // --- Trabalho do fundador -----------------------------------------------------------

  private useComputer(itemId: string) {
    const view = this.furniture.get(itemId);
    if (view) this.player.setPose('sit-up', 'up');
    patchUi({ panel: 'computer' });
  }

  private startWork(kind: 'desk' | 'counter' | 'production', itemId: string) {
    const view = this.furniture.get(itemId);
    if (!view) return;
    const anim = kind === 'desk' ? 'sit-up' : kind === 'counter' ? 'work-down' : 'workup';
    this.player.setPose(anim, kind === 'counter' ? 'down' : 'up');
    this.working = { kind, minuteAcc: 0, itemId };
    const msg = kind === 'desk' ? 'Trabalhando no produto…' : kind === 'counter' ? 'Atendendo os clientes!' : 'Produzindo!';
    this.player.say(msg, 1800);
  }

  private stopWork() {
    if (!this.working) return;
    this.working = null;
    this.player.idle(this.player.facing);
  }

  private updateWork(dt: number, speed: number) {
    if (!this.working || speed === 0 || !isBusinessHours(uiStore.get().minute)) return;
    this.working.minuteAcc += (dt / 1000) * 20 * speed;
    if (this.working.minuteAcc >= 60) {
      this.working.minuteAcc -= 60;
      const kind = this.working.kind;
      gameStore.set((s) => (s ? addWork(s, kind, 1) : s));
      const text = kind === 'desk' ? '+ qualidade' : kind === 'counter' ? '+ atendimento' : '+ produção';
      this.floatText(this.player.x, this.player.y - 70, text, '#a5f3fc');
    }
  }

  // --- Jogador ---------------------------------------------------------------------------

  private updatePlayer(dt: number, running: boolean) {
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
      this.stopWork();
      this.closeMenu();
      const len = Math.hypot(dx, dy);
      const step = (PLAYER_SPEED * dt) / 1000;
      const mx = (dx / len) * step;
      const my = (dy / len) * step;
      const nx = this.canStand(this.player.x + mx, this.player.y) ? mx : 0;
      const ny = this.canStand(this.player.x + nx, this.player.y + my) ? my : 0;
      this.player.step(nx, ny);
      if (!nx && !ny) this.player.step(0, 0);
      this.idleTime = 0;
    } else if (!this.player.moving) {
      this.player.step(0, 0);
    }
    this.player.update(dt, 1);
    if (!this.player.moving && !this.working && !dx && !dy) {
      this.idleTime += running ? dt : 0;
      const last = this.state.history[this.state.history.length - 1];
      if (this.idleTime > 4000 && last && last.profit < 0 && !this.player.pose) this.player.setPose('sad', 'down');
    } else this.idleTime = 0;
  }

  /** Colisão dos pés do personagem com paredes e móveis. */
  private canStand(x: number, y: number) {
    const pts = [
      [x - 9, y - 6],
      [x + 9, y - 6],
      [x - 9, y + 2],
      [x + 9, y + 2],
    ];
    return pts.every(([px, py]) => {
      const t = this.pxToTile(px, py);
      return this.grid[t.y]?.[t.x] === false;
    });
  }

  // --- Clientes ----------------------------------------------------------------------------

  /** Planeja os clientes visíveis do dia com base na simulação da economia. */
  private planDay(fraction: number) {
    const plan = planCustomers(this.state, uiStore.get().minute, fraction);
    this.schedule = plan.times;
    this.visualValue = plan.value;
  }

  /** Quando decisões mudam no meio do dia, ajusta os clientes que ainda vão chegar. */
  private scheduleReplan() {
    this.replanTimer?.remove();
    this.replanTimer = this.time.delayedCall(400, () => {
      const minute = uiStore.get().minute;
      if (!isBusinessHours(minute)) return;
      const before = this.schedule.filter((t) => t > 0).length;
      this.planDay(remainingDayFraction(minute));
      const after = this.schedule.filter((t) => t > 0).length;
      if (after > before) this.floatText(this.door.x + T / 2, this.door.y - 30, `+${after - before} clientes a caminho!`, '#86efac');
    });
  }

  private spawnCustomer(angry: boolean, curious = false) {
    const fromLeft = Math.random() < 0.5;
    const sw = this.sidewalkRow;
    const start = this.tileCenter(fromLeft ? 0 : this.cols - 1, sw + (Math.random() < 0.5 ? 0 : 1));
    const rand = hashRandom(String(Math.random()));
    const actor = new Actor(this, randomLook(rand), start.x, start.y);
    actor.speed = 95 + Math.random() * 25;
    const c: Customer = { actor, state: 'arrive', value: this.visualValue, angry, wait: 0, curious };
    this.customers.push(c);
    this.sendToBrowse(c);
  }

  private customerSpots() {
    const spots: { key: string; item: PlacedItem; spot: Spot }[] = [];
    for (const v of this.furniture.values()) if (v.def.customer && v.item.type !== 'caixa') spots.push({ key: v.item.id, item: v.item, spot: v.def.customer });
    return spots;
  }

  private sendToBrowse(c: Customer) {
    const taken = new Set(this.customers.map((x) => x.spotKey).filter(Boolean));
    const free = this.customerSpots().filter((s) => !taken.has(s.key));
    const from = this.pxToTile(c.actor.x, c.actor.y);
    if (free.length && !c.angry) {
      const choice = free[Math.floor(Math.random() * free.length)];
      const { stand, approach } = spotTiles(choice.item, choice.spot);
      const ap = this.wt(approach.x, approach.y);
      const st = this.wt(stand.x, stand.y);
      const path = findPath(this.grid, from, ap);
      if (path) {
        c.spotKey = choice.key;
        c.state = 'arrive';
        const seated = Boolean(choice.spot.seat);
        c.seat = seated ? { stand: this.tileCenter(st.x, st.y), approach: this.tileCenter(ap.x, ap.y) } : undefined;
        c.actor.walk(
          path.slice(1).map((t) => this.tileCenter(t.x, t.y)),
          () => {
            const face = choice.spot.face;
            if (c.seat) {
              this.tweens.add({
                targets: c.actor.sprite,
                x: c.seat.stand.x,
                y: c.seat.stand.y - 4,
                duration: 250,
                onComplete: () => {
                  c.actor.sprite.setDepth(c.actor.y + 30);
                  c.actor.setPose(choice.spot.pose ?? (face === 'up' ? 'sit-up' : face === 'down' ? 'sitfront' : face === 'right' ? 'sitright' : 'sitleft'), face);
                },
              });
            } else c.actor.idle(face);
            c.state = 'browse';
            c.wait = (seated ? 5000 : 2200) + Math.random() * 1800;
            if (Math.random() < 0.5) c.actor.emote(seated ? 'star' : 'bag', 1500);
          },
        );
        return;
      }
    }
    // sem móveis livres para olhar: dá uma volta pelo salão
    for (let tries = 0; tries < 12; tries++) {
      const tx = MARGIN + 1 + Math.floor(Math.random() * this.W);
      const ty = TOP + Math.max(0, this.H - 1 - Math.floor(Math.random() * 3));
      if (this.grid[ty]?.[tx] !== false) continue;
      const path = findPath(this.grid, from, { x: tx, y: ty });
      if (!path) continue;
      c.state = 'arrive';
      c.actor.walk(
        path.slice(1).map((t) => this.tileCenter(t.x, t.y)),
        () => {
          c.actor.idle('up');
          c.state = 'browse';
          c.wait = 1500 + Math.random() * 1500;
        },
      );
      return;
    }
    c.state = 'browse';
    c.wait = 400;
  }

  private counterSpot() {
    for (const v of this.furniture.values()) {
      if (v.item.type === 'caixa' && v.def.customer) {
        const { stand } = spotTiles(v.item, v.def.customer);
        return this.wt(stand.x, stand.y);
      }
    }
    return null;
  }

  private counterStaffed() {
    if (this.working?.kind === 'counter') return true;
    return this.employees.some((e) => e.state === 'working' && (e.role === 'atendente' || e.role === 'vendedor') && e.stationId && this.furniture.get(e.stationId)?.item.type === 'caixa');
  }

  private updateCustomers(dt: number, speed: number) {
    const minute = uiStore.get().minute;
    while (this.schedule.length && isBusinessHours(minute) && Math.abs(this.schedule[0]) <= minute) {
      const t = this.schedule.shift()!;
      this.spawnCustomer(t < 0);
    }
    // curiosos: gente do bairro que entra para conhecer (mais frequente com marca conhecida)
    if (speed > 0 && isBusinessHours(minute) && minute < CLOSE - 60) {
      this.curiousTimer -= (dt / 1000) * 20 * speed;
      if (this.curiousTimer <= 0) {
        const fame = 0.5 + this.state.awareness / 25 + Math.min(1.5, this.state.followers / 2000);
        this.curiousTimer = (50 + Math.random() * 70) / fame;
        if (this.customers.length < 6) this.spawnCustomer(false, true);
      }
    }
    const counter = this.counterSpot();
    const queue = this.customers.filter((c) => c.state === 'queue' || c.state === 'pay' || c.state === 'toCounter');
    for (const c of this.customers) {
      c.actor.update(dt, speed);
      if (speed === 0) continue;
      if (c.state === 'browse' && !c.actor.moving) {
        c.wait -= dt * speed;
        if (c.wait <= 0 && c.curious) {
          c.actor.emote(Math.random() < 0.5 ? 'idea' : 'question', 1400);
          if (Math.random() < 0.35) c.actor.say(CURIOUS_LINES[Math.floor(Math.random() * CURIOUS_LINES.length)], 1800);
          this.leave(c);
        } else if (c.wait <= 0) this.goToCounter(c, counter);
      } else if (c.state === 'queue') {
        const pos = queue.indexOf(c);
        if (pos === 0 && !c.actor.moving) {
          c.state = 'pay';
          c.wait = this.counterStaffed() ? 700 : 1800;
          if (c.angry) c.wait = 2600;
        }
      } else if (c.state === 'pay') {
        c.wait -= dt * speed;
        if (c.wait <= 0) this.finishPurchase(c);
      }
    }
    this.customers = this.customers.filter((c) => {
      if (c.state === 'leave' && !c.actor.moving) {
        c.actor.destroy();
        return false;
      }
      return true;
    });
    if (minute >= CLOSE && this.customers.some((c) => c.state !== 'leave')) for (const c of this.customers) if (c.state !== 'leave') this.leave(c);
  }

  private goToCounter(c: Customer, counter: { x: number; y: number } | null) {
    if (c.seat) {
      c.actor.setPosition(c.seat.approach.x, c.seat.approach.y);
      c.seat = undefined;
    }
    c.spotKey = undefined;
    if (!counter) {
      this.finishPurchase(c);
      return;
    }
    const inQueue = this.customers.filter((x) => x.state === 'queue' || x.state === 'pay' || x.state === 'toCounter').length;
    const target = { x: counter.x, y: counter.y + Math.min(inQueue, 2) };
    const dest = this.grid[target.y]?.[target.x] === false ? target : counter;
    const path = findPath(this.grid, this.pxToTile(c.actor.x, c.actor.y), dest);
    c.state = 'toCounter';
    c.actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
      c.state = 'queue';
      c.actor.idle('up');
      if (dest !== counter) {
        // anda até o caixa quando chegar a vez
        const p2 = findPath(this.grid, this.pxToTile(c.actor.x, c.actor.y), counter);
        if (p2 && p2.length > 1) this.time.delayedCall(900, () => c.state === 'queue' && c.actor.walk(p2.slice(1).map((t) => this.tileCenter(t.x, t.y)), () => c.actor.idle('up')));
      }
    });
  }

  private finishPurchase(c: Customer) {
    if (c.angry) {
      c.actor.emote('angry', 2200);
      c.actor.say(CUSTOMER_ANGRY[Math.floor(Math.random() * CUSTOMER_ANGRY.length)], 2200);
    } else {
      const value = Math.max(0, c.value);
      patchUi({ pendingRevenue: uiStore.get().pendingRevenue + value });
      this.coinBurst(c.actor.x, c.actor.y - 40, value);
      const sat = this.state.satisfaction;
      if (sat >= 65 && Math.random() < 0.6) {
        c.actor.emote('heart', 1600);
        if (Math.random() < 0.3) c.actor.say(CUSTOMER_HAPPY[Math.floor(Math.random() * CUSTOMER_HAPPY.length)], 1800);
      } else if (sat < 45) c.actor.emote('angry', 1500);
    }
    this.leave(c);
  }

  private leave(c: Customer) {
    c.state = 'leave';
    if (c.seat) {
      c.actor.setPosition(c.seat.approach.x, c.seat.approach.y);
      c.seat = undefined;
    }
    c.spotKey = undefined;
    const exitCol = Math.random() < 0.5 ? 0 : this.cols - 1;
    const path = findPath(this.grid, this.pxToTile(c.actor.x, c.actor.y), { x: exitCol, y: this.sidewalkRow + 1 });
    c.actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : []);
  }

  // --- Funcionários -----------------------------------------------------------------------

  private syncEmployees(initial = false) {
    const s = this.state;
    const sig = JSON.stringify(s.employees);
    if (!initial && sig === this.lastEmployeeSig) return;
    this.lastEmployeeSig = sig;
    const open = isBusinessHours(uiStore.get().minute);
    for (const role of Object.keys(s.employees) as RoleId[]) {
      const want = s.employees[role];
      const have = this.employees.filter((e) => e.role === role && e.state !== 'leaving');
      for (let i = have.length; i < want; i++) {
        const rand = hashRandom(`${s.seed}-${role}-${i}`);
        const look: Look = { ...randomLook(rand), ...ROLE_LOOK[role] };
        const door = this.doorTile;
        const start = initial && open ? this.tileCenter(door.x, door.y - 1) : this.tileCenter(this.cols - 1, this.sidewalkRow);
        const actor = new Actor(this, look, start.x, start.y, roleTitle(role, look.gender));
        actor.speed = 105;
        const e: Employee = { actor, role, index: i, stationId: null, state: open ? 'arriving' : 'away', nextMove: 0 };
        if (!open) actor.sprite.setVisible(false);
        this.employees.push(e);
        if (open) {
          if (!initial) {
            const fem = look.gender === 'feminino';
            actor.say(`Olá! Sou ${fem ? 'a nova' : 'o novo'} ${roleTitle(role, look.gender).toLowerCase()}.`, 2600);
            this.sparkle(actor.x, actor.y - 30);
          }
          this.sendEmployeeToStation(e);
        }
      }
      for (let i = want; i < have.length; i++) {
        const e = have[i];
        e.actor.say('Até mais!', 1500);
        this.employeeLeave(e, true);
      }
    }
  }

  private sendEmployeeToStation(e: Employee) {
    const taken = new Set(this.employees.filter((x) => x !== e && x.stationId).map((x) => x.stationId));
    if (this.working) taken.add(this.working.itemId);
    const station = [...this.furniture.values()].find(
      (v) => v.def.staff && v.def.roles?.includes(e.role) && v.item.type !== 'mesa_fundador' && !taken.has(v.item.id),
    );
    e.stationId = station?.item.id ?? null;
    const from = this.pxToTile(e.actor.x, e.actor.y);
    if (station && station.def.staff) {
      const sp = this.spotPx(station.item, station.def.staff);
      const path = findPath(this.grid, from, sp.standTile);
      e.state = 'arriving';
      e.actor.walk([...(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : []), sp.stand], () => {
        const face = station.def.staff!.face;
        const desk = station.item.type === 'mesa_trabalho';
        e.actor.setPose(desk ? 'sit-up' : face === 'down' ? 'work-down' : 'workup', face);
        e.state = 'working';
      });
    } else {
      e.state = 'idle';
      e.nextMove = 0;
      e.actor.emote('question', 2400);
      if (['marketing', 'desenvolvedor', 'gerente'].includes(e.role)) e.actor.say('Preciso de uma estação de trabalho!', 2600);
    }
  }

  private employeeLeave(e: Employee, fired = false) {
    e.state = 'leaving';
    e.stationId = null;
    const path = findPath(this.grid, this.pxToTile(e.actor.x, e.actor.y), { x: this.cols - 1, y: this.sidewalkRow });
    e.actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
      if (fired) {
        e.actor.destroy();
        this.employees = this.employees.filter((x) => x !== e);
      } else {
        e.state = 'away';
        e.actor.sprite.setVisible(false);
      }
    });
  }

  private updateEmployees(dt: number, speed: number) {
    for (const e of this.employees) {
      e.actor.update(dt, speed);
      if (speed === 0 || e.state !== 'idle' || e.actor.moving) continue;
      e.nextMove -= dt * speed;
      if (e.nextMove <= 0) {
        e.nextMove = 3000 + Math.random() * 4000;
        const tx = MARGIN + 1 + Math.floor(Math.random() * this.W);
        const ty = TOP + Math.floor(Math.random() * this.H);
        if (this.grid[ty]?.[tx] === false) {
          const path = findPath(this.grid, this.pxToTile(e.actor.x, e.actor.y), { x: tx, y: ty });
          if (path) e.actor.walk(path.slice(1).map((t) => this.tileCenter(t.x, t.y)));
        }
      }
    }
  }

  private employeeInteractables(): Interactable[] {
    return this.employees
      .filter((e) => e.state !== 'away')
      .map((e) => ({
        id: `npc:${e.role}:${e.index}`,
        label: roleTitle(e.role, e.actor.look.gender),
        stand: { x: e.actor.x, y: e.actor.y },
        face: 'down' as Dir,
        anchor: { x: e.actor.x, y: e.actor.y - 64 },
        options: [
          {
            label: 'Conversar',
            run: () => {
              const lines = ROLE_LINES[e.role];
              e.actor.say(e.stationId ? lines[Math.floor(Math.random() * lines.length)] : 'Estou sem posto de trabalho…', 2600);
            },
          },
        ],
      }));
  }

  // --- Visitantes de eventos -------------------------------------------------------------------

  private visitorLook(eventId: string): Look {
    const rand = hashRandom(eventId);
    const base = withGender(randomLook(rand), speakerFor(eventId).gender);
    if (eventId === 'investidor') return { ...base, style: 'social', shirt: '#111827', pants: '#111827', accessory: 'briefcase' };
    if (eventId === 'influenciador' || eventId === 'viral') return { ...base, style: 'criativo', shirt: '#ec4899', accessory: 'camera' };
    if (eventId === 'fornecedor' || eventId === 'inflacao' || eventId === 'crise_custos') return { ...base, shirt: '#a16207', accessory: 'box' };
    if (eventId === 'fiscalizacao') return { ...base, style: 'social', shirt: '#475569', accessory: 'briefcase' };
    if (eventId === 'imprensa') return { ...base, style: 'criativo', shirt: '#0ea5e9', accessory: 'camera' };
    return base;
  }

  private updateVisitor(dt: number, speed: number) {
    const s = this.state;
    const ui = uiStore.get();
    if (!this.visitor && s.pendingEvent && s.world.eventDay !== null && s.world.day >= s.world.eventDay && ui.minute >= 10 * 60 && isBusinessHours(ui.minute) && !ui.dialog) {
      const eventId = s.pendingEvent.eventId;
      const look = this.visitorLook(eventId);
      const start = this.tileCenter(0, this.sidewalkRow);
      const actor = new Actor(this, look, start.x, start.y);
      actor.speed = 125;
      this.visitor = { actor, eventId, state: 'coming' };
      const near = this.nearestFree(this.pxToTile(this.player.x, this.player.y + T)) ?? this.doorTile;
      const path = findPath(this.grid, this.pxToTile(start.x, start.y), near);
      actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
        if (!this.visitor) return;
        this.visitor.state = 'talking';
        actor.idle(this.player.y < actor.y ? 'up' : 'down');
        actor.setPose('talk', 'down');
        actor.emote('alert', 1500);
        this.stopWork();
        this.player.idle(this.player.y < actor.y ? 'down' : 'up');
        this.time.delayedCall(700, () => this.openEventDialog(eventId, actor));
      });
    }
    this.visitor?.actor.update(dt, Math.max(speed, this.visitor.state === 'leaving' ? 1 : speed));
    if (this.visitor?.state === 'coming' && speed === 0 && !ui.dialog) this.visitor.actor.update(dt, 1);
  }

  private openEventDialog(eventId: string, actor: Actor) {
    if (!getEvent(eventId) || this.visitor?.actor !== actor) return;
    openEventDialog(this.portrait(actor));
  }

  private portrait(actor: Actor): string {
    try {
      return this.textures.getBase64(actor.key, 'idle-down-0');
    } catch {
      return '';
    }
  }

  private onDialogClosed(payload?: { mood?: 'good' | 'bad' }) {
    if (this.visitor?.state !== 'talking') return;
    const v = this.visitor;
    v.state = 'leaving';
    if (payload?.mood === 'good') {
      v.actor.setPose('cheer', 'down');
      v.actor.emote('heart', 1500);
    } else if (payload?.mood === 'bad') v.actor.emote('angry', 1500);
    this.time.delayedCall(1100, () => {
      const exit = { x: this.cols - 1, y: this.sidewalkRow + 1 };
      const path = findPath(this.grid, this.pxToTile(v.actor.x, v.actor.y), exit);
      v.actor.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
        v.actor.destroy();
        if (this.visitor === v) this.visitor = null;
      });
    });
  }

  // --- Ações de marketing animadas ----------------------------------------------------------

  private playQuickAction(id: string) {
    this.stopWork();
    if (id === 'video') {
      this.player.setPose('talk', 'down');
      const cam = this.add.image(this.player.x + 40, this.player.y + 10, ensureFurniture(this, 'camera', this.accent)!.key).setOrigin(0.5, 1).setDepth(this.player.y + 20);
      const rec = this.add.circle(cam.x + 10, cam.y - 70, 5, 0xef4444).setDepth(30000);
      this.tweens.add({ targets: rec, alpha: 0.2, yoyo: true, repeat: 5, duration: 250 });
      this.time.delayedCall(2600, () => {
        cam.destroy();
        rec.destroy();
        this.player.setPose('cheer', 'down');
        this.time.delayedCall(900, () => this.player.idle('down'));
      });
    } else if (id === 'post') {
      this.player.setPose('work-down', 'down');
      this.player.emote('idea', 1500);
      this.time.delayedCall(1600, () => this.player.idle('down'));
    } else if (id === 'influencer') {
      const look: Look = { ...withGender(randomLook(hashRandom('influencer')), 'feminino'), style: 'criativo', shirt: '#ec4899', accessory: 'camera' };
      const start = this.tileCenter(this.cols - 1, this.sidewalkRow);
      const inf = new Actor(this, look, start.x, start.y);
      inf.speed = 140;
      const near = this.nearestFree(this.pxToTile(this.player.x + T, this.player.y)) ?? this.doorTile;
      const path = findPath(this.grid, this.pxToTile(start.x, start.y), near);
      this.extras.push(inf);
      inf.walk(path ? path.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
        inf.setPose('cheer', 'down');
        inf.say('Oi, gente! Olha que lugar incrível!', 2400);
        this.player.setPose('cheer', 'down');
        this.time.delayedCall(2600, () => {
          this.player.idle('down');
          const back = findPath(this.grid, this.pxToTile(inf.x, inf.y), { x: this.cols - 1, y: this.sidewalkRow });
          inf.walk(back ? back.slice(1).map((t) => this.tileCenter(t.x, t.y)) : [], () => {
            inf.destroy();
          });
        });
      });
    } else {
      this.player.setPose('talk', 'down');
      this.time.delayedCall(1500, () => this.player.idle('down'));
    }
    this.scheduleReplan();
  }

  // --- Construção (posicionar móveis) ----------------------------------------------------------

  private onUiChange() {
    const ui = uiStore.get();
    if (this.leaving) return;
    if (ui.buildItem && (!this.ghostItem || this.ghostItem.type !== ui.buildItem)) this.startGhost(ui.buildItem);
    if (!ui.buildItem && this.ghost) {
      if (this.ghostItem?.moveId) this.furniture.get(this.ghostItem.moveId)?.sprite.setAlpha(1);
      this.ghost.destroy();
      this.ghost = null;
      this.ghostItem = null;
    }
    if (ui.scene === 'city') this.goToCity();
  }

  private startGhost(type: string, moveId?: string) {
    this.ghost?.destroy();
    const tex = ensureFurniture(this, type, this.accent);
    if (!tex) return;
    this.ghost = this.add.image(0, 0, tex.key).setOrigin(0, 1).setAlpha(0.75).setDepth(25000);
    this.ghostItem = { type, moveId };
    if (moveId) {
      const view = this.furniture.get(moveId);
      view?.sprite.setAlpha(0.3);
      patchUi({ buildItem: type });
    }
    const p = this.input.activePointer;
    this.positionGhost(p.worldX, p.worldY);
  }

  private ghostTile(px: number, py: number) {
    const def = getFurniture(this.ghostItem!.type)!;
    const t = this.pxToTile(px - ((def.w - 1) * T) / 2, py - ((def.h - 1) * T) / 2);
    return { x: t.x - MARGIN - 1, y: t.y - TOP };
  }

  private positionGhost(px: number, py: number) {
    if (!this.ghost || !this.ghostItem) return;
    const def = getFurniture(this.ghostItem.type)!;
    const tex = ensureFurniture(this, this.ghostItem.type, this.accent)!;
    const it = this.ghostTile(px, py);
    const w = this.wt(it.x, it.y);
    this.ghost.setPosition(w.x * T - tex.art.left, (w.y + def.h) * T);
    const ok = canPlace(this.state.world.furniture, this.state.infraLevel, this.ghostItem.type, it.x, it.y, this.ghostItem.moveId).ok;
    this.ghost.setTint(ok ? 0x86efac : 0xf87171);
    this.ghost.setAlpha(ok ? 0.85 : 0.5);
    // grade do piso e área ocupada (verde = cabe, vermelho = não cabe)
    if (!this.ghostArea) this.ghostArea = this.add.graphics().setDepth(2);
    const g = this.ghostArea.clear().setVisible(true);
    g.lineStyle(1, 0xffffff, 0.18);
    for (let ix = 0; ix <= this.W; ix++) g.lineBetween((MARGIN + 1 + ix) * T, TOP * T, (MARGIN + 1 + ix) * T, (TOP + this.H) * T);
    for (let iy = 0; iy <= this.H; iy++) g.lineBetween((MARGIN + 1) * T, (TOP + iy) * T, (MARGIN + 1 + this.W) * T, (TOP + iy) * T);
    g.fillStyle(ok ? 0x22c55e : 0xef4444, 0.35);
    g.lineStyle(2, ok ? 0x22c55e : 0xef4444, 0.9);
    g.fillRect(w.x * T, w.y * T, def.w * T, def.h * T);
    g.strokeRect(w.x * T, w.y * T, def.w * T, def.h * T);
  }

  private onPointerMove(p: Phaser.Input.Pointer) {
    if (this.ghost) this.positionGhost(p.worldX, p.worldY);
  }

  private placeGhost(p: Phaser.Input.Pointer) {
    if (!this.ghostItem) return;
    const it = this.ghostTile(p.worldX, p.worldY);
    const { type, moveId } = this.ghostItem;
    const ok = moveId ? this.applyAction((s) => moveFurniture(s, moveId, it.x, it.y)) : this.applyAction((s) => buyFurniture(s, type, it.x, it.y));
    if (ok) {
      if (moveId) this.furniture.get(moveId)?.sprite.setAlpha(1);
      this.ghost?.destroy();
      this.ghost = null;
      this.ghostItem = null;
      patchUi({ buildItem: null });
      this.scheduleReplan();
    }
  }

  private applyAction(fn: Parameters<typeof applyGameAction>[0]): boolean {
    return applyGameAction(fn);
  }

  // --- Reação a mudanças de estado ---------------------------------------------------------------

  private onStateChange() {
    const s = gameStore.get();
    if (!s || !this.scene.isActive()) return;
    if (s.infraLevel !== this.lastInfra) {
      this.cameras.main.shake(250, 0.004);
      this.buildRoom();
      for (const v of this.furniture.values()) {
        v.sprite.destroy();
        v.chair?.destroy();
      }
      this.furniture.clear();
      this.syncFurniture(true);
      this.customers.forEach((c) => c.actor.destroy());
      this.customers = [];
      for (let i = 0; i < 14; i++) this.dust((MARGIN + 1 + Math.random() * this.W) * T, (TOP + Math.random() * this.H) * T);
      this.setupCamera();
      this.floatText(this.player.x, this.player.y - 80, 'Espaço ampliado!', '#fde68a');
      this.employees.forEach((e) => e.state === 'working' && this.sendEmployeeToStation(e));
    } else this.syncFurniture();
    this.syncEmployees();
    this.scheduleReplanIfEconomyChanged(s);
  }

  private econSig = '';
  private scheduleReplanIfEconomyChanged(s: GameState) {
    const sig = JSON.stringify([s.campaigns.map((c) => [c.channel, c.budget, c.active]), s.price, Math.round(s.quality), s.productLines, s.world.furniture.length, s.leads > 0 ? Math.round(Math.log2(s.leads + 1)) : 0]);
    if (sig !== this.econSig) {
      const first = this.econSig === '';
      this.econSig = sig;
      if (!first) this.scheduleReplan();
    }
  }

  // --- Dia e noite ----------------------------------------------------------------------------

  private onDayOpened() {
    this.planDay(1);
    for (const e of this.employees) {
      e.actor.sprite.setVisible(true);
      const start = this.tileCenter(this.cols - 1, this.sidewalkRow);
      e.actor.setPosition(start.x, start.y);
      this.sendEmployeeToStation(e);
    }
    this.floatText(this.door.x + T / 2, this.door.y - 40, 'Loja aberta!', '#86efac');
  }

  private onDayClosed(net: number) {
    this.schedule = [];
    for (const e of this.employees) if (e.state !== 'away') this.employeeLeave(e);
    const color = net >= 0 ? '#86efac' : '#fca5a5';
    this.floatText(this.player.x, this.player.y - 80, `Fechamento do dia: ${net >= 0 ? '+' : '-'}R$ ${Math.abs(Math.round(net)).toLocaleString('pt-BR')}`, color);
    if (net < 0) {
      this.player.setPose('sad', 'down');
      this.time.delayedCall(1800, () => this.player.pose === 'sad' && this.player.idle('down'));
    }
  }

  private updateDoor() {
    const d = this.doorTile;
    const cx = d.x * T + T / 2;
    const cy = d.y * T + T / 2;
    const near = [this.player, ...this.customers.map((c) => c.actor), ...this.employees.map((e) => e.actor), ...(this.visitor ? [this.visitor.actor] : [])].some(
      (a) => a.sprite.visible && Math.abs(a.x - cx) < T && Math.abs(a.y - cy) < T * 1.3,
    );
    const key = `door-${near ? 'open' : 'closed'}-${this.accent}`;
    if (this.door.texture.key !== key) this.door.setTexture(key);
    const open = isBusinessHours(uiStore.get().minute);
    const signKey = open ? 'sign-open' : 'sign-closed';
    if (this.doorSign.texture.key !== signKey) this.doorSign.setTexture(signKey);
  }

  private updateLighting() {
    const minute = uiStore.get().minute;
    const light = lightingAt(minute);
    const key = `${Math.round(light.alpha * 40)}-${light.lightsOn}-${this.furniture.size}-${this.W}`;
    if (key === this.lastLightKey) return;
    this.lastLightKey = key;
    this.darkness.clear();
    if (light.alpha <= 0.01) return;
    this.darkness.fill(light.color, light.alpha);
    if (!light.lightsOn) return;
    const glow = this.make.image({ key: 'glow', add: false });
    const small = this.make.image({ key: 'glow-small', add: false });
    // luzes internas
    for (let iy = 0; iy < this.H; iy += 3)
      for (let ix = 1; ix < this.W; ix += 3) {
        const w = this.wt(ix, iy);
        this.darkness.erase(glow, w.x * T + T / 2, w.y * T + T);
      }
    // postes da rua
    for (const tx of [2, this.cols - 3, Math.floor(this.cols / 2) + 3]) this.darkness.erase(glow, tx * T + T / 2, (this.sidewalkRow + 1) * T);
    // luminárias
    for (const v of this.furniture.values()) if (v.item.type === 'luminaria' || v.item.type === 'letreiro') this.darkness.erase(small, v.sprite.x + v.sprite.displayWidth / 2, v.sprite.y - 50);
    glow.destroy();
    small.destroy();
  }

  // --- Vida no bairro ------------------------------------------------------------------------

  private updateAmbient(dt: number, speed: number) {
    if (speed === 0) return;
    this.ambientTimer -= dt * speed;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 2500 + Math.random() * 3500;
    const minute = uiStore.get().minute;
    const night = minute < 7 * 60 || minute > 20 * 60;
    if (Math.random() < 0.55) {
      // carro passando
      const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#e5e7eb', '#8b5cf6'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      const ltr = Math.random() < 0.5;
      const y = (this.sidewalkRow + 3) * T + (ltr ? T * 0.3 : T * 0.75);
      const car = this.add.image(ltr ? -100 : this.cols * T + 100, y, `car-h-${c}`).setDepth(y + 20).setFlipX(!ltr);
      this.tweens.add({ targets: car, x: ltr ? this.cols * T + 100 : -100, duration: (4500 + Math.random() * 1500) / speed, onComplete: () => car.destroy() });
    } else if (!night) {
      // pedestre passando
      const ltr = Math.random() < 0.5;
      const row = this.sidewalkRow + 1;
      const start = this.tileCenter(ltr ? 0 : this.cols - 1, row);
      const end = this.tileCenter(ltr ? this.cols - 1 : 0, row);
      const p = new Actor(this, randomLook(hashRandom(String(Math.random()))), start.x, start.y);
      p.speed = 70 + Math.random() * 30;
      this.extras.push(p);
      p.walk([end], () => p.destroy());
    }
  }

  // --- Efeitos -----------------------------------------------------------------------------------

  floatText(x: number, y: number, text: string, color = '#ffffff') {
    const t = this.add
      .text(x, y, text, {
        fontFamily: '"Space Grotesk Variable", sans-serif',
        fontSize: '15px',
        color,
        fontStyle: '700',
        stroke: '#1e1b2e',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(30000);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1800, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  }

  private coinBurst(x: number, y: number, value: number) {
    for (let i = 0; i < 6; i++) {
      const coin = this.add.image(x, y, 'coin').setDepth(30000);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      this.tweens.add({
        targets: coin,
        x: x + Math.cos(angle) * (30 + Math.random() * 25),
        y: y + Math.sin(angle) * (30 + Math.random() * 25),
        alpha: 0,
        angle: 180,
        duration: 700 + Math.random() * 300,
        ease: 'Cubic.Out',
        onComplete: () => coin.destroy(),
      });
    }
    if (value >= 1) this.floatText(x, y - 10, `+R$ ${Math.round(value).toLocaleString('pt-BR')}`, '#fde047');
  }

  private dust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const d = this.add.image(x + (Math.random() - 0.5) * 40, y, 'dust').setDepth(29000).setScale(0.5 + Math.random());
      this.tweens.add({ targets: d, y: y - 20 - Math.random() * 20, alpha: 0, scale: 1.8, duration: 700, onComplete: () => d.destroy() });
    }
  }

  private sparkle(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const s = this.add.image(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, 'sparkle').setDepth(30000);
      this.tweens.add({ targets: s, scale: 0, angle: 90, duration: 800 + i * 80, onComplete: () => s.destroy() });
    }
  }

  celebrate() {
    this.stopWork();
    this.player.setPose('cheer', 'down');
    for (let i = 0; i < 40; i++) {
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const c = this.add.image(this.player.x, this.player.y - 60, `confetti-${color}`).setDepth(30000);
      const a = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 90;
      this.tweens.add({
        targets: c,
        x: this.player.x + Math.cos(a) * r,
        y: this.player.y - 60 + Math.sin(a) * r * 0.6 + 60,
        angle: Math.random() * 720,
        alpha: 0,
        duration: 1300 + Math.random() * 500,
        ease: 'Cubic.Out',
        onComplete: () => c.destroy(),
      });
    }
    this.time.delayedCall(1500, () => this.player.pose === 'cheer' && this.player.idle('down'));
  }

  // --- Troca de cena ----------------------------------------------------------------------------

  private goToCity() {
    if (this.leaving) return;
    this.leaving = true;
    this.cancelModes();
    if (uiStore.get().scene !== 'city') patchUi({ scene: 'city' });
    this.cameras.main.fadeOut(300, 5, 7, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('city'));
  }

  /** Lista de objetos clicáveis (inclui funcionários) — usada pela interface e pelos testes manuais. */
  getInteractables() {
    return [...this.interactables, ...this.employeeInteractables()];
  }
}

function isTimeRunningOrIdle() {
  const ui = uiStore.get();
  return !ui.panel && !ui.dialog && !ui.monthReportOpen;
}

/** O clique veio de uma janela da interface (e não do cenário) ou há uma janela aberta. */
export function pointerBlocked(scene: Phaser.Scene, p?: Phaser.Input.Pointer): boolean {
  const ui = uiStore.get();
  if (ui.panel || ui.dialog || ui.monthReportOpen) return true;
  const target = p?.event?.target;
  return Boolean(target && target !== scene.game.canvas);
}
