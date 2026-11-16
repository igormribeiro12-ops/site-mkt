import type { ReactNode } from 'react';
import { CloudRain, Globe2, Heart, MapPin, Target, UserRound, Wallet } from 'lucide-react';
import type { Audience, BrandIdentity, ChannelId } from '../../types';
import { PURCHASING_POWER } from '../../lib/constants';
import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';
import { isHexColor, readableText } from '../../lib/colors';
import { PlatformIcon } from '../brand/PlatformIcon';

const PLACE_TO_CHANNEL: Record<string, ChannelId> = {
  Instagram: 'instagram',
  TikTok: 'tiktok',
  Facebook: 'facebook',
  WhatsApp: 'whatsapp',
  'Google (pesquisas)': 'google',
  'Blogs e sites': 'site',
};

export function ageRangeLabel(a: Audience): string {
  if (a.ageMin === null || a.ageMax === null) return '';
  if (a.ageMax >= 80 && a.ageMin >= 60) return `${a.ageMin} anos ou mais`;
  return `${a.ageMin} a ${a.ageMax} anos`;
}

function Empty() {
  return <span className="italic text-slate-400">Ainda não definido</span>;
}

function Block({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="size-3.5" aria-hidden />
        {title}
      </p>
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

interface PersonaCardProps {
  audience: Audience;
  brand?: BrandIdentity;
  className?: string;
}

/** Representação visual do público-alvo: "Meu Cliente Ideal". */
export function PersonaCard({ audience: a, brand, className }: PersonaCardProps) {
  const from = brand && isHexColor(brand.primaryColor) ? brand.primaryColor : '#2563eb';
  const to = brand && isHexColor(brand.secondaryColor) ? brand.secondaryColor : '#7c3aed';
  const power = PURCHASING_POWER.find((p) => p.id === a.purchasingPower);
  const age = ageRangeLabel(a);
  const name = a.personaName.trim();
  // O texto do cabeçalho segue a cor principal, com o degradê só tocando a secundária no fim.
  const ink = readableText(from);

  return (
    <article className={cn('overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="relative px-5 pb-5 pt-5" style={{ background: `linear-gradient(135deg, ${from} 35%, ${to} 220%)`, color: ink }}>
        <div className="absolute -right-8 -top-12 size-36 rounded-full bg-white/15" aria-hidden />
        <div className="absolute -bottom-16 right-10 size-28 rounded-full bg-white/10" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] opacity-85">Meu Cliente Ideal</p>
        <div className="relative mt-3 flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-extrabold shadow-lg shadow-black/10" style={{ color: ink === '#ffffff' ? from : '#0f172a' }}>
            {name ? initials(name) : <UserRound className="size-8" aria-hidden />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold">{name || 'Cliente ideal'}</p>
            <p className="mt-0.5 text-sm opacity-90">{[age, a.occupation.trim()].filter(Boolean).join(' · ') || 'Idade e ocupação a definir'}</p>
            {a.location.trim() && (
              <p className="mt-1 flex items-center gap-1 text-sm opacity-90">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{a.location}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <Block icon={Wallet} title="Poder de compra">
          {power ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1" aria-hidden>
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className="h-2 w-6 rounded-full"
                    style={{ background: level <= power.level ? from : '#e2e8f0' }}
                  />
                ))}
              </div>
              <span>
                <strong>{power.label}</strong> — {power.description.toLowerCase()}
              </span>
            </div>
          ) : (
            <Empty />
          )}
        </Block>

        <Block icon={Heart} title="Interesses">
          {a.interests.length ? (
            <div className="flex flex-wrap gap-1.5">
              {a.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Block>

        <Block icon={Target} title="Necessidades">
          {a.needs.trim() ? <p className="whitespace-pre-line">{a.needs}</p> : <Empty />}
        </Block>

        <Block icon={CloudRain} title="Problemas que enfrenta">
          {a.painPoints.trim() ? <p className="whitespace-pre-line">{a.painPoints}</p> : <Empty />}
        </Block>

        <Block icon={Globe2} title="Onde está na internet">
          {a.onlinePlaces.length ? (
            <div className="flex flex-wrap gap-1.5">
              {a.onlinePlaces.map((place) => {
                const channel = PLACE_TO_CHANNEL[place];
                return (
                  <span
                    key={place}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                  >
                    {channel && <PlatformIcon channel={channel} className="size-3.5" />}
                    {place}
                  </span>
                );
              })}
            </div>
          ) : (
            <Empty />
          )}
        </Block>
      </div>
    </article>
  );
}
