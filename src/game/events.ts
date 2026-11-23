// Eventos aleatórios. O sorteio é feito com a semente da partida, e a chance
// de cada evento depende da situação da empresa (ex.: viralizar é mais provável
// para quem investe em redes sociais). As consequências de cada escolha são
// regras fixas, explicadas ao jogador.

import type { LucideIcon } from 'lucide-react';
import {
  Building,
  CalendarHeart,
  CloudLightning,
  CloudRain,
  Factory,
  Flame,
  Gavel,
  Handshake,
  HandCoins,
  Landmark,
  MessageSquareWarning,
  Newspaper,
  PackageX,
  ServerCrash,
  ShieldAlert,
  Sparkles,
  Store,
  Swords,
  TrendingUp,
  Truck,
  UserRoundPlus,
  Wallet,
} from 'lucide-react';
import { getDifficulty, getSegment } from './data';
import { presentStates } from './expansion';
import { clamp, money, num } from './format';
import { getCity } from './geo';
import { createId } from './id';
import { rngFor } from './rng';
import { competitionLevel, employeeCount, marketSize, modifierTotal, unitCost } from './simulation';
import type { ConceptId, GameState, ModifierKind, RoleId } from './types';

export interface EventChoice {
  id: string;
  label: string;
  hint: string;
  cost?: (s: GameState) => number;
  available?: (s: GameState) => boolean;
  unavailableReason?: string;
  apply: (s: GameState) => { state: GameState; text: string };
}

export interface GameEventDef {
  id: string;
  title: string;
  icon: LucideIcon;
  tone: 'good' | 'bad' | 'neutral';
  concept: ConceptId;
  description: (s: GameState) => string;
  eligible: (s: GameState) => boolean;
  weight: (s: GameState) => number;
  choices: EventChoice[];
}

// --- Ajudantes ---------------------------------------------------------------

function mod(s: GameState, kind: ModifierKind, value: number, months: number, label: string): GameState {
  return { ...s, modifiers: [...s.modifiers, { id: createId('mod'), kind, value, monthsLeft: months, label }] };
}

function pay(s: GameState, amount: number): GameState {
  return { ...s, cash: s.cash - amount };
}

type Stat = 'quality' | 'reputation' | 'satisfaction' | 'awareness';

function bump(s: GameState, stat: Stat, delta: number): GameState {
  return { ...s, [stat]: clamp(s[stat] + delta, 0, stat === 'quality' ? 98 : 100) };
}

function addFollowers(s: GameState, amount: number): GameState {
  return { ...s, followers: Math.max(0, s.followers + amount) };
}

function socialBudget(s: GameState): number {
  return s.campaigns
    .filter((c) => c.active && ['instagram', 'tiktok', 'facebook', 'influencer'].includes(c.channel))
    .reduce((sum, c) => sum + c.budget, 0);
}

function lastReport(s: GameState) {
  return s.history[s.history.length - 1];
}

function freeCapacityUnits(s: GameState): number {
  const r = lastReport(s);
  if (!r) return 0;
  return Math.max(0, Math.round((r.capacity - r.unitsSold) * 0.5));
}

function loseOneEmployee(s: GameState): { state: GameState; role: string | null } {
  const order: RoleId[] = ['atendente', 'vendedor', 'marketing', 'desenvolvedor'];
  const role = order.find((r) => s.employees[r] > 0);
  if (!role) return { state: s, role: null };
  const names: Record<RoleId, string> = {
    atendente: 'um atendente',
    vendedor: 'um vendedor',
    marketing: 'o profissional de marketing',
    desenvolvedor: 'um desenvolvedor',
    gerente: 'o gerente',
    financeiro: 'o analista financeiro',
    logistica: 'o coordenador de logística',
  };
  return { state: { ...s, employees: { ...s.employees, [role]: s.employees[role] - 1 } }, role: names[role] };
}

// --- Catálogo de eventos -------------------------------------------------------

export const EVENTS: GameEventDef[] = [
  {
    id: 'concorrente',
    title: 'Concorrente novo no mercado',
    icon: Swords,
    tone: 'bad',
    concept: 'concorrencia',
    description: () =>
      'Uma nova empresa abriu perto de você e está cobrando preços menores. Parte dos seus clientes está comparando as ofertas.',
    eligible: (s) => s.month >= 2,
    weight: (s) => 1 + competitionLevel(s) / 100,
    choices: [
      {
        id: 'reduzir',
        label: 'Reduzir meus preços em 10%',
        hint: 'Mantém clientes, mas diminui a margem de lucro.',
        apply: (s) => ({
          state: mod({ ...s, price: Math.round(s.price * 0.9 * 100) / 100 }, 'competition', 0.05, 2, 'Concorrente novo'),
          text: 'Seu preço caiu 10% e você segurou os clientes, mas cada venda agora dá menos lucro. Guerra de preços é perigosa: quem tem custo maior perde primeiro.',
        }),
      },
      {
        id: 'diferenciar',
        label: 'Investir em diferenciação',
        hint: 'R$ 1.500 em melhorias: +8 de qualidade e +3 de reputação.',
        cost: () => 1500,
        apply: (s) => ({
          state: mod(bump(bump(pay(s, 1500), 'quality', 8), 'reputation', 3), 'competition', 0.05, 2, 'Concorrente novo'),
          text: 'Você não entrou na guerra de preços: melhorou o produto e reforçou o que o torna único. Diferenciação protege a margem e o posicionamento da marca.',
        }),
      },
      {
        id: 'marketing',
        label: 'Aumentar o marketing',
        hint: 'R$ 1.000 em divulgação extra: +10 de reconhecimento.',
        cost: () => 1000,
        apply: (s) => ({
          state: mod(bump(pay(s, 1000), 'awareness', 10), 'competition', 0.08, 2, 'Concorrente novo'),
          text: 'Mais gente lembrou da sua marca, o que ajuda a manter clientes. Mas, se a oferta do concorrente for melhor, só o marketing não resolve.',
        }),
      },
      {
        id: 'nada',
        label: 'Não fazer nada',
        hint: 'Sem custo agora. A demanda deve cair por 3 meses.',
        apply: (s) => ({
          state: mod(s, 'demand', -0.15, 3, 'Clientes indo para o concorrente'),
          text: 'Sem reação, parte dos clientes migrou para o concorrente: sua demanda cai 15% pelos próximos 3 meses. Ignorar a concorrência costuma sair caro.',
        }),
      },
    ],
  },
  {
    id: 'viral',
    title: 'Sua publicação viralizou!',
    icon: Flame,
    tone: 'good',
    concept: 'marketingDigital',
    description: () =>
      'Um vídeo da sua empresa explodiu nas redes sociais. Milhares de pessoas estão comentando, compartilhando e procurando o seu produto.',
    eligible: (s) => s.month >= 2 && (socialBudget(s) > 0 || s.followers >= 200),
    weight: (s) => 0.4 + socialBudget(s) / 1000 + s.followers / 3000 + s.employees.marketing * 0.3,
    choices: [
      {
        id: 'reforcar',
        label: 'Impulsionar o post viral',
        hint: 'R$ 800: muito mais seguidores e +40% de demanda neste mês.',
        cost: () => 800,
        apply: (s) => {
          const gain = Math.max(500, Math.round(s.followers * 0.5));
          return {
            state: mod(bump(addFollowers(pay(s, 800), gain), 'awareness', 12), 'demand', 0.4, 1, 'Post viral impulsionado'),
            text: `Você aproveitou o momento: +${num(gain)} seguidores e uma onda de novos clientes. Atenção à capacidade: se faltar produto, a satisfação cai.`,
          };
        },
      },
      {
        id: 'capacidade',
        label: 'Reforçar a operação para dar conta',
        hint: 'R$ 1.200: +50% de capacidade e +30% de demanda neste mês.',
        cost: () => 1200,
        apply: (s) => {
          const gain = Math.max(300, Math.round(s.followers * 0.3));
          const next = mod(mod(addFollowers(pay(s, 1200), gain), 'capacity', 0.5, 1, 'Equipe temporária'), 'demand', 0.3, 1, 'Post viral');
          return {
            state: next,
            text: `Você contratou ajuda temporária para atender a procura. +${num(gain)} seguidores e clientes bem atendidos: fama boa vira reputação.`,
          };
        },
      },
      {
        id: 'comemorar',
        label: 'Só comemorar',
        hint: 'Sem custo. +30% de demanda neste mês.',
        apply: (s) => {
          const gain = Math.max(300, Math.round(s.followers * 0.3));
          return {
            state: mod(addFollowers(s, gain), 'demand', 0.3, 1, 'Post viral'),
            text: `+${num(gain)} seguidores de graça! Viralizar ajuda, mas é passageiro: o que fica é a qualidade da experiência de quem chegou.`,
          };
        },
      },
    ],
  },
  {
    id: 'crise_custos',
    title: 'Crise: custos operacionais subiram',
    icon: CloudLightning,
    tone: 'bad',
    concept: 'fluxoCaixa',
    description: () =>
      'Energia, aluguel e matéria-prima ficaram mais caros de uma vez. Seus custos vão subir pelos próximos meses.',
    eligible: (s) => s.month >= 3,
    weight: () => 1,
    choices: [
      {
        id: 'renegociar',
        label: 'Renegociar com fornecedores',
        hint: 'R$ 500 em consultoria: o aumento fica bem menor.',
        cost: () => 500,
        apply: (s) => ({
          state: mod(mod(pay(s, 500), 'fixedCost', 0.05, 3, 'Crise (renegociada)'), 'unitCost', 0.03, 3, 'Crise (renegociada)'),
          text: 'A renegociação limitou o aumento a 5% nos custos fixos e 3% na produção. Negociar com fornecedores é parte da gestão.',
        }),
      },
      {
        id: 'repassar',
        label: 'Repassar para o preço (+8%)',
        hint: 'Protege a margem, mas pode afastar clientes sensíveis a preço.',
        apply: (s) => ({
          state: mod({ ...s, price: Math.round(s.price * 1.08 * 100) / 100 }, 'unitCost', 0.12, 3, 'Crise de custos'),
          text: 'Você subiu o preço em 8% para compensar a produção 12% mais cara. Em mercados com pouco poder de compra, isso reduz as vendas.',
        }),
      },
      {
        id: 'absorver',
        label: 'Absorver os custos',
        hint: 'Sem mudar nada: custos +15% e produção +12% por 3 meses.',
        apply: (s) => ({
          state: mod(mod(s, 'fixedCost', 0.15, 3, 'Crise de custos'), 'unitCost', 0.12, 3, 'Crise de custos'),
          text: 'Você manteve os preços e aceitou lucrar menos. Funciona se houver caixa sobrando; acompanhe o fluxo de caixa de perto.',
        }),
      },
    ],
  },
  {
    id: 'fornecedor',
    title: 'Problema com o fornecedor',
    icon: PackageX,
    tone: 'bad',
    concept: 'fluxoCaixa',
    description: () => 'Seu principal fornecedor atrasou as entregas deste mês. Faltam materiais para produzir.',
    eligible: (s) => s.month >= 2,
    weight: () => 0.9,
    choices: [
      {
        id: 'alternativo',
        label: 'Comprar de um fornecedor mais caro',
        hint: 'Produção 20% mais cara neste mês.',
        apply: (s) => ({
          state: mod(s, 'unitCost', 0.2, 1, 'Fornecedor alternativo'),
          text: 'Você não deixou de vender, mas pagou mais caro. Ter mais de um fornecedor reduz esse risco.',
        }),
      },
      {
        id: 'reduzir',
        label: 'Produzir menos este mês',
        hint: 'Capacidade 40% menor neste mês.',
        apply: (s) => ({
          state: mod(s, 'capacity', -0.4, 1, 'Falta de material'),
          text: 'Com menos produção, parte dos pedidos pode não ser atendida, e clientes não atendidos ficam insatisfeitos.',
        }),
      },
      {
        id: 'estoque',
        label: 'Usar dinheiro para estoque de segurança',
        hint: 'R$ 1.000 agora e a operação segue normal.',
        cost: () => 1000,
        apply: (s) => ({
          state: pay(s, 1000),
          text: 'O estoque de segurança evitou a falta de produto. Planejar uma reserva para imprevistos protege as vendas.',
        }),
      },
    ],
  },
  {
    id: 'reclamacao',
    title: 'Reclamação viralizou',
    icon: MessageSquareWarning,
    tone: 'bad',
    concept: 'branding',
    description: () =>
      'Um cliente insatisfeito publicou uma reclamação sobre a sua empresa e o post está circulando. Todo mundo está de olho na sua resposta.',
    eligible: (s) => s.month >= 3,
    weight: (s) => 0.5 + Math.max(0, (75 - s.satisfaction) / 15),
    choices: [
      {
        id: 'resolver',
        label: 'Responder publicamente e resolver',
        hint: 'R$ 300 para resolver o caso.',
        cost: () => 300,
        apply: (s) => ({
          state: bump(bump(pay(s, 300), 'reputation', -2), 'satisfaction', 3),
          text: 'Responder com empatia e resolver o problema mostrou respeito pelo cliente. A reputação quase não foi afetada.',
        }),
      },
      {
        id: 'melhorar',
        label: 'Resolver e melhorar o processo',
        hint: 'R$ 800: satisfação e qualidade sobem.',
        cost: () => 800,
        apply: (s) => ({
          state: bump(bump(bump(pay(s, 800), 'satisfaction', 6), 'reputation', 2), 'quality', 2),
          text: 'Você transformou a crítica em melhoria. Clientes percebem quando a marca aprende com os erros.',
        }),
      },
      {
        id: 'ignorar',
        label: 'Ignorar a reclamação',
        hint: 'Sem custo, mas a reputação vai sofrer.',
        apply: (s) => ({
          state: addFollowers(bump(s, 'reputation', -10), -Math.round(s.followers * 0.05)),
          text: 'O silêncio pareceu descaso: -10 de reputação e perda de seguidores. Nas redes, a forma de responder faz parte da marca.',
        }),
      },
    ],
  },
  {
    id: 'influenciador',
    title: 'Um influenciador quer parceria',
    icon: Sparkles,
    tone: 'good',
    concept: 'publicoAlvo',
    description: () =>
      'Um criador de conteúdo do seu nicho gostou da sua marca e propôs uma parceria para divulgar o seu produto.',
    eligible: (s) => s.followers >= 300 && s.level >= 2,
    weight: () => 0.9,
    choices: [
      {
        id: 'pago',
        label: 'Fechar parceria paga',
        hint: 'R$ 1.500: muitos seguidores, +15 de reconhecimento e +15% de demanda.',
        cost: () => 1500,
        apply: (s) => {
          const gain = 1500 + Math.round(s.followers * 0.2);
          return {
            state: mod(bump(addFollowers(pay(s, 1500), gain), 'awareness', 15), 'demand', 0.15, 1, 'Parceria com influenciador'),
            text: `+${num(gain)} seguidores. Funciona quando o público do influenciador é parecido com o seu público-alvo.`,
          };
        },
      },
      {
        id: 'permuta',
        label: 'Fazer permuta com produtos',
        hint: 'R$ 400 em produtos: resultado menor.',
        cost: () => 400,
        apply: (s) => ({
          state: bump(addFollowers(pay(s, 400), 600), 'awareness', 6),
          text: '+600 seguidores. Permutas são uma forma barata de testar parcerias antes de investir mais.',
        }),
      },
      {
        id: 'recusar',
        label: 'Recusar',
        hint: 'Nada muda.',
        apply: (s) => ({ state: s, text: 'Você recusou a parceria. Às vezes é a escolha certa, se o público dele não combina com o seu.' }),
      },
    ],
  },
  {
    id: 'investidor',
    title: 'Investidor-anjo interessado',
    icon: HandCoins,
    tone: 'good',
    concept: 'fluxoCaixa',
    description: () =>
      'Um investidor-anjo viu o crescimento da empresa e oferece R$ 15.000 em troca de 20% de participação no negócio.',
    eligible: (s) => s.month >= 6 && s.totalRevenue >= 15000 && s.investorShare === 0,
    weight: () => 0.8,
    choices: [
      {
        id: 'aceitar',
        label: 'Aceitar R$ 15.000 por 20%',
        hint: 'Caixa reforçado, mas você passa a ter um sócio.',
        apply: (s) => ({
          state: { ...s, cash: s.cash + 15000, investorShare: 0.2 },
          text: 'Você recebeu R$ 15.000 sem dívida, mas agora 20% da empresa é do investidor. Isso se chama diluição: você divide os resultados futuros.',
        }),
      },
      {
        id: 'negociar',
        label: 'Negociar: R$ 12.000 por 10%',
        hint: 'Só funciona se a reputação da marca for alta (55+).',
        apply: (s) =>
          s.reputation >= 55
            ? {
                state: { ...s, cash: s.cash + 12000, investorShare: 0.1 },
                text: 'Sua marca forte deu poder de negociação: R$ 12.000 por só 10%. Reputação também tem valor financeiro.',
              }
            : {
                state: s,
                text: `Com reputação ${Math.round(s.reputation)}, o investidor não aceitou a contraproposta e desistiu. Marca forte aumenta o valor da empresa.`,
              },
      },
      {
        id: 'recusar',
        label: 'Recusar e crescer sozinho',
        hint: 'Você continua dono de 100%.',
        apply: (s) => ({ state: s, text: 'Você manteve 100% da empresa. Crescer com recursos próprios é mais lento, mas sem dividir o controle.' }),
      },
    ],
  },
  {
    id: 'data_comemorativa',
    title: 'Data comemorativa chegando',
    icon: CalendarHeart,
    tone: 'good',
    concept: 'conversao',
    description: () => 'Uma data importante para o comércio (como Black Friday ou Dia das Mães) está chegando. É hora de aproveitar?',
    eligible: (s) => s.month >= 2,
    weight: () => 1,
    choices: [
      {
        id: 'promocao',
        label: 'Promoção com 20% de desconto',
        hint: 'Neste mês: preço 20% menor e +60% de demanda.',
        apply: (s) => ({
          state: mod(mod(s, 'price', -0.2, 1, 'Promoção da data'), 'demand', 0.6, 1, 'Promoção da data'),
          text: 'O desconto atraiu muita gente, mas cada venda deu menos lucro. Promoção boa é aquela em que o volume compensa a margem menor.',
        }),
      },
      {
        id: 'tematica',
        label: 'Campanha temática sem desconto',
        hint: 'R$ 800 e +35% de demanda neste mês.',
        cost: () => 800,
        apply: (s) => ({
          state: mod(pay(s, 800), 'demand', 0.35, 1, 'Campanha da data'),
          text: 'Você vendeu mais sem reduzir o preço: comunicação criativa aumenta a conversão sem sacrificar a margem.',
        }),
      },
      {
        id: 'nada',
        label: 'Não participar',
        hint: 'Nada muda.',
        apply: (s) => ({ state: s, text: 'Você ficou de fora da data. Seus concorrentes provavelmente aproveitaram.' }),
      },
    ],
  },
  {
    id: 'aumento',
    title: 'Equipe pede aumento',
    icon: UserRoundPlus,
    tone: 'bad',
    concept: 'lucro',
    description: () => 'Seus funcionários estão pedindo um aumento salarial. A motivação da equipe está em jogo.',
    eligible: (s) => employeeCount(s) >= 1,
    weight: (s) => 0.4 + employeeCount(s) * 0.2,
    choices: [
      {
        id: 'dar',
        label: 'Dar 10% de aumento',
        hint: 'Salários 10% maiores a partir de agora.',
        apply: (s) => ({
          state: bump({ ...s, salaryBonus: s.salaryBonus + 0.1 }, 'satisfaction', 2),
          text: 'A equipe ficou motivada e atende melhor, mas o custo fixo mensal subiu. Salários são o maior custo de muitas empresas.',
        }),
      },
      {
        id: 'beneficios',
        label: 'Oferecer um bônus único',
        hint: 'R$ 600 agora, sem aumentar o custo mensal.',
        cost: () => 600,
        apply: (s) => ({
          state: pay(s, 600),
          text: 'Um bônus pontual reconheceu o esforço sem criar um custo fixo novo.',
        }),
      },
      {
        id: 'recusar',
        label: 'Recusar',
        hint: 'Equipe desmotivada; alguém pode pedir demissão.',
        apply: (s) => {
          let next = mod(s, 'conversion', -0.08, 2, 'Equipe desmotivada');
          let extra = '';
          if (s.employees.gerente === 0 && employeeCount(s) >= 2) {
            const lost = loseOneEmployee(next);
            next = lost.state;
            if (lost.role) extra = ` Sem um gerente para mediar, ${lost.role} pediu demissão.`;
          }
          return { state: next, text: `A equipe ficou desmotivada e as vendas caem 8% por 2 meses.${extra}` };
        },
      },
    ],
  },
  {
    id: 'falha_sistema',
    title: 'Falha no sistema de vendas',
    icon: ServerCrash,
    tone: 'bad',
    concept: 'marketingDigital',
    description: () => 'O site e o sistema de pedidos saíram do ar. Clientes não estão conseguindo comprar.',
    eligible: (s) => s.month >= 2,
    weight: () => 0.8,
    choices: [
      {
        id: 'dev',
        label: 'Seu desenvolvedor resolve',
        hint: 'Sem custo extra.',
        available: (s) => s.employees.desenvolvedor > 0,
        unavailableReason: 'Exige um desenvolvedor na equipe.',
        apply: (s) => ({ state: s, text: 'Seu desenvolvedor corrigiu o problema em poucas horas. Ter competência técnica na equipe evita prejuízos.' }),
      },
      {
        id: 'tecnico',
        label: 'Contratar um técnico com urgência',
        hint: 'R$ 700 e o problema é resolvido.',
        cost: () => 700,
        apply: (s) => ({ state: pay(s, 700), text: 'O técnico resolveu rápido. Serviços de emergência custam mais caro.' }),
      },
      {
        id: 'esperar',
        label: 'Esperar resolver sozinho',
        hint: 'Demanda -25% neste mês e -3 de reputação.',
        apply: (s) => ({
          state: mod(bump(s, 'reputation', -3), 'demand', -0.25, 1, 'Sistema fora do ar'),
          text: 'Vendas perdidas e clientes frustrados. Na venda on-line, cada minuto fora do ar custa dinheiro.',
        }),
      },
    ],
  },
  {
    id: 'tendencia',
    title: 'Nova tendência no seu mercado',
    icon: TrendingUp,
    tone: 'neutral',
    concept: 'posicionamento',
    description: (s) => `Uma tendência está mudando o seu mercado: ${getSegment(s.company.segment).trendLabel.toLowerCase()}.`,
    eligible: (s) => s.month >= 3,
    weight: () => 0.9,
    choices: [
      {
        id: 'adaptar',
        label: 'Adaptar o produto à tendência',
        hint: 'R$ 2.000: +5 de qualidade e +15% de demanda por 4 meses.',
        cost: () => 2000,
        apply: (s) => ({
          state: mod(bump(pay(s, 2000), 'quality', 5), 'demand', 0.15, 4, 'Produto na tendência'),
          text: 'Você inovou e saiu na frente. Acompanhar tendências mantém a empresa relevante.',
        }),
      },
      {
        id: 'conteudo',
        label: 'Criar conteúdo sobre o tema',
        hint: 'R$ 400: seguidores, reconhecimento e +5% de demanda.',
        cost: () => 400,
        apply: (s) => ({
          state: mod(bump(addFollowers(pay(s, 400), 300), 'awareness', 8), 'demand', 0.05, 2, 'Conteúdo em alta'),
          text: 'Você usou a tendência para gerar conteúdo e atenção, sem mudar o produto. Marketing de conteúdo aproxima a marca do público.',
        }),
      },
      {
        id: 'ignorar',
        label: 'Ignorar a tendência',
        hint: 'Nada muda agora.',
        apply: (s) => ({ state: bump(s, 'quality', -2), text: 'Você ficou parado enquanto o mercado mudou. Sua oferta perdeu um pouco de atratividade.' }),
      },
    ],
  },
  {
    id: 'algoritmo',
    title: 'Mudança no algoritmo das redes',
    icon: Wallet,
    tone: 'bad',
    concept: 'marketingDigital',
    description: () => 'As redes sociais mudaram o algoritmo e as publicações das empresas estão aparecendo para menos gente.',
    eligible: (s) => socialBudget(s) > 0 || s.followers >= 300,
    weight: (s) => 0.5 + socialBudget(s) / 1500,
    choices: [
      {
        id: 'diversificar',
        label: 'Diversificar canais',
        hint: 'O impacto cai pela metade: alcance social -15% por 2 meses.',
        apply: (s) => ({
          state: mod(s, 'socialReach', -0.15, 2, 'Algoritmo novo'),
          text: 'Não depender de um único canal reduziu o impacto. Use também Google, WhatsApp e SEO.',
        }),
      },
      {
        id: 'conteudo',
        label: 'Investir em conteúdo de qualidade',
        hint: 'R$ 600: alcance social -10% por 2 meses e +200 seguidores.',
        cost: () => 600,
        apply: (s) => ({
          state: mod(addFollowers(pay(s, 600), 200), 'socialReach', -0.1, 2, 'Algoritmo novo'),
          text: 'Conteúdo relevante continua sendo entregue pelos algoritmos. Qualidade vence atalhos.',
        }),
      },
      {
        id: 'aceitar',
        label: 'Aceitar a mudança',
        hint: 'Alcance social -30% por 2 meses.',
        apply: (s) => ({
          state: mod(s, 'socialReach', -0.3, 2, 'Algoritmo novo'),
          text: 'Suas campanhas em redes sociais vão render 30% menos por 2 meses. Redes sociais são "terreno alugado": as regras mudam.',
        }),
      },
    ],
  },
  {
    id: 'imprensa',
    title: 'Sua empresa saiu na imprensa',
    icon: Newspaper,
    tone: 'good',
    concept: 'branding',
    description: () => 'Um portal de notícias publicou uma matéria elogiando a sua empresa como exemplo de empreendedorismo.',
    eligible: (s) => s.reputation >= 50 && s.month >= 4,
    weight: (s) => 0.5 + s.reputation / 100,
    choices: [
      {
        id: 'divulgar',
        label: 'Divulgar a matéria nas redes',
        hint: 'R$ 200: +15 de reconhecimento, seguidores e reputação.',
        cost: () => 200,
        apply: (s) => ({
          state: bump(bump(addFollowers(pay(s, 200), 400), 'awareness', 15), 'reputation', 4),
          text: 'Prova social funciona: quando outras pessoas falam bem de você, a marca ganha credibilidade.',
        }),
      },
      {
        id: 'agradecer',
        label: 'Apenas agradecer',
        hint: 'Sem custo: efeito menor.',
        apply: (s) => ({ state: bump(bump(s, 'awareness', 6), 'reputation', 2), text: 'A matéria ajudou um pouco, mas poderia ter alcançado muito mais gente.' }),
      },
    ],
  },
  {
    id: 'fiscalizacao',
    title: 'Fiscalização na empresa',
    icon: Gavel,
    tone: 'bad',
    concept: 'lucro',
    description: () => 'Um fiscal vai verificar notas fiscais, alvarás e contratos da sua empresa.',
    eligible: (s) => s.month >= 4,
    weight: () => 0.7,
    choices: [
      {
        id: 'contador',
        label: 'Contratar um contador para regularizar',
        hint: 'R$ 800 e tudo fica em ordem.',
        cost: () => 800,
        apply: (s) => ({ state: pay(s, 800), text: 'Com tudo regularizado, a fiscalização passou sem problemas. Formalizar o negócio evita multas e dá segurança.' }),
      },
      {
        id: 'arriscar',
        label: 'Arriscar sem regularizar',
        hint: 'Sem um gerente organizando, a multa é de R$ 2.500.',
        apply: (s) =>
          s.employees.gerente > 0
            ? { state: s, text: 'Seu gerente já mantinha a documentação em dia: nenhuma multa. Gestão organizada evita surpresas.' }
            : {
                state: bump(pay(s, 2500), 'reputation', -5),
                text: 'Foram encontradas irregularidades: multa de R$ 2.500 e -5 de reputação. Economizar na organização saiu caro.',
              },
      },
    ],
  },
  {
    id: 'pedido_grande',
    title: 'Pedido grande de uma empresa',
    icon: Building,
    tone: 'good',
    concept: 'receita',
    description: (s) =>
      `Uma empresa quer comprar ${num(freeCapacityUnits(s))} unidades de uma vez, mas pede 15% de desconto.`,
    eligible: (s) => s.month >= 3 && freeCapacityUnits(s) >= 20,
    weight: () => 0.8,
    choices: [
      {
        id: 'aceitar_desconto',
        label: 'Aceitar com 15% de desconto',
        hint: 'Receita extra imediata, com margem menor.',
        apply: (s) => {
          const units = freeCapacityUnits(s);
          const revenue = units * s.price * 0.85;
          const profit = revenue - units * unitCost(s);
          return {
            state: { ...s, cash: s.cash + profit, totalRevenue: s.totalRevenue + revenue, customersTotal: s.customersTotal + 1 },
            text: `Venda de ${num(units)} unidades: ${money(revenue)} de receita e ${money(profit)} de lucro. Usar a capacidade ociosa aumenta a receita.`,
          };
        },
      },
      {
        id: 'preco_cheio',
        label: 'Negociar preço cheio',
        hint: 'Só funciona com reputação 60+.',
        apply: (s) => {
          const units = freeCapacityUnits(s);
          if (s.reputation < 60)
            return { state: s, text: 'Sem uma marca forte o suficiente, o cliente não aceitou pagar o preço cheio e desistiu do pedido.' };
          const revenue = units * s.price;
          const profit = revenue - units * unitCost(s);
          return {
            state: { ...s, cash: s.cash + profit, totalRevenue: s.totalRevenue + revenue, customersTotal: s.customersTotal + 1 },
            text: `Sua reputação convenceu o cliente: ${money(revenue)} de receita sem desconto. Marca forte sustenta preço.`,
          };
        },
      },
      {
        id: 'recusar',
        label: 'Recusar o pedido',
        hint: 'Nada muda.',
        apply: (s) => ({ state: s, text: 'Você recusou o pedido e manteve o foco nos clientes atuais.' }),
      },
    ],
  },
  {
    id: 'inflacao',
    title: 'Inflação e alta do dólar',
    icon: Factory,
    tone: 'bad',
    concept: 'lucro',
    description: () => 'A inflação subiu e os insumos estão mais caros. Produzir cada unidade vai custar mais nos próximos meses.',
    eligible: (s) => s.month >= 3,
    weight: () => 0.8,
    choices: [
      {
        id: 'reajustar',
        label: 'Reajustar o preço em 7%',
        hint: 'Protege a margem.',
        apply: (s) => ({
          state: mod({ ...s, price: Math.round(s.price * 1.07 * 100) / 100 }, 'unitCost', 0.1, 3, 'Inflação'),
          text: 'O reajuste protegeu a margem. Clientes com menos poder de compra sentem mais os aumentos.',
        }),
      },
      {
        id: 'local',
        label: 'Buscar fornecedor local',
        hint: 'R$ 500: aumento de custo de só 3%.',
        cost: () => 500,
        apply: (s) => ({
          state: mod(pay(s, 500), 'unitCost', 0.03, 3, 'Inflação (fornecedor local)'),
          text: 'Trocar de fornecedor reduziu o impacto da inflação. Rever a cadeia de suprimentos ajuda a controlar custos.',
        }),
      },
      {
        id: 'absorver',
        label: 'Absorver o aumento',
        hint: 'Produção 10% mais cara por 3 meses.',
        apply: (s) => ({
          state: mod(s, 'unitCost', 0.1, 3, 'Inflação'),
          text: 'Você manteve o preço, mas cada venda dará menos lucro nos próximos 3 meses.',
        }),
      },
    ],
  },
  {
    id: 'perfil_clonado',
    title: 'Golpistas clonaram seu perfil',
    icon: ShieldAlert,
    tone: 'bad',
    concept: 'branding',
    description: () => 'Golpistas criaram um perfil falso da sua empresa e estão enganando clientes.',
    eligible: (s) => s.followers >= 200,
    weight: () => 0.6,
    choices: [
      {
        id: 'avisar',
        label: 'Avisar os clientes e denunciar',
        hint: 'R$ 300 em ações de segurança.',
        cost: () => 300,
        apply: (s) => ({
          state: bump(pay(s, 300), 'reputation', -1),
          text: 'Agir rápido e com transparência protegeu os clientes e a confiança na marca.',
        }),
      },
      {
        id: 'ignorar',
        label: 'Ignorar',
        hint: 'Reputação -8 e perda de seguidores.',
        apply: (s) => ({
          state: addFollowers(bump(s, 'reputation', -8), -Math.round(s.followers * 0.1)),
          text: 'Clientes enganados culparam a sua marca. Segurança digital também é responsabilidade da empresa.',
        }),
      },
    ],
  },
  {
    id: 'concorrente_fecha',
    title: 'Um concorrente fechou as portas',
    icon: Store,
    tone: 'good',
    concept: 'concorrencia',
    description: () => 'Uma empresa concorrente encerrou as atividades. Os clientes dela estão procurando outra opção.',
    eligible: (s) => s.month >= 5 && competitionLevel(s) >= 40,
    weight: () => 0.7,
    choices: [
      {
        id: 'captar',
        label: 'Fazer campanha para os clientes dele',
        hint: 'R$ 1.000: novos clientes agora e +10% de demanda por 2 meses.',
        cost: () => 1000,
        apply: (s) => {
          const gained = Math.round(marketSize(s) * 0.03);
          return {
            state: mod(
              { ...pay(s, 1000), activeCustomers: s.activeCustomers + gained, customersTotal: s.customersTotal + gained },
              'demand',
              0.1,
              2,
              'Clientes do concorrente',
            ),
            text: `Você conquistou ${num(gained)} clientes que estavam sem opção. Estar atento ao mercado gera oportunidades.`,
          };
        },
      },
      {
        id: 'nada',
        label: 'Seguir normalmente',
        hint: '+10% de demanda por 2 meses.',
        apply: (s) => ({ state: mod(s, 'demand', 0.1, 2, 'Concorrente fechou'), text: 'Parte dos clientes chegou até você naturalmente.' }),
      },
    ],
  },
  {
    id: 'chuva',
    title: 'Tempestade e falta de energia',
    icon: CloudRain,
    tone: 'bad',
    concept: 'fluxoCaixa',
    description: () => 'Uma tempestade derrubou a energia da região por vários dias.',
    eligible: (s) => s.month >= 2,
    weight: () => 0.6,
    choices: [
      {
        id: 'gerador',
        label: 'Alugar um gerador',
        hint: 'R$ 600 e a operação segue.',
        cost: () => 600,
        apply: (s) => ({ state: pay(s, 600), text: 'O gerador manteve a operação funcionando. Uma reserva para emergências faz diferença.' }),
      },
      {
        id: 'fechar',
        label: 'Fechar até a energia voltar',
        hint: 'Capacidade 30% menor neste mês.',
        apply: (s) => ({ state: mod(s, 'capacity', -0.3, 1, 'Sem energia'), text: 'Com a operação parada, você deixou de atender parte dos pedidos.' }),
      },
    ],
  },
  {
    id: 'parceria',
    title: 'Proposta de parceria local',
    icon: Handshake,
    tone: 'good',
    concept: 'publicoAlvo',
    description: () => 'Uma empresa da região, com um público parecido com o seu, propôs uma ação de divulgação conjunta.',
    eligible: (s) => s.month >= 3,
    weight: () => 0.8,
    choices: [
      {
        id: 'aceitar',
        label: 'Aceitar a parceria',
        hint: 'R$ 500: +10 de reconhecimento e +8% de demanda por 2 meses.',
        cost: () => 500,
        apply: (s) => ({
          state: mod(bump(addFollowers(pay(s, 500), 300), 'awareness', 10), 'demand', 0.08, 2, 'Parceria local'),
          text: 'Parcerias com empresas do mesmo público-alvo dividem custos e multiplicam o alcance.',
        }),
      },
      {
        id: 'recusar',
        label: 'Recusar',
        hint: 'Nada muda.',
        apply: (s) => ({ state: s, text: 'Você preferiu seguir sozinho por enquanto.' }),
      },
    ],
  },
  {
    id: 'greve_caminhoneiros',
    title: 'Greve dos caminhoneiros',
    icon: Truck,
    tone: 'bad',
    concept: 'fluxoCaixa',
    description: (s) =>
      `Uma greve parou as estradas do país. Suas filiais em ${presentStates(s).size} estados estão sem receber mercadoria, e o estoque está acabando.`,
    eligible: (s) => presentStates(s).size >= 2,
    weight: (s) => 0.5 + 0.25 * presentStates(s).size,
    choices: [
      {
        id: 'aereo',
        label: 'Pagar frete aéreo',
        hint: 'Caro, mas as filiais continuam abastecidas.',
        cost: (s) => greveCost(s),
        apply: (s) => ({
          state: pay(s, greveCost(s)),
          text: `Você pagou ${money(greveCost(s))} em frete aéreo e nenhuma filial ficou sem produto. Ter um plano B na logística custa, mas protege as vendas.`,
        }),
      },
      {
        id: 'esperar',
        label: 'Esperar a greve acabar',
        hint: 'Produção mais cara e menos capacidade por 2 meses (menos com coordenador de logística).',
        apply: (s) => {
          const soft = s.employees.logistica > 0;
          const next = mod(mod(s, 'unitCost', soft ? 0.08 : 0.18, 2, 'Greve dos caminhoneiros'), 'capacity', soft ? -0.08 : -0.2, 2, 'Estoque em falta');
          return {
            state: next,
            text: soft
              ? 'Seu coordenador de logística achou rotas alternativas: o impacto foi pequeno (+8% no custo e −8% na capacidade por 2 meses).'
              : 'Sem mercadoria, as filiais venderam menos e o que chegou custou mais caro: +18% no custo e −20% na capacidade por 2 meses.',
          };
        },
      },
    ],
  },
  {
    id: 'rede_rival',
    title: 'Rede rival chegou à sua filial',
    icon: Store,
    tone: 'bad',
    concept: 'concorrencia',
    description: (s) =>
      `Uma grande rede do seu setor abriu uma loja ao lado da sua filial em ${rivalCity(s)}, com inauguração cheia de promoções.`,
    eligible: (s) => s.branches.some((b) => b.city !== s.homeCity),
    weight: (s) => 0.4 + 0.15 * s.branches.filter((b) => b.city !== s.homeCity).length,
    choices: [
      {
        id: 'inauguracao',
        label: 'Fazer uma contra-campanha local',
        hint: 'R$ 2.500 em ações na cidade: +6 de reconhecimento e a concorrência sobe pouco.',
        cost: () => 2500,
        apply: (s) => ({
          state: mod(bump(pay(s, 2500), 'awareness', 6), 'competition', 0.03, 2, 'Rede rival'),
          text: `A campanha em ${rivalCity(s)} lembrou a cidade de que você chegou primeiro. Responder rápido segura os clientes.`,
        }),
      },
      {
        id: 'qualidade',
        label: 'Reforçar o atendimento',
        hint: 'R$ 1.200 em treinamento: +4 de satisfação e +2 de reputação.',
        cost: () => 1200,
        apply: (s) => ({
          state: mod(bump(bump(pay(s, 1200), 'satisfaction', 4), 'reputation', 2), 'competition', 0.06, 3, 'Rede rival'),
          text: 'Um atendimento melhor fideliza quem já é cliente, mas a rede rival ainda vai disputar os clientes novos por um tempo.',
        }),
      },
      {
        id: 'nada',
        label: 'Não fazer nada',
        hint: 'A demanda cai 10% por 3 meses.',
        apply: (s) => ({
          state: mod(mod(s, 'demand', -0.1, 3, 'Clientes indo para a rede rival'), 'competition', 0.08, 3, 'Rede rival'),
          text: 'Sem reação, a rede rival levou parte dos seus clientes: −10% na demanda por 3 meses.',
        }),
      },
    ],
  },
  {
    id: 'incentivo_fiscal',
    title: 'Incentivo fiscal estadual',
    icon: Landmark,
    tone: 'good',
    concept: 'lucro',
    description: () =>
      'Um governo estadual está oferecendo redução de impostos para empresas que geram empregos. Para participar, é preciso montar um processo com um contador.',
    eligible: (s) => presentStates(s).size >= 2,
    weight: () => 0.5,
    choices: [
      {
        id: 'aderir',
        label: 'Aderir ao programa',
        hint: 'R$ 1.000 com o contador: custos fixos 10% menores por 6 meses.',
        cost: () => 1000,
        apply: (s) => ({
          state: mod(pay(s, 1000), 'fixedCost', -0.1, 6, 'Incentivo fiscal'),
          text: 'Programa aprovado! Seus custos fixos caem 10% pelos próximos 6 meses. Conhecer os incentivos do governo é parte da gestão financeira.',
        }),
      },
      {
        id: 'recusar',
        label: 'Deixar para depois',
        hint: 'Nada muda.',
        apply: (s) => ({ state: s, text: 'A papelada ficou para depois, e a oportunidade passou.' }),
      },
    ],
  },
];

function greveCost(s: GameState): number {
  return 800 + 600 * Math.max(1, presentStates(s).size - 1);
}

function rivalCity(s: GameState): string {
  const away = s.branches.filter((b) => b.city !== s.homeCity);
  const b = away[s.month % Math.max(1, away.length)];
  return (b && getCity(b.city)?.name) ?? 'outra cidade';
}

export function getEvent(id: string): GameEventDef | undefined {
  return EVENTS.find((e) => e.id === id);
}

export function choiceCost(s: GameState, choice: EventChoice): number {
  return choice.cost ? choice.cost(s) : 0;
}

export function isChoiceAvailable(s: GameState, choice: EventChoice): boolean {
  if (choice.available && !choice.available(s)) return false;
  return choiceCost(s, choice) <= Math.max(0, s.cash);
}

/** Sorteia (ou não) um evento para o mês atual, usando a semente da partida. */
export function rollEvent(s: GameState): string | null {
  if (s.month < 2) return null;
  const diff = getDifficulty(s.player.difficulty);
  const rng = rngFor(s.seed, s.month, 2);
  if (rng() > diff.eventChance + (s.month > 4 ? 0.05 : 0)) return null;
  const recent = new Set(s.recentEvents.filter((e) => s.month - e.month < 6).map((e) => e.id));
  const pool = EVENTS.filter((e) => !recent.has(e.id) && e.eligible(s)).map((e) => ({
    e,
    w: Math.max(0, e.weight(s)) * (e.tone === 'bad' ? diff.badEventWeight : 1),
  }));
  const total = pool.reduce((sum, p) => sum + p.w, 0);
  if (total <= 0) return null;
  let pick = rng() * total;
  for (const p of pool) {
    pick -= p.w;
    if (pick <= 0) return p.e.id;
  }
  return pool[pool.length - 1].e.id;
}

/** Ajuda a apontar no relatório que efeitos de eventos estão ativos. */
export function activeModifierSummary(s: GameState): string[] {
  const kinds: ModifierKind[] = ['demand', 'unitCost', 'fixedCost', 'capacity', 'socialReach', 'conversion', 'competition', 'price'];
  return kinds.filter((k) => modifierTotal(s, k) !== 0).map((k) => k);
}
