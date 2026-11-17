import { Lock, Minus, TriangleAlert, UserPlus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { TipCard } from '../../../components/ui/Panel';
import { ROLES } from '../../../game/data';
import { fire, hire, severanceCost } from '../../../game/engine';
import { money } from '../../../game/format';
import { getFurniture } from '../../../game/furniture';
import { monthlySalaries } from '../../../game/simulation';
import type { GameState, RoleId } from '../../../game/types';
import { useActiveGame } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { applyGameAction } from '../../../world/actions';
import { randomLook } from '../../../world/art/characters';
import { hashRandom } from '../../../world/art/draw';
import { ROLE_LOOK } from '../../../world/roleLooks';
import { SidePanel } from '../SidePanel';
import { characterThumb } from '../thumbs';

/** Quantos postos de trabalho sobram para um novo funcionário dessa função. */
export function freeStations(s: GameState, role: RoleId): number {
  const stations = s.world.furniture
    .map((f) => ({ id: f.id, def: getFurniture(f.type) }))
    .filter((x) => x.def?.staff && x.def.roles && x.def.type !== 'mesa_fundador');
  const taken = new Set<string>();
  for (const r of Object.keys(s.employees) as RoleId[]) {
    for (let i = 0; i < s.employees[r]; i++) {
      const st = stations.find((x) => !taken.has(x.id) && x.def!.roles!.includes(r));
      if (st) taken.add(st.id);
    }
  }
  return stations.filter((x) => !taken.has(x.id) && x.def!.roles!.includes(role)).length;
}

export function HirePanel() {
  const { game } = useActiveGame();
  const close = () => patchUi({ panel: null });
  const salaries = monthlySalaries(game);

  return (
    <SidePanel title="Contratar" subtitle={`Folha de pagamento: ${money(salaries)}/mês`} icon={UserPlus} accent="from-sky-400 to-blue-500" onClose={close}>
      <div className="space-y-3">
        {ROLES.map((r) => {
          const unlocked = game.level >= r.unlockLevel;
          const count = game.employees[r.id];
          const look = { ...randomLook(hashRandom(`${game.seed}-${r.id}-${count}`)), ...ROLE_LOOK[r.id] };
          const free = freeStations(game, r.id);
          const Icon = r.icon;
          return (
            <div key={r.id} className={`rounded-2xl border p-3 ${unlocked ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 opacity-60'}`} data-testid={`role-${r.id}`}>
              <div className="flex gap-3">
                <div className="relative flex h-20 w-16 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-gradient-to-b from-sky-500/25 to-ink-800">
                  <img src={characterThumb(look)} alt="" className="h-[4.5rem] object-contain" />
                  {!unlocked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink-950/60">
                      <Lock className="size-5 text-slate-300" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-display font-bold text-white">
                    <Icon className="size-4 text-sky-300" aria-hidden /> {r.label}
                  </p>
                  <p className="text-xs text-slate-400">{r.benefit}</p>
                  <p className="mt-1 text-xs">
                    <span className="font-bold text-amber-300">{money(r.salary)}/mês</span>
                    <span className="text-slate-500">
                      {' '}
                      · equipe {count}/{r.max}
                    </span>
                  </p>
                </div>
              </div>
              {unlocked ? (
                <div className="mt-2.5 flex items-center gap-2">
                  <Button size="sm" className="flex-1" disabled={count >= r.max} onClick={() => applyGameAction((s) => hire(s, r.id))} icon={<UserPlus className="size-4" aria-hidden />}>
                    Contratar
                  </Button>
                  {count > 0 && (
                    <Button size="sm" variant="secondary" onClick={() => applyGameAction((s) => fire(s, r.id))} icon={<Minus className="size-4" aria-hidden />} title={`Rescisão: ${money(severanceCost(r.id))}`}>
                      Demitir
                    </Button>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs font-semibold text-slate-400">Libera no nível {r.unlockLevel}.</p>
              )}
              {unlocked && count < r.max && free === 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-200">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Sem posto de trabalho livre: compre uma mesa ou bancada em Construir para o novo funcionário trabalhar.
                </p>
              )}
            </div>
          );
        })}
        <TipCard title="Equipe e custos">
          Cada funcionário aparece no escritório e trabalha no seu posto durante o expediente. Salários são pagos todo mês, com ou sem vendas: contrate quando
          houver demanda.
        </TipCard>
      </div>
    </SidePanel>
  );
}
