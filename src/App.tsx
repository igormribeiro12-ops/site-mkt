import { useState } from 'react';
import { GameProvider, useGame } from './state/GameContext';
import { ToastProvider } from './state/ToastContext';
import { FinalReport } from './screens/FinalReport';
import { GameScreen } from './screens/game/GameScreen';
import { SetupWizard } from './screens/setup/SetupWizard';
import { TitleScreen } from './screens/TitleScreen';

type Screen = 'title' | 'setup' | 'game' | 'final';

function Screens() {
  const { game } = useGame();
  const [screen, setScreen] = useState<Screen>('title');

  // Se a partida sumir (ex.: reiniciada), volta para o menu.
  const current: Screen = (screen === 'game' || screen === 'final') && !game ? 'title' : screen;

  switch (current) {
    case 'setup':
      return <SetupWizard onExit={() => setScreen('title')} onStart={() => setScreen('game')} />;
    case 'game':
      return <GameScreen onExit={() => setScreen('title')} onFinish={() => setScreen('final')} />;
    case 'final':
      return <FinalReport onMenu={() => setScreen('title')} onNewGame={() => setScreen('setup')} onContinue={() => setScreen('game')} />;
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
