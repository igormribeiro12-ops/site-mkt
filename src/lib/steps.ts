import type { LucideIcon } from 'lucide-react';
import { Building2, Megaphone, Package, Palette, SquarePen, Users, Wallet } from 'lucide-react';
import type { StepId } from '../types';

export interface StepMeta {
  id: StepId;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
}

export const STEPS: StepMeta[] = [
  {
    id: 'empresa',
    number: 1,
    title: 'Criação da empresa',
    shortTitle: 'Empresa',
    description: 'Dê vida à sua ideia: nome, segmento, problema que resolve e diferencial.',
    icon: Building2,
  },
  {
    id: 'marca',
    number: 2,
    title: 'Identidade da marca',
    shortTitle: 'Marca',
    description: 'Cores, estilo, símbolo e slogan: a cara da sua empresa.',
    icon: Palette,
  },
  {
    id: 'publico',
    number: 3,
    title: 'Público-alvo',
    shortTitle: 'Público',
    description: 'Descubra quem é o seu cliente ideal e onde ele está na internet.',
    icon: Users,
  },
  {
    id: 'produtos',
    number: 4,
    title: 'Produtos e serviços',
    shortTitle: 'Produtos',
    description: 'Monte a vitrine com o que a sua empresa vende.',
    icon: Package,
  },
  {
    id: 'marketing',
    number: 5,
    title: 'Marketing digital',
    shortTitle: 'Marketing',
    description: 'Escolha canais, estratégia de conteúdo, investimento e calendário.',
    icon: Megaphone,
  },
  {
    id: 'publicacoes',
    number: 6,
    title: 'Criador de publicações',
    shortTitle: 'Publicações',
    description: 'Crie campanhas e veja como ficam nas redes sociais.',
    icon: SquarePen,
  },
  {
    id: 'financeiro',
    number: 7,
    title: 'Planejamento financeiro',
    shortTitle: 'Financeiro',
    description: 'Simule receitas, custos e resultado da sua empresa.',
    icon: Wallet,
  },
];

export function getStep(id: string | undefined): StepMeta | undefined {
  return STEPS.find((s) => s.id === id);
}

export function stepPath(id: StepId): string {
  return `/etapa/${id}`;
}

export function getAdjacentSteps(id: StepId): { prev?: StepMeta; next?: StepMeta } {
  const index = STEPS.findIndex((s) => s.id === id);
  return { prev: STEPS[index - 1], next: STEPS[index + 1] };
}
