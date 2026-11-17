import type { LucideIcon } from 'lucide-react';
import { Camera, Check, Lock, MapPin, Megaphone, Newspaper, PartyPopper, Sparkles } from 'lucide-react';
import { QUICK_ACTIONS, quickActionReady } from '../../../game/engine';
import { money } from '../../../game/format';
import { cn } from '../../../lib/cn';
import { useActiveGame, useUi } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { doQuickAction } from '../../../world/actions';
import { MarketingTab } from '../../game/tabs/MarketingTab';
import { SidePanel } from '../SidePanel';

const ICONS: Record<string, LucideIcon> = {
  post: Newspaper,
  video: Camera,
  panfletos: MapPin,
  influencer: Sparkles,
  feira: PartyPopper,
};

export function MarketingPanel() {
  const { game } = useActiveGame();
  const scene = useUi((u) => u.scene);
  const close = () => patchUi({ panel: null });

  return (
    <SidePanel title="Marketing" subtitle="Ações rápidas do dia e campanhas mensais" icon={Megaphone} accent="from-pink-400 to-rose-500" onClose={close} wide>
      <section aria-labelledby="quick-actions" className="mb-6">
        <h3 id="quick-actions" className="mb-1 font-display text-lg font-bold text-white">
          Ações de hoje
        </h3>
        <p className="mb-3 text-sm text-slate-400">Cada ação pode ser feita uma vez por dia e acontece no cenário. Bons resultados trazem clientes ainda hoje.</p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {QUICK_ACTIONS.map((a) => {
            const Icon = ICONS[a.id] ?? Megaphone;
            const locked = game.level < a.unlockLevel;
            const ready = quickActionReady(game, a.id);
            const where = a.scene === 'city' ? 'Na cidade' : 'No escritório';
            return (
              <button
                key={a.id}
                type="button"
                disabled={locked || !ready}
                onClick={() => doQuickAction(a.id)}
                className={cn(
                  'flex flex-col rounded-2xl border p-3 text-left transition',
                  locked || !ready ? 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-60' : 'border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-pink-300/60',
                )}
                data-testid={`quick-${a.id}`}
              >
                <span className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-pink-500/15 text-pink-300">
                    {locked ? <Lock className="size-4" aria-hidden /> : !ready ? <Check className="size-4" aria-hidden /> : <Icon className="size-5" aria-hidden />}
                  </span>
                  <span className="text-xs font-bold text-amber-300">{a.cost ? money(a.cost) : 'Grátis'}</span>
                </span>
                <span className="mt-2 text-sm font-bold text-white">{a.label}</span>
                <span className="mt-0.5 text-[11px] leading-snug text-slate-400">{a.description}</span>
                <span className={cn('mt-2 text-[10px] font-semibold uppercase tracking-wider', a.scene === scene ? 'text-emerald-300' : 'text-slate-500')}>
                  {locked ? `Libera no nível ${a.unlockLevel}` : !ready ? 'Feito hoje' : where}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <MarketingTab />
    </SidePanel>
  );
}
