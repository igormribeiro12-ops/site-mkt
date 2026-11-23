// Missões que guiam o jogador. São cumpridas em ordem; cada uma dá
// recompensa em dinheiro e pode liberar novos itens.

import type { LucideIcon } from 'lucide-react';
import { Armchair, Building2, Castle, Crown, MapPin, Megaphone, PiggyBank, Rocket, Route, Store, Target, UserPlus, Users } from 'lucide-react';
import { presentStates } from './expansion';
import type { GameState } from './types';

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  hint: string;
  reward: number;
  unlockText?: string;
  icon: LucideIcon;
  check: (s: GameState) => boolean;
}

const employees = (s: GameState) => Object.values(s.employees).reduce((a, b) => a + b, 0);

export const MISSIONS: MissionDef[] = [
  {
    id: 'empresa',
    title: 'Crie sua primeira empresa',
    description: 'Abra as portas do seu negócio.',
    hint: 'Concluída ao abrir a empresa.',
    reward: 500,
    icon: Rocket,
    check: () => true,
  },
  {
    id: 'moveis',
    title: 'Compre os primeiros móveis',
    description: 'Deixe o espaço com a cara do seu negócio.',
    hint: 'Clique em Construir na barra de baixo e posicione um móvel.',
    reward: 300,
    unlockText: 'Libera a palmeira decorativa',
    icon: Armchair,
    check: (s) => s.world.furniture.some((f) => !f.starter),
  },
  {
    id: 'funcionario',
    title: 'Contrate seu primeiro funcionário',
    description: 'Ninguém constrói um império sozinho.',
    hint: 'Clique em Contratar e escolha alguém para a equipe.',
    reward: 500,
    icon: UserPlus,
    check: (s) => employees(s) >= 1,
  },
  {
    id: 'campanha',
    title: 'Crie sua primeira campanha de marketing',
    description: 'Faça as pessoas conhecerem a sua empresa.',
    hint: 'Use o computador ou o botão Marketing.',
    reward: 400,
    unlockText: 'Libera o kit de gravação de vídeos',
    icon: Megaphone,
    check: (s) => s.campaigns.length > 0 || s.decisions.some((d) => d.kind === 'marketing'),
  },
  {
    id: 'clientes5',
    title: 'Conquiste os primeiros 5 clientes',
    description: 'Atenda bem quem entrar pela porta.',
    hint: 'Com divulgação, os clientes começam a chegar durante o dia.',
    reward: 500,
    icon: Users,
    check: (s) => s.customersTotal >= 5,
  },
  {
    id: 'expandir',
    title: 'Expanda seu escritório',
    description: 'Mais espaço para mais clientes e equipe.',
    hint: 'Em Construir, use "Ampliar o espaço".',
    reward: 1000,
    unlockText: 'Libera o letreiro neon',
    icon: Building2,
    check: (s) => s.infraLevel >= 1,
  },
  {
    id: 'lucro',
    title: 'Feche um mês com lucro',
    description: 'Receitas maiores que as despesas.',
    hint: 'Equilibre marketing, preço e custos.',
    reward: 800,
    icon: PiggyBank,
    check: (s) => s.history.some((h) => h.profit > 0),
  },
  {
    id: 'desafio',
    title: 'Cumpra um desafio do mês',
    description: 'Todo mês chega uma meta nova com prêmio em dinheiro.',
    hint: 'O desafio aparece no topo da tela e no Painel do computador.',
    reward: 800,
    icon: Target,
    check: (s) => s.goalsDone >= 1,
  },
  {
    id: 'clientes100',
    title: 'Conquiste 100 clientes',
    description: 'Sua marca está ficando conhecida.',
    hint: 'Invista em campanhas e mantenha os clientes satisfeitos.',
    reward: 1500,
    icon: Users,
    check: (s) => s.customersTotal >= 100,
  },
  {
    id: 'unidade',
    title: 'Conquiste a sua cidade',
    description: 'Expanda para a cidade toda ou abra uma nova unidade.',
    hint: 'Visite a imobiliária na cidade (saia pela porta) ou use Comprar → Expansão.',
    reward: 3000,
    icon: Store,
    check: (s) => s.scopeLevel > 0 || s.branches.length > 0,
  },
  {
    id: 'filial',
    title: 'Abra uma filial em outra cidade',
    description: 'Leve a sua marca para além da cidade da sede.',
    hint: 'Aperte 7 para abrir o mapa do Brasil e escolha uma cidade do seu estado ou da sua região.',
    reward: 3000,
    icon: MapPin,
    check: (s) => s.branches.some((b) => b.city !== s.homeCity),
  },
  {
    id: 'grande',
    title: 'Torne-se uma Grande companhia',
    description: 'Alcance o nível 5.',
    hint: 'Receita, clientes, reputação, satisfação e presença em 2 cidades levam ao topo.',
    reward: 5000,
    icon: Crown,
    check: (s) => s.level >= 5,
  },
  {
    id: 'estados',
    title: 'Esteja em 3 estados',
    description: 'Uma marca conhecida em várias partes do Brasil.',
    hint: 'No mapa do Brasil, abra filiais em outros estados. Cada estado novo cobra a inscrição estadual.',
    reward: 6000,
    icon: Route,
    check: (s) => presentStates(s).size >= 3,
  },
  {
    id: 'imperio',
    title: 'Construa seu império',
    description: 'Alcance o nível 6: Império empresarial.',
    hint: 'Veja no Painel os requisitos que ainda faltam.',
    reward: 10000,
    icon: Castle,
    check: (s) => s.level >= 6,
  },
];

export function currentMission(s: GameState): MissionDef | null {
  return MISSIONS.find((m) => !s.world.missionsDone.includes(m.id)) ?? null;
}

/** Conclui, em ordem, as missões já cumpridas. Retorna as concluídas agora. */
export function completeMissions(s: GameState): { state: GameState; completed: MissionDef[] } {
  let state = s;
  const completed: MissionDef[] = [];
  for (;;) {
    const m = currentMission(state);
    if (!m || !m.check(state)) break;
    completed.push(m);
    state = {
      ...state,
      cash: state.cash + m.reward,
      world: { ...state.world, missionsDone: [...state.world.missionsDone, m.id] },
    };
  }
  return { state, completed };
}

export function isUnlocked(s: GameState, missionId: string | undefined): boolean {
  return !missionId || s.world.missionsDone.includes(missionId);
}
