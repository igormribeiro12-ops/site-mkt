import { WandSparkles } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Botão "Sugerir" + sugestões clicáveis abaixo de um campo do formulário. */
export function IdeaChips({
  label,
  ideas,
  value,
  onGenerate,
  onPick,
  block,
}: {
  label: string;
  ideas: string[];
  value: string;
  onGenerate: () => void;
  onPick: (idea: string) => void;
  /** Sugestões longas ocupam a linha toda. */
  block?: boolean;
}) {
  return (
    <div className={cn('mt-2 flex gap-2', block ? 'flex-col items-start' : 'flex-wrap items-center')}>
      <button
        type="button"
        onClick={onGenerate}
        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/40 px-2.5 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/10"
      >
        <WandSparkles className="size-3.5" aria-hidden />
        {ideas.length ? 'Outras ideias' : label}
      </button>
      {ideas.map((idea) => (
        <button
          key={idea}
          type="button"
          onClick={() => onPick(idea)}
          className={cn(
            'border px-3 py-1 text-left text-xs font-medium transition',
            block ? 'w-full rounded-xl py-2' : 'rounded-full',
            value === idea ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-white/10 text-slate-300 hover:border-violet-400/50 hover:text-white',
          )}
        >
          {idea}
        </button>
      ))}
    </div>
  );
}
