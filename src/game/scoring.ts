import { getChannel } from './data';
import { clamp } from './format';
import { totalDebt } from './simulation';
import type { ChannelId, GameState } from './types';

export interface ScorePillar {
  id: 'financeiro' | 'marketing' | 'satisfacao' | 'crescimento' | 'inovacao';
  label: string;
  value: number;
  max: number;
  comment: string;
}

export interface FinalScore {
  total: number;
  pillars: ScorePillar[];
  rank: { title: string; description: string };
}

export function marketingTotals(s: GameState) {
  const byChannel = new Map<ChannelId, { spend: number; revenue: number; customers: number; contribution: number }>();
  for (const r of s.history) {
    for (const c of r.campaigns) {
      const cur = byChannel.get(c.channel) ?? { spend: 0, revenue: 0, customers: 0, contribution: 0 };
      cur.spend += c.budget;
      cur.revenue += c.revenue;
      cur.customers += c.customers;
      cur.contribution += c.contribution;
      byChannel.set(c.channel, cur);
    }
  }
  const rows = [...byChannel.entries()]
    .map(([channel, v]) => ({
      channel,
      label: getChannel(channel).label,
      ...v,
      roi: v.spend > 0 ? v.contribution / v.spend : 0,
      cac: v.customers >= 1 ? v.spend / v.customers : null,
    }))
    .sort((a, b) => b.spend - a.spend);
  const spend = rows.reduce((sum, r) => sum + r.spend, 0);
  const contribution = rows.reduce((sum, r) => sum + r.contribution, 0);
  const customers = rows.reduce((sum, r) => sum + r.customers, 0);
  return { rows, spend, roi: spend > 0 ? contribution / spend : 0, cac: customers >= 1 ? spend / customers : null };
}

export function computeScore(s: GameState): FinalScore {
  const h = s.history;
  const recent = h.slice(-6);
  const revenue = recent.reduce((sum, r) => sum + r.revenue, 0);
  const profit = recent.reduce((sum, r) => sum + r.profit, 0);
  const margin = revenue > 0 ? profit / revenue : -0.2;
  const debt = totalDebt(s);

  const finance = Math.round(
    80 * clamp((s.cash - debt + 10000) / 50000, 0, 1) + 80 * clamp((margin + 0.1) / 0.4, 0, 1) + 40 * (debt === 0 ? 1 : clamp(1 - debt / 20000, 0, 1)),
  );

  const mkt = marketingTotals(s);
  const marketing = mkt.spend > 0 ? Math.round(200 * clamp((mkt.roi + 0.5) / 2.5, 0, 1)) : 30;

  const avgSat = h.length ? h.reduce((sum, r) => sum + r.satisfaction, 0) / h.length : s.satisfaction;
  const satisfaction = Math.round(200 * clamp(avgSat / 100, 0, 1));

  const growth = Math.round(
    200 * clamp((s.level / 6) * 0.5 + (s.customersTotal / 3000) * 0.25 + (s.totalRevenue / 200000) * 0.25, 0, 1),
  );

  const innovation = Math.round(
    200 *
      clamp(
        (0.4 * s.quality) / 100 + (0.3 * Math.min(s.productLines - 1, 3)) / 3 + (0.3 * Math.min(s.rdInvestments + s.employees.desenvolvedor * 2, 5)) / 5,
        0,
        1,
      ),
  );

  const pillars: ScorePillar[] = [
    {
      id: 'financeiro',
      label: 'Saúde financeira',
      value: finance,
      max: 200,
      comment: margin > 0.15 ? 'Margens saudáveis e caixa sob controle.' : margin > 0 ? 'Lucro apertado: cuide dos custos.' : 'Os custos superaram as receitas.',
    },
    {
      id: 'marketing',
      label: 'Eficiência do marketing',
      value: marketing,
      max: 200,
      comment: mkt.spend === 0 ? 'Quase não houve investimento em marketing.' : mkt.roi > 0.5 ? 'Campanhas com ótimo retorno.' : mkt.roi > 0 ? 'Campanhas se pagaram.' : 'Campanhas custaram mais do que trouxeram.',
    },
    {
      id: 'satisfacao',
      label: 'Satisfação dos clientes',
      value: satisfaction,
      max: 200,
      comment: avgSat >= 75 ? 'Clientes encantados.' : avgSat >= 60 ? 'Clientes satisfeitos.' : 'Clientes insatisfeitos: atenção ao produto e ao atendimento.',
    },
    {
      id: 'crescimento',
      label: 'Crescimento',
      value: growth,
      max: 200,
      comment: `Nível ${s.level} com ${Math.round(s.customersTotal)} clientes conquistados.`,
    },
    {
      id: 'inovacao',
      label: 'Capacidade de inovação',
      value: innovation,
      max: 200,
      comment: s.productLines > 1 || s.rdInvestments > 2 ? 'Produto em evolução constante.' : 'Pouco investimento em inovação.',
    },
  ];

  const total = pillars.reduce((sum, p) => sum + p.value, 0);
  return { total, pillars, rank: rankFor(total) };
}

export function rankFor(total: number): { title: string; description: string } {
  if (total >= 850) return { title: 'Magnata visionário', description: 'Decisões excelentes em todas as áreas do negócio.' };
  if (total >= 700) return { title: 'Empreendedor estrategista', description: 'Equilibrou crescimento, marketing e finanças com maestria.' };
  if (total >= 550) return { title: 'Gestor em ascensão', description: 'Bons resultados, com espaço para otimizar algumas áreas.' };
  if (total >= 400) return { title: 'Empreendedor aprendiz', description: 'Aprendeu com os erros e acertos. A próxima empresa vai mais longe!' };
  return { title: 'Recomeço com aprendizado', description: 'O negócio não decolou, mas toda falha ensina. Tente outra estratégia.' };
}
