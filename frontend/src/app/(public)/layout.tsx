"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Leaf, User, LogOut, Calendar, CreditCard, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api/v1', '');

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); router.push("/"); };
  const initials = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : "";

  const rolePanelMap: Record<string, string> = {
    ADMIN: "/admin",
    PROVEEDOR: "/proveedor",
    AGENCIA: "/agencia",
    OPERADOR: "/operador",
    CLIENTE: "/cliente",
  };
  const panelBase = user ? (rolePanelMap[user.role] || "/cliente") : "/cliente";

  const navLinks = [
    { href: "/hospedajes", label: t('nav.hospedajes') },
    { href: "/actividades", label: t('nav.actividades') },
    { href: "/transfers", label: t('nav.transfers') },
    { href: "/vehiculos", label: t('nav.vehiculos') },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Agro<span className="text-primary">turismo</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(link.href)
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2.5 rounded-full pl-1.5 pr-3 h-10 hover:bg-muted/50">
                    <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                      {user.avatar ? (
                        <img src={`${API_URL}${user.avatar}`} alt="" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline-block">{user.nombre}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{user.nombre} {user.apellido}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-lg cursor-pointer" onSelect={() => router.push(panelBase)}><User className="mr-2.5 h-4 w-4" />Mi Panel</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer" onSelect={() => router.push(`${panelBase}/reservas`)}><Calendar className="mr-2.5 h-4 w-4" />Mis Reservas</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer" onSelect={() => router.push(`${panelBase}/${user?.role === 'ADMIN' || user?.role === 'CLIENTE' ? 'pagos' : 'financiero'}`)}><CreditCard className="mr-2.5 h-4 w-4" />{user?.role === 'ADMIN' || user?.role === 'CLIENTE' ? 'Mis Pagos' : 'Finanzas'}</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer" onSelect={() => router.push(`${panelBase}/perfil`)}><Settings className="mr-2.5 h-4 w-4" />Perfil</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-red-600 focus:text-red-600" onSelect={handleLogout}><LogOut className="mr-2.5 h-4 w-4" />{t('dash.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50">{t('nav.login')}</Link>
                <Link href="/register" className="btn-primary px-5 py-2 text-sm">{t('nav.register')}</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t md:hidden animate-in">
            <div className="container-page py-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive(link.href) ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-3 border-t mt-3 flex gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 py-2.5 text-sm text-center">{t('nav.login')}</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 py-2.5 text-sm text-center">{t('nav.register')}</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 mt-16">
        <div className="container-page">
          <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold tracking-tight">Agro<span className="text-primary">turismo</span></span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Turismo rural y sostenible en Panamá. Conectamos viajeros con experiencias auténticas en la naturaleza.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
              ))}
            </div>
            <div className="text-xs text-muted-foreground/60 pt-4 border-t border-border/50 w-full">
              &copy; {new Date().getFullYear()} Agroturismo Panamá. {t('home.footer.rights')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
