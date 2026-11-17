// Assistente de ideias (local, sem internet): sugere nome, produto, descrição e
// diferencial a partir do tipo de negócio, do que o jogador já escreveu e do
// vocabulário de cada segmento.

import { generateSlogans, vocabFor } from './slogans';
import type { Gender, SegmentId } from './types';

interface IdeaKit {
  /** Palavras para montar nomes: "Primeira Segunda". */
  first: string[];
  second: string[];
  /** Nomes inventados (marcas curtas). */
  coined: string[];
  /** Palavra do ramo para "X da Ana". */
  trade: string[];
  products: string[];
  audiences: string[];
  differentials: string[];
  /** Como o negócio se apresenta: "uma lanchonete", "um pet shop"... */
  kind: string;
}

const KITS: Record<SegmentId, IdeaKit> = {
  tecnologia: {
    first: ['Nexa', 'Pixel', 'Byte', 'Nuvem', 'Código', 'Click'],
    second: ['Labs', 'Tech', 'Digital', 'Hub', 'Studio', 'Soluções'],
    coined: ['Nexora', 'Zuppi', 'Codix', 'Tekko', 'Lumio', 'Vexa'],
    trade: ['Tech', 'Apps', 'Sistemas'],
    products: ['App de organização de estudos', 'Criação de sites para pequenos negócios', 'Sistema de agendamento on-line', 'Acessórios para celular e computador', 'Automação de atendimento no WhatsApp', 'Aplicativo de delivery do bairro'],
    audiences: ['estudantes e jovens profissionais', 'pequenos negócios do bairro', 'quem quer resolver tudo pelo celular', 'empresas que querem vender on-line'],
    differentials: ['Suporte humano em minutos, não em dias', 'Tudo funciona no celular, sem instalar nada', 'Preço fixo mensal, sem surpresas', 'Treinamento gratuito para quem compra', 'Atualizações toda semana com ideias dos clientes', 'Dados protegidos e transparência total'],
    kind: 'uma empresa de tecnologia',
  },
  alimentacao: {
    first: ['Sabor', 'Cantinho', 'Tempero', 'Panela', 'Forno', 'Delícia'],
    second: ['da Vila', 'Caseiro', 'da Casa', 'Mineiro', 'do Chef', 'Express'],
    coined: ['Saborê', 'Temperê', 'Panelinha', 'Gostosura', 'Fornalha', 'Quitutê'],
    trade: ['Cozinha', 'Marmitas', 'Doces'],
    products: ['Marmitas caseiras por encomenda', 'Brigadeiros gourmet', 'Almoço executivo', 'Bolos de pote', 'Comida saudável congelada', 'Salgados para festas'],
    audiences: ['quem trabalha e tem pouco tempo', 'famílias do bairro', 'quem busca comida caseira de verdade', 'quem quer comer bem gastando pouco'],
    differentials: ['Receitas de família feitas no dia', 'Entrega rápida no bairro em até 40 minutos', 'Ingredientes frescos de produtores locais', 'Cardápio novo toda semana', 'Opções sem glúten e vegetarianas', 'Porções generosas com preço justo'],
    kind: 'um negócio de comida',
  },
  moda: {
    first: ['Vibe', 'Estilo', 'Trama', 'Linha', 'Closet', 'Urban'],
    second: ['Store', 'Moda', 'Ateliê', 'Wear', 'Concept', 'Collection'],
    coined: ['Vestê', 'Modalê', 'Tramma', 'Lookê', 'Vistta', 'Urbê'],
    trade: ['Ateliê', 'Moda', 'Closet'],
    products: ['Camisetas com estampas autorais', 'Moda feminina plus size', 'Roupas de brechó selecionadas', 'Tênis e acessórios urbanos', 'Moda praia', 'Bolsas artesanais'],
    audiences: ['jovens que gostam de mostrar seu estilo', 'quem procura roupas confortáveis e bonitas', 'quem valoriza moda sustentável', 'quem quer se vestir bem sem gastar muito'],
    differentials: ['Peças exclusivas em pequenas coleções', 'Troca fácil e sem burocracia', 'Tecidos sustentáveis e produção local', 'Provador virtual pelo WhatsApp', 'Todos os tamanhos, do PP ao G4', 'Coleções novas todo mês'],
    kind: 'uma marca de moda',
  },
  beleza: {
    first: ['Bella', 'Glow', 'Essência', 'Flor', 'Brilho', 'Pura'],
    second: ['Beauty', 'Estética', 'Spa', 'Cosméticos', 'Studio', 'Natural'],
    coined: ['Bellune', 'Glowê', 'Lumina', 'Essê', 'Floryn', 'Belíssima'],
    trade: ['Studio', 'Estética', 'Beauty'],
    products: ['Kit de skincare natural', 'Design de sobrancelhas', 'Manicure e pedicure', 'Maquiagem para eventos', 'Tratamentos faciais', 'Cosméticos veganos'],
    audiences: ['quem quer se cuidar sem gastar muito', 'noivas e madrinhas', 'quem prefere produtos naturais', 'quem tem pouco tempo para se cuidar'],
    differentials: ['Produtos naturais e veganos', 'Atendimento com hora marcada, sem espera', 'Profissionais certificadas', 'Ambiente acolhedor com café e música', 'Avaliação gratuita antes do serviço', 'Pacotes mensais com desconto'],
    kind: 'um espaço de beleza',
  },
  educacao: {
    first: ['Saber', 'Mente', 'Aprender', 'Futuro', 'Passo', 'Ideia'],
    second: ['Cursos', 'Academy', 'Educação', 'Escola', 'Mais', 'Prime'],
    coined: ['Sabedê', 'Mentora', 'Aprendê', 'Educa+', 'Estudê', 'Cognita'],
    trade: ['Cursos', 'Aulas', 'Escola'],
    products: ['Curso preparatório on-line', 'Aulas de reforço escolar', 'Curso de inglês para conversação', 'Aulas de programação para jovens', 'Mentoria para o Enem', 'Curso de Excel e informática'],
    audiences: ['estudantes que vão prestar vestibular', 'pais que querem ajudar os filhos', 'adultos que querem mudar de carreira', 'jovens buscando o primeiro emprego'],
    differentials: ['Turmas pequenas com atenção individual', 'Aulas gravadas para assistir quando quiser', 'Professores que já passaram pela mesma prova', 'Garantia: se não gostar, devolvemos o dinheiro', 'Material didático incluso', 'Simulados semanais com correção'],
    kind: 'uma escola',
  },
  comercio: {
    first: ['Mega', 'Ponto', 'Casa', 'Empório', 'Bazar', 'Mercadinho'],
    second: ['Center', 'Shop', 'do Bairro', 'Variedades', 'Store', 'Mix'],
    coined: ['Comprê', 'Varejão', 'Pontix', 'Bazzar', 'Lojinha+', 'Achadê'],
    trade: ['Empório', 'Loja', 'Bazar'],
    products: ['Loja on-line de presentes criativos', 'Mercadinho de bairro', 'Utilidades para casa', 'Papelaria e presentes', 'Produtos naturais a granel', 'Brinquedos educativos'],
    audiences: ['famílias do bairro', 'quem compara preços antes de comprar', 'quem quer praticidade nas compras', 'quem procura presentes diferentes'],
    differentials: ['Entrega no mesmo dia no bairro', 'Preço baixo garantido', 'Variedade que você não acha no shopping', 'Pagamento facilitado em até 6 vezes', 'Clube de vantagens para clientes fiéis', 'Atendimento pelo WhatsApp, com foto do produto'],
    kind: 'uma loja',
  },
  servicos: {
    first: ['Pronto', 'Ágil', 'Mão Amiga', 'Solução', 'Casa', 'Total'],
    second: ['Serviços', 'Express', 'Fácil', 'Já', 'Pro', 'Resolve'],
    coined: ['Resolvê', 'Prontix', 'Agilize', 'Faztudo', 'Servix', 'Ajudaí'],
    trade: ['Serviços', 'Soluções', 'Reformas'],
    products: ['Limpeza residencial por assinatura', 'Pequenos reparos em casa', 'Consultoria para pequenos negócios', 'Entregas rápidas no bairro', 'Montagem de móveis', 'Jardinagem e paisagismo'],
    audiences: ['famílias sem tempo', 'idosos que precisam de ajuda de confiança', 'pequenos negócios do bairro', 'quem acabou de se mudar'],
    differentials: ['Profissionais avaliados e de confiança', 'Orçamento grátis em até 1 hora', 'Garantia de 90 dias no serviço', 'Atendimento também aos fins de semana', 'Preço fechado antes de começar', 'Equipe uniformizada e pontual'],
    kind: 'uma empresa de serviços',
  },
  entretenimento: {
    first: ['Arena', 'Planeta', 'Zona', 'Fábrica', 'Mundo', 'Casa'],
    second: ['Fun', 'Play', 'da Diversão', 'Games', 'Experience', 'Festa'],
    coined: ['Divertê', 'Playlândia', 'Funzone', 'Festix', 'Jogaí', 'Emoção+'],
    trade: ['Games', 'Festas', 'Experiências'],
    products: ['Sala de escape (escape room)', 'Festas infantis temáticas', 'Arena de games', 'Karaokê com amigos', 'Noite de jogos de tabuleiro', 'Passeios e experiências guiadas'],
    audiences: ['grupos de amigos', 'famílias com crianças', 'empresas em busca de integração de equipe', 'quem quer sair da rotina'],
    differentials: ['Temas novos todo mês', 'Fotos e vídeos da experiência de presente', 'Pacotes para aniversários e empresas', 'Ambiente seguro para todas as idades', 'Reserva on-line em 1 minuto', 'Preço especial para grupos'],
    kind: 'um espaço de diversão',
  },
  barbearia: {
    first: ['Navalha', 'Barba', 'Corte', 'Bigode', 'Tesoura', 'Dom'],
    second: ['de Ouro', 'Club', 'Brothers', 'Clássica', 'Barbershop', 'Real'],
    coined: ['Navalhê', 'Barbearia 21', 'Bigodê', 'Cortex', 'Dom Corte', 'Régua'],
    trade: ['Barbearia', 'Barbershop', 'Corte'],
    products: ['Corte e barba com toalha quente', 'Corte degradê', 'Pacote mensal de cortes', 'Barboterapia', 'Corte infantil', 'Pigmentação de barba'],
    audiences: ['homens que gostam de estar sempre na régua', 'pais e filhos', 'quem quer um lugar para relaxar e conversar', 'noivos e padrinhos'],
    differentials: ['Agendamento pelo WhatsApp, sem fila', 'Café, cerveja artesanal e videogame na espera', 'Barbeiros especialistas em degradê', 'Plano mensal com cortes ilimitados', 'Toalha quente e produtos premium em todo serviço', 'Aberto até mais tarde e aos domingos'],
    kind: 'uma barbearia',
  },
  assistencia: {
    first: ['Conserta', 'Cell', 'Tec', 'Reparo', 'Doutor', 'Mega'],
    second: ['Fácil', 'Center', 'Express', 'Fix', 'do Celular', 'Tech'],
    coined: ['Consertaí', 'Fixcell', 'Reparix', 'Celulândia', 'Teclab', 'Arrumaí'],
    trade: ['Assistência', 'Conserto', 'Reparos'],
    products: ['Troca de tela de celular em 1 hora', 'Conserto de notebooks', 'Troca de bateria', 'Formatação e limpeza de computadores', 'Recuperação de aparelhos molhados', 'Venda de acessórios e películas'],
    audiences: ['quem não pode ficar sem celular', 'estudantes e home office', 'pequenas empresas do bairro', 'quem quer consertar em vez de comprar novo'],
    differentials: ['Conserto na hora, enquanto você espera', 'Garantia de 6 meses em peças e serviço', 'Orçamento grátis e sem compromisso', 'Busca e entrega na sua casa', 'Peças originais com nota fiscal', 'Dados do aparelho protegidos'],
    kind: 'uma assistência técnica',
  },
  petshop: {
    first: ['Patinhas', 'Amigo', 'Bicho', 'Pet', 'Focinho', 'Au Au'],
    second: ['Feliz', 'Club', 'Center', 'Mania', 'Love', 'da Vila'],
    coined: ['Patudo', 'Focinhê', 'Petlândia', 'Miaumor', 'Aumigo', 'Bichê'],
    trade: ['Pet Shop', 'Banho e Tosa', 'Pet'],
    products: ['Banho e tosa com leva e traz', 'Rações e petiscos naturais', 'Creche para cães', 'Acessórios e brinquedos', 'Hotel para pets', 'Adestramento'],
    audiences: ['tutores que tratam o pet como família', 'quem trabalha fora o dia todo', 'donos de gatos e cachorros do bairro', 'quem procura produtos naturais para o pet'],
    differentials: ['Busca e entrega do pet em casa', 'Câmera para acompanhar o banho pelo celular', 'Produtos naturais e hipoalergênicos', 'Equipe treinada para pets ansiosos', 'Cartão fidelidade: 10º banho grátis', 'Veterinário de plantão aos sábados'],
    kind: 'um pet shop',
  },
  academia: {
    first: ['Força', 'Fit', 'Corpo', 'Energia', 'Movimento', 'Pulse'],
    second: ['Gym', 'Fitness', 'Club', 'Academia', 'Studio', 'Training'],
    coined: ['Fortix', 'Movê', 'Energym', 'Corpus', 'Pulsar', 'Treinê'],
    trade: ['Fitness', 'Academia', 'Studio'],
    products: ['Plano mensal com treino personalizado', 'Aulas de treino funcional', 'Musculação com acompanhamento', 'Aulas de dança e ritmos', 'Pilates', 'Treino para iniciantes'],
    audiences: ['iniciantes que precisam de motivação', 'quem trabalha e tem pouco tempo', 'pessoas acima dos 50 anos', 'quem quer resultado com acompanhamento'],
    differentials: ['Professor acompanhando todos os treinos', 'Aberta 24 horas', 'Avaliação física gratuita todo mês', 'Aulas coletivas inclusas no plano', 'Sem taxa de matrícula e sem fidelidade', 'Treino pelo app para fazer em casa'],
    kind: 'uma academia',
  },
  lanchonete: {
    first: ['Burger', 'Lanche', 'Chapa', 'Smash', 'Mordida', 'Big'],
    second: ['House', 'do Bairro', 'Brothers', 'Express', 'Artesanal', 'Bom'],
    coined: ['Burguê', 'Smashê', 'Chapalê', 'Lanchão', 'Mordidinha', 'Rangô'],
    trade: ['Lanches', 'Burger', 'Hamburgueria'],
    products: ['Hambúrguer artesanal com batata', 'Pastéis e caldo de cana', 'Cachorro-quente gourmet', 'Lanche natural e sucos', 'Combos para delivery', 'Açaí no copo'],
    audiences: ['grupos de amigos à noite', 'estudantes com fome e pouco dinheiro', 'quem pede delivery no fim de semana', 'trabalhadores no horário do almoço'],
    differentials: ['Carne moída na hora e pão artesanal', 'Entrega em até 30 minutos', 'Combo com refrigerante por preço justo', 'Molhos da casa que ninguém mais tem', 'Opções veganas no cardápio', 'Aberto até de madrugada'],
    kind: 'uma lanchonete',
  },
};

function shuffle<T>(list: T[], rnd: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

/** Sugestões de nome para a empresa. */
export function suggestNames(segment: SegmentId, playerName = '', gender: Gender = 'masculino', count = 5, rnd: () => number = Math.random): string[] {
  const k = KITS[segment];
  const out = new Set<string>();
  const person = firstName(playerName);
  const pool: string[] = [];
  for (const a of shuffle(k.first, rnd).slice(0, 3)) pool.push(`${a} ${shuffle(k.second, rnd)[0]}`);
  pool.push(...shuffle(k.coined, rnd).slice(0, 2));
  if (person.length >= 2) {
    const cap = person.charAt(0).toUpperCase() + person.slice(1);
    pool.push(`${shuffle(k.trade, rnd)[0]} ${gender === 'feminino' ? 'da' : 'do'} ${cap}`);
  }
  for (const n of shuffle(pool, rnd)) {
    if (out.size >= count) break;
    if (n.length <= 32) out.add(n);
  }
  return [...out];
}

/** Sugestões de produto principal. */
export function suggestProducts(segment: SegmentId, count = 4, rnd: () => number = Math.random): string[] {
  return shuffle(KITS[segment].products, rnd).slice(0, count);
}

/** Sugestões de descrição usando o nome e o produto já escritos. */
export function suggestDescriptions(segment: SegmentId, name: string, product: string, count = 3, rnd: () => number = Math.random): string[] {
  const k = KITS[segment];
  const v = vocabFor(segment);
  const who = name.trim() || 'Nossa empresa';
  const what = lowerFirst(product.trim() || k.products[0]);
  const out = new Set<string>();
  for (let i = 0; i < 12 && out.size < count; i++) {
    const audience = shuffle(k.audiences, rnd)[0];
    const [b1, b2] = shuffle(v.benefits, rnd);
    const promise = shuffle(v.promises, rnd)[0];
    const templates = [
      `${who} é ${k.kind} que oferece ${what} para ${audience}, com ${b1} e ${b2}.`,
      `${cap(what)} para ${audience}. Na ${who}, ${b1} e ${b2} vêm em primeiro lugar.`,
      `Somos ${k.kind} do bairro: ${what} para ${audience}, feito com ${b1}.`,
      `${who}: ${what} que ${promise}, pensado para ${audience}.`,
    ];
    const text = templates[Math.floor(rnd() * templates.length) % templates.length];
    if (text.length <= 200) out.add(text);
  }
  return [...out];
}

/** Sugestões de diferencial competitivo. */
export function suggestDifferentials(segment: SegmentId, count = 4, rnd: () => number = Math.random): string[] {
  return shuffle(KITS[segment].differentials, rnd).slice(0, count);
}

/** Sugestões de slogan (usa o gerador de slogans). */
export function suggestSlogans(segment: SegmentId, name: string, count = 4, rnd: () => number = Math.random): string[] {
  return generateSlogans(name, segment, count, rnd);
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Preenche de uma vez os campos ainda vazios. */
export function suggestAll(
  segment: SegmentId,
  current: { name: string; product: string; slogan: string; description: string; differential: string },
  playerName = '',
  gender: Gender = 'masculino',
  rnd: () => number = Math.random,
) {
  const name = current.name.trim() || suggestNames(segment, playerName, gender, 1, rnd)[0];
  const product = current.product.trim() || suggestProducts(segment, 1, rnd)[0];
  return {
    name,
    product,
    slogan: current.slogan.trim() || suggestSlogans(segment, name, 1, rnd)[0],
    description: current.description.trim() || suggestDescriptions(segment, name, product, 1, rnd)[0],
    differential: current.differential.trim() || suggestDifferentials(segment, 1, rnd)[0],
  };
}
