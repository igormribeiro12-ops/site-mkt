import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CircleCheck, LayoutDashboard, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { getStepErrors, isStepComplete } from '../../lib/progress';
import { STEPS, getAdjacentSteps, getStep, stepPath } from '../../lib/steps';
import type { StepId } from '../../types';
import { Button } from '../ui/Button';

/** Leva a tela até o primeiro campo com erro e coloca o foco nele. */
export function focusFirstError() {
  window.requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[data-field-error="true"]');
    if (!el) return;
    el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    const focusable = el.querySelector<HTMLElement>('input, textarea, select, button');
    focusable?.focus({ preventScroll: true });
  });
}

/**
 * Controla a validação da etapa: os erros só aparecem depois que o aluno tenta
 * avançar, e então são atualizados conforme ele corrige os campos.
 */
export function useStepForm(stepId: StepId) {
  const { project, saveNow } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const [showErrors, setShowErrors] = useState(false);
  const errors = getStepErrors(project, stepId);
  const visibleErrors = showErrors ? errors : {};
  const { next } = getAdjacentSteps(stepId);

  const submit = useCallback(() => {
    const count = Object.keys(getStepErrors(project, stepId)).length;
    if (count > 0) {
      setShowErrors(true);
      toast.error(
        count === 1
          ? 'Falta 1 item obrigatório nesta etapa. Ele está destacado em vermelho.'
          : `Faltam ${count} itens obrigatórios nesta etapa. Eles estão destacados em vermelho.`,
      );
      focusFirstError();
      return;
    }
    saveNow();
    toast.success(next ? 'Etapa salva! Vamos para a próxima.' : 'Tudo salvo! Veja o painel da sua empresa.');
    navigate(next ? stepPath(next.id) : '/painel');
  }, [project, stepId, next, saveNow, toast, navigate]);

  return { errors: visibleErrors, allErrors: errors, showErrors, submit };
}

export function StepHeader({ stepId, children }: { stepId: StepId; children?: ReactNode }) {
  const { project } = useProject();
  const step = getStep(stepId)!;
  const Icon = step.icon;
  const complete = isStepComplete(project, stepId);
  return (
    <header className="mb-6 animate-fade-up sm:mb-8">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">
          Etapa {step.number} de {STEPS.length}
        </span>
        {complete && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            <CircleCheck className="size-3.5" aria-hidden />
            Completa
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="hidden size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-600/20 sm:flex">
          <Icon className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{step.title}</h1>
      </div>
      <p className="mt-2 max-w-2xl text-[15px] text-slate-500">{step.description}</p>
      {children}
    </header>
  );
}

interface StepFooterProps {
  stepId: StepId;
  onContinue: () => void;
  missingCount: number;
  showErrors: boolean;
}

export function StepFooter({ stepId, onContinue, missingCount, showErrors }: StepFooterProps) {
  const navigate = useNavigate();
  const { prev, next } = getAdjacentSteps(stepId);
  return (
    <div className="mt-8 space-y-4">
      {showErrors && missingCount > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            <strong className="font-bold">
              {missingCount === 1 ? 'Falta 1 item obrigatório.' : `Faltam ${missingCount} itens obrigatórios.`}
            </strong>{' '}
            Seu rascunho já está salvo: você pode completar agora ou voltar depois.
          </p>
        </div>
      )}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="secondary"
          onClick={() => navigate(prev ? stepPath(prev.id) : '/')}
          icon={<ArrowLeft className="size-4" aria-hidden />}
        >
          {prev ? `Voltar: ${prev.shortTitle}` : 'Voltar ao início'}
        </Button>
        <Button
          size="lg"
          onClick={onContinue}
          iconRight={next ? <ArrowRight className="size-5" aria-hidden /> : <LayoutDashboard className="size-5" aria-hidden />}
        >
          {next ? `Salvar e continuar` : 'Salvar e ver o painel'}
        </Button>
      </div>
    </div>
  );
}
