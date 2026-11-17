// Missões que guiam o jogador. São cumpridas em ordem; cada uma dá
// recompensa em dinheiro e pode liberar novos itens.

import type { LucideIcon } from 'lucide-react';
import { Armchair, Building2, Crown, Megaphone, PiggyBank, Rocket, Store, UserPlus, Users } from 'lucide-react';
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
    title: 'Conquiste novos territórios',
    description: 'Expanda para a cidade ou abra uma nova unidade.',
    hint: 'Visite a imobiliária na cidade (saia pela porta).',
    reward: 3000,
    icon: Store,
    check: (s) => s.scopeLevel > 0 || s.units > 1,
  },
  {
    id: 'grande',
    title: 'Torne-se uma Grande companhia',
    description: 'Alcance o nível 5.',
    hint: 'Receita, clientes, reputação e satisfação levam ao topo.',
    reward: 5000,
    icon: Crown,
    check: (s) => s.level >= 5,
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
