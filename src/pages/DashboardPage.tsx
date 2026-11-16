import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Building2,
  CircleCheck,
  CircleDashed,
  Layers,
  Megaphone,
  Package,
  Palette,
  Pencil,
  Presentation,
  Rocket,
  SquarePen,
  Users,
  Wallet,
} from 'lucide-react';
import { PersonaCard } from '../components/audience/PersonaCard';
import { BrandLogo, BrandMark, brandColors } from '../components/brand/BrandLogo';
import { ColorSwatches } from '../components/brand/BrandPreview';
import { PlatformIcon } from '../components/brand/PlatformIcon';
import { PitchText } from '../components/company/PitchCard';
import { EducationalDisclaimer, FinanceKpis } from '../components/finance/FinanceSummary';
import { MarketingSummary } from '../components/marketing/MarketingSummary';
import { PostPreview } from '../components/posts/PostPreview';
import { ProductCard } from '../components/products/ProductCard';
import { ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ProgressRing } from '../components/ui/Feedback';
import { useProject } from '../context/ProjectContext';
import { getBrandStyle, getChannel, segmentLabel } from '../lib/constants';
import { computeFinance } from '../lib/finance';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { getCompletedStepsCount, getOverallProgress, getStepCompletion, firstIncompleteStep } from '../lib/progress';
import { STEPS, stepPath } from '../lib/steps';
import { cn } from '../lib/cn';
import type { StepId } from '../types';

function Panel({
  icon: Icon,
  title,
  step,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  step: StepId;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('flex min-w-0 animate-fade-up flex-col', className)}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-100 text-violet-600">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <h2 className="flex-1 text-base font-bold text-slate-900">{title}</h2>
        <ButtonLink to={stepPath(step)} variant="ghost" size="sm" icon={<Pencil className="size-3.5" aria-hidden />}>
          Editar
        </ButtonLink>
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

function StepEmpty({ step, title, description }: { step: StepId; title: string; description: string }) {
  const meta = STEPS.find((s) => s.id === step)!;
  return (
    <EmptyState
      compact
      icon={meta.icon}
      title={title}
      description={description}
      action={
        <ButtonLink to={stepPath(step)} size="sm" variant="soft" iconRight={<ArrowRight className="size-4" aria-hidden />}>
          Ir para a etapa {meta.number}
        </ButtonLink>
      }
    />
  );
}

export function DashboardPage() {
  useDocumentTitle('Painel da empresa');
  const { project } = useProject();
  const { company, brand, audience, products, marketing, campaigns, finance } = project;
  const progress = getOverallProgress(project);
  const done = getCompletedStepsCount(project);
  const next = firstIncompleteStep(project);
  const { primary, secondary, onPrimary } = brandColors(brand);
  const hasBrandColors = Boolean(brand.primaryColor);
  const finance$ = computeFinance(finance, marketing.adBudget);
  const style = getBrandStyle(brand.style);
  const segment = segmentLabel(company.segment, company.segmentOther);
  const latest = [...campaigns].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const audienceStarted = getStepCompletion(project, 'publico') > 0;
  const companyStarted = getStepCompletion(project, 'empresa') > 0;

  const heroBg = hasBrandColors
    ? `linear-gradient(120deg, ${primary} 0%, ${secondary} 130%)`
    : 'linear-gradient(120deg, #2563eb 0%, #7c3aed 100%)';
  const heroText = hasBrandColors ? onPrimary : '#ffffff';

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Etapa final</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Painel da empresa</h1>
        <p className="mt-1 text-[15px] text-slate-500">Tudo o que você construiu, reunido em um só lugar.</p>
      </header>

      <section
        className="relative mb-6 animate-fade-up overflow-hidden rounded-3xl p-6 shadow-xl shadow-indigo-900/10 sm:p-8"
        style={{ background: heroBg, color: heroText }}
      >
        <span className="absolute -right-16 -top-20 size-64 rounded-full bg-white/10" aria-hidden />
        <span className="absolute -bottom-24 right-40 size-56 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            {company.name.trim() ? (
              <BrandLogo brand={brand} companyName={company.name} size="lg" inverted nameColor={heroText} />
            ) : (
              <div className="flex items-center gap-4">
                <span className="flex size-20 items-center justify-center rounded-[28%] bg-white/20">
                  <Rocket className="size-9" aria-hidden />
                </span>
                <div>
                  <p className="text-3xl font-extrabold">Sua empresa</p>
                  <p className="text-sm opacity-80">Ainda sem nome — comece pela etapa 1.</p>
                </div>
              </div>
            )}
            {brand.slogan.trim() && <p className="mt-4 max-w-xl text-lg font-medium opacity-90">“{brand.slogan}”</p>}
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              {segment && <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">{segment}</span>}
              {company.founder.trim() && (
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">Fundada por {company.founder}</span>
              )}
              {style && <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">Estilo {style.label.toLowerCase()}</span>}
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <div className="flex items-center gap-4 rounded-2xl bg-white/95 p-4 text-slate-800 shadow-lg">
              <ProgressRing value={progress} size={72} stroke={7}>
                <span className="text-lg font-extrabold">{progress}%</span>
              </ProgressRing>
              <div>
                <p className="text-sm font-bold">Empresa {progress === 100 ? 'completa!' : 'em construção'}</p>
                <p className="text-xs text-slate-500">
                  {done} de {STEPS.length} etapas completas
                </p>
                {next && (
                  <ButtonLink to={stepPath(next)} variant="ghost" size="sm" className="-ml-3 mt-1 text-violet-700" iconRight={<ArrowRight className="size-4" aria-hidden />}>
                    Continuar
                  </ButtonLink>
                )}
              </div>
            </div>
            <ButtonLink
              to="/apresentacao"
              size="lg"
              variant="secondary"
              className="border-0 shadow-lg"
              icon={<Presentation className="size-5 text-violet-600" aria-hidden />}
            >
              Apresentar minha empresa
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {STEPS.map((step) => {
          const completion = getStepCompletion(project, step.id);
          const complete = completion >= 1;
          return (
            <ButtonLink
              key={step.id}
              to={stepPath(step.id)}
              variant="secondary"
              size="sm"
              className="h-auto justify-start gap-2 py-2"
              icon={
                complete ? (
                  <CircleCheck className="size-4 shrink-0 text-emerald-500" aria-hidden />
                ) : (
                  <CircleDashed className="size-4 shrink-0 text-slate-400" aria-hidden />
                )
              }
            >
              <span className="truncate text-xs">
                {step.number}. {step.shortTitle}
                <span className="sr-only">{complete ? ' (completa)' : ` (${Math.round(completion * 100)}%)`}</span>
              </span>
            </ButtonLink>
          );
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel icon={Building2} title="Sobre o negócio" step="empresa" className="lg:col-span-2">
          {companyStarted ? (
            <div className="space-y-4">
              <p className="text-[15px] leading-relaxed text-slate-600">
                <PitchText company={company} />
              </p>
              {company.description.trim() && (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{company.description}</p>
              )}
            </div>
          ) : (
            <StepEmpty step="empresa" title="Conte sobre a sua empresa" description="Nome, segmento, problema que resolve e diferencial." />
          )}
        </Panel>

        <Panel icon={Palette} title="Identidade visual" step="marca">
          {brand.primaryColor || brand.style || brand.slogan ? (
            <div className="space-y-4">
              <div className="flex justify-center rounded-2xl bg-slate-50 p-5">
                <BrandLogo brand={brand} companyName={company.name} size="md" showSlogan />
              </div>
              <div
                className="flex justify-center rounded-2xl p-5"
                style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 140%)` }}
              >
                <BrandLogo brand={brand} companyName={company.name} size="md" inverted nameColor={onPrimary} />
              </div>
              <ColorSwatches brand={brand} />
              {style && (
                <p className="text-sm text-slate-500">
                  Estilo <strong className="text-slate-700">{style.label}</strong>: {style.description.toLowerCase()}
                </p>
              )}
            </div>
          ) : (
            <StepEmpty step="marca" title="Crie a identidade da marca" description="Cores, estilo, símbolo e slogan." />
          )}
        </Panel>

        <Panel icon={Users} title="Público-alvo" step="publico">
          {audienceStarted ? (
            <PersonaCard audience={audience} brand={brand} className="shadow-none" />
          ) : (
            <StepEmpty step="publico" title="Quem é o seu cliente ideal?" description="Idade, interesses, problemas e onde ele está." />
          )}
        </Panel>

        <Panel icon={Package} title={`Produtos e serviços${products.length ? ` (${products.length})` : ''}`} step="produtos" className="lg:col-span-2">
          {products.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} brand={brand} compact />
              ))}
            </div>
          ) : (
            <StepEmpty step="produtos" title="Vitrine vazia" description="Cadastre o que a sua empresa vende." />
          )}
          {products.length > 6 && <p className="mt-3 text-sm text-slate-500">+ {products.length - 6} itens na vitrine.</p>}
        </Panel>

        <Panel icon={Megaphone} title="Estratégia de marketing" step="marketing" className="lg:col-span-2">
          {getStepCompletion(project, 'marketing') > 0 ? (
            <MarketingSummary marketing={marketing} />
          ) : (
            <StepEmpty step="marketing" title="Planeje o seu marketing" description="Canais, conteúdo, investimento e calendário." />
          )}
        </Panel>

        <Panel
          icon={SquarePen}
          title={`Campanhas${campaigns.length ? ` (${campaigns.length})` : ''}`}
          step="publicacoes"
          className="lg:col-span-2"
        >
          {latest ? (
            <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <ul className="space-y-2">
                {campaigns.map((c) => {
                  const ch = getChannel(c.platform)!;
                  return (
                    <li key={c.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3 text-sm">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: ch.color }}>
                        <PlatformIcon channel={c.platform} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-semibold text-slate-800">{c.name}</span>
                          <span className="shrink-0 text-xs text-slate-400">{ch.label}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{c.text}</span>
                        <span className="mt-1 block text-xs font-semibold text-violet-600">Chamada: {c.cta}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="rounded-2xl bg-slate-100 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Layers className="size-3.5" aria-hidden /> Mais recente: {latest.name}
                </p>
                <PostPreview
                  post={latest}
                  product={products.find((p) => p.id === latest.productId)}
                  brand={brand}
                  company={company}
                  sponsored={(marketing.adBudget ?? 0) > 0}
                />
              </div>
            </div>
          ) : (
            <StepEmpty step="publicacoes" title="Nenhuma campanha" description="Crie uma publicação e veja como ela fica." />
          )}
        </Panel>

        <Panel icon={Wallet} title="Planejamento financeiro" step="financeiro" className="lg:col-span-2">
          {finance$ ? (
            <div className="space-y-3">
              <FinanceKpis result={finance$} plan={finance} adBudget={marketing.adBudget} />
              <EducationalDisclaimer />
            </div>
          ) : (
            <StepEmpty step="financeiro" title="Simule os números" description="Receita, custos, resultado e margem." />
          )}
        </Panel>
      </div>

      {hasBrandColors && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-400" aria-hidden>
          <BrandMark brand={brand} companyName={company.name} size="xs" />
          {company.name} · Startup Lab
        </div>
      )}
    </div>
  );
}
