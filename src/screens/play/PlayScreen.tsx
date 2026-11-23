import { useEffect } from 'react';
import { markReportSeen } from '../../game/engine';
import { useActiveGame, useUi } from '../../state/GameContext';
import { patchUi, uiStore } from '../../state/store';
import { showIntroPage } from '../../world/actions';
import { randomLook } from '../../world/art/characters';
import { hashRandom } from '../../world/art/draw';
import { GameCanvas } from '../../world/GameCanvas';
import { MonthReportModal } from '../game/MonthReportModal';
import { PauseMenu } from '../game/PauseMenu';
import { HowToPlay } from '../HowToPlay';
import { DialogBox } from './DialogBox';
import { Hud, setSpeed } from './Hud';
import { BuildPanel } from './panels/BuildPanel';
import { ComputerPanel } from './panels/ComputerPanel';
import { HirePanel } from './panels/HirePanel';
import { MapPanel } from './panels/MapPanel';
import { MarketingPanel } from './panels/MarketingPanel';
import { MissionsPanel } from './panels/MissionsPanel';
import { ShopPanel } from './panels/ShopPanel';
import { characterThumb } from './thumbs';
import { TOOLS, Toolbar } from './Toolbar';

const MENTOR_LOOK = { ...randomLook(hashRandom('mentora')), gender: 'feminino' as const, beard: false, hairStyle: 'coque' as const, hairColor: '#8e8e9a', shirt: '#0d9488', style: 'social' as const, glasses: true };

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

export function PlayScreen({ onExit, onFinish }: { onExit: () => void; onFinish: () => void }) {
  const { game, update } = useActiveGame();
  const panel = useUi((u) => u.panel);
  const reportOpen = useUi((u) => u.monthReportOpen);
  const flash = useUi((u) => u.missionFlash);
  const buildItem = useUi((u) => u.buildItem);
  const editMode = useUi((u) => u.editMode);
  const report = game.history[game.history.length - 1];

  // Abre o relatório pendente ao carregar o jogo e as boas-vindas na primeira vez.
  useEffect(() => {
    if (game.unseenReport && game.history.length) patchUi({ monthReportOpen: true });
    else if (!game.tutorialDone && !uiStore.get().dialog) {
      const t = window.setTimeout(() => showIntroPage(0, characterThumb(MENTOR_LOOK, 'talk-0', 2)), 900);
      return () => window.clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O destaque da missão concluída some depois de um tempo.
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => patchUi({ missionFlash: null }), 2600);
    return () => window.clearTimeout(t);
  }, [flash]);

  // Atalhos de teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const ui = uiStore.get();
      if (ui.dialog || ui.monthReportOpen) return;
      const tool = TOOLS.find((t) => t.key === e.key);
      if (tool) {
        patchUi({ panel: ui.panel === tool.id ? null : tool.id });
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        setSpeed(ui.speed === 0 ? ui.resumeSpeed || 1 : 0);
        return;
      }
      if (e.key === 'Escape' && !ui.panel && !ui.buildItem && !ui.editMode) patchUi({ panel: 'pause' });
      else if (e.key === 'Escape' && ui.editMode && !ui.buildItem) patchUi({ editMode: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeReport = () => {
    patchUi({ monthReportOpen: false });
    update(markReportSeen);
    if (game.phase !== 'playing') onFinish();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink-950 text-slate-100">
      <GameCanvas className="absolute inset-0" />
      <Hud />
      <Toolbar />
      {(buildItem || editMode) && !panel && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-3">
          <p className="rounded-full border border-amber-300/40 bg-ink-950/85 px-4 py-2 text-center text-sm font-semibold text-amber-100 shadow-xl backdrop-blur animate-fade-in">
            {buildItem ? 'Clique no piso para posicionar · botão direito ou Esc cancela' : 'Modo organizar: clique em um móvel para mover ou vender'}
          </p>
        </div>
      )}
      {panel === 'build' && <BuildPanel />}
      {panel === 'decor' && <BuildPanel initialTab="decoracao" />}
      {panel === 'hire' && <HirePanel />}
      {panel === 'shop' && <ShopPanel />}
      {panel === 'marketing' && <MarketingPanel />}
      {panel === 'computer' && <ComputerPanel />}
      {panel === 'missions' && <MissionsPanel />}
      {panel === 'map' && <MapPanel />}
      <DialogBox />
      <PauseMenu open={panel === 'pause'} onClose={() => patchUi({ panel: null })} onExit={onExit} onHowTo={() => patchUi({ panel: 'howto' })} />
      <HowToPlay open={panel === 'howto'} onClose={() => patchUi({ panel: null })} />
      {reportOpen && report && <MonthReportModal report={report} onClose={closeReport} />}
    </div>
  );
}
