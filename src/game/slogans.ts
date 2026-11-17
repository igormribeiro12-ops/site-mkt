// Gerador local de slogans: combina o nome da empresa com vocabulário do segmento.

import type { SegmentId } from './types';

export interface Vocabulary {
  nouns: string[];
  benefits: string[];
  pains: string[];
  promises: string[];
  actions: string[];
  artOf: string[];
  moments: string[];
}

const VOCAB: Record<SegmentId, Vocabulary> = {
  tecnologia: {
    nouns: ['a tecnologia', 'a inovação', 'a solução digital'],
    benefits: ['praticidade', 'inovação', 'agilidade', 'conexão', 'eficiência'],
    pains: ['complicação', 'burocracia', 'espera'],
    promises: ['simplifica a sua rotina', 'conecta você ao futuro', 'resolve em poucos cliques', 'transforma ideias em realidade'],
    actions: ['Simplifique sua rotina', 'Conecte suas ideias', 'Acelere seus resultados', 'Inove todos os dias'],
    artOf: ['simplificar o complexo', 'resolver problemas', 'se conectar'],
    moments: ['em cada clique', 'no seu dia a dia', 'na palma da mão'],
  },
  alimentacao: {
    nouns: ['o sabor', 'a receita', 'a comida'],
    benefits: ['sabor', 'carinho', 'qualidade', 'frescor', 'tempero'],
    pains: ['pressa', 'fome', 'comida sem graça'],
    promises: ['abraça o seu dia', 'traz o gostinho de casa', 'deixa tudo mais gostoso', 'transforma qualquer momento em festa'],
    actions: ['Saboreie cada momento', 'Experimente o melhor sabor', 'Mate a fome com carinho', 'Prove e se apaixone'],
    artOf: ['cozinhar com carinho', 'transformar ingredientes em bons momentos', 'servir bem'],
    moments: ['em cada mordida', 'a cada garfada', 'em cada receita'],
  },
  moda: {
    nouns: ['o estilo', 'a moda', 'a peça certa'],
    benefits: ['estilo', 'atitude', 'conforto', 'personalidade', 'autenticidade'],
    pains: ['mesmice', 'roupa sem graça', 'desconforto'],
    promises: ['revela quem você é', 'combina com a sua história', 'veste a sua personalidade', 'acompanha o seu ritmo'],
    actions: ['Vista sua personalidade', 'Mostre seu estilo', 'Use o que você é', 'Seja autêntico'],
    artOf: ['vestir-se bem', 'expressar quem você é', 'criar estilo'],
    moments: ['em cada detalhe', 'em cada look', 'do jeito que você é'],
  },
  beleza: {
    nouns: ['a beleza', 'o cuidado', 'a autoestima'],
    benefits: ['autoestima', 'cuidado', 'brilho', 'confiança', 'leveza'],
    pains: ['estresse', 'insegurança', 'correria'],
    promises: ['realça o que você tem de melhor', 'cuida de você', 'valoriza a sua essência', 'renova a sua autoestima'],
    actions: ['Realce sua beleza natural', 'Valorize o que é seu', 'Cuide de você', 'Brilhe do seu jeito'],
    artOf: ['cuidar de você', 'realçar a sua essência', 'se sentir bem'],
    moments: ['em cada detalhe', 'todos os dias', 'do seu jeito'],
  },
  educacao: {
    nouns: ['o conhecimento', 'a educação', 'o aprendizado'],
    benefits: ['conhecimento', 'aprendizado', 'oportunidades', 'futuro', 'confiança'],
    pains: ['dúvidas', 'limites', 'medo de errar'],
    promises: ['abre portas para o futuro', 'transforma vidas', 'prepara você para o amanhã', 'torna o aprender mais fácil'],
    actions: ['Aprenda sem limites', 'Descubra o seu potencial', 'Evolua todos os dias', 'Construa o seu futuro'],
    artOf: ['aprender com propósito', 'ensinar com paixão', 'transformar conhecimento em oportunidade'],
    moments: ['a cada aula', 'em cada conquista', 'passo a passo'],
  },
  comercio: {
    nouns: ['a loja', 'a escolha certa', 'a oferta'],
    benefits: ['variedade', 'economia', 'praticidade', 'qualidade', 'confiança'],
    pains: ['dor de cabeça', 'preço alto', 'espera'],
    promises: ['tem tudo o que você procura', 'cabe no seu bolso', 'facilita as suas compras', 'entrega o que promete'],
    actions: ['Encontre tudo em um só lugar', 'Compre com confiança', 'Economize sem abrir mão da qualidade', 'Escolha bem'],
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
    promises: ['transforma momentos em memórias', 'tira você da rotina', 'faz o coração acelerar', 'junta a galera'],
    actions: ['Viva momentos inesquecíveis', 'Divirta-se sem limites', 'Saia da rotina', 'Chame a galera'],
    artOf: ['criar momentos inesquecíveis', 'divertir', 'emocionar'],
    moments: ['a cada momento', 'do início ao fim', 'em cada encontro'],
  },
  barbearia: {
    nouns: ['o corte', 'o estilo', 'a barba feita'],
    benefits: ['estilo', 'precisão', 'atitude', 'cuidado', 'bom papo'],
    pains: ['cabelo rebelde', 'barba malfeita', 'espera'],
    promises: ['deixa você no estilo', 'cuida do seu visual', 'acerta no corte', 'renova o seu visual'],
    actions: ['Renove seu estilo', 'Cuide do seu visual', 'Saia na régua', 'Agende seu corte'],
    artOf: ['cortar com precisão', 'cuidar do seu estilo', 'deixar tudo na régua'],
    moments: ['em cada corte', 'na navalha', 'toda semana'],
  },
  assistencia: {
    nouns: ['o conserto', 'a solução', 'o reparo'],
    benefits: ['agilidade', 'confiança', 'garantia', 'preço justo', 'transparência'],
    pains: ['tela quebrada', 'aparelho parado', 'dor de cabeça'],
    promises: ['devolve o seu aparelho novinho', 'resolve no mesmo dia', 'conserta com garantia', 'traz o seu celular de volta à vida'],
    actions: ['Conserte sem complicação', 'Recupere seu aparelho', 'Deixe com quem entende', 'Volte a se conectar'],
    artOf: ['consertar com cuidado', 'resolver rápido', 'dar vida nova aos aparelhos'],
    moments: ['no mesmo dia', 'com garantia', 'sempre que precisar'],
  },
  petshop: {
    nouns: ['o carinho', 'o cuidado pet', 'o banho caprichado'],
    benefits: ['carinho', 'cuidado', 'cheirinho bom', 'saúde', 'alegria'],
    pains: ['pelo embaraçado', 'pet estressado', 'preocupação'],
    promises: ['cuida do seu melhor amigo', 'trata seu pet como família', 'deixa seu pet feliz', 'devolve seu pet cheiroso e feliz'],
    actions: ['Mime seu pet', 'Cuide de quem te ama', 'Traga seu melhor amigo', 'Dê o melhor para o seu pet'],
    artOf: ['cuidar de quem tem quatro patas', 'mimar os pets', 'fazer o rabinho abanar'],
    moments: ['em cada banho', 'com muito carinho', 'em cada lambida'],
  },
  academia: {
    nouns: ['o treino', 'a saúde', 'a energia'],
    benefits: ['saúde', 'energia', 'disciplina', 'motivação', 'resultado'],
    pains: ['sedentarismo', 'cansaço', 'desânimo'],
    promises: ['tira você do sofá', 'transforma o seu corpo e a sua mente', 'faz você superar limites', 'mostra resultado de verdade'],
    actions: ['Supere seus limites', 'Comece hoje', 'Treine com propósito', 'Sinta a diferença'],
    artOf: ['treinar com prazer', 'superar limites', 'viver com saúde'],
    moments: ['a cada treino', 'todos os dias', 'repetição por repetição'],
  },
  lanchonete: {
    nouns: ['o lanche', 'o hambúrguer', 'o sabor'],
    benefits: ['sabor', 'suculência', 'fome saciada', 'capricho', 'preço justo'],
    pains: ['fome', 'lanche sem graça', 'demora'],
    promises: ['mata a sua fome com sabor', 'é feito na hora', 'deixa saudade', 'junta a galera em volta da mesa'],
    actions: ['Mate a fome com estilo', 'Peça o seu agora', 'Experimente o mais pedido', 'Morda sem moderação'],
    artOf: ['fazer o lanche perfeito', 'caprichar no recheio', 'servir na hora'],
    moments: ['em cada mordida', 'feito na hora', 'a qualquer hora'],
  },
};

type Parts = { name: string; noun: string; b1: string; b2: string; b3: string; pain: string; promise: string; action: string; artOf: string; moment: string };
type Template = (p: Parts) => string | null;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const TEMPLATES: Template[] = [
  (p) => (p.name ? `${p.name}: ${p.noun} que ${p.promise}.` : null),
  (p) => `Mais ${p.b1}, menos ${p.pain}.`,
  (p) => (p.name ? `${p.action} com ${p.name}.` : null),
  (p) => (p.name ? `${p.name}. ${cap(p.b1)} ${p.moment}.` : null),
  (p) => (p.name ? `${cap(p.b1)}, ${p.b2} e ${p.b3}. Isso é ${p.name}.` : null),
  (p) => (p.name ? `Pensou em ${p.b1}, pensou ${p.name}.` : null),
  (p) => (p.name ? `${p.name}: feito com ${p.b1} e ${p.b2}.` : null),
  (p) => `O novo jeito de ${p.artOf}.`,
  (p) => (p.name ? `${p.name}. A arte de ${p.artOf}.` : null),
  (p) => (p.name ? `Ninguém faz como ${p.name}.` : null),
  (p) => `${cap(p.noun)} que ${p.promise}.`,
];

function pick<T>(list: T[], rnd: () => number): T {
  return list[Math.floor(rnd() * list.length) % list.length];
}

function shuffle<T>(list: T[], rnd: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Vocabulário do segmento (usado também pelo assistente de ideias). */
export function vocabFor(segment: SegmentId): Vocabulary {
  return VOCAB[segment];
}

export function generateSlogans(name: string, segment: SegmentId | '', count = 4, rnd: () => number = Math.random): string[] {
  const v = VOCAB[segment || 'servicos'];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of shuffle(TEMPLATES, rnd)) {
    if (out.length >= count) break;
    const b = shuffle(v.benefits, rnd);
    const text = t({
      name: name.trim(),
      noun: pick(v.nouns, rnd),
      b1: b[0],
      b2: b[1],
      b3: b[2],
      pain: pick(v.pains, rnd),
      promise: pick(v.promises, rnd),
      action: pick(v.actions, rnd),
      artOf: pick(v.artOf, rnd),
      moment: pick(v.moments, rnd),
    });
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      out.push(text);
    }
  }
  return out;
}
