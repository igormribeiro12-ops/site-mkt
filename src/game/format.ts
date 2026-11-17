const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brlCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function money(value: number, cents = false): string {
  if (!Number.isFinite(value)) return '—';
  return (cents ? brlCents : brl).format(value);
}

/** Valor compacto: R$ 12,5 mil · R$ 1,2 mi. */
export function moneyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R$ ${dec.format(abs / 1_000_000)} mi`;
  if (abs >= 10_000) return `${sign}R$ ${dec.format(abs / 1000)} mil`;
  return money(value);
}

export function num(value: number): string {
  return int.format(Math.round(value));
}

export function numShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${dec.format(value / 1_000_000)} mi`;
  if (abs >= 10_000) return `${dec.format(value / 1000)} mil`;
  return int.format(Math.round(value));
}

export function pct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value * 100)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function plural(n: number, one: string, many: string): string {
  return `${num(n)} ${Math.round(n) === 1 ? one : many}`;
}
