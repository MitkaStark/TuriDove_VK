import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

const SERVICE_LINKS = [
  { href: '/hospedajes', label: 'Hoteles' },
  { href: '/paquetes', label: 'Paquetes' },
  { href: '/actividades', label: 'Actividades' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/vehiculos', label: 'Vehículos' },
];

const SOCIAL = [
  { href: SITE_CONFIG.social.facebook, label: 'Facebook', Icon: Facebook },
  { href: SITE_CONFIG.social.instagram, label: 'Instagram', Icon: Instagram },
  { href: SITE_CONFIG.social.twitter, label: 'Twitter', Icon: Twitter },
  { href: SITE_CONFIG.social.youtube, label: 'YouTube', Icon: Youtube },
];

export function Footer() {
  const year = new Date().getFullYear();
  const destinations = SITE_CONFIG.destinations.filter((d) =>
    (SITE_CONFIG.footerDestinations as readonly string[]).includes(d.name),
  );

  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 32 32" className="text-gold-400 w-7 h-7" fill="currentColor" aria-hidden="true">
                <path d="M16 4 L28 26 L4 26 Z" fillOpacity="0.6" />
                <path d="M16 10 L24 24 L8 24 Z" />
              </svg>
              <p className="font-display font-bold text-lg">{SITE_CONFIG.name}</p>
            </div>
            <p className="text-xs text-white/50 font-body leading-relaxed max-w-[220px] mt-3">
              {SITE_CONFIG.description}. Experiencias curadas al mejor precio.
            </p>
            <div className="flex gap-2 mt-4">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold-400/80 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-body font-semibold text-sm text-white mb-3 sm:mb-4">Destinos</h3>
            <ul className="space-y-2">
              {destinations.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/hospedajes?search=${encodeURIComponent(d.city)}`}
                    className="text-xs text-white/50 hover:text-gold-300 font-body transition-colors"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-body font-semibold text-sm text-white mb-3 sm:mb-4">Servicios</h3>
            <ul className="space-y-2">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/50 hover:text-gold-300 font-body transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-body font-semibold text-sm text-white mb-3 sm:mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li><a href={SITE_CONFIG.legal.about} className="text-xs text-white/50 hover:text-gold-300 font-body transition-colors">Sobre nosotros</a></li>
              <li><a href={SITE_CONFIG.legal.terms} className="text-xs text-white/50 hover:text-gold-300 font-body transition-colors">Términos y condiciones</a></li>
              <li><a href={SITE_CONFIG.legal.privacy} className="text-xs text-white/50 hover:text-gold-300 font-body transition-colors">Política de privacidad</a></li>
              <li><a href={SITE_CONFIG.legal.contact} className="text-xs text-white/50 hover:text-gold-300 font-body transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 sm:pt-8 text-center">
          <p className="text-xs text-white/30 font-body">
            © {year} <span className="text-gold-400">{SITE_CONFIG.name}</span>. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
