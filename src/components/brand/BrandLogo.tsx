import type { CSSProperties } from 'react';
import type { BrandIdentity } from '../../types';
import { getBrandStyle } from '../../lib/constants';
import type { LogoShape } from '../../lib/constants';
import { FALLBACK_PRIMARY, FALLBACK_SECONDARY, isHexColor, readableText } from '../../lib/colors';
import { getLogoIcon } from '../../lib/logoIcons';
import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';

export function brandColors(brand: BrandIdentity) {
  const primary = isHexColor(brand.primaryColor) ? brand.primaryColor : FALLBACK_PRIMARY;
  const secondary = isHexColor(brand.secondaryColor) ? brand.secondaryColor : FALLBACK_SECONDARY;
  return { primary, secondary, onPrimary: readableText(primary), onSecondary: readableText(secondary) };
}

export const SHAPE_RADIUS: Record<LogoShape, string> = {
  circle: '9999px',
  rounded: '28%',
  square: '14%',
  blob: '42% 58% 55% 45% / 50% 42% 58% 50%',
  leaf: '50% 8% 50% 8%',
};

const SIZES = {
  xs: { mark: 'size-8', icon: 'size-4', initials: 'text-xs', name: 'text-sm', gap: 'gap-2' },
  sm: { mark: 'size-10', icon: 'size-5', initials: 'text-sm', name: 'text-base', gap: 'gap-2.5' },
  md: { mark: 'size-14', icon: 'size-7', initials: 'text-lg', name: 'text-2xl', gap: 'gap-3' },
  lg: { mark: 'size-20', icon: 'size-10', initials: 'text-2xl', name: 'text-3xl sm:text-4xl', gap: 'gap-4' },
  xl: { mark: 'size-28', icon: 'size-14', initials: 'text-4xl', name: 'text-4xl sm:text-5xl', gap: 'gap-5' },
} as const;

export type LogoSize = keyof typeof SIZES;

interface BrandMarkProps {
  brand: BrandIdentity;
  companyName: string;
  size?: LogoSize;
  className?: string;
  /** Versão do símbolo para fundos coloridos (fundo branco). */
  inverted?: boolean;
}

export function BrandMark({ brand, companyName, size = 'md', className, inverted }: BrandMarkProps) {
  const style = getBrandStyle(brand.style);
  const { primary, secondary, onPrimary } = brandColors(brand);
  const Icon = getLogoIcon(brand.icon);
  const s = SIZES[size];
  const background = inverted
    ? '#ffffff'
    : style?.gradient
      ? `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
      : primary;
  const color = inverted ? primary : style?.gradient ? readableText(primary) : onPrimary;
  const css: CSSProperties = { background, color, borderRadius: SHAPE_RADIUS[style?.shape ?? 'rounded'] };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center shadow-sm',
        s.mark,
        className,
      )}
      style={css}
      aria-hidden
    >
      {Icon ? (
        <Icon className={s.icon} strokeWidth={2.2} />
      ) : (
        <span className={cn('font-bold leading-none', s.initials, style?.fontClass)}>
          {initials(companyName) || '?'}
        </span>
      )}
    </span>
  );
}

interface BrandLogoProps extends BrandMarkProps {
  layout?: 'horizontal' | 'stacked';
  showSlogan?: boolean;
  /** Cor do nome (padrão: tom escuro). */
  nameColor?: string;
  sloganColor?: string;
}

export function BrandLogo({
  brand,
  companyName,
  size = 'md',
  layout = 'horizontal',
  showSlogan = false,
  className,
  inverted,
  nameColor,
  sloganColor,
}: BrandLogoProps) {
  const style = getBrandStyle(brand.style);
  const s = SIZES[size];
  const name = companyName.trim() || 'Sua empresa';
  return (
    <div
      className={cn(
        'inline-flex min-w-0',
        layout === 'horizontal' ? cn('items-center', s.gap) : 'flex-col items-center gap-3 text-center',
        className,
      )}
    >
      <BrandMark brand={brand} companyName={name} size={size} inverted={inverted} />
      <div className="min-w-0">
        <p
          className={cn('leading-tight break-words', s.name, style?.fontClass ?? 'font-sans', style?.nameClass ?? 'font-bold')}
          style={{ color: nameColor ?? '#0f172a' }}
        >
          {name}
        </p>
        {showSlogan && brand.slogan.trim() && (
          <p className="mt-1 text-sm leading-snug opacity-80" style={{ color: sloganColor ?? nameColor ?? '#475569' }}>
            {brand.slogan}
          </p>
        )}
      </div>
    </div>
  );
}
