import { useState } from 'react';
import { Building2, Globe2, Lock, ShoppingBag, Store } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, TipCard } from '../../../components/ui/Panel';
import { INFRA, NEW_UNIT_RENT, NEW_UNIT_UNLOCK, SCOPES } from '../../../game/data';
import { expandOffice, expandScope, newUnitCost, openUnit } from '../../../game/engine';
import { money } from '../../../game/format';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { applyGameAction } from '../../../world/actions';
import { ProductTab } from '../../game/tabs/ProductTab';
import { SidePanel } from '../SidePanel';

function Card({
  icon: Icon,
  title,
  description,
  badges,
  cost,
  locked,
  done,
  onBuy,
  cash,
}: {
  icon: typeof Store;
  title: string;
  description: string;
  badges: string[];
  cost: number;
  locked?: string;
  done?: string;
  onBuy: () => void;
  cash: number;
}) {
  return (
    <div className={cn('flex flex-col rounded-2xl border p-4', locked ? 'border-white/5 bg-white/[0.02] opacity-70' : 'border-white/10 bg-white/[0.03]')}>
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
          <Icon className="size-5" aria-hidden />
        </span>
        <p className="font-display text-lg font-bold text-white">{title}</p>
      </div>
      <p className="mt-2 flex-1 text-sm text-slate-400">{description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <Badge key={b}>{b}</Badge>
        ))}
      </div>
      {done ? (
        <p className="mt-3 text-sm font-semibold text-emerald-300">{done}</p>
      ) : locked ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-400">
          <Lock className="size-4" aria-hidden /> {locked}
        </p>
      ) : (
        <Button className="mt-3" onClick={onBuy} disabled={cash < cost}>
          Comprar por {money(cost)}
        </Button>
      )}
    </div>
  );
}

export function ShopPanel() {
  const { game } = useActiveGame();
  const [tab, setTab] = useState<'expansao' | 'produto'>('expansao');
  const close = () => patchUi({ panel: null });
  const nextInfra = INFRA[game.infraLevel + 1];
  const nextScope = SCOPES[game.scopeLevel + 1];
  const unitCost = newUnitCost(game);

  return (
    <SidePanel title="Comprar" subtitle="Expansões, produtos e preço" icon={ShoppingBag} accent="from-emerald-400 to-teal-500" onClose={close} wide>
      <div className="mb-4 inline-flex gap-1 rounded-xl bg-white/[0.04] p-1" role="tablist">
        {(
          [
            ['expansao', 'Expansão'],
            ['produto', 'Produto e preço'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('rounded-lg px-4 py-1.5 text-sm font-semibold transition', tab === id ? 'bg-emerald-500 text-ink-950' : 'text-slate-400 hover:text-white')}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'produto' ? (
        <ProductTab />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Card
              icon={Building2}
              title="Ampliar o escritório"
              description={nextInfra ? `${nextInfra.label}: ${nextInfra.description}` : 'Seu espaço já está no tamanho máximo.'}
              badges={nextInfra ? [`Capacidade ${nextInfra.capacity}/mês`, `Aluguel ${money(nextInfra.rent)}`] : []}
              cost={nextInfra?.upgradeCost ?? 0}
              done={nextInfra ? undefined : 'Tamanho máximo'}
              onBuy={() => applyGameAction(expandOffice) && close()}
              cash={game.cash}
            />
            <Card
              icon={Globe2}
              title="Expandir o mercado"
              description={nextScope ? `Vender para ${nextScope.label.toLowerCase()}: público ${nextScope.multiplier}× maior. Novas áreas da cidade são liberadas.` : 'Você já atua no Brasil todo.'}
              badges={nextScope ? [`Atual: ${SCOPES[game.scopeLevel].label}`, `Próximo: ${nextScope.label}`] : []}
              cost={nextScope?.cost ?? 0}
              locked={nextScope && game.level < nextScope.unlockLevel ? `Libera no nível ${nextScope.unlockLevel}` : undefined}
              done={nextScope ? undefined : 'Mercado máximo'}
              onBuy={() => applyGameAction(expandScope)}
              cash={game.cash}
            />
            <Card
              icon={Store}
              title="Abrir nova unidade"
              description="Uma filial aumenta a capacidade de atendimento e aparece na cidade."
              badges={[`Unidades: ${game.units}`, `Aluguel ${money(NEW_UNIT_RENT)}/mês`]}
              cost={unitCost}
              locked={game.level < NEW_UNIT_UNLOCK ? `Libera no nível ${NEW_UNIT_UNLOCK}` : undefined}
              onBuy={() => applyGameAction(openUnit)}
              cash={game.cash}
            />
          </div>
          <TipCard title="Crescer com cuidado">
            Toda expansão aumenta os custos fixos. Expanda quando os clientes já estiverem sobrando (pedidos não atendidos) ou quando o mercado atual estiver
            saturado.
          </TipCard>
        </div>
      )}
    </SidePanel>
  );
}
