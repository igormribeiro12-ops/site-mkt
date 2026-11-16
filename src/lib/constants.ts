import type { LucideIcon } from 'lucide-react';
import {
  Clapperboard,
  Cpu,
  GraduationCap,
  HeartPulse,
  Shapes,
  Shirt,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import type { ArtStyleId, BrandStyleId, ChannelId, PurchasingPower, SegmentId } from '../types';

export interface SegmentOption {
  id: SegmentId;
  label: string;
  icon: LucideIcon;
  hint: string;
}

export const SEGMENTS: SegmentOption[] = [
  { id: 'tecnologia', label: 'Tecnologia', icon: Cpu, hint: 'Apps, sites, eletrônicos' },
  { id: 'alimentacao', label: 'Alimentação', icon: UtensilsCrossed, hint: 'Lanches, doces, restaurantes' },
  { id: 'moda', label: 'Moda e vestuário', icon: Shirt, hint: 'Roupas, calçados, acessórios' },
  { id: 'beleza', label: 'Beleza e estética', icon: Sparkles, hint: 'Cosméticos, salões, cuidados' },
  { id: 'educacao', label: 'Educação', icon: GraduationCap, hint: 'Cursos, aulas, reforço' },
  { id: 'saude', label: 'Saúde', icon: HeartPulse, hint: 'Bem-estar, academia, nutrição' },
  { id: 'comercio', label: 'Comércio', icon: Store, hint: 'Lojas físicas ou on-line' },
  { id: 'servicos', label: 'Serviços', icon: Wrench, hint: 'Consertos, entregas, consultorias' },
  { id: 'entretenimento', label: 'Entretenimento', icon: Clapperboard, hint: 'Eventos, jogos, música' },
  { id: 'outros', label: 'Outros', icon: Shapes, hint: 'Algo diferente de tudo isso' },
];

export function segmentLabel(segment: SegmentId | '', other = ''): string {
  if (!segment) return '';
  if (segment === 'outros') return other.trim() || 'Outros';
  return SEGMENTS.find((s) => s.id === segment)?.label ?? '';
}

export type LogoShape = 'circle' | 'rounded' | 'square' | 'blob' | 'leaf';

export interface BrandStyleOption {
  id: BrandStyleId;
  label: string;
  description: string;
  /** Classe da fonte usada no nome da marca. */
  fontClass: string;
  /** Peso, caixa e espaçamento do nome da marca. */
  nameClass: string;
  shape: LogoShape;
  /** Usa degradê entre a cor principal e a secundária no símbolo. */
  gradient: boolean;
}

export const BRAND_STYLES: BrandStyleOption[] = [
  {
    id: 'moderno',
    label: 'Moderno',
    description: 'Linhas limpas, cores vivas e visual atual.',
    fontClass: 'font-sans',
    nameClass: 'font-extrabold tracking-tight',
    shape: 'rounded',
    gradient: true,
  },
  {
    id: 'minimalista',
    label: 'Minimalista',
    description: 'Simples, direto e com bastante respiro.',
    fontClass: 'font-sans',
    nameClass: 'font-medium uppercase tracking-[0.2em]',
    shape: 'circle',
    gradient: false,
  },
  {
    id: 'divertido',
    label: 'Divertido',
    description: 'Alegre, descontraído e cheio de energia.',
    fontClass: 'font-fun',
    nameClass: 'font-semibold',
    shape: 'blob',
    gradient: true,
  },
  {
    id: 'elegante',
    label: 'Elegante',
    description: 'Sofisticado, refinado e com ar premium.',
    fontClass: 'font-serif-brand',
    nameClass: 'font-medium italic',
    shape: 'circle',
    gradient: false,
  },
  {
    id: 'tecnologico',
    label: 'Tecnológico',
    description: 'Inovador, digital e futurista.',
    fontClass: 'font-tech',
    nameClass: 'font-bold tracking-tight',
    shape: 'square',
    gradient: true,
  },
  {
    id: 'natural',
    label: 'Natural',
    description: 'Orgânico, sustentável e acolhedor.',
    fontClass: 'font-fun',
    nameClass: 'font-medium',
    shape: 'leaf',
    gradient: false,
  },
  {
    id: 'ousado',
    label: 'Ousado',
    description: 'Forte, marcante e cheio de atitude.',
    fontClass: 'font-tech',
    nameClass: 'font-bold uppercase tracking-tight',
    shape: 'square',
    gradient: true,
  },
  {
    id: 'classico',
    label: 'Clássico',
    description: 'Tradicional, confiável e atemporal.',
    fontClass: 'font-serif-brand',
    nameClass: 'font-bold',
    shape: 'rounded',
    gradient: false,
  },
];

export function getBrandStyle(id: BrandStyleId | ''): BrandStyleOption | undefined {
  return BRAND_STYLES.find((s) => s.id === id);
}

export interface ChannelOption {
  id: ChannelId;
  label: string;
  color: string;
  bestFor: string;
  /** Limite de caracteres recomendado para o texto da publicação. */
  textLimit: number;
  textTip: string;
}

export const CHANNELS: ChannelOption[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#e1306c',
    bestFor: 'Fotos, Reels e Stories. Ótimo para marcas visuais e relacionamento.',
    textLimit: 2200,
    textTip: 'Só as primeiras ~125 letras aparecem antes do "mais". Comece pelo mais importante!',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#111111',
    bestFor: 'Vídeos curtos, tendências e humor. Alcança muita gente rapidamente.',
    textLimit: 2200,
    textTip: 'Legendas curtas funcionam melhor: o vídeo é o protagonista.',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877f2',
    bestFor: 'Comunidades, eventos e públicos de várias idades.',
    textLimit: 1000,
    textTip: 'Textos de até 250 caracteres costumam ter mais interação.',
  },
  {
    id: 'google',
    label: 'Google',
    color: '#4285f4',
    bestFor: 'Aparecer quando alguém pesquisa por um produto ou serviço.',
    textLimit: 90,
    textTip: 'Anúncios de pesquisa têm descrição de até 90 caracteres. Seja direto!',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business',
    color: '#25d366',
    bestFor: 'Atendimento próximo, catálogo de produtos e vendas diretas.',
    textLimit: 700,
    textTip: 'Mensagens curtas e pessoais. Ninguém gosta de "textão" no WhatsApp.',
  },
  {
    id: 'site',
    label: 'Site próprio',
    color: '#4f46e5',
    bestFor: 'Seu espaço oficial: informações, vitrine e credibilidade.',
    textLimit: 300,
    textTip: 'O texto de destaque de um site deve ser lido em poucos segundos.',
  },
];

export function getChannel(id: ChannelId | ''): ChannelOption | undefined {
  return CHANNELS.find((c) => c.id === id);
}

export const INTEREST_SUGGESTIONS = [
  'Tecnologia',
  'Games',
  'Moda',
  'Esportes',
  'Música',
  'Viagens',
  'Culinária',
  'Saúde e bem-estar',
  'Beleza',
  'Estudos',
  'Empreendedorismo',
  'Sustentabilidade',
  'Pets',
  'Filmes e séries',
  'Leitura',
  'Academia',
  'Família',
  'Arte e design',
];

export const ONLINE_PLACES = [
  'Instagram',
  'TikTok',
  'YouTube',
  'WhatsApp',
  'Facebook',
  'Google (pesquisas)',
  'LinkedIn',
  'Pinterest',
  'X (Twitter)',
  'Kwai',
  'Twitch',
  'Discord',
  'Blogs e sites',
  'E-mail',
];

export interface PurchasingPowerOption {
  id: Exclude<PurchasingPower, ''>;
  label: string;
  description: string;
  level: number;
}

export const PURCHASING_POWER: PurchasingPowerOption[] = [
  { id: 'baixo', label: 'Baixo', description: 'Compra com cuidado e prioriza o preço.', level: 1 },
  { id: 'medio', label: 'Médio', description: 'Equilibra preço e qualidade.', level: 2 },
  { id: 'alto', label: 'Alto', description: 'Valoriza qualidade e boas experiências.', level: 3 },
  { id: 'muito-alto', label: 'Muito alto', description: 'Busca exclusividade e produtos premium.', level: 4 },
];

export const AGE_PRESETS: { label: string; min: number; max: number }[] = [
  { label: '13–17', min: 13, max: 17 },
  { label: '18–24', min: 18, max: 24 },
  { label: '25–34', min: 25, max: 34 },
  { label: '35–44', min: 35, max: 44 },
  { label: '45–59', min: 45, max: 59 },
  { label: '60+', min: 60, max: 80 },
];

export const TACTICS = [
  'Conteúdo orgânico',
  'Anúncios pagos',
  'Parcerias com influenciadores',
  'Promoções e cupons',
  'Indicação de clientes',
  'Sorteios',
  'Vídeos curtos',
  'Lives',
  'E-mail marketing',
  'Parcerias com outras empresas',
];

export const CONTENT_PILLARS = [
  'Dicas e conteúdo educativo',
  'Bastidores',
  'Depoimentos de clientes',
  'Lançamentos',
  'Promoções',
  'Humor e entretenimento',
  'Tutoriais',
  'Perguntas e respostas',
];

export const FREQUENCIES = [
  'Todos os dias',
  '5 vezes por semana',
  '3 vezes por semana',
  '2 vezes por semana',
  '1 vez por semana',
  'A cada 15 dias',
];

export const GOAL_TYPES = [
  'Tornar a marca conhecida',
  'Ganhar seguidores',
  'Gerar vendas',
  'Conseguir contatos de clientes',
  'Fidelizar clientes',
  'Lançar um produto',
];

export const POST_FORMATS = [
  'Post com imagem',
  'Carrossel',
  'Reels / vídeo curto',
  'Stories',
  'Live',
  'Anúncio',
  'Mensagem / transmissão',
  'Artigo ou página',
];

export const CTA_OPTIONS = [
  'Compre agora',
  'Saiba mais',
  'Peça pelo WhatsApp',
  'Agende seu horário',
  'Garanta o seu',
  'Cadastre-se',
  'Fale com a gente',
  'Visite nosso site',
  'Inscreva-se',
];

export interface ArtStyleOption {
  id: ArtStyleId;
  label: string;
  description: string;
}

export const ART_STYLES: ArtStyleOption[] = [
  { id: 'destaque', label: 'Produto em destaque', description: 'Mostra o produto e o preço.' },
  { id: 'promocao', label: 'Promoção', description: 'Visual chamativo de oferta.' },
  { id: 'frase', label: 'Frase', description: 'Uma mensagem forte da marca.' },
  { id: 'lancamento', label: 'Lançamento', description: 'Anuncia uma novidade.' },
];

export const CATEGORY_SUGGESTIONS: Record<SegmentId, string[]> = {
  tecnologia: ['Aplicativo', 'Acessório', 'Software', 'Suporte técnico', 'Curso on-line'],
  alimentacao: ['Lanche', 'Doce', 'Bebida', 'Refeição', 'Kit / combo'],
  moda: ['Camiseta', 'Calçado', 'Acessório', 'Coleção', 'Peça sob medida'],
  beleza: ['Cosmético', 'Tratamento', 'Corte e penteado', 'Maquiagem', 'Kit de cuidados'],
  educacao: ['Curso', 'Aula particular', 'Material didático', 'Mentoria', 'Workshop'],
  saude: ['Consulta', 'Plano de treino', 'Suplemento', 'Acompanhamento', 'Aula'],
  comercio: ['Eletrônicos', 'Casa e decoração', 'Presentes', 'Papelaria', 'Utilidades'],
  servicos: ['Manutenção', 'Entrega', 'Consultoria', 'Limpeza', 'Design'],
  entretenimento: ['Ingresso', 'Evento', 'Jogo', 'Show', 'Experiência'],
  outros: ['Produto', 'Serviço', 'Assinatura', 'Kit', 'Experiência'],
};
