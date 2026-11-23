import { useState } from 'react';
import { Building2, Crown, Globe2, Home, Lock, MapPin, MapPinned, Route, Store, Truck, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge, Meter, Panel, PanelHeader, Stat, TipCard } from '../../../components/ui/Panel';
import { BRANCH_RAMP_MONTHS, LEVELS, LOGISTICS_PER_STATE, MAX_HOME_UNITS, SCOPES, VICTORY_STATES } from '../../../game/data';
import { closeBranch, expandScope, openBranch } from '../../../game/engine';
import {
  branchCloseRefund,
  branchMonthlyCost,
  branchOpenCost,
  branchRamp,
  checkCity,
  cityUnlockLevel,
  homeCity,
  homeUnits,
  marketReach,
  presentCities,
  presentRegions,
  presentStates,
} from '../../../game/expansion';
import { money, num } from '../../../game/format';
import { type CityDef, REGIONS, STATES, citiesOf, getCity, getRegion, getState, marketFactor } from '../../../game/geo';
import { costIndex, logisticsFactor } from '../../../game/simulation';
import type { Branch, GameState } from '../../../game/types';
import { cn } from '../../../lib/cn';
import { useActiveGame } from '../../../state/GameContext';

const pop = (c: CityDef) => `${c.pop.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi hab.`;

/** O estado tem alguma cidade que já dá (ou daria, com caixa) para abrir filial? */
function stateUnlocked(s: GameState, uf: string): boolean {
  return citiesOf(uf).some((c) => s.level >= cityUnlockLevel(s, c.id));
}

function BrazilMap({ game, selected, onSelect }: { game: GameState; selected: string; onSelect: (uf: string) => void }) {
  const states = presentStates(game);
  const cities = presentCities(game);
  const home = homeCity(game);
  return (
    <div className="grid w-max grid-cols-6 gap-1.5" role="group" aria-label="Mapa do Brasil por estados">
      {STATES.map((st) => {
        const region = getRegion(st.region);
        const present = states.has(st.uf);
        const count = citiesOf(st.uf).filter((c) => cities.has(c.id)).length;
        const isHome = st.uf === home.uf;
        const unlocked = stateUnlocked(game, st.uf);
        return (
          <button
            key={st.uf}
            type="button"
            onClick={() => onSelect(st.uf)}
            aria-pressed={selected === st.uf}
            aria-label={`${st.name} (${st.uf}), região ${region.label}${present ? `: presente em ${count} ${count === 1 ? 'cidade' : 'cidades'}` : ''}${isHome ? ', estado da sede' : ''}`}
            title={st.name}
            style={{
              gridColumn: st.col + 1,
              gridRow: st.row + 1,
              background: present ? region.color : `${region.color}26`,
              borderColor: `${region.color}${present ? 'ff' : '66'}`,
            }}
            className={cn(
              'relative flex size-11 flex-col items-center justify-center rounded-lg border text-[11px] font-bold transition hover:brightness-125 sm:size-12',
              present ? 'text-ink-950' : 'text-slate-200',
              !unlocked && !present && 'opacity-45',
              selected === st.uf && 'ring-2 ring-white ring-offset-2 ring-offset-ink-900',
            )}
          >
            {st.uf}
            {isHome ? (
              <Home className="size-3" aria-hidden />
            ) : count > 0 ? (
              <span className="text-[9px] font-semibold">{count}×</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function CityCard({ game, city }: { game: GameState; city: CityDef }) {
  const { act } = useActiveGame();
  const check = checkCity(game, city.id);
  const cost = branchOpenCost(game, city.id);
  const monthly = branchMonthlyCost(game, city.id) * costIndex(game);
  const isHome = city.id === game.homeCity;
  const branch = isHome ? null : game.branches.find((b) => b.city === city.id);
  const units = homeUnits(game).length;
  const fees = [cost.stateFee ? `inscrição estadual ${money(cost.stateFee)}` : '', cost.regionFee ? `centro de distribuição ${money(cost.regionFee)}` : ''].filter(Boolean);

  return (
    <li className={cn('rounded-2xl border p-3.5', isHome ? 'border-violet-400/40 bg-violet-500/[0.08]' : branch ? 'border-emerald-400/30 bg-emerald-500/[0.06]' : 'border-white/[0.08] bg-white/[0.03]')}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display font-bold text-white">{city.name}</p>
        {city.capital && <Badge>Capital</Badge>}
        {isHome && (
          <Badge tone="violet">
            <Crown className="size-3" aria-hidden /> Sede
          </Badge>
        )}
        {branch && <Badge tone="good">Filial aberta</Badge>}
        <span className="ml-auto text-xs text-slate-400">{pop(city)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {isHome
          ? `Você tem ${units} de ${MAX_HOME_UNITS} unidades extras em outros bairros. Cada uma soma capacidade e um pouco de mercado.`
          : `Mercado ${marketFactor(city).toFixed(1).replace('.', ',')}× o de um bairro. Quanto maior a cidade, maior a concorrência.`}
      </p>

      {branch ? (
        <BranchStatus game={game} branch={branch} />
      ) : check.reason ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-slate-400">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {check.reason}
        </p>
      ) : (
        <div className="mt-2.5">
          <p className="text-xs text-slate-400">
            Abertura {money(cost.base)}
            {fees.length > 0 && <span className="text-amber-300"> + {fees.join(' + ')}</span>} · depois ≈ {money(monthly)}/mês
          </p>
          <Button
            size="sm"
            className="mt-2 h-auto min-h-9 w-full whitespace-normal py-1.5"
            variant={isHome ? 'secondary' : 'primary'}
            disabled={game.cash < cost.total}
            onClick={() => act((s) => openBranch(s, city.id))}
            icon={isHome ? <Building2 className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
          >
            {isHome ? 'Nova unidade' : 'Abrir filial'} · {money(cost.total)}
          </Button>
          {game.cash < cost.total && <p className="mt-1 text-center text-[11px] text-rose-300">Faltam {money(cost.total - game.cash)} no caixa.</p>}
        </div>
      )}
    </li>
  );
}

function BranchStatus({ game, branch }: { game: GameState; branch: Branch }) {
  const { act } = useActiveGame();
  const [confirm, setConfirm] = useState(false);
  const ramp = branchRamp(game, branch);
  const left = Math.ceil((1 - ramp) * BRANCH_RAMP_MONTHS);
  const city = getCity(branch.city);
  return (
    <div className="mt-2.5 space-y-2">
      <div>
        <div className="flex justify-between text-xs text-slate-300">
          <span>{ramp >= 1 ? 'Filial madura: rendendo tudo' : `Conquistando a clientela (${left} ${left === 1 ? 'mês' : 'meses'})`}</span>
          <span className="tabular-nums text-slate-400">Desde o mês {branch.month}</span>
        </div>
        <Meter value={ramp * 100} size="xs" className="mt-1" label={`Maturidade da filial de ${city?.name ?? ''}`} color={ramp >= 1 ? '#34d399' : undefined} />
      </div>
      <p className="text-xs text-slate-500">Custo ≈ {money(branchMonthlyCost(game, branch.city) * costIndex(game))}/mês</p>
      {confirm ? (
        <div className="flex gap-2">
          <Button size="sm" variant="danger" className="flex-1" onClick={() => act((s) => closeBranch(s, branch.id))}>
            Fechar e receber {money(branchCloseRefund(game, branch))}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setConfirm(false)} aria-label="Cancelar fechamento">
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="w-full" onClick={() => setConfirm(true)}>
          Fechar filial
        </Button>
      )}
    </div>
  );
}

/** Mapa do Brasil: escolha onde abrir filiais e acompanhe a expansão. */
export function ExpansionTab() {
  const { game, act } = useActiveGame();
  const home = homeCity(game);
  const [uf, setUf] = useState(home.uf);
  const state = getState(uf) ?? getState(home.uf)!;
  const region = getRegion(state.region);
  const cities = presentCities(game);
  const states = presentStates(game);
  const regions = presentRegions(game);
  const branchesAway = game.branches.filter((b) => b.city !== game.homeCity);
  const nextScope = SCOPES[game.scopeLevel + 1];
  const logistics = logisticsFactor(game) - 1;
  const top = LEVELS[LEVELS.length - 1].requirements;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Expansão</p>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Mapa do Brasil</h1>
        <p className="text-sm text-slate-400">
          Sede em {home.name} ({home.uf}) · atuação: {SCOPES[game.scopeLevel].label.toLowerCase()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={MapPin} label="Cidades" value={num(cities.size)} hint={`Império: ${top.cities ?? 0} cidades`} tone={cities.size >= (top.cities ?? 0) ? 'good' : 'default'} />
        <Stat icon={Route} label="Estados" value={`${states.size}/${STATES.length}`} hint={`Para vencer: ${VICTORY_STATES} estados`} tone={states.size >= VICTORY_STATES ? 'good' : 'default'} />
        <Stat icon={Globe2} label="Regiões" value={`${regions.size}/${REGIONS.length}`} hint={`Mercado total: ${marketReach(game).toFixed(1).replace('.', ',')}× um bairro`} />
        <Stat icon={Truck} label="Logística" value={logistics > 0.001 ? `+${(logistics * 100).toFixed(1).replace('.', ',')}%` : '—'} hint="No custo de produção, por levar produtos a outros estados" tone={logistics > 0.05 ? 'warn' : 'default'} />
      </div>

      {nextScope && (
        <Panel className="flex flex-wrap items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <Store className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-white">Primeiro, conquiste a sua cidade</p>
            <p className="text-sm text-slate-400">
              Vender para a {nextScope.label.toLowerCase()} de {home.name} multiplica seu público por {String(nextScope.multiplier).replace('.', ',')} e libera as filiais.
            </p>
          </div>
          {game.level < nextScope.unlockLevel ? (
            <Badge>
              <Lock className="size-3" aria-hidden /> Nível {nextScope.unlockLevel}
            </Badge>
          ) : (
            <Button onClick={() => act(expandScope)} disabled={game.cash < nextScope.cost}>
              Expandir por {money(nextScope.cost)}
            </Button>
          )}
        </Panel>
      )}

      <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
        <Panel className="space-y-4">
          <PanelHeader icon={MapPinned} title="Estados" subtitle="Clique em um estado para ver as cidades." accent="emerald" className="mb-0" />
          <BrazilMap game={game} selected={state.uf} onSelect={setUf} />
          <ul className="space-y-1 text-xs">
            {REGIONS.map((r) => {
              const all = STATES.filter((s) => s.region === r.id);
              const mine = all.filter((s) => states.has(s.uf)).length;
              return (
                <li key={r.id} className="flex items-center gap-2 text-slate-300">
                  <span className="size-3 rounded" style={{ background: r.color }} aria-hidden />
                  <span className="flex-1">{r.label}</span>
                  <span className="tabular-nums text-slate-500">
                    {mine}/{all.length}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Home className="size-3" aria-hidden /> estado da sede · cor forte = você está lá
          </p>
        </Panel>

        <Panel>
          <PanelHeader
            icon={MapPin}
            title={`${state.name} (${state.uf})`}
            subtitle={
              <>
                Região <span style={{ color: region.color }}>{region.label}</span>
                {states.has(state.uf) ? ' · você já está neste estado' : state.uf === home.uf ? '' : ' · estado novo: paga inscrição estadual'}
              </>
            }
            accent="violet"
          />
          <ul className="grid gap-3 xl:grid-cols-2">
            {citiesOf(state.uf).map((c) => (
              <CityCard key={c.id} game={game} city={c} />
            ))}
          </ul>
        </Panel>
      </div>

      {branchesAway.length > 0 && (
        <Panel>
          <PanelHeader icon={Building2} title={`Suas filiais (${branchesAway.length})`} subtitle="Cada filial soma mercado, capacidade e custo fixo." accent="blue" />
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {branchesAway.map((b) => {
              const c = getCity(b.city);
              const ramp = branchRamp(game, b);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => c && setUf(c.uf)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] p-2.5 text-left text-sm ring-1 ring-white/10 transition hover:bg-white/[0.06]"
                  >
                    <MapPin className="size-4 shrink-0 text-emerald-300" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white">
                        {c?.name} ({c?.uf})
                      </span>
                      <Meter value={ramp * 100} size="xs" className="mt-1" label={`Maturidade da filial de ${c?.name ?? ''}`} color={ramp >= 1 ? '#34d399' : undefined} />
                    </span>
                    <span className="text-xs tabular-nums text-slate-400">{money(branchMonthlyCost(game, b.city) * costIndex(game))}/mês</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <TipCard title="Expandir com estratégia">
        Cidades grandes têm mais clientes, mas custam mais e trazem mais concorrência. Cada filial leva {BRANCH_RAMP_MONTHS} meses para render tudo, então abra
        com caixa para aguentar esse começo. Cada estado a mais encarece a produção em {String(LOGISTICS_PER_STATE * 100).replace('.', ',')}% (frete e
        distribuição): um coordenador de logística reduz esse custo.
      </TipCard>
    </div>
  );
}
