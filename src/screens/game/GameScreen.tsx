import { useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CircleHelp,
  Factory,
  Globe2,
  LayoutDashboard,
  Megaphone,
  Pause,
  ShoppingCart,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { CompanyLogo } from '../../components/CompanyLogo';
import { IconButton } from '../../components/ui/Button';
import { AnimatedNumber, Meter } from '../../components/ui/Panel';
import { LEVELS, getDifficulty } from '../../game/data';
import { markReportSeen, markTutorialDone } from '../../game/engine';
import { money, numShort } from '../../game/format';
import type { MonthReport } from '../../game/types';
import { cn } from '../../lib/cn';
import { useActiveGame } from '../../state/GameContext';
import { HowToPlay } from '../HowToPlay';
import { AdvanceBar } from './AdvanceBar';
import { EventModal } from './EventModal';
import { levelProgress } from './levelProgress';
import { MonthReportModal } from './MonthReportModal';
import { PauseMenu } from './PauseMenu';
import { SimulatingOverlay } from './SimulatingOverlay';
import { AchievementsTab } from './tabs/AchievementsTab';
import { DashboardTab } from './tabs/DashboardTab';
import { FinanceTab } from './tabs/FinanceTab';
import { MarketTab } from './tabs/MarketTab';
import { MarketingTab } from './tabs/MarketingTab';
import { ProductTab } from './tabs/ProductTab';
import { SalesTab } from './tabs/SalesTab';
import { TeamTab } from './tabs/TeamTab';
import { Tutorial } from './Tutorial';

export type TabId = 'painel' | 'mercado' | 'marketing' | 'vendas' | 'produto' | 'equipe' | 'financas' | 'conquistas';

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'painel', label: 'Painel', icon: LayoutDashboard },
  { id: 'mercado', label: 'Mercado', icon: Globe2 },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'produto', label: 'Produto e preço', icon: Factory },
  { id: 'equipe', label: 'Equipe e expansão', icon: Users },
  { id: 'financas', label: 'Finanças', icon: Wallet },
  { id: 'conquistas', label: 'Conquistas', icon: Trophy },
];

type Flow = 'idle' | 'simulating' | 'report' | 'event';

export function GameScreen({ onExit, onFinish }: { onExit: () => void; onFinish: () => void }) {
  const { game, advance, update } = useActiveGame();
  const [tab, setTab] = useState<TabId>('painel');
  const [flow, setFlow] = useState<Flow>(() => (game.unseenReport && game.history.length ? 'report' : game.pendingEvent ? 'event' : 'idle'));
  const [report, setReport] = useState<MonthReport | null>(() => (game.unseenReport ? (game.history[game.history.length - 1] ?? null) : null));
  const [paused, setPaused] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const diff = getDifficulty(game.player.difficulty);
  const level = LEVELS[game.level - 1];
  const progress = levelProgress(game);

  const startAdvance = useCallback(() => {
    if (flow !== 'idle' || game.pendingEvent) return;
    setFlow('simulating');
  }, [flow, game.pendingEvent]);

  const finishSimulation = useCallback(() => {
    const r = advance();
    if (!r) {
      setFlow('idle');
      return;
    }
    setReport(r);
    setFlow('report');
  }, [advance]);

  const closeReport = () => {
    update(markReportSeen);
    setReport(null);
    if (game.phase !== 'playing') {
      onFinish();
      return;
    }
    setFlow(game.pendingEvent ? 'event' : 'idle');
  };

  // Atalho: Esc pausa o jogo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && flow === 'idle' && !howTo && game.tutorialDone) setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flow, howTo, game.tutorialDone]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  const TabContent = {
    painel: DashboardTab,
    mercado: MarketTab,
    marketing: MarketingTab,
    vendas: SalesTab,
    produto: ProductTab,
    equipe: TeamTab,
    financas: FinanceTab,
    conquistas: AchievementsTab,
  }[tab];

  return (
    <div className="game-backdrop min-h-dvh pb-40 lg:pb-28">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl" data-tour="hud">
        <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-3 py-2.5 sm:px-5">
          <div className="hidden min-w-0 sm:block">
            <CompanyLogo logo={game.company.logo} name={game.company.name} size="xs" layout="horizontal" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white">
              Mês {game.month}
              <span className="ml-1.5 text-xs font-medium text-slate-500">· {diff.label}</span>
            </p>
            <button type="button" onClick={() => setTab('conquistas')} className="flex items-center gap-2 text-left" data-tour="level">
              <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-200">NV {game.level}</span>
              <span className="hidden text-xs text-slate-400 md:inline">{level.title}</span>
              {progress !== null && <Meter value={progress * 100} size="xs" className="w-16" label="Progresso para o próximo nível" />}
            </button>
          </div>
          <div className="flex-1" />
          <div className="hidden items-center gap-4 text-right md:flex">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Clientes</p>
              <p className="font-display text-sm font-bold text-sky-300">{numShort(game.customersTotal)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Seguidores</p>
              <p className="font-display text-sm font-bold text-pink-300">{numShort(game.followers)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reputação</p>
              <p className="font-display text-sm font-bold text-amber-300">{Math.round(game.reputation)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-right" data-tour="cash">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Saldo</p>
            <p className={cn('font-display text-lg font-bold tabular-nums leading-tight', game.cash < 0 ? 'text-rose-300' : 'text-emerald-300')}>
              <AnimatedNumber value={game.cash} format={(n) => money(n)} />
            </p>
          </div>
          <IconButton label="Como jogar" onClick={() => setHowTo(true)} className="hidden sm:inline-flex">
            <CircleHelp className="size-5" />
          </IconButton>
          <IconButton label="Pausar" onClick={() => setPaused(true)} data-tour="pause" className="border border-white/10">
            <Pause className="size-5" />
          </IconButton>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem] gap-5 px-3 sm:px-5">
        <nav aria-label="Áreas da empresa" className="sticky top-20 hidden w-52 shrink-0 self-start py-5 lg:block" data-tour="tabs">
          <ul className="space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === tab;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                      active ? 'bg-gradient-to-r from-violet-500/25 to-blue-500/10 text-white ring-1 ring-violet-400/30' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
                    )}
                  >
                    <Icon className={cn('size-[18px]', active ? 'text-violet-300' : '')} aria-hidden />
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 px-3 text-[11px] leading-relaxed text-slate-600">
            <BarChart3 className="mb-1 size-4" aria-hidden />
            O jogo salva automaticamente a cada decisão.
          </p>
        </nav>

        <main id="conteudo" className="min-w-0 flex-1 py-5">
          <div key={tab} className="animate-fade-up">
            <TabContent goTo={setTab} />
          </div>
        </main>
      </div>

      <nav aria-label="Áreas da empresa" className="fixed inset-x-0 bottom-[76px] z-30 border-t border-white/[0.06] bg-ink-950/95 backdrop-blur lg:hidden" data-tour="tabs-mobile">
        <ul className="flex overflow-x-auto px-1 scrollbar-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex w-[4.6rem] flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold', active ? 'text-violet-300' : 'text-slate-500')}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="truncate">{t.label.split(' ')[0]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <AdvanceBar onAdvance={startAdvance} disabled={flow !== 'idle'} />

      {flow === 'simulating' && <SimulatingOverlay month={game.month} onDone={finishSimulation} />}
      {flow === 'report' && report && <MonthReportModal report={report} onClose={closeReport} />}
      {flow === 'event' && <EventModal onDone={() => setFlow('idle')} />}
      <PauseMenu open={paused} onClose={() => setPaused(false)} onExit={onExit} onHowTo={() => setHowTo(true)} />
      <HowToPlay open={howTo} onClose={() => setHowTo(false)} />
      {!game.tutorialDone && flow === 'idle' && <Tutorial onFinish={() => update(markTutorialDone)} setTab={setTab} />}
    </div>
  );
}

export interface TabProps {
  goTo: (tab: TabId) => void;
}
