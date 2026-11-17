import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CircleCheck, Coins, Info, Trophy, TriangleAlert, X } from 'lucide-react';
import { EV, bus, type ToastPayload } from '../world/bus';

type ToastKind = 'success' | 'error' | 'info' | 'achievement' | 'money';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  achievement: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<ToastKind, { icon: typeof Info; className: string; box: string }> = {
  success: { icon: CircleCheck, className: 'text-emerald-400', box: 'border-emerald-400/20' },
  error: { icon: TriangleAlert, className: 'text-rose-400', box: 'border-rose-400/30' },
  info: { icon: Info, className: 'text-sky-400', box: 'border-sky-400/20' },
  achievement: { icon: Trophy, className: 'text-amber-300', box: 'border-amber-300/40 shadow-amber-500/10' },
  money: { icon: Coins, className: 'text-yellow-300', box: 'border-yellow-300/30' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === 'achievement' ? 5000 : 3600);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      achievement: (m) => push('achievement', m),
    }),
    [push],
  );

  // Avisos vindos da cena 2D e das ações do jogo.
  useEffect(() => bus.on(EV.toast, (p) => {
    const t = p as ToastPayload;
    push(t.kind, t.message);
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-16 z-[80] flex flex-col items-center gap-2 px-3 print:hidden"
      >
        {toasts.map((toast) => {
          const { icon: Icon, className, box } = STYLES[toast.kind];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-md animate-scale-in items-start gap-3 rounded-2xl border bg-ink-800/95 px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-black/40 backdrop-blur ${box}`}
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${className}`} aria-hidden />
              <p className="flex-1 font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-0.5 text-slate-500 hover:bg-white/10 hover:text-slate-200"
                aria-label="Fechar aviso"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  return ctx;
}
