// Modelos de dados do projeto do aluno.
// Campos numéricos usam `null` para indicar "ainda não preenchido",
// diferenciando-se de um zero digitado intencionalmente.

export type SegmentId =
  | 'tecnologia'
  | 'alimentacao'
  | 'moda'
  | 'beleza'
  | 'educacao'
  | 'saude'
  | 'comercio'
  | 'servicos'
  | 'entretenimento'
  | 'outros';

export interface CompanyInfo {
  name: string;
  founder: string;
  segment: SegmentId | '';
  segmentOther: string;
  description: string;
  problem: string;
  offering: string;
  differential: string;
}

export type BrandStyleId =
  | 'moderno'
  | 'minimalista'
  | 'divertido'
  | 'elegante'
  | 'tecnologico'
  | 'natural'
  | 'ousado'
  | 'classico';

export interface BrandIdentity {
  primaryColor: string;
  secondaryColor: string;
  slogan: string;
  style: BrandStyleId | '';
  /** Chave do ícone do símbolo da marca, ou '' para usar as iniciais. */
  icon: string;
}

export type PurchasingPower = 'baixo' | 'medio' | 'alto' | 'muito-alto' | '';

export interface Audience {
  personaName: string;
  occupation: string;
  ageMin: number | null;
  ageMax: number | null;
  location: string;
  interests: string[];
  needs: string;
  painPoints: string;
  purchasingPower: PurchasingPower;
  onlinePlaces: string[];
}

export type ProductKind = 'produto' | 'servico';

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  description: string;
  price: number;
  category: string;
  benefits: string;
  differentials: string;
  createdAt: string;
}

export type ChannelId = 'instagram' | 'tiktok' | 'facebook' | 'google' | 'whatsapp' | 'site';

export interface CalendarEntry {
  id: string;
  /** Data no formato AAAA-MM-DD. */
  date: string;
  channel: ChannelId;
  format: string;
  title: string;
  notes: string;
}

export interface MarketingPlan {
  channels: ChannelId[];
  mainChannel: ChannelId | '';
  tactics: string[];
  promotion: string;
  contentPillars: string[];
  contentStrategy: string;
  frequency: string;
  /** Investimento mensal em anúncios (R$). */
  adBudget: number | null;
  goalType: string;
  goal: string;
  calendar: CalendarEntry[];
}

export type ArtStyleId = 'destaque' | 'promocao' | 'frase' | 'lancamento';

export interface Campaign {
  id: string;
  name: string;
  /** Produto divulgado; '' significa "a empresa em geral". */
  productId: string;
  platform: ChannelId;
  text: string;
  cta: string;
  artStyle: ArtStyleId;
  artTitle: string;
  createdAt: string;
  updatedAt: string;
}

export type CampaignDraft = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> & {
  /** Preenchido quando o rascunho é a edição de uma campanha já salva. */
  editingId: string | null;
};

export interface FinancePlan {
  initialInvestment: number | null;
  /** Custos fixos mensais (aluguel, internet, salários...). */
  monthlyCosts: number | null;
  /** Custo para produzir/entregar cada unidade vendida (opcional). */
  unitCost: number | null;
  price: number | null;
  /** Quantidade estimada de vendas por mês. */
  monthlySales: number | null;
  /** Receita mensal que o aluno espera alcançar (meta). */
  expectedRevenue: number | null;
  /** Somar o investimento mensal em anúncios (etapa de marketing) aos custos. */
  includeAds: boolean;
}

export interface Project {
  version: 1;
  company: CompanyInfo;
  brand: BrandIdentity;
  audience: Audience;
  products: Product[];
  marketing: MarketingPlan;
  campaigns: Campaign[];
  finance: FinancePlan;
  createdAt: string | null;
  updatedAt: string | null;
}

export type StepId =
  | 'empresa'
  | 'marca'
  | 'publico'
  | 'produtos'
  | 'marketing'
  | 'publicacoes'
  | 'financeiro';
