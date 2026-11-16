import type { CSSProperties } from 'react';
import { Package, Quote, Rocket, Sparkles, Tag } from 'lucide-react';
import type { ArtStyleId, BrandIdentity } from '../../types';
import { getBrandStyle } from '../../lib/constants';
import { readableText, withAlpha } from '../../lib/colors';
import { getLogoIcon } from '../../lib/logoIcons';
import { cn } from '../../lib/cn';
import { BrandMark, brandColors } from '../brand/BrandLogo';

export type ArtRatio = 'square' | 'portrait' | 'landscape';

interface PostArtProps {
  brand: BrandIdentity;
  companyName: string;
  artStyle: ArtStyleId;
  title: string;
  /** Linha de apoio (ex.: preço formatado). */
  subtitle?: string;
  ratio?: ArtRatio;
  className?: string;
}

const RATIO: Record<ArtRatio, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[9/16]',
  landscape: 'aspect-[1.91/1]',
};

/** Arte da publicação, gerada com as cores, o estilo e o símbolo da marca. */
export function PostArt({ brand, companyName, artStyle, title, subtitle, ratio = 'square', className }: PostArtProps) {
  const { primary, secondary, onPrimary, onSecondary } = brandColors(brand);
  const style = getBrandStyle(brand.style);
  const BrandIcon = getLogoIcon(brand.icon);
  const fontClass = cn(style?.fontClass ?? 'font-sans', style?.nameClass?.includes('uppercase') && 'uppercase');
  const name = companyName.trim() || 'Sua empresa';
  const text = title.trim() || name;
  const fs = (cqw: number): CSSProperties => ({ fontSize: `${ratio === 'landscape' ? cqw * 0.62 : cqw}cqw` });

  const header = (color: string) => (
    <div className="flex items-center gap-[2cqw]" style={{ color }}>
      <BrandMark brand={brand} companyName={name} size="xs" className="size-[8cqw]!" />
      <span className={cn('truncate font-bold', fontClass)} style={fs(4.2)}>
        {name}
      </span>
    </div>
  );

  let content;
  switch (artStyle) {
    case 'promocao':
      content = (
        <div
          className="flex h-full flex-col justify-between p-[7cqw]"
          style={{
            background: `repeating-linear-gradient(135deg, ${secondary} 0 6cqw, ${withAlpha(primary, 0.12)} 6cqw 12cqw), ${secondary}`,
            color: onSecondary,
          }}
        >
          {header(onSecondary)}
          <div className="text-center">
            <span
              className="inline-flex items-center gap-[1.5cqw] rounded-full px-[4cqw] py-[1.4cqw] font-extrabold uppercase tracking-wider"
              style={{ background: primary, color: onPrimary, ...fs(4.4) }}
            >
              <Tag className="size-[4.5cqw]" aria-hidden /> Promoção
            </span>
            <p className={cn('mt-[3cqw] font-extrabold leading-[1.05]', fontClass)} style={{ ...fs(10), color: readableText(secondary) }}>
              {text}
            </p>
          </div>
          <div className="flex justify-center">
            {subtitle ? (
              <span className="rounded-[3cqw] px-[5cqw] py-[2cqw] font-extrabold shadow-lg" style={{ background: primary, color: onPrimary, ...fs(7) }}>
                {subtitle}
              </span>
            ) : (
              <span className="font-bold opacity-80" style={fs(4.5)}>
                Por tempo limitado!
              </span>
            )}
          </div>
        </div>
      );
      break;
    case 'frase':
      content = (
        <div className="flex h-full flex-col justify-between p-[8cqw]" style={{ background: primary, color: onPrimary }}>
          <Quote className="size-[12cqw] opacity-40" style={{ color: secondary }} aria-hidden />
          <p className={cn('font-bold leading-[1.15]', fontClass)} style={fs(text.length > 60 ? 6.5 : 8.5)}>
            {text}
          </p>
          <div className="flex items-center justify-between gap-[3cqw]">
            {header(onPrimary)}
            <span className="h-[1.2cqw] w-[14cqw] shrink-0 rounded-full" style={{ background: secondary }} aria-hidden />
          </div>
        </div>
      );
      break;
    case 'lancamento':
      content = (
        <div className="relative flex h-full flex-col justify-between overflow-hidden bg-slate-950 p-[7cqw] text-white">
          <span className="absolute -right-[20cqw] -top-[20cqw] size-[70cqw] rounded-full opacity-60 blur-[10cqw]" style={{ background: primary }} aria-hidden />
          <span className="absolute -bottom-[25cqw] -left-[15cqw] size-[60cqw] rounded-full opacity-50 blur-[10cqw]" style={{ background: secondary }} aria-hidden />
          <div className="relative">{header('#ffffff')}</div>
          <div className="relative">
            <span className="inline-flex items-center gap-[1.5cqw] rounded-full border border-white/30 bg-white/10 px-[3.5cqw] py-[1.2cqw] font-bold uppercase tracking-[0.2em] backdrop-blur" style={fs(3.6)}>
              <Rocket className="size-[4cqw]" aria-hidden /> Novidade
            </span>
            <p className={cn('mt-[3cqw] font-extrabold leading-[1.05]', fontClass)} style={fs(10.5)}>
              {text}
            </p>
          </div>
          <p className="relative font-semibold text-white/80" style={fs(4.6)}>
            {subtitle ? `Chegou! ${subtitle}` : 'Chegou a hora de conhecer.'}
          </p>
        </div>
      );
      break;
    default: {
      const Icon = BrandIcon ?? (subtitle ? Package : Sparkles);
      content = (
        <div
          className="relative flex h-full flex-col justify-between overflow-hidden p-[7cqw]"
          style={{ background: `linear-gradient(140deg, ${primary} 0%, ${secondary} 120%)`, color: onPrimary }}
        >
          <span className="absolute -right-[12cqw] top-[18cqw] size-[55cqw] rounded-full bg-white/10" aria-hidden />
          {header(onPrimary)}
          <div className="relative flex items-center justify-center">
            <span className="flex size-[30cqw] items-center justify-center rounded-full bg-white/95 shadow-2xl shadow-black/20" style={{ color: primary }}>
              <Icon className="size-[15cqw]" strokeWidth={1.6} aria-hidden />
            </span>
          </div>
          <div className="relative flex items-end justify-between gap-[3cqw]">
            <p className={cn('min-w-0 font-extrabold leading-[1.05]', fontClass)} style={fs(text.length > 30 ? 6.5 : 8.5)}>
              {text}
            </p>
            {subtitle && (
              <span className="shrink-0 rounded-[2.5cqw] bg-white px-[3cqw] py-[1.5cqw] font-extrabold shadow-lg" style={{ color: primary, ...fs(5) }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className={cn('@container relative w-full overflow-hidden', RATIO[ratio], className)} style={{ containerType: 'inline-size' }}>
      <div className="absolute inset-0">{content}</div>
    </div>
  );
}
