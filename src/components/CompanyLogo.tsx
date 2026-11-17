import type { CSSProperties } from 'react';
import type { LogoDesign, LogoFont, LogoShape } from '../game/types';
import { cn } from '../lib/cn';
import { getLogoIcon } from '../lib/logoIcons';

export const SHAPES: { id: LogoShape; label: string; clip?: string; radius?: string }[] = [
  { id: 'circle', label: 'Círculo', radius: '9999px' },
  { id: 'rounded', label: 'Arredondado', radius: '28%' },
  { id: 'square', label: 'Quadrado', radius: '10%' },
  { id: 'hexagon', label: 'Hexágono', clip: 'polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)' },
  { id: 'diamond', label: 'Losango', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
];

export const FONTS: { id: LogoFont; label: string; className: string }[] = [
  { id: 'grotesk', label: 'Tecnológica', className: 'font-display font-bold tracking-tight' },
  { id: 'jakarta', label: 'Moderna', className: 'font-sans font-extrabold tracking-tight' },
  { id: 'fredoka', label: 'Divertida', className: 'font-fun font-semibold' },
  { id: 'serif', label: 'Elegante', className: 'font-serif-brand font-bold italic' },
];

const SIZES = {
  xs: { mark: 'size-7', icon: 'size-3.5', name: 'text-sm', gap: 'gap-2' },
  sm: { mark: 'size-9', icon: 'size-[18px]', name: 'text-base', gap: 'gap-2.5' },
  md: { mark: 'size-12', icon: 'size-6', name: 'text-xl', gap: 'gap-3' },
  lg: { mark: 'size-16', icon: 'size-8', name: 'text-2xl sm:text-3xl', gap: 'gap-4' },
  xl: { mark: 'size-24', icon: 'size-12', name: 'text-3xl sm:text-5xl', gap: 'gap-5' },
} as const;

export type LogoSize = keyof typeof SIZES;

function readable(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? '#ffffff' : '#0b1020';
}

export function LogoMark({ logo, size = 'md', className }: { logo: LogoDesign; size?: LogoSize; className?: string }) {
  const shape = SHAPES.find((s) => s.id === logo.shape) ?? SHAPES[1];
  const Icon = getLogoIcon(logo.icon);
  const s = SIZES[size];
  const style: CSSProperties = {
    background: `linear-gradient(135deg, ${logo.primary} 0%, ${logo.secondary} 100%)`,
    color: readable(logo.primary),
    borderRadius: shape.radius,
    clipPath: shape.clip,
  };
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', s.mark, className)} style={style} aria-hidden>
      <Icon className={s.icon} strokeWidth={2.2} />
    </span>
  );
}

interface CompanyLogoProps {
  logo: LogoDesign;
  name: string;
  slogan?: string;
  size?: LogoSize;
  layout?: LogoDesign['layout'];
  /** Cor do nome (padrão: branco, para o tema escuro). */
  color?: string;
  className?: string;
}

/** Logotipo da empresa nos três modelos: horizontal, empilhado e emblema. */
export function CompanyLogo({ logo, name, slogan, size = 'md', layout, color = '#ffffff', className }: CompanyLogoProps) {
  const s = SIZES[size];
  const font = FONTS.find((f) => f.id === logo.font) ?? FONTS[0];
  const mode = layout ?? logo.layout;
  const title = name.trim() || 'Sua empresa';

  if (mode === 'badge') {
    return (
      <div
        className={cn('inline-flex flex-col items-center rounded-[28px] px-6 py-4 text-center', className)}
        style={{ background: `linear-gradient(160deg, ${logo.primary}22, ${logo.secondary}22)`, boxShadow: `inset 0 0 0 2px ${logo.primary}88` }}
      >
        <LogoMark logo={logo} size={size} />
        <p className={cn('mt-2 leading-tight', s.name, font.className)} style={{ color }}>
          {title}
        </p>
        {slogan && <p className="mt-1 max-w-[16rem] text-xs opacity-75" style={{ color }}>{slogan}</p>}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex min-w-0', mode === 'stacked' ? 'flex-col items-center gap-2 text-center' : cn('items-center', s.gap), className)}>
      <LogoMark logo={logo} size={size} />
      <div className="min-w-0">
        <p className={cn('truncate leading-tight', s.name, font.className)} style={{ color }}>
          {title}
        </p>
        {slogan && <p className="mt-0.5 truncate text-xs opacity-70" style={{ color }}>{slogan}</p>}
      </div>
    </div>
  );
}
