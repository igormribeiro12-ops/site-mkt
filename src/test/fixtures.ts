import { createEmptyProject } from '../lib/defaults';
import type { Project } from '../types';

/** Projeto completo usado apenas nos testes automatizados. */
export function makeCompleteProject(): Project {
  const base = createEmptyProject();
  return {
    ...base,
    createdAt: '2026-11-16T10:00:00.000Z',
    updatedAt: '2026-11-16T10:00:00.000Z',
    company: {
      name: 'Doce Encanto',
      founder: 'Maria Silva',
      segment: 'alimentacao',
      segmentOther: '',
      description: 'Confeitaria on-line de doces artesanais por encomenda.',
      problem: 'Falta de doces caseiros com entrega rápida no bairro.',
      offering: 'Brigadeiros gourmet e bolos de pote.',
      differential: 'Receitas da família e entrega em até 1 hora.',
    },
    brand: { primaryColor: '#db2777', secondaryColor: '#fbcfe8', slogan: 'Doçura em cada mordida.', style: 'divertido', icon: 'cake' },
    audience: {
      personaName: 'Ana',
      occupation: 'estudante',
      ageMin: 18,
      ageMax: 24,
      location: 'Zona Sul',
      interests: ['Culinária', 'Música'],
      needs: 'Presentes rápidos e baratos para amigos.',
      painPoints: 'Pouco tempo e pouco dinheiro no fim do mês.',
      purchasingPower: 'medio',
      onlinePlaces: ['Instagram', 'WhatsApp'],
    },
    products: [
      {
        id: 'prod_1',
        kind: 'produto',
        name: 'Caixa de brigadeiros',
        description: 'Caixa com 12 brigadeiros gourmet sortidos.',
        price: 30,
        category: 'Doce',
        benefits: 'Feito na hora\nEntrega rápida',
        differentials: 'Receita exclusiva.',
        createdAt: '2026-11-16T10:00:00.000Z',
      },
    ],
    marketing: {
      channels: ['instagram', 'whatsapp'],
      mainChannel: 'instagram',
      tactics: ['Conteúdo orgânico'],
      promotion: 'Vídeos mostrando a produção e cupom na primeira compra.',
      contentPillars: ['Bastidores'],
      contentStrategy: 'Dicas na segunda, bastidores na quarta e promoções na sexta.',
      frequency: '3 vezes por semana',
      adBudget: 100,
      goalType: 'Gerar vendas',
      goal: 'Vender 100 caixas no primeiro mês.',
      calendar: [
        { id: 'cal_1', date: '2026-12-01', channel: 'instagram', format: 'Reels / vídeo curto', title: 'Bastidores', notes: '' },
      ],
    },
    campaigns: [
      {
        id: 'camp_1',
        name: 'Lançamento',
        productId: 'prod_1',
        platform: 'instagram',
        text: 'Conheça nossos brigadeiros gourmet! #doceencanto',
        cta: 'Compre agora',
        artStyle: 'destaque',
        artTitle: '',
        createdAt: '2026-11-16T10:00:00.000Z',
        updatedAt: '2026-11-16T10:00:00.000Z',
      },
    ],
    finance: {
      initialInvestment: 1000,
      monthlyCosts: 500,
      unitCost: 10,
      price: 30,
      monthlySales: 100,
      expectedRevenue: 2500,
      includeAds: true,
    },
  };
}
