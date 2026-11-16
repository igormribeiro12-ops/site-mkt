import type {
  Audience,
  BrandIdentity,
  CampaignDraft,
  CompanyInfo,
  FinancePlan,
  MarketingPlan,
  Project,
} from '../types';

// Todos os valores iniciais são vazios: nada aparece como se o aluno
// já tivesse preenchido.

export const emptyCompany = (): CompanyInfo => ({
  name: '',
  founder: '',
  segment: '',
  segmentOther: '',
  description: '',
  problem: '',
  offering: '',
  differential: '',
});

export const emptyBrand = (): BrandIdentity => ({
  primaryColor: '',
  secondaryColor: '',
  slogan: '',
  style: '',
  icon: '',
});

export const emptyAudience = (): Audience => ({
  personaName: '',
  occupation: '',
  ageMin: null,
  ageMax: null,
  location: '',
  interests: [],
  needs: '',
  painPoints: '',
  purchasingPower: '',
  onlinePlaces: [],
});

export const emptyMarketing = (): MarketingPlan => ({
  channels: [],
  mainChannel: '',
  tactics: [],
  promotion: '',
  contentPillars: [],
  contentStrategy: '',
  frequency: '',
  adBudget: null,
  goalType: '',
  goal: '',
  calendar: [],
});

export const emptyFinance = (): FinancePlan => ({
  initialInvestment: null,
  monthlyCosts: null,
  unitCost: null,
  price: null,
  monthlySales: null,
  expectedRevenue: null,
  includeAds: true,
});

export const emptyCampaignDraft = (): CampaignDraft => ({
  editingId: null,
  name: '',
  productId: '',
  platform: 'instagram',
  text: '',
  cta: '',
  artStyle: 'destaque',
  artTitle: '',
});

export const createEmptyProject = (): Project => ({
  version: 1,
  company: emptyCompany(),
  brand: emptyBrand(),
  audience: emptyAudience(),
  products: [],
  marketing: emptyMarketing(),
  campaigns: [],
  finance: emptyFinance(),
  createdAt: null,
  updatedAt: null,
});
