// Ações do jogador compartilhadas pela cena 2D e pela interface React:
// aplicar ações do motor, avisar missões concluídas, abrir diálogos de eventos.

import { QUICK_ACTIONS, markTutorialDone, resolveEvent, runQuickAction, type ActionResult } from '../game/engine';
import { choiceCost, getEvent, isChoiceAvailable } from '../game/events';
import { money } from '../game/format';
import { MISSIONS } from '../game/missions';
import type { GameState, Gender } from '../game/types';
import { type DialogState, gameStore, patchUi, uiStore } from '../state/store';
import { EV, bus, toast } from './bus';

/** Avisa (com festa) as missões concluídas entre dois estados. */
export function notifyMissions(before: GameState, after: GameState) {
  const done = after.world.missionsDone.filter((id) => !before.world.missionsDone.includes(id));
  if (!done.length) return;
  for (const id of done) {
    const m = MISSIONS.find((x) => x.id === id);
    if (!m) continue;
    toast('achievement', `Missão concluída: ${m.title} · +${money(m.reward)}${m.unlockText ? ` · ${m.unlockText}` : ''}`);
  }
  patchUi({ missionFlash: done[done.length - 1] });
  bus.emit(EV.celebrate);
}

/** Aplica uma ação do motor do jogo e mostra o resultado. */
export function applyGameAction(fn: (s: GameState) => ActionResult, opts: { quiet?: boolean } = {}): boolean {
  const s = gameStore.get();
  if (!s) return false;
  const r = fn(s);
  if (!r.ok) {
    toast('error', r.error);
    return false;
  }
  gameStore.set(r.state);
  if (!opts.quiet) toast('success', r.message);
  notifyMissions(s, r.state);
  return true;
}

/** Executa uma ação rápida de marketing e pede a animação para a cena. */
export function doQuickAction(id: string): boolean {
  const action = QUICK_ACTIONS.find((a) => a.id === id);
  if (!action) return false;
  const ok = applyGameAction((s) => runQuickAction(s, id));
  if (ok) {
    patchUi({ panel: null });
    bus.emit(EV.quickAction, id);
  }
  return ok;
}

// --- Diálogos de eventos ---------------------------------------------------------

type Speaker = { name: string; role: string; gender: Gender };

const SPEAKERS: Record<string, Speaker> = {
  concorrente: { name: 'Dona Célia', role: 'Vizinha do bairro', gender: 'feminino' },
  viral: { name: 'Júlia', role: 'Cliente fiel', gender: 'feminino' },
  crise_custos: { name: 'Sr. Augusto', role: 'Fornecedor', gender: 'masculino' },
  fornecedor: { name: 'Sr. Augusto', role: 'Fornecedor', gender: 'masculino' },
  reclamacao: { name: 'Marcos', role: 'Cliente insatisfeito', gender: 'masculino' },
  influenciador: { name: 'Lia Neon', role: 'Influenciadora digital', gender: 'feminino' },
  investidor: { name: 'Helena Prado', role: 'Investidora-anjo', gender: 'feminino' },
  data_comemorativa: { name: 'Rafa', role: 'Consultor de vendas', gender: 'masculino' },
  aumento: { name: 'Sueli', role: 'Representante da equipe', gender: 'feminino' },
  falha_sistema: { name: 'Téo', role: 'Técnico de informática', gender: 'masculino' },
  tendencia: { name: 'Bia', role: 'Analista de mercado', gender: 'feminino' },
  algoritmo: { name: 'Nina', role: 'Especialista em redes sociais', gender: 'feminino' },
  imprensa: { name: 'Caio Lopes', role: 'Repórter', gender: 'masculino' },
  fiscalizacao: { name: 'Fiscal Moura', role: 'Fiscalização municipal', gender: 'masculino' },
  pedido_grande: { name: 'Patrícia', role: 'Compradora corporativa', gender: 'feminino' },
  inflacao: { name: 'Sr. Augusto', role: 'Fornecedor', gender: 'masculino' },
  perfil_clonado: { name: 'Nina', role: 'Especialista em redes sociais', gender: 'feminino' },
  concorrente_fecha: { name: 'Dona Célia', role: 'Vizinha do bairro', gender: 'feminino' },
  chuva: { name: 'Seu Jorge', role: 'Zelador do prédio', gender: 'masculino' },
  parceria: { name: 'Lucas', role: 'Dono do negócio vizinho', gender: 'masculino' },
};

export function speakerFor(eventId: string): Speaker {
  return SPEAKERS[eventId] ?? { name: 'Visitante', role: 'Visitante', gender: 'masculino' };
}

/** Abre o diálogo do evento pendente (chamado quando o visitante chega). */
export function openEventDialog(portrait?: string) {
  const s = gameStore.get();
  if (!s?.pendingEvent) return;
  const ev = getEvent(s.pendingEvent.eventId);
  if (!ev) return;
  const who = speakerFor(ev.id);
  const dialog: DialogState = {
    kind: 'event',
    speaker: who.name,
    role: `${who.role} · ${ev.title}`,
    portrait,
    text: ev.description(s),
    choices: ev.choices.map((c) => {
      const cost = choiceCost(s, c);
      const available = isChoiceAvailable(s, c);
      return {
        id: c.id,
        label: c.label,
        hint: c.hint,
        cost: cost || undefined,
        disabled: !available,
        disabledReason: available ? undefined : (c.unavailableReason ?? 'Saldo insuficiente'),
      };
    }),
  };
  patchUi({ dialog });
}

/** Escolha em um diálogo. */
export function chooseDialog(choiceId: string) {
  const ui = uiStore.get();
  const dialog = ui.dialog;
  if (!dialog) return;
  if (dialog.kind === 'event') {
    const s = gameStore.get();
    const tone = s?.pendingEvent ? getEvent(s.pendingEvent.eventId)?.tone : undefined;
    const before = s;
    const ok = applyGameAction((st) => resolveEvent(st, choiceId), { quiet: true });
    if (!ok) return;
    const after = gameStore.get();
    const text = after?.lastEventOutcome?.text ?? '';
    const cashDelta = before && after ? after.cash - before.cash : 0;
    patchUi({
      dialog: {
        kind: 'outcome',
        speaker: dialog.speaker,
        role: dialog.role,
        portrait: dialog.portrait,
        text: `${text}${cashDelta ? ` (${cashDelta > 0 ? '+' : '-'}${money(Math.abs(cashDelta))})` : ''}`,
        choices: [{ id: tone === 'bad' ? 'close-bad' : 'close-good', label: 'Continuar' }],
      },
    });
    return;
  }
  if (dialog.kind === 'intro' && choiceId.startsWith('intro:')) {
    showIntroPage(Number(choiceId.slice(6)));
    return;
  }
  if (dialog.kind === 'intro') gameStore.set((s) => (s ? markTutorialDone(s) : s));
  closeDialog(choiceId === 'close-bad' ? 'bad' : 'good');
}

// --- Boas-vindas (tutorial em forma de conversa) ----------------------------------

const MENTOR = { name: 'Dona Rita', role: 'Mentora de negócios do bairro' };

function introPages(): string[] {
  const s = gameStore.get();
  const who = s?.player.name ?? 'empreendedor(a)';
  const company = s?.company.name ?? 'sua empresa';
  return [
    `Olá, ${who}! Que alegria ver a ${company} abrindo as portas. Eu ajudo os novos negócios do bairro e vou te dar umas dicas.`,
    'Para andar, use as setas ou W, A, S, D (ou clique no chão). Chegue perto de um objeto e aperte E (ou clique nele) para interagir.',
    'Sua mesa tem o computador da empresa: lá estão o painel, as finanças, as campanhas e os relatórios. Trabalhar na mesa também melhora o produto!',
    'A loja abre às 8h e fecha às 18h. Os clientes só aparecem se souberem que você existe: publique nas redes, faça campanhas e cuide do atendimento no balcão.',
    'Na barra de baixo você pode Construir, Contratar, Comprar, fazer Marketing, abrir a Empresa e ver as Missões. Comece pela missão “Compre os primeiros móveis”. Boa sorte!',
  ];
}

export function showIntroPage(index: number, portrait = uiStore.get().dialog?.portrait) {
  const pages = introPages();
  const last = index >= pages.length - 1;
  patchUi({
    dialog: {
      kind: 'intro',
      speaker: MENTOR.name,
      role: MENTOR.role,
      portrait,
      text: pages[Math.min(index, pages.length - 1)],
      choices: last ? [{ id: 'intro-done', label: 'Vamos lá!' }] : [{ id: `intro:${index + 1}`, label: 'Continuar' }, { id: 'intro-skip', label: 'Pular dicas' }],
    },
  });
}

export function closeDialog(mood: 'good' | 'bad' = 'good') {
  patchUi({ dialog: null });
  bus.emit(EV.dialogClosed, { mood });
}

/** Mostra uma fala simples (sem escolhas). */
export function say(speaker: string, text: string, role?: string, portrait?: string) {
  patchUi({ dialog: { kind: 'talk', speaker, role, portrait, text, choices: [{ id: 'ok', label: 'Ok' }] } });
}
