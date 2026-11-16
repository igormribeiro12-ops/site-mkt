import type {
  CalendarEntry,
  Campaign,
  CampaignDraft,
  ChannelId,
  Product,
  Project,
} from '../types';
import {
  createEmptyProject,
  emptyAudience,
  emptyBrand,
  emptyCampaignDraft,
  emptyCompany,
  emptyFinance,
  emptyMarketing,
} from './defaults';

export const STORAGE_KEY = 'startup-lab:projeto:v1';
export const DRAFT_KEY = 'startup-lab:rascunho-publicacao:v1';

const CHANNEL_IDS: ChannelId[] = ['instagram', 'tiktok', 'facebook', 'google', 'whatsapp', 'site'];

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function channel(value: unknown): ChannelId | '' {
  return CHANNEL_IDS.includes(value as ChannelId) ? (value as ChannelId) : '';
}

/** Mescla dados de uma fonte qualquer (localStorage, arquivo importado) com
 *  a estrutura padrão, descartando campos inválidos. */
export function normalizeProject(raw: unknown): Project {
  const base = createEmptyProject();
  if (!isRecord(raw)) return base;

  const company = isRecord(raw.company) ? raw.company : {};
  const brand = isRecord(raw.brand) ? raw.brand : {};
  const audience = isRecord(raw.audience) ? raw.audience : {};
  const marketing = isRecord(raw.marketing) ? raw.marketing : {};
  const finance = isRecord(raw.finance) ? raw.finance : {};

  const emptyC = emptyCompany();
  const emptyB = emptyBrand();
  const emptyA = emptyAudience();
  const emptyM = emptyMarketing();
  const emptyF = emptyFinance();

  const products: Product[] = Array.isArray(raw.products)
    ? raw.products.filter(isRecord).map((p) => ({
        id: str(p.id) || `prod_${Math.random().toString(36).slice(2, 10)}`,
        kind: p.kind === 'servico' ? 'servico' : 'produto',
        name: str(p.name),
        description: str(p.description),
        price: num(p.price) ?? 0,
        category: str(p.category),
        benefits: str(p.benefits),
        differentials: str(p.differentials),
        createdAt: str(p.createdAt, new Date().toISOString()),
      }))
    : [];

  const calendar: CalendarEntry[] = Array.isArray(marketing.calendar)
    ? marketing.calendar
        .filter(isRecord)
        .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(str(e.date)))
        .map((e) => ({
          id: str(e.id) || `cal_${Math.random().toString(36).slice(2, 10)}`,
          date: str(e.date),
          channel: channel(e.channel) || 'instagram',
          format: str(e.format),
          title: str(e.title),
          notes: str(e.notes),
        }))
    : [];

  const campaigns: Campaign[] = Array.isArray(raw.campaigns)
    ? raw.campaigns.filter(isRecord).map((c) => ({
        id: str(c.id) || `camp_${Math.random().toString(36).slice(2, 10)}`,
        name: str(c.name),
        productId: str(c.productId),
        platform: channel(c.platform) || 'instagram',
        text: str(c.text),
        cta: str(c.cta),
        artStyle: (['destaque', 'promocao', 'frase', 'lancamento'] as const).includes(
          c.artStyle as Campaign['artStyle'],
        )
          ? (c.artStyle as Campaign['artStyle'])
          : 'destaque',
        artTitle: str(c.artTitle),
        createdAt: str(c.createdAt, new Date().toISOString()),
        updatedAt: str(c.updatedAt, new Date().toISOString()),
      }))
    : [];

  return {
    version: 1,
    company: {
      name: str(company.name, emptyC.name),
      founder: str(company.founder),
      segment: (str(company.segment) as Project['company']['segment']) || '',
      segmentOther: str(company.segmentOther),
      description: str(company.description),
      problem: str(company.problem),
      offering: str(company.offering),
      differential: str(company.differential),
    },
    brand: {
      primaryColor: str(brand.primaryColor, emptyB.primaryColor),
      secondaryColor: str(brand.secondaryColor, emptyB.secondaryColor),
      slogan: str(brand.slogan),
      style: (str(brand.style) as Project['brand']['style']) || '',
      icon: str(brand.icon),
    },
    audience: {
      personaName: str(audience.personaName),
      occupation: str(audience.occupation),
      ageMin: num(audience.ageMin) ?? emptyA.ageMin,
      ageMax: num(audience.ageMax) ?? emptyA.ageMax,
      location: str(audience.location),
      interests: strArray(audience.interests),
      needs: str(audience.needs),
      painPoints: str(audience.painPoints),
      purchasingPower: (str(audience.purchasingPower) as Project['audience']['purchasingPower']) || '',
      onlinePlaces: strArray(audience.onlinePlaces),
    },
    products,
    marketing: {
      channels: strArray(marketing.channels).filter((c): c is ChannelId =>
        CHANNEL_IDS.includes(c as ChannelId),
      ),
      mainChannel: channel(marketing.mainChannel),
      tactics: strArray(marketing.tactics),
      promotion: str(marketing.promotion),
      contentPillars: strArray(marketing.contentPillars),
      contentStrategy: str(marketing.contentStrategy),
      frequency: str(marketing.frequency),
      adBudget: num(marketing.adBudget) ?? emptyM.adBudget,
      goalType: str(marketing.goalType),
      goal: str(marketing.goal),
      calendar,
    },
    campaigns,
    finance: {
      initialInvestment: num(finance.initialInvestment),
      monthlyCosts: num(finance.monthlyCosts),
      unitCost: num(finance.unitCost),
      price: num(finance.price),
      monthlySales: num(finance.monthlySales),
      expectedRevenue: num(finance.expectedRevenue),
      includeAds: typeof finance.includeAds === 'boolean' ? finance.includeAds : emptyF.includeAds,
    },
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

export function loadProject(): Project | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeProject(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Grava o projeto. Retorna false se o navegador bloquear o armazenamento. */
export function saveProject(project: Project): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

export function clearProject(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignorado: sem acesso ao armazenamento não há o que limpar
  }
}

export function loadCampaignDraft(): CampaignDraft {
  const base = emptyCampaignDraft();
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return base;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return base;
    return {
      editingId: typeof parsed.editingId === 'string' ? parsed.editingId : null,
      name: str(parsed.name),
      productId: str(parsed.productId),
      platform: channel(parsed.platform) || base.platform,
      text: str(parsed.text),
      cta: str(parsed.cta),
      artStyle: (['destaque', 'promocao', 'frase', 'lancamento'] as const).includes(
        parsed.artStyle as CampaignDraft['artStyle'],
      )
        ? (parsed.artStyle as CampaignDraft['artStyle'])
        : base.artStyle,
      artTitle: str(parsed.artTitle),
    };
  } catch {
    return base;
  }
}

export function saveCampaignDraft(draft: CampaignDraft): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignorado: o rascunho é apenas uma conveniência
  }
}

export function isStorageAvailable(): boolean {
  try {
    const key = '__startup_lab_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Gera o download de um arquivo .json com o projeto (cópia de segurança). */
export function downloadProjectFile(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const slug =
    project.company.name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'minha-empresa';
  const a = document.createElement('a');
  a.href = url;
  a.download = `startup-lab-${slug}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lê um arquivo exportado anteriormente. Lança erro se não for um projeto válido. */
export async function readProjectFile(file: File): Promise<Project> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não é um projeto válido do Startup Lab.');
  }
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.company)) {
    throw new Error('O arquivo não é um projeto válido do Startup Lab.');
  }
  const project = normalizeProject(parsed);
  return { ...project, createdAt: project.createdAt ?? new Date().toISOString() };
}
