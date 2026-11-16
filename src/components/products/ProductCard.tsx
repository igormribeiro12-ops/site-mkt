import { CircleCheck, Package, Pencil, Sparkles, Star, Trash2 } from 'lucide-react';
import type { BrandIdentity, Product } from '../../types';
import { brandColors } from '../brand/BrandLogo';
import { getLogoIcon } from '../../lib/logoIcons';
import { formatCurrency } from '../../lib/format';
import { toList } from '../../lib/text';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/Button';

interface ProductCardProps {
  product: Product;
  brand: BrandIdentity;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  className?: string;
}

/** Cartão de vitrine de um produto ou serviço, nas cores da marca. */
export function ProductCard({ product, brand, onEdit, onDelete, compact, className }: ProductCardProps) {
  const { primary, secondary, onPrimary } = brandColors(brand);
  const BrandIcon = getLogoIcon(brand.icon);
  const Icon = BrandIcon ?? (product.kind === 'servico' ? Sparkles : Package);
  const benefits = toList(product.benefits, 3);

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 print-avoid-break',
        !compact && 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10',
        className,
      )}
    >
      <div
        className={cn('relative flex items-center justify-center overflow-hidden', compact ? 'h-24' : 'h-36')}
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 130%)` }}
      >
        <span className="absolute -left-6 -top-8 size-28 rounded-full bg-white/10" aria-hidden />
        <span className="absolute -bottom-10 -right-4 size-32 rounded-full bg-white/10" aria-hidden />
        <Icon
          className={cn('relative drop-shadow-sm transition-transform duration-300 group-hover:scale-110', compact ? 'size-10' : 'size-14')}
          style={{ color: onPrimary }}
          strokeWidth={1.6}
          aria-hidden
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
          {product.kind === 'servico' ? 'Serviço' : 'Produto'}
        </span>
        {(onEdit || onDelete) && (
          <div className="absolute right-2 top-2 flex gap-1 rounded-xl bg-white/90 p-0.5 shadow-sm print:hidden">
            {onEdit && (
              <IconButton label={`Editar ${product.name}`} onClick={onEdit} className="size-8">
                <Pencil className="size-4" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton label={`Excluir ${product.name}`} tone="danger" onClick={onDelete} className="size-8">
                <Trash2 className="size-4" />
              </IconButton>
            )}
          </div>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col', compact ? 'p-4' : 'p-5')}>
        {product.category && (
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: primary }}>
            {product.category}
          </p>
        )}
        <h3 className={cn('mt-1 font-bold leading-snug text-slate-900', compact ? 'text-base' : 'text-lg')}>{product.name}</h3>
        <p className={cn('mt-1.5 text-sm leading-relaxed text-slate-500', compact && 'line-clamp-2')}>{product.description}</p>

        {!compact && benefits.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        {!compact && product.differentials.trim() && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <Star className="mt-0.5 size-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
            <span>
              <strong className="font-semibold">Diferencial:</strong> {product.differentials}
            </span>
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className={cn('font-extrabold tracking-tight text-slate-900', compact ? 'text-lg' : 'text-2xl')}>
            {product.price === 0 ? 'Gratuito' : formatCurrency(product.price)}
          </p>
          {!compact && (
            <span
              className="rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{ background: primary, color: onPrimary }}
              aria-hidden
            >
              {product.kind === 'servico' ? 'Contratar' : 'Comprar'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
