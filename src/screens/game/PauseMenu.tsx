import { useState } from 'react';
import { CircleHelp, Home, Play, RotateCcw, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatTimeSaved } from './time';
import { useActiveGame } from '../../state/GameContext';
import { useToast } from '../../state/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onExit: () => void;
  onHowTo: () => void;
}

export function PauseMenu({ open, onClose, onExit, onHowTo }: Props) {
  const { game, saveNow, deleteGame, lastSavedAt } = useActiveGame();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <Modal open={open && !confirm} onClose={onClose} size="sm" title="Jogo pausado">
        <div className="space-y-2.5">
          <p className="mb-3 text-sm text-slate-400">
            {game.company.name} · Mês {game.month}
            {lastSavedAt && <> · salvo às {formatTimeSaved(lastSavedAt)}</>}
          </p>
          <Button size="lg" className="w-full" onClick={onClose} icon={<Play className="size-5 fill-current" aria-hidden />} data-autofocus>
            Continuar
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            icon={<Save className="size-5" aria-hidden />}
            onClick={() => (saveNow() ? toast.success('Jogo salvo neste navegador.') : toast.error('Não foi possível salvar.'))}
          >
            Salvar agora
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            icon={<CircleHelp className="size-5" aria-hidden />}
            onClick={() => {
              onClose();
              onHowTo();
            }}
          >
            Como jogar
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            icon={<Home className="size-5" aria-hidden />}
            onClick={() => {
              saveNow();
              onClose();
              onExit();
            }}
          >
            Sair para o menu
          </Button>
          <Button size="lg" variant="ghost" className="w-full text-rose-300 hover:text-rose-200" icon={<RotateCcw className="size-5" aria-hidden />} onClick={() => setConfirm(true)}>
            Reiniciar partida
          </Button>
        </div>
      </Modal>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        size="sm"
        title="Reiniciar a partida?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} data-autofocus>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirm(false);
                onClose();
                deleteGame();
                onExit();
              }}
            >
              Apagar partida
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-300">
          Todo o progresso da <strong className="text-white">{game.company.name}</strong> será apagado. Você volta ao menu para começar um
          novo jogo.
        </p>
      </Modal>
    </>
  );
}
