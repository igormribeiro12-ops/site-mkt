// Tipos centrais do STARTUP TYCOON.

export type SegmentId =
  | 'tecnologia'
  | 'alimentacao'
  | 'moda'
  | 'beleza'
  | 'educacao'
  | 'comercio'
  | 'servicos'
  | 'entretenimento';

export type DifficultyId = 'facil' | 'normal' | 'dificil';

export type ChannelId = 'instagram' | 'tiktok' | 'google' | 'facebook' | 'whatsapp' | 'influencer' | 'seo';

export type ObjectiveId = 'awareness' | 'followers' | 'leads' | 'sales';

export type RoleId = 'atendente' | 'vendedor' | 'marketing' | 'desenvolvedor' | 'gerente';

export type LogoShape = 'circle' | 'rounded' | 'square' | 'hexagon' | 'diamond';
export type LogoFont = 'grotesk' | 'jakarta' | 'fredoka' | 'serif';
export type LogoLayout = 'horizontal' | 'stacked' | 'badge';

export interface LogoDesign {
  primary: string;
  secondary: string;
  icon: string;
  shape: LogoShape;
  font: LogoFont;
  layout: LogoLayout;
}

export type DesignPackageId = 'proprio' | 'freelancer' | 'agencia';
export type StartStructureId = 'home' | 'compartilhado';
export type ProductTierId = 'basico' | 'bom' | 'premium';

export interface CompanyProfile {
  name: string;
  slogan: string;
  description: string;
  product: string;
  differential: string;
  segment: SegmentId;
  logo: LogoDesign;
}

/** Campanha recorrente: é cobrada e executada a cada mês enquanto estiver ativa. */
export interface Campaign {
  id: string;
  channel: ChannelId;
  objective: ObjectiveId;
  budget: number;
  active: boolean;
  createdMonth: number;
}

export type ModifierKind =
  | 'demand'
  | 'unitCost'
  | 'fixedCost'
  | 'capacity'
  | 'socialReach'
  | 'conversion'
  | 'competition'
  | 'price';

/** Efeito temporário causado por um evento (ex.: demanda -15% por 3 meses). */
export interface Modifier {
  id: string;
  kind: ModifierKind;
  /** Variação relativa: 0.2 = +20%, -0.15 = -15%. */
  value: number;
  monthsLeft: number;
  label: string;
}

export interface Loan {
  principal: number;
  balance: number;
  monthlyPayment: number;
  monthsLeft: number;
}

export interface CampaignResult {
  campaignId: string;
  channel: ChannelId;
  objective: ObjectiveId;
  budget: number;
  reach: number;
  followers: number;
  leads: number;
  customers: number;
  revenue: number;
  /** Receita - custo variável - investimento. */
  contribution: number;
  cac: number | null;
  roi: number;
}

export interface CostBreakdown {
  variable: number;
  salaries: number;
  rent: number;
  tools: number;
  marketing: number;
  taxes: number;
  interest: number;
  loan: number;
}

export type ConceptId =
  | 'marketingDigital'
  | 'publicoAlvo'
  | 'persona'
  | 'branding'
  | 'cac'
  | 'roi'
  | 'conversao'
  | 'fluxoCaixa'
  | 'receita'
  | 'lucro'
  | 'concorrencia'
  | 'posicionamento';

export interface Insight {
  tone: 'good' | 'bad' | 'neutral';
  text: string;
  concept: ConceptId;
}

export interface MonthReport {
  month: number;
  marketSize: number;
  offerScore: number;
  reach: number;
  newCustomers: number;
  newFromCampaigns: number;
  newFromOrganic: number;
  newFromLeads: number;
  returningOrders: number;
  orders: number;
  unitsSold: number;
  unmetOrders: number;
  capacity: number;
  revenue: number;
  ticket: number;
  conversionRate: number;
  activeCustomers: number;
  customersTotal: number;
  satisfaction: number;
  reputation: number;
  awareness: number;
  followers: number;
  followersGained: number;
  leads: number;
  serviceRatio: number;
  costs: CostBreakdown;
  totalCosts: number;
  profit: number;
  cashStart: number;
  cashEnd: number;
  debt: number;
  marketShare: number;
  campaigns: CampaignResult[];
  insights: Insight[];
  concept: ConceptId;
  achievements: string[];
  levelUp: number | null;
}

export interface DecisionLog {
  month: number;
  text: string;
  kind: 'setup' | 'marketing' | 'team' | 'expansion' | 'product' | 'finance' | 'event';
}

export interface PendingEvent {
  eventId: string;
  month: number;
}

export interface EventOutcome {
  eventId: string;
  title: string;
  choiceLabel: string;
  text: string;
  month: number;
}

export type GamePhase = 'playing' | 'won' | 'lost' | 'ended';

export interface GameState {
  version: 1;
  seed: number;
  createdAt: string;
  updatedAt: string;
  player: { name: string; difficulty: DifficultyId };
  company: CompanyProfile;
  phase: GamePhase;
  /** Depois de vencer, o jogador pode continuar no modo livre. */
  freePlay: boolean;
  endReason: string | null;
  month: number;
  cash: number;
  loans: Loan[];
  price: number;
  quality: number;
  rdInvestments: number;
  productLines: number;
  infraLevel: number;
  units: number;
  scopeLevel: number;
  employees: Record<RoleId, number>;
  salaryBonus: number;
  satisfaction: number;
  reputation: number;
  awareness: number;
  followers: number;
  leads: number;
  activeCustomers: number;
  customersTotal: number;
  seoScore: number;
  campaigns: Campaign[];
  modifiers: Modifier[];
  investorShare: number;
  level: number;
  achievements: Record<string, number>;
  history: MonthReport[];
  totalRevenue: number;
  totalExpenses: number;
  totalMarketing: number;
  profitStreak: number;
  negativeMonths: number;
  pendingEvent: PendingEvent | null;
  lastEventOutcome: EventOutcome | null;
  recentEvents: { id: string; month: number }[];
  decisions: DecisionLog[];
  tutorialDone: boolean;
  /** Relatório do mês que acabou de ser simulado, ainda não visto pelo jogador. */
  unseenReport: boolean;
}

export interface SetupDraft {
  step: number;
  playerName: string;
  difficulty: DifficultyId;
  segment: SegmentId | '';
  name: string;
  slogan: string;
  description: string;
  product: string;
  differential: string;
  logo: LogoDesign;
  designPackage: DesignPackageId;
  structure: StartStructureId;
  productTier: ProductTierId;
  price: number | null;
}
