'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

interface RoleMenuItem {
  label: string;
  href: string;
}

const ROLE_MENU: Record<string, RoleMenuItem[]> = {
  CLIENTE: [
    { label: 'Mis reservas', href: '/cliente/reservas' },
    { label: 'Mis pagos', href: '/cliente/pagos' },
    { label: 'Mi perfil', href: '/cliente/perfil' },
  ],
  PROVEEDOR: [
    { label: 'Panel proveedor', href: '/proveedor' },
    { label: 'Mis recursos', href: '/proveedor/hospedajes' },
  ],
  AGENCIA: [
    { label: 'Panel agencia', href: '/agencia' },
    { label: 'Mis recursos', href: '/agencia/hospedajes' },
  ],
  OPERADOR: [
    { label: 'Panel operador', href: '/operador' },
  ],
  ADMIN: [
    { label: 'Panel admin', href: '/admin' },
  ],
};

export function UserDropdown() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const initials = (user.nombre ?? user.email ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const items = ROLE_MENU[user.role] ?? [];

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 group"
        aria-label="Menú de usuario"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-white text-xs font-semibold flex items-center justify-center">
          {initials}
        </div>
        <ChevronDown className="w-4 h-4 text-navy-400 group-hover:text-navy-600 transition-colors" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-navy-100/50 py-2 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-navy-600 hover:bg-navy-50 font-body transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="h-px bg-navy-100/50 my-1" />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-navy-600 hover:bg-navy-50 font-body transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
