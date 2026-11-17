import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Code2,
  Cpu,
  Clapperboard,
  GraduationCap,
  Headset,
  Megaphone,
  Shirt,
  Sparkles,
  Store,
  UserRoundCog,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import type {
  ChannelId,
  ConceptId,
  DesignPackageId,
  DifficultyId,
  ObjectiveId,
  ProductTierId,
  RoleId,
  SegmentId,
  StartStructureId,
} from './types';

export const STARTING_CAPITAL = 10_000;
export const MONTH_LIMIT = 36;
export const VICTORY_REVENUE = 100_000;
export const VICTORY_LEVEL = 5;
export const VICTORY_STREAK = 3;
export const TAX_RATE = 0.06;

// ---------------------------------------------------------------------------
// Mercados
// ---------------------------------------------------------------------------

export interface Segment {
  id: SegmentId;
  label: string;
  icon: LucideIcon;
  tagline: string;
  /** Pessoas com potencial de compra por mês no mercado local. */
  baseDemand: number;
  /** 0–100 */
  competition: number;
  /** 0–100 */
  purchasingPower: number;
  /** Crescimento do mercado por mês. */
  trend: number;
  trendLabel: string;
  /** 0–100: mais alto = clientes exigem mais qualidade. */
  entryDifficulty: number;
  refPrice: number;
  unitCostRatio: number;
  /** Fração dos clientes ativos que compram de novo a cada mês. */
  repeatRate: number;
  openingCost: number;
  affinity: Record<ChannelId, number>;
  productExample: string;
  persona: { name: string; age: number; description: string; channels: string };
}

export const SEGMENTS: Segment[] = [
  {
    id: 'tecnologia',
    label: 'Tecnologia',
    icon: Cpu,
    tagline: 'Apps, sites, acessórios e soluções digitais',
    baseDemand: 900,
    competition: 70,
    purchasingPower: 75,
    trend: 0.04,
    trendLabel: 'Inteligência artificial e automação em alta',
    entryDifficulty: 70,
    refPrice: 120,
    unitCostRatio: 0.32,
    repeatRate: 0.2,
    openingCost: 2500,
    affinity: { instagram: 0.9, tiktok: 1.0, google: 1.4, facebook: 0.8, whatsapp: 0.9, influencer: 1.0, seo: 1.4 },
    productExample: 'App de organização de estudos',
    persona: {
      name: 'Lucas',
      age: 24,
      description: 'Estudante e estagiário, quer resolver problemas do dia a dia com poucos cliques.',
      channels: 'Pesquisa no Google, vê reviews no YouTube e segue perfis de tecnologia.',
    },
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    icon: UtensilsCrossed,
    tagline: 'Lanches, doces, marmitas e delivery',
    baseDemand: 3800,
    competition: 75,
    purchasingPower: 45,
    trend: 0.01,
    trendLabel: 'Comida saudável e delivery rápido crescendo',
    entryDifficulty: 30,
    refPrice: 25,
    unitCostRatio: 0.42,
    repeatRate: 0.4,
    openingCost: 1500,
    affinity: { instagram: 1.3, tiktok: 1.2, google: 0.9, facebook: 1.0, whatsapp: 1.4, influencer: 1.2, seo: 0.8 },
    productExample: 'Brigadeiros gourmet por encomenda',
    persona: {
      name: 'Ana',
      age: 22,
      description: 'Estuda e trabalha, tem pouco tempo e gosta de comida gostosa com preço justo.',
      channels: 'Vive no Instagram e pede pelo WhatsApp.',
    },
  },
  {
    id: 'moda',
    label: 'Moda',
    icon: Shirt,
    tagline: 'Roupas, calçados e acessórios',
    baseDemand: 1400,
    competition: 70,
    purchasingPower: 55,
    trend: 0.02,
    trendLabel: 'Moda sustentável e brechós em alta',
    entryDifficulty: 45,
    refPrice: 80,
    unitCostRatio: 0.4,
    repeatRate: 0.2,
    openingCost: 2000,
    affinity: { instagram: 1.4, tiktok: 1.3, google: 0.8, facebook: 0.9, whatsapp: 1.0, influencer: 1.4, seo: 0.7 },
    productExample: 'Camisetas com estampas autorais',
    persona: {
      name: 'Bia',
      age: 19,
      description: 'Gosta de mostrar seu estilo e acompanha tendências.',
      channels: 'Descobre marcas no Instagram, TikTok e com influenciadores.',
    },
  },
  {
    id: 'beleza',
    label: 'Beleza',
    icon: Sparkles,
    tagline: 'Cosméticos, estética e cuidados pessoais',
    baseDemand: 1500,
    competition: 60,
    purchasingPower: 55,
    trend: 0.03,
    trendLabel: 'Skincare e produtos naturais crescendo',
    entryDifficulty: 40,
    refPrice: 60,
    unitCostRatio: 0.35,
    repeatRate: 0.35,
    openingCost: 1800,
    affinity: { instagram: 1.4, tiktok: 1.2, google: 1.0, facebook: 1.0, whatsapp: 1.2, influencer: 1.3, seo: 0.9 },
    productExample: 'Kit de skincare natural',
    persona: {
      name: 'Carla',
      age: 28,
      description: 'Quer se cuidar sem gastar muito e confia em recomendações.',
      channels: 'Instagram, influenciadoras de beleza e grupos de WhatsApp.',
    },
  },
  {
    id: 'educacao',
    label: 'Educação',
    icon: GraduationCap,
    tagline: 'Cursos, aulas e reforço escolar',
    baseDemand: 700,
    competition: 60,
    purchasingPower: 60,
    trend: 0.03,
    trendLabel: 'Cursos on-line e profissionalizantes em alta',
    entryDifficulty: 35,
    refPrice: 150,
    unitCostRatio: 0.35,
    repeatRate: 0.3,
    openingCost: 1500,
    affinity: { instagram: 1.0, tiktok: 1.1, google: 1.3, facebook: 1.1, whatsapp: 1.2, influencer: 0.9, seo: 1.3 },
    productExample: 'Curso preparatório on-line',
    persona: {
      name: 'Pedro',
      age: 17,
      description: 'Vai prestar vestibular e quer estudar de forma organizada.',
      channels: 'Pesquisa no Google, assiste a vídeos curtos e conversa com os pais no WhatsApp.',
    },
  },
  {
    id: 'comercio',
    label: 'Comércio',
    icon: Store,
    tagline: 'Lojas físicas e on-line de produtos variados',
    baseDemand: 1800,
    competition: 75,
    purchasingPower: 50,
    trend: 0,
    trendLabel: 'Mercado estável e muito disputado',
    entryDifficulty: 50,
    refPrice: 50,
    unitCostRatio: 0.47,
    repeatRate: 0.25,
    openingCost: 2000,
    affinity: { instagram: 1.0, tiktok: 0.9, google: 1.2, facebook: 1.2, whatsapp: 1.2, influencer: 0.9, seo: 1.1 },
    productExample: 'Loja on-line de presentes criativos',
    persona: {
      name: 'Marcos',
      age: 35,
      description: 'Compara preços antes de comprar e valoriza entrega rápida.',
      channels: 'Pesquisa no Google, vê ofertas no Facebook e pergunta pelo WhatsApp.',
    },
  },
  {
    id: 'servicos',
    label: 'Serviços',
    icon: Wrench,
    tagline: 'Consertos, consultorias, limpeza e entregas',
    baseDemand: 900,
    competition: 55,
    purchasingPower: 60,
    trend: 0.02,
    trendLabel: 'Serviços sob demanda e por aplicativo crescendo',
    entryDifficulty: 30,
    refPrice: 100,
    unitCostRatio: 0.35,
    repeatRate: 0.25,
    openingCost: 1200,
    affinity: { instagram: 0.9, tiktok: 0.8, google: 1.4, facebook: 1.1, whatsapp: 1.4, influencer: 0.7, seo: 1.3 },
    productExample: 'Assistência técnica de celulares',
    persona: {
      name: 'Dona Rosa',
      age: 52,
      description: 'Precisa de alguém de confiança que resolva o problema rápido.',
      channels: 'Procura no Google e pede indicação no WhatsApp.',
    },
  },
  {
    id: 'entretenimento',
    label: 'Entretenimento',
    icon: Clapperboard,
    tagline: 'Eventos, jogos, música e experiências',
    baseDemand: 2400,
    competition: 55,
    purchasingPower: 50,
    trend: 0.05,
    trendLabel: 'Experiências e eventos temáticos em alta',
    entryDifficulty: 40,
    refPrice: 40,
    unitCostRatio: 0.35,
    repeatRate: 0.3,
    openingCost: 1800,
    affinity: { instagram: 1.2, tiktok: 1.5, google: 0.8, facebook: 1.0, whatsapp: 1.0, influencer: 1.4, seo: 0.8 },
    productExample: 'Sala de escape (escape room)',
    persona: {
      name: 'Gabi',
      age: 21,
      description: 'Adora programas diferentes com os amigos e posta tudo.',
      channels: 'TikTok, Instagram e indicação de amigos.',
    },
  },
];

export function getSegment(id: SegmentId): Segment {
  return SEGMENTS.find((s) => s.id === id)!;
}

/** Qualidade mínima que os clientes do segmento esperam. */
export function qualityExpectation(segment: Segment): number {
  return Math.round(40 + segment.entryDifficulty * 0.4);
}

// ---------------------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------------------

export interface Channel {
  id: ChannelId;
  label: string;
  color: string;
  /** Pessoas alcançadas a cada R$ 100 investidos. */
  reachPer100: number;
  /** Fração dos alcançados que vira cliente (antes dos multiplicadores). */
  conversion: number;
  followRate: number;
  leadRate: number;
  minBudget: number;
  unlockLevel: number;
  audience: string;
  description: string;
  /** Usa só a base de contatos (seguidores, clientes e leads). */
  baseLimited?: boolean;
  /** Constrói tráfego orgânico duradouro. */
  buildsOrganic?: boolean;
  social?: boolean;
}

export const CHANNELS: Channel[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#e1306c',
    reachPer100: 2200,
    conversion: 0.0048,
    followRate: 0.02,
    leadRate: 0.012,
    minBudget: 100,
    unlockLevel: 1,
    audience: '18 a 34 anos · estilo de vida, fotos e Reels',
    description: 'Ótimo para marcas visuais e para construir comunidade.',
    social: true,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877f2',
    reachPer100: 2000,
    conversion: 0.0044,
    followRate: 0.01,
    leadRate: 0.015,
    minBudget: 100,
    unlockLevel: 1,
    audience: '30 a 55 anos · comunidades e grupos locais',
    description: 'Alcança públicos mais velhos e moradores da região.',
    social: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business',
    color: '#25d366',
    reachPer100: 900,
    conversion: 0.04,
    followRate: 0,
    leadRate: 0.04,
    minBudget: 50,
    unlockLevel: 1,
    audience: 'Quem já conhece você: clientes, leads e seguidores',
    description: 'Relacionamento e recompra. Só alcança a sua base de contatos.',
    baseLimited: true,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#111827',
    reachPer100: 4200,
    conversion: 0.0028,
    followRate: 0.03,
    leadRate: 0.006,
    minBudget: 100,
    unlockLevel: 2,
    audience: '13 a 24 anos · vídeos curtos e tendências',
    description: 'Alcance enorme e barato, mas conversão mais baixa.',
    social: true,
  },
  {
    id: 'google',
    label: 'Google Ads',
    color: '#4285f4',
    reachPer100: 450,
    conversion: 0.028,
    followRate: 0,
    leadRate: 0.03,
    minBudget: 150,
    unlockLevel: 2,
    audience: 'Quem já está pesquisando por uma solução',
    description: 'Alcance menor, mas o público já tem intenção de compra.',
  },
  {
    id: 'influencer',
    label: 'Marketing de influência',
    color: '#a855f7',
    reachPer100: 3200,
    conversion: 0.004,
    followRate: 0.025,
    leadRate: 0.008,
    minBudget: 800,
    unlockLevel: 3,
    audience: 'Seguidores de criadores de conteúdo do seu nicho',
    description: 'Empresta a confiança do influenciador para a sua marca.',
    social: true,
  },
  {
    id: 'seo',
    label: 'SEO',
    color: '#10b981',
    reachPer100: 300,
    conversion: 0.016,
    followRate: 0,
    leadRate: 0.02,
    minBudget: 200,
    unlockLevel: 3,
    audience: 'Pessoas que encontram você nos resultados gratuitos de busca',
    description: 'Resultado lento, mas gera visitas orgânicas que continuam nos meses seguintes.',
    buildsOrganic: true,
  },
];

export function getChannel(id: ChannelId): Channel {
  return CHANNELS.find((c) => c.id === id)!;
}

export interface Objective {
  id: ObjectiveId;
  label: string;
  short: string;
  description: string;
  reach: number;
  conversion: number;
  follow: number;
  lead: number;
  awareness: number;
}

export const OBJECTIVES: Objective[] = [
  {
    id: 'awareness',
    label: 'Reconhecimento da marca',
    short: 'Reconhecimento',
    description: 'Mostra a marca para muita gente. Vende pouco agora, mas deixa a empresa conhecida.',
    reach: 1.4,
    conversion: 0.4,
    follow: 1,
    lead: 0.6,
    awareness: 2.2,
  },
  {
    id: 'followers',
    label: 'Aumento de seguidores',
    short: 'Seguidores',
    description: 'Constrói audiência própria, que gera vendas orgânicas nos meses seguintes.',
    reach: 1,
    conversion: 0.5,
    follow: 2.6,
    lead: 0.6,
    awareness: 1.2,
  },
  {
    id: 'leads',
    label: 'Geração de leads',
    short: 'Leads',
    description: 'Capta contatos interessados. Vendedores convertem leads em clientes depois.',
    reach: 0.9,
    conversion: 0.6,
    follow: 0.8,
    lead: 2.4,
    awareness: 0.8,
  },
  {
    id: 'sales',
    label: 'Conversão em vendas',
    short: 'Vendas',
    description: 'Foca em quem está pronto para comprar. Mais vendas imediatas.',
    reach: 0.8,
    conversion: 1.4,
    follow: 0.6,
    lead: 0.8,
    awareness: 0.6,
  },
];

export function getObjective(id: ObjectiveId): Objective {
  return OBJECTIVES.find((o) => o.id === id)!;
}

// ---------------------------------------------------------------------------
// Equipe, infraestrutura e expansão
// ---------------------------------------------------------------------------

export interface Role {
  id: RoleId;
  label: string;
  icon: LucideIcon;
  salary: number;
  unlockLevel: number;
  max: number;
  benefit: string;
  impact: string;
}

export const ROLES: Role[] = [
  {
    id: 'atendente',
    label: 'Atendente',
    icon: Headset,
    salary: 1600,
    unlockLevel: 1,
    max: 10,
    benefit: 'Mais clientes atendidos por mês com qualidade',
    impact: 'Melhora a satisfação quando há muitos pedidos.',
  },
  {
    id: 'vendedor',
    label: 'Vendedor',
    icon: Briefcase,
    salary: 2000,
    unlockLevel: 1,
    max: 4,
    benefit: '+6 p.p. na conversão de leads e +5% nas vendas',
    impact: 'Transforma contatos interessados em clientes.',
  },
  {
    id: 'marketing',
    label: 'Profissional de marketing',
    icon: Megaphone,
    salary: 2600,
    unlockLevel: 2,
    max: 2,
    benefit: '+20% de alcance nas campanhas e +250 seguidores/mês',
    impact: 'Campanhas mais eficientes e conteúdo orgânico.',
  },
  {
    id: 'desenvolvedor',
    label: 'Desenvolvedor de produto',
    icon: Code2,
    salary: 3200,
    unlockLevel: 3,
    max: 2,
    benefit: '+3 de qualidade por mês e custo de produção 3% menor',
    impact: 'Inovação contínua no produto.',
  },
  {
    id: 'gerente',
    label: 'Gerente',
    icon: UserRoundCog,
    salary: 4200,
    unlockLevel: 4,
    max: 1,
    benefit: '+15% de capacidade e 8% menos custos fixos',
    impact: 'Organiza a operação e reduz desperdícios.',
  },
];

export function getRole(id: RoleId): Role {
  return ROLES.find((r) => r.id === id)!;
}

export interface InfraLevel {
  level: number;
  label: string;
  description: string;
  capacity: number;
  rent: number;
  upgradeCost: number;
}

export const INFRA: InfraLevel[] = [
  { level: 0, label: 'Home office', description: 'Começando em casa, com estrutura mínima.', capacity: 220, rent: 150, upgradeCost: 0 },
  { level: 1, label: 'Espaço compartilhado', description: 'Coworking ou cozinha compartilhada.', capacity: 550, rent: 700, upgradeCost: 2000 },
  { level: 2, label: 'Sede própria', description: 'Um espaço só seu, com equipamentos melhores.', capacity: 1300, rent: 1800, upgradeCost: 7000 },
  { level: 3, label: 'Centro de operações', description: 'Operação profissional e processos organizados.', capacity: 3000, rent: 4000, upgradeCost: 18000 },
  { level: 4, label: 'Complexo empresarial', description: 'Estrutura de grande empresa.', capacity: 7000, rent: 8500, upgradeCost: 45000 },
];

export interface Scope {
  level: number;
  label: string;
  multiplier: number;
  cost: number;
  unlockLevel: number;
}

export const SCOPES: Scope[] = [
  { level: 0, label: 'Bairro', multiplier: 1, cost: 0, unlockLevel: 1 },
  { level: 1, label: 'Cidade', multiplier: 2.2, cost: 6000, unlockLevel: 3 },
  { level: 2, label: 'Estado', multiplier: 5, cost: 20000, unlockLevel: 4 },
  { level: 3, label: 'Brasil', multiplier: 12, cost: 60000, unlockLevel: 5 },
];

export const NEW_UNIT_COST = 15000;
export const NEW_UNIT_UNLOCK = 4;
export const NEW_UNIT_RENT = 1500;
export const PRODUCT_LAUNCH_UNLOCK = 2;
export const RD_COST = 1000;
export const MAX_PRODUCT_LINES = 5;
export const TOOLS_COST = 250;

export function productLaunchCost(currentLines: number): number {
  return 2500 * currentLines;
}

// ---------------------------------------------------------------------------
// Níveis e dificuldade
// ---------------------------------------------------------------------------

export interface LevelDef {
  level: number;
  title: string;
  requirements: { revenue: number; customers: number; reputation?: number; satisfaction?: number; employees?: number; expansions?: number };
  unlocks: string[];
}

export const LEVELS: LevelDef[] = [
  {
    level: 1,
    title: 'Empreendedor iniciante',
    requirements: { revenue: 0, customers: 0 },
    unlocks: ['Instagram, Facebook e WhatsApp Business', 'Contratar atendente e vendedor', 'Investir em qualidade (P&D)'],
  },
  {
    level: 2,
    title: 'Pequeno empresário',
    requirements: { revenue: 5000, customers: 50 },
    unlocks: ['TikTok e Google Ads', 'Profissional de marketing', 'Lançar novos produtos', 'Empréstimos maiores'],
  },
  {
    level: 3,
    title: 'Startup em crescimento',
    requirements: { revenue: 20000, customers: 200, reputation: 40 },
    unlocks: ['Marketing de influência e SEO', 'Desenvolvedor de produto', 'Expandir para a cidade'],
  },
  {
    level: 4,
    title: 'Empresa consolidada',
    requirements: { revenue: 45000, customers: 500, employees: 2 },
    unlocks: ['Gerente', 'Abrir novas unidades', 'Expandir para o estado'],
  },
  {
    level: 5,
    title: 'Líder de mercado',
    requirements: { revenue: 80000, customers: 1000, reputation: 60, satisfaction: 65 },
    unlocks: ['Expandir para todo o Brasil'],
  },
  {
    level: 6,
    title: 'Magnata dos negócios',
    requirements: { revenue: 200000, customers: 3000, expansions: 2 },
    unlocks: ['Status máximo: seu império está construído!'],
  },
];

export interface Difficulty {
  id: DifficultyId;
  label: string;
  description: string;
  demandMult: number;
  overdraftLimit: number;
  debtLimit: number;
  overdraftInterest: number;
  loanInterest: number;
  eventChance: number;
  badEventWeight: number;
  maxLoan: number;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'facil',
    label: 'Fácil',
    description: 'Mercado mais aquecido, mais crédito e menos crises. Ideal para aprender.',
    demandMult: 1.2,
    overdraftLimit: 8000,
    debtLimit: 30000,
    overdraftInterest: 0.03,
    loanInterest: 0.015,
    eventChance: 0.4,
    badEventWeight: 0.6,
    maxLoan: 20000,
  },
  {
    id: 'normal',
    label: 'Normal',
    description: 'O equilíbrio recomendado: decisões ruins custam caro.',
    demandMult: 1,
    overdraftLimit: 5000,
    debtLimit: 20000,
    overdraftInterest: 0.05,
    loanInterest: 0.025,
    eventChance: 0.5,
    badEventWeight: 1,
    maxLoan: 15000,
  },
  {
    id: 'dificil',
    label: 'Difícil',
    description: 'Clientes exigentes, pouco crédito e muitas crises. Para quem gosta de desafio.',
    demandMult: 0.85,
    overdraftLimit: 2000,
    debtLimit: 12000,
    overdraftInterest: 0.08,
    loanInterest: 0.035,
    eventChance: 0.6,
    badEventWeight: 1.4,
    maxLoan: 10000,
  },
];

export function getDifficulty(id: DifficultyId): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id)!;
}

// ---------------------------------------------------------------------------
// Opções da criação da empresa
// ---------------------------------------------------------------------------

export interface DesignPackage {
  id: DesignPackageId;
  label: string;
  cost: number;
  reputation: number;
  awareness: number;
  description: string;
}

export const DESIGN_PACKAGES: DesignPackage[] = [
  { id: 'proprio', label: 'Eu mesmo faço', cost: 0, reputation: 0, awareness: 0, description: 'Sem custo, mas a marca começa menos profissional.' },
  { id: 'freelancer', label: 'Designer freelancer', cost: 600, reputation: 6, awareness: 4, description: 'Identidade bem-feita por um preço acessível.' },
  { id: 'agencia', label: 'Agência de branding', cost: 1800, reputation: 12, awareness: 8, description: 'Marca forte e memorável desde o primeiro dia.' },
];

export interface StartStructure {
  id: StartStructureId;
  label: string;
  cost: number;
  infraLevel: number;
  description: string;
}

export const START_STRUCTURES: StartStructure[] = [
  { id: 'home', label: 'Home office', cost: 0, infraLevel: 0, description: 'Sem investimento. Capacidade para 220 vendas por mês.' },
  {
    id: 'compartilhado',
    label: 'Espaço compartilhado',
    cost: 2000,
    infraLevel: 1,
    description: 'Mais caro, mas atende até 550 vendas por mês.',
  },
];

export interface ProductTier {
  id: ProductTierId;
  label: string;
  cost: number;
  quality: number;
  description: string;
}

export const PRODUCT_TIERS: ProductTier[] = [
  { id: 'basico', label: 'Básico', cost: 500, quality: 45, description: 'Resolve o problema, sem muitos detalhes.' },
  { id: 'bom', label: 'Bom', cost: 1500, quality: 60, description: 'Bem-acabado e confiável.' },
  { id: 'premium', label: 'Premium', cost: 3000, quality: 75, description: 'Excelente desde o início, mas custa mais caro.' },
];

// ---------------------------------------------------------------------------
// Conceitos educativos
// ---------------------------------------------------------------------------

export const CONCEPTS: Record<ConceptId, { term: string; definition: string }> = {
  marketingDigital: {
    term: 'Marketing digital',
    definition: 'Usar canais on-line (redes sociais, buscadores, mensagens) para atrair, converter e fidelizar clientes.',
  },
  publicoAlvo: {
    term: 'Público-alvo',
    definition: 'O grupo de pessoas com mais chance de comprar de você. Cada canal fala com um público diferente.',
  },
  persona: {
    term: 'Persona',
    definition: 'Um personagem que representa o cliente ideal: idade, rotina, desejos e onde ele está na internet.',
  },
  branding: {
    term: 'Branding',
    definition: 'A construção da marca: como as pessoas reconhecem, lembram e confiam na empresa.',
  },
  cac: {
    term: 'CAC — Custo de Aquisição de Cliente',
    definition: 'Quanto você gastou em marketing para conquistar cada novo cliente (investimento ÷ novos clientes).',
  },
  roi: {
    term: 'ROI — Retorno sobre Investimento',
    definition: 'Quanto o investimento devolveu: (ganho − investimento) ÷ investimento. Positivo = valeu a pena.',
  },
  conversao: {
    term: 'Taxa de conversão',
    definition: 'Porcentagem das pessoas alcançadas que realizam a ação desejada, como comprar.',
  },
  fluxoCaixa: {
    term: 'Fluxo de caixa',
    definition: 'O controle do dinheiro que entra e sai. Sem caixa, até empresas lucrativas quebram.',
  },
  receita: {
    term: 'Receita',
    definition: 'Todo o dinheiro que entra com as vendas, antes de descontar os custos.',
  },
  lucro: {
    term: 'Lucro',
    definition: 'O que sobra da receita depois de pagar todos os custos e despesas.',
  },
  concorrencia: {
    term: 'Concorrência',
    definition: 'Outras empresas disputando os mesmos clientes. Mais concorrência exige diferenciação.',
  },
  posicionamento: {
    term: 'Posicionamento de mercado',
    definition: 'O lugar que a marca ocupa na mente do cliente: econômica, equilibrada ou premium.',
  },
};

export function priceRange(refPrice: number): { min: number; max: number } {
  return { min: Math.round(refPrice * 0.5), max: Math.round(refPrice * 2) };
}

export function positioning(priceIndex: number): { label: string; tone: 'econ' | 'equil' | 'premium' } {
  if (priceIndex < 0.85) return { label: 'Econômico', tone: 'econ' };
  if (priceIndex <= 1.2) return { label: 'Equilibrado', tone: 'equil' };
  return { label: 'Premium', tone: 'premium' };
}
