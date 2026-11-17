// Canal de eventos entre a cena 2D e a interface React.

type Handler = (payload?: unknown) => void;

class Bus {
  private handlers = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, payload?: unknown) {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

export const bus = new Bus();

/** Eventos usados no jogo. */
export const EV = {
  toast: 'toast',
  /** A interface pede para a cena executar uma animação de ação de marketing. */
  quickAction: 'quick-action',
  /** A cena avisa que o dia foi fechado. */
  dayClosed: 'day-closed',
  /** Pede para a cena trocar de ambiente. */
  goScene: 'go-scene',
  /** Escolha feita em um diálogo. */
  dialogChoice: 'dialog-choice',
  dialogClosed: 'dialog-closed',
  /** Efeito de comemoração no personagem. */
  celebrate: 'celebrate',
} as const;

export interface ToastPayload {
  kind: 'success' | 'error' | 'info' | 'achievement' | 'money';
  message: string;
}

export function toast(kind: ToastPayload['kind'], message: string) {
  bus.emit(EV.toast, { kind, message } satisfies ToastPayload);
}
