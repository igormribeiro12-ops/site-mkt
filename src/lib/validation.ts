import type {
  Audience,
  BrandIdentity,
  CalendarEntry,
  Campaign,
  CampaignDraft,
  CompanyInfo,
  FinancePlan,
  MarketingPlan,
  Product,
} from '../types';

export type Errors = Record<string, string>;

function requireText(errors: Errors, key: string, value: string, message: string, min = 0) {
  const trimmed = value.trim();
  if (!trimmed) errors[key] = message;
  else if (min > 0 && trimmed.length < min)
    errors[key] = `Escreva um pouco mais (pelo menos ${min} caracteres).`;
}

export function validateCompany(c: CompanyInfo): Errors {
  const e: Errors = {};
  requireText(e, 'name', c.name, 'Dê um nome para a sua empresa.');
  if (c.name.trim().length > 60) e.name = 'Use no máximo 60 caracteres.';
  requireText(e, 'founder', c.founder, 'Informe o nome do fundador ou fundadora.');
  if (!c.segment) e.segment = 'Escolha o segmento de atuação.';
  else if (c.segment === 'outros' && !c.segmentOther.trim())
    e.segmentOther = 'Conte qual é o segmento da sua empresa.';
  requireText(e, 'description', c.description, 'Descreva a sua empresa.', 15);
  requireText(e, 'problem', c.problem, 'Qual problema a empresa resolve?', 10);
  requireText(e, 'offering', c.offering, 'Conte qual produto ou serviço a empresa oferece.', 5);
  requireText(e, 'differential', c.differential, 'Qual é o diferencial da sua empresa?', 10);
  return e;
}

export function validateBrand(b: BrandIdentity): Errors {
  const e: Errors = {};
  if (!b.primaryColor) e.primaryColor = 'Escolha a cor principal da marca.';
  if (!b.secondaryColor) e.secondaryColor = 'Escolha a cor secundária da marca.';
  if (!b.style) e.style = 'Escolha o estilo da marca.';
  requireText(e, 'slogan', b.slogan, 'Defina um slogan (você pode usar o gerador de ideias).', 3);
  if (b.slogan.trim().length > 80) e.slogan = 'Slogans curtos são mais fáceis de lembrar: use até 80 caracteres.';
  return e;
}

export function validateAudience(a: Audience): Errors {
  const e: Errors = {};
  if (a.ageMin === null || a.ageMax === null) e.age = 'Informe a faixa de idade (de... até...).';
  else if (a.ageMin < 1 || a.ageMax > 120) e.age = 'Use idades entre 1 e 120 anos.';
  else if (a.ageMin > a.ageMax) e.age = 'A idade inicial deve ser menor que a final.';
  requireText(e, 'location', a.location, 'Onde o seu público mora?');
  if (a.interests.length === 0) e.interests = 'Adicione pelo menos um interesse.';
  requireText(e, 'needs', a.needs, 'Do que esse público precisa?', 10);
  requireText(e, 'painPoints', a.painPoints, 'Quais problemas esse público enfrenta?', 10);
  if (!a.purchasingPower) e.purchasingPower = 'Escolha o poder de compra estimado.';
  if (a.onlinePlaces.length === 0) e.onlinePlaces = 'Marque pelo menos um lugar onde o público está.';
  return e;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'price'> & { price: number | null };

export function validateProduct(p: ProductInput): Errors {
  const e: Errors = {};
  requireText(e, 'name', p.name, 'Dê um nome ao produto ou serviço.');
  requireText(e, 'description', p.description, 'Descreva o que é.', 10);
  if (p.price === null) e.price = 'Informe o preço.';
  else if (p.price < 0) e.price = 'O preço não pode ser negativo.';
  requireText(e, 'category', p.category, 'Escolha ou escreva uma categoria.');
  requireText(e, 'benefits', p.benefits, 'Quais benefícios o cliente ganha?', 5);
  requireText(e, 'differentials', p.differentials, 'O que torna este item especial?', 5);
  return e;
}

export function validateProductsStep(products: Product[]): Errors {
  return products.length === 0 ? { products: 'Cadastre pelo menos um produto ou serviço.' } : {};
}

export function validateMarketing(m: MarketingPlan): Errors {
  const e: Errors = {};
  if (m.channels.length === 0) e.channels = 'Escolha pelo menos uma rede ou canal.';
  requireText(e, 'promotion', m.promotion, 'Explique como você vai divulgar a empresa.', 10);
  requireText(e, 'contentStrategy', m.contentStrategy, 'Descreva sua estratégia de conteúdo.', 10);
  if (!m.frequency) e.frequency = 'Escolha a frequência de publicação.';
  if (m.adBudget === null) e.adBudget = 'Informe o valor mensal (coloque 0 se não for investir).';
  else if (m.adBudget < 0) e.adBudget = 'O valor não pode ser negativo.';
  requireText(e, 'goal', m.goal, 'Qual resultado você quer alcançar?', 10);
  if (m.calendar.length === 0) e.calendar = 'Planeje pelo menos uma publicação no calendário.';
  return e;
}

export function validateCalendarEntry(entry: Omit<CalendarEntry, 'id'>): Errors {
  const e: Errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) e.date = 'Escolha a data.';
  requireText(e, 'title', entry.title, 'Sobre o que será a publicação?');
  if (!entry.format) e.format = 'Escolha o formato.';
  return e;
}

export function validateCampaign(d: CampaignDraft): Errors {
  const e: Errors = {};
  requireText(e, 'name', d.name, 'Dê um nome para a campanha.');
  requireText(e, 'text', d.text, 'Escreva o texto da publicação.', 10);
  requireText(e, 'cta', d.cta, 'Escolha ou escreva uma chamada para ação.');
  return e;
}

export function validateCampaignsStep(campaigns: Campaign[]): Errors {
  return campaigns.length === 0 ? { campaigns: 'Salve pelo menos uma campanha.' } : {};
}

export function validateFinance(f: FinancePlan): Errors {
  const e: Errors = {};
  const nonNegative = (key: keyof FinancePlan, value: number | null, message: string) => {
    if (value === null) e[key] = message;
    else if (value < 0) e[key] = 'O valor não pode ser negativo.';
  };
  nonNegative('initialInvestment', f.initialInvestment, 'Informe o investimento inicial (pode ser 0).');
  nonNegative('monthlyCosts', f.monthlyCosts, 'Informe os custos mensais (pode ser 0).');
  if (f.price === null) e.price = 'Informe o preço de venda.';
  else if (f.price <= 0) e.price = 'O preço precisa ser maior que zero.';
  if (f.monthlySales === null) e.monthlySales = 'Quantas vendas você estima por mês?';
  else if (f.monthlySales < 0 || !Number.isInteger(f.monthlySales))
    e.monthlySales = 'Use um número inteiro (ex.: 50).';
  nonNegative('expectedRevenue', f.expectedRevenue, 'Quanto você espera faturar por mês?');
  if (f.unitCost !== null && f.unitCost < 0) e.unitCost = 'O valor não pode ser negativo.';
  return e;
}

export function hasErrors(errors: Errors): boolean {
  return Object.keys(errors).length > 0;
}
