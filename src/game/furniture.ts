// Catálogo de móveis e equipamentos do escritório.
// Cada item aparece no cenário, ocupa tiles (colisão) e tem efeito na economia.

import type { SegmentId } from './types';

export type Facing = 'up' | 'down' | 'left' | 'right';

export interface Spot {
  dx: number;
  dy: number;
  face: Facing;
  /** O personagem senta "dentro" do móvel (chega pela casa de baixo). */
  seat?: boolean;
  /** Animação usada no lugar (ex.: andar na esteira). */
  pose?: string;
}

export type FurnitureCategory = 'producao' | 'atendimento' | 'decoracao' | 'equipamento';

export interface FurnitureDef {
  type: string;
  name: string;
  category: FurnitureCategory;
  segments: SegmentId[] | 'all';
  price: number;
  w: number;
  h: number;
  /** Pode-se andar por cima (ex.: tapete). */
  walkable?: boolean;
  /** Onde um funcionário (ou o jogador) trabalha. */
  staff?: Spot;
  /** Onde um cliente olha produtos, senta ou é atendido. */
  customer?: Spot;
  /** Papéis de funcionário que usam este posto. */
  roles?: string[];
  effects: { capacity?: number; satisfaction?: number; quality?: number; conversion?: number };
  description: string;
  /** Liberado ao concluir uma missão. */
  missionUnlock?: string;
}

const desk = (type: string, name: string, segments: SegmentId[] | 'all', price: number, capacity: number, description: string): FurnitureDef => ({
  type,
  name,
  category: 'producao',
  segments,
  price,
  w: 2,
  h: 1,
  staff: { dx: 0, dy: 1, face: 'up' },
  roles: ['marketing', 'desenvolvedor', 'gerente', 'vendedor'],
  effects: { capacity },
  description,
});

export const FURNITURE: FurnitureDef[] = [
  // --- Comuns a todos os negócios ------------------------------------------------
  {
    type: 'mesa_fundador',
    name: 'Sua mesa e computador',
    category: 'equipamento',
    segments: 'all',
    price: 0,
    w: 2,
    h: 1,
    staff: { dx: 0, dy: 1, face: 'up' },
    effects: {},
    description: 'O computador abre o sistema de gestão da empresa.',
  },
  desk('mesa_trabalho', 'Estação de trabalho', 'all', 900, 25, 'Mesa com computador para um funcionário trabalhar.'),
  {
    type: 'caixa',
    name: 'Balcão de atendimento',
    category: 'atendimento',
    segments: 'all',
    price: 1200,
    w: 2,
    h: 1,
    staff: { dx: 0, dy: -1, face: 'down' },
    customer: { dx: 1, dy: 1, face: 'up' },
    roles: ['atendente', 'vendedor'],
    effects: { satisfaction: 1 },
    description: 'Onde os clientes pagam. Um atendente aqui agiliza as vendas.',
  },
  { type: 'planta', name: 'Vaso de planta', category: 'decoracao', segments: 'all', price: 120, w: 1, h: 1, effects: { satisfaction: 1 }, description: 'Deixa o ambiente mais agradável.' },
  {
    type: 'palmeira',
    name: 'Palmeira decorativa',
    category: 'decoracao',
    segments: 'all',
    price: 350,
    w: 1,
    h: 1,
    effects: { satisfaction: 2 },
    description: 'Um toque de natureza que os clientes adoram.',
    missionUnlock: 'moveis',
  },
  { type: 'tapete', name: 'Tapete', category: 'decoracao', segments: 'all', price: 250, w: 2, h: 2, walkable: true, effects: { satisfaction: 1 }, description: 'Conforto e estilo para o piso.' },
  { type: 'luminaria', name: 'Luminária de chão', category: 'decoracao', segments: 'all', price: 220, w: 1, h: 1, effects: { satisfaction: 1 }, description: 'Ilumina o ambiente à noite.' },
  {
    type: 'sofa',
    name: 'Sofá de espera',
    category: 'atendimento',
    segments: 'all',
    price: 750,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 0, face: 'down', seat: true },
    effects: { satisfaction: 2 },
    description: 'Clientes esperam com conforto.',
  },
  { type: 'cafeteira', name: 'Máquina de café', category: 'equipamento', segments: 'all', price: 450, w: 1, h: 1, effects: { satisfaction: 1, quality: 1 }, description: 'Equipe animada e clientes bem recebidos.' },
  { type: 'bebedouro', name: 'Bebedouro', category: 'atendimento', segments: 'all', price: 280, w: 1, h: 1, effects: { satisfaction: 1 }, description: 'Água fresca para todos.' },
  {
    type: 'camera',
    name: 'Kit de gravação',
    category: 'equipamento',
    segments: 'all',
    price: 800,
    w: 1,
    h: 1,
    staff: { dx: 0, dy: 1, face: 'up' },
    roles: ['marketing'],
    effects: { conversion: 0.02 },
    description: 'Tripé, câmera e luz para gravar vídeos para as redes.',
    missionUnlock: 'campanha',
  },
  {
    type: 'letreiro',
    name: 'Letreiro neon',
    category: 'decoracao',
    segments: 'all',
    price: 1500,
    w: 2,
    h: 1,
    effects: { conversion: 0.05, satisfaction: 1 },
    description: 'Chama a atenção de quem passa na rua.',
    missionUnlock: 'expandir',
  },

  // --- Tecnologia ------------------------------------------------------------------
  { type: 'servidor', name: 'Rack de servidores', category: 'equipamento', segments: ['tecnologia'], price: 2500, w: 1, h: 1, effects: { capacity: 30, quality: 3 }, description: 'Mais estabilidade e desempenho para o produto.' },
  {
    type: 'quadro_branco',
    name: 'Quadro branco',
    category: 'equipamento',
    segments: ['tecnologia', 'educacao'],
    price: 400,
    w: 2,
    h: 1,
    staff: { dx: 0, dy: 1, face: 'up' },
    roles: ['desenvolvedor', 'gerente'],
    effects: { quality: 2 },
    description: 'Ideias organizadas viram produtos melhores.',
  },

  // --- Alimentação -----------------------------------------------------------------
  {
    type: 'fogao',
    name: 'Fogão industrial',
    category: 'producao',
    segments: ['alimentacao'],
    price: 1800,
    w: 2,
    h: 1,
    staff: { dx: 0, dy: 1, face: 'up' },
    roles: ['atendente', 'desenvolvedor', 'vendedor'],
    effects: { capacity: 80 },
    description: 'Produz mais pedidos por dia.',
  },
  {
    type: 'mesa_clientes',
    name: 'Mesa para clientes',
    category: 'atendimento',
    segments: ['alimentacao', 'entretenimento', 'lanchonete'],
    price: 450,
    w: 1,
    h: 1,
    customer: { dx: -1, dy: 0, face: 'right', seat: true },
    effects: { capacity: 15, satisfaction: 2 },
    description: 'Clientes sentam para comer com calma.',
  },
  {
    type: 'vitrine_doces',
    name: 'Balcão vitrine',
    category: 'producao',
    segments: ['alimentacao', 'lanchonete'],
    price: 1500,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 25, conversion: 0.05 },
    description: 'Produtos à mostra vendem mais.',
  },
  { type: 'geladeira', name: 'Geladeira', category: 'equipamento', segments: ['alimentacao', 'lanchonete', 'petshop'], price: 900, w: 1, h: 1, effects: { quality: 2 }, description: 'Ingredientes sempre frescos.' },

  // --- Moda ------------------------------------------------------------------------
  {
    type: 'arara',
    name: 'Arara de roupas',
    category: 'producao',
    segments: ['moda'],
    price: 700,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 45 },
    description: 'Mais peças expostas, mais vendas.',
  },
  {
    type: 'provador',
    name: 'Provador',
    category: 'atendimento',
    segments: ['moda'],
    price: 900,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { satisfaction: 3 },
    description: 'Clientes experimentam antes de comprar.',
  },
  {
    type: 'manequim',
    name: 'Manequim de vitrine',
    category: 'decoracao',
    segments: ['moda'],
    price: 600,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { conversion: 0.04 },
    description: 'Mostra os looks da coleção.',
  },
  { type: 'espelho', name: 'Espelho grande', category: 'decoracao', segments: ['moda', 'beleza', 'barbearia', 'academia'], price: 300, w: 1, h: 1, effects: { satisfaction: 1 }, description: 'Todo mundo gosta de se ver bem.' },

  // --- Beleza ----------------------------------------------------------------------
  {
    type: 'cadeira_salao',
    name: 'Cadeira de salão',
    category: 'producao',
    segments: ['beleza'],
    price: 1300,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 0, face: 'up', seat: true },
    staff: { dx: 1, dy: 0, face: 'left' },
    roles: ['atendente', 'vendedor', 'desenvolvedor'],
    effects: { capacity: 45 },
    description: 'Mais clientes atendidos ao mesmo tempo.',
  },
  { type: 'lavatorio', name: 'Lavatório', category: 'equipamento', segments: ['beleza', 'barbearia'], price: 1100, w: 1, h: 1, effects: { quality: 2 }, description: 'Serviço completo e caprichado.' },
  {
    type: 'estante_cosmeticos',
    name: 'Prateleira de produtos',
    category: 'producao',
    segments: ['beleza', 'barbearia'],
    price: 800,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 25, conversion: 0.03 },
    description: 'Venda de produtos de beleza.',
  },

  // --- Educação --------------------------------------------------------------------
  {
    type: 'carteira',
    name: 'Carteira de estudante',
    category: 'producao',
    segments: ['educacao'],
    price: 350,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 0, face: 'up', seat: true },
    effects: { capacity: 20 },
    description: 'Mais alunos por turma.',
  },
  { type: 'estante_livros', name: 'Estante de livros', category: 'equipamento', segments: ['educacao', 'tecnologia'], price: 500, w: 2, h: 1, effects: { quality: 2 }, description: 'Material de estudo de qualidade.' },
  { type: 'projetor', name: 'Projetor', category: 'equipamento', segments: ['educacao'], price: 1500, w: 1, h: 1, effects: { quality: 2, satisfaction: 1 }, description: 'Aulas mais visuais.' },

  // --- Comércio --------------------------------------------------------------------
  {
    type: 'gondola',
    name: 'Gôndola de produtos',
    category: 'producao',
    segments: ['comercio'],
    price: 900,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 60 },
    description: 'Mais variedade nas prateleiras.',
  },
  {
    type: 'geladeira_bebidas',
    name: 'Geladeira de bebidas',
    category: 'producao',
    segments: ['comercio', 'alimentacao', 'entretenimento', 'lanchonete', 'academia', 'barbearia'],
    price: 1100,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 20, conversion: 0.04 },
    description: 'Bebida gelada é compra por impulso.',
  },
  {
    type: 'cesto_ofertas',
    name: 'Cesto de ofertas',
    category: 'atendimento',
    segments: ['comercio'],
    price: 300,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { conversion: 0.03 },
    description: 'Promoções perto do caixa.',
  },

  // --- Serviços --------------------------------------------------------------------
  {
    type: 'bancada',
    name: 'Bancada de reparos',
    category: 'producao',
    segments: ['servicos', 'assistencia'],
    price: 1200,
    w: 2,
    h: 1,
    staff: { dx: 0, dy: 1, face: 'up' },
    roles: ['atendente', 'desenvolvedor', 'vendedor'],
    effects: { capacity: 45 },
    description: 'Mais aparelhos consertados por dia.',
  },
  { type: 'estante_pecas', name: 'Estante de peças', category: 'equipamento', segments: ['servicos', 'assistencia'], price: 700, w: 2, h: 1, effects: { quality: 2 }, description: 'Peças certas à mão.' },
  { type: 'painel_ferramentas', name: 'Painel de ferramentas', category: 'equipamento', segments: ['servicos', 'assistencia'], price: 500, w: 1, h: 1, effects: { quality: 2 }, description: 'Ferramentas organizadas, serviço mais rápido.' },

  // --- Entretenimento --------------------------------------------------------------
  {
    type: 'fliperama',
    name: 'Fliperama',
    category: 'producao',
    segments: ['entretenimento'],
    price: 1400,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 35 },
    description: 'Diversão garantida para os clientes.',
  },
  {
    type: 'sinuca',
    name: 'Mesa de sinuca',
    category: 'producao',
    segments: ['entretenimento'],
    price: 1600,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 30, satisfaction: 1 },
    description: 'Clientes ficam mais tempo e voltam.',
  },
  { type: 'caixa_som', name: 'Caixas de som', category: 'decoracao', segments: ['entretenimento', 'barbearia', 'academia'], price: 1200, w: 1, h: 1, effects: { conversion: 0.05 }, description: 'Música que atrai quem passa.' },

  // --- Barbearia -------------------------------------------------------------------
  {
    type: 'cadeira_barbeiro',
    name: 'Cadeira de barbeiro',
    category: 'producao',
    segments: ['barbearia'],
    price: 1400,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 0, face: 'up', seat: true },
    staff: { dx: 1, dy: 0, face: 'left' },
    roles: ['atendente', 'vendedor', 'desenvolvedor'],
    effects: { capacity: 45 },
    description: 'Clássica, reclinável e confortável: mais cortes por dia.',
  },
  {
    type: 'poste_barbeiro',
    name: 'Poste de barbearia',
    category: 'decoracao',
    segments: ['barbearia'],
    price: 450,
    w: 1,
    h: 1,
    effects: { conversion: 0.04, satisfaction: 1 },
    description: 'O símbolo listrado que avisa: aqui tem barbearia.',
  },

  // --- Assistência técnica ---------------------------------------------------------
  {
    type: 'vitrine_celulares',
    name: 'Vitrine de acessórios',
    category: 'producao',
    segments: ['assistencia'],
    price: 1000,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 25, conversion: 0.04 },
    description: 'Capas, películas e carregadores: vendas extras no balcão.',
  },

  // --- Pet shop --------------------------------------------------------------------
  {
    type: 'banho_tosa',
    name: 'Mesa de banho e tosa',
    category: 'producao',
    segments: ['petshop'],
    price: 1500,
    w: 2,
    h: 1,
    staff: { dx: 0, dy: 1, face: 'up' },
    roles: ['atendente', 'desenvolvedor', 'vendedor'],
    effects: { capacity: 50 },
    description: 'Banheira e mesa de tosa: mais pets atendidos por dia.',
  },
  {
    type: 'prateleira_racao',
    name: 'Prateleira de rações',
    category: 'producao',
    segments: ['petshop'],
    price: 900,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 1, face: 'up' },
    effects: { capacity: 40 },
    description: 'Rações, petiscos e brinquedos à venda.',
  },
  { type: 'casinha_pet', name: 'Casinha de cachorro', category: 'decoracao', segments: ['petshop'], price: 400, w: 1, h: 1, effects: { satisfaction: 2 }, description: 'Os pets (e os donos) adoram.' },

  // --- Academia --------------------------------------------------------------------
  {
    type: 'esteira',
    name: 'Esteira',
    category: 'producao',
    segments: ['academia'],
    price: 1600,
    w: 1,
    h: 1,
    customer: { dx: 0, dy: 0, face: 'up', seat: true, pose: 'walk-up' },
    effects: { capacity: 35 },
    description: 'Aeróbico para os alunos: mais gente treinando ao mesmo tempo.',
  },
  {
    type: 'supino',
    name: 'Banco de supino',
    category: 'producao',
    segments: ['academia'],
    price: 1300,
    w: 2,
    h: 1,
    customer: { dx: 0, dy: 0, face: 'down', seat: true, pose: 'cheer' },
    effects: { capacity: 30 },
    description: 'Musculação completa com barra e anilhas.',
  },
  { type: 'rack_halteres', name: 'Suporte de halteres', category: 'equipamento', segments: ['academia'], price: 900, w: 2, h: 1, effects: { quality: 3 }, description: 'Pesos variados para todos os níveis.' },

  // --- Lanchonete ------------------------------------------------------------------
  {
    type: 'chapa',
    name: 'Chapa de lanches',
    category: 'producao',
    segments: ['lanchonete'],
    price: 1700,
    w: 2,
    h: 1,
    staff: { dx: 0, dy: 1, face: 'up' },
    roles: ['atendente', 'desenvolvedor', 'vendedor'],
    effects: { capacity: 80 },
    description: 'Hambúrgueres e lanches saindo sem parar.',
  },
];

export function getFurniture(type: string): FurnitureDef | undefined {
  return FURNITURE.find((f) => f.type === type);
}

export function catalogFor(segment: SegmentId): FurnitureDef[] {
  return FURNITURE.filter((f) => f.type !== 'mesa_fundador' && (f.segments === 'all' || f.segments.includes(segment)));
}

/** Móveis iniciais do escritório, por tipo de negócio (coordenadas do piso). */
export function starterLayout(segment: SegmentId): { type: string; x: number; y: number }[] {
  const base = [
    { type: 'mesa_fundador', x: 1, y: 0 },
    { type: 'caixa', x: 6, y: 3 },
    { type: 'planta', x: 0, y: 0 },
  ];
  const extra: Record<SegmentId, { type: string; x: number; y: number }[]> = {
    tecnologia: [{ type: 'quadro_branco', x: 5, y: 0 }],
    alimentacao: [
      { type: 'fogao', x: 5, y: 0 },
      { type: 'mesa_clientes', x: 2, y: 4 },
    ],
    moda: [{ type: 'arara', x: 5, y: 0 }],
    beleza: [{ type: 'cadeira_salao', x: 5, y: 1 }],
    educacao: [
      { type: 'carteira', x: 2, y: 3 },
      { type: 'carteira', x: 3, y: 3 },
    ],
    comercio: [{ type: 'gondola', x: 5, y: 0 }],
    servicos: [{ type: 'bancada', x: 5, y: 0 }],
    entretenimento: [{ type: 'fliperama', x: 5, y: 0 }],
    barbearia: [
      { type: 'cadeira_barbeiro', x: 4, y: 1 },
      { type: 'poste_barbeiro', x: 8, y: 0 },
    ],
    assistencia: [{ type: 'bancada', x: 5, y: 0 }],
    petshop: [{ type: 'banho_tosa', x: 5, y: 0 }],
    academia: [
      { type: 'esteira', x: 5, y: 0 },
      { type: 'esteira', x: 6, y: 0 },
    ],
    lanchonete: [
      { type: 'chapa', x: 5, y: 0 },
      { type: 'mesa_clientes', x: 2, y: 4 },
    ],
  };
  return [...base, ...extra[segment]];
}

export interface FurnitureTotals {
  capacity: number;
  satisfaction: number;
  quality: number;
  conversion: number;
}

/** Soma dos efeitos dos móveis (com limites para não desequilibrar a economia). */
export function furnitureTotals(items: { type: string }[]): FurnitureTotals {
  const t = { capacity: 0, satisfaction: 0, quality: 0, conversion: 0 };
  for (const item of items) {
    const def = getFurniture(item.type);
    if (!def) continue;
    t.capacity += def.effects.capacity ?? 0;
    t.satisfaction += def.effects.satisfaction ?? 0;
    t.quality += def.effects.quality ?? 0;
    t.conversion += def.effects.conversion ?? 0;
  }
  return {
    capacity: t.capacity,
    satisfaction: Math.min(10, t.satisfaction),
    quality: Math.min(10, t.quality),
    conversion: Math.min(0.2, t.conversion),
  };
}

/** Tamanho do piso do escritório por nível de infraestrutura. */
export const ROOM_SIZES: { w: number; h: number }[] = [
  { w: 9, h: 6 },
  { w: 12, h: 8 },
  { w: 15, h: 9 },
  { w: 18, h: 10 },
  { w: 21, h: 11 },
];
