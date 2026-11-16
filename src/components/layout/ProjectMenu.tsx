import { useEffect, useRef, useState } from 'react';
import { BookOpen, Download, Ellipsis, RotateCcw, Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { downloadProjectFile } from '../../lib/storage';
import { cn } from '../../lib/cn';
import { ResetProjectDialog, useImportProject } from './ProjectDialogs';

const ITEM =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none';

export function ProjectMenu() {
  const { project, hasStarted } = useProject();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const importer = useImportProject();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções do projeto"
        title="Mais opções"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/25',
          open && 'bg-slate-100',
        )}
      >
        <Ellipsis className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-72 animate-scale-in rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          <button
            role="menuitem"
            type="button"
            className={ITEM}
            disabled={!hasStarted}
            onClick={() => {
              setOpen(false);
              downloadProjectFile(project);
              toast.success('Cópia de segurança baixada.');
            }}
          >
            <Download className="size-4 text-slate-400" aria-hidden />
            <span>
              Baixar cópia de segurança
              <span className="block text-xs font-normal text-slate-500">Arquivo .json para guardar ou levar</span>
            </span>
          </button>
          <button
            role="menuitem"
            type="button"
            className={ITEM}
            onClick={() => {
              setOpen(false);
              importer.open();
            }}
          >
            <Upload className="size-4 text-slate-400" aria-hidden />
            <span>
              Restaurar cópia de segurança
              <span className="block text-xs font-normal text-slate-500">Abrir um arquivo .json salvo antes</span>
            </span>
          </button>
          <a role="menuitem" href="./aula.html" target="_blank" rel="noopener" className={ITEM} onClick={() => setOpen(false)}>
            <BookOpen className="size-4 text-slate-400" aria-hidden />
            Material da aula
          </a>
          <div className="my-1.5 h-px bg-slate-100" />
          <button
            role="menuitem"
            type="button"
            disabled={!hasStarted}
            className={cn(ITEM, 'text-rose-600 hover:bg-rose-50 focus-visible:bg-rose-50 disabled:opacity-50')}
            onClick={() => {
              setOpen(false);
              setResetOpen(true);
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reiniciar projeto
          </button>
        </div>
      )}
      {importer.element}
      <ResetProjectDialog open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}
