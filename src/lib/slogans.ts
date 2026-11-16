// Gerador de slogans baseado em regras e modelos locais (sem APIs externas).
// Combina o nome da empresa, o segmento, o estilo da marca e os interesses
// do público com frases-modelo em português.

import type { BrandStyleId, SegmentId } from '../types';

interface SegmentVocabulary {
  /** Substantivos com artigo, usados em "X: a tecnologia que ...". */
  nouns: string[];
  benefits: string[];
  pains: string[];
  /** Frases verbais na 3ª pessoa, usadas após "que". */
  promises: string[];
  /** Frases no imperativo. */
  actions: string[];
  /** Frases no infinitivo, usadas após "de" / "para". */
  artOf: string[];
  moments: string[];
}

const VOCABULARY: Record<SegmentId, SegmentVocabulary> = {
  tecnologia: {
    nouns: ['a tecnologia', 'a inovação', 'a solução digital'],
    benefits: ['praticidade', 'inovação', 'agilidade', 'conexão', 'eficiência'],
    pains: ['complicação', 'burocracia', 'espera', 'dor de cabeça'],
    promises: [
      'simplifica a sua rotina',
      'conecta você ao futuro',
      'resolve em poucos cliques',
      'transforma ideias em realidade',
    ],
    actions: ['Simplifique sua rotina', 'Conecte suas ideias', 'Acelere seus resultados', 'Inove todos os dias'],
    artOf: ['simplificar o complexo', 'resolver problemas', 'se conectar'],
    moments: ['em cada clique', 'no seu dia a dia', 'na palma da mão'],
  },
  alimentacao: {
    nouns: ['o sabor', 'a receita', 'a comida'],
    benefits: ['sabor', 'carinho', 'qualidade', 'frescor', 'tempero'],
    pains: ['pressa', 'fome', 'comida sem graça'],
    promises: [
      'abraça o seu dia',
      'traz o gostinho de casa',
      'transforma qualquer momento em festa',
      'deixa tudo mais gostoso',
    ],
    actions: ['Saboreie cada momento', 'Experimente o melhor sabor', 'Mate a fome com carinho', 'Prove e se apaixone'],
    artOf: ['cozinhar com carinho', 'transformar ingredientes em momentos', 'servir bem'],
    moments: ['em cada mordida', 'a cada garfada', 'em cada receita'],
  },
  moda: {
    nouns: ['o estilo', 'a moda', 'a peça'],
    benefits: ['estilo', 'atitude', 'conforto', 'personalidade', 'autenticidade'],
    pains: ['mesmice', 'roupa sem graça', 'desconforto'],
    promises: [
      'revela quem você é',
      'combina com a sua história',
      'veste a sua personalidade',
      'acompanha o seu ritmo',
    ],
    actions: ['Vista sua personalidade', 'Mostre seu estilo', 'Use o que você é', 'Seja autêntico'],
    artOf: ['vestir-se bem', 'expressar quem você é', 'criar estilo'],
    moments: ['em cada detalhe', 'em cada look', 'do jeito que você é'],
  },
  beleza: {
    nouns: ['a beleza', 'o cuidado', 'a autoestima'],
    benefits: ['autoestima', 'cuidado', 'brilho', 'confiança', 'leveza'],
    pains: ['estresse', 'insegurança', 'correria'],
    promises: [
      'realça o que você tem de melhor',
      'cuida de você',
      'valoriza a sua essência',
      'renova a sua autoestima',
    ],
    actions: ['Realce sua beleza natural', 'Valorize o que é seu', 'Cuide de você', 'Brilhe do seu jeito'],
    artOf: ['cuidar de você', 'realçar a sua essência', 'se sentir bem'],
    moments: ['em cada detalhe', 'todos os dias', 'do seu jeito'],
  },
  educacao: {
    nouns: ['o conhecimento', 'a educação', 'o aprendizado'],
    benefits: ['conhecimento', 'aprendizado', 'oportunidades', 'futuro', 'confiança'],
    pains: ['dúvidas', 'limites', 'medo de errar'],
    promises: [
      'abre portas para o futuro',
      'transforma vidas',
      'prepara você para o amanhã',
      'torna o aprender mais fácil',
    ],
    actions: ['Aprenda sem limites', 'Descubra o seu potencial', 'Evolua todos os dias', 'Construa o seu futuro'],
    artOf: ['aprender com propósito', 'ensinar com paixão', 'transformar conhecimento em oportunidade'],
    moments: ['a cada aula', 'em cada conquista', 'passo a passo'],
  },
  saude: {
    nouns: ['o cuidado', 'a saúde', 'o bem-estar'],
    benefits: ['bem-estar', 'saúde', 'equilíbrio', 'energia', 'qualidade de vida'],
    pains: ['estresse', 'cansaço', 'preocupação'],
    promises: [
      'cuida de você por inteiro',
      'coloca você em movimento',
      'faz bem para o corpo e a mente',
      'acompanha cada passo da sua saúde',
    ],
    actions: ['Cuide de você', 'Viva com mais energia', 'Movimente-se', 'Priorize seu bem-estar'],
    artOf: ['cuidar de você', 'viver bem', 'ter equilíbrio'],
    moments: ['todos os dias', 'em cada passo', 'em cada fase da vida'],
  },
  comercio: {
    nouns: ['a loja', 'a escolha certa', 'a oferta'],
    benefits: ['variedade', 'economia', 'praticidade', 'qualidade', 'confiança'],
    pains: ['dor de cabeça', 'preço alto', 'espera'],
    promises: [
      'tem tudo o que você procura',
      'cabe no seu bolso',
      'facilita as suas compras',
      'entrega o que promete',
    ],
    actions: [
      'Encontre tudo em um só lugar',
      'Compre com confiança',
      'Economize sem abrir mão da qualidade',
      'Escolha bem',
    ],
    artOf: ['escolher bem', 'comprar com confiança', 'economizar'],
    moments: ['perto de você', 'todos os dias', 'em cada compra'],
  },
  servicos: {
    nouns: ['a solução', 'o serviço', 'o atendimento'],
    benefits: ['confiança', 'agilidade', 'qualidade', 'tranquilidade', 'compromisso'],
    pains: ['dor de cabeça', 'preocupação', 'espera'],
    promises: ['resolve para você', 'chega na hora certa', 'faz bem feito', 'cuida do que importa'],
    actions: ['Deixe com quem entende', 'Resolva sem complicação', 'Conte com a gente', 'Ganhe tempo'],
    artOf: ['fazer bem feito', 'resolver problemas', 'atender bem'],
    moments: ['sempre que você precisar', 'em cada detalhe', 'do começo ao fim'],
  },
  entretenimento: {
    nouns: ['a diversão', 'a experiência', 'a emoção'],
    benefits: ['diversão', 'emoção', 'alegria', 'energia', 'boas histórias'],
    pains: ['tédio', 'rotina', 'mesmice'],
    promises: [
      'transforma momentos em memórias',
      'tira você da rotina',
      'faz o coração acelerar',
      'junta a galera',
    ],
    actions: ['Viva momentos inesquecíveis', 'Divirta-se sem limites', 'Saia da rotina', 'Chame a galera'],
    artOf: ['criar momentos inesquecíveis', 'divertir', 'emocionar'],
    moments: ['a cada momento', 'do início ao fim', 'em cada encontro'],
  },
  outros: {
    nouns: ['a solução', 'a ideia', 'a escolha'],
    benefits: ['qualidade', 'confiança', 'criatividade', 'praticidade', 'inovação'],
    pains: ['complicação', 'mesmice', 'dor de cabeça'],
    promises: ['faz a diferença', 'pensa em você', 'transforma o seu dia', 'vai além do comum'],
    actions: ['Faça diferente', 'Descubra o novo', 'Vá além', 'Escolha o melhor para você'],
    artOf: ['fazer diferente', 'surpreender', 'inovar'],
    moments: ['em cada detalhe', 'todos os dias', 'do seu jeito'],
  },
};

export interface SloganContext {
  companyName: string;
  segment: SegmentId | '';
  style: BrandStyleId | '';
  interests?: string[];
}

type Random = () => number;

interface Parts {
  name: string;
  noun: string;
  b1: string;
  b2: string;
  b3: string;
  pain: string;
  promise: string;
  action: string;
  artOf: string;
  moment: string;
  interest: string;
}

/** Cada modelo devolve null quando faltam dados para montá-lo. */
type Template = (p: Parts) => string | null;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const GENERIC_TEMPLATES: Template[] = [
  (p) => (p.name ? `${p.name}: ${p.noun} que ${p.promise}.` : null),
  (p) => `Mais ${p.b1}, menos ${p.pain}.`,
  (p) => (p.name ? `${p.action} com ${p.name}.` : null),
  (p) => (p.name ? `${p.name}. ${cap(p.b1)} ${p.moment}.` : null),
  (p) => (p.name ? `${cap(p.b1)}, ${p.b2} e ${p.b3}. Isso é ${p.name}.` : null),
  (p) => (p.name ? `Pensou em ${p.b1}, pensou ${p.name}.` : null),
  (p) => (p.name ? `Com ${p.name}, ${p.artOf} ficou mais fácil.` : null),
  (p) => (p.name && p.interest ? `${p.name}: feito para quem ama ${p.interest}.` : null),
  (p) => `${cap(p.noun)} que ${p.promise}.`,
  (p) => `${p.action}. ${cap(p.b1)} ${p.moment}.`,
];

const STYLE_TEMPLATES: Record<BrandStyleId, Template[]> = {
  moderno: [
    (p) => `O novo jeito de ${p.artOf}.`,
    (p) => (p.name ? `${p.name}: ${p.b1} para o mundo de hoje.` : null),
  ],
  minimalista: [
    (p) => `Simplesmente ${p.b1}.`,
    (p) => (p.name ? `${p.name}. Menos excesso, mais ${p.b1}.` : null),
  ],
  divertido: [
    (p) => (p.name ? `Partiu ${p.name}!` : null),
    (p) => (p.name ? `${p.name}: ${p.b1} que contagia!` : null),
    (p) => `Bora de ${p.b1}? Bora com a gente!`,
  ],
  elegante: [
    (p) => (p.name ? `${p.name}. A arte de ${p.artOf}.` : null),
    (p) => `O requinte de ${p.artOf}.`,
  ],
  tecnologico: [
    (p) => (p.name ? `${p.name}: ${p.b1} em outro nível.` : null),
    (p) => `Inteligência para ${p.artOf}.`,
  ],
  natural: [
    (p) => (p.name ? `Naturalmente ${p.name}.` : null),
    (p) => (p.name ? `${p.name}: ${p.b1} de forma natural.` : null),
  ],
  ousado: [
    (p) => (p.name ? `Ninguém faz como ${p.name}.` : null),
    (p) => `${p.action.toUpperCase()}.`,
    (p) => (p.name ? `${p.name}. Sem medo de ${p.artOf}.` : null),
  ],
  classico: [
    (p) => (p.name ? `${p.name}: tradição em ${p.b1}.` : null),
    () => 'Confiança que atravessa gerações.',
  ],
};

function pick<T>(list: T[], random: Random): T {
  return list[Math.floor(random() * list.length) % list.length];
}

function shuffle<T>(list: T[], random: Random): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildParts(ctx: SloganContext, random: Random): Parts {
  const vocab = VOCABULARY[ctx.segment || 'outros'];
  const benefits = shuffle(vocab.benefits, random);
  const interests = (ctx.interests ?? []).map((i) => i.trim()).filter(Boolean);
  return {
    name: ctx.companyName.trim(),
    noun: pick(vocab.nouns, random),
    b1: benefits[0],
    b2: benefits[1],
    b3: benefits[2],
    pain: pick(vocab.pains, random),
    promise: pick(vocab.promises, random),
    action: pick(vocab.actions, random),
    artOf: pick(vocab.artOf, random),
    moment: pick(vocab.moments, random),
    interest: interests.length > 0 ? pick(interests, random).toLowerCase() : '',
  };
}

/** Gera sugestões de slogan únicas. Cada chamada produz combinações diferentes. */
export function generateSlogans(ctx: SloganContext, count = 6, random: Random = Math.random): string[] {
  const styleTemplates = ctx.style ? STYLE_TEMPLATES[ctx.style] : [];
  const results: string[] = [];
  const seen = new Set<string>();

  const tryAdd = (template: Template) => {
    const text = template(buildParts(ctx, random));
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    results.push(text);
  };

  // Até 2 sugestões no tom do estilo escolhido, depois modelos gerais.
  shuffle(styleTemplates, random)
    .slice(0, 2)
    .forEach(tryAdd);

  for (const template of shuffle(GENERIC_TEMPLATES, random)) {
    if (results.length >= count) break;
    tryAdd(template);
  }

  // Se ainda faltarem sugestões, tenta novas combinações.
  let attempts = 0;
  const all = [...styleTemplates, ...GENERIC_TEMPLATES];
  while (results.length < count && attempts < 40) {
    tryAdd(pick(all, random));
    attempts++;
  }

  return results.slice(0, count);
}
