import { AtSign, Tag } from 'lucide-react';
import type { BrandIdentity, CompanyInfo } from '../../types';
import { getBrandStyle, segmentLabel } from '../../lib/constants';
import { describeColor, isHexColor, withAlpha } from '../../lib/colors';
import { toHandle } from '../../lib/format';
import { cn } from '../../lib/cn';
import { BrandLogo, BrandMark, brandColors } from './BrandLogo';

interface Props {
  brand: BrandIdentity;
  company: CompanyInfo;
  className?: string;
}

/** Cartela de cores com nome e código. */
export function ColorSwatches({ brand, className }: { brand: BrandIdentity; className?: string }) {
  const items = [
    { label: 'Principal', value: brand.primaryColor },
    { label: 'Secundária', value: brand.secondaryColor },
  ];
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {items.map((item) => {
        const valid = isHexColor(item.value);
        return (
          <div key={item.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div
              className={cn('h-14', !valid && 'bg-[repeating-linear-gradient(45deg,#f1f5f9_0_8px,#e2e8f0_8px_16px)]')}
              style={valid ? { background: item.value } : undefined}
            />
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-slate-700">{item.label}</p>
              <p className="font-mono text-[11px] uppercase text-slate-500">
                {valid ? `${item.value} · ${describeColor(item.value)?.name ?? ''}` : 'não escolhida'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Prévia da identidade visual: logotipo, aplicações e cores. */
export function BrandPreview({ brand, company, className }: Props) {
  const { primary, secondary, onPrimary } = brandColors(brand);
  const style = getBrandStyle(brand.style);
  const name = company.name.trim() || 'Sua empresa';
  const handle = toHandle(company.name);
  const segment = segmentLabel(company.segment, company.segmentOther);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Logotipo em fundo claro */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Logotipo</p>
        <div className="flex justify-center py-2">
          <BrandLogo brand={brand} companyName={name} size="md" showSlogan />
        </div>
      </div>

      {/* Logotipo em fundo colorido */}
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 140%)` }}
      >
        <div
          className="absolute -right-10 -top-10 size-40 rounded-full opacity-20"
          style={{ background: onPrimary }}
          aria-hidden
        />
        <p className="relative mb-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: withAlpha(onPrimary === '#ffffff' ? '#ffffff' : '#0f172a', 0.7) }}>
          Versão em fundo colorido
        </p>
        <div className="relative flex justify-center py-2">
          <BrandLogo brand={brand} companyName={name} size="md" inverted nameColor={onPrimary} />
        </div>
      </div>

      {/* Aplicações */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {/* Cartão de visita */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Cartão de visita</p>
          <div className="relative flex aspect-[1.75] flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-md shadow-slate-900/10 ring-1 ring-slate-100">
            <div className="absolute inset-y-0 right-0 w-2" style={{ background: secondary }} aria-hidden />
            <BrandLogo brand={brand} companyName={name} size="xs" />
            <div className="space-y-0.5 text-[11px] text-slate-500">
              <p className="text-xs font-semibold text-slate-700">{company.founder.trim() || 'Nome do fundador(a)'}</p>
              <p>Fundador(a)</p>
              <p className="flex items-center gap-1">
                <Tag className="size-2.5" aria-hidden /> {segment || 'Segmento'}
              </p>
              <p className="flex items-center gap-1">
                <AtSign className="size-2.5" aria-hidden /> {handle}
              </p>
            </div>
          </div>
        </div>

        {/* Perfil em rede social */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Perfil nas redes</p>
          <div className="overflow-hidden rounded-xl ring-1 ring-slate-100">
            <div className="h-10" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} aria-hidden />
            <div className="px-3 pb-3">
              <div className="-mt-5 flex items-end justify-between">
                <span className="rounded-full bg-white p-0.5">
                  <BrandMark brand={brand} companyName={name} size="sm" />
                </span>
                <span
                  className="rounded-md px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: primary, color: onPrimary }}
                >
                  Seguir
                </span>
              </div>
              <p className={cn('mt-1.5 truncate text-xs text-slate-900', style?.fontClass, 'font-bold')}>{name}</p>
              <p className="text-[10px] text-slate-400">@{handle}</p>
              <p className="mt-1 line-clamp-2 text-[10px] text-slate-600">{brand.slogan.trim() || 'Seu slogan aparece aqui'}</p>
            </div>
          </div>
        </div>
      </div>

      <ColorSwatches brand={brand} />
      {style && (
        <p className="text-center text-xs text-slate-500">
          Estilo <strong className="text-slate-700">{style.label}</strong> — {style.description.toLowerCase()}
        </p>
      )}
    </div>
  );
}
