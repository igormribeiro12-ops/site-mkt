import { useState } from 'react';
import { BookOpen, Castle, CircleHelp, MapPinned, Play, RotateCcw, TrendingUp, Wallet } from 'lucide-react';
import { CompanyLogo } from '../components/CompanyLogo';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { VICTORY_REVENUE, getSegment } from '../game/data';
import { money, moneyShort } from '../game/format';
import { STATES } from '../game/geo';
import { useGame } from '../state/GameContext';
import { HowToPlay } from './HowToPlay';

interface Props {
  onNewGame: () => void;
  onContinue: () => void;
}

export function TitleScreen({ onNewGame, onContinue }: Props) {
  const { game, deleteGame } = useGame();
  const [howTo, setHowTo] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);

  const handleNew = () => {
    if (game) setConfirmNew(true);
    else onNewGame();
  };

  return (
    <div className="game-backdrop relative min-h-dvh overflow-hidden">
      <div className="game-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 animate-glow rounded-full bg-violet-600/20 blur-3xl" aria-hidden />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 font-display text-sm font-bold tracking-[0.25em] text-slate-400">
          <Castle className="size-4 text-violet-400" aria-hidden /> CONSTRUA SEU IMPÉRIO
        </span>
        <a
          href="./aula.html"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <BookOpen className="size-4" aria-hidden /> Material da aula
        </a>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 pb-16 pt-6 text-center sm:pt-12">
        <div className="relative mb-8 animate-pop">
          <div className="absolute inset-0 animate-glow rounded-[2rem] bg-gradient-to-br from-blue-500 via-violet-500 to-emerald-400 blur-2xl" aria-hidden />
          <div className="relative flex size-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-500 via-violet-600 to-emerald-500 shadow-2xl sm:size-28">
            <Castle className="size-12 text-white sm:size-14" strokeWidth={1.8} aria-hidden />
          </div>
        </div>

        <h1 className="animate-fade-up font-display text-5xl font-bold leading-none tracking-tight text-white sm:text-7xl lg:text-8xl">
          CONSTRUA SEU <span className="text-gradient">IMPÉRIO</span>
        </h1>
        <p className="mt-3 animate-fade-up font-display text-sm font-semibold uppercase tracking-[0.35em] text-slate-400 [animation-delay:80ms] sm:text-base">
          Empreendedorismo e marketing digital
        </p>
        <p className="mt-8 animate-fade-up font-display text-2xl font-bold text-white [animation-delay:160ms] sm:text-3xl">
          Sua ideia. Seu negócio. <span className="text-gradient">Seu império.</span>
        </p>
        <p className="mt-4 max-w-xl animate-fade-up text-base leading-relaxed text-slate-400 [animation-delay:220ms] sm:text-lg">
          Você tem uma ideia e uma oportunidade. Será que consegue transformá-la em uma empresa presente em todo o Brasil?
        </p>

        <div className="mt-10 flex w-full max-w-sm animate-fade-up flex-col gap-3 [animation-delay:300ms]">
          <Button size="xl" onClick={handleNew} icon={<Play className="size-5 fill-current" aria-hidden />}>
            NOVO JOGO
          </Button>
          <Button size="xl" variant="secondary" disabled={!game} onClick={onContinue} icon={<RotateCcw className="size-5" aria-hidden />}>
            CONTINUAR
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setHowTo(true)} icon={<CircleHelp className="size-5" aria-hidden />}>
            COMO JOGAR
          </Button>
        </div>

        {game && (
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-violet-400/40 hover:bg-white/[0.07] [animation-delay:360ms]"
          >
            <CompanyLogo logo={game.company.logo} name={game.company.name} size="sm" layout="horizontal" />
            <span className="ml-auto text-right text-xs text-slate-400">
              {game.phase === 'playing' ? `Mês ${game.month}` : 'Partida encerrada'}
              <br />
              <span className="font-semibold text-slate-200">{money(game.cash)}</span> · {getSegment(game.company.segment).label}
            </span>
          </button>
        )}

        <div className="mt-14 grid w-full max-w-3xl grid-cols-3 gap-3" aria-hidden>
          {[
            { icon: Wallet, label: 'Capital inicial', value: 'R$ 10 mil', color: 'text-emerald-300' },
            { icon: MapPinned, label: 'Estados para conquistar', value: String(STATES.length), color: 'text-sky-300' },
            { icon: TrendingUp, label: 'Meta de receita', value: moneyShort(VICTORY_REVENUE), color: 'text-violet-300' },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <div
              key={label}
              className="animate-float rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur sm:p-4"
              style={{ animationDelay: `${i * 0.8}s` }}
            >
              <Icon className={`mx-auto size-5 ${color}`} />
              <p className={`mt-1.5 font-display text-base font-bold sm:text-xl ${color}`}>{value}</p>
              <p className="text-[11px] text-slate-500 sm:text-xs">{label}</p>
            </div>
          ))}
        </div>
      </main>

      <HowToPlay open={howTo} onClose={() => setHowTo(false)} />
      <Modal
        open={confirmNew}
        onClose={() => setConfirmNew(false)}
        size="sm"
        title="Começar um novo jogo?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmNew(false)} data-autofocus>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteGame();
                setConfirmNew(false);
                onNewGame();
              }}
            >
              Apagar e começar
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-300">
          A partida da <strong className="text-white">{game?.company.name}</strong> será apagada deste navegador. Essa ação não pode
          ser desfeita.
        </p>
      </Modal>
    </div>
  );
}
