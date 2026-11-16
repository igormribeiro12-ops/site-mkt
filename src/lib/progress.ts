import type { Project, StepId } from '../types';
import { STEPS } from './steps';
import {
  type Errors,
  validateAudience,
  validateBrand,
  validateCampaignsStep,
  validateCompany,
  validateFinance,
  validateMarketing,
  validateProductsStep,
} from './validation';

/** Quantidade de itens obrigatórios em cada etapa (base do cálculo de progresso). */
const FIELD_COUNT: Record<StepId, number> = {
  empresa: 7,
  marca: 4,
  publico: 7,
  produtos: 1,
  marketing: 7,
  publicacoes: 1,
  financeiro: 5,
};

export function getStepErrors(project: Project, step: StepId): Errors {
  switch (step) {
    case 'empresa':
      return validateCompany(project.company);
    case 'marca':
      return validateBrand(project.brand);
    case 'publico':
      return validateAudience(project.audience);
    case 'produtos':
      return validateProductsStep(project.products);
    case 'marketing':
      return validateMarketing(project.marketing);
    case 'publicacoes':
      return validateCampaignsStep(project.campaigns);
    case 'financeiro':
      return validateFinance(project.finance);
  }
}

/** Fração de 0 a 1 do quanto a etapa está preenchida. */
export function getStepCompletion(project: Project, step: StepId): number {
  const missing = Object.keys(getStepErrors(project, step)).length;
  const total = FIELD_COUNT[step];
  return Math.max(0, Math.min(1, (total - missing) / total));
}

export function isStepComplete(project: Project, step: StepId): boolean {
  return Object.keys(getStepErrors(project, step)).length === 0;
}

/** Progresso geral da empresa, de 0 a 100. */
export function getOverallProgress(project: Project): number {
  const sum = STEPS.reduce((acc, s) => acc + getStepCompletion(project, s.id), 0);
  return Math.round((sum / STEPS.length) * 100);
}

export function getCompletedStepsCount(project: Project): number {
  return STEPS.filter((s) => isStepComplete(project, s.id)).length;
}

export function firstIncompleteStep(project: Project): StepId | null {
  return STEPS.find((s) => !isStepComplete(project, s.id))?.id ?? null;
}
