import { describe, expect, it } from 'vitest';
import { parseDecimal } from '../components/ui/Field';
import { makeCompleteProject } from '../test/fixtures';
import { createEmptyProject } from './defaults';
import { computeFinance, cumulativeProjection } from './finance';
import { buildAidaText } from './postText';
import { firstIncompleteStep, getOverallProgress, getStepCompletion, isStepComplete } from './progress';
import { generateSlogans } from './slogans';
import { normalizeProject, readProjectFile } from './storage';
import { validateAudience, validateCompany, validateFinance, validateProduct } from './validation';
import { describeColor, readableText } from './colors';

describe('cálculos financeiros', () => {
  it('calcula receita, custos, resultado, margem e indicadores', () => {
    const p = makeCompleteProject();
    const r = computeFinance(p.finance, p.marketing.adBudget)!;
    expect(r.revenue).toBe(3000);
    expect(r.variableCosts).toBe(1000);
    expect(r.adsCost).toBe(100);
    expect(r.totalCosts).toBe(1600);
    expect(r.result).toBe(1400);
    expect(r.margin).toBeCloseTo(46.67, 1);
    expect(r.breakEvenUnits).toBe(30);
    expect(r.paybackMonths).toBeCloseTo(0.714, 2);
    expect(r.goalGap).toBe(500);
  });

  it('não soma anúncios quando o aluno desmarca a opção', () => {
    const p = makeCompleteProject();
    const r = computeFinance({ ...p.finance, includeAds: false }, p.marketing.adBudget)!;
    expect(r.adsCost).toBe(0);
    expect(r.totalCosts).toBe(1500);
  });

  it('retorna null enquanto faltam dados essenciais', () => {
    expect(computeFinance(createEmptyProject().finance, null)).toBeNull();
  });

  it('trata prejuízo e preço abaixo do custo', () => {
    const r = computeFinance(
      { initialInvestment: 500, monthlyCosts: 1000, unitCost: 20, price: 15, monthlySales: 10, expectedRevenue: null, includeAds: false },
      null,
    )!;
    expect(r.result).toBe(150 - 1000 - 200);
    expect(r.breakEvenUnits).toBeNull();
    expect(r.paybackMonths).toBeNull();
    expect(r.goalGap).toBeNull();
  });

  it('não calcula margem sem receita', () => {
    const r = computeFinance(
      { initialInvestment: 0, monthlyCosts: 0, unitCost: null, price: 10, monthlySales: 0, expectedRevenue: 0, includeAds: true },
      0,
    )!;
    expect(r.margin).toBeNull();
    expect(r.paybackMonths).toBe(0);
  });

  it('projeta o saldo acumulado partindo do investimento', () => {
    const p = makeCompleteProject();
    const r = computeFinance(p.finance, p.marketing.adBudget)!;
    const proj = cumulativeProjection(p.finance, r);
    expect(proj).toHaveLength(12);
    expect(proj[0].balance).toBe(400);
    expect(proj[11].balance).toBe(-1000 + 1400 * 12);
  });
});

describe('progresso e validação', () => {
  it('projeto vazio começa em 0%', () => {
    const empty = createEmptyProject();
    expect(getOverallProgress(empty)).toBe(0);
    expect(firstIncompleteStep(empty)).toBe('empresa');
  });

  it('projeto completo chega a 100%', () => {
    const p = makeCompleteProject();
    expect(getOverallProgress(p)).toBe(100);
    expect(firstIncompleteStep(p)).toBeNull();
  });

  it('calcula progresso parcial de uma etapa', () => {
    const p = createEmptyProject();
    p.company.name = 'Teste';
    p.company.founder = 'Aluno';
    expect(getStepCompletion(p, 'empresa')).toBeCloseTo(2 / 7);
    expect(isStepComplete(p, 'empresa')).toBe(false);
  });

  it('exige descrever o segmento "Outros"', () => {
    const p = makeCompleteProject();
    expect(validateCompany({ ...p.company, segment: 'outros', segmentOther: '' }).segmentOther).toBeTruthy();
    expect(validateCompany({ ...p.company, segment: 'outros', segmentOther: 'Pets' })).toEqual({});
  });

  it('valida a faixa de idade do público', () => {
    const a = makeCompleteProject().audience;
    expect(validateAudience({ ...a, ageMin: 30, ageMax: 20 }).age).toMatch(/menor/);
    expect(validateAudience({ ...a, ageMin: null }).age).toBeTruthy();
  });

  it('valida produto e aceita preço zero (gratuito)', () => {
    const base = { kind: 'produto' as const, name: 'X', description: 'Descrição longa o suficiente', price: 0, category: 'Doce', benefits: 'Muito bom', differentials: 'Único no bairro' };
    expect(validateProduct(base)).toEqual({});
    expect(validateProduct({ ...base, price: null }).price).toBeTruthy();
    expect(validateProduct({ ...base, price: -1 }).price).toBeTruthy();
  });

  it('valida o financeiro (quantidade inteira, preço positivo)', () => {
    const f = makeCompleteProject().finance;
    expect(validateFinance(f)).toEqual({});
    expect(validateFinance({ ...f, price: 0 }).price).toBeTruthy();
    expect(validateFinance({ ...f, monthlySales: 2.5 }).monthlySales).toBeTruthy();
  });
});

describe('gerador de slogans', () => {
  it('gera sugestões únicas, completas e personalizadas', () => {
    const slogans = generateSlogans({ companyName: 'Doce Encanto', segment: 'alimentacao', style: 'divertido', interests: ['Música'] });
    expect(slogans).toHaveLength(6);
    expect(new Set(slogans).size).toBe(6);
    for (const s of slogans) {
      expect(s).not.toMatch(/undefined|null|\{|\}/);
      expect(s.length).toBeGreaterThan(5);
    }
    expect(slogans.some((s) => s.includes('Doce Encanto'))).toBe(true);
  });

  it('funciona sem nome e sem segmento', () => {
    const slogans = generateSlogans({ companyName: '', segment: '', style: '' });
    expect(slogans.length).toBeGreaterThan(0);
    slogans.forEach((s) => expect(s).not.toMatch(/undefined/));
  });

  it('é determinístico com a mesma fonte de aleatoriedade', () => {
    const seeded = () => {
      let x = 42;
      return () => ((x = (x * 16807) % 2147483647) / 2147483647);
    };
    const ctx = { companyName: 'Nexo', segment: 'tecnologia' as const, style: 'tecnologico' as const };
    expect(generateSlogans(ctx, 6, seeded())).toEqual(generateSlogans(ctx, 6, seeded()));
  });
});

describe('armazenamento', () => {
  it('normaliza dados incompletos ou inválidos', () => {
    const p = normalizeProject({ company: { name: 'Teste' }, products: [{ name: 'A', price: 'x' }], marketing: { channels: ['instagram', 'orkut'] } });
    expect(p.company.name).toBe('Teste');
    expect(p.company.founder).toBe('');
    expect(p.products[0].price).toBe(0);
    expect(p.marketing.channels).toEqual(['instagram']);
    expect(p.finance.includeAds).toBe(true);
  });

  it('preserva um projeto completo', () => {
    const p = makeCompleteProject();
    expect(normalizeProject(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it('restaura uma cópia de segurança e recusa arquivos inválidos', async () => {
    const p = makeCompleteProject();
    const ok = new File([JSON.stringify(p)], 'copia.json', { type: 'application/json' });
    expect((await readProjectFile(ok)).company.name).toBe('Doce Encanto');
    const bad = new File(['{"qualquer": true}'], 'outro.json');
    await expect(readProjectFile(bad)).rejects.toThrow(/não é um projeto válido/);
    const notJson = new File(['olá'], 'texto.json');
    await expect(readProjectFile(notJson)).rejects.toThrow(/não é um projeto válido/);
  });

  it('ignora lixo', () => {
    expect(normalizeProject(null)).toEqual(createEmptyProject());
    expect(normalizeProject('texto')).toEqual(createEmptyProject());
  });
});

describe('utilitários', () => {
  it('entende números no formato brasileiro', () => {
    expect(parseDecimal('1.234,56')).toBe(1234.56);
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('99.90')).toBe(99.9);
    expect(parseDecimal('1.500')).toBe(1500);
    expect(parseDecimal('R$ 30')).toBe(30);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
  });

  it('escolhe texto legível sobre a cor da marca', () => {
    expect(readableText('#111827')).toBe('#ffffff');
    expect(readableText('#fde68a')).toBe('#0f172a');
    expect(describeColor('#2563eb')?.name).toBe('Azul');
  });

  it('monta texto AIDA com os dados do aluno', () => {
    const p = makeCompleteProject();
    const text = buildAidaText({ company: p.company, product: p.products[0], cta: 'Compre agora', platform: 'instagram' });
    expect(text).toContain('Caixa de brigadeiros');
    expect(text).toContain('Compre agora');
    expect(text).toContain('#doceencanto');
    const google = buildAidaText({ company: p.company, product: p.products[0], cta: 'Compre agora', platform: 'google' });
    expect(google.length).toBeLessThanOrEqual(90);
  });
});
