"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth.store';
import { hospedajesService } from '@/services/hospedajes.service';
import { actividadesService } from '@/services/actividades.service';
import { applyMargin } from '@/lib/margins';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TreePine,
  Mountain,
  Home,
  MapPin,
  Star,
  ArrowRight,
  Leaf,
  Sun,
  Users,
  User,
  LogOut,
  Calendar,
  CreditCard,
  Settings,
} from 'lucide-react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api/v1', '');

const tipoIcons: Record<string, any> = {
  AVENTURA: Mountain, GASTRONOMICA: Sun, NATURALEZA: TreePine, CULTURAL: Users,
  DEPORTIVA: Mountain, EDUCATIVA: TreePine,
};

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const API_URL_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api/v1', '');
  const initials = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : "";
  const handleLogout = () => { logout(); router.push("/"); };
  const rolePanelMap: Record<string, string> = { ADMIN: "/admin", PROVEEDOR: "/proveedor", AGENCIA: "/agencia", OPERADOR: "/operador", CLIENTE: "/cliente" };
  const panelBase = user ? (rolePanelMap[user.role] || "/cliente") : "/cliente";

  const { data: hospData } = useQuery({ queryKey: ["home", "hospedajes"], queryFn: () => hospedajesService.getAll({ limit: 3 }) });
  const { data: actData } = useQuery({ queryKey: ["home", "actividades"], queryFn: () => actividadesService.getAll({ limit: 4 }) });

  const hospedajes = ((hospData as any)?.data || []).filter((h: any) => h.activo).slice(0, 3);
  const actividades = ((actData as any)?.data || []).filter((a: any) => a.activo).slice(0, 4);

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 transition-colors group-hover:bg-white/25">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Agro<span className="text-green-400">turismo</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {[
              { href: "/hospedajes", label: t('nav.hospedajes') },
              { href: "/actividades", label: t('nav.actividades') },
              { href: "/transfers", label: t('nav.transfers') },
              { href: "/vehiculos", label: t('nav.vehiculos') },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/70 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2.5 rounded-full pl-1.5 pr-3 h-10 hover:bg-white/10">
                    <Avatar className="h-7 w-7 ring-2 ring-white/30">
                      {user.avatar ? (
                        <img src={`${API_URL_BASE}${user.avatar}`} alt="" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-white/20 text-white text-[10px] font-bold">{initials}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="hidden text-sm font-medium text-white sm:inline-block">{user.nombre}</span>
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
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-red-600" onSelect={handleLogout}><LogOut className="mr-2.5 h-4 w-4" />{t('dash.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white hover:bg-white/10">{t('nav.login')}</Link>
                <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:-translate-y-0.5">{t('nav.register')}</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-bg.jpg" alt="Paisaje rural de Panamá" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50" />
        </div>
        <div className="container-page relative z-10 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm font-medium text-white">
              <Leaf className="h-4 w-4" />
              {t('home.badge')}
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-lg">
              {t('home.title1')}{' '}
              <span className="text-green-400">{t('home.title2')}</span>{' '}
              {t('home.title3')}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/85 sm:text-xl drop-shadow">
              {t('home.subtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/hospedajes" className="btn-primary px-8 py-3 text-base">
                {t('home.explore')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/actividades" className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 backdrop-blur-sm px-8 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-white/20">
                {t('home.activities')}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-3 gap-8">
            {[
              { value: '150+', label: t('home.stat1') },
              { value: '200+', label: t('home.stat2') },
              { value: '10K+', label: t('home.stat3') },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-green-400 sm:text-4xl drop-shadow">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hospedajes */}
      <section className="py-20">
        <div className="container-page">
          <div className="text-center">
            <h2 className="section-heading">{t('home.featured')}</h2>
            <p className="mt-4 section-subheading">
              {t('home.featured.sub')}
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {hospedajes.map((h: any) => {
              const img = h.imagenPrincipal || h.imagenes?.[0];
              const tarifa = h.tarifas?.[0] || h.habitaciones?.[0]?.tarifas?.[0];
              const precioBase = tarifa ? parseFloat(tarifa.precioNoche) : 0;
              const precioCliente = precioBase > 0 ? applyMargin(precioBase, 'hospedajes') : 0;
              return (
                <Link key={h.id} href={`/hospedajes/${h.id}`} className="card-base group overflow-hidden transition-shadow hover:shadow-md">
                  <div className="aspect-[4/3] bg-muted">
                    {img ? (
                      <img src={`${API_URL}${img}`} alt={h.nombre} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/30">
                        <Home className="h-12 w-12 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold group-hover:text-primary">{h.nombre}</h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />{h.distrito}, {h.provincia}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{h.descripcion}</p>
                    <div className="mt-4 flex items-center justify-between">
                      {precioCliente > 0 ? (
                        <span className="text-lg font-bold text-primary">
                          ${precioCliente.toFixed(0)}
                          <span className="text-sm font-normal text-muted-foreground">{t('home.pernight')}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{t('home.viewdetails')}</span>
                      )}
                      <span className="text-sm font-medium text-primary group-hover:underline">{t('home.viewdetails')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link href="/hospedajes" className="btn-outline">
              {t('home.viewall')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="bg-muted/50 py-20">
        <div className="container-page">
          <div className="text-center">
            <h2 className="section-heading">{t('home.activities.title')}</h2>
            <p className="mt-4 section-subheading">
              {t('home.activities.sub')}
              
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {actividades.map((a: any) => {
              const Icon = tipoIcons[a.tipo] || Mountain;
              const precioBase = 45;
              const precioCliente = applyMargin(precioBase, 'actividades');
              return (
                <Link key={a.id} href={`/actividades/${a.id}`} className="card-base group p-6 text-center transition-shadow hover:shadow-md">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold group-hover:text-primary">{a.nombre}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.tipo} &middot; {a.duracionHoras}h</p>
                  <p className="mt-3 text-lg font-bold text-primary">{t('home.from')} ${precioCliente.toFixed(0)}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link href="/actividades" className="btn-outline">
              {t('home.exploreact')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Agroturismo */}
      <section className="py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="section-heading">
              {t('home.why.title')}
            </h2>
            <p className="mt-4 section-subheading">
              {t('home.why.sub')}
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Leaf,
                title: 'Turismo Sostenible',
                description:
                  'Apoyamos comunidades locales y prácticas ecológicas que preservan el medio ambiente.',
              },
              {
                icon: Home,
                title: 'Alojamiento Auténtico',
                description:
                  'Vive la experiencia real del campo panameño en fincas y cabañas seleccionadas.',
              },
              {
                icon: Mountain,
                title: 'Aventura Natural',
                description:
                  'Senderos, cascadas, avistamiento de aves y la biodiversidad única de Panamá.',
              },
              {
                icon: Users,
                title: 'Cultura Local',
                description:
                  'Conecta con las tradiciones, la gastronomía y la calidez de la gente del campo.',
              },
              {
                icon: Star,
                title: 'Calidad Garantizada',
                description:
                  'Todos nuestros proveedores son verificados y evaluados por viajeros reales.',
              },
              {
                icon: MapPin,
                title: 'Todo Panamá',
                description:
                  'Desde las tierras altas de Chiriqui hasta las costas de Bocas del Toro.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex gap-4 rounded-lg p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t('home.cta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
            
            {t('home.cta.sub')}
            
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-base font-medium text-primary shadow-sm transition-colors hover:bg-white/90"
            >
              {t('home.cta.button')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-primary-foreground/30 px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              {t('home.cta.login')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container-page">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Agroturismo Panamá</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                La plataforma líder de turismo rural y sostenible en Panamá.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">{t('home.footer.explore')}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/hospedajes" className="hover:text-foreground">{t('nav.hospedajes')}</Link></li>
                <li><Link href="/actividades" className="hover:text-foreground">{t('nav.actividades')}</Link></li>
                <li><Link href="/transfers" className="hover:text-foreground">{t('nav.transfers')}</Link></li>
                <li><Link href="/vehiculos" className="hover:text-foreground">{t('nav.vehiculos')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{t('home.footer.company')}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">{t('home.footer.about')}</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">{t('home.footer.contact')}</Link></li>
                <li><Link href="/proveedores" className="hover:text-foreground">{t('home.footer.provider')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{t('home.footer.legal')}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">{t('home.footer.privacy')}</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">{t('home.footer.terms')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Agroturismo Panamá. {t('home.footer.rights')}
          </div>
        </div>
      </footer>
    </main>
  );
}
