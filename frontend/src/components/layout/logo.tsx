import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';

interface LogoProps {
  variant?: 'public' | 'admin';
  kicker?: string;
  href?: string;
}

export function Logo({ variant = 'public', kicker, href = '/' }: LogoProps) {
  const kickerText = kicker ?? SITE_CONFIG.kicker;

  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      <svg
        viewBox="0 0 32 32"
        className="text-gold-400 w-8 h-8"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16 4 L28 26 L4 26 Z" fillOpacity="0.6" />
        <path d="M16 10 L24 24 L8 24 Z" />
      </svg>
      <div className="leading-none">
        <p className="text-[10px] tracking-[0.2em] text-navy-400 uppercase font-body leading-none">
          {kickerText}
        </p>
        <p className={`mt-0.5 font-display font-bold leading-tight ${variant === 'admin' ? 'text-base' : 'text-base'} text-navy-700`}>
          {SITE_CONFIG.name}
        </p>
      </div>
    </Link>
  );
}
