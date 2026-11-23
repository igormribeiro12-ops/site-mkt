import type { LucideIcon } from 'lucide-react';
import { BrainCircuit, Factory, Globe2, LayoutDashboard, MapPinned, Megaphone, ShoppingCart, Trophy, Users, Wallet } from 'lucide-react';

/** Aplicativos do computador da empresa (sistema de gestão). */
export type TabId = 'painel' | 'consultor' | 'mercado' | 'marketing' | 'vendas' | 'produto' | 'equipe' | 'expansao' | 'financas' | 'conquistas';

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'painel', label: 'Painel', icon: LayoutDashboard },
  { id: 'consultor', label: 'Consultor', icon: BrainCircuit },
  { id: 'mercado', label: 'Mercado', icon: Globe2 },
  { id: 'marketing', label: 'Campanhas', icon: Megaphone },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'produto', label: 'Produto e preço', icon: Factory },
  { id: 'equipe', label: 'Equipe', icon: Users },
  { id: 'expansao', label: 'Mapa do Brasil', icon: MapPinned },
  { id: 'financas', label: 'Finanças', icon: Wallet },
  { id: 'conquistas', label: 'Conquistas', icon: Trophy },
];

export interface TabProps {
  goTo: (tab: TabId) => void;
}
