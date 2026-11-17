import { useEffect, useLayoutEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, GraduationCap, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { STARTING_CAPITAL, VICTORY_REVENUE } from '../../game/data';
import { money } from '../../game/format';
import { useActiveGame } from '../../state/GameContext';
import type { TabId } from './GameScreen';

interface Step {
  targets: string[];
  title: string;
  text: string;
  tab?: TabId;
}

function visibleTarget(names: string[]): HTMLElement | null {
  for (const name of names) {
    const el = document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
    if (el && el.getClientRects().length > 0 && el.offsetParent !== null) return el;
    if (el && getComputedStyle(el).position === 'fixed' && el.getClientRects().length > 0) return el;
  }
  return null;
}

/** Tutorial inicial com destaque nas áreas da tela. */
export function Tutorial({ onFinish, setTab }: { onFinish: () => void; setTab: (t: TabId) => void }) {
  const { game } = useActiveGame();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps: Step[] = [
    {
      targets: [],
      title: `Bem-vindo(a), ${game.player.name}!`,
      text: `A ${game.company.name} acabou de abrir as portas. Você investiu parte dos ${money(STARTING_CAPITAL)} na abertura. Agora é hora de conquistar clientes. Vamos conhecer o painel?`,
    },
    {
      targets: ['cash'],
      title: 'Seu saldo',
      text: 'Este é o dinheiro da empresa. Ele muda em tempo real com cada decisão. Se ficar negativo além do limite, a empresa vai à falência!',
    },
    {
      targets: ['tabs', 'tabs-mobile'],
      title: 'As áreas da empresa',
      text: 'Aqui você navega entre Painel, Mercado, Marketing, Vendas, Produto e preço, Equipe e expansão, Finanças e Conquistas.',
    },
    {
      targets: ['new-campaign'],
      tab: 'marketing',
      title: 'Comece pelo marketing',
      text: 'Sem divulgação, ninguém conhece a sua empresa. Crie sua primeira campanha escolhendo canal, objetivo e valor. Veja a estimativa de resultado antes de confirmar.',
    },
    {
      targets: ['advance'],
      title: 'Avance os meses',
      text: 'Cada rodada é um mês. Quando terminar de planejar, avance: o jogo calcula vendas, despesas e clientes e mostra um relatório com o que você aprendeu.',
    },
    {
      targets: ['mission'],
      tab: 'painel',
      title: 'Sua missão',
      text: `Para vencer: ${money(VICTORY_REVENUE)} de receita acumulada, chegar ao nível Líder de mercado e ter 3 meses seguidos de lucro. Boa sorte!`,
    },
    {
      targets: ['pause'],
      title: 'Pausar e salvar',
      text: 'O jogo salva sozinho. Use este botão (ou a tecla Esc) para pausar, salvar, ver como jogar ou voltar ao menu.',
    },
  ];
  const step = steps[index];

  useEffect(() => {
    if (step.tab) setTab(step.tab);
  }, [step.tab, setTab]);

  useLayoutEffect(() => {
    let raf = 0;
    const measure = () => {
      const el = step.targets.length ? visibleTarget(step.targets) : null;
      if (el) {
        el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
        setRect(el.getBoundingClientRect());
      } else setRect(null);
    };
    // Espera a aba trocar antes de medir.
    const timer = window.setTimeout(() => {
      measure();
      raf = requestAnimationFrame(measure);
    }, 80);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
    // As áreas destacadas dependem só do passo atual.
  }, [index]);

  const last = index === steps.length - 1;
  const pad = 8;
  const CARD_H = 250;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  // Área destacada limitada à parte visível da tela.
  const spot = rect
    ? { left: rect.left, top: Math.max(rect.top, 0), right: rect.right, bottom: Math.min(rect.bottom, vh) }
    : null;
  let cardStyle: CSSProperties = { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'min(420px, calc(100vw - 24px))' };
  if (spot) {
    const left = Math.max(12, Math.min(spot.left, vw - 372));
    const spaceBelow = vh - spot.bottom;
    const spaceAbove = spot.top;
    if (spaceBelow >= CARD_H + 20) cardStyle = { position: 'fixed', left, top: spot.bottom + pad + 10, width: 'min(360px, calc(100vw - 24px))' };
    else if (spaceAbove >= CARD_H + 20) cardStyle = { position: 'fixed', left, bottom: vh - spot.top + pad + 10, width: 'min(360px, calc(100vw - 24px))' };
    else cardStyle = { position: 'fixed', right: 16, bottom: 110, width: 'min(360px, calc(100vw - 32px))' };
  }

  return createPortal(
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-2xl ring-2 ring-violet-400 transition-all duration-300"
          style={{
            left: spot!.left - pad,
            top: spot!.top - pad,
            width: spot!.right - spot!.left + pad * 2,
            height: spot!.bottom - spot!.top + pad * 2,
            boxShadow: '0 0 0 9999px rgba(5, 7, 15, 0.78)',
          }}
          aria-hidden
        />
      ) : (
        <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm" aria-hidden />
      )}
      <div style={cardStyle} className="animate-scale-in rounded-3xl border border-violet-400/30 bg-ink-900 p-5 shadow-2xl shadow-violet-900/40">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <GraduationCap className="size-4" aria-hidden /> Tutorial · {index + 1}/{steps.length}
          </p>
          <button type="button" onClick={onFinish} className="rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-white" aria-label="Pular tutorial">
            <X className="size-4" />
          </button>
        </div>
        <h2 id="tutorial-title" className="mt-2 font-display text-xl font-bold text-white">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} icon={<ArrowLeft className="size-4" aria-hidden />}>
            Voltar
          </Button>
          <div className="flex gap-1" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-violet-400' : 'w-1.5 bg-white/20'}`} />
            ))}
          </div>
          <Button size="sm" onClick={() => (last ? onFinish() : setIndex((i) => i + 1))} iconRight={!last ? <ArrowRight className="size-4" aria-hidden /> : undefined} data-autofocus>
            {last ? 'Começar a jogar!' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
