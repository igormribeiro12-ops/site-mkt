import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Factory,
  Gauge,
  Home,
  MapPin,
  Palette,
  Rocket,
  Store,
  User,
  WandSparkles,
} from 'lucide-react';
import { CompanyLogo, FONTS, LogoMark, SHAPES } from '../../components/CompanyLogo';
import { Button } from '../../components/ui/Button';
import { ChoiceCard, TextArea, TextField } from '../../components/ui/Field';
import { Badge, Meter, Panel, TipCard } from '../../components/ui/Panel';
import {
  DESIGN_PACKAGES,
  DIFFICULTIES,
  PRODUCT_TIERS,
  SEGMENTS,
  START_STRUCTURES,
  STARTING_CAPITAL,
  getSegment,
  positioning,
  priceRange,
  qualityExpectation,
} from '../../game/data';
import { setupCosts } from '../../game/engine';
import { STATES, cityLabel, citiesOf, getCity, getRegion, getState, statesOf } from '../../game/geo';
import { money, pct } from '../../game/format';
import { suggestAll, suggestDescriptions, suggestDifferentials, suggestNames, suggestProducts, suggestSlogans } from '../../game/ideas';
import type { DifficultyId, LogoDesign, SegmentId, SetupDraft } from '../../game/types';
import { cn } from '../../lib/cn';
import { LOGO_ICONS } from '../../lib/logoIcons';
import { useGame } from '../../state/GameContext';
import { CharacterCreator } from './CharacterCreator';
import { IdeaChips } from './IdeaChips';

type IdeaField = 'name' | 'product' | 'slogan' | 'description' | 'differential';

const STEPS = [
  { title: 'Personagem', icon: User },
  { title: 'Mercado', icon: Store },
  { title: 'Empresa', icon: Building2 },
  { title: 'Identidade', icon: Palette },
  { title: 'Operação', icon: Factory },
  { title: 'Abertura', icon: Rocket },
];

const PALETTES = [
  ['#3b82f6', '#8b5cf6'],
  ['#10b981', '#06b6d4'],
  ['#f43f5e', '#f97316'],
  ['#eab308', '#ef4444'],
  ['#ec4899', '#a855f7'],
  ['#14b8a6', '#84cc16'],
  ['#6366f1', '#22d3ee'],
  ['#f8fafc', '#94a3b8'],
];

type Errors = Record<string, string>;

function validate(step: number, d: SetupDraft): Errors {
  const e: Errors = {};
  const need = (key: keyof SetupDraft, min: number, msg: string) => {
    const v = String(d[key] ?? '').trim();
    if (v.length < min) e[key] = msg;
  };
  if (step === 0) need('playerName', 2, 'Digite seu nome (pelo menos 2 letras).');
  if (step === 1 && !d.segment) e.segment = 'Escolha o mercado em que você vai competir.';
  if (step === 2) {
    need('name', 2, 'Dê um nome para a empresa.');
    need('slogan', 3, 'Crie um slogan (ou use o gerador).');
    need('description', 10, 'Descreva a empresa em uma frase (10+ letras).');
    need('product', 3, 'Qual é o produto principal?');
    need('differential', 5, 'Qual é o seu diferencial competitivo?');
  }
  return e;
}

function StatBar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-slate-200">{display}</span>
      </div>
      <Meter value={value} size="xs" className="mt-1" />
    </div>
  );
}

export function SetupWizard({ onExit, onStart }: { onExit: () => void; onStart: () => void }) {
  const { draft, setDraft, startGame, resetDraft } = useGame();
  const [errors, setErrors] = useState<Errors>({});
  const [ideas, setIdeas] = useState<Record<IdeaField, string[]>>({ name: [], product: [], slogan: [], description: [], differential: [] });
  const step = draft.step;
  const costs = setupCosts(draft);
  const seg = draft.segment ? getSegment(draft.segment) : null;

  const go = (next: number) => {
    if (next > step) {
      const found = validate(step, draft);
      setErrors(found);
      if (Object.keys(found).length) {
        requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-field-error="true"] input, [data-field-error="true"] textarea')?.focus());
        return;
      }
    }
    setErrors({});
    setDraft({ step: next });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const set = (patch: Partial<SetupDraft>) => {
    setDraft(patch);
    if (Object.keys(errors).length) setErrors(validate(step, { ...draft, ...patch }));
  };
  const setLogo = (patch: Partial<LogoDesign>) => setDraft({ logo: { ...draft.logo, ...patch } });

  let content: ReactNode = null;

  if (step === 0) {
    content = (
      <div className="space-y-6">
        <TextField
          id="player-name"
          label="Qual é o seu nome, empreendedor(a)?"
          required
          autoFocus
          value={draft.playerName}
          maxLength={30}
          placeholder="Seu nome"
          error={errors.playerName}
          onChange={(e) => set({ playerName: e.target.value })}
        />
        <CharacterCreator avatar={draft.avatar} onChange={(avatar) => setDraft({ avatar })} />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">Nível de dificuldade</legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {DIFFICULTIES.map((d) => (
              <ChoiceCard key={d.id} name="difficulty" value={d.id} checked={draft.difficulty === d.id} onChange={(v) => set({ difficulty: v as DifficultyId })} className="flex-col gap-2 p-4">
                <span className="flex items-center gap-2 font-display text-lg font-bold text-white">
                  <Gauge
                    className={cn('size-5', d.id === 'facil' ? 'text-emerald-300' : d.id === 'normal' ? 'text-sky-300' : d.id === 'dificil' ? 'text-rose-300' : 'text-fuchsia-300')}
                    aria-hidden
                  />
                  {d.label}
                </span>
                <span className="text-xs leading-snug text-slate-400">{d.description}</span>
                <span className="mt-1 text-[11px] text-slate-500">
                  Limite de dívidas: {money(d.debtLimit)} · inflação de {(d.inflation * 100).toFixed(1).replace('.', ',')}% ao mês
                </span>
              </ChoiceCard>
            ))}
          </div>
        </fieldset>
        <TipCard title="Seu capital inicial">
          Todo mundo começa com <strong className="text-white">{money(STARTING_CAPITAL)}</strong>. Você vai usar esse dinheiro para
          abrir a empresa, criar a marca, desenvolver o produto e, depois, investir em marketing e pagar as contas.
        </TipCard>
      </div>
    );
  }

  if (step === 1) {
    content = (
      <fieldset data-field-error={errors.segment ? 'true' : undefined}>
        <legend className="mb-1 text-sm font-semibold text-slate-200">Onde você quer competir?</legend>
        <p className="mb-4 text-xs text-slate-500">Cada mercado tem demanda, concorrência, poder de compra e dificuldade diferentes.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SEGMENTS.map((s) => {
            const Icon = s.icon;
            const potential = s.baseDemand * s.refPrice;
            return (
              <ChoiceCard
                key={s.id}
                name="segment"
                value={s.id}
                checked={draft.segment === s.id}
                onChange={(v) => {
                  const next = getSegment(v as SegmentId);
                  set({ segment: next.id, price: next.refPrice });
                }}
                className="flex-col gap-3 p-4"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06] text-violet-300">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-bold text-white">{s.label}</span>
                    <span className="block truncate text-xs text-slate-400">{s.tagline}</span>
                  </span>
                  {draft.segment === s.id && <Check className="size-5 text-violet-300" aria-hidden />}
                </span>
                <span className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <StatBar label="Demanda" value={(potential / 115000) * 100} display={`${money(potential / 1000)} mil/mês`} />
                  <StatBar label="Concorrência" value={s.competition} display={`${s.competition}/100`} />
                  <StatBar label="Poder de compra" value={s.purchasingPower} display={`${s.purchasingPower}/100`} />
                  <StatBar label="Dificuldade de entrada" value={s.entryDifficulty} display={`${s.entryDifficulty}/100`} />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <Badge tone={s.trend >= 0.03 ? 'good' : s.trend > 0 ? 'info' : 'default'}>Tendência {s.trend > 0 ? '+' : ''}{pct(s.trend, 0)}/mês</Badge>
                  <Badge>Ticket médio {money(s.refPrice)}</Badge>
                  <Badge tone="warn">Abertura {money(s.openingCost)}</Badge>
                </span>
              </ChoiceCard>
            );
          })}
        </div>
        {errors.segment && <p className="mt-3 text-sm font-medium text-rose-300">{errors.segment}</p>}
      </fieldset>
    );
  }

  if (step === 2 && seg) {
    const segment = seg.id;
    const ask = (field: IdeaField, list: string[]) => setIdeas((prev) => ({ ...prev, [field]: list }));
    content = (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.07] p-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
            <WandSparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Assistente de ideias</p>
            <p className="text-xs text-slate-400">Sem inspiração? Peça sugestões em cada campo ou preencha tudo de uma vez — depois é só ajustar do seu jeito.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const filled = suggestAll(segment, draft, draft.playerName, draft.avatar.gender);
              set(filled);
            }}
          >
            Preencher campos vazios
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <TextField id="company-name" label="Nome da empresa" required autoFocus value={draft.name} maxLength={32} placeholder="Ex.: Nexa, Doce Lar, Vibe Store" error={errors.name} onChange={(e) => set({ name: e.target.value })} />
            <IdeaChips label="Sugerir nomes" ideas={ideas.name} value={draft.name} onGenerate={() => ask('name', suggestNames(segment, draft.playerName, draft.avatar.gender, 4))} onPick={(v) => set({ name: v })} />
          </div>
          <div>
            <TextField id="company-product" label="Produto principal" required value={draft.product} maxLength={60} placeholder={`Ex.: ${seg.productExample}`} error={errors.product} onChange={(e) => set({ product: e.target.value })} />
            <IdeaChips label="Sugerir produtos" ideas={ideas.product} value={draft.product} onGenerate={() => ask('product', suggestProducts(segment, 4))} onPick={(v) => set({ product: v })} />
          </div>
        </div>
        <div>
          <TextField id="company-slogan" label="Slogan" required value={draft.slogan} maxLength={70} placeholder="Uma frase curta e marcante" error={errors.slogan} onChange={(e) => set({ slogan: e.target.value })} />
          <IdeaChips label="Gerar ideias de slogan" ideas={ideas.slogan} value={draft.slogan} onGenerate={() => ask('slogan', suggestSlogans(segment, draft.name, 4))} onPick={(v) => set({ slogan: v })} />
        </div>
        <div>
          <TextArea id="company-description" label="Descrição da empresa" required value={draft.description} maxLength={200} placeholder="O que a empresa faz e para quem" error={errors.description} onChange={(e) => set({ description: e.target.value })} />
          <IdeaChips block label="Sugerir descrições" ideas={ideas.description} value={draft.description} onGenerate={() => ask('description', suggestDescriptions(segment, draft.name, draft.product, 3))} onPick={(v) => set({ description: v })} />
        </div>
        <div>
          <TextArea id="company-differential" label="Diferencial competitivo" required value={draft.differential} maxLength={160} placeholder="Por que o cliente escolheria você e não o concorrente?" error={errors.differential} onChange={(e) => set({ differential: e.target.value })} />
          <IdeaChips block label="Sugerir diferenciais" ideas={ideas.differential} value={draft.differential} onGenerate={() => ask('differential', suggestDifferentials(segment, 4))} onPick={(v) => set({ differential: v })} />
        </div>
        <TipCard title={`Conheça sua persona: ${seg.persona.name}, ${seg.persona.age} anos`}>
          {seg.persona.description} {seg.persona.channels}
        </TipCard>
      </div>
    );
  }

  if (step === 3) {
    content = (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent p-6">
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {(['horizontal', 'stacked', 'badge'] as const).map((layout) => (
              <ChoiceCard key={layout} name="layout" value={layout} checked={draft.logo.layout === layout} onChange={(v) => setLogo({ layout: v as LogoDesign['layout'] })} className="min-h-32 flex-col items-center justify-center gap-2 p-4">
                <CompanyLogo logo={draft.logo} name={draft.name} size="sm" layout={layout} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {layout === 'horizontal' ? 'Horizontal' : layout === 'stacked' ? 'Empilhado' : 'Emblema'}
                </span>
              </ChoiceCard>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">Cores</p>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map(([a, b]) => {
              const active = draft.logo.primary === a && draft.logo.secondary === b;
              return (
                <button
                  key={a + b}
                  type="button"
                  aria-label={`Paleta ${a} e ${b}`}
                  aria-pressed={active}
                  onClick={() => setLogo({ primary: a, secondary: b })}
                  className={cn('size-10 rounded-xl ring-2 transition hover:scale-110', active ? 'ring-white' : 'ring-transparent')}
                  style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                />
              );
            })}
            <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-slate-300">
              Principal
              <input type="color" value={draft.logo.primary} onChange={(e) => setLogo({ primary: e.target.value })} className="size-7 cursor-pointer rounded bg-transparent" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-slate-300">
              Secundária
              <input type="color" value={draft.logo.secondary} onChange={(e) => setLogo({ secondary: e.target.value })} className="size-7 cursor-pointer rounded bg-transparent" />
            </label>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-200">Forma</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Forma do símbolo">
              {SHAPES.map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.logo.shape === sh.id}
                  aria-label={sh.label}
                  title={sh.label}
                  onClick={() => setLogo({ shape: sh.id })}
                  className={cn('rounded-xl p-1.5 ring-2 transition', draft.logo.shape === sh.id ? 'ring-violet-400' : 'ring-transparent hover:ring-white/20')}
                >
                  <LogoMark logo={{ ...draft.logo, shape: sh.id }} size="sm" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-200">Tipografia</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipografia">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.logo.font === f.id}
                  onClick={() => setLogo({ font: f.id })}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left transition',
                    draft.logo.font === f.id ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 hover:border-white/25',
                  )}
                >
                  <span className={cn('block text-lg text-white', f.className)}>Aa</span>
                  <span className="text-[11px] text-slate-400">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">Símbolo</p>
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-12" role="radiogroup" aria-label="Símbolo">
            {LOGO_ICONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={draft.logo.icon === key}
                aria-label={label}
                title={label}
                onClick={() => setLogo({ icon: key })}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg border transition',
                  draft.logo.icon === key ? 'border-violet-400 bg-violet-500/25 text-white' : 'border-white/[0.08] text-slate-400 hover:border-white/25 hover:text-white',
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">Quem cria a identidade visual?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {DESIGN_PACKAGES.map((p) => (
              <ChoiceCard key={p.id} name="design" value={p.id} checked={draft.designPackage === p.id} onChange={(v) => set({ designPackage: v as SetupDraft['designPackage'] })} className="flex-col gap-1.5 p-4">
                <span className="font-display font-bold text-white">{p.label}</span>
                <span className="font-display text-lg font-bold text-amber-300">{p.cost ? money(p.cost) : 'Grátis'}</span>
                <span className="text-xs leading-snug text-slate-400">{p.description}</span>
                {p.reputation > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-300">
                    +{p.reputation} reputação · +{p.awareness} reconhecimento
                  </span>
                )}
              </ChoiceCard>
            ))}
          </div>
        </fieldset>
      </div>
    );
  }

  if (step === 4 && seg) {
    const tier = PRODUCT_TIERS.find((t) => t.id === draft.productTier)!;
    const price = draft.price ?? seg.refPrice;
    const range = priceRange(seg.refPrice);
    const unit = seg.refPrice * seg.unitCostRatio * (0.75 + (0.5 * tier.quality) / 100);
    const pos = positioning(price / seg.refPrice);
    const homeCityDef = getCity(draft.homeCity);
    content = (
      <div className="space-y-6">
        <div>
          <label htmlFor="home-city" className="mb-1 block text-sm font-semibold text-slate-200">
            Em que cidade fica a sede?
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Você começa no seu bairro. A sede define o seu estado e a sua região: filiais perto de casa liberam no nível 4; no resto do Brasil, no nível 5.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06] text-emerald-300">
              <MapPin className="size-5" aria-hidden />
            </span>
            <select
              id="home-city"
              value={draft.homeCity}
              onChange={(e) => set({ homeCity: e.target.value })}
              className="h-11 min-w-[16rem] flex-1 rounded-xl border border-white/10 bg-ink-900 px-3 text-sm text-white focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/30"
            >
              {STATES.map((st) => (
                <optgroup key={st.uf} label={`${st.name} (${st.uf})`}>
                  {citiesOf(st.uf).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.capital ? ' (capital)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {homeCityDef && (
              <Badge tone="info">
                Região {getRegion(getState(homeCityDef.uf)!.region).label} · {statesOf(getState(homeCityDef.uf)!.region).length} estados
              </Badge>
            )}
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">Onde a empresa vai funcionar?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {START_STRUCTURES.map((st) => (
              <ChoiceCard key={st.id} name="structure" value={st.id} checked={draft.structure === st.id} onChange={(v) => set({ structure: v as SetupDraft['structure'] })} className="items-start gap-3 p-4">
                <Home className="mt-0.5 size-5 shrink-0 text-sky-300" aria-hidden />
                <span>
                  <span className="block font-display font-bold text-white">{st.label}</span>
                  <span className="font-display font-bold text-amber-300">{st.cost ? money(st.cost) : 'Sem custo'}</span>
                  <span className="mt-1 block text-xs text-slate-400">{st.description}</span>
                </span>
              </ChoiceCard>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-slate-200">Desenvolvimento do produto</legend>
          <p className="mb-2 text-xs text-slate-500">Os clientes de {seg.label.toLowerCase()} esperam qualidade de pelo menos {qualityExpectation(seg)}/100.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {PRODUCT_TIERS.map((t) => (
              <ChoiceCard key={t.id} name="tier" value={t.id} checked={draft.productTier === t.id} onChange={(v) => set({ productTier: v as SetupDraft['productTier'] })} className="flex-col gap-1.5 p-4">
                <span className="font-display font-bold text-white">{t.label}</span>
                <span className="font-display text-lg font-bold text-amber-300">{money(t.cost)}</span>
                <span className="text-xs text-slate-400">{t.description}</span>
                <span className={cn('text-[11px] font-semibold', t.quality >= qualityExpectation(seg) ? 'text-emerald-300' : 'text-amber-300')}>Qualidade {t.quality}/100</span>
              </ChoiceCard>
            ))}
          </div>
        </fieldset>
        <div>
          <div className="mb-2 flex items-end justify-between">
            <label htmlFor="price" className="text-sm font-semibold text-slate-200">
              Preço de venda
            </label>
            <Badge tone={pos.tone === 'premium' ? 'violet' : pos.tone === 'econ' ? 'info' : 'good'}>{pos.label}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <input id="price" type="range" min={range.min} max={range.max} step={1} value={price} onChange={(e) => set({ price: Number(e.target.value) })} className="flex-1" />
            <span className="w-24 text-right font-display text-2xl font-bold text-white">{money(price)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Média do mercado: {money(seg.refPrice)} · Custo para produzir cada unidade ≈ {money(unit)} · Sobra por venda ≈{' '}
            <strong className={price - unit > 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(price - unit)}</strong> (antes de impostos e despesas)
          </p>
        </div>
        <TipCard title="Posicionamento">
          Preço baixo atrai mais clientes, mas com margem menor. Preço alto exige qualidade e marca fortes. Você pode mudar o preço a
          qualquer momento durante o jogo.
        </TipCard>
      </div>
    );
  }

  if (step === 5 && seg) {
    const rows = [
      { label: `Abertura da empresa (${seg.label})`, value: costs.opening },
      { label: `Identidade visual: ${DESIGN_PACKAGES.find((p) => p.id === draft.designPackage)!.label}`, value: costs.design },
      { label: `Produto: ${PRODUCT_TIERS.find((p) => p.id === draft.productTier)!.label}`, value: costs.product },
      { label: `Estrutura: ${START_STRUCTURES.find((s) => s.id === draft.structure)!.label}`, value: costs.structure },
    ];
    content = (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-violet-500/10 via-transparent to-emerald-500/10 p-8 text-center">
          <CompanyLogo logo={draft.logo} name={draft.name} slogan={draft.slogan} size="lg" />
          <p className="max-w-md text-sm text-slate-400">{draft.description}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            <Badge tone="violet">{seg.label}</Badge>
            <Badge tone="info">Sede: {cityLabel(draft.homeCity)}</Badge>
            <Badge>{draft.product}</Badge>
            <Badge tone="good">Diferencial: {draft.differential}</Badge>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-white/[0.03]">
                <td className="px-4 py-2.5 text-slate-300">Capital inicial</td>
                <td className="px-4 py-2.5 text-right font-semibold text-emerald-300">{money(STARTING_CAPITAL)}</td>
              </tr>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-white/[0.05]">
                  <td className="px-4 py-2.5 text-slate-400">{r.label}</td>
                  <td className="px-4 py-2.5 text-right text-rose-300">{r.value ? `− ${money(r.value)}` : money(0)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/10 bg-white/[0.03]">
                <td className="px-4 py-3 font-semibold text-white">Caixa para começar a operar</td>
                <td className="px-4 py-3 text-right font-display text-xl font-bold text-white">{money(costs.remaining)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TipCard title="Capital de giro">
          {costs.remaining < 3000
            ? 'Sobrou pouco dinheiro. Cuidado: você ainda precisa investir em marketing e pagar as contas dos primeiros meses, que normalmente dão prejuízo.'
            : 'Esse dinheiro é o seu capital de giro: ele paga marketing e despesas até as vendas crescerem. Os primeiros meses costumam dar prejuízo.'}
        </TipCard>
      </div>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <div className="game-backdrop min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={onExit} icon={<ArrowLeft className="size-4" aria-hidden />}>
            <span className="hidden sm:inline">Menu</span>
          </Button>
          <ol className="flex flex-1 items-center justify-center gap-1 sm:gap-2" aria-label="Etapas da criação">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-center gap-1 sm:gap-2">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-bold transition',
                    i < step ? 'bg-emerald-500 text-ink-950' : i === step ? 'bg-violet-500 text-white ring-4 ring-violet-500/25' : 'bg-white/[0.07] text-slate-500',
                  )}
                  aria-current={i === step ? 'step' : undefined}
                >
                  {i < step ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span className={cn('hidden text-xs font-semibold lg:inline', i === step ? 'text-white' : 'text-slate-500')}>{s.title}</span>
                {i < STEPS.length - 1 && <span className="h-px w-3 bg-white/10 sm:w-6" aria-hidden />}
              </li>
            ))}
          </ol>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Capital</p>
            <p className={cn('font-display text-sm font-bold tabular-nums sm:text-base', costs.remaining < 3000 ? 'text-amber-300' : 'text-emerald-300')}>{money(costs.remaining)}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10">
        <Panel key={step} className="animate-fade-up p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-violet-900/40">
              <StepIcon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                Passo {step + 1} de {STEPS.length}
              </p>
              <h1 className="font-display text-2xl font-bold text-white">
                {['Quem é você?', 'Escolha seu mercado', 'Crie sua empresa', 'Identidade visual', 'Operação inicial', 'Tudo pronto para abrir!'][step]}
              </h1>
            </div>
          </div>
          {content}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-between">
            <Button variant="secondary" onClick={() => (step === 0 ? onExit() : go(step - 1))} icon={<ArrowLeft className="size-4" aria-hidden />}>
              {step === 0 ? 'Voltar ao menu' : 'Voltar'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="lg" onClick={() => go(step + 1)} iconRight={<ArrowRight className="size-5" aria-hidden />}>
                Continuar
              </Button>
            ) : (
              <Button
                size="lg"
                variant="success"
                onClick={() => {
                  startGame();
                  onStart();
                }}
                icon={<Rocket className="size-5" aria-hidden />}
              >
                Abrir minha empresa!
              </Button>
            )}
          </div>
        </Panel>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Capital disponível</p>
            <p className={cn('mt-1 font-display text-3xl font-bold tabular-nums', costs.remaining < 3000 ? 'text-amber-300' : 'text-emerald-300')}>{money(costs.remaining)}</p>
            <Meter value={costs.remaining} max={STARTING_CAPITAL} size="sm" className="mt-3" label="Capital disponível" />
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li className="flex justify-between"><span>Abertura</span><span>{money(costs.opening)}</span></li>
              <li className="flex justify-between"><span>Identidade visual</span><span>{money(costs.design)}</span></li>
              <li className="flex justify-between"><span>Produto</span><span>{money(costs.product)}</span></li>
              <li className="flex justify-between"><span>Estrutura</span><span>{money(costs.structure)}</span></li>
            </ul>
          </Panel>
          {step >= 2 && (
            <Panel className="flex flex-col items-center gap-2 text-center">
              <p className="self-start text-xs font-semibold uppercase tracking-wider text-slate-500">Sua marca</p>
              <CompanyLogo logo={draft.logo} name={draft.name} slogan={draft.slogan} size="md" />
            </Panel>
          )}
          {step > 0 && (
            <button type="button" onClick={() => { resetDraft(); setErrors({}); }} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-rose-300">
              Recomeçar a criação
            </button>
          )}
        </aside>
      </main>
    </div>
  );
}
