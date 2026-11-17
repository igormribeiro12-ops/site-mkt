import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  Building2,
  Crown,
  Flame,
  Gem,
  HandHeart,
  Lightbulb,
  PartyPopper,
  PiggyBank,
  Rocket,
  ShoppingBag,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import type { GameState, MonthReport } from './types';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  check: (s: GameState, r?: MonthReport) => boolean;
}

const employees = (s: GameState) => Object.values(s.employees).reduce((a, b) => a + b, 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primeira_venda', title: 'Primeira venda', description: 'Realize a primeira venda da empresa.', icon: ShoppingBag, check: (s) => s.totalRevenue > 0 },
  { id: 'primeiro_cliente', title: 'Primeiro cliente', description: 'Conquiste o primeiro cliente.', icon: UserPlus, check: (s) => s.customersTotal >= 1 },
  { id: 'receita_5k', title: 'Primeiros R$ 5.000', description: 'Some R$ 5.000 em receita.', icon: BadgeDollarSign, check: (s) => s.totalRevenue >= 5000 },
  {
    id: 'campanha_lucrativa',
    title: 'Primeira campanha lucrativa',
    description: 'Tenha uma campanha com ROI positivo.',
    icon: Target,
    check: (_s, r) => Boolean(r?.campaigns.some((c) => c.roi > 0)),
  },
  { id: 'clientes_100', title: '100 clientes', description: 'Conquiste 100 clientes.', icon: Users, check: (s) => s.customersTotal >= 100 },
  { id: 'primeiro_funcionario', title: 'Primeiro funcionário', description: 'Contrate alguém para a equipe.', icon: UsersRound, check: (s) => employees(s) >= 1 },
  { id: 'expansao', title: 'Expansão da empresa', description: 'Abra uma nova unidade ou expanda para outro mercado.', icon: Building2, check: (s) => s.units > 1 || s.scopeLevel > 0 },
  { id: 'seguidores_1k', title: '1.000 seguidores', description: 'Alcance 1.000 seguidores.', icon: Rocket, check: (s) => s.followers >= 1000 },
  { id: 'viral', title: 'Viralizou!', description: 'Tenha uma publicação viral.', icon: Flame, check: (s) => s.recentEvents.some((e) => e.id === 'viral') },
  { id: 'tres_lucros', title: 'Caixa no azul', description: 'Fique 3 meses seguidos com lucro.', icon: PiggyBank, check: (s) => s.profitStreak >= 3 },
  { id: 'marca_querida', title: 'Marca querida', description: 'Chegue a 85% de satisfação dos clientes.', icon: HandHeart, check: (s) => s.satisfaction >= 85 },
  { id: 'inovador', title: 'Inovador', description: 'Lance um novo produto.', icon: Lightbulb, check: (s) => s.productLines >= 2 },
  { id: 'receita_50k', title: 'R$ 50 mil em receita', description: 'Some R$ 50.000 em receita.', icon: TrendingUp, check: (s) => s.totalRevenue >= 50000 },
  { id: 'clientes_1000', title: '1.000 clientes', description: 'Conquiste 1.000 clientes.', icon: PartyPopper, check: (s) => s.customersTotal >= 1000 },
  {
    id: 'equipe_completa',
    title: 'Equipe completa',
    description: 'Tenha pelo menos um profissional de cada área.',
    icon: Gem,
    check: (s) => Object.values(s.employees).every((n) => n > 0),
  },
  { id: 'magnata', title: 'Magnata', description: 'Chegue ao nível máximo.', icon: Crown, check: (s) => s.level >= 6 },
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
