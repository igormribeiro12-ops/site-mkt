// Utilitários de cor usados na identidade visual da marca.

export const FALLBACK_PRIMARY = '#94a3b8';
export const FALLBACK_SECONDARY = '#cbd5e1';

export function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{6})$/i.test(value);
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function withAlpha(hex: string, alpha: number): string {
  if (!isHexColor(hex)) return `rgba(148, 163, 184, ${alpha})`;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Retorna branco ou um tom escuro, o que tiver melhor contraste com o fundo. */
export function readableText(background: string): string {
  if (!isHexColor(background)) return '#0f172a';
  const l = luminance(background);
  const contrastWhite = 1.05 / (l + 0.05);
  const contrastDark = (l + 0.05) / (luminance('#0f172a') + 0.05);
  return contrastWhite >= contrastDark ? '#ffffff' : '#0f172a';
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

export interface ColorMeaning {
  name: string;
  meaning: string;
}

/** Psicologia das cores simplificada, para fins didáticos. */
export function describeColor(hex: string): ColorMeaning | null {
  if (!isHexColor(hex)) return null;
  const [h, s, l] = hexToHsl(hex);
  if (l < 14) return { name: 'Preto', meaning: 'sofisticação, elegância e autoridade' };
  if (l > 92) return { name: 'Branco', meaning: 'simplicidade, limpeza e clareza' };
  if (s < 12) return { name: 'Cinza', meaning: 'neutralidade, equilíbrio e seriedade' };
  if (h < 12 || h >= 345) return { name: 'Vermelho', meaning: 'energia, paixão e urgência' };
  if (h < 40) {
    if (l < 35) return { name: 'Marrom', meaning: 'confiança, aconchego e tradição' };
    return { name: 'Laranja', meaning: 'entusiasmo, criatividade e acessibilidade' };
  }
  if (h < 65) return { name: 'Amarelo', meaning: 'otimismo, alegria e atenção' };
  if (h < 160) return { name: 'Verde', meaning: 'natureza, saúde e crescimento' };
  if (h < 195) return { name: 'Turquesa', meaning: 'frescor, equilíbrio e tranquilidade' };
  if (h < 250) return { name: 'Azul', meaning: 'confiança, segurança e tecnologia' };
  if (h < 290) return { name: 'Roxo', meaning: 'criatividade, inovação e originalidade' };
  return { name: 'Rosa', meaning: 'delicadeza, cuidado e afeto' };
}

export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
}

export const PALETTES: ColorPalette[] = [
  { name: 'Oceano', primary: '#2563eb', secondary: '#06b6d4' },
  { name: 'Criativa', primary: '#7c3aed', secondary: '#f472b6' },
  { name: 'Floresta', primary: '#15803d', secondary: '#a3e635' },
  { name: 'Pôr do sol', primary: '#ea580c', secondary: '#facc15' },
  { name: 'Premium', primary: '#111827', secondary: '#d4a72c' },
  { name: 'Coral', primary: '#e11d48', secondary: '#fdba74' },
  { name: 'Café', primary: '#78350f', secondary: '#e7c9a9' },
  { name: 'Futuro', primary: '#0f172a', secondary: '#22d3ee' },
  { name: 'Doce', primary: '#db2777', secondary: '#fbcfe8' },
  { name: 'Bem-estar', primary: '#0d9488', secondary: '#99f6e4' },
];

export const SWATCHES: string[] = [
  '#0f172a',
  '#475569',
  '#dc2626',
  '#e11d48',
  '#db2777',
  '#c026d3',
  '#7c3aed',
  '#4f46e5',
  '#2563eb',
  '#0284c7',
  '#0891b2',
  '#0d9488',
  '#16a34a',
  '#65a30d',
  '#ca8a04',
  '#ea580c',
  '#78350f',
  '#fbcfe8',
  '#bae6fd',
  '#fde68a',
];
