import { Globe } from 'lucide-react';
import type { ChannelId } from '../../types';

interface PlatformIconProps {
  channel: ChannelId;
  className?: string;
}

/** Ícones simplificados das plataformas (traço, no estilo dos ícones Lucide). */
export function PlatformIcon({ channel, className = 'size-5' }: PlatformIconProps) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (channel) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...common}>
          <path d="M15.5 3c.4 2.6 2.2 4.4 4.8 4.7" />
          <path d="M15.5 3v11.6a4.6 4.6 0 1 1-4.6-4.6" />
        </svg>
      );
    case 'google':
      return (
        <svg {...common}>
          <path d="M17.66 6.34A8 8 0 1 0 20 12h-8" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M3.5 20.5 4.9 16.4A8.5 8.5 0 1 1 8 19.3z" />
          <path d="M9 9.2c0 3 2.3 5.6 5.6 5.8l1-1.4-1.7-.9-.9.8c-1-.4-1.9-1.3-2.4-2.4l.8-.9-.9-1.7z" />
        </svg>
      );
    case 'site':
      return <Globe className={className} aria-hidden />;
  }
}
