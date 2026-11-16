import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize2,
  Minimize2,
  MonitorPlay,
  Printer,
  TriangleAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PersonaCard } from '../components/audience/PersonaCard';
import { BrandLogo, brandColors } from '../components/brand/BrandLogo';
import { ColorSwatches } from '../components/brand/BrandPreview';
import { PitchText } from '../components/company/PitchCard';
import { CumulativeChart } from '../components/finance/CumulativeChart';
import { EducationalDisclaimer, FinanceInsights, FinanceKpis } from '../components/finance/FinanceSummary';
import { MarketingSummary } from '../components/marketing/MarketingSummary';
import { PostPreview } from '../components/posts/PostPreview';
import { ProductCard } from '../components/products/ProductCard';
import { Button, ButtonLink } from '../components/ui/Button';
import { useProject } from '../context/ProjectContext';
import { cn } from '../lib/cn';
import { getBrandStyle, getChannel, segmentLabel } from '../lib/constants';
import { computeFinance, cumulativeProjection } from '../lib/finance';
import { getStepCompletion, isStepComplete } from '../lib/progress';
import { STEPS, stepPath } from '../lib/steps';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { Audience, StepId } from '../types';

interface SectionProps {
  number?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function Section({ number, title, children, className, style }: SectionProps) {
  return (
    <div className={cn('flex flex-1 flex-col p-6 sm:p-10 print:p-0', className)} style={style}>
      {title && (
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          {number && (
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-extrabold text-white print:size-8">
              {number}
            </span>
          )}
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl print:text-2xl">{title}</h2>
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NotFilled({ step }: { step: StepId }) {
  const meta = STEPS.find((s) => s.id === step)!;
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
      <p className="font-semibold">Esta parte ainda não foi preenchida.</p>
      <Link to={stepPath(step)} className="mt-2 inline-block text-sm font-semibold text-violet-700 underline underline-offset-2 print:hidden">
        Completar a etapa {meta.number}: {meta.title}
      </Link>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 print-avoid-break">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-600">{label}</p>
      <div className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

function joinPt(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

function describeAudience(a: Audience): string {
  const parts: string[] = [];
  if (a.ageMin !== null && a.ageMax !== null) {
    parts.push(a.ageMin >= 60 && a.ageMax >= 80 ? `tem ${a.ageMin} anos ou mais` : `tem entre ${a.ageMin} e ${a.ageMax} anos`);
  }
  if (a.location.trim()) parts.push(`vive em ${a.location.trim()}`);
  if (a.interests.length) parts.push(`se interessa por ${joinPt(a.interests.map((i) => i.toLowerCase()))}`);
  return parts.length ? `Nosso cliente ideal ${joinPt(parts)}.` : '';
}

export function PresentationPage() {
  const { project } = useProject();
  const { company, brand, audience, products, marketing, campaigns, finance } = project;
  useDocumentTitle(company.name.trim() ? `Apresentação — ${company.name}` : 'Apresentação');
  const [mode, setMode] = useState<'documento' | 'slides'>('documento');
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const { primary, secondary, onPrimary } = brandColors(brand);
  const style = getBrandStyle(brand.style);
  const segment = segmentLabel(company.segment, company.segmentOther);
  const name = company.name.trim() || 'Sua empresa';
  const finance$ = computeFinance(finance, marketing.adBudget);
  const incomplete = STEPS.filter((s) => !isStepComplete(project, s.id));
  const audienceSummary = describeAudience(audience);

  const cover = (
    <Section
      className="items-center justify-center text-center"
      style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 140%)`, color: onPrimary }}
    >
      <div className="flex min-h-[60vh] flex-col items-center justify-center print:min-h-[230mm]">
        <BrandLogo brand={brand} companyName={name} size="xl" layout="stacked" inverted nameColor={onPrimary} />
        {brand.slogan.trim() && <p className="mt-6 max-w-2xl text-xl font-medium opacity-90 sm:text-2xl">“{brand.slogan}”</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm font-semibold">
          {segment && <span className="rounded-full bg-white/20 px-4 py-1.5">{segment}</span>}
          {company.founder.trim() && <span className="rounded-full bg-white/20 px-4 py-1.5">Fundada por {company.founder}</span>}
        </div>
      </div>
    </Section>
  );

  const sections: { id: string; label: string; content: ReactNode }[] = [
    { id: 'capa', label: 'Capa', content: cover },
    {
      id: 'identidade',
      label: 'Identidade visual',
      content: (
        <Section number="02" title="Identidade visual">
          {brand.primaryColor || brand.style ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white p-6">
                  <BrandLogo brand={brand} companyName={name} size="md" showSlogan />
                </div>
                <div
                  className="flex min-h-40 items-center justify-center rounded-3xl p-6"
                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary} 140%)` }}
                >
                  <BrandLogo brand={brand} companyName={name} size="md" inverted nameColor={onPrimary} />
                </div>
              </div>
              <div className="space-y-4">
                <ColorSwatches brand={brand} />
                {style && (
                  <Labeled label="Estilo da marca">
                    <strong>{style.label}</strong> — {style.description}
                  </Labeled>
                )}
                {brand.slogan.trim() && <Labeled label="Slogan">“{brand.slogan}”</Labeled>}
              </div>
            </div>
          ) : (
            <NotFilled step="marca" />
          )}
        </Section>
      ),
    },
    {
      id: 'negocio',
      label: 'O negócio',
      content: (
        <Section number="03" title="Sobre o negócio">
          {getStepCompletion(project, 'empresa') > 0 ? (
            <div className="space-y-5">
              <p className="text-lg leading-relaxed text-slate-600">
                <PitchText company={company} />
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {company.description.trim() && <Labeled label="Descrição">{company.description}</Labeled>}
                {company.problem.trim() && <Labeled label="Problema que resolvemos">{company.problem}</Labeled>}
                {company.offering.trim() && <Labeled label="O que oferecemos">{company.offering}</Labeled>}
                {company.differential.trim() && <Labeled label="Nosso diferencial">{company.differential}</Labeled>}
              </div>
            </div>
          ) : (
            <NotFilled step="empresa" />
          )}
        </Section>
      ),
    },
    {
      id: 'produtos',
      label: 'Produtos e serviços',
      content: (
        <Section number="04" title="Produtos e serviços">
          {products.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} brand={brand} />
              ))}
            </div>
          ) : (
            <NotFilled step="produtos" />
          )}
        </Section>
      ),
    },
    {
      id: 'publico',
      label: 'Público-alvo',
      content: (
        <Section number="05" title="Público-alvo">
          {getStepCompletion(project, 'publico') > 0 ? (
            <div className="grid gap-6 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
              <PersonaCard audience={audience} brand={brand} />
              <div className="space-y-4">
                {audienceSummary && <Labeled label="Resumo">{audienceSummary}</Labeled>}
                {audience.onlinePlaces.length > 0 && (
                  <Labeled label="Onde vamos encontrá-lo">{audience.onlinePlaces.join(' · ')}</Labeled>
                )}
              </div>
            </div>
          ) : (
            <NotFilled step="publico" />
          )}
        </Section>
      ),
    },
    {
      id: 'marketing',
      label: 'Estratégia de marketing',
      content: (
        <Section number="06" title="Estratégia de marketing">
          {getStepCompletion(project, 'marketing') > 0 ? <MarketingSummary marketing={marketing} calendarLimit={6} /> : <NotFilled step="marketing" />}
        </Section>
      ),
    },
    {
      id: 'campanha',
      label: 'Campanha de divulgação',
      content: (
        <Section number="07" title={campaigns.length > 1 ? 'Campanhas de divulgação' : 'Campanha de divulgação'}>
          {campaigns.length ? (
            <div className="grid items-start gap-8 md:grid-cols-2 print:grid-cols-2">
              {campaigns.map((c) => (
                <div key={c.id} className="print-avoid-break">
                  <p className="mb-1 text-lg font-bold text-slate-900">{c.name}</p>
                  <p className="mb-3 text-sm text-slate-500">
                    {getChannel(c.platform)?.label} · {products.find((p) => p.id === c.productId)?.name ?? 'Empresa em geral'} ·
                    Chamada: “{c.cta}”
                  </p>
                  <PostPreview
                    post={c}
                    product={products.find((p) => p.id === c.productId)}
                    brand={brand}
                    company={company}
                    sponsored={(marketing.adBudget ?? 0) > 0}
                    className="mx-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            <NotFilled step="publicacoes" />
          )}
        </Section>
      ),
    },
    {
      id: 'financeiro',
      label: 'Planejamento financeiro',
      content: (
        <Section number="08" title="Planejamento financeiro">
          {finance$ ? (
            <div className="space-y-6">
              <FinanceKpis result={finance$} plan={finance} adBudget={marketing.adBudget} />
              <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
                <FinanceInsights result={finance$} plan={finance} />
                <CumulativeChart data={cumulativeProjection(finance, finance$)} />
              </div>
              <EducationalDisclaimer />
            </div>
          ) : (
            <NotFilled step="financeiro" />
          )}
        </Section>
      ),
    },
    {
      id: 'obrigado',
      label: 'Encerramento',
      content: (
        <Section className="items-center justify-center text-center">
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 print:min-h-[200mm]">
            <BrandLogo brand={brand} companyName={name} size="lg" layout="stacked" />
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">Obrigado!</p>
            {company.founder.trim() && <p className="text-lg text-slate-500">{company.founder} · Fundador(a)</p>}
            {brand.slogan.trim() && <p className="max-w-xl text-lg italic text-slate-500">“{brand.slogan}”</p>}
          </div>
        </Section>
      ),
    },
  ];

  const total = sections.length;
  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(total - 1, i))), [total]);

  useEffect(() => {
    if (mode !== 'slides') return;
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        setIndex((i) => Math.min(total - 1, i + 1));
      } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Home') setIndex(0);
      else if (e.key === 'End') setIndex(total - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, total]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className={cn('min-h-screen print:bg-white', mode === 'slides' ? 'bg-slate-900' : 'app-backdrop')}>
      <header
        className={cn(
          'sticky top-0 z-40 border-b backdrop-blur-xl print:hidden',
          mode === 'slides' ? 'border-white/10 bg-slate-900/80 text-white' : 'border-slate-200/70 bg-white/80',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <ButtonLink
            to="/painel"
            variant={mode === 'slides' ? 'ghost' : 'secondary'}
            size="sm"
            className={mode === 'slides' ? 'text-white hover:bg-white/10 hover:text-white' : undefined}
            icon={<ArrowLeft className="size-4" aria-hidden />}
          >
            <span className="hidden sm:inline">Voltar ao painel</span>
          </ButtonLink>
          <p className={cn('hidden min-w-0 flex-1 truncate text-sm font-bold md:block', mode === 'slides' ? 'text-white' : 'text-slate-800')}>
            Apresentação · {name}
          </p>
          <div className="flex-1 md:hidden" />
          <div
            role="radiogroup"
            aria-label="Modo de visualização"
            className={cn('inline-flex rounded-xl p-1', mode === 'slides' ? 'bg-white/10' : 'bg-slate-100')}
          >
            {(
              [
                { id: 'documento', label: 'Documento', icon: FileText },
                { id: 'slides', label: 'Slides', icon: MonitorPlay },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => {
                  setMode(id);
                  window.scrollTo({ top: 0 });
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition',
                  mode === id
                    ? mode === 'slides'
                      ? 'bg-white text-slate-900'
                      : 'bg-white text-violet-700 shadow-sm'
                    : mode === 'slides'
                      ? 'text-white/70 hover:text-white'
                      : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          {mode === 'slides' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={toggleFullscreen}
              icon={fullscreen ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
            >
              <span className="hidden lg:inline">{fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</span>
            </Button>
          )}
          <Button size="sm" onClick={() => window.print()} icon={<Printer className="size-4" aria-hidden />}>
            <span className="hidden sm:inline">Imprimir / salvar PDF</span>
          </Button>
        </div>
      </header>

      {mode === 'documento' && incomplete.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 print:hidden">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <p>
              Algumas etapas ainda estão incompletas:{' '}
              {incomplete.map((s, i) => (
                <span key={s.id}>
                  <Link to={stepPath(s.id)} className="font-semibold underline underline-offset-2">
                    {s.shortTitle}
                  </Link>
                  {i < incomplete.length - 1 ? ', ' : '.'}
                </span>
              ))}{' '}
              Você já pode apresentar, mas fica ainda melhor com tudo preenchido.
            </p>
          </div>
        </div>
      )}

      {mode === 'documento' && (
        <p className="mx-auto max-w-5xl px-4 pt-4 text-center text-xs text-slate-500 sm:px-6 print:hidden">
          Dica: na janela de impressão, escolha <strong>“Salvar como PDF”</strong> e ative <strong>“Gráficos de segundo plano”</strong> para manter as cores.
        </p>
      )}

      <main
        className={cn(
          'mx-auto print:max-w-none print:p-0',
          mode === 'documento'
            ? 'max-w-5xl space-y-6 px-4 py-6 sm:px-6 print:space-y-0'
            : 'flex h-[calc(100dvh-4rem)] max-w-7xl flex-col px-3 py-4 sm:px-6 sm:py-5 print:block print:h-auto',
        )}
      >
        {sections.map((section, i) => (
          <section
            key={section.id}
            aria-label={section.label}
            className={cn(
              'overflow-hidden bg-white print:rounded-none print:border-0 print:shadow-none',
              i > 0 && 'print-page-break',
              mode === 'documento'
                ? 'animate-fade-up rounded-3xl border border-slate-200/80 shadow-sm'
                : cn(
                    'min-h-0 flex-1 flex-col overflow-y-auto rounded-3xl shadow-2xl print:block print:overflow-visible',
                    i === index ? 'flex animate-scale-in' : 'hidden',
                  ),
            )}
          >
            {section.content}
          </section>
        ))}

        {mode === 'slides' && (
          <nav aria-label="Navegação dos slides" className="mt-4 flex items-center justify-between gap-3 text-white print:hidden">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              disabled={index === 0}
              onClick={() => go(index - 1)}
              icon={<ChevronLeft className="size-5" aria-hidden />}
            >
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <div className="flex items-center gap-1.5">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Ir para o slide ${i + 1}: ${s.label}`}
                  aria-current={i === index ? 'step' : undefined}
                  className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/60')}
                />
              ))}
              <span className="ml-2 text-xs tabular-nums text-white/60" aria-live="polite">
                {index + 1}/{total} · {sections[index].label}
              </span>
            </div>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              disabled={index === total - 1}
              onClick={() => go(index + 1)}
              iconRight={<ChevronRight className="size-5" aria-hidden />}
            >
              <span className="hidden sm:inline">Próximo</span>
            </Button>
          </nav>
        )}
      </main>
    </div>
  );
}
