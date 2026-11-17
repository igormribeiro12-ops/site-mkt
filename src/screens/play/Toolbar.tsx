import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Building2, Hammer, Map, Megaphone, Monitor, Move, ShoppingBag, Target, UserPlus } from 'lucide-react';
import { currentMission } from '../../game/missions';
import { cn } from '../../lib/cn';
import { useActiveGame, useUi } from '../../state/GameContext';
import { type PanelId, patchUi } from '../../state/store';

const TOOLS: { id: Exclude<PanelId, null>; label: string; icon: LucideIcon; key: string; color: string }[] = [
  { id: 'build', label: 'Construir', icon: Hammer, key: '1', color: 'from-amber-400 to-orange-500' },
  { id: 'hire', label: 'Contratar', icon: UserPlus, key: '2', color: 'from-sky-400 to-blue-500' },
  { id: 'shop', label: 'Comprar', icon: ShoppingBag, key: '3', color: 'from-emerald-400 to-teal-500' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, key: '4', color: 'from-pink-400 to-rose-500' },
  { id: 'computer', label: 'Empresa', icon: Monitor, key: '5', color: 'from-violet-400 to-indigo-500' },
  { id: 'missions', label: 'Missões', icon: Target, key: '6', color: 'from-yellow-300 to-amber-500' },
];

export { TOOLS };

/** Depois de um clique com o mouse, tira o foco do botão (Espaço/E voltam a controlar o personagem). */
export function blurAfterMouseClick(e: React.MouseEvent) {
  if (e.detail > 0) (e.target as HTMLElement).closest('button')?.blur();
}

export function Toolbar() {
  const { game } = useActiveGame();
  const scene = useUi((u) => u.scene);
  const panel = useUi((u) => u.panel);
  const editMode = useUi((u) => u.editMode);
  const mission = currentMission(game);

  return (
    <nav aria-label="Ferramentas" onClickCapture={blurAfterMouseClick} className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-2 sm:p-3">
      <div className="pointer-events-auto flex max-w-full items-end gap-1 overflow-x-auto rounded-3xl border border-white/10 bg-ink-950/80 p-1.5 shadow-2xl backdrop-blur-md sm:gap-1.5">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const active = panel === t.id;
          const hasDot = t.id === 'missions' && mission;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => patchUi({ panel: active ? null : t.id })}
              aria-pressed={active}
              title={`${t.label} (${t.key})`}
              className={cn('group relative flex w-[3.4rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition sm:w-[4.5rem]', active ? 'bg-white/10' : 'hover:bg-white/[0.06]')}
            >
              <span className={cn('flex size-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:-translate-y-0.5 sm:size-10', t.color)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-[9.5px] font-bold text-slate-200 sm:text-[11px]">{t.label}</span>
              {hasDot && <span className="absolute right-3 top-1 size-2.5 rounded-full bg-amber-300 ring-2 ring-ink-950" aria-hidden />}
            </button>
          );
        })}
        <span className="mx-0.5 h-12 w-px shrink-0 self-center bg-white/10" aria-hidden />
        {scene === 'office' && (
          <button
            type="button"
            onClick={() => patchUi({ editMode: !editMode })}
            aria-pressed={editMode}
            title="Mover ou vender móveis"
            className={cn('flex w-[3.4rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition sm:w-[4.5rem]', editMode ? 'bg-amber-400/20' : 'hover:bg-white/[0.06]')}
          >
            <span className={cn('flex size-8 items-center justify-center rounded-xl border sm:size-10', editMode ? 'border-amber-300 bg-amber-400/20 text-amber-200' : 'border-white/15 text-slate-200')}>
              <Move className="size-5" aria-hidden />
            </span>
            <span className="text-[9.5px] font-bold text-slate-200 sm:text-[11px]">{editMode ? 'Editando' : 'Organizar'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => patchUi({ scene: scene === 'office' ? 'city' : 'office', editMode: false })}
          title={scene === 'office' ? 'Sair para a cidade' : 'Voltar para a empresa'}
          className="flex w-[3.4rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition hover:bg-white/[0.06] sm:w-[4.5rem]"
        >
          <span className="flex size-8 items-center justify-center rounded-xl border border-white/15 text-slate-200 sm:size-10">
            {scene === 'office' ? <Map className="size-5" aria-hidden /> : <Building2 className="size-5" aria-hidden />}
          </span>
          <span className="text-[9.5px] font-bold text-slate-200 sm:text-[11px]">{scene === 'office' ? 'Cidade' : 'Escritório'}</span>
        </button>
      </div>
    </nav>
  );
}
