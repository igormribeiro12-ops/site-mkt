import type { ComponentType } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getStep } from '../lib/steps';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { StepId } from '../types';
import { AudienceStep } from './steps/AudienceStep';
import { BrandStep } from './steps/BrandStep';
import { CompanyStep } from './steps/CompanyStep';
import { FinanceStep } from './steps/FinanceStep';
import { MarketingStep } from './steps/MarketingStep';
import { ProductsStep } from './steps/ProductsStep';
import { PublicationsStep } from './steps/PublicationsStep';

const PAGES: Record<StepId, ComponentType> = {
  empresa: CompanyStep,
  marca: BrandStep,
  publico: AudienceStep,
  produtos: ProductsStep,
  marketing: MarketingStep,
  publicacoes: PublicationsStep,
  financeiro: FinanceStep,
};

export function StepPage() {
  const { stepId } = useParams();
  const step = getStep(stepId);
  useDocumentTitle(step ? `Etapa ${step.number}: ${step.title}` : '');
  if (!step) return <Navigate to="/etapa/empresa" replace />;
  const Page = PAGES[step.id];
  // A chave reinicia o estado da página (ex.: erros exibidos) ao trocar de etapa.
  return <Page key={step.id} />;
}
