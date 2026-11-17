import type { LucideIcon } from 'lucide-react';
import { Factory, Globe2, LayoutDashboard, Megaphone, ShoppingCart, Trophy, Users, Wallet } from 'lucide-react';

/** Aplicativos do computador da empresa (sistema de gestão). */
export type TabId = 'painel' | 'mercado' | 'marketing' | 'vendas' | 'produto' | 'equipe' | 'financas' | 'conquistas';

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'painel', label: 'Painel', icon: LayoutDashboard },
  { id: 'mercado', label: 'Mercado', icon: Globe2 },
  { id: 'marketing', label: 'Campanhas', icon: Megaphone },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'produto', label: 'Produto e preço', icon: Factory },
  { id: 'equipe', label: 'Equipe e expansão', icon: Users },
  { id: 'financas', label: 'Finanças', icon: Wallet },
  { id: 'conquistas', label: 'Conquistas', icon: Trophy },
];

export interface TabProps {
  goTo: (tab: TabId) => void;
}
