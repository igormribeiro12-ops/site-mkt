import { Coins, Menu, Moon, Pause, Play, Sun, Sunrise, Target } from 'lucide-react';
import { LogoMark } from '../../components/CompanyLogo';
import { AnimatedNumber, Meter } from '../../components/ui/Panel';
import { LEVELS } from '../../game/data';
import { money } from '../../game/format';
import { currentMission } from '../../game/missions';
import { DAYS_PER_MONTH } from '../../game/simulation';
import { cn } from '../../lib/cn';
import { useActiveGame, useUi } from '../../state/GameContext';
import { type Speed, patchUi } from '../../state/store';
import { CLOSE, OPEN, formatClock, isBusinessHours } from '../../world/clock';
import { levelProgress } from '../game/levelProgress';
import { blurAfterMouseClick } from './Toolbar';

const SPEEDS: { value: Speed; label: string }[] = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

export function setSpeed(speed: Speed) {
  patchUi({ speed, ...(speed > 0 ? { resumeSpeed: speed } : {}) });
}

export function Hud() {
  const { game } = useActiveGame();
  const minute = useUi((u) => Math.floor(u.minute));
  const speed = useUi((u) => u.speed);
  const pending = useUi((u) => u.pendingRevenue);
  const flash = useUi((u) => u.missionFlash);
  const open = isBusinessHours(minute);
  const night = minute < 6 * 60 || minute >= 19 * 60;
  const TimeIcon = night ? Moon : minute < OPEN ? Sunrise : Sun;
  const mission = currentMission(game);
  const level = LEVELS[game.level - 1];
  const progress = levelProgress(game);
  const dayProgress = Math.min(1, Math.max(0, (minute - OPEN) / (CLOSE - OPEN)));

  return (
    <div onClickCapture={blurAfterMouseClick} className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start gap-2 p-2 sm:p-3">
      {/* Empresa e fase */}
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-white/10 bg-ink-950/75 px-2.5 py-2 shadow-xl backdrop-blur-md max-sm:hidden">
        <LogoMark logo={game.company.logo} size="sm" />
        <div className="min-w-0 max-sm:hidden">
          <p className="max-w-40 truncate font-display text-sm font-bold leading-tight text-white">{game.company.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="rounded bg-violet-500/25 px-1 text-[10px] font-bold text-violet-200">NV {game.level}</span>
            <span className="max-w-28 truncate text-[11px] text-slate-400 max-lg:hidden">{level?.title}</span>
            {progress !== null && <Meter value={progress * 100} size="xs" className="w-14" label="Progresso para a próxima fase" />}
          </div>
        </div>
      </div>

      {/* Dinheiro */}
      <div className="pointer-events-auto rounded-2xl border border-white/10 bg-ink-950/75 px-3 py-1.5 shadow-xl backdrop-blur-md max-sm:px-2" data-testid="hud-money">
        <div className="flex items-center gap-1.5">
          <Coins className="size-4 text-yellow-300" aria-hidden />
          <span className={cn('font-display text-lg font-bold tabular-nums', game.cash < 0 ? 'text-rose-300' : 'text-white')}>
            <AnimatedNumber value={game.cash} format={(n) => money(n)} />
          </span>
        </div>
        <p className="whitespace-nowrap text-[10px] font-semibold tabular-nums text-emerald-300/90">{pending > 0 ? (
            <>
              +{money(pending)} <span className="max-sm:hidden">em vendas</span> hoje
            </>
          ) : (
            'Saldo da empresa'
          )}</p>
      </div>

      {/* Relógio */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-950/75 px-3 py-1.5 shadow-xl backdrop-blur-md max-sm:gap-1.5 max-sm:px-2" data-testid="hud-clock">
        <TimeIcon className={cn('size-5 max-sm:hidden', night ? 'text-indigo-300' : 'text-amber-300')} aria-hidden />
        <div>
          <p className="font-display text-lg font-bold leading-tight tabular-nums text-white">{formatClock(minute)}</p>
          <p className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
            Dia {game.world.day}/{DAYS_PER_MONTH}
            <span className="max-sm:hidden"> · Mês {game.month}</span>
          </p>
        </div>
        <div className="ml-1 hidden w-14 sm:block">
          <span className={cn('block text-center text-[10px] font-bold uppercase', open ? 'text-emerald-300' : 'text-rose-300')}>{open ? 'Aberto' : 'Fechado'}</span>
          <Meter value={dayProgress * 100} size="xs" label="Expediente" />
        </div>
        <div className="ml-1 flex items-center gap-0.5 rounded-xl bg-white/[0.05] p-0.5" role="group" aria-label="Velocidade do tempo">
          <button
            type="button"
            onClick={() => setSpeed(speed === 0 ? 1 : 0)}
            aria-label={speed === 0 ? 'Retomar o tempo' : 'Pausar'}
            aria-pressed={speed === 0}
            className={cn('rounded-lg p-1.5 transition', speed === 0 ? 'bg-amber-400 text-ink-950' : 'text-slate-300 hover:bg-white/10')}
          >
            {speed === 0 ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
          </button>
          <div className="flex items-center gap-0.5 max-sm:hidden">
            {SPEEDS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSpeed(s.value)}
                aria-pressed={speed === s.value}
                className={cn('rounded-lg px-1.5 py-1 text-[11px] font-bold transition', speed === s.value ? 'bg-violet-500 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white')}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* No celular: um botão que alterna a velocidade */}
          <button
            type="button"
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
            aria-label="Mudar a velocidade"
            className="rounded-lg bg-violet-500/80 px-1.5 py-1 text-[11px] font-bold text-white sm:hidden"
          >
            {speed || 1}x
          </button>
        </div>
      </div>

      <div className="flex-1" />

      {/* Missão atual */}
      {mission && (
        <button
          type="button"
          onClick={() => patchUi({ panel: 'missions' })}
          className={cn(
            'pointer-events-auto hidden max-w-72 items-center gap-2.5 rounded-2xl border bg-ink-950/75 px-3 py-2 text-left shadow-xl backdrop-blur-md transition hover:border-amber-300/50 md:flex',
            flash ? 'border-amber-300/60 animate-pop' : 'border-white/10',
          )}
          data-testid="hud-mission"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <Target className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-300/90">Missão · +{money(mission.reward)}</span>
            <span className="block truncate text-xs font-semibold text-white">{mission.title}</span>
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => patchUi({ panel: 'pause' })}
        className="pointer-events-auto rounded-2xl border border-white/10 bg-ink-950/75 p-2.5 text-slate-200 shadow-xl backdrop-blur-md transition hover:bg-white/10"
        aria-label="Menu do jogo"
      >
        <Menu className="size-5" />
      </button>
    </div>
  );
}
