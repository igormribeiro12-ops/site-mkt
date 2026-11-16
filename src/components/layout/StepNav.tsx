import { Check, LayoutDashboard, Presentation } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { cn } from '../../lib/cn';
import { getCompletedStepsCount, getOverallProgress, getStepCompletion } from '../../lib/progress';
import { STEPS, stepPath } from '../../lib/steps';
import { ProgressBar } from '../ui/Feedback';

export function OverallProgress({ className }: { className?: string }) {
  const { project } = useProject();
  const progress = getOverallProgress(project);
  const done = getCompletedStepsCount(project);
  return (
    <div className={cn('rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm', className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-700">Sua empresa</p>
        <p className="text-sm font-bold tabular-nums text-violet-600">{progress}%</p>
      </div>
      <ProgressBar value={progress} label="Progresso da empresa" className="mt-2.5" />
      <p className="mt-2 text-xs text-slate-500">
        {done === STEPS.length
          ? 'Todas as etapas completas! 🎉'
          : `${done} de ${STEPS.length} etapas completas`}
      </p>
    </div>
  );
}

export function StepNav({ onNavigate }: { onNavigate?: () => void }) {
  const { project } = useProject();

  return (
    <nav aria-label="Etapas da criação da empresa" className="space-y-4">
      <OverallProgress />
      <ol className="space-y-1">
        {STEPS.map((step) => {
          const completion = getStepCompletion(project, step.id);
          const complete = completion >= 1;
          const started = completion > 0;
          return (
            <li key={step.id}>
              <NavLink
                to={stepPath(step.id)}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors',
                    isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/70',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors',
                        complete
                          ? 'bg-emerald-500 text-white'
                          : isActive
                            ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                            : 'bg-slate-200/70 text-slate-500 group-hover:bg-slate-200',
                      )}
                    >
                      {complete ? <Check className="size-4" strokeWidth={3} aria-hidden /> : step.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm font-semibold',
                          isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900',
                        )}
                      >
                        {step.title}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {complete ? 'Completa' : started ? `Em andamento · ${Math.round(completion * 100)}%` : 'Não iniciada'}
                      </span>
                    </span>
                    {isActive && <span className="sr-only">(etapa atual)</span>}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ol>
      <div className="space-y-1 border-t border-slate-200/80 pt-4">
        <NavLink
          to="/painel"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors',
              isActive ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
            )
          }
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <LayoutDashboard className="size-4" aria-hidden />
          </span>
          Painel da empresa
        </NavLink>
        <NavLink
          to="/apresentacao"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Presentation className="size-4" aria-hidden />
          </span>
          Apresentar minha empresa
        </NavLink>
      </div>
    </nav>
  );
}
