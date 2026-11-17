// Explicações educativas curtas, montadas com os números reais do mês.

import { CHANNELS, getChannel, getObjective, getSegment } from './data';
import { money, num, pct } from './format';
import type { ConceptId, GameState, Insight, MonthReport } from './types';

type BaseReport = Omit<MonthReport, 'insights' | 'concept' | 'achievements' | 'levelUp'>;

export function buildInsights(prev: GameState, r: BaseReport): { insights: Insight[]; concept: ConceptId } {
  const seg = getSegment(prev.company.segment);
  const items: (Insight & { priority: number })[] = [];

  // 1. Campanhas: CAC e ROI
  const campaigns = [...r.campaigns].sort((a, b) => b.budget - a.budget);
  const best = [...r.campaigns].sort((a, b) => b.roi - a.roi)[0];
  const worst = [...r.campaigns].sort((a, b) => a.roi - b.roi)[0];
  if (campaigns.length > 0 && best) {
    const ch = getChannel(best.channel).label;
    const customers = Math.round(best.customers);
    if (best.roi > 0 && customers > 0) {
      items.push({
        tone: 'good',
        concept: 'cac',
        priority: 10,
        text: `Você investiu ${money(best.budget)} em ${ch} (${getObjective(best.objective).short.toLowerCase()}) e conquistou ${num(customers)} novos clientes. CAC de ${money(best.cac ?? 0, true)}: como o lucro de cada venda é maior que esse custo, a campanha se pagou, com ROI de ${pct(best.roi, 0)}.`,
      });
    } else if (customers > 0) {
      items.push({
        tone: 'neutral',
        concept: 'roi',
        priority: 8,
        text: `${ch} trouxe ${num(customers)} clientes com ${money(best.budget)} investidos (CAC de ${money(best.cac ?? 0, true)}). O ROI ficou em ${pct(best.roi, 0)}: o investimento ainda não voltou só com as vendas do mês, mas clientes que compram de novo podem compensar depois.`,
      });
    }
    if (worst && worst !== best && worst.roi < -0.5) {
      const wch = getChannel(worst.channel);
      const affinity = seg.affinity[worst.channel];
      items.push({
        tone: 'bad',
        concept: affinity < 1 ? 'publicoAlvo' : 'roi',
        priority: 9,
        text:
          affinity < 1
            ? `A campanha em ${wch.label} teve ROI de ${pct(worst.roi, 0)}. O público de ${seg.label.toLowerCase()} usa pouco esse canal: conhecer o público-alvo ajuda a escolher onde anunciar.`
            : `A campanha em ${wch.label} teve ROI de ${pct(worst.roi, 0)}. Teste outro objetivo, ajuste o valor investido ou melhore a oferta (preço, qualidade e reputação).`,
      });
    }
    const awarenessOnly = r.campaigns.filter((c) => c.objective === 'awareness' || c.objective === 'followers');
    if (awarenessOnly.length === r.campaigns.length && r.campaigns.length > 0) {
      items.push({
        tone: 'neutral',
        concept: 'branding',
        priority: 6,
        text: 'Suas campanhas focaram em reconhecimento e seguidores. Elas vendem pouco agora, mas constroem a marca e geram vendas orgânicas nos próximos meses.',
      });
    }
  } else if (prev.month >= 2) {
    items.push({
      tone: 'bad',
      concept: 'marketingDigital',
      priority: 7,
      text: 'Você não fez nenhuma campanha neste mês. Sem divulgação, poucas pessoas descobrem a empresa e as vendas dependem só de quem já conhece você.',
    });
  }

  // 2. Capacidade
  if (r.unmetOrders >= 5) {
    items.push({
      tone: 'bad',
      concept: 'fluxoCaixa',
      priority: 11,
      text: `${num(r.unmetOrders)} pedidos não foram atendidos por falta de capacidade (limite de ${num(r.capacity)} vendas). Isso é receita perdida e cliente insatisfeito: melhore a infraestrutura ou abra uma nova unidade.`,
    });
  }

  // 3. Lucro x receita x caixa
  if (r.revenue > 0 && r.profit < 0) {
    items.push({
      tone: 'bad',
      concept: 'lucro',
      priority: 9,
      text: `Receita de ${money(r.revenue)}, mas prejuízo de ${money(Math.abs(r.profit))}: os custos somaram ${money(r.totalCosts)}. Receita não é lucro; o que importa é o que sobra depois de pagar tudo.`,
    });
  } else if (r.profit > 0) {
    items.push({
      tone: 'good',
      concept: 'lucro',
      priority: 5,
      text: `Lucro de ${money(r.profit)} (margem de ${pct(r.revenue > 0 ? r.profit / r.revenue : 0, 0)}). Reinvestir parte do lucro em marketing e capacidade acelera o crescimento.`,
    });
  }
  if (r.cashEnd < 0) {
    items.push({
      tone: 'bad',
      concept: 'fluxoCaixa',
      priority: 12,
      text: `O caixa terminou negativo (${money(r.cashEnd)}): você está usando o cheque especial, que cobra juros altos. Fluxo de caixa é o oxigênio da empresa; corte gastos ou aumente as vendas.`,
    });
  }

  // 4. Preço e posicionamento
  const priceIndex = prev.price / seg.refPrice;
  if (priceIndex > 1.3) {
    items.push({
      tone: 'neutral',
      concept: 'posicionamento',
      priority: 4,
      text: `Seu preço está ${pct(priceIndex - 1, 0)} acima da média do mercado. Posicionamento premium exige qualidade e reputação altas para convencer o cliente.`,
    });
  } else if (priceIndex < 0.8) {
    items.push({
      tone: 'neutral',
      concept: 'posicionamento',
      priority: 4,
      text: `Seu preço está ${pct(1 - priceIndex, 0)} abaixo da média. Preço baixo atrai clientes, mas reduz a margem e pode passar a imagem de produto inferior.`,
    });
  }

  // 5. Satisfação e atendimento
  if (r.serviceRatio < 0.7 && r.unitsSold > 50) {
    items.push({
      tone: 'bad',
      concept: 'branding',
      priority: 8,
      text: `O atendimento não deu conta de ${num(r.unitsSold)} vendas e a satisfação caiu para ${num(r.satisfaction)}%. Contratar atendentes melhora a experiência e a recompra.`,
    });
  }

  // 6. Concorrência
  if (r.offerScore < 0.45 && r.revenue >= 0) {
    items.push({
      tone: 'neutral',
      concept: 'concorrencia',
      priority: 3,
      text: 'Sua oferta está pouco atraente frente à concorrência. Melhore a qualidade, a reputação ou o preço para converter mais.',
    });
  }

  // 7. Conversão
  if (r.reach > 0 && items.length < 3) {
    items.push({
      tone: 'neutral',
      concept: 'conversao',
      priority: 2,
      text: `De ${num(r.reach)} pessoas alcançadas, ${num(r.newCustomers)} viraram clientes: taxa de conversão de ${pct(r.conversionRate, 2)}.`,
    });
  }

  // 8. Persona (primeiros meses)
  if (prev.month <= 2) {
    const preferred = CHANNELS.filter((c) => seg.affinity[c.id] >= 1.3).map((c) => c.label);
    items.push({
      tone: 'neutral',
      concept: 'persona',
      priority: 6,
      text: `Sua persona: ${seg.persona.name}, ${seg.persona.age} anos. ${seg.persona.description} ${preferred.length ? `Canais com mais afinidade: ${preferred.join(', ')}.` : ''}`,
    });
  }

  items.sort((a, b) => b.priority - a.priority);
  const insights = items.slice(0, 3).map(({ tone, text, concept }) => ({ tone, text, concept }));
  return { insights, concept: insights[0]?.concept ?? 'marketingDigital' };
}
