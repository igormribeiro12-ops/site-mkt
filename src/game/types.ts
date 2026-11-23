// Tipos centrais do CONSTRUA SEU IMPÉRIO.

export type SegmentId =
  | 'tecnologia'
  | 'alimentacao'
  | 'moda'
  | 'beleza'
  | 'educacao'
  | 'comercio'
  | 'servicos'
  | 'entretenimento'
  | 'barbearia'
  | 'assistencia'
  | 'petshop'
  | 'academia'
  | 'lanchonete';

export type DifficultyId = 'facil' | 'normal' | 'dificil' | 'lendario';

export type ChannelId = 'instagram' | 'tiktok' | 'google' | 'facebook' | 'whatsapp' | 'influencer' | 'seo';

export type ObjectiveId = 'awareness' | 'followers' | 'leads' | 'sales';

export type RoleId = 'atendente' | 'vendedor' | 'marketing' | 'desenvolvedor' | 'gerente' | 'financeiro' | 'logistica';

/** Fornecedor: troca custo de produção por qualidade. */
export type SupplierId = 'economico' | 'padrao' | 'premium';

/** Programa de fidelidade: 0 = nenhum, 1 = cartão fidelidade, 2 = clube VIP. */
export type LoyaltyLevel = 0 | 1 | 2;

/** Filial aberta em uma cidade (a sede não entra na lista). */
export interface Branch {
  id: string;
  city: string;
  /** Mês em que abriu: a filial leva alguns meses para atingir todo o potencial. */
  month: number;
}

export type GoalKind = 'clientes' | 'receita' | 'lucro' | 'satisfacao' | 'seguidores';

/** Desafio do mês: uma meta com recompensa. */
export interface MonthlyGoal {
  month: number;
  kind: GoalKind;
  target: number;
  reward: number;
}

export interface GoalResult extends MonthlyGoal {
  achieved: boolean;
  value: number;
}

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
  /** Programa de fidelidade e seguro. */
  services: number;
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
  /** Rendimento da aplicação financeira no mês (entra no resultado). */
  savingsIncome: number;
  campaigns: CampaignResult[];
  insights: Insight[];
  concept: ConceptId;
  achievements: string[];
  levelUp: number | null;
  /** Resultado do desafio do mês. */
  goal: GoalResult | null;
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

// --- Mundo 2D -----------------------------------------------------------------

export type HairStyle = 'curto' | 'longo' | 'cacheado' | 'coque' | 'moicano' | 'careca';
export type OutfitStyle = 'casual' | 'social' | 'criativo' | 'esportivo';
export type PersonalityId = 'criativo' | 'negociador' | 'organizado' | 'visionario';

export type Gender = 'masculino' | 'feminino';

export interface AvatarDesign {
  gender: Gender;
  /** Barba (personagem masculino). */
  beard?: boolean;
  /** Saia em vez de calça (personagem feminino). */
  skirt?: boolean;
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  shirt: string;
  pants: string;
  style: OutfitStyle;
  personality: PersonalityId;
}

/** Móvel posicionado no escritório (coordenadas em tiles do piso). */
export interface PlacedItem {
  id: string;
  type: string;
  x: number;
  y: number;
  starter?: boolean;
}

export interface WorkHours {
  desk: number;
  counter: number;
  production: number;
}

/** Resultado de um dia de operação (somado para formar o relatório do mês). */
export interface DayResult {
  revenue: number;
  unitsSold: number;
  orders: number;
  unmetOrders: number;
  newCustomers: number;
  newFromCampaigns: number;
  newFromOrganic: number;
  newFromLeads: number;
  returningOrders: number;
  reach: number;
  followersGained: number;
  capacity: number;
  costs: CostBreakdown;
  totalCosts: number;
  profit: number;
  serviceWeighted: number;
  campaigns: CampaignResult[];
}

export interface WorldState {
  furniture: PlacedItem[];
  /** Dia útil dentro do mês (1 a DAYS_PER_MONTH). */
  day: number;
  /** Minuto do dia (0 a 1439). */
  minute: number;
  wallColor: string;
  floorStyle: 'madeira' | 'piso' | 'concreto' | 'carpete';
  missionsDone: string[];
  workHours: WorkHours;
  monthAcc: DayResult | null;
  monthCashStart: number;
  /** Dia em que o personagem do evento pendente chega à empresa. */
  eventDay: number | null;
  competitorOpen: boolean;
  lastDay: { revenue: number; costs: number; customers: number } | null;
  /** Ações rápidas de marketing: dia (mês*100+dia) em que foram usadas pela última vez. */
  cooldowns: Record<string, number>;
}

export interface GameState {
  version: 1;
  seed: number;
  createdAt: string;
  updatedAt: string;
  player: { name: string; difficulty: DifficultyId };
  avatar: AvatarDesign;
  world: WorldState;
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
  /** 0 = bairro, 1 = cidade toda. */
  scopeLevel: number;
  /** Cidade da sede (id de geo.ts). */
  homeCity: string;
  branches: Branch[];
  supplier: SupplierId;
  loyalty: LoyaltyLevel;
  insurance: boolean;
  /** Dinheiro na aplicação financeira (rende todo mês e cobre o caixa negativo). */
  savings: number;
  goal: MonthlyGoal | null;
  goalsDone: number;
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
  avatar: AvatarDesign;
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
  homeCity: string;
}
