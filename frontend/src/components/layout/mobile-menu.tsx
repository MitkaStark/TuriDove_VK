'use client';

import Link from 'next/link';
import { useState } from 'react';

interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  links: NavLink[];
  isAuthenticated: boolean;
}

export function MobileMenu({ links, isAuthenticated }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="md:hidden relative w-6 h-6 flex flex-col items-center justify-center gap-1.5"
        aria-label="Menú"
        aria-expanded={open}
      >
        <span
          className={`block w-5 h-0.5 bg-navy-600 transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`}
        />
        <span
          className={`block w-5 h-0.5 bg-navy-600 transition-all duration-300 ${open ? 'opacity-0' : ''}`}
        />
        <span
          className={`block w-5 h-0.5 bg-navy-600 transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`}
        />
      </button>

      <div
        className={`md:hidden absolute top-16 left-0 right-0 bg-white border-b border-navy-100/50 overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}
      >
        <nav className="px-4 py-4 flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-navy-600 hover:text-navy-800 font-body py-2 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex gap-2 mt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 text-center text-sm text-navy-600 font-body py-2.5 rounded-lg border border-navy-200"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex-1 text-center text-sm text-white font-body font-semibold py-2.5 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500"
              >
                Registrarse
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
