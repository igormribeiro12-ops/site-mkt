import { lazy, Suspense, useState } from 'react';
import { GameProvider, useGame } from './state/GameContext';
import { ToastProvider } from './state/ToastContext';
import { patchUi } from './state/store';
import { SetupWizard } from './screens/setup/SetupWizard';
import { TitleScreen } from './screens/TitleScreen';

// O motor 2D (Phaser) é carregado só quando o jogo começa.
const PlayScreen = lazy(() => import('./screens/play/PlayScreen').then((m) => ({ default: m.PlayScreen })));
const FinalReport = lazy(() => import('./screens/FinalReport').then((m) => ({ default: m.FinalReport })));

type Screen = 'title' | 'setup' | 'game' | 'final';

function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-ink-950 text-slate-300">
      <span className="size-12 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-400" aria-hidden />
      <p className="font-display text-sm font-semibold">Abrindo a empresa…</p>
    </div>
  );
}

function Screens() {
  const { game } = useGame();
  const [screen, setScreen] = useState<Screen>('title');

  // Se a partida sumir (ex.: reiniciada), volta para o menu.
  const current: Screen = (screen === 'game' || screen === 'final') && !game ? 'title' : screen;

  const exitGame = () => {
    patchUi({ panel: null, dialog: null, buildItem: null, editMode: false });
    setScreen('title');
  };

  switch (current) {
    case 'setup':
      return <SetupWizard onExit={() => setScreen('title')} onStart={() => setScreen('game')} />;
    case 'game':
      return (
        <Suspense fallback={<Loading />}>
          <PlayScreen onExit={exitGame} onFinish={() => setScreen('final')} />
        </Suspense>
      );
    case 'final':
      return (
        <Suspense fallback={<Loading />}>
          <FinalReport onMenu={() => setScreen('title')} onNewGame={() => setScreen('setup')} onContinue={() => setScreen('game')} />
        </Suspense>
      );
    default:
      return (
        <TitleScreen
          onNewGame={() => setScreen('setup')}
          onContinue={() => setScreen(game && game.phase !== 'playing' && !game.unseenReport ? 'final' : 'game')}
        />
      );
  }
}

export function App() {
  return (
    <ToastProvider>
      <GameProvider>
        <Screens />
      </GameProvider>
    </ToastProvider>
  );
}
