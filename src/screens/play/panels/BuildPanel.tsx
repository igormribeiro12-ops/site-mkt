import { useState } from 'react';
import { Check, Expand, Hammer, Lock, Paintbrush } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, TipCard } from '../../../components/ui/Panel';
import { INFRA } from '../../../game/data';
import { DECOR_COST, expandOffice, setDecor } from '../../../game/engine';
import { money, pct } from '../../../game/format';
import { type FurnitureCategory, type FurnitureDef, ROOM_SIZES, catalogFor } from '../../../game/furniture';
import { MISSIONS, isUnlocked } from '../../../game/missions';
import type { WorldState } from '../../../game/types';
import { cn } from '../../../lib/cn';
import { useActiveGame, useUi } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { applyGameAction } from '../../../world/actions';
import { SidePanel } from '../SidePanel';
import { furnitureThumb } from '../thumbs';

const CATEGORIES: { id: FurnitureCategory; label: string }[] = [
  { id: 'producao', label: 'Produção' },
  { id: 'atendimento', label: 'Atendimento' },
  { id: 'equipamento', label: 'Equipamentos' },
  { id: 'decoracao', label: 'Decoração' },
];

const WALLS = ['#ede4d3', '#dbeafe', '#fce7f3', '#dcfce7', '#fef3c7', '#e9d5ff', '#cbd5e1', '#fecaca'];
const FLOORS: { id: WorldState['floorStyle']; label: string }[] = [
  { id: 'madeira', label: 'Madeira' },
  { id: 'piso', label: 'Porcelanato' },
  { id: 'concreto', label: 'Cimento queimado' },
  { id: 'carpete', label: 'Carpete' },
];

export function effectText(def: FurnitureDef): string[] {
  const e = def.effects;
  return [
    e.capacity ? `+${e.capacity} capacidade` : '',
    e.satisfaction ? `+${e.satisfaction} satisfação` : '',
    e.quality ? `+${e.quality} qualidade` : '',
    e.conversion ? `+${pct(e.conversion, 0)} conversão` : '',
  ].filter(Boolean);
}

type Tab = 'moveis' | 'ampliar' | 'decoracao';

export function BuildPanel({ initialTab = 'moveis' }: { initialTab?: Tab }) {
  const { game } = useActiveGame();
  const scene = useUi((u) => u.scene);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [cat, setCat] = useState<FurnitureCategory>('producao');
  const accent = game.company.logo.primary;
  const items = catalogFor(game.company.segment).filter((f) => f.category === cat);
  const next = INFRA[game.infraLevel + 1];
  const nextSize = ROOM_SIZES[Math.min(game.infraLevel + 1, ROOM_SIZES.length - 1)];
  const size = ROOM_SIZES[Math.min(game.infraLevel, ROOM_SIZES.length - 1)];
  const close = () => patchUi({ panel: null });

  const pick = (def: FurnitureDef) => {
    patchUi({ panel: null, buildItem: def.type, editMode: false, ...(scene === 'city' ? { scene: 'office' as const } : {}) });
  };

  return (
    <SidePanel title="Construir" subtitle="Móveis, ampliação e decoração" icon={Hammer} accent="from-amber-400 to-orange-500" onClose={close}>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-white/[0.04] p-1" role="tablist">
        {(
          [
            ['moveis', 'Móveis'],
            ['ampliar', 'Ampliar'],
            ['decoracao', 'Decoração'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('rounded-lg py-1.5 text-sm font-semibold transition', tab === id ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'moveis' && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                aria-pressed={cat === c.id}
                className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition', cat === c.id ? 'border-amber-300 bg-amber-400/15 text-amber-100' : 'border-white/10 text-slate-400 hover:text-white')}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((def) => {
              const unlocked = isUnlocked(game, def.missionUnlock);
              const affordable = game.cash >= def.price;
              const owned = game.world.furniture.filter((f) => f.type === def.type).length;
              const mission = def.missionUnlock ? MISSIONS.find((m) => m.id === def.missionUnlock) : null;
              return (
                <button
                  key={def.type}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => pick(def)}
                  className={cn(
                    'group flex flex-col rounded-2xl border p-2.5 text-left transition',
                    unlocked ? 'border-white/10 bg-white/[0.03] hover:border-amber-300/60 hover:bg-amber-400/[0.06]' : 'cursor-not-allowed border-white/5 opacity-55',
                  )}
                  data-testid={`build-${def.type}`}
                >
                  <span className="relative flex h-24 items-end justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02]">
                    <img src={furnitureThumb(def.type, accent)} alt="" className="max-h-full max-w-full object-contain transition group-hover:scale-105" />
                    {owned > 0 && <span className="absolute left-1.5 top-1.5 rounded-md bg-ink-950/80 px-1.5 text-[10px] font-bold text-slate-200">×{owned}</span>}
                    {!unlocked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-ink-950/60">
                        <Lock className="size-5 text-slate-300" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="mt-2 text-sm font-bold leading-tight text-white">{def.name}</span>
                  <span className={cn('text-sm font-bold', affordable ? 'text-amber-300' : 'text-rose-300')}>{money(def.price)}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {effectText(def).map((t) => (
                      <span key={t} className="rounded bg-emerald-500/10 px-1 text-[10px] font-semibold text-emerald-300">
                        {t}
                      </span>
                    ))}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] text-slate-400">{unlocked ? def.description : `Libera com a missão “${mission?.title ?? ''}”`}</span>
                </button>
              );
            })}
          </div>
          <TipCard title="Como posicionar" className="mt-4">
            Escolha um item e clique no piso do escritório. Verde = cabe; vermelho = não cabe. Clique com o botão direito ou Esc para cancelar. Use
            “Organizar” na barra de baixo para mover ou vender móveis.
          </TipCard>
        </>
      )}

      {tab === 'ampliar' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Espaço atual</p>
            <p className="font-display text-xl font-bold text-white">{INFRA[game.infraLevel].label}</p>
            <p className="text-sm text-slate-400">
              Piso de {size.w}×{size.h} · aluguel {money(INFRA[game.infraLevel].rent)}/mês
            </p>
          </div>
          {next ? (
            <div className="rounded-2xl border border-amber-300/30 bg-amber-400/[0.06] p-4">
              <div className="flex items-center gap-2">
                <Expand className="size-5 text-amber-300" aria-hidden />
                <p className="font-display text-lg font-bold text-white">{next.label}</p>
              </div>
              <p className="mt-1 text-sm text-slate-300">{next.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="good">
                  Piso {nextSize.w}×{nextSize.h}
                </Badge>
                <Badge tone="info">Capacidade {next.capacity}/mês</Badge>
                <Badge tone="warn">Aluguel {money(next.rent)}/mês</Badge>
              </div>
              <Button className="mt-3 w-full" onClick={() => applyGameAction(expandOffice) && close()} disabled={game.cash < next.upgradeCost}>
                Ampliar por {money(next.upgradeCost)}
              </Button>
            </div>
          ) : (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">Seu espaço já está no tamanho máximo!</p>
          )}
          <TipCard title="Por que ampliar?">Mais espaço comporta mais móveis, funcionários e clientes ao mesmo tempo. Mas o aluguel sobe: amplie quando a loja estiver cheia.</TipCard>
        </div>
      )}

      {tab === 'decoracao' && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-200">Cor das paredes</p>
            <div className="flex flex-wrap gap-2">
              {WALLS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Parede ${c}`}
                  aria-pressed={game.world.wallColor === c}
                  onClick={() => game.world.wallColor !== c && applyGameAction((s) => setDecor(s, { wallColor: c }))}
                  className={cn('flex size-11 items-center justify-center rounded-xl ring-2 transition hover:scale-105', game.world.wallColor === c ? 'ring-white' : 'ring-white/10')}
                  style={{ background: c }}
                >
                  {game.world.wallColor === c && <Check className="size-5 text-ink-900" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-200">Piso</p>
            <div className="grid grid-cols-2 gap-2">
              {FLOORS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={game.world.floorStyle === f.id}
                  onClick={() => game.world.floorStyle !== f.id && applyGameAction((s) => setDecor(s, { floorStyle: f.id }))}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition',
                    game.world.floorStyle === f.id ? 'border-violet-400 bg-violet-500/15 text-white' : 'border-white/10 text-slate-300 hover:border-white/25',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Paintbrush className="size-4" aria-hidden /> Cada mudança custa {money(DECOR_COST)}.
          </p>
        </div>
      )}
    </SidePanel>
  );
}
