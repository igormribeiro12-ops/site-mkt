import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { downloadProjectFile, readProjectFile } from '../../lib/storage';
import type { Project } from '../../types';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Modal';

interface ResetDialogProps {
  open: boolean;
  onClose: () => void;
  /** Para onde ir depois de apagar (padrão: página inicial). */
  redirectTo?: string;
}

export function ResetProjectDialog({ open, onClose, redirectTo = '/' }: ResetDialogProps) {
  const { project, resetProject } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const name = project.company.name.trim();

  return (
    <ConfirmDialog
      open={open}
      title="Reiniciar o projeto?"
      confirmLabel="Sim, apagar tudo"
      onCancel={onClose}
      onConfirm={() => {
        resetProject();
        onClose();
        toast.info('Projeto reiniciado. Você pode começar uma nova empresa.');
        navigate(redirectTo);
      }}
      message={
        <p>
          Todos os dados {name ? <strong className="text-slate-900">da empresa {name}</strong> : 'da sua empresa'} serão
          apagados deste navegador: marca, público-alvo, produtos, marketing, campanhas e planejamento financeiro.{' '}
          <strong className="text-slate-900">Essa ação não pode ser desfeita.</strong>
        </p>
      }
      extra={
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="size-4" aria-hidden />}
          onClick={() => downloadProjectFile(project)}
        >
          Baixar uma cópia antes
        </Button>
      }
    />
  );
}

/** Botão invisível + fluxo de importação de uma cópia de segurança (.json). */
export function useImportProject() {
  const { hasStarted, replaceProject } = useProject();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Project | null>(null);

  const apply = (next: Project) => {
    replaceProject(next);
    toast.success(`Projeto "${next.company.name || 'sem nome'}" restaurado com sucesso!`);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="application/json,.json"
      className="hidden"
      aria-hidden
      tabIndex={-1}
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
          const next = await readProjectFile(file);
          if (hasStarted) setPending(next);
          else apply(next);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.');
        }
      }}
    />
  );

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title="Substituir o projeto atual?"
      confirmLabel="Substituir"
      onCancel={() => setPending(null)}
      onConfirm={() => {
        if (pending) apply(pending);
        setPending(null);
      }}
      message={
        <p>
          O projeto deste navegador será substituído pela cópia{' '}
          <strong className="text-slate-900">{pending?.company.name || 'sem nome'}</strong>. Se quiser guardar o atual,
          baixe uma cópia antes.
        </p>
      }
    />
  );

  return { open: () => inputRef.current?.click(), element: (
    <>
      {input}
      {dialog}
    </>
  ) };
}
