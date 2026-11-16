import { useEffect, useState } from 'react';
import { CloudCheck, CloudOff, LayoutDashboard, Menu, Presentation, Save, X } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { formatTime } from '../../lib/format';
import { getOverallProgress } from '../../lib/progress';
import { STEPS, getStep } from '../../lib/steps';
import { BrandMark } from '../brand/BrandLogo';
import { Button, ButtonLink } from '../ui/Button';
import { ProgressBar } from '../ui/Feedback';
import { AppLogo } from './AppLogo';
import { ProjectMenu } from './ProjectMenu';
import { StepNav } from './StepNav';

function SaveStatus() {
  const { lastSavedAt, storageOk, hasStarted } = useProject();
  if (!storageOk) {
    return (
      <span className="hidden items-center gap-1.5 text-xs font-medium text-rose-600 md:inline-flex" role="status">
        <CloudOff className="size-4" aria-hidden />
        Não foi possível salvar neste navegador
      </span>
    );
  }
  if (!hasStarted || !lastSavedAt) return null;
  return (
    <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 md:inline-flex" role="status">
      <CloudCheck className="size-4 text-emerald-500" aria-hidden />
      Salvo automaticamente às {formatTime(lastSavedAt)}
    </span>
  );
}

export function AppShell() {
  const { project, saveNow } = useProject();
  const toast = useToast();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stepId = location.pathname.startsWith('/etapa/') ? location.pathname.split('/')[2] : undefined;
  const currentStep = getStep(stepId);
  const progress = getOverallProgress(project);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const handleSave = () => {
    if (saveNow()) toast.success('Progresso salvo neste navegador.');
    else toast.error('Não foi possível salvar. Verifique se o navegador permite armazenamento local.');
  };

  return (
    <div className="app-backdrop min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 inline-flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu de etapas"
            aria-expanded={drawerOpen}
          >
            <Menu className="size-5" />
          </button>
          <AppLogo />
          {project.company.name.trim() && (
            <div className="ml-2 hidden min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 sm:flex">
              <BrandMark brand={project.brand} companyName={project.company.name} size="xs" />
              <span className="max-w-[12rem] truncate text-sm font-semibold text-slate-700">{project.company.name}</span>
            </div>
          )}
          <div className="flex-1" />
          <SaveStatus />
          <Button variant="secondary" size="sm" onClick={handleSave} icon={<Save className="size-4" aria-hidden />}>
            <span className="hidden sm:inline">Salvar</span>
          </Button>
          <ButtonLink
            to="/painel"
            variant="soft"
            size="sm"
            className="max-sm:hidden"
            icon={<LayoutDashboard className="size-4" aria-hidden />}
          >
            Painel
          </ButtonLink>
          <ButtonLink
            to="/apresentacao"
            size="sm"
            className="max-md:hidden"
            icon={<Presentation className="size-4" aria-hidden />}
          >
            Apresentar
          </ButtonLink>
          <ProjectMenu />
        </div>
        <div className="border-t border-slate-100 px-4 py-2 sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
            <span className="truncate">
              {currentStep
                ? `Etapa ${currentStep.number} de ${STEPS.length} · ${currentStep.title}`
                : location.pathname === '/painel'
                  ? 'Painel da empresa'
                  : 'Startup Lab'}
            </span>
            <span className="font-bold tabular-nums text-violet-600">{progress}%</span>
          </div>
          <ProgressBar value={progress} size="sm" className="mt-1.5" label="Progresso da empresa" />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6">
        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-72 shrink-0 self-start overflow-y-auto py-8 scrollbar-none lg:block print:hidden">
          <StepNav />
        </aside>
        <main id="conteudo" className="min-w-0 flex-1 pb-16 pt-6 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Etapas">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/40" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm animate-fade-in flex-col overflow-y-auto bg-slate-50 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <AppLogo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/60"
                aria-label="Fechar menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <StepNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
