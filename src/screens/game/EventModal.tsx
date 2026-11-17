import { useEffect, useState } from 'react';
import { ArrowRight, BookOpenText, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Panel';
import { CONCEPTS } from '../../game/data';
import { choiceCost, getEvent, isChoiceAvailable } from '../../game/events';
import { money } from '../../game/format';
import { cn } from '../../lib/cn';
import { useActiveGame } from '../../state/GameContext';

export function EventModal({ onDone }: { onDone: () => void }) {
  const { game, resolve } = useActiveGame();
  const [outcome, setOutcome] = useState<{ title: string; choice: string; text: string; concept: string } | null>(null);
  const event = game.pendingEvent ? getEvent(game.pendingEvent.eventId) : undefined;

  // Sem evento pendente (ex.: partida carregada sem evento), volta ao jogo.
  useEffect(() => {
    if (!event && !outcome) onDone();
  }, [event, outcome, onDone]);

  if (outcome) {
    return (
      <Modal open locked size="md" labelledBy="event-outcome" footer={<Button size="lg" onClick={onDone} data-autofocus iconRight={<ArrowRight className="size-5" aria-hidden />}>Continuar</Button>}>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Consequência</p>
        <h2 id="event-outcome" className="mt-1 font-display text-xl font-bold text-white">
          {outcome.title}
        </h2>
        <p className="mt-1 text-sm text-slate-400">Sua escolha: {outcome.choice}</p>
        <p className="mt-4 rounded-2xl bg-white/[0.04] p-4 leading-relaxed text-slate-200 ring-1 ring-white/10">{outcome.text}</p>
        <p className="mt-4 flex items-center gap-2 text-sm text-sky-200">
          <BookOpenText className="size-4" aria-hidden /> Conceito: <strong>{outcome.concept}</strong>
        </p>
      </Modal>
    );
  }

  if (!event) return null;
  const Icon = event.icon;
  const tone = event.tone === 'good' ? 'from-emerald-500/30 to-teal-500/10 text-emerald-200' : event.tone === 'bad' ? 'from-rose-500/30 to-orange-500/10 text-rose-200' : 'from-sky-500/30 to-violet-500/10 text-sky-200';

  return (
    <Modal open locked size="lg" labelledBy="event-title">
      <div className={cn('-mx-5 -mt-5 mb-5 bg-gradient-to-br px-5 pb-6 pt-6 sm:-mx-6 sm:px-6', tone)}>
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 animate-pop items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Icon className="size-7" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">
              {event.tone === 'good' ? 'Oportunidade' : event.tone === 'bad' ? 'Desafio' : 'Mudança no mercado'} · Mês {game.month}
            </p>
            <h2 id="event-title" className="font-display text-2xl font-bold text-white">
              {event.title}
            </h2>
          </div>
        </div>
        <p className="mt-4 leading-relaxed text-slate-200">{event.description(game)}</p>
      </div>
      <p className="mb-3 text-sm font-semibold text-slate-300">O que você vai fazer?</p>
      <div className="space-y-2.5">
        {event.choices.map((choice, i) => {
          const cost = choiceCost(game, choice);
          const available = isChoiceAvailable(game, choice);
          const reason = choice.available && !choice.available(game) ? choice.unavailableReason : cost > game.cash ? 'Saldo insuficiente' : null;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={!available}
              data-autofocus={i === 0 ? true : undefined}
              onClick={() => {
                const text = resolve(choice.id);
                if (text) setOutcome({ title: event.title, choice: choice.label, text, concept: CONCEPTS[event.concept].term });
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/40',
                available ? 'border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-violet-500/10' : 'cursor-not-allowed border-white/[0.05] opacity-45',
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-display text-sm font-bold text-slate-300">
                {available ? String.fromCharCode(65 + i) : <Lock className="size-4" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">{choice.label}</span>
                <span className="block text-sm text-slate-400">{reason ?? choice.hint}</span>
              </span>
              {cost > 0 && <Badge tone="warn">{money(cost)}</Badge>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
