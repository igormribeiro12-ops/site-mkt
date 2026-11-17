import { useEffect, useRef, useState } from 'react';
import { ClipboardList, Dices, Handshake, Lightbulb, Mars, Telescope, Venus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AvatarDesign, Gender, HairStyle, OutfitStyle, PersonalityId } from '../../game/types';
import { cn } from '../../lib/cn';
import { HAIR_COLORS, SKINS, drawCharacterFrameTo, randomLook } from '../../world/art/characters';
import { hashRandom } from '../../world/art/draw';

const HAIRS: { id: HairStyle; label: string }[] = [
  { id: 'curto', label: 'Curto' },
  { id: 'longo', label: 'Longo' },
  { id: 'cacheado', label: 'Cacheado' },
  { id: 'coque', label: 'Coque' },
  { id: 'moicano', label: 'Moicano' },
  { id: 'careca', label: 'Raspado' },
];

const STYLES: { id: OutfitStyle; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'social', label: 'Social' },
  { id: 'criativo', label: 'Criativo' },
  { id: 'esportivo', label: 'Esportivo' },
];

const SHIRTS = ['#6d5dfc', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#ec4899', '#f8fafc', '#1f2937'];
const PANTS = ['#2f3a56', '#1e293b', '#3f3f46', '#1d4ed8', '#78350f', '#065f46', '#e5e7eb', '#db2777', '#7c3aed'];

export const PERSONALITIES: { id: PersonalityId; label: string; bonus: string; icon: LucideIcon }[] = [
  { id: 'criativo', label: 'Criativo', bonus: '+10% de alcance no marketing', icon: Lightbulb },
  { id: 'negociador', label: 'Negociador', bonus: '+5% na conversão de vendas', icon: Handshake },
  { id: 'organizado', label: 'Organizado', bonus: '−10% nos custos fixos', icon: ClipboardList },
  { id: 'visionario', label: 'Visionário', bonus: '+1 de qualidade do produto por mês', icon: Telescope },
];

const PREVIEW_FRAMES = ['idle-down-0', 'idle-down-1', 'walk-down-0', 'walk-down-1', 'walk-down-2', 'walk-down-3', 'walk-right-0', 'walk-right-1', 'walk-right-2', 'walk-right-3', 'cheer-0', 'cheer-1', 'workup-0', 'workup-1'];

/** Prévia animada do personagem (desenhada em canvas). */
export function AvatarPreview({ avatar, className }: { avatar: AvatarDesign; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => (f + 1) % 56), 140);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // sequência: parado, andando para baixo, andando de lado, comemorando
    const phase = Math.floor(frame / 14);
    const step = frame % 14;
    const name =
      phase === 0
        ? PREVIEW_FRAMES[step < 7 ? 0 : 1]
        : phase === 1
          ? PREVIEW_FRAMES[2 + (step % 4)]
          : phase === 2
            ? PREVIEW_FRAMES[6 + (step % 4)]
            : PREVIEW_FRAMES[10 + (step % 2)];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(4, 4);
    try {
      drawCharacterFrameTo(ctx, avatar, name, 0, 0);
    } catch {
      // sem suporte a canvas (ex.: testes)
    }
    ctx.restore();
  }, [frame, avatar]);

  return <canvas ref={ref} width={48 * 4} height={64 * 4} className={cn('[image-rendering:pixelated]', className)} aria-label="Prévia do seu personagem" role="img" />;
}

function Swatches({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === c}
            aria-label={`${label} ${c}`}
            onClick={() => onChange(c)}
            className={cn('size-8 rounded-lg ring-2 transition hover:scale-110', value === c ? 'ring-white' : 'ring-white/10')}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

function Pills<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition',
              value === o.id ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-white/10 text-slate-300 hover:border-white/25',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CharacterCreator({ avatar, onChange }: { avatar: AvatarDesign; onChange: (a: AvatarDesign) => void }) {
  const set = (patch: Partial<AvatarDesign>) => onChange({ ...avatar, ...patch });
  const fem = avatar.gender === 'feminino';
  const setGender = (gender: Gender) => {
    if (gender === avatar.gender) return;
    // Ajusta o cabelo para um padrão comum ao trocar (pode ser mudado depois).
    const hairStyle: HairStyle =
      gender === 'feminino' ? (['curto', 'moicano', 'careca'].includes(avatar.hairStyle) ? 'longo' : avatar.hairStyle) : avatar.hairStyle === 'longo' ? 'curto' : avatar.hairStyle;
    onChange({ ...avatar, gender, hairStyle, beard: gender === 'masculino' ? avatar.beard : false, skirt: gender === 'feminino' ? avatar.skirt : false });
  };
  const randomize = () => {
    const r = randomLook(hashRandom(String(Math.random())));
    onChange({
      ...avatar,
      skin: r.skin,
      hairColor: r.hairColor,
      shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
      pants: r.pants,
      style: r.style,
      hairStyle: fem ? (['curto', 'moicano', 'careca'].includes(r.hairStyle) ? 'longo' : r.hairStyle) : r.hairStyle === 'longo' ? 'curto' : r.hairStyle,
    });
  };

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-72 w-full items-end justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-violet-500/25 via-ink-800 to-ink-900">
          <div className="absolute inset-x-6 bottom-4 h-6 rounded-[50%] bg-black/30 blur-sm" aria-hidden />
          <AvatarPreview avatar={avatar} className="relative -mb-1 h-64 w-48" />
        </div>
        <button type="button" onClick={randomize} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.06]">
          <Dices className="size-4" aria-hidden /> Aparência aleatória
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Sexo</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Sexo">
            {(
              [
                ['masculino', 'Masculino', Mars],
                ['feminino', 'Feminino', Venus],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={avatar.gender === id}
                onClick={() => setGender(id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-bold transition',
                  avatar.gender === id
                    ? id === 'feminino'
                      ? 'border-pink-400 bg-pink-500/15 text-white'
                      : 'border-sky-400 bg-sky-500/15 text-white'
                    : 'border-white/10 text-slate-300 hover:border-white/25',
                )}
              >
                <Icon className={cn('size-5', id === 'feminino' ? 'text-pink-300' : 'text-sky-300')} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
        <Swatches label="Tom de pele" colors={SKINS} value={avatar.skin} onChange={(skin) => set({ skin })} />
        <Pills label="Cabelo" options={HAIRS} value={avatar.hairStyle} onChange={(hairStyle) => set({ hairStyle })} />
        <Swatches label="Cor do cabelo" colors={HAIR_COLORS} value={avatar.hairColor} onChange={(hairColor) => set({ hairColor })} />
        <Pills label="Estilo" options={STYLES} value={avatar.style} onChange={(style) => set({ style })} />
        <Swatches label="Cor da roupa" colors={SHIRTS} value={avatar.shirt} onChange={(shirt) => set({ shirt })} />
        {fem ? (
          <Pills
            label="Roupa de baixo"
            options={[
              { id: 'calca', label: 'Calça' },
              { id: 'saia', label: 'Saia' },
            ]}
            value={avatar.skirt ? 'saia' : 'calca'}
            onChange={(v) => set({ skirt: v === 'saia' })}
          />
        ) : (
          <Pills
            label="Barba"
            options={[
              { id: 'sem', label: 'Sem barba' },
              { id: 'com', label: 'Com barba' },
            ]}
            value={avatar.beard ? 'com' : 'sem'}
            onChange={(v) => set({ beard: v === 'com' })}
          />
        )}
        <Swatches label={avatar.skirt && fem ? 'Cor da saia' : 'Cor da calça'} colors={PANTS} value={avatar.pants} onChange={(pants) => set({ pants })} />
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Personalidade empreendedora</p>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Personalidade empreendedora">
            {PERSONALITIES.map((p) => {
              const Icon = p.icon;
              const active = avatar.personality === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set({ personality: p.id })}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3 text-left transition',
                    active ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 hover:border-white/25',
                  )}
                >
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', active ? 'bg-violet-500 text-white' : 'bg-white/[0.06] text-violet-300')}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">{p.label}</span>
                    <span className="block text-[11px] text-slate-400">{p.bonus}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
