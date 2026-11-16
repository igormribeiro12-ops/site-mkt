import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Presentation,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { AppLogo } from '../components/layout/AppLogo';
import { ResetProjectDialog } from '../components/layout/ProjectDialogs';
import { Button, ButtonLink } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/Feedback';
import { useProject } from '../context/ProjectContext';
import { firstIncompleteStep, getCompletedStepsCount, getOverallProgress } from '../lib/progress';
import { STEPS, stepPath } from '../lib/steps';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** Ilustração decorativa do produto (sem dados de aluno). */
function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-lg" aria-hidden>
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-violet-500/20 blur-2xl" />

      {/* Cartão principal: painel da empresa */}
      <div className="absolute left-[6%] top-[8%] w-[70%] animate-float rounded-3xl border border-white/70 bg-white/90 p-5 shadow-2xl shadow-indigo-900/10 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-[28%] bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Sua marca aqui</p>
            <p className="text-[11px] text-slate-500">Seu slogan inesquecível</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['bg-blue-100', 'bg-violet-100', 'bg-pink-100'].map((c) => (
            <div key={c} className={`h-14 rounded-xl ${c}`} />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 w-4/5 rounded-full bg-slate-200" />
          <div className="h-2 w-3/5 rounded-full bg-slate-200" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">Progresso</span>
          <span className="text-[11px] font-bold text-violet-600">Etapa 1 de 7</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
        </div>
      </div>

      {/* Publicação */}
      <div className="absolute bottom-[4%] right-[2%] w-[44%] rounded-2xl border border-white/70 bg-white p-2.5 shadow-xl shadow-indigo-900/10 [animation-delay:1.2s] animate-float">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="size-5 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600" />
          <span className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>
        <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-400 text-white">
          <span className="text-center text-xs font-extrabold leading-tight">
            Sua
            <br />
            campanha
          </span>
        </div>
        <div className="mt-2 flex gap-2 text-slate-700">
          <Heart className="size-3.5" />
          <MessageCircle className="size-3.5" />
          <Send className="size-3.5" />
        </div>
      </div>

      {/* Cliente ideal */}
      <div className="absolute bottom-[14%] left-0 flex w-[46%] items-center gap-2.5 rounded-2xl border border-white/70 bg-white p-3 shadow-xl shadow-indigo-900/10">
        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-800">Cliente ideal</p>
          <p className="truncate text-[10px] text-slate-500">Quem compra de você?</p>
        </div>
      </div>

      {/* Resultado */}
      <div className="absolute right-[6%] top-[2%] flex items-center gap-2 rounded-2xl border border-white/70 bg-white px-3 py-2 shadow-lg shadow-indigo-900/10">
        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <TrendingUp className="size-4" />
        </span>
        <span className="text-[11px] font-bold text-slate-700">Simule seus resultados</span>
      </div>
    </div>
  );
}

export function HomePage() {
  useDocumentTitle('');
  const { project, hasStarted, startProject } = useProject();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const progress = getOverallProgress(project);
  const done = getCompletedStepsCount(project);
  const next = firstIncompleteStep(project);

  const create = () => {
    startProject();
    navigate(stepPath('empresa'));
  };
  const resume = () => navigate(next ? stepPath(next) : '/painel');

  return (
    <div className="app-backdrop min-h-screen">
      <header className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <AppLogo />
        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Principal">
          <a href="#como-funciona" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 sm:inline-block">
            Como funciona
          </a>
          <a
            href="./aula.html"
            target="_blank"
            rel="noopener"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 md:inline-flex"
          >
            <BookOpen className="size-4" aria-hidden />
            Material da aula
          </a>
          {hasStarted ? (
            <Button size="sm" onClick={resume} iconRight={<ArrowRight className="size-4" aria-hidden />}>
              Continuar
            </Button>
          ) : (
            <Button size="sm" onClick={create}>
              Começar
            </Button>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-14">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-violet-700 shadow-sm">
              <GraduationCap className="size-4" aria-hidden />
              Laboratório de empreendedorismo e marketing digital
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Sua ideia pode se tornar <span className="text-gradient">uma empresa.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Crie sua marca, desenvolva seu negócio e descubra como conquistar seus primeiros clientes.
            </p>

            {hasStarted ? (
              <div className="mt-8 max-w-xl rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-indigo-900/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <BrandLogo brand={project.brand} companyName={project.company.name || 'Minha empresa'} size="sm" />
                  <span className="text-sm font-bold text-violet-600">{progress}% concluído</span>
                </div>
                <ProgressBar value={progress} className="mt-4" label="Progresso da empresa" />
                <p className="mt-2 text-xs text-slate-500">
                  {done} de {STEPS.length} etapas completas · salvo neste navegador
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button size="lg" onClick={resume} iconRight={<ArrowRight className="size-5" aria-hidden />}>
                    {next ? 'Continuar minha empresa' : 'Ver minha empresa'}
                  </Button>
                  <ButtonLink to="/painel" size="lg" variant="secondary" icon={<LayoutDashboard className="size-5" aria-hidden />}>
                    Painel
                  </ButtonLink>
                </div>
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-rose-600"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Começar uma nova empresa do zero
                </button>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" onClick={create} iconRight={<ArrowRight className="size-5" aria-hidden />}>
                  Criar minha empresa
                </Button>
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Lock className="size-4" aria-hidden />
                  Sem cadastro. Seus dados ficam só neste navegador.
                </p>
              </div>
            )}
          </div>
          <div className="animate-fade-up [animation-delay:150ms]">
            <HeroIllustration />
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-8 border-t border-slate-200/70 bg-white/60 py-16 backdrop-blur sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-violet-600">Como funciona</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Da ideia à apresentação, em 7 etapas.
              </h2>
              <p className="mt-3 text-slate-600">
                Cada etapa é uma parte real do trabalho de quem empreende. Você pode voltar, editar e salvar quando quiser.
              </p>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.id}
                    className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-100 text-violet-600 transition group-hover:from-blue-600 group-hover:to-violet-600 group-hover:text-white">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="text-3xl font-extrabold text-slate-100">{String(step.number).padStart(2, '0')}</span>
                    </div>
                    <h3 className="mt-4 font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.description}</p>
                  </li>
                );
              })}
              <li className="rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 p-5 text-white shadow-xl shadow-violet-600/20">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                  <Presentation className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold">Painel e apresentação</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/85">
                  Veja tudo reunido e apresente a sua empresa para a turma — dá até para salvar em PDF.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: 'Aprenda fazendo',
                text: 'Nada de só teoria: você cria marca, público, produtos, campanhas e números de verdade.',
              },
              {
                icon: Lock,
                title: 'Seu projeto, seu dispositivo',
                text: 'Não precisa de cadastro nem internet depois de aberto. O progresso fica salvo neste navegador.',
              },
              {
                icon: Presentation,
                title: 'Pronto para apresentar',
                text: 'No final, gere uma apresentação completa da empresa para mostrar em sala ou salvar em PDF.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-slate-200/80 bg-white/80 p-6">
                <Icon className="size-6 text-violet-600" aria-hidden />
                <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center gap-4 rounded-[2rem] bg-slate-900 px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Pronto para tirar a ideia do papel?</h2>
            <Button size="lg" variant="secondary" className="border-0" onClick={hasStarted ? resume : create} iconRight={<ArrowRight className="size-5" aria-hidden />}>
              {hasStarted ? 'Continuar minha empresa' : 'Criar minha empresa'}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 py-8 text-center text-sm text-slate-500">
        <p>
          Startup Lab · Atividade de Marketing Digital ·{' '}
          <a href="./aula.html" target="_blank" rel="noopener" className="font-semibold text-violet-700 hover:underline">
            Material da aula
          </a>
        </p>
        <p className="mt-1 text-xs text-slate-400">Os dados ficam salvos apenas neste navegador e não são compartilhados.</p>
      </footer>

      <ResetProjectDialog open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}
