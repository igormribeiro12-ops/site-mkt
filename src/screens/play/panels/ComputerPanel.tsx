import { Monitor, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '../../../lib/cn';
import { useActiveGame, useUi } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { formatClock } from '../../../world/clock';
import { TABS, type TabId } from '../../game/apps';
import { AchievementsTab } from '../../game/tabs/AchievementsTab';
import { AdvisorTab } from '../../game/tabs/AdvisorTab';
import { DashboardTab } from '../../game/tabs/DashboardTab';
import { ExpansionTab } from '../../game/tabs/ExpansionTab';
import { FinanceTab } from '../../game/tabs/FinanceTab';
import { MarketTab } from '../../game/tabs/MarketTab';
import { MarketingTab } from '../../game/tabs/MarketingTab';
import { ProductTab } from '../../game/tabs/ProductTab';
import { SalesTab } from '../../game/tabs/SalesTab';
import { TeamTab } from '../../game/tabs/TeamTab';

/** O computador da empresa: o sistema de gestão com todos os relatórios. */
export function ComputerPanel() {
  const { game } = useActiveGame();
  const app = useUi((u) => u.computerApp) as TabId;
  const minute = useUi((u) => Math.floor(u.minute));
  const body = useRef<HTMLDivElement>(null);
  const goTo = (tab: TabId) => patchUi({ computerApp: tab });
  const close = () => patchUi({ panel: null });

  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [app]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const Content = {
    painel: DashboardTab,
    consultor: AdvisorTab,
    mercado: MarketTab,
    marketing: MarketingTab,
    vendas: SalesTab,
    produto: ProductTab,
    equipe: TeamTab,
    expansao: ExpansionTab,
    financas: FinanceTab,
    conquistas: AchievementsTab,
  }[TABS.some((t) => t.id === app) ? app : 'painel'];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink-950/60 p-0 backdrop-blur-sm animate-fade-in sm:p-6" role="dialog" aria-modal="true" aria-label="Computador da empresa">
      {/* Moldura do monitor */}
      <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden border-slate-700 bg-slate-800 shadow-2xl shadow-black/70 animate-scale-in sm:rounded-[28px] sm:border-[10px]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-ink-950 px-3 py-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-300" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </span>
          <Monitor className="ml-2 size-4 text-violet-300" aria-hidden />
          <p className="flex-1 truncate text-xs font-semibold text-slate-300">
            {game.company.name} · Sistema de gestão
          </p>
          <span className="text-xs tabular-nums text-slate-500">{formatClock(minute)}</span>
          <button type="button" onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Desligar o computador">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 bg-ink-900 max-md:flex-col">
          <nav aria-label="Aplicativos" className="flex shrink-0 gap-1 overflow-x-auto border-white/[0.06] bg-ink-950/60 p-2 md:w-52 md:flex-col md:border-r max-md:border-b">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => goTo(t.id)}
                  aria-current={app === t.id ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition',
                    app === t.id ? 'bg-violet-500/20 text-white ring-1 ring-violet-400/40' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {t.label}
                </button>
              );
            })}
          </nav>
          <div ref={body} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <Content goTo={goTo} />
          </div>
        </div>
      </div>
    </div>
  );
}
