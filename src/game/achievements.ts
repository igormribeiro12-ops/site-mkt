import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  Banknote,
  Briefcase,
  Building2,
  CalendarCheck,
  Castle,
  CheckCheck,
  Compass,
  Crown,
  Earth,
  Eye,
  Factory,
  Flame,
  Flag,
  FlaskConical,
  Gem,
  Gift,
  HandHeart,
  Handshake,
  Heart,
  Landmark,
  Layers,
  Lightbulb,
  ListChecks,
  MapPin,
  MapPinned,
  Medal,
  Megaphone,
  Mountain,
  Network,
  PackageCheck,
  PartyPopper,
  PiggyBank,
  Plane,
  Repeat,
  Rocket,
  Route,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Skull,
  Smile,
  Sparkles,
  Star,
  Store,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Truck,
  Umbrella,
  UserPlus,
  Users,
  UsersRound,
  Vault,
  Wallet,
  Zap,
} from 'lucide-react';
import { INFRA, MAX_PRODUCT_LINES } from './data';
import { completeRegions, presentCities, presentRegions, presentStates } from './expansion';
import { getCity, STATES } from './geo';
import { valuation } from './simulation';
import type { GameState, MonthReport } from './types';

export type AchievementCategory = 'vendas' | 'financas' | 'marketing' | 'equipe' | 'produto' | 'expansao' | 'desafios' | 'lendas';

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'vendas', label: 'Clientes e vendas' },
  { id: 'financas', label: 'Dinheiro e finanças' },
  { id: 'marketing', label: 'Marketing e marca' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'produto', label: 'Produto e estrutura' },
  { id: 'expansao', label: 'Expansão pelo Brasil' },
  { id: 'desafios', label: 'Desafios do mês' },
  { id: 'lendas', label: 'Lendas' },
];

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: AchievementCategory;
  check: (s: GameState, r?: MonthReport) => boolean;
}

const employees = (s: GameState) => Object.values(s.employees).reduce((a, b) => a + b, 0);
const otherCities = (s: GameState) => s.branches.filter((b) => b.city !== s.homeCity).length;
const capitals = (s: GameState) => [...presentCities(s)].filter((id) => getCity(id)?.capital).length;
const activeChannels = (s: GameState) => new Set(s.campaigns.filter((c) => c.active).map((c) => c.channel)).size;
const won = (s: GameState) => s.phase === 'won' || s.freePlay;
const hardWin = (s: GameState) => won(s) && (s.player.difficulty === 'dificil' || s.player.difficulty === 'lendario');

type Def = Omit<AchievementDef, 'category'>;

function group(category: AchievementCategory, defs: Def[]): AchievementDef[] {
  return defs.map((d) => ({ ...d, category }));
}

export const ACHIEVEMENTS: AchievementDef[] = [
  ...group('vendas', [
    { id: 'primeira_venda', title: 'Primeira venda', description: 'Realize a primeira venda da empresa.', icon: ShoppingBag, check: (s) => s.totalRevenue > 0 },
    { id: 'primeiro_cliente', title: 'Primeiro cliente', description: 'Conquiste o primeiro cliente.', icon: UserPlus, check: (s) => s.customersTotal >= 1 },
    { id: 'clientes_100', title: '100 clientes', description: 'Conquiste 100 clientes.', icon: Users, check: (s) => s.customersTotal >= 100 },
    { id: 'clientes_1000', title: '1.000 clientes', description: 'Conquiste 1.000 clientes.', icon: PartyPopper, check: (s) => s.customersTotal >= 1000 },
    { id: 'clientes_5000', title: '5.000 clientes', description: 'Conquiste 5.000 clientes.', icon: UsersRound, check: (s) => s.customersTotal >= 5000 },
    { id: 'clientes_20000', title: 'Multidão de fãs', description: 'Conquiste 20.000 clientes.', icon: Heart, check: (s) => s.customersTotal >= 20000 },
    { id: 'ativos_1000', title: 'Clientela fiel', description: 'Tenha 1.000 clientes ativos ao mesmo tempo.', icon: Repeat, check: (s) => s.activeCustomers >= 1000 },
    { id: 'marca_querida', title: 'Marca querida', description: 'Chegue a 85% de satisfação dos clientes.', icon: HandHeart, check: (s) => s.satisfaction >= 85 },
    { id: 'satisfacao_95', title: 'Atendimento impecável', description: 'Chegue a 95% de satisfação dos clientes.', icon: Smile, check: (s) => s.satisfaction >= 95 },
    {
      id: 'sem_fila',
      title: 'Ninguém fica sem atendimento',
      description: 'Feche um mês com 300 vendas ou mais e nenhum pedido perdido.',
      icon: CheckCheck,
      check: (_s, r) => Boolean(r && r.unitsSold >= 300 && r.unmetOrders < 1),
    },
  ]),
  ...group('financas', [
    { id: 'receita_5k', title: 'Primeiros R$ 5.000', description: 'Some R$ 5.000 em receita.', icon: BadgeDollarSign, check: (s) => s.totalRevenue >= 5000 },
    { id: 'receita_50k', title: 'R$ 50 mil em receita', description: 'Some R$ 50.000 em receita.', icon: TrendingUp, check: (s) => s.totalRevenue >= 50000 },
    { id: 'receita_250k', title: 'R$ 250 mil em receita', description: 'Some R$ 250.000 em receita.', icon: Banknote, check: (s) => s.totalRevenue >= 250000 },
    { id: 'receita_1m', title: 'O primeiro milhão', description: 'Some R$ 1 milhão em receita.', icon: Gem, check: (s) => s.totalRevenue >= 1_000_000 },
    { id: 'mes_50k', title: 'Mês de ouro', description: 'Fature R$ 50 mil em um único mês.', icon: Star, check: (_s, r) => Boolean(r && r.revenue >= 50000) },
    { id: 'lucro_10k', title: 'Lucro de gente grande', description: 'Lucre R$ 10 mil em um único mês.', icon: Wallet, check: (_s, r) => Boolean(r && r.profit >= 10000) },
    { id: 'tres_lucros', title: 'Caixa no azul', description: 'Fique 3 meses seguidos com lucro.', icon: PiggyBank, check: (s) => s.profitStreak >= 3 },
    { id: 'seis_lucros', title: 'Semestre lucrativo', description: 'Fique 6 meses seguidos com lucro.', icon: CalendarCheck, check: (s) => s.profitStreak >= 6 },
    { id: 'doze_lucros', title: 'Um ano no azul', description: 'Fique 12 meses seguidos com lucro.', icon: Medal, check: (s) => s.profitStreak >= 12 },
    { id: 'caixa_100k', title: 'Cofre cheio', description: 'Tenha R$ 100 mil em caixa.', icon: Vault, check: (s) => s.cash >= 100000 },
    { id: 'aplicador', title: 'Investidor prudente', description: 'Tenha R$ 20 mil na aplicação financeira.', icon: Landmark, check: (s) => s.savings >= 20000 },
    { id: 'segurado', title: 'Precavido', description: 'Contrate o seguro empresarial.', icon: Umbrella, check: (s) => s.insurance },
    {
      id: 'quitou',
      title: 'Livre de dívidas',
      description: 'Quite um empréstimo antes do prazo.',
      icon: ShieldCheck,
      check: (s) => s.decisions.some((d) => d.kind === 'finance' && d.text.startsWith('Quitou')),
    },
    { id: 'volta_por_cima', title: 'A volta por cima', description: 'Depois de um mês com o caixa negativo, chegue a R$ 20 mil em caixa.', icon: Mountain, check: (s) => s.cash >= 20000 && s.history.some((h) => h.cashEnd < 0) },
    { id: 'valor_1m', title: 'Empresa milionária', description: 'Faça a empresa valer R$ 1 milhão.', icon: Scale, check: (s) => valuation(s) >= 1_000_000 },
  ]),
  ...group('marketing', [
    {
      id: 'campanha_lucrativa',
      title: 'Primeira campanha lucrativa',
      description: 'Tenha uma campanha com ROI positivo.',
      icon: Target,
      check: (_s, r) => Boolean(r?.campaigns.some((c) => c.roi > 0)),
    },
    { id: 'seguidores_1k', title: '1.000 seguidores', description: 'Alcance 1.000 seguidores.', icon: Rocket, check: (s) => s.followers >= 1000 },
    { id: 'seguidores_10k', title: '10 mil seguidores', description: 'Alcance 10.000 seguidores.', icon: Sparkles, check: (s) => s.followers >= 10000 },
    { id: 'seguidores_100k', title: 'Celebridade digital', description: 'Alcance 100.000 seguidores.', icon: Zap, check: (s) => s.followers >= 100000 },
    { id: 'viral', title: 'Viralizou!', description: 'Tenha uma publicação viral.', icon: Flame, check: (s) => s.recentEvents.some((e) => e.id === 'viral') },
    { id: 'multicanal', title: 'Estratégia multicanal', description: 'Tenha campanhas ativas em 4 canais diferentes ao mesmo tempo.', icon: Megaphone, check: (s) => activeChannels(s) >= 4 },
    { id: 'reconhecimento_60', title: 'Todo mundo conhece', description: 'Chegue a 60% de reconhecimento da marca.', icon: Eye, check: (s) => s.awareness >= 60 },
    { id: 'reputacao_90', title: 'Reputação de ouro', description: 'Chegue a 90 de reputação.', icon: Medal, check: (s) => s.reputation >= 90 },
    { id: 'fidelidade', title: 'Cliente de casa', description: 'Crie um programa de fidelidade.', icon: Gift, check: (s) => s.loyalty >= 1 },
    { id: 'clube_vip', title: 'Clube VIP', description: 'Ofereça o Clube VIP aos seus clientes.', icon: Crown, check: (s) => s.loyalty === 2 },
  ]),
  ...group('equipe', [
    { id: 'primeiro_funcionario', title: 'Primeiro funcionário', description: 'Contrate alguém para a equipe.', icon: UsersRound, check: (s) => employees(s) >= 1 },
    { id: 'equipe_10', title: 'Time de 10', description: 'Tenha 10 funcionários.', icon: Users, check: (s) => employees(s) >= 10 },
    { id: 'equipe_20', title: 'Grande equipe', description: 'Tenha 20 funcionários.', icon: Network, check: (s) => employees(s) >= 20 },
    { id: 'gerente', title: 'Gestão profissional', description: 'Contrate um gerente.', icon: Briefcase, check: (s) => s.employees.gerente > 0 },
    { id: 'logistica', title: 'Operação logística', description: 'Contrate um coordenador de logística.', icon: Truck, check: (s) => s.employees.logistica > 0 },
    {
      id: 'equipe_completa',
      title: 'Equipe completa',
      description: 'Tenha pelo menos um profissional de cada área.',
      icon: Gem,
      check: (s) => Object.values(s.employees).every((n) => n > 0),
    },
  ]),
  ...group('produto', [
    { id: 'inovador', title: 'Inovador', description: 'Lance um novo produto.', icon: Lightbulb, check: (s) => s.productLines >= 2 },
    { id: 'portfolio', title: 'Portfólio completo', description: `Tenha ${MAX_PRODUCT_LINES} linhas de produto.`, icon: Layers, check: (s) => s.productLines >= MAX_PRODUCT_LINES },
    { id: 'qualidade_90', title: 'Padrão de excelência', description: 'Chegue a 90 de qualidade no produto.', icon: FlaskConical, check: (s) => s.quality >= 90 },
    { id: 'premium', title: 'Só o melhor', description: 'Trabalhe com o fornecedor premium.', icon: PackageCheck, check: (s) => s.supplier === 'premium' },
    { id: 'escritorio_max', title: 'Sede dos sonhos', description: 'Amplie o escritório até o tamanho máximo.', icon: Factory, check: (s) => s.infraLevel >= INFRA.length - 1 },
  ]),
  ...group('expansao', [
    { id: 'expansao', title: 'Expansão da empresa', description: 'Expanda para a cidade toda ou abra uma nova unidade.', icon: Building2, check: (s) => s.branches.length > 0 || s.scopeLevel > 0 },
    { id: 'nova_cidade', title: 'Pé na estrada', description: 'Abra uma filial em outra cidade.', icon: MapPin, check: (s) => otherCities(s) >= 1 },
    { id: 'novo_estado', title: 'Além da fronteira', description: 'Chegue a outro estado.', icon: Route, check: (s) => presentStates(s).size >= 2 },
    { id: 'nova_regiao', title: 'Outra região do país', description: 'Esteja em 2 regiões do Brasil.', icon: Plane, check: (s) => presentRegions(s).size >= 2 },
    { id: 'cinco_cidades', title: 'Rede de lojas', description: 'Esteja em 5 cidades.', icon: Store, check: (s) => presentCities(s).size >= 5 },
    { id: 'cinco_estados', title: 'Marca regional', description: 'Esteja em 5 estados.', icon: MapPinned, check: (s) => presentStates(s).size >= 5 },
    { id: 'dez_cidades', title: 'Presença nacional', description: 'Esteja em 10 cidades.', icon: Compass, check: (s) => presentCities(s).size >= 10 },
    { id: 'capitais_5', title: 'Rota das capitais', description: 'Esteja em 5 capitais.', icon: Landmark, check: (s) => capitals(s) >= 5 },
    { id: 'regiao_completa', title: 'Dono da região', description: 'Esteja em todos os estados de uma região.', icon: Flag, check: (s) => completeRegions(s).length > 0 },
    { id: 'cinco_regioes', title: 'De norte a sul', description: 'Esteja nas 5 regiões do Brasil.', icon: Earth, check: (s) => presentRegions(s).size >= 5 },
    {
      id: 'eixo_rio_sp',
      title: 'Eixo Rio–São Paulo',
      description: 'Esteja em São Paulo e no Rio de Janeiro.',
      icon: Building2,
      check: (s) => {
        const c = presentCities(s);
        return c.has('sao-paulo') && c.has('rio-de-janeiro');
      },
    },
    { id: 'brasil_todo', title: 'O Brasil é seu', description: `Esteja nos ${STATES.length} estados.`, icon: Castle, check: (s) => presentStates(s).size >= STATES.length },
  ]),
  ...group('desafios', [
    { id: 'desafio_1', title: 'Desafio aceito', description: 'Cumpra um desafio do mês.', icon: Target, check: (s) => s.goalsDone >= 1 },
    { id: 'desafio_5', title: 'Batedor de metas', description: 'Cumpra 5 desafios do mês.', icon: ListChecks, check: (s) => s.goalsDone >= 5 },
    { id: 'desafio_15', title: 'Imparável', description: 'Cumpra 15 desafios do mês.', icon: Trophy, check: (s) => s.goalsDone >= 15 },
  ]),
  ...group('lendas', [
    { id: 'magnata', title: 'Magnata', description: 'Chegue ao nível máximo.', icon: Crown, check: (s) => s.level >= 6 },
    { id: 'vitoria', title: 'Império construído', description: 'Vença o jogo.', icon: Trophy, check: won },
    { id: 'vitoria_rapida', title: 'Ascensão meteórica', description: 'Vença o jogo em até 30 meses.', icon: Timer, check: (s) => s.phase === 'won' && s.month <= 31 },
    { id: 'vitoria_dificil', title: 'Contra todas as apostas', description: 'Vença no difícil ou no lendário.', icon: Handshake, check: hardWin },
    { id: 'vitoria_lendaria', title: 'Lenda dos negócios', description: 'Vença no nível lendário.', icon: Skull, check: (s) => won(s) && s.player.difficulty === 'lendario' },
  ]),
];

/** Retorna as conquistas que acabaram de ser desbloqueadas. */
export function unlockAchievements(s: GameState, report?: MonthReport): { state: GameState; unlocked: string[] } {
  const unlocked = ACHIEVEMENTS.filter((a) => !(a.id in s.achievements) && a.check(s, report)).map((a) => a.id);
  if (unlocked.length === 0) return { state: s, unlocked };
  const achievements = { ...s.achievements };
  const month = report ? report.month : s.month;
  for (const id of unlocked) achievements[id] = month;
  return { state: { ...s, achievements }, unlocked };
}

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
