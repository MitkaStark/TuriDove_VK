'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Logo } from './logo';
import { UserDropdown } from './user-dropdown';
import { MobileMenu } from './mobile-menu';

const NAV_LINKS = [
  { href: '/hospedajes', label: 'Hoteles' },
  { href: '/paquetes', label: 'Paquetes' },
  { href: '/actividades', label: 'Actividades' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/vehiculos', label: 'Vehículos' },
];

export function Header() {
  const { user } = useAuthStore();
  const authed = !!user;

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100/50 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-navy-500 hover:text-navy-800 font-body transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {authed ? (
            <UserDropdown />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex text-sm text-navy-500 hover:text-navy-800 font-body transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="hidden md:inline-flex px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
              >
                Registrarse
              </Link>
            </>
          )}
          <MobileMenu links={NAV_LINKS} isAuthenticated={authed} />
        </div>
      </div>
    </header>
  );
}
