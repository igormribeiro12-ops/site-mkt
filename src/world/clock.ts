// Relógio do jogo: dia e noite, horário comercial e velocidade.

export const OPEN = 8 * 60;
export const CLOSE = 18 * 60;
/** Minutos de jogo por segundo real durante o expediente (velocidade 1x). */
export const DAY_RATE = 20;
/** À noite o tempo passa bem mais rápido. */
export const NIGHT_RATE = 240;

export function isBusinessHours(minute: number): boolean {
  return minute >= OPEN && minute < CLOSE;
}

export function formatClock(minute: number): string {
  const m = Math.floor(((minute % 1440) + 1440) % 1440);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export interface Lighting {
  /** Cor e opacidade da camada de escuridão. */
  color: number;
  alpha: number;
  /** Luzes acesas (postes, luminárias, janelas). */
  lightsOn: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** Iluminação do ambiente conforme o horário (amanhecer, dia, entardecer, noite). */
export function lightingAt(minute: number): Lighting {
  const h = (((minute % 1440) + 1440) % 1440) / 60;
  if (h >= 7 && h < 16.5) return { color: 0x1a1030, alpha: 0, lightsOn: false };
  if (h >= 16.5 && h < 18.5) return { color: 0x6b2f1a, alpha: lerp(0, 0.28, (h - 16.5) / 2), lightsOn: h > 17.6 };
  if (h >= 18.5 && h < 20) return { color: 0x14112e, alpha: lerp(0.28, 0.6, (h - 18.5) / 1.5), lightsOn: true };
  if (h >= 5.5 && h < 7) return { color: 0x3b2440, alpha: lerp(0.55, 0, (h - 5.5) / 1.5), lightsOn: h < 6.4 };
  return { color: 0x0d0b24, alpha: 0.62, lightsOn: true };
}
