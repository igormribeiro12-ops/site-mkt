import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bookmark,
  CheckCheck,
  ChevronRight,
  Ellipsis,
  Globe,
  Heart,
  MessageCircle,
  Music2,
  Plus,
  Search,
  Send,
  Share2,
  ThumbsUp,
  BadgeCheck,
  ExternalLink,
} from 'lucide-react';
import type { ArtStyleId, BrandIdentity, ChannelId, CompanyInfo, Product } from '../../types';
import { formatCurrency, formatTime, toHandle } from '../../lib/format';
import { cn } from '../../lib/cn';
import { BrandLogo, BrandMark, brandColors } from '../brand/BrandLogo';
import { PostArt } from './PostArt';

export interface PostContent {
  platform: ChannelId;
  text: string;
  cta: string;
  artStyle: ArtStyleId;
  artTitle: string;
}

interface PostPreviewProps {
  post: PostContent;
  product?: Product;
  brand: BrandIdentity;
  company: CompanyInfo;
  /** Exibe o selo "Patrocinado" (há investimento em anúncios). */
  sponsored?: boolean;
  className?: string;
}

/** Texto com quebras de linha preservadas e hashtags destacadas. */
function RichText({ text, hashtagClass = 'text-blue-700' }: { text: string; hashtagClass?: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/u);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <span key={i} className={hashtagClass}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Mostra só o começo do texto, com opção "mais", como nas redes sociais. */
function Truncated({ text, limit, moreLabel = 'mais', render }: { text: string; limit: number; moreLabel?: string; render: (t: string) => ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  if (text.length <= limit || expanded) return <>{render(text)}</>;
  return (
    <>
      {render(text.slice(0, limit).trimEnd())}…{' '}
      <button type="button" onClick={() => setExpanded(true)} className="font-medium opacity-60 hover:underline">
        {moreLabel}
      </button>
    </>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return <span className="italic opacity-50">{children}</span>;
}

export function PostPreview({ post, product, brand, company, sponsored = false, className }: PostPreviewProps) {
  const name = company.name.trim() || 'Sua empresa';
  const handle = toHandle(company.name);
  const { primary, onPrimary } = brandColors(brand);
  const title = post.artTitle.trim() || product?.name || name;
  const price = product && product.price > 0 ? formatCurrency(product.price) : undefined;
  const text = post.text.trim();
  const cta = post.cta.trim();
  const now = formatTime(new Date());

  const art = (ratio: 'square' | 'portrait' | 'landscape', extra?: string) => (
    <PostArt
      brand={brand}
      companyName={name}
      artStyle={post.artStyle}
      title={post.artStyle === 'frase' ? post.artTitle.trim() || brand.slogan || name : title}
      subtitle={price}
      ratio={ratio}
      className={extra}
    />
  );

  switch (post.platform) {
    case 'instagram':
      return (
        <div className={cn('mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-[13px] text-slate-900 shadow-xl shadow-slate-900/10', className)}>
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <span className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 p-[2px]">
              <span className="block rounded-full bg-white p-[1.5px]">
                <BrandMark brand={brand} companyName={name} size="xs" className="rounded-full!" />
              </span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate font-semibold">{handle}</p>
              {sponsored && <p className="text-[11px] text-slate-500">Patrocinado</p>}
            </div>
            <Ellipsis className="size-5 text-slate-700" aria-hidden />
          </div>
          {art('square')}
          {cta && (
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 font-semibold" style={{ color: primary }}>
              {cta}
              <ChevronRight className="size-4" aria-hidden />
            </div>
          )}
          <div className="flex items-center gap-4 px-3 pb-1 pt-2.5 text-slate-800" aria-hidden>
            <Heart className="size-6" />
            <MessageCircle className="size-6 -scale-x-100" />
            <Send className="size-6" />
            <Bookmark className="ml-auto size-6" />
          </div>
          <div className="px-3 pb-3">
            <p className="mb-1 text-[12px] font-semibold">Seja o primeiro a curtir</p>
            <p className="whitespace-pre-line break-words leading-snug">
              <span className="mr-1 font-semibold">{handle}</span>
              {text ? (
                <Truncated text={text} limit={125} render={(t) => <RichText text={t} />} />
              ) : (
                <Placeholder>O texto da publicação aparece aqui…</Placeholder>
              )}
            </p>
            <p className="mt-1.5 text-[10px] uppercase tracking-wide text-slate-400">Agora mesmo</p>
          </div>
        </div>
      );

    case 'tiktok':
      return (
        <div className={cn('relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-slate-900 bg-black text-white shadow-2xl shadow-slate-900/30', className)}>
          <div
            className="relative aspect-[9/16] w-full"
            style={{ background: `linear-gradient(160deg, ${primary} 0%, #0b0b0f 75%)` }}
          >
            <div className="absolute inset-x-0 top-[13%] shadow-2xl shadow-black/40">{art('square')}</div>
          </div>
          <div className="absolute inset-x-0 top-0 flex justify-center gap-4 bg-gradient-to-b from-black/50 to-transparent pb-6 pt-3 text-[13px] font-semibold" aria-hidden>
            <span className="text-white/60">Seguindo</span>
            <span className="border-b-2 border-white pb-0.5">Para você</span>
          </div>
          <div className="absolute bottom-24 right-2 flex flex-col items-center gap-4" aria-hidden>
            <span className="relative">
              <span className="block rounded-full border-2 border-white">
                <BrandMark brand={brand} companyName={name} size="sm" className="rounded-full!" />
              </span>
              <span className="absolute -bottom-2 left-1/2 flex size-4 -translate-x-1/2 items-center justify-center rounded-full bg-rose-500">
                <Plus className="size-3" strokeWidth={3} />
              </span>
            </span>
            <Heart className="size-7 fill-white/90 drop-shadow" />
            <MessageCircle className="size-7 fill-white/90 drop-shadow" />
            <Bookmark className="size-7 fill-white/90 drop-shadow" />
            <Share2 className="size-7 drop-shadow" />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-16">
            <p className="text-[14px] font-bold">@{handle}</p>
            <p className="mt-1 line-clamp-3 whitespace-pre-line break-words pr-12 text-[12.5px] leading-snug">
              {text ? <RichText text={text} hashtagClass="font-bold" /> : <Placeholder>O texto da publicação aparece aqui…</Placeholder>}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/80">
              <Music2 className="size-3" aria-hidden /> som original · {name}
            </p>
            {cta && (
              <span className="mt-2.5 block rounded-md py-2 text-center text-[13px] font-bold" style={{ background: primary, color: onPrimary }}>
                {cta}
              </span>
            )}
          </div>
        </div>
      );

    case 'facebook':
      return (
        <div className={cn('mx-auto w-full max-w-[460px] overflow-hidden rounded-xl border border-slate-200 bg-white text-[14px] text-[#050505] shadow-xl shadow-slate-900/10', className)}>
          <div className="flex items-center gap-2.5 px-4 pt-3">
            <BrandMark brand={brand} companyName={name} size="sm" className="rounded-full!" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate font-semibold">{name}</p>
              <p className="flex items-center gap-1 text-[12px] text-slate-500">
                {sponsored ? 'Patrocinado' : 'Agora mesmo'} · <Globe className="size-3" aria-hidden />
              </p>
            </div>
            <Ellipsis className="size-5 text-slate-500" aria-hidden />
          </div>
          <p className="whitespace-pre-line break-words px-4 py-3 leading-snug">
            {text ? (
              <Truncated text={text} limit={250} moreLabel="Ver mais" render={(t) => <RichText text={t} hashtagClass="text-[#1877f2]" />} />
            ) : (
              <Placeholder>O texto da publicação aparece aqui…</Placeholder>
            )}
          </p>
          {art('landscape')}
          <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] uppercase text-slate-500">{handle}.com.br</p>
              <p className="truncate font-semibold">{title}</p>
            </div>
            {cta && <span className="shrink-0 rounded-md bg-[#e4e6eb] px-3 py-2 text-[13px] font-semibold">{cta}</span>}
          </div>
          <div className="mx-4 flex justify-around border-t border-slate-200 py-1.5 text-[13px] font-semibold text-slate-500" aria-hidden>
            <span className="flex items-center gap-1.5 px-3 py-1"><ThumbsUp className="size-4" /> Curtir</span>
            <span className="flex items-center gap-1.5 px-3 py-1"><MessageCircle className="size-4" /> Comentar</span>
            <span className="flex items-center gap-1.5 px-3 py-1"><Share2 className="size-4" /> Compartilhar</span>
          </div>
        </div>
      );

    case 'google': {
      const headline = [title, name, cta].filter(Boolean).slice(0, 3).join(' | ');
      return (
        <div className={cn('mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10', className)}>
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-500" aria-hidden>
              Pesquisa
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm">
              <span className="truncate">{(product?.name || company.offering || name).toLowerCase()}</span>
              <Search className="ml-auto size-4 shrink-0 text-[#4285f4]" aria-hidden />
            </div>
          </div>
          <div className="space-y-1 px-5 py-5 font-[Arial,sans-serif]">
            <p className="text-[12px] font-bold text-slate-900">Patrocinado</p>
            <div className="flex items-center gap-2.5">
              <span className="rounded-full border border-slate-200 bg-white p-0.5">
                <BrandMark brand={brand} companyName={name} size="xs" className="size-6! rounded-full!" />
              </span>
              <div className="leading-tight">
                <p className="text-[14px] text-[#202124]">{name}</p>
                <p className="text-[12px] text-[#4d5156]">www.{handle}.com.br</p>
              </div>
            </div>
            <p className="pt-1 text-[20px] leading-snug text-[#1a0dab] hover:underline">{headline}</p>
            <p className="text-[14px] leading-snug text-[#4d5156]">
              {text ? text.slice(0, 90) : <Placeholder>A descrição do anúncio aparece aqui (até 90 caracteres)…</Placeholder>}
              {text.length > 90 && <span className="text-amber-600">… (texto cortado)</span>}
            </p>
            {price && <p className="text-[13px] text-[#4d5156]">A partir de {price}</p>}
          </div>
        </div>
      );
    }

    case 'whatsapp':
      return (
        <div className={cn('mx-auto w-full max-w-[360px] overflow-hidden rounded-[1.75rem] border-[6px] border-slate-900 bg-[#efeae2] shadow-2xl shadow-slate-900/25', className)}>
          <div className="flex items-center gap-2.5 bg-[#075e54] px-3 py-2.5 text-white">
            <BrandMark brand={brand} companyName={name} size="xs" className="rounded-full!" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="flex items-center gap-1 truncate text-[14px] font-semibold">
                {name} <BadgeCheck className="size-3.5 shrink-0 text-[#25d366]" aria-hidden />
              </p>
              <p className="text-[11px] text-white/75">Conta comercial</p>
            </div>
          </div>
          <div
            className="min-h-[420px] space-y-1.5 px-3 py-4"
            style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
          >
            <p className="mx-auto mb-3 w-fit rounded-md bg-white/90 px-2 py-0.5 text-[11px] text-slate-500 shadow-sm">HOJE</p>
            <div className="max-w-[88%] overflow-hidden rounded-lg rounded-tl-none bg-white p-1 shadow-sm">
              <div className="overflow-hidden rounded-md">{art('square')}</div>
              <p className="whitespace-pre-line break-words px-1.5 pb-0.5 pt-1.5 text-[13.5px] leading-snug text-[#111b21]">
                {text ? <RichText text={text} hashtagClass="text-[#027eb5]" /> : <Placeholder>A mensagem aparece aqui…</Placeholder>}
              </p>
              <p className="flex items-center justify-end gap-1 px-1.5 pb-0.5 text-[10px] text-slate-400">
                {now} <CheckCheck className="size-3.5 text-sky-500" aria-hidden />
              </p>
            </div>
            {cta && (
              <div className="max-w-[88%] rounded-lg bg-white py-2 text-center text-[13.5px] font-medium text-[#027eb5] shadow-sm">
                <ExternalLink className="mr-1.5 inline size-3.5" aria-hidden />
                {cta}
              </div>
            )}
          </div>
        </div>
      );

    case 'site':
      return (
        <div className={cn('mx-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10', className)}>
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="mx-auto truncate rounded-md bg-white px-4 py-0.5 text-[11px] text-slate-500">www.{handle}.com.br</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <BrandLogo brand={brand} companyName={name} size="xs" />
            <span className="hidden gap-4 text-[12px] font-medium text-slate-500 sm:flex" aria-hidden>
              <span>Início</span>
              <span>Produtos</span>
              <span>Contato</span>
            </span>
          </div>
          <div className="grid items-center gap-5 px-5 pb-6 pt-2 sm:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: primary }}>
                {brand.slogan.trim() || 'Bem-vindo'}
              </p>
              <p className="mt-1.5 text-2xl font-extrabold leading-tight text-slate-900">{title}</p>
              <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-slate-600">
                {text ? <Truncated text={text} limit={300} moreLabel="ler mais" render={(t) => t} /> : <Placeholder>O texto de destaque aparece aqui…</Placeholder>}
              </p>
              {cta && (
                <span className="mt-4 inline-flex rounded-xl px-4 py-2 text-[13px] font-bold shadow-md" style={{ background: primary, color: onPrimary }}>
                  {cta}
                </span>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl shadow-lg">{art('square')}</div>
          </div>
        </div>
      );
  }
}
