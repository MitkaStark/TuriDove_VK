# TuriDove Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el proyecto Agroturismo Panamá en TuriDove — agencia de viajes boutique internacional con design system premium, módulo Paquetes nuevo, integración Stripe Checkout y seed con destinos internacionales.

**Architecture:** Se conserva el stack (Next.js 15, NestJS 10, Prisma 5, PostgreSQL 18, Docker). Se reemplaza la capa visual completa (paleta navy/gold/cream + Playfair/DM Sans), se renombra branding global (Agroturismo → TuriDove), se agrega un módulo de negocio (Paquetes), se reemplaza el modal de pago simulado por Stripe Checkout hosteado + webhooks, y se regenera el seed con 6 destinos internacionales (París, Roma, Tokio, NY, Santorini, Marrakech).

**Tech Stack:** Next.js 15 (App Router), TypeScript, TailwindCSS 3, Shadcn/UI, NestJS 10, Prisma 5, PostgreSQL 18, Stripe SDK (`stripe` + `@stripe/stripe-js`), Lucide React, Playfair Display + DM Sans (Google Fonts).

**Spec:** [docs/superpowers/specs/2026-05-24-turidove-rebranding-design.md](../specs/2026-05-24-turidove-rebranding-design.md)

---

## Convenciones del plan

- **Verificación, no TDD estricto.** El proyecto no tiene infraestructura de tests previa. Cada tarea termina con un check de verificación (compilación TypeScript, build de Next/Nest, smoke test manual del flujo en el navegador, o test unitario con Jest puntual donde aplique). Donde hay lógica testeable nueva (cálculo de precio de paquete, verificación de firma de Stripe), se escriben tests unitarios.
- **Comandos PowerShell.** El entorno primario es Windows. Los comandos están escritos en PowerShell. Donde aplica `&&` se usa `; if ($?) { ... }`.
- **Working directory:** todos los paths son relativos a `c:\ServBay\www\TuriDove_VK\`.
- **Docker arriba.** La mayoría de las verificaciones asumen `docker compose --env-file .env.docker up -d` corriendo. Si los servicios no levantan, primero arreglar eso.
- **Commits frecuentes.** Cada tarea termina en commit. Mensajes en español, formato convencional (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- **Sin push automático.** El plan nunca empuja a remoto. Eso es decisión del usuario al final.

---

## Estructura de archivos

### Archivos NUEVOS

**Frontend — config / globals:**
- `frontend/src/app/globals.css` — REESCRITO con la nueva paleta y reglas base
- `frontend/tailwind.config.ts` — REESCRITO con paleta navy/gold/cream + sombras card + radios + fuentes
- `frontend/src/lib/format-price.ts` — helper de formateo USD
- `frontend/src/lib/site-config.ts` — constantes de marca (nombre, URLs, redes, destinos)

**Frontend — chrome global:**
- `frontend/src/components/layout/logo.tsx` — triángulo dorado doble + kicker + wordmark
- `frontend/src/components/layout/header.tsx` — header público nuevo
- `frontend/src/components/layout/footer.tsx` — footer nuevo
- `frontend/src/components/layout/user-dropdown.tsx` — dropdown autenticado del header
- `frontend/src/components/layout/mobile-menu.tsx` — menú hamburger animado
- `frontend/src/components/layout/public-layout.tsx` — wrapper que incluye header + footer

**Frontend — home:**
- `frontend/src/components/home/hero-section.tsx`
- `frontend/src/components/home/search-widget.tsx` — card con 4 tabs
- `frontend/src/components/home/why-choose-section.tsx`
- `frontend/src/components/home/services-section.tsx`
- `frontend/src/components/home/featured-packages.tsx`
- `frontend/src/components/home/featured-activities.tsx`
- `frontend/src/components/home/available-vehicles.tsx`
- `frontend/src/components/home/popular-destinations.tsx`
- `frontend/src/components/home/welcome-banner.tsx`
- `frontend/src/components/home/testimonials.tsx`
- `frontend/src/components/home/section-skeleton.tsx` — loading state reusable

**Frontend — paquetes:**
- `frontend/src/app/(public)/paquetes/page.tsx`
- `frontend/src/app/(public)/paquetes/[slug]/page.tsx`
- `frontend/src/app/admin/paquetes/page.tsx`
- `frontend/src/app/admin/paquetes/nuevo/page.tsx`
- `frontend/src/app/admin/paquetes/[id]/page.tsx`
- `frontend/src/app/proveedor/paquetes/page.tsx`
- `frontend/src/app/proveedor/paquetes/nuevo/page.tsx`
- `frontend/src/app/proveedor/paquetes/[id]/page.tsx`
- `frontend/src/app/agencia/paquetes/page.tsx`
- `frontend/src/app/agencia/paquetes/nuevo/page.tsx`
- `frontend/src/app/agencia/paquetes/[id]/page.tsx`
- `frontend/src/components/paquetes/paquete-card.tsx`
- `frontend/src/components/paquetes/paquete-form.tsx`
- `frontend/src/components/paquetes/paquete-summary.tsx` — sticky de detalle
- `frontend/src/services/paquetes.service.ts`
- `frontend/src/types/paquete.ts`

**Frontend — Stripe:**
- `frontend/src/app/(public)/reservas/[id]/pago/exito/page.tsx`
- `frontend/src/app/(public)/reservas/[id]/pago/cancelado/page.tsx`
- `frontend/src/components/shared/checkout-summary.tsx` — reemplaza payment-modal
- `frontend/src/services/stripe.service.ts` — wrapper de llamadas al backend
- `frontend/src/lib/stripe-public.ts` — constante opcional para futuro Elements

**Backend — paquetes:**
- `backend/src/modules/paquetes/paquetes.module.ts`
- `backend/src/modules/paquetes/paquetes.controller.ts`
- `backend/src/modules/paquetes/paquetes.service.ts`
- `backend/src/modules/paquetes/dto/create-paquete.dto.ts`
- `backend/src/modules/paquetes/dto/update-paquete.dto.ts`
- `backend/src/modules/paquetes/dto/query-paquete.dto.ts`
- `backend/src/modules/paquetes/dto/precio-paquete.dto.ts`
- `backend/src/modules/paquetes/paquetes.service.spec.ts` — test del cálculo de precio

**Backend — Stripe:**
- `backend/src/modules/stripe/stripe.module.ts`
- `backend/src/modules/stripe/stripe.service.ts`
- `backend/src/modules/stripe/stripe.controller.ts` — endpoint webhook
- `backend/src/modules/stripe/dto/checkout-session.dto.ts`
- `backend/src/modules/stripe/stripe.service.spec.ts` — test de cálculo de amounts en centavos
- `backend/src/common/raw-body.middleware.ts` — preserva body raw para verificación de firma

**Backend — seed:**
- `backend/prisma/seed-turidove.ts` — reemplaza el seeder
- `backend/prisma/seed-images.ts` — script de descarga de imágenes desde Unsplash/Pexels

### Archivos MODIFICADOS

**Frontend:**
- `frontend/src/app/layout.tsx` — fuentes Playfair + DM Sans, metadata SEO
- `frontend/src/app/page.tsx` — armado del home con las 10 secciones (server component)
- `frontend/package.json` — name + nuevas deps (`lucide-react`, `@stripe/stripe-js`)
- `frontend/src/lib/translations.ts` — strings ES/EN nuevos
- `frontend/src/lib/utils.ts` — adaptaciones menores si las hay
- `frontend/src/store/auth.store.ts` — solo si hay strings con marca
- `frontend/src/components/shared/data-table.tsx` — repintado
- `frontend/src/components/shared/page-header.tsx` — repintado
- `frontend/src/components/shared/payment-modal.tsx` — ELIMINADO (lo reemplaza checkout-summary)
- `frontend/src/components/shared/dashboard-layout.tsx` — repintado (layout admin)
- `frontend/src/components/shared/sidebar-nav.tsx` — repintado (sidebar admin con kicker + acento dorado)
- `frontend/src/components/shared/stat-card.tsx` — repintado
- `frontend/src/components/shared/loading-spinner.tsx` — repintado
- `frontend/src/components/shared/confirm-dialog.tsx` — repintado
- `frontend/src/components/shared/form-field.tsx` — repintado
- `frontend/src/components/shared/role-badge.tsx` — repintado
- `frontend/src/services/pagos.service.ts` — nuevos métodos Stripe (checkout, reembolso vía Stripe)
- `frontend/src/services/reservas.service.ts` — adapta el flujo: crea reserva PENDIENTE y pide URL de checkout
- Todas las páginas de listados públicos (`/hospedajes`, `/actividades`, etc.) — etiqueta "Hoteles" en hospedajes + repintado
- Páginas de paneles (admin, proveedor, agencia, operador, cliente) — etiquetas y repintado

**Backend:**
- `backend/prisma/schema.prisma` — agrega modelo `Paquete`, campos Stripe en `Pago`, `paqueteId` opcional en `Reserva`, campo `isFeatured` en `Hospedaje/Actividad/Vehiculo/Transfer`, extensión enum `MetodoPago` (queda solo `STRIPE`), campo `margenPaquetes` en `Configuracion` (si existe esa tabla)
- `backend/prisma/migrations/<timestamp>_turidove_changes/migration.sql` — generado
- `backend/src/app.module.ts` — registra `PaquetesModule` + `StripeModule`
- `backend/src/main.ts` — config raw body para webhook, title de Swagger, CORS si hay strings con marca
- `backend/src/modules/hospedajes/hospedajes.controller.ts` — query `featured`
- `backend/src/modules/hospedajes/hospedajes.service.ts` — filtro por `isFeatured`
- `backend/src/modules/actividades/actividades.controller.ts` — query `featured`
- `backend/src/modules/actividades/actividades.service.ts` — filtro
- `backend/src/modules/vehiculos/vehiculos.controller.ts` — query `featured` (si aplica)
- `backend/src/modules/vehiculos/vehiculos.service.ts` — filtro
- `backend/src/modules/transfers/transfers.controller.ts` — query `featured` (si aplica)
- `backend/src/modules/transfers/transfers.service.ts` — filtro
- `backend/src/modules/reservas/reservas.service.ts` — soporta tipo `PAQUETE`, integra Stripe (crea checkout session)
- `backend/src/modules/pagos/pagos.service.ts` — métodos para crear session, manejar webhook events, reembolsar via Stripe
- `backend/src/modules/pagos/pagos.controller.ts` — endpoints `POST /checkout`, `POST /:id/reembolso`
- `backend/package.json` — agrega `stripe`
- `backend/prisma/seed.ts` — borrado o convertido en archivo legacy

**Raíz / Docker:**
- `README.md` — todo el contenido reescrito para TuriDove
- `DEPLOYMENT.md` — referencias actualizadas
- `DOCKER.md` — referencias actualizadas
- `CONTEXT.md` — agregar fase de transformación
- `docker-compose.yml` — `container_name`, `POSTGRES_DB`
- `.env.docker` — variables actualizadas
- `.env.docker.example` — plantilla con Stripe envs
- `setup.ps1` / `setup.sh` — mensajes
- `docker/postgres/init/01-dump.sql` — regenerado al final

---

## Fase 1 — Cimientos visuales

Esta fase establece la base visual del sistema. Sin esto, todo lo demás se vería mezclado con la paleta vieja.

### Tarea 1.1: Instalar dependencias frontend nuevas

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Verificar versión actual de Node y npm**

```powershell
node --version
npm --version
```
Expected: Node 18+ y npm presente.

- [ ] **Step 2: Instalar Lucide React (iconografía nueva)**

```powershell
cd frontend
npm install lucide-react --legacy-peer-deps
```
Expected: paquete instalado, sin errores fatales.

- [ ] **Step 3: Verificar que el build sigue funcionando**

```powershell
npm run build
```
Expected: build exitoso. Si falla por razones preexistentes (errores TS no críticos), continuar — el proyecto tiene `ignoreBuildErrors: true`.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): instalar lucide-react para iconografia TuriDove"
```

### Tarea 1.2: Reemplazar `tailwind.config.ts` con paleta TuriDove

**Files:**
- Modify: `frontend/tailwind.config.ts`

- [ ] **Step 1: Reescribir el config completo**

Reemplazar `frontend/tailwind.config.ts` con:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Shadcn tokens (heredan de variables CSS, ahora apuntando a navy/gold/cream)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Paleta TuriDove
        navy: {
          50: '#EDF1F7',
          100: '#D1DAE8',
          200: '#A3B5D1',
          300: '#7590BA',
          400: '#4A6FA3',
          500: '#2B5592',
          600: '#1A365D',
          700: '#152C4D',
          800: '#10213A',
          900: '#0B1627',
        },
        gold: {
          50: '#FDF9EF',
          100: '#F9F0D9',
          200: '#F0DEB0',
          300: '#E7CB87',
          400: '#D4A853',
          500: '#C49A3D',
          600: '#A67F2E',
          700: '#886524',
          800: '#6A4E1B',
          900: '#4C3712',
        },
        cream: {
          DEFAULT: '#FEFBF4',
          100: '#FDF8ED',
          200: '#FAF2DE',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 4px 20px rgba(26, 54, 93, 0.08)',
        'card-hover': '0 8px 30px rgba(26, 54, 93, 0.12)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Compilar y verificar que no haya errores TS**

```powershell
cd frontend
npx tsc --noEmit
```
Expected: 0 errores en `tailwind.config.ts`. (Pueden haber errores preexistentes en otros archivos — ignorar.)

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend/tailwind.config.ts
git commit -m "feat(frontend): paleta navy/gold/cream y sombras card en tailwind config"
```

### Tarea 1.3: Reescribir `globals.css` con variables CSS y reglas base

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Reemplazar contenido completo de globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* TuriDove - Navy / Gold / Cream */
    /* Background = cream */
    --background: 41 76% 98%;
    --foreground: 213 56% 23%;

    --card: 0 0% 100%;
    --card-foreground: 213 56% 23%;

    --popover: 0 0% 100%;
    --popover-foreground: 213 56% 23%;

    /* primary = navy-600 */
    --primary: 213 56% 23%;
    --primary-foreground: 0 0% 100%;

    /* secondary = navy-50 */
    --secondary: 217 38% 95%;
    --secondary-foreground: 213 56% 23%;

    --muted: 217 38% 95%;
    --muted-foreground: 215 38% 47%;

    /* accent = gold-50 */
    --accent: 45 70% 97%;
    --accent-foreground: 213 56% 23%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 98%;

    /* border = navy-100 */
    --border: 217 38% 86%;
    --input: 217 38% 86%;
    /* ring = gold-400 */
    --ring: 39 60% 58%;

    --radius: 0.75rem;
  }

  .dark {
    --background: 213 56% 7%;
    --foreground: 41 50% 96%;
    --card: 213 56% 10%;
    --card-foreground: 41 50% 96%;
    --popover: 213 56% 10%;
    --popover-foreground: 41 50% 96%;
    --primary: 39 60% 58%;
    --primary-foreground: 213 56% 7%;
    --secondary: 213 35% 18%;
    --secondary-foreground: 41 50% 96%;
    --muted: 213 35% 18%;
    --muted-foreground: 215 20% 70%;
    --accent: 213 35% 18%;
    --accent-foreground: 41 50% 96%;
    --destructive: 0 62% 45%;
    --destructive-foreground: 0 0% 98%;
    --border: 213 35% 22%;
    --input: 213 35% 22%;
    --ring: 39 60% 58%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    @apply font-body bg-cream text-navy-600 antialiased;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display text-navy-800;
  }

  ::selection {
    @apply bg-gold-200 text-navy-800;
  }
}
```

- [ ] **Step 2: Verificar build de Next**

```powershell
cd frontend
npm run build
```
Expected: build pasa. Si hay warnings de clases Tailwind no encontradas, anotarlos — la fase 3+ los resuelve cuando se reescriben los componentes que las usan.

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend/src/app/globals.css
git commit -m "feat(frontend): globals.css con variables HSL para navy/gold/cream"
```

### Tarea 1.4: Cargar Playfair Display + DM Sans en `layout.tsx`

**Files:**
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Reemplazar las fuentes**

Reemplazar el contenido relevante de `frontend/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TuriDove — Viajes boutique, hoteles, actividades y paquetes',
    template: '%s | TuriDove',
  },
  description:
    'Reserva hoteles boutique, actividades únicas, vehículos y paquetes de viaje internacionales. Experiencias curadas con atención personalizada.',
  keywords: [
    'turismo',
    'hoteles',
    'paquetes turísticos',
    'actividades',
    'vehículos',
    'viajes boutique',
  ],
  authors: [{ name: 'TuriDove' }],
  openGraph: {
    type: 'website',
    locale: 'es',
    siteName: 'TuriDove',
    title: 'TuriDove — Tu agencia de viajes boutique',
    description:
      'Hoteles, actividades, vehículos y paquetes de viaje internacionales.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Probar en dev que las fuentes cargan**

```powershell
cd frontend
npm run dev
```
Abrir http://localhost:3000 en el navegador. Inspector → verificar que `body` tenga `font-family: "DM Sans", ...` y que `h1..h6` muestren `"Playfair Display", ...`.

- [ ] **Step 3: Detener dev server (Ctrl+C) y commit**

```powershell
cd ..
git add frontend/src/app/layout.tsx
git commit -m "feat(frontend): cargar Playfair Display y DM Sans, metadata TuriDove"
```

### Tarea 1.5: Helper `format-price.ts` para USD

**Files:**
- Create: `frontend/src/lib/format-price.ts`

- [ ] **Step 1: Crear el helper**

```ts
export function formatPrice(amount: number | string, options?: { currency?: string; locale?: string }): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return '$0';

  return new Intl.NumberFormat(options?.locale ?? 'en-US', {
    style: 'currency',
    currency: options?.currency ?? 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPriceWithCents(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
```

- [ ] **Step 2: Verificar compilación**

```powershell
cd frontend
npx tsc --noEmit src/lib/format-price.ts
```
Expected: sin errores en este archivo.

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend/src/lib/format-price.ts
git commit -m "feat(frontend): helper formatPrice para USD"
```

### Tarea 1.6: Constantes de marca en `site-config.ts`

**Files:**
- Create: `frontend/src/lib/site-config.ts`

- [ ] **Step 1: Crear el archivo**

```ts
export const SITE_CONFIG = {
  name: 'TuriDove',
  kicker: 'VIAJES',
  description: 'Viajes boutique con destinos únicos',
  url: 'https://turidove.com',
  email: 'contacto@turidove.com',
  social: {
    facebook: '#',
    instagram: '#',
    twitter: '#',
    youtube: '#',
  },
  legal: {
    about: '#',
    terms: '#',
    privacy: '#',
    contact: '#contacto',
  },
  destinations: [
    { name: 'París', label: 'Capital', slug: 'paris', city: 'Paris' },
    { name: 'Roma', label: 'Histórica', slug: 'roma', city: 'Roma' },
    { name: 'Tokio', label: 'Asia', slug: 'tokio', city: 'Tokio' },
    { name: 'Nueva York', label: 'Urbana', slug: 'nueva-york', city: 'Nueva York' },
    { name: 'Santorini', label: 'Isla', slug: 'santorini', city: 'Santorini' },
    { name: 'Marrakech', label: 'Boutique', slug: 'marrakech', city: 'Marrakech' },
  ],
  footerDestinations: ['París', 'Roma', 'Tokio', 'Nueva York'],
} as const;

export type Destination = (typeof SITE_CONFIG.destinations)[number];
```

- [ ] **Step 2: Verificar TS**

```powershell
cd frontend
npx tsc --noEmit src/lib/site-config.ts
```
Expected: sin errores.

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend/src/lib/site-config.ts
git commit -m "feat(frontend): site-config con marca, destinos y redes"
```

### Tarea 1.7: Smoke test global de la Fase 1

- [ ] **Step 1: Build completo**

```powershell
cd frontend
npm run build
```
Expected: build pasa.

- [ ] **Step 2: Levantar dev y verificar render**

```powershell
npm run dev
```
Abrir http://localhost:3000. La página aún se ve "fea" (con componentes viejos sobre paleta nueva). Verificar:
- Fondo del body es cream (`#FEFBF4` aproximado).
- Headings si los hay se ven Playfair.
- Cuerpo en DM Sans.
- No hay errores fatales en la consola del browser ni del servidor.

- [ ] **Step 3: Detener y dejar Fase 1 cerrada**

Ctrl+C. No hay commit aquí, solo verificación.

---

## Fase 2 — Rebrand global

Reemplaza textos, env vars, contenedores Docker, y metadata. Después de esta fase, no debe quedar la palabra "Agroturismo" en el código ni en la UI (excepto en historial git y en `CONTEXT.md` como referencia histórica).

### Tarea 2.1: Renombrar contenedores y BD en docker-compose

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.docker.example`
- Modify: `.env.docker`

- [ ] **Step 1: Leer docker-compose.yml actual**

```powershell
Get-Content docker-compose.yml
```

- [ ] **Step 2: Editar docker-compose.yml**

Reemplazar todas las ocurrencias de:
- `agroturismo-postgres` → `turidove-postgres`
- `agroturismo-backend` → `turidove-backend`
- `agroturismo-frontend` → `turidove-frontend`
- `agroturismo` (como nombre de DB / red) → `turidove`

Si hay un bloque `networks:` con nombre `agroturismo_net` o similar, renombrarlo a `turidove_net`.

- [ ] **Step 3: Editar `.env.docker.example`**

Cambiar:
```env
POSTGRES_DB=agroturismo
```
por
```env
POSTGRES_DB=turidove
```

Agregar al final del archivo (placeholders):
```env

# Stripe (modo test por defecto - reemplazar en produccion)
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_PUBLIC_KEY=pk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_CURRENCY=usd
STRIPE_SUCCESS_URL=http://localhost:3000/reservas/{RESERVA_ID}/pago/exito
STRIPE_CANCEL_URL=http://localhost:3000/reservas/{RESERVA_ID}/pago/cancelado
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_REPLACE_ME
```

- [ ] **Step 4: Editar `.env.docker`**

Mismo cambio de `POSTGRES_DB` y agregar los mismos envs de Stripe (con valores test reales del usuario o placeholders `sk_test_REPLACE_ME`).

- [ ] **Step 5: Bajar contenedores actuales con volumen viejo**

```powershell
docker compose --env-file .env.docker down -v
```
Expected: contenedores eliminados, volumen viejo borrado.

- [ ] **Step 6: Levantar nuevos contenedores**

```powershell
docker compose --env-file .env.docker up -d
```
Expected: 3 contenedores con nombres `turidove-*`. La DB se inicializa con el dump seed actual (todavía Agroturismo).

- [ ] **Step 7: Verificar**

```powershell
docker compose --env-file .env.docker ps
```
Expected: 3 servicios `Up`.

- [ ] **Step 8: Commit**

```powershell
git add docker-compose.yml .env.docker.example .env.docker
git commit -m "chore(docker): renombrar contenedores y DB de agroturismo a turidove"
```

### Tarea 2.2: Renombrar `name` en package.json del backend y frontend

**Files:**
- Modify: `backend/package.json`
- Modify: `frontend/package.json`

- [ ] **Step 1: Cambiar `name` en backend/package.json**

```json
"name": "turidove-backend",
```

- [ ] **Step 2: Cambiar `name` en frontend/package.json**

```json
"name": "turidove-frontend",
```

- [ ] **Step 3: Commit**

```powershell
git add backend/package.json frontend/package.json
git commit -m "chore: renombrar package.json a turidove-backend y turidove-frontend"
```

### Tarea 2.3: Actualizar metadata SEO en layout.tsx

Esto ya se hizo en Tarea 1.4. Verificar que el cambio sigue en pie.

- [ ] **Step 1: Verificar contenido de `frontend/src/app/layout.tsx`**

```powershell
Select-String -Path frontend/src/app/layout.tsx -Pattern "TuriDove"
```
Expected: al menos 3 matches (title default, template, siteName).

Si por alguna razón se revirtió, reaplicar Tarea 1.4 Step 1.

- [ ] **Step 2: No-op si todo está bien**

No requiere commit.

### Tarea 2.4: Buscar y reemplazar "Agroturismo" en strings i18n

**Files:**
- Modify: `frontend/src/lib/translations.ts`

- [ ] **Step 1: Leer el archivo de traducciones**

```powershell
Get-Content frontend/src/lib/translations.ts | Select-Object -First 50
```

- [ ] **Step 2: Localizar todas las apariciones de "Agroturismo", "agroturismo", "Panamá rural", "rural panameño"**

```powershell
Select-String -Path frontend/src/lib/translations.ts -Pattern "Agroturismo|agroturismo|Panam|rural" -CaseSensitive:$false
```

- [ ] **Step 3: Reemplazar manualmente**

Reemplazar caso por caso (no usar replace masivo porque algunos textos requieren reescritura semántica, no solo substitución):
- `"Agroturismo Panamá"` → `"TuriDove"`
- `"Bienvenido a Agroturismo Panamá"` → `"Bienvenido a TuriDove"`
- `"Turismo rural y sostenible"` → `"Viajes boutique con destinos únicos"`
- Cualquier mención a "Panamá" en copy de marca → eliminar o reemplazar por "destinos internacionales".
- Mantener la referencia geográfica si el string describe una región específica que tiene sentido (ej. "Hospedajes en Panamá" en un filtro de ciudad — eso se queda).

- [ ] **Step 4: Verificar TS**

```powershell
cd frontend
npx tsc --noEmit src/lib/translations.ts
```
Expected: sin errores.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend/src/lib/translations.ts
git commit -m "refactor(i18n): reemplazar referencias a Agroturismo por TuriDove en traducciones"
```

### Tarea 2.5: Renombrar título de Swagger en backend main.ts

**Files:**
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Leer el archivo**

```powershell
Get-Content backend/src/main.ts
```

- [ ] **Step 2: Reemplazar el título de Swagger**

Buscar el bloque `DocumentBuilder` y cambiar:
- `setTitle('Agroturismo Panamá API')` (o similar) → `setTitle('TuriDove API')`
- `setDescription(...)` con menciones a agroturismo → `setDescription('API de TuriDove — agencia de viajes boutique')`

- [ ] **Step 3: Rebuild del backend**

```powershell
docker compose --env-file .env.docker restart backend
docker compose --env-file .env.docker logs backend --tail 30
```
Expected: backend arranca sin errores. Verificar http://localhost:3001/api/docs muestra "TuriDove API" como título.

- [ ] **Step 4: Commit**

```powershell
git add backend/src/main.ts
git commit -m "chore(backend): renombrar Swagger a TuriDove API"
```

### Tarea 2.6: Actualizar README.md (introducción y secciones de marca)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Abrir README.md y reemplazar el bloque de encabezado**

Cambiar las primeras ~10 líneas:

```markdown
# 🌿 Agroturismo Panamá

Plataforma digital de turismo rural y sostenible que conecta proveedores de
servicios agroturísticos con viajeros que buscan experiencias auténticas en
el campo panameño.

**Proyecto dockerizado y listo para despliegue en producción.**
```

por:

```markdown
# TuriDove

Agencia de viajes boutique internacional. Reserva hoteles, actividades,
vehículos, transfers y paquetes turísticos en destinos curados alrededor
del mundo. Pago real con Stripe.

**Proyecto dockerizado y listo para despliegue en producción.**
```

- [ ] **Step 2: Reemplazos globales en el resto del README**

Buscar y reemplazar (revisión manual):
- `Agroturismo Panamá` → `TuriDove`
- `Agroturismo` → `TuriDove`
- `agroturismo` (en URLs, paths) → `turidove`
- `admin@agroturismo.pa` → `admin@turidove.com`
- Emails de proveedores seed → actualizar (Sección 4.6 del spec)
- Tabla de credenciales seed → actualizar con la lista del spec

- [ ] **Step 3: Actualizar tabla de roles si menciona "agroturístico"**

- [ ] **Step 4: Actualizar referencias a "hospedajes" en UI mention**

Solo en menciones a etiquetas de UI: cambiar "Hospedajes" por "Hoteles" en las secciones de descripción del frontend. Mantener "/hospedajes" para rutas API.

- [ ] **Step 5: Commit**

```powershell
git add README.md
git commit -m "docs: reescribir README para TuriDove"
```

### Tarea 2.7: Actualizar DOCKER.md y DEPLOYMENT.md

**Files:**
- Modify: `DOCKER.md`
- Modify: `DEPLOYMENT.md`

- [ ] **Step 1: Reemplazos en DOCKER.md**

```powershell
Select-String -Path DOCKER.md -Pattern "agroturismo|Agroturismo"
```
Editar cada match con el reemplazo apropiado.

- [ ] **Step 2: Reemplazos en DEPLOYMENT.md**

```powershell
Select-String -Path DEPLOYMENT.md -Pattern "agroturismo|Agroturismo"
```
Editar cada match.

- [ ] **Step 3: Commit**

```powershell
git add DOCKER.md DEPLOYMENT.md
git commit -m "docs: actualizar DOCKER.md y DEPLOYMENT.md con marca TuriDove"
```

### Tarea 2.8: Actualizar mensajes de setup.ps1 y setup.sh

**Files:**
- Modify: `setup.ps1`
- Modify: `setup.sh`

- [ ] **Step 1: Reemplazar strings de bienvenida y referencias a Agroturismo**

```powershell
Select-String -Path setup.ps1, setup.sh -Pattern "Agroturismo|agroturismo"
```
Editar cada uno con `TuriDove` / `turidove`.

- [ ] **Step 2: Commit**

```powershell
git add setup.ps1 setup.sh
git commit -m "chore: actualizar scripts de setup con marca TuriDove"
```

### Tarea 2.9: Verificación final Fase 2

- [ ] **Step 1: Buscar referencias residuales "agroturismo" en archivos de código**

```powershell
Select-String -Path frontend/src/**/*.ts*,backend/src/**/*.ts,*.md,*.yml,*.sh,*.ps1 -Pattern "agroturismo|Agroturismo" -CaseSensitive:$false 2>$null
```

Expected: solo aparece en `CONTEXT.md` (historial), `backend/prisma/migrations/` (snapshots SQL viejos, intocables), y `docker/postgres/init/01-dump.sql` (se regenera en Fase 8). Si aparece en otros lugares, decidir si reemplazar.

- [ ] **Step 2: Levantar y verificar que el sitio dice TuriDove en el title del navegador**

```powershell
docker compose --env-file .env.docker restart frontend
```
Abrir http://localhost:3000. Tab del navegador debe decir "TuriDove — Viajes boutique...". (La UI aún se ve vieja porque los componentes no se repintaron. Eso es Fase 3+.)

- [ ] **Step 3: Sin commit. Fin de Fase 2.**

---

## Fase 3 — Chrome global

Reemplaza header, footer, y reestiliza páginas de auth. Después de esta fase el "marco" visible del sitio se ve TuriDove en todas las rutas, aunque el contenido interior siga viejo.

### Tarea 3.1: Crear componente `Logo`

**Files:**
- Create: `frontend/src/components/layout/logo.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
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
```

- [ ] **Step 2: Verificar TS**

```powershell
cd frontend; npx tsc --noEmit; cd ..
```
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/layout/logo.tsx
git commit -m "feat(layout): componente Logo con triangulo dorado doble y kicker"
```

### Tarea 3.2: Crear `UserDropdown`

**Files:**
- Create: `frontend/src/components/layout/user-dropdown.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
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
```

- [ ] **Step 2: Verificar TS**

```powershell
cd frontend; npx tsc --noEmit; cd ..
```
Si TypeScript se queja por `user.role` o `user.nombre`, ajustar a las propiedades reales del store (`useAuthStore` actual). Inspeccionar `frontend/src/store/auth.store.ts` y ajustar nombres.

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/layout/user-dropdown.tsx
git commit -m "feat(layout): UserDropdown con avatar dorado y menu por rol"
```

### Tarea 3.3: Crear `MobileMenu` (hamburger animado)

**Files:**
- Create: `frontend/src/components/layout/mobile-menu.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
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
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/layout/mobile-menu.tsx
git commit -m "feat(layout): MobileMenu con hamburger animado"
```

### Tarea 3.4: Crear `Header` público

**Files:**
- Create: `frontend/src/components/layout/header.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Logo } from './logo';
import { UserDropdown } from './user-dropdown';
import { MobileMenu } from './mobile-menu';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/hospedajes', label: 'Hoteles' },
  { href: '/paquetes', label: 'Paquetes' },
  { href: '/actividades', label: 'Actividades' },
  { href: '/#contacto', label: 'Contacto' },
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
```

- [ ] **Step 2: Verificar TS**

```powershell
cd frontend; npx tsc --noEmit; cd ..
```
Ajustar imports/propiedades si la store usa nombres diferentes.

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/layout/header.tsx
git commit -m "feat(layout): Header publico TuriDove con nav y CTAs"
```

### Tarea 3.5: Crear `Footer`

**Files:**
- Create: `frontend/src/components/layout/footer.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

const SERVICE_LINKS = [
  { href: '/hospedajes', label: 'Hoteles' },
  { href: '/paquetes', label: 'Paquetes' },
  { href: '/actividades', label: 'Actividades' },
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
    SITE_CONFIG.footerDestinations.includes(d.name),
  );

  return (
    <footer id="contacto" className="bg-navy-900 text-white">
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
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/layout/footer.tsx
git commit -m "feat(layout): Footer navy con marca, destinos, servicios y redes"
```

### Tarea 3.6: Crear `PublicLayout` wrapper

**Files:**
- Create: `frontend/src/components/layout/public-layout.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
import { Header } from './header';
import { Footer } from './footer';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/layout/public-layout.tsx
git commit -m "feat(layout): PublicLayout wrapper con Header + Footer"
```

### Tarea 3.7: Aplicar `PublicLayout` al layout del grupo `(public)`

**Files:**
- Modify: `frontend/src/app/(public)/layout.tsx` (crear si no existe)

- [ ] **Step 1: Verificar si existe**

```powershell
Test-Path frontend/src/app/(public)/layout.tsx
```

- [ ] **Step 2: Crear o reemplazar el archivo**

```tsx
import { PublicLayout } from '@/components/layout/public-layout';

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
```

- [ ] **Step 3: Eliminar headers/footers viejos que estuvieran embebidos en `page.tsx` o layouts internos**

Buscar y, si existen, eliminar imports/usos de cualquier header/footer viejo en:
- `frontend/src/app/(public)/page.tsx`
- `frontend/src/app/(public)/hospedajes/page.tsx`
- etc.

- [ ] **Step 4: Smoke test**

```powershell
docker compose --env-file .env.docker restart frontend
```
Abrir http://localhost:3000. Esperar el rebuild de Next. Verificar:
- Header con logo TuriDove, nav (Inicio/Hoteles/Paquetes/Actividades/Contacto), CTAs.
- Footer navy con 4 columnas y redes.
- El cuerpo (página vieja) en el medio (todavía sin rebrandear).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/app/(public)/layout.tsx frontend/src/app/(public)/page.tsx
git commit -m "feat(layout): aplicar PublicLayout al grupo (public)"
```

### Tarea 3.8: Repintar páginas de autenticación

**Files:**
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Modify: `frontend/src/app/(auth)/register/page.tsx`
- Modify: `frontend/src/app/(auth)/layout.tsx` (crear si no existe)

- [ ] **Step 1: Crear o reescribir `(auth)/layout.tsx`**

```tsx
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="h-16 flex items-center px-4 sm:px-6 lg:px-8 border-b border-navy-100/50 bg-white">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Leer login page actual**

```powershell
Get-Content frontend/src/app/(auth)/login/page.tsx
```

- [ ] **Step 3: Reescribir el JSX exterior de `login/page.tsx`**

Mantener la lógica de formulario (validación, submit, errores). Cambiar solo el wrapper y los estilos:

```tsx
// (al final del archivo, dentro del componente, reemplazar el JSX por:)
return (
  <div className="bg-white rounded-2xl shadow-sm border border-navy-100/50 p-8 max-w-md w-full">
    <h1 className="text-2xl font-display font-bold text-navy-800 text-center mb-2">
      Iniciar sesión
    </h1>
    <p className="text-sm text-navy-400 font-body text-center mb-8">
      Accede a tu cuenta de TuriDove
    </p>

    {/* form: mantener lógica, repintar inputs y botón */}
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </div>
      {/* Password */}
      <div>
        <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>

      <p className="text-center text-sm text-navy-400 font-body">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-gold-600 hover:text-gold-700 font-semibold transition-colors">
          Regístrate
        </Link>
      </p>
    </form>
  </div>
);
```

Adaptar nombres de variables (`email`, `password`, `handleSubmit`, `error`, `loading`) a los del componente actual.

- [ ] **Step 4: Reescribir el JSX exterior de `register/page.tsx`**

Análogo a login, con su lista de campos. Título "Crear cuenta", mismo card wrapper.

- [ ] **Step 5: Smoke test**

Abrir http://localhost:3000/login y http://localhost:3000/register en el navegador. Verificar:
- Header simple con logo arriba.
- Card centrada blanca con título Playfair.
- Inputs premium con focus dorado.
- Botón pill dorado.
- Login y registro funcionan (logueo con seed admin `admin@agroturismo.pa` / `Admin123!` por ahora — esto se actualiza en Fase 8).

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/app/(auth)/
git commit -m "feat(auth): repintar login y register con design system TuriDove"
```

### Tarea 3.9: Smoke test global Fase 3

- [ ] **Step 1: Verificar header/footer en todas las rutas públicas**

Abrir en el navegador:
- http://localhost:3000/ (home)
- http://localhost:3000/hospedajes
- http://localhost:3000/actividades

Esperado: header y footer TuriDove en las 3. (El contenido del medio sigue viejo.)

- [ ] **Step 2: Verificar autenticación**

- Loguear con `admin@agroturismo.pa` / `Admin123!`.
- Header debe mostrar avatar dorado en lugar de "Iniciar sesión / Registrarse".
- Click en avatar → dropdown con menú según rol.
- Cerrar sesión vuelve a estado no-autenticado.

- [ ] **Step 3: Fin de Fase 3. Sin commit.**

---

## Fase 4 — Home nuevo

Reescribe la home pública con las 10 secciones del spec. Después de esta fase, http://localhost:3000/ se ve TuriDove premium.

### Tarea 4.1: Agregar campo `isFeatured` al schema Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Editar `schema.prisma` agregando el campo en Hospedaje, Actividad, Vehiculo, Transfer**

En cada uno de los 4 modelos, agregar:

```prisma
  isFeatured Boolean @default(false) @map("is_featured")
```

Inmediatamente antes de la línea `createdAt`.

- [ ] **Step 2: Generar migración**

```powershell
docker compose --env-file .env.docker exec backend npx prisma migrate dev --name add_is_featured
```
Expected: nueva migración creada, BD actualizada, Prisma Client regenerado.

- [ ] **Step 3: Verificar que la migración funcionó**

```powershell
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "\d hospedajes" | Select-String "is_featured"
```
Expected: una línea con `is_featured | boolean`.

- [ ] **Step 4: Commit**

```powershell
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): agregar isFeatured a hospedajes, actividades, vehiculos, transfers"
```

### Tarea 4.2: Soporte de query `featured` en endpoints

**Files:**
- Modify: `backend/src/modules/hospedajes/hospedajes.controller.ts`
- Modify: `backend/src/modules/hospedajes/hospedajes.service.ts`
- Modify: `backend/src/modules/actividades/actividades.controller.ts`
- Modify: `backend/src/modules/actividades/actividades.service.ts`
- Modify: `backend/src/modules/vehiculos/vehiculos.controller.ts`
- Modify: `backend/src/modules/vehiculos/vehiculos.service.ts`
- Modify: `backend/src/modules/transfers/transfers.controller.ts`
- Modify: `backend/src/modules/transfers/transfers.service.ts`

- [ ] **Step 1: Leer un controller para entender el patrón**

```powershell
Get-Content backend/src/modules/hospedajes/hospedajes.controller.ts
```

- [ ] **Step 2: En cada controller, en el método `findAll` (o GET listado), aceptar `@Query('featured')`**

Patrón a aplicar (adaptar al estilo existente):

```ts
@Get()
findAll(
  @Query('search') search?: string,
  @Query('featured') featured?: string,
  @Query('limit') limit?: string,
  @Query('page') page?: string,
) {
  const isFeatured = featured === 'true' ? true : featured === 'false' ? false : undefined;
  return this.hospedajesService.findAll({
    search,
    isFeatured,
    limit: limit ? parseInt(limit, 10) : undefined,
    page: page ? parseInt(page, 10) : undefined,
  });
}
```

- [ ] **Step 3: En cada service, aceptar `isFeatured?: boolean` en el método `findAll`**

```ts
async findAll(params: { search?: string; isFeatured?: boolean; limit?: number; page?: number }) {
  const where: Prisma.HospedajeWhereInput = {};
  if (params.search) {
    where.OR = [
      { nombre: { contains: params.search, mode: 'insensitive' } },
      { ciudad: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;
  // ... resto
}
```

Repetir para actividades, vehiculos, transfers (solo necesitan `isFeatured` en el `where`, no romper signature).

- [ ] **Step 4: Rebuild backend**

```powershell
docker compose --env-file .env.docker restart backend
docker compose --env-file .env.docker logs backend --tail 20
```
Expected: arranca sin errores.

- [ ] **Step 5: Smoke test con curl**

```powershell
curl http://localhost:3001/api/v1/hospedajes?featured=true&limit=3
```
Expected: respuesta JSON con lista vacía o pocos items (no hay aún marcados como featured).

- [ ] **Step 6: Commit**

```powershell
git add backend/src/modules/
git commit -m "feat(api): soporte de query featured en hospedajes/actividades/vehiculos/transfers"
```

### Tarea 4.3: Servicio frontend para llamadas featured

**Files:**
- Modify: `frontend/src/services/hospedajes.service.ts`
- Modify: `frontend/src/services/actividades.service.ts`
- Modify: `frontend/src/services/vehiculos.service.ts`

- [ ] **Step 1: Agregar método `getFeatured` a cada servicio**

Ejemplo en `hospedajes.service.ts`:

```ts
export async function getFeaturedHospedajes(limit = 6) {
  const { data } = await api.get('/hospedajes', { params: { featured: 'true', limit } });
  return data?.items ?? data ?? [];
}
```

Análogo para `actividades.service.ts` (`getFeaturedActividades`) y `vehiculos.service.ts` (`getFeaturedVehiculos` o simplemente listado con `limit`).

- [ ] **Step 2: Verificar TS**

```powershell
cd frontend; npx tsc --noEmit; cd ..
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/services/
git commit -m "feat(api-client): helpers getFeatured en servicios frontend"
```

### Tarea 4.4: Componente `HeroSection` + `SearchWidget`

**Files:**
- Create: `frontend/src/components/home/hero-section.tsx`
- Create: `frontend/src/components/home/search-widget.tsx`

- [ ] **Step 1: Crear `search-widget.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'hoteles' | 'paquetes' | 'actividades' | 'vehiculos';

const TABS: { key: Tab; label: string }[] = [
  { key: 'hoteles', label: 'Hoteles' },
  { key: 'paquetes', label: 'Paquetes' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'vehiculos', label: 'Vehículos' },
];

export function SearchWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('hoteles');
  const [destino, setDestino] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const route = {
      hoteles: '/hospedajes',
      paquetes: '/paquetes',
      actividades: '/actividades',
      vehiculos: '/vehiculos',
    }[tab];
    const params = new URLSearchParams();
    if (destino) params.set('search', destino);
    router.push(`${route}?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl">
      <h2 className="font-display font-bold text-navy-800 text-lg sm:text-xl mb-4">
        ¿A dónde vamos?
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-colors ${
              tab === t.key
                ? 'bg-navy-600 text-white'
                : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder="¿A dónde quieres ir?"
          className="w-full px-4 py-3 rounded-lg border border-navy-100 bg-cream/50 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-colors"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Crear `hero-section.tsx`**

```tsx
import Link from 'next/link';
import { SearchWidget } from './search-widget';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-700 via-navy-500 to-navy-400">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,83,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-800/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
              Descubre el mundo con <span className="text-gold-300 italic">TuriDove</span>
            </h1>
            <p className="text-sm sm:text-base text-white/80 font-body max-w-md mb-6 sm:mb-8 leading-relaxed">
              Viajes boutique con destinos únicos al mejor precio. Hoteles, actividades, vehículos y paquetes curados.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#destinos"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
              >
                Buscar destinos
              </Link>
              <Link
                href="#paquetes"
                className="px-6 py-3 rounded-lg border-2 border-white/30 text-white font-body font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Ver paquetes
              </Link>
            </div>
          </div>
          <div>
            <SearchWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/home/hero-section.tsx frontend/src/components/home/search-widget.tsx
git commit -m "feat(home): HeroSection con SearchWidget de 4 tabs"
```

### Tarea 4.5: `WhyChooseSection` + `ServicesSection`

**Files:**
- Create: `frontend/src/components/home/why-choose-section.tsx`
- Create: `frontend/src/components/home/services-section.tsx`

- [ ] **Step 1: Crear `why-choose-section.tsx`**

```tsx
import { ShieldCheck, Headphones, Tag, MapPin } from 'lucide-react';

const FEATURES = [
  { Icon: ShieldCheck, title: 'Reserva segura', desc: 'Pagos protegidos con Stripe y confirmación inmediata' },
  { Icon: Headphones, title: 'Soporte 24/7', desc: 'Atención personalizada en todo momento' },
  { Icon: Tag, title: 'Mejores precios', desc: 'Garantía del mejor precio disponible' },
  { Icon: MapPin, title: 'Destinos únicos', desc: 'Experiencias exclusivas alrededor del mundo' },
];

export function WhyChooseSection() {
  return (
    <section className="py-14 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
            ¿Por qué elegir TuriDove?
          </h2>
          <p className="text-sm text-navy-400 font-body max-w-md mx-auto">
            Viajamos por ti. Los mejores destinos, los mejores precios y la mejor atención.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="group text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-navy-50 group-hover:bg-gold-50 flex items-center justify-center mb-3 transition-colors">
                <Icon className="w-7 h-7 text-navy-500 group-hover:text-gold-500 transition-colors" />
              </div>
              <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base">{title}</h3>
              <p className="text-xs text-navy-400 font-body mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Crear `services-section.tsx`**

```tsx
import Link from 'next/link';
import { Hotel, Package, Compass, Car } from 'lucide-react';

const SERVICES = [
  { Icon: Hotel, title: 'Hoteles', desc: 'Los mejores alojamientos', href: '/hospedajes' },
  { Icon: Package, title: 'Paquetes', desc: 'Todo incluido al mejor precio', href: '/paquetes' },
  { Icon: Compass, title: 'Actividades', desc: 'Experiencias inolvidables', href: '/actividades' },
  { Icon: Car, title: 'Vehículos', desc: 'Viaja a tu ritmo', href: '/vehiculos' },
];

export function ServicesSection() {
  return (
    <section className="py-14 sm:py-16 md:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
            Nuestros servicios
          </h2>
          <p className="text-sm text-navy-400 font-body max-w-md mx-auto">
            Todo lo que necesitas para tu viaje perfecto
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {SERVICES.map(({ Icon, title, desc, href }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-4 sm:p-5 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-navy-50 group-hover:bg-gold-50 flex items-center justify-center mb-3 transition-colors">
                <Icon className="w-8 h-8 text-navy-500 group-hover:text-gold-500 transition-colors" />
              </div>
              <h3 className="font-body font-semibold text-navy-800 text-xs sm:text-sm">{title}</h3>
              <p className="text-[11px] sm:text-xs text-navy-400 font-body mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/home/why-choose-section.tsx frontend/src/components/home/services-section.tsx
git commit -m "feat(home): WhyChooseSection y ServicesSection"
```

### Tarea 4.6: Sección `FeaturedActivities` (con datos del backend)

**Files:**
- Create: `frontend/src/components/home/featured-activities.tsx`
- Create: `frontend/src/components/home/section-skeleton.tsx`

- [ ] **Step 1: Crear `section-skeleton.tsx`**

```tsx
export function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="h-40 sm:h-44 bg-navy-100 animate-pulse" />
          <div className="p-4 sm:p-5 space-y-2">
            <div className="h-4 bg-navy-100 animate-pulse rounded" />
            <div className="h-3 bg-navy-100/60 animate-pulse rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Crear `featured-activities.tsx`**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { getFeaturedActividades } from '@/services/actividades.service';
import { formatPrice } from '@/lib/format-price';

export async function FeaturedActivities() {
  let items: any[] = [];
  try {
    items = await getFeaturedActividades(3);
  } catch {
    items = [];
  }

  if (!items?.length) return null;

  return (
    <section className="py-14 sm:py-16 md:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
              Actividades destacadas
            </h2>
            <p className="text-sm text-navy-400 font-body">
              Experiencias únicas que no te puedes perder
            </p>
          </div>
          <Link href="/actividades" className="text-sm font-body font-medium text-gold-500 hover:text-gold-600 transition-colors">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/actividades/${a.slug ?? a.id}`}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-40 sm:h-44 overflow-hidden bg-gradient-to-br from-cream-200 to-navy-100">
                {a.imagenPrincipal && (
                  <Image
                    src={a.imagenPrincipal}
                    alt={a.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base">{a.nombre}</h3>
                <p className="text-[11px] sm:text-xs text-navy-400 font-body mt-1">{a.ciudad ?? ''}</p>
                <div className="flex items-center justify-between mt-3">
                  {a.rating ? (
                    <div className="flex items-center gap-1 text-xs text-navy-500">
                      <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                      {a.rating}
                    </div>
                  ) : <span />}
                  <p className="text-base font-display font-bold text-gold-500">
                    {formatPrice(a.precio ?? 0)}
                    <span className="text-xs text-navy-400 font-body font-normal ml-1">/ persona</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/home/featured-activities.tsx frontend/src/components/home/section-skeleton.tsx
git commit -m "feat(home): FeaturedActivities desde backend con SectionSkeleton"
```

### Tarea 4.7: Sección `AvailableVehicles`

**Files:**
- Create: `frontend/src/components/home/available-vehicles.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { getVehiculos } from '@/services/vehiculos.service';
import { formatPrice } from '@/lib/format-price';

export async function AvailableVehicles() {
  let items: any[] = [];
  try {
    const res: any = await getVehiculos({ limit: 3 });
    items = res?.items ?? res ?? [];
  } catch {
    items = [];
  }
  if (!items.length) return null;

  return (
    <section className="py-14 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
              Vehículos disponibles
            </h2>
            <p className="text-sm text-navy-400 font-body">
              Alquila el vehículo perfecto para tu aventura
            </p>
          </div>
          <Link href="/vehiculos" className="text-sm font-body font-medium text-gold-500 hover:text-gold-600 transition-colors">
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.slice(0, 3).map((v) => (
            <Link
              key={v.id}
              href={`/vehiculos/${v.slug ?? v.id}`}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-40 sm:h-44 overflow-hidden bg-gradient-to-br from-cream-200 to-navy-100">
                {v.imagenPrincipal && (
                  <Image
                    src={v.imagenPrincipal}
                    alt={`${v.marca ?? ''} ${v.modelo ?? ''}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base">
                  {v.marca} {v.modelo}
                </h3>
                <div className="flex items-center gap-1 text-xs text-navy-400 mt-1">
                  <Users className="w-3.5 h-3.5" />
                  {v.capacidad ?? '—'} pasajeros
                </div>
                <p className="text-base font-display font-bold text-gold-500 mt-3">
                  {formatPrice(v.precioPorDia ?? v.pricePerDay ?? 0)}
                  <span className="text-xs text-navy-400 font-body font-normal ml-1">/ día</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Ajustar los nombres de campos (`precioPorDia`, `imagenPrincipal`, etc.) a las propiedades reales del modelo Vehiculo del proyecto.

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/home/available-vehicles.tsx
git commit -m "feat(home): AvailableVehicles desde backend"
```

### Tarea 4.8: `PopularDestinations`

**Files:**
- Create: `frontend/src/components/home/popular-destinations.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';

const GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-amber-300 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-yellow-400 to-amber-600',
];

export function PopularDestinations() {
  return (
    <section id="destinos" className="py-14 sm:py-16 md:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
            Destinos populares
          </h2>
          <p className="text-sm text-navy-400 font-body max-w-md mx-auto">
            Los destinos más buscados. Elige tu próxima aventura.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {SITE_CONFIG.destinations.map((d, i) => (
            <Link
              key={d.slug}
              href={`/hospedajes?search=${encodeURIComponent(d.city)}`}
              className="group relative h-36 sm:h-44 md:h-52 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-navy-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block text-[10px] sm:text-xs font-body font-medium text-gold-300 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {d.label}
                </span>
                <h3 className="font-display font-bold text-white text-sm sm:text-base md:text-lg mt-2 group-hover:translate-x-1 transition-transform duration-300">
                  {d.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/home/popular-destinations.tsx
git commit -m "feat(home): PopularDestinations con 6 destinos curados"
```

### Tarea 4.9: `WelcomeBanner` y `Testimonials`

**Files:**
- Create: `frontend/src/components/home/welcome-banner.tsx`
- Create: `frontend/src/components/home/testimonials.tsx`

- [ ] **Step 1: Crear `welcome-banner.tsx`**

```tsx
import Link from 'next/link';

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-700 via-navy-500 to-navy-400 py-14 sm:py-16 md:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,83,0.15),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Bienvenido a <span className="text-gold-300 italic">TuriDove</span>
        </h2>
        <p className="text-sm sm:text-base text-white/80 font-body max-w-xl mx-auto mb-8 leading-relaxed">
          Descubre experiencias boutique en los destinos más cuidados. Comienza tu próximo viaje hoy.
        </p>
        <Link
          href="/register"
          className="inline-flex px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
        >
          Comenzar viaje
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Crear `testimonials.tsx`**

```tsx
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sofía Lima',
    city: 'São Paulo',
    rating: 5,
    text: 'París con TuriDove fue una experiencia única. Cada detalle pensado, cada recomendación acertada.',
  },
  {
    name: 'James Chen',
    city: 'Singapur',
    rating: 5,
    text: 'El paquete a Tokio superó todas mis expectativas. Boutique, personalizado, impecable.',
  },
  {
    name: 'Lucía Fernández',
    city: 'Madrid',
    rating: 4,
    text: 'Excelente atención. Santorini fue un sueño, y todo organizado al detalle.',
  },
];

export function Testimonials() {
  return (
    <section className="py-14 sm:py-16 md:py-20 bg-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-sm text-white/50 font-body max-w-md mx-auto">
            Viajeros que confían en nosotros para sus aventuras
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < t.rating ? 'text-gold-400 fill-gold-400' : 'text-white/20'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-white/80 font-body leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-white text-xs font-semibold flex items-center justify-center">
                  {t.name.split(' ').map((s) => s[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-white leading-none">{t.name}</p>
                  <p className="text-xs text-white/50 font-body mt-0.5">{t.city}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/home/welcome-banner.tsx frontend/src/components/home/testimonials.tsx
git commit -m "feat(home): WelcomeBanner y Testimonials"
```

### Tarea 4.10: `FeaturedPackages` (placeholder hasta Fase 6)

**Files:**
- Create: `frontend/src/components/home/featured-packages.tsx`

- [ ] **Step 1: Crear el componente con fallback vacío**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/format-price';

async function fetchPaquetes(): Promise<any[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    const res = await fetch(`${base}/paquetes?featured=true&limit=3`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.items ?? data ?? [];
  } catch {
    return [];
  }
}

export async function FeaturedPackages() {
  const items = await fetchPaquetes();
  if (!items.length) return null;

  return (
    <section id="paquetes" className="py-14 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
              Paquetes destacados
            </h2>
            <p className="text-sm text-navy-400 font-body">
              Combos exclusivos al mejor precio
            </p>
          </div>
          <Link href="/paquetes" className="text-sm font-body font-medium text-gold-500 hover:text-gold-600 transition-colors">
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/paquetes/${p.slug}`}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cream-200 to-navy-100">
                {p.imagenPrincipal && (
                  <Image
                    src={p.imagenPrincipal}
                    alt={p.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
                {Number(p.descuentoPorcentaje ?? 0) > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-gold-400 text-white text-xs font-semibold rounded-full">
                    Ahorra {p.descuentoPorcentaje}%
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-body font-semibold text-navy-800 text-base">{p.nombre}</h3>
                <p className="text-xs text-navy-400 mt-1">
                  {p.diasDuracion} días · {p.hospedaje?.ciudad ?? ''}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-navy-400 font-body">Desde</p>
                  <p className="text-base font-display font-bold text-gold-500">
                    {formatPrice(p.precioDesde ?? 0)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/home/featured-packages.tsx
git commit -m "feat(home): FeaturedPackages (consume endpoint que se crea en Fase 6)"
```

### Tarea 4.11: Reescribir `page.tsx` del home con las 10 secciones

**Files:**
- Modify: `frontend/src/app/(public)/page.tsx`

- [ ] **Step 1: Leer el archivo actual y respaldar la lógica si tuviera algo importante**

```powershell
Get-Content frontend/src/app/(public)/page.tsx
```

- [ ] **Step 2: Reemplazar contenido completo**

```tsx
import { HeroSection } from '@/components/home/hero-section';
import { WhyChooseSection } from '@/components/home/why-choose-section';
import { ServicesSection } from '@/components/home/services-section';
import { FeaturedPackages } from '@/components/home/featured-packages';
import { FeaturedActivities } from '@/components/home/featured-activities';
import { AvailableVehicles } from '@/components/home/available-vehicles';
import { PopularDestinations } from '@/components/home/popular-destinations';
import { WelcomeBanner } from '@/components/home/welcome-banner';
import { Testimonials } from '@/components/home/testimonials';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyChooseSection />
      <ServicesSection />
      <FeaturedPackages />
      <FeaturedActivities />
      <AvailableVehicles />
      <PopularDestinations />
      <WelcomeBanner />
      <Testimonials />
    </>
  );
}
```

- [ ] **Step 3: Smoke test del home**

```powershell
docker compose --env-file .env.docker restart frontend
```
Esperar ~30s al rebuild. Abrir http://localhost:3000/. Verificar:
- Hero con título "Descubre el mundo con *TuriDove*" en italic gold.
- 4 tabs en el search widget.
- 8 secciones más debajo (algunas vacías porque no hay datos featured aún, está bien — no se renderizan).
- Footer abajo.
- Sin errores fatales en consola.

- [ ] **Step 4: Commit**

```powershell
git add frontend/src/app/(public)/page.tsx
git commit -m "feat(home): nueva page.tsx con 10 secciones TuriDove"
```

### Tarea 4.12: Fin de Fase 4

- [ ] **Step 1: Marcar al menos 1 actividad y 1 vehículo como `isFeatured` para ver el home poblado**

```powershell
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "UPDATE actividades SET is_featured = true WHERE id IN (SELECT id FROM actividades LIMIT 3);"
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "UPDATE vehiculos SET is_featured = true WHERE id IN (SELECT id FROM vehiculos LIMIT 3);"
```

- [ ] **Step 2: Recargar home y validar visualmente**

http://localhost:3000/. Sección "Actividades destacadas" debe mostrar 3 cards reales. (En Fase 8 se reescribe el seed con destinos internacionales.)

---

## Fase 5 — Paneles privados repintados

Repinta sidebar, header admin, dashboards, listados, formularios, modales y componentes compartidos con el design system. Mantiene la lógica intacta.

### Tarea 5.1: Repintar `sidebar-nav.tsx`

**Files:**
- Modify: `frontend/src/components/shared/sidebar-nav.tsx`

- [ ] **Step 1: Leer el archivo actual**

```powershell
Get-Content frontend/src/components/shared/sidebar-nav.tsx
```

- [ ] **Step 2: Reescribir clases manteniendo la API**

Aplicar a cada item:
- Contenedor sidebar: `w-[260px] shrink-0 border-r border-navy-100/50 bg-white flex flex-col h-full`
- Logo header: `h-16 flex items-center gap-2.5 px-6 border-b border-navy-100/50`
- Cada sección de nav: agrupar items bajo un eyebrow `px-3 mb-2 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-300`
- Item inactivo: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body text-navy-500 hover:bg-navy-50/60 hover:text-navy-700 transition-colors`
- Item activo: `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body bg-gold-50/80 text-navy-800 font-medium` + un `<span>` interno `absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gold-400`
- Iconos `w-[18px] h-[18px]`, activos `text-gold-500`, inactivos `text-navy-400 group-hover:text-navy-500`.

Reemplazar iconos viejos (heroicons inline si los hay) por imports de `lucide-react` apropiados (LayoutDashboard, Hotel, Compass, Package, Bus, Car, Calendar, CreditCard, DollarSign, Users, Shield, Settings, FileText).

- [ ] **Step 3: Smoke test**

Loguearse como admin. Abrir http://localhost:3000/admin. Verificar:
- Sidebar blanco a la izquierda con logo TuriDove + kicker ADMIN.
- Items con eyebrows uppercase.
- Item activo en gold-50 con acento lateral dorado de 3px.
- Iconos lucide.

- [ ] **Step 4: Commit**

```powershell
git add frontend/src/components/shared/sidebar-nav.tsx
git commit -m "refactor(admin): repintar sidebar-nav con kicker y acento dorado"
```

### Tarea 5.2: Repintar `dashboard-layout.tsx`

**Files:**
- Modify: `frontend/src/components/shared/dashboard-layout.tsx`

- [ ] **Step 1: Reescribir el wrapper**

Wrapper raíz: `fixed inset-0 z-[100] flex bg-cream`. Área principal: `flex-1 flex flex-col overflow-hidden`. Header admin: `h-16 shrink-0 flex items-center justify-between px-8 border-b border-navy-100/50 bg-white`. Content: `flex-1 overflow-y-auto p-8`.

En el header admin agregar:
- Izquierda: H1 del título de página (Playfair `text-lg font-bold text-navy-800`) + breadcrumb `text-xs text-navy-400`.
- Derecha: avatar gradiente dorado (reusar el de `UserDropdown`) o un componente más simple.

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/shared/dashboard-layout.tsx
git commit -m "refactor(admin): repintar dashboard-layout con bg-cream y header navy"
```

### Tarea 5.3: Repintar componentes compartidos: `page-header`, `stat-card`, `loading-spinner`, `confirm-dialog`, `form-field`, `role-badge`

**Files:**
- Modify: `frontend/src/components/shared/page-header.tsx`
- Modify: `frontend/src/components/shared/stat-card.tsx`
- Modify: `frontend/src/components/shared/loading-spinner.tsx`
- Modify: `frontend/src/components/shared/confirm-dialog.tsx`
- Modify: `frontend/src/components/shared/form-field.tsx`
- Modify: `frontend/src/components/shared/role-badge.tsx`

- [ ] **Step 1: `page-header.tsx`**

Cambiar contenedor a `mb-6 flex items-end justify-between`. Título `text-2xl font-display font-bold text-navy-800`. Lead/subtítulo `text-sm text-navy-400 font-body mt-1`. Si recibe slot de CTA, asegurar que el botón primary use pill dorado.

- [ ] **Step 2: `stat-card.tsx`**

Wrapper: `bg-white rounded-2xl shadow-card p-5 sm:p-6`. Label `text-xs text-navy-400 font-body uppercase tracking-[0.1em]`. Número `text-3xl font-display font-bold text-navy-800 mt-2`. Trend/secundario `text-xs text-gold-500 font-medium mt-1`.

- [ ] **Step 3: `loading-spinner.tsx`**

```tsx
export function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div
      className="border-2 border-gold-400 border-t-transparent rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}
```

- [ ] **Step 4: `confirm-dialog.tsx`**

Si usa shadcn Dialog, sólo reestilizar el contenedor interior:
- Card: `bg-white rounded-2xl p-6 sm:p-8 max-w-md`.
- Título: `text-xl font-display font-bold text-navy-800 mb-2`.
- Body: `text-sm text-navy-500 font-body`.
- Footer: dos botones — Cancelar (`px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50`) y Confirmar (`px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold` o destructivo `bg-red-500 hover:bg-red-600` si la prop `variant === 'destructive'`).

- [ ] **Step 5: `form-field.tsx`**

Label: `block text-sm font-body font-medium text-navy-700 mb-1.5`. Input: `w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors`. Helper: `mt-1 text-xs text-navy-400 font-body`. Error: `mt-1 text-xs text-red-600 font-body`.

- [ ] **Step 6: `role-badge.tsx`**

Pill con `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border`. Mapa por rol:
- ADMIN: `bg-navy-100 text-navy-800 border-navy-200`
- PROVEEDOR / AGENCIA: `bg-gold-100 text-gold-800 border-gold-200`
- OPERADOR: `bg-navy-50 text-navy-600 border-navy-100`
- CLIENTE: `bg-cream-200 text-navy-700 border-cream-200`

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/components/shared/
git commit -m "refactor(shared): repintar page-header, stat-card, spinner, confirm-dialog, form-field, role-badge"
```

### Tarea 5.4: Repintar `data-table.tsx`

**Files:**
- Modify: `frontend/src/components/shared/data-table.tsx`

- [ ] **Step 1: Leer y reestilizar**

```powershell
Get-Content frontend/src/components/shared/data-table.tsx | Select-Object -First 60
```

- [ ] **Step 2: Aplicar clases**

- Wrapper tabla: `bg-white rounded-2xl shadow-card overflow-hidden border border-navy-100/50`.
- `<thead>` row: `border-b border-navy-100/50 bg-cream-100`.
- `<th>`: `text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400`.
- `<tr>` body: `border-b border-navy-100/30 hover:bg-navy-50/40 transition-colors`.
- `<td>`: `px-4 py-3 text-sm font-body text-navy-700`.
- Filtros encima: en flex gap con inputs premium (sección 6 del manual).
- Paginación: botón outline `px-3 py-1.5 rounded-lg border border-navy-200 text-sm text-navy-600 hover:bg-navy-50`, número activo en pill `bg-gold-400 text-white`.

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/shared/data-table.tsx
git commit -m "refactor(shared): repintar DataTable con navy/cream/gold"
```

### Tarea 5.5: Repintar páginas de listado de catálogo (admin + proveedor + agencia)

**Files (ejemplo, replicar el patrón a todos):**
- Modify: `frontend/src/app/admin/hospedajes/page.tsx`
- Modify: `frontend/src/app/admin/actividades/page.tsx`
- Modify: `frontend/src/app/admin/vehiculos/page.tsx`
- Modify: `frontend/src/app/admin/transfers/page.tsx`
- Modify: `frontend/src/app/admin/reservas/page.tsx`
- Modify: `frontend/src/app/admin/pagos/page.tsx`
- Modify: `frontend/src/app/admin/usuarios/page.tsx`
- Modify: `frontend/src/app/admin/auditoria/page.tsx`
- Modify: equivalentes en `/proveedor`, `/agencia`, `/operador`, `/cliente`

- [ ] **Step 1: Listar todas las páginas a tocar**

```powershell
Get-ChildItem -Path frontend/src/app/admin,frontend/src/app/proveedor,frontend/src/app/agencia,frontend/src/app/operador,frontend/src/app/cliente -Filter page.tsx -Recurse | Select-Object FullName
```

- [ ] **Step 2: En cada página de listado, cambiar el título visible**

En las páginas de **hospedajes**, cambiar:
- "Hospedajes" → "Hoteles" (en `<PageHeader title="Hoteles" />`, breadcrumb, botón `+ Nuevo hotel`, mensajes de confirmación, columnas si dicen `Hospedaje`).

- [ ] **Step 3: Validar que la estructura ya usa `PageHeader` y `DataTable` repintados**

Como los componentes compartidos se repintaron en Tareas 5.3-5.4, no hay que tocar mucho más por página. Verificar visualmente.

- [ ] **Step 4: Smoke test**

Loguearse como admin. Navegar a:
- /admin (dashboard)
- /admin/hospedajes (debe decir "Hoteles" arriba)
- /admin/actividades
- /admin/reservas
- /admin/usuarios

Verificar: sidebar con TuriDove + ADMIN, header con título Playfair, DataTable con headers uppercase tracked, filas hovered.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/app/admin frontend/src/app/proveedor frontend/src/app/agencia frontend/src/app/operador frontend/src/app/cliente
git commit -m "refactor(panels): renombrar 'Hospedajes'->'Hoteles' en UI de listados de admin/proveedor/agencia"
```

### Tarea 5.6: Repintar formularios de creación/edición

**Files:**
- Modify: páginas `nuevo` y `[id]` en cada módulo de los paneles

- [ ] **Step 1: Patrón a aplicar**

- Card wrapper: `bg-white rounded-2xl shadow-card p-8`.
- Secciones separadas por `<div className="border-t border-navy-100/50 pt-6 mt-6">`.
- Labels y inputs ya repintados a través de `FormField` (Tarea 5.3).
- Footer del form: flex justify-end gap-3, Cancelar (`px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50`) + Guardar (pill dorado).

- [ ] **Step 2: Verificar visualmente**

Abrir /admin/hospedajes/nuevo y /admin/hospedajes/[id]. Validar.

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/app
git commit -m "refactor(forms): repintar formularios de creacion/edicion en paneles"
```

### Tarea 5.7: Repintar listados y detalles públicos

**Files:**
- Modify: `frontend/src/app/(public)/hospedajes/page.tsx`
- Modify: `frontend/src/app/(public)/hospedajes/[id]/page.tsx`
- Modify: `frontend/src/app/(public)/actividades/page.tsx`
- Modify: `frontend/src/app/(public)/actividades/[id]/page.tsx`
- Modify: `frontend/src/app/(public)/vehiculos/page.tsx`
- Modify: `frontend/src/app/(public)/vehiculos/[id]/page.tsx`
- Modify: `frontend/src/app/(public)/transfers/page.tsx`
- Modify: `frontend/src/app/(public)/transfers/[id]/page.tsx`

- [ ] **Step 1: Cambiar título de Hospedajes a "Hoteles"** en `(public)/hospedajes/page.tsx`.

- [ ] **Step 2: Aplicar estilos**

- Hero corto: H1 Playfair, lead navy-400, opcional input search.
- Grid de cards: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6`, cards `rounded-2xl shadow-card` con la anatomía del manual (sección 7).
- Página detalle: galería arriba, dos columnas (info + sticky CTA `Reservar` pill dorado).

- [ ] **Step 3: Smoke test**

Abrir http://localhost:3000/hospedajes y /actividades. Verificar grids elegantes.

- [ ] **Step 4: Commit**

```powershell
git add frontend/src/app/(public)/
git commit -m "refactor(public): repintar listados y detalles publicos con design system"
```

### Tarea 5.8: Fin de Fase 5

- [ ] **Step 1: Recorrido global**

Como cada rol:
- ADMIN: /admin, /admin/hospedajes, /admin/usuarios, /admin/configuracion.
- PROVEEDOR (`finca.loma@agroturismo.pa` / `Proveedor123!` — todavía las credenciales viejas): /proveedor.
- CLIENTE (`juan.perez@gmail.com` / `Cliente123!`): /cliente/reservas.

Validar que todo se ve TuriDove premium. (Los emails seed cambian en Fase 8.)

- [ ] **Step 2: Sin commit. Fin de Fase 5.**

---

## Fase 6 — Módulo Paquetes

Crea el módulo end-to-end: modelo Prisma, módulo NestJS con endpoints, frontend público (listado + detalle), frontend admin/proveedor/agencia (CRUD), configuración de margen.

### Tarea 6.1: Agregar modelo `Paquete` al schema Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Identificar nombres exactos de relaciones existentes**

```powershell
Select-String -Path backend/prisma/schema.prisma -Pattern "^model (Hospedaje|Habitacion|Actividad|Vehiculo)" -Context 0,2
```
Confirmar el nombre exacto del modelo `Habitacion` y los nombres de campos `id`.

- [ ] **Step 2: Agregar el modelo `Paquete` al final del schema**

Antes de `model AuditLog` (o donde corresponda), insertar:

```prisma
model Paquete {
  id                  String   @id @default(uuid())
  nombre              String
  slug                String   @unique
  descripcion         String
  hospedajeId         String   @map("hospedaje_id")
  habitacionId        String   @map("habitacion_id")
  actividadId         String?  @map("actividad_id")
  vehiculoId          String?  @map("vehiculo_id")
  diasDuracion        Int      @map("dias_duracion")
  noches              Int
  descuentoPorcentaje Decimal  @db.Decimal(5, 2) @default(0) @map("descuento_porcentaje")
  imagenPrincipal     String?  @map("imagen_principal")
  isFeatured          Boolean  @default(false) @map("is_featured")
  isActive            Boolean  @default(true) @map("is_active")
  validoDesde         DateTime @map("valido_desde")
  validoHasta         DateTime @map("valido_hasta")
  proveedorId         String?  @map("proveedor_id")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  hospedaje  Hospedaje  @relation(fields: [hospedajeId], references: [id])
  habitacion Habitacion @relation(fields: [habitacionId], references: [id])
  actividad  Actividad? @relation(fields: [actividadId], references: [id])
  vehiculo   Vehiculo?  @relation(fields: [vehiculoId], references: [id])
  proveedor  User?      @relation("PaquetesDeProveedor", fields: [proveedorId], references: [id])

  @@index([slug])
  @@index([isFeatured, isActive])
  @@map("paquetes")
}
```

- [ ] **Step 3: Agregar relaciones inversas en `Hospedaje`, `Habitacion`, `Actividad`, `Vehiculo`, `User`**

En cada modelo agregar (justo antes del `@@map`):

```prisma
  paquetes Paquete[]
```

En `User`, agregar:
```prisma
  paquetes Paquete[] @relation("PaquetesDeProveedor")
```

- [ ] **Step 4: Agregar `paqueteId` opcional a `Reserva`**

En el modelo `Reserva` (o en la subreserva polimórfica correspondiente). Si el proyecto usa subtablas (`ReservaHospedaje`, `ReservaActividad`, etc.), crear una nueva: `ReservaPaquete`. Inspeccionar primero:

```powershell
Select-String -Path backend/prisma/schema.prisma -Pattern "^model ReservaHospedaje" -Context 0,15
```

Si existe el patrón `ReservaHospedaje`, crear:

```prisma
model ReservaPaquete {
  id          String   @id @default(uuid())
  reservaId   String   @map("reserva_id")
  paqueteId   String   @map("paquete_id")
  fechaInicio DateTime @map("fecha_inicio")
  huespedes   Int      @default(1)
  precioFinal Decimal  @db.Decimal(10, 2) @map("precio_final")

  reserva Reserva @relation(fields: [reservaId], references: [id], onDelete: Cascade)
  paquete Paquete @relation(fields: [paqueteId], references: [id])

  @@index([reservaId])
  @@index([paqueteId])
  @@map("reserva_paquetes")
}
```

Y agregar `reservaPaquetes ReservaPaquete[]` en `Reserva` y `Paquete`.

- [ ] **Step 5: Generar migración**

```powershell
docker compose --env-file .env.docker exec backend npx prisma migrate dev --name add_paquetes
```
Expected: migración creada, tablas `paquetes` y `reserva_paquetes` creadas.

- [ ] **Step 6: Verificar**

```powershell
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "\dt paquetes reserva_paquetes"
```

- [ ] **Step 7: Commit**

```powershell
git add backend/prisma/
git commit -m "feat(db): agregar modelo Paquete y ReservaPaquete"
```

### Tarea 6.2: Crear módulo NestJS `paquetes` con DTOs

**Files:**
- Create: `backend/src/modules/paquetes/paquetes.module.ts`
- Create: `backend/src/modules/paquetes/paquetes.controller.ts`
- Create: `backend/src/modules/paquetes/paquetes.service.ts`
- Create: `backend/src/modules/paquetes/dto/create-paquete.dto.ts`
- Create: `backend/src/modules/paquetes/dto/update-paquete.dto.ts`
- Create: `backend/src/modules/paquetes/dto/query-paquete.dto.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Inspeccionar la estructura de otro módulo existente para imitar el patrón**

```powershell
Get-Content backend/src/modules/actividades/actividades.module.ts
Get-Content backend/src/modules/actividades/dto/create-actividad.dto.ts
```

- [ ] **Step 2: Crear `dto/create-paquete.dto.ts`**

```ts
import { IsString, IsOptional, IsInt, IsNumber, IsBoolean, IsDateString, Min, Max, MaxLength, MinLength } from 'class-validator';

export class CreatePaqueteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(140)
  slug!: string;

  @IsString()
  @MinLength(10)
  descripcion!: string;

  @IsString()
  hospedajeId!: string;

  @IsString()
  habitacionId!: string;

  @IsOptional()
  @IsString()
  actividadId?: string;

  @IsOptional()
  @IsString()
  vehiculoId?: string;

  @IsInt()
  @Min(1)
  @Max(30)
  diasDuracion!: number;

  @IsInt()
  @Min(0)
  @Max(29)
  noches!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  descuentoPorcentaje?: number;

  @IsOptional()
  @IsString()
  imagenPrincipal?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsDateString()
  validoDesde!: string;

  @IsDateString()
  validoHasta!: string;
}
```

- [ ] **Step 3: Crear `dto/update-paquete.dto.ts`**

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePaqueteDto } from './create-paquete.dto';

export class UpdatePaqueteDto extends PartialType(CreatePaqueteDto) {}
```

- [ ] **Step 4: Crear `dto/query-paquete.dto.ts`**

```ts
import { IsOptional, IsString, IsBooleanString, IsNumberString } from 'class-validator';

export class QueryPaqueteDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  featured?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;
}
```

- [ ] **Step 5: Crear `paquetes.service.ts`**

```ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaquetesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { search?: string; isFeatured?: boolean; limit?: number; page?: number }) {
    const where: Prisma.PaqueteWhereInput = { isActive: true };
    if (params.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { descripcion: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;

    const limit = params.limit ?? 12;
    const page = params.page ?? 1;
    const [items, total] = await Promise.all([
      this.prisma.paquete.findMany({
        where,
        include: { hospedaje: true, habitacion: true, actividad: true, vehiculo: true },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paquete.count({ where }),
    ]);

    const withPrice = await Promise.all(
      items.map(async (p) => ({
        ...p,
        precioDesde: await this.calcularPrecio(p.id),
      })),
    );
    return { items: withPrice, total, page, limit };
  }

  async findBySlug(slug: string) {
    const paquete = await this.prisma.paquete.findUnique({
      where: { slug },
      include: { hospedaje: true, habitacion: true, actividad: true, vehiculo: true },
    });
    if (!paquete) throw new NotFoundException('Paquete no encontrado');
    return { ...paquete, precioDesde: await this.calcularPrecio(paquete.id) };
  }

  async calcularPrecio(paqueteId: string, fechaInicio?: Date): Promise<number> {
    const paquete = await this.prisma.paquete.findUnique({
      where: { id: paqueteId },
      include: { habitacion: true, actividad: true, vehiculo: true },
    });
    if (!paquete) throw new NotFoundException('Paquete no encontrado');

    // Precio base habitacion: usar precio por defecto si no se determina temporada
    const precioHabitacion = Number(paquete.habitacion?.precio ?? paquete.habitacion?.precioBase ?? 0);
    const precioActividad = paquete.actividad ? Number(paquete.actividad.precio ?? 0) : 0;
    const precioVehiculoDia = paquete.vehiculo ? Number(paquete.vehiculo.precioPorDia ?? 0) : 0;

    const precioBase =
      precioHabitacion * paquete.noches +
      precioActividad +
      precioVehiculoDia * paquete.diasDuracion;

    const descuento = Number(paquete.descuentoPorcentaje ?? 0);
    const precioConDescuento = precioBase * (1 - descuento / 100);

    // Margen comercial (default 12% si no hay tabla Configuracion)
    const margen = await this.getMargenPaquetes();
    const precioFinal = precioConDescuento * (1 + margen / 100);

    return Math.round(precioFinal * 100) / 100;
  }

  private async getMargenPaquetes(): Promise<number> {
    // Si existe la tabla Configuracion con campo margenPaquetes, leerla. Si no, devolver 12.
    return 12;
  }

  async create(dto: CreatePaqueteDto, userId: string, userRole: string) {
    if (new Date(dto.validoHasta) <= new Date(dto.validoDesde)) {
      throw new BadRequestException('validoHasta debe ser posterior a validoDesde');
    }

    const habitacion = await this.prisma.habitacion.findUnique({ where: { id: dto.habitacionId } });
    if (!habitacion) throw new BadRequestException('Habitación no existe');
    if (habitacion.hospedajeId !== dto.hospedajeId) {
      throw new BadRequestException('La habitación no pertenece al hospedaje');
    }

    const proveedorId = userRole === 'ADMIN' ? null : userId;
    if (proveedorId) {
      const hospedaje = await this.prisma.hospedaje.findUnique({ where: { id: dto.hospedajeId } });
      if (hospedaje?.propietarioId !== userId) {
        throw new ForbiddenException('No puedes usar un hospedaje que no es tuyo');
      }
    }

    return this.prisma.paquete.create({
      data: {
        ...dto,
        descuentoPorcentaje: dto.descuentoPorcentaje ?? 0,
        proveedorId,
        validoDesde: new Date(dto.validoDesde),
        validoHasta: new Date(dto.validoHasta),
      },
    });
  }

  async update(id: string, dto: UpdatePaqueteDto, userId: string, userRole: string) {
    const paquete = await this.prisma.paquete.findUnique({ where: { id } });
    if (!paquete) throw new NotFoundException('Paquete no encontrado');
    if (userRole !== 'ADMIN' && paquete.proveedorId !== userId) {
      throw new ForbiddenException('No puedes editar este paquete');
    }

    return this.prisma.paquete.update({
      where: { id },
      data: {
        ...dto,
        validoDesde: dto.validoDesde ? new Date(dto.validoDesde) : undefined,
        validoHasta: dto.validoHasta ? new Date(dto.validoHasta) : undefined,
      },
    });
  }

  async softDelete(id: string, userId: string, userRole: string) {
    const paquete = await this.prisma.paquete.findUnique({ where: { id } });
    if (!paquete) throw new NotFoundException();
    if (userRole !== 'ADMIN' && paquete.proveedorId !== userId) {
      throw new ForbiddenException();
    }
    return this.prisma.paquete.update({ where: { id }, data: { isActive: false } });
  }
}
```

- [ ] **Step 6: Crear `paquetes.controller.ts`**

```ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaquetesService } from './paquetes.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { QueryPaqueteDto } from './dto/query-paquete.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('paquetes')
@Controller('paquetes')
export class PaquetesController {
  constructor(private readonly service: PaquetesService) {}

  @Get()
  findAll(@Query() q: QueryPaqueteDto) {
    return this.service.findAll({
      search: q.search,
      isFeatured: q.featured === 'true' ? true : q.featured === 'false' ? false : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      page: q.page ? parseInt(q.page, 10) : undefined,
    });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id/precio')
  precio(@Param('id') id: string, @Query('fechaInicio') fechaInicio?: string) {
    return this.service.calcularPrecio(id, fechaInicio ? new Date(fechaInicio) : undefined)
      .then((precio) => ({ precio }));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVEEDOR', 'AGENCIA')
  create(@Body() dto: CreatePaqueteDto, @Req() req: any) {
    return this.service.create(dto, req.user.id, req.user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVEEDOR', 'AGENCIA')
  update(@Param('id') id: string, @Body() dto: UpdatePaqueteDto, @Req() req: any) {
    return this.service.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVEEDOR', 'AGENCIA')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.softDelete(id, req.user.id, req.user.role);
  }
}
```

Ajustar paths de imports `JwtAuthGuard`, `RolesGuard`, `Roles` a los reales del proyecto.

- [ ] **Step 7: Crear `paquetes.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { PaquetesController } from './paquetes.controller';
import { PaquetesService } from './paquetes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaquetesController],
  providers: [PaquetesService],
  exports: [PaquetesService],
})
export class PaquetesModule {}
```

- [ ] **Step 8: Registrar en `app.module.ts`**

Agregar import `PaquetesModule` al array `imports`.

- [ ] **Step 9: Rebuild backend y verificar Swagger**

```powershell
docker compose --env-file .env.docker restart backend
docker compose --env-file .env.docker logs backend --tail 30
```
Abrir http://localhost:3001/api/docs y verificar que aparecen los endpoints `/paquetes`.

- [ ] **Step 10: Commit**

```powershell
git add backend/src/modules/paquetes/ backend/src/app.module.ts
git commit -m "feat(api): modulo Paquetes con CRUD y calculo de precio"
```

### Tarea 6.3: Test unitario del cálculo de precio

**Files:**
- Create: `backend/src/modules/paquetes/paquetes.service.spec.ts`

- [ ] **Step 1: Verificar si Jest está configurado**

```powershell
Get-Content backend/package.json | Select-String "jest"
```
Expected: ya está como devDependency en NestJS por defecto.

- [ ] **Step 2: Crear el test**

```ts
import { Test } from '@nestjs/testing';
import { PaquetesService } from './paquetes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaquetesService.calcularPrecio', () => {
  let service: PaquetesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      paquete: {
        findUnique: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [PaquetesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PaquetesService);
  });

  it('calcula precio con hospedaje + actividad + vehiculo, sin descuento, margen 12%', async () => {
    prisma.paquete.findUnique.mockResolvedValue({
      id: 'p1',
      noches: 3,
      diasDuracion: 3,
      descuentoPorcentaje: 0,
      habitacion: { precio: 100 },
      actividad: { precio: 50 },
      vehiculo: { precioPorDia: 40 },
    });
    // base = 100*3 + 50 + 40*3 = 470
    // sin descuento: 470
    // con margen 12%: 470 * 1.12 = 526.40
    const precio = await service.calcularPrecio('p1');
    expect(precio).toBeCloseTo(526.4, 2);
  });

  it('aplica descuento antes del margen', async () => {
    prisma.paquete.findUnique.mockResolvedValue({
      id: 'p2',
      noches: 2,
      diasDuracion: 2,
      descuentoPorcentaje: 20,
      habitacion: { precio: 100 },
      actividad: null,
      vehiculo: null,
    });
    // base = 100*2 = 200
    // con 20% desc: 160
    // margen 12%: 160 * 1.12 = 179.20
    const precio = await service.calcularPrecio('p2');
    expect(precio).toBeCloseTo(179.2, 2);
  });

  it('soporta paquete solo hospedaje (sin actividad ni vehiculo)', async () => {
    prisma.paquete.findUnique.mockResolvedValue({
      id: 'p3',
      noches: 4,
      diasDuracion: 4,
      descuentoPorcentaje: 0,
      habitacion: { precio: 80 },
      actividad: null,
      vehiculo: null,
    });
    // base = 80*4 = 320; margen 12% => 358.40
    const precio = await service.calcularPrecio('p3');
    expect(precio).toBeCloseTo(358.4, 2);
  });
});
```

- [ ] **Step 3: Correr el test**

```powershell
docker compose --env-file .env.docker exec backend npm run test -- paquetes.service.spec
```
Expected: 3 tests pasan.

- [ ] **Step 4: Commit**

```powershell
git add backend/src/modules/paquetes/paquetes.service.spec.ts
git commit -m "test(paquetes): unit tests del calculo de precio"
```

### Tarea 6.4: Servicio frontend de paquetes y tipo

**Files:**
- Create: `frontend/src/services/paquetes.service.ts`
- Create: `frontend/src/types/paquete.ts`

- [ ] **Step 1: Crear `types/paquete.ts`**

```ts
export interface Paquete {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  hospedajeId: string;
  habitacionId: string;
  actividadId?: string | null;
  vehiculoId?: string | null;
  diasDuracion: number;
  noches: number;
  descuentoPorcentaje: number;
  imagenPrincipal?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  validoDesde: string;
  validoHasta: string;
  precioDesde?: number;
  hospedaje?: { nombre: string; ciudad: string };
  habitacion?: { nombre: string };
  actividad?: { nombre: string };
  vehiculo?: { marca: string; modelo: string };
}
```

- [ ] **Step 2: Crear `services/paquetes.service.ts`**

```ts
import api from '@/lib/axios';
import type { Paquete } from '@/types/paquete';

export async function listPaquetes(params: { search?: string; featured?: boolean; limit?: number; page?: number } = {}) {
  const { data } = await api.get('/paquetes', {
    params: {
      ...params,
      featured: params.featured === undefined ? undefined : String(params.featured),
    },
  });
  return data as { items: Paquete[]; total: number; page: number; limit: number };
}

export async function getPaqueteBySlug(slug: string): Promise<Paquete> {
  const { data } = await api.get(`/paquetes/${slug}`);
  return data;
}

export async function getPrecioPaquete(id: string, fechaInicio?: string): Promise<number> {
  const { data } = await api.get(`/paquetes/${id}/precio`, { params: { fechaInicio } });
  return data.precio;
}

export async function createPaquete(payload: Partial<Paquete>) {
  const { data } = await api.post('/paquetes', payload);
  return data as Paquete;
}

export async function updatePaquete(id: string, payload: Partial<Paquete>) {
  const { data } = await api.patch(`/paquetes/${id}`, payload);
  return data as Paquete;
}

export async function deletePaquete(id: string) {
  await api.delete(`/paquetes/${id}`);
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/services/paquetes.service.ts frontend/src/types/paquete.ts
git commit -m "feat(api-client): servicio y tipo Paquete en frontend"
```

### Tarea 6.5: Componente `PaqueteCard` y página pública `/paquetes`

**Files:**
- Create: `frontend/src/components/paquetes/paquete-card.tsx`
- Create: `frontend/src/app/(public)/paquetes/page.tsx`

- [ ] **Step 1: Crear `paquete-card.tsx`**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import type { Paquete } from '@/types/paquete';
import { formatPrice } from '@/lib/format-price';

export function PaqueteCard({ p }: { p: Paquete }) {
  return (
    <Link
      href={`/paquetes/${p.slug}`}
      className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cream-200 to-navy-100">
        {p.imagenPrincipal && (
          <Image
            src={p.imagenPrincipal}
            alt={p.nombre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        {Number(p.descuentoPorcentaje) > 0 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-gold-400 text-white text-xs font-semibold rounded-full">
            Ahorra {p.descuentoPorcentaje}%
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-body font-semibold text-navy-800 text-base">{p.nombre}</h3>
        <p className="text-xs text-navy-400 mt-1">
          {p.diasDuracion} días · {p.hospedaje?.ciudad ?? ''}
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-navy-400 font-body">Desde</p>
          <p className="text-base font-display font-bold text-gold-500">
            {formatPrice(p.precioDesde ?? 0)}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Crear página listado `/paquetes`**

```tsx
import { listPaquetes } from '@/services/paquetes.service';
import { PaqueteCard } from '@/components/paquetes/paquete-card';

export default async function PaquetesPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams;
  const { items } = await listPaquetes({ search: sp.search, limit: 24 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800">Paquetes</h1>
        <p className="text-sm text-navy-400 font-body mt-2">
          Combos exclusivos al mejor precio
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-navy-400 font-body py-12">
          No hay paquetes disponibles en este momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((p) => <PaqueteCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/paquetes frontend/src/app/(public)/paquetes/page.tsx
git commit -m "feat(public): listado de paquetes /paquetes"
```

### Tarea 6.6: Página detalle `/paquetes/[slug]`

**Files:**
- Create: `frontend/src/components/paquetes/paquete-summary.tsx`
- Create: `frontend/src/app/(public)/paquetes/[slug]/page.tsx`

- [ ] **Step 1: Crear `paquete-summary.tsx` (sticky con CTA reservar)**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format-price';
import type { Paquete } from '@/types/paquete';

export function PaqueteSummary({ paquete }: { paquete: Paquete }) {
  const router = useRouter();
  const [fecha, setFecha] = useState('');

  function reservar() {
    if (!fecha) {
      alert('Selecciona una fecha de inicio');
      return;
    }
    router.push(`/reservas/nueva?tipo=PAQUETE&paqueteId=${paquete.id}&fechaInicio=${fecha}`);
  }

  return (
    <aside className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
      <p className="text-xs text-navy-400 font-body">Desde</p>
      <p className="text-3xl font-display font-bold text-gold-500">
        {formatPrice(paquete.precioDesde ?? 0)}
      </p>
      <p className="text-xs text-navy-400 font-body mt-1">
        {paquete.diasDuracion} días · descuento {paquete.descuentoPorcentaje}%
      </p>

      <div className="mt-6 space-y-3">
        <label className="block text-sm font-body font-medium text-navy-700">
          Fecha de inicio
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          min={paquete.validoDesde.slice(0, 10)}
          max={paquete.validoHasta.slice(0, 10)}
          className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
        />
        <button
          type="button"
          onClick={reservar}
          className="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
        >
          Reservar paquete
        </button>
      </div>

      <p className="text-xs text-navy-400 font-body mt-4">
        Válido del {new Date(paquete.validoDesde).toLocaleDateString('es')} al{' '}
        {new Date(paquete.validoHasta).toLocaleDateString('es')}.
      </p>
    </aside>
  );
}
```

- [ ] **Step 2: Crear `[slug]/page.tsx`**

```tsx
import { Hotel, Compass, Car, Check } from 'lucide-react';
import { getPaqueteBySlug } from '@/services/paquetes.service';
import { PaqueteSummary } from '@/components/paquetes/paquete-summary';

export default async function PaqueteDetallePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPaqueteBySlug(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800">{p.nombre}</h1>
        <p className="text-sm text-navy-400 font-body mt-2">
          {p.hospedaje?.ciudad} · {p.diasDuracion} días
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="h-72 bg-gradient-to-br from-cream-200 to-navy-100" />
          </div>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-800 mb-4">Qué incluye</h2>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-navy-700 font-body">
                <Hotel className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>
                  Hospedaje en <strong>{p.hospedaje?.nombre}</strong> — {p.habitacion?.nombre},{' '}
                  {p.noches} noches.
                </span>
              </li>
              {p.actividad && (
                <li className="flex gap-3 text-sm text-navy-700 font-body">
                  <Compass className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                  <span>Actividad: <strong>{p.actividad.nombre}</strong>.</span>
                </li>
              )}
              {p.vehiculo && (
                <li className="flex gap-3 text-sm text-navy-700 font-body">
                  <Car className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                  <span>
                    Vehículo: <strong>{p.vehiculo.marca} {p.vehiculo.modelo}</strong>, {p.diasDuracion} días.
                  </span>
                </li>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-800 mb-3">Sobre este paquete</h2>
            <p className="text-sm text-navy-600 font-body leading-relaxed">{p.descripcion}</p>
          </section>
        </div>

        <PaqueteSummary paquete={p} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/components/paquetes frontend/src/app/(public)/paquetes
git commit -m "feat(public): pagina detalle /paquetes/[slug] con sticky CTA"
```

### Tarea 6.7: CRUD admin de paquetes

**Files:**
- Create: `frontend/src/components/paquetes/paquete-form.tsx`
- Create: `frontend/src/app/admin/paquetes/page.tsx`
- Create: `frontend/src/app/admin/paquetes/nuevo/page.tsx`
- Create: `frontend/src/app/admin/paquetes/[id]/page.tsx`

- [ ] **Step 1: Crear `paquete-form.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { createPaquete, updatePaquete } from '@/services/paquetes.service';
import type { Paquete } from '@/types/paquete';

interface PaqueteFormProps {
  paquete?: Paquete;
  isAdmin?: boolean;
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function PaqueteForm({ paquete, isAdmin = false }: PaqueteFormProps) {
  const router = useRouter();
  const [hospedajes, setHospedajes] = useState<any[]>([]);
  const [habitaciones, setHabitaciones] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);

  const [form, setForm] = useState({
    nombre: paquete?.nombre ?? '',
    slug: paquete?.slug ?? '',
    descripcion: paquete?.descripcion ?? '',
    hospedajeId: paquete?.hospedajeId ?? '',
    habitacionId: paquete?.habitacionId ?? '',
    actividadId: paquete?.actividadId ?? '',
    vehiculoId: paquete?.vehiculoId ?? '',
    diasDuracion: paquete?.diasDuracion ?? 3,
    noches: paquete?.noches ?? 3,
    descuentoPorcentaje: paquete?.descuentoPorcentaje ?? 0,
    isFeatured: paquete?.isFeatured ?? false,
    validoDesde: paquete?.validoDesde?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    validoHasta: paquete?.validoHasta?.slice(0, 10) ?? new Date(Date.now() + 365 * 24 * 3600e3).toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/hospedajes', { params: { limit: 100 } }).then((r) => setHospedajes(r.data?.items ?? r.data ?? []));
    api.get('/actividades', { params: { limit: 100 } }).then((r) => setActividades(r.data?.items ?? r.data ?? []));
    api.get('/vehiculos', { params: { limit: 100 } }).then((r) => setVehiculos(r.data?.items ?? r.data ?? []));
  }, []);

  useEffect(() => {
    if (!form.hospedajeId) {
      setHabitaciones([]);
      return;
    }
    api.get(`/hospedajes/${form.hospedajeId}/habitaciones`).then((r) => setHabitaciones(r.data ?? []));
  }, [form.hospedajeId]);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        actividadId: form.actividadId || undefined,
        vehiculoId: form.vehiculoId || undefined,
        descuentoPorcentaje: Number(form.descuentoPorcentaje),
        diasDuracion: Number(form.diasDuracion),
        noches: Number(form.noches),
        validoDesde: new Date(form.validoDesde).toISOString(),
        validoHasta: new Date(form.validoHasta).toISOString(),
      };
      if (paquete) {
        await updatePaquete(paquete.id, payload);
      } else {
        await createPaquete(payload);
      }
      router.push('/admin/paquetes');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar');
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors';
  const labelCls = 'block text-sm font-body font-medium text-navy-700 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-8 space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nombre</label>
          <input
            className={inputCls}
            value={form.nombre}
            onChange={(e) => {
              setField('nombre', e.target.value);
              if (!paquete) setField('slug', slugify(e.target.value));
            }}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input className={inputCls} value={form.slug} onChange={(e) => setField('slug', e.target.value)} required />
        </div>
      </div>

      <div>
        <label className={labelCls}>Descripción</label>
        <textarea className={inputCls + ' min-h-[100px]'} value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Hospedaje</label>
          <select className={inputCls} value={form.hospedajeId} onChange={(e) => { setField('hospedajeId', e.target.value); setField('habitacionId', ''); }} required>
            <option value="">— Seleccionar —</option>
            {hospedajes.map((h) => <option key={h.id} value={h.id}>{h.nombre} ({h.ciudad})</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Habitación</label>
          <select className={inputCls} value={form.habitacionId} onChange={(e) => setField('habitacionId', e.target.value)} required disabled={!form.hospedajeId}>
            <option value="">— Seleccionar —</option>
            {habitaciones.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Actividad (opcional)</label>
          <select className={inputCls} value={form.actividadId ?? ''} onChange={(e) => setField('actividadId', e.target.value)}>
            <option value="">— Ninguna —</option>
            {actividades.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Vehículo (opcional)</label>
          <select className={inputCls} value={form.vehiculoId ?? ''} onChange={(e) => setField('vehiculoId', e.target.value)}>
            <option value="">— Ninguno —</option>
            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Días</label>
          <input type="number" min={1} max={30} className={inputCls} value={form.diasDuracion} onChange={(e) => setField('diasDuracion', Number(e.target.value))} required />
        </div>
        <div>
          <label className={labelCls}>Noches</label>
          <input type="number" min={0} max={29} className={inputCls} value={form.noches} onChange={(e) => setField('noches', Number(e.target.value))} required />
        </div>
        <div>
          <label className={labelCls}>Descuento %</label>
          <input type="number" min={0} max={50} step={0.5} className={inputCls} value={form.descuentoPorcentaje} onChange={(e) => setField('descuentoPorcentaje', Number(e.target.value))} />
        </div>
        <div className="flex items-end">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm font-body text-navy-700">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} />
              Destacado
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Válido desde</label>
          <input type="date" className={inputCls} value={form.validoDesde} onChange={(e) => setField('validoDesde', e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Válido hasta</label>
          <input type="date" className={inputCls} value={form.validoHasta} onChange={(e) => setField('validoHasta', e.target.value)} required />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="flex justify-end gap-3 pt-4 border-t border-navy-100/50">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50 font-body">Cancelar</button>
        <button type="submit" disabled={submitting} className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50">
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Crear `/admin/paquetes/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listPaquetes, deletePaquete } from '@/services/paquetes.service';
import type { Paquete } from '@/types/paquete';
import { formatPrice } from '@/lib/format-price';

export default function AdminPaquetesPage() {
  const [items, setItems] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { items } = await listPaquetes({ limit: 100 });
    setItems(items);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar paquete?')) return;
    await deletePaquete(id);
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-800">Paquetes</h1>
          <p className="text-sm text-navy-400 font-body mt-1">Gestión de paquetes turísticos</p>
        </div>
        <Link href="/admin/paquetes/nuevo" className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold shadow-sm">
          + Nuevo paquete
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-navy-400">Cargando...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-navy-100/50">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-navy-100/50">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Nombre</th>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Días</th>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Descuento</th>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Desde</th>
                <th className="text-right px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-navy-100/30 hover:bg-navy-50/40 transition-colors">
                  <td className="px-4 py-3 text-sm font-body text-navy-700">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm font-body text-navy-700">{p.diasDuracion}</td>
                  <td className="px-4 py-3 text-sm font-body text-navy-700">{p.descuentoPorcentaje}%</td>
                  <td className="px-4 py-3 text-sm font-body text-gold-500 font-semibold">{formatPrice(p.precioDesde ?? 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/paquetes/${p.id}`} className="text-sm text-navy-600 hover:text-navy-800 mr-3">Editar</Link>
                    <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:text-red-700">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Crear `/admin/paquetes/nuevo/page.tsx`**

```tsx
import { PaqueteForm } from '@/components/paquetes/paquete-form';

export default function NuevoPaquetePage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-800 mb-6">Nuevo paquete</h1>
      <PaqueteForm isAdmin />
    </div>
  );
}
```

- [ ] **Step 4: Crear `/admin/paquetes/[id]/page.tsx`**

```tsx
import { getPaqueteBySlug } from '@/services/paquetes.service';
import api from '@/lib/axios';
import { PaqueteForm } from '@/components/paquetes/paquete-form';

export default async function EditarPaquetePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Buscar por id (asumiendo endpoint, o filtrar listado)
  const { data } = await api.get(`/paquetes/${id}`).catch(() => ({ data: null }));
  if (!data) return <p className="text-navy-400">Paquete no encontrado</p>;
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-800 mb-6">Editar paquete</h1>
      <PaqueteForm paquete={data} isAdmin />
    </div>
  );
}
```

Nota: si el endpoint detalle solo acepta slug, agregar también un `GET /paquetes/id/:id` en el backend, o adaptar para buscar por slug.

- [ ] **Step 5: Agregar item "Paquetes" al sidebar admin en la sección "Catálogo"** (Tarea 5.1 ya repintó el sidebar — solo agregar el item al array de nav).

- [ ] **Step 5: Smoke test**

Crear un paquete desde /admin/paquetes/nuevo. Verificar que aparece en /paquetes (página pública) y que `/paquetes/[slug]` carga.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/components/paquetes/paquete-form.tsx frontend/src/app/admin/paquetes/
git commit -m "feat(admin): CRUD de paquetes en panel admin"
```

### Tarea 6.8: Replicar CRUD en /proveedor y /agencia

**Files:**
- Create: `frontend/src/app/proveedor/paquetes/page.tsx`, `nuevo/page.tsx`, `[id]/page.tsx`
- Create: `frontend/src/app/agencia/paquetes/page.tsx`, `nuevo/page.tsx`, `[id]/page.tsx`

- [ ] **Step 1: Reutilizar `PaqueteForm`**

Las páginas son casi idénticas a las de admin, pero el listado filtra `proveedorId === currentUserId` (esto se hace en backend automáticamente: el endpoint `findAll` puede recibir filtro por proveedor; alternativamente, agregar `?proveedorId=me` en el query string).

- [ ] **Step 2: Agregar item "Paquetes" al sidebar proveedor y agencia**

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/app/proveedor/paquetes frontend/src/app/agencia/paquetes
git commit -m "feat(panels): CRUD de paquetes en proveedor y agencia"
```

### Tarea 6.9: Fin de Fase 6

- [ ] **Step 1: Smoke test end-to-end**

- Como admin, crear un paquete.
- Marcarlo como `isFeatured`.
- Recargar home /. Verificar que aparece en FeaturedPackages.
- Click en la card → llega a /paquetes/[slug].
- Sticky muestra precio formateado y CTA reservar.

- [ ] **Step 2: Sin commit. Fin de Fase 6.**

---

## Fase 7 — Integración Stripe

Reemplaza el modal de pago simulado por Stripe Checkout hosteado + webhooks. Cliente paga real (en modo test) y la reserva se confirma vía webhook.

### Tarea 7.1: Instalar dependencias Stripe

**Files:**
- Modify: `backend/package.json`
- Modify: `frontend/package.json`

- [ ] **Step 1: Backend**

```powershell
docker compose --env-file .env.docker exec backend npm install stripe --legacy-peer-deps
```

- [ ] **Step 2: Frontend (opcional — solo si se usa Elements en el futuro)**

```powershell
cd frontend
npm install @stripe/stripe-js --legacy-peer-deps
cd ..
```

- [ ] **Step 3: Commit**

```powershell
git add backend/package.json backend/package-lock.json frontend/package.json frontend/package-lock.json
git commit -m "chore: instalar stripe (backend) y @stripe/stripe-js (frontend)"
```

### Tarea 7.2: Migración Prisma con campos Stripe en `Pago`

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Verificar el modelo Pago actual**

```powershell
Select-String -Path backend/prisma/schema.prisma -Pattern "^model Pago" -Context 0,20
```
Notar que ya existe `stripePaymentId String?`. Agregamos los demás campos.

- [ ] **Step 2: Editar el modelo Pago**

En `model Pago`, dentro del bloque de campos, agregar:

```prisma
  stripeSessionId   String?  @unique @map("stripe_session_id")
  stripeCheckoutUrl String?  @map("stripe_checkout_url")
  stripeEventLog    Json?    @map("stripe_event_log")
```

(El existente `stripePaymentId` ya cubre el `payment_intent`.)

- [ ] **Step 3: Modificar el enum `MetodoPago`**

Reemplazar:
```prisma
enum MetodoPago {
  TARJETA
  YAPPY
  TRANSFERENCIA
  EFECTIVO
}
```
por:
```prisma
enum MetodoPago {
  STRIPE
  TARJETA       // legacy, mantenido por compatibilidad de datos existentes
  YAPPY         // legacy
  TRANSFERENCIA // legacy
  EFECTIVO      // legacy
}
```

Los valores viejos se conservan para que el dump SQL existente no rompa. Solo se usa `STRIPE` en nuevas reservas.

- [ ] **Step 4: Crear tabla `StripeEvent` para idempotencia**

Al final del schema:

```prisma
model StripeEvent {
  id          String   @id @default(uuid())
  stripeEventId String  @unique @map("stripe_event_id")
  type        String
  processedAt DateTime @default(now()) @map("processed_at")
  payload     Json

  @@map("stripe_events")
}
```

- [ ] **Step 5: Generar migración**

```powershell
docker compose --env-file .env.docker exec backend npx prisma migrate dev --name add_stripe_fields
```

- [ ] **Step 6: Commit**

```powershell
git add backend/prisma/
git commit -m "feat(db): campos Stripe en Pago y tabla StripeEvent"
```

### Tarea 7.3: Crear módulo `StripeService`

**Files:**
- Create: `backend/src/modules/stripe/stripe.module.ts`
- Create: `backend/src/modules/stripe/stripe.service.ts`
- Create: `backend/src/modules/stripe/dto/checkout-session.dto.ts`

- [ ] **Step 1: Crear `dto/checkout-session.dto.ts`**

```ts
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  reservaId!: string;

  @IsNumber()
  @Min(0.5)
  amount!: number; // en USD, ej. 199.50

  @IsString()
  @IsOptional()
  description?: string;
}
```

- [ ] **Step 2: Crear `stripe.service.ts`**

```ts
import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
    this.stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  }

  toCents(amountUsd: number): number {
    return Math.round(amountUsd * 100);
  }

  async createCheckoutSession(params: {
    reservaId: string;
    amount: number;
    description?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY ?? 'usd',
            product_data: { name: params.description ?? `Reserva ${params.reservaId}` },
            unit_amount: this.toCents(params.amount),
          },
          quantity: 1,
        },
      ],
      metadata: { reservaId: params.reservaId },
      success_url: params.successUrl.replace('{RESERVA_ID}', params.reservaId),
      cancel_url: params.cancelUrl.replace('{RESERVA_ID}', params.reservaId),
    });
    if (!session.url) throw new Error('Stripe devolvió session sin URL');
    return { url: session.url, sessionId: session.id };
  }

  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no configurada');
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  async refund(paymentIntentId: string): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({ payment_intent: paymentIntentId });
  }
}
```

- [ ] **Step 3: Crear `stripe.module.ts`**

```ts
import { Global, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Global()
@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
```

- [ ] **Step 4: Registrar en `app.module.ts`**

Agregar `StripeModule` al array `imports`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/modules/stripe/ backend/src/app.module.ts
git commit -m "feat(stripe): modulo StripeService con createCheckoutSession y verifyWebhook"
```

### Tarea 7.4: Test unitario del helper `toCents`

**Files:**
- Create: `backend/src/modules/stripe/stripe.service.spec.ts`

- [ ] **Step 1: Crear el test**

```ts
import { StripeService } from './stripe.service';

describe('StripeService.toCents', () => {
  let svc: StripeService;
  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    svc = new StripeService();
  });

  it('1 USD = 100 cents', () => {
    expect(svc.toCents(1)).toBe(100);
  });

  it('redondea decimales correctamente', () => {
    expect(svc.toCents(1.005)).toBe(101);
    expect(svc.toCents(1.004)).toBe(100);
  });

  it('maneja amounts grandes', () => {
    expect(svc.toCents(12345.67)).toBe(1234567);
  });
});
```

- [ ] **Step 2: Correr**

```powershell
docker compose --env-file .env.docker exec backend npm run test -- stripe.service.spec
```
Expected: 3 tests pasan.

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/stripe/stripe.service.spec.ts
git commit -m "test(stripe): unit test del helper toCents"
```

### Tarea 7.5: Endpoint `POST /pagos/checkout`

**Files:**
- Modify: `backend/src/modules/pagos/pagos.service.ts`
- Modify: `backend/src/modules/pagos/pagos.controller.ts`
- Modify: `backend/src/modules/pagos/pagos.module.ts`

- [ ] **Step 1: Importar `StripeService` en `PagosModule`**

```ts
imports: [PrismaModule],
providers: [PagosService],
```
(StripeModule es global, basta inyectar `StripeService`.)

- [ ] **Step 2: Agregar método en `PagosService`**

```ts
import { StripeService } from '../stripe/stripe.service';

// en el constructor:
constructor(private readonly prisma: PrismaService, private readonly stripe: StripeService) {}

async createCheckoutSession(reservaId: string, userId: string) {
  const reserva = await this.prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { cliente: true },
  });
  if (!reserva) throw new NotFoundException('Reserva no encontrada');
  if (reserva.clienteId !== userId) throw new ForbiddenException();
  if (reserva.estado !== 'PENDIENTE') {
    throw new BadRequestException('La reserva no está pendiente de pago');
  }

  const session = await this.stripe.createCheckoutSession({
    reservaId,
    amount: Number(reserva.total),
    description: `TuriDove — Reserva ${reserva.codigo}`,
    successUrl: process.env.STRIPE_SUCCESS_URL!,
    cancelUrl: process.env.STRIPE_CANCEL_URL!,
  });

  await this.prisma.pago.create({
    data: {
      reservaId,
      userId,
      monto: reserva.total,
      moneda: 'USD',
      metodo: 'STRIPE',
      estado: 'PENDIENTE',
      stripeSessionId: session.sessionId,
      stripeCheckoutUrl: session.url,
    },
  });

  return { url: session.url, sessionId: session.sessionId };
}
```

- [ ] **Step 3: Agregar endpoint en `PagosController`**

```ts
@Post('checkout/:reservaId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLIENTE', 'ADMIN')
async createCheckout(@Param('reservaId') reservaId: string, @Req() req: any) {
  return this.pagosService.createCheckoutSession(reservaId, req.user.id);
}
```

- [ ] **Step 4: Rebuild y verificar**

```powershell
docker compose --env-file .env.docker restart backend
docker compose --env-file .env.docker logs backend --tail 20
```

- [ ] **Step 5: Commit**

```powershell
git add backend/src/modules/pagos/
git commit -m "feat(pagos): endpoint POST /pagos/checkout/:reservaId con Stripe"
```

### Tarea 7.6: Webhook `POST /pagos/webhook` con verificación de firma

**Files:**
- Modify: `backend/src/main.ts` (raw body para webhook)
- Modify: `backend/src/modules/pagos/pagos.controller.ts`
- Modify: `backend/src/modules/pagos/pagos.service.ts`

- [ ] **Step 1: Configurar raw body en `main.ts`**

```ts
import { json, raw } from 'express';

// despues de NestFactory.create(AppModule, { rawBody: true })
// O alternativamente, usar body parser raw para la ruta del webhook:

app.use('/api/v1/pagos/webhook', raw({ type: 'application/json' }));
```

- [ ] **Step 2: Agregar endpoint webhook en el controller**

```ts
import { Public } from '../auth/public.decorator'; // si existe

@Post('webhook')
@Public()
async webhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
  return this.pagosService.handleWebhook(req.body, signature);
}
```

Si no existe `@Public()`, asegurar que el JwtAuthGuard global no lo bloquee (excluir ruta en el guard, o usar `@SkipAuth()` apropiado al proyecto).

- [ ] **Step 3: Agregar `handleWebhook` en el service**

```ts
async handleWebhook(rawBody: Buffer, signature: string) {
  const event = this.stripe.verifyWebhook(rawBody, signature);

  // Idempotencia
  const existing = await this.prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing) return { received: true, alreadyProcessed: true };

  await this.prisma.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      payload: event as any,
    },
  });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const reservaId = session.metadata?.reservaId;
      if (!reservaId) break;
      await this.prisma.pago.updateMany({
        where: { stripeSessionId: session.id },
        data: { estado: 'COMPLETADO', stripePaymentId: session.payment_intent },
      });
      await this.prisma.reserva.update({
        where: { id: reservaId },
        data: { estado: 'CONFIRMADA' },
      });
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object as any;
      const reservaId = session.metadata?.reservaId;
      if (!reservaId) break;
      await this.prisma.pago.updateMany({
        where: { stripeSessionId: session.id },
        data: { estado: 'FALLIDO' },
      });
      await this.prisma.reserva.update({
        where: { id: reservaId },
        data: { estado: 'CANCELADA' },
      });
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as any;
      await this.prisma.pago.updateMany({
        where: { stripePaymentId: intent.id },
        data: { estado: 'FALLIDO' },
      });
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as any;
      await this.prisma.pago.updateMany({
        where: { stripePaymentId: charge.payment_intent },
        data: { estado: 'REEMBOLSADO' },
      });
      break;
    }
  }

  return { received: true };
}
```

Ajustar nombres exactos de los enums de estado (`COMPLETADO`/`PENDIENTE`/`FALLIDO`/`REEMBOLSADO`) a los del proyecto (`Get-Content backend/prisma/schema.prisma | Select-String "enum EstadoPago" -Context 0,8`).

- [ ] **Step 4: Verificar en Swagger**

http://localhost:3001/api/docs → `POST /pagos/webhook`.

- [ ] **Step 5: Probar el webhook localmente con Stripe CLI (opcional pero recomendado)**

Si el usuario tiene Stripe CLI instalado:
```powershell
stripe login
stripe listen --forward-to localhost:3001/api/v1/pagos/webhook
```
Documentar el `whsec_...` que devuelve y colocarlo en `STRIPE_WEBHOOK_SECRET` del `.env.docker`.

Si no tiene Stripe CLI, omitir y depender solo del redirect.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/
git commit -m "feat(stripe): webhook con verificacion de firma e idempotencia"
```

### Tarea 7.7: Endpoint de reembolso vía Stripe

**Files:**
- Modify: `backend/src/modules/pagos/pagos.service.ts`
- Modify: `backend/src/modules/pagos/pagos.controller.ts`

- [ ] **Step 1: Reescribir `reembolsar` en el service**

```ts
async reembolsar(pagoId: string) {
  const pago = await this.prisma.pago.findUnique({ where: { id: pagoId } });
  if (!pago) throw new NotFoundException();
  if (!pago.stripePaymentId) throw new BadRequestException('Pago sin payment_intent de Stripe');
  if (pago.estado !== 'COMPLETADO') throw new BadRequestException('Solo se pueden reembolsar pagos completados');

  await this.stripe.refund(pago.stripePaymentId);
  // El estado se actualizará vía webhook charge.refunded; pero por seguridad lo marcamos ya
  return this.prisma.pago.update({ where: { id: pagoId }, data: { estado: 'REEMBOLSADO' } });
}
```

- [ ] **Step 2: Asegurar endpoint POST `/pagos/:id/reembolso` solo ADMIN**

Ya existe en el proyecto (Tarea inicial del README menciona "reembolso"). Verificar:
```powershell
Select-String -Path backend/src/modules/pagos/pagos.controller.ts -Pattern "reembolso"
```
Si no existe, agregarlo con `@Roles('ADMIN')`.

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/pagos/
git commit -m "feat(stripe): reembolso usando stripe.refunds.create"
```

### Tarea 7.8: Frontend — reemplazar `PaymentModal` con `CheckoutSummary`

**Files:**
- Create: `frontend/src/components/shared/checkout-summary.tsx`
- Create: `frontend/src/services/stripe.service.ts`
- Modify: páginas/componentes que importan `payment-modal`
- Delete: `frontend/src/components/shared/payment-modal.tsx` (al final)

- [ ] **Step 1: Crear `services/stripe.service.ts`**

```ts
import api from '@/lib/axios';

export async function createCheckoutSession(reservaId: string): Promise<{ url: string }> {
  const { data } = await api.post(`/pagos/checkout/${reservaId}`);
  return data;
}
```

- [ ] **Step 2: Crear `checkout-summary.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { createCheckoutSession } from '@/services/stripe.service';
import { formatPriceWithCents } from '@/lib/format-price';

interface CheckoutSummaryProps {
  reservaId: string;
  total: number;
  description: string;
}

export function CheckoutSummary({ reservaId, total, description }: CheckoutSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(reservaId);
      window.location.href = url;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al iniciar el pago');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 max-w-md w-full">
      <h2 className="text-xl font-display font-bold text-navy-800 mb-1">Resumen del pago</h2>
      <p className="text-sm text-navy-400 font-body mb-6">{description}</p>

      <div className="flex items-center justify-between py-4 border-y border-navy-100/50 mb-6">
        <span className="text-sm text-navy-600 font-body">Total a pagar</span>
        <span className="text-2xl font-display font-bold text-navy-800">
          {formatPriceWithCents(total)}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        {loading ? 'Redirigiendo...' : 'Pagar con tarjeta'}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-navy-400 font-body">
        <ShieldCheck className="w-3.5 h-3.5" />
        Procesado de forma segura por Stripe
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Buscar todos los usos del viejo `payment-modal`**

```powershell
Select-String -Path frontend/src -Pattern "payment-modal|PaymentModal" -Recurse
```

- [ ] **Step 4: Reemplazar cada uso por `CheckoutSummary`**

En cada componente que usaba `PaymentModal`, sustituir el render por una página o modal con `CheckoutSummary`. La diferencia clave: ya no es un modal con métodos, es un summary con botón único de pago.

Patrón en pantalla de "Confirmar reserva":
```tsx
<CheckoutSummary reservaId={reserva.id} total={Number(reserva.total)} description={`Reserva ${reserva.codigo}`} />
```

- [ ] **Step 5: Eliminar `payment-modal.tsx`**

```powershell
Remove-Item frontend/src/components/shared/payment-modal.tsx
```

- [ ] **Step 6: Commit**

```powershell
git add frontend/src
git commit -m "feat(frontend): CheckoutSummary que reemplaza payment-modal con Stripe"
```

### Tarea 7.9: Páginas de éxito y cancelado

**Files:**
- Create: `frontend/src/app/(public)/reservas/[id]/pago/exito/page.tsx`
- Create: `frontend/src/app/(public)/reservas/[id]/pago/cancelado/page.tsx`

- [ ] **Step 1: Crear página éxito**

```tsx
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default async function PagoExitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-gold-400 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-navy-800 mb-2">¡Pago recibido!</h1>
        <p className="text-sm text-navy-500 font-body mb-6">
          Recibimos tu pago. Tu reserva está confirmada y te enviaremos los detalles por email.
        </p>
        <Link
          href="/cliente/reservas"
          className="inline-flex px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm"
        >
          Ver mis reservas
        </Link>
        <p className="text-xs text-navy-400 font-body mt-4">Referencia: {id}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear página cancelado**

```tsx
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default async function PagoCanceladoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <XCircle className="w-16 h-16 text-navy-400 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-navy-800 mb-2">Pago cancelado</h1>
        <p className="text-sm text-navy-500 font-body mb-6">
          El pago fue cancelado. Tu reserva sigue pendiente y puedes reintentarla.
        </p>
        <Link
          href={`/cliente/reservas/${id}`}
          className="inline-flex px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm"
        >
          Reintentar pago
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/app/(public)/reservas
git commit -m "feat(stripe): paginas de exito y cancelado de pago"
```

### Tarea 7.10: Smoke test end-to-end Stripe

- [ ] **Step 1: Configurar `.env.docker` con claves de test reales**

El usuario debe crear cuenta en https://stripe.com y obtener:
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_PUBLIC_KEY=pk_test_...`

Reemplazar en `.env.docker`. Reiniciar backend:
```powershell
docker compose --env-file .env.docker restart backend
```

- [ ] **Step 2: Iniciar Stripe CLI para webhooks locales**

```powershell
stripe listen --forward-to localhost:3001/api/v1/pagos/webhook
```
Copiar el `whsec_...` que devuelve a `STRIPE_WEBHOOK_SECRET` en `.env.docker` y reiniciar backend.

- [ ] **Step 3: Flujo de prueba en navegador**

1. Loguear como cliente.
2. Reservar un paquete (o un hospedaje).
3. En la pantalla "Resumen del pago", click "Pagar con tarjeta".
4. Llegar a Stripe Checkout (URL `checkout.stripe.com/...`).
5. Tarjeta de prueba: `4242 4242 4242 4242`, fecha futura cualquiera, CVC cualquiera.
6. Stripe redirige a `/reservas/[id]/pago/exito`.
7. En la terminal de Stripe CLI debe aparecer `checkout.session.completed` enviado al backend.
8. Verificar en BD que `reserva.estado = 'CONFIRMADA'` y `pago.estado = 'COMPLETADO'`.

```powershell
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "SELECT id, estado FROM reservas ORDER BY created_at DESC LIMIT 5;"
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "SELECT id, estado, stripe_session_id IS NOT NULL AS has_session FROM pagos ORDER BY created_at DESC LIMIT 5;"
```

- [ ] **Step 4: Probar reembolso desde admin**

Loguear como admin → /admin/pagos → reembolsar el pago anterior. Verificar:
- Webhook `charge.refunded` llega.
- `pago.estado = 'REEMBOLSADO'`.

- [ ] **Step 5: Fin de Fase 7. Sin commit.**

---

## Fase 8 — Seed internacional

Reemplaza el seed actual (16 hospedajes panameños) por uno mínimo con 6 destinos internacionales, descarga imágenes vía script, y regenera el dump SQL para que `setup.sh` levante TuriDove poblado en el primer arranque.

### Tarea 8.1: Borrar imágenes seed antiguas

**Files:**
- Delete: `backend/uploads/*` (todos los archivos panameños del seed previo)

- [ ] **Step 1: Listar lo que hay**

```powershell
Get-ChildItem backend/uploads | Measure-Object | Select-Object Count
```

- [ ] **Step 2: Borrar el contenido (mantener el directorio)**

```powershell
Get-ChildItem -Path backend/uploads -File | Remove-Item -Force
```

- [ ] **Step 3: Crear `.gitkeep` para preservar el directorio**

```powershell
New-Item -ItemType File -Path backend/uploads/.gitkeep -Force | Out-Null
```

- [ ] **Step 4: Commit**

```powershell
git add backend/uploads/
git commit -m "chore(seed): limpiar imagenes antiguas de Agroturismo"
```

### Tarea 8.2: Crear `seed-images.ts` (descarga desde Unsplash)

**Files:**
- Create: `backend/prisma/seed-images.ts`

- [ ] **Step 1: Crear el script**

```ts
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

interface ImageSpec {
  filename: string;
  query: string;
  width?: number;
  height?: number;
}

// Imagenes deterministas de Unsplash usando source.unsplash.com (no requiere API key)
// NOTA: source.unsplash.com fue deprecado a fines de 2024. Como alternativa:
// 1) Usar Unsplash API con CLIENT_ID (requiere registro gratis).
// 2) Caer en placeholder si fail.

const IMAGES: ImageSpec[] = [
  { filename: 'paris-hotel-1.jpg', query: 'paris,hotel,luxury' },
  { filename: 'paris-activity-1.jpg', query: 'paris,eiffel,tour' },
  { filename: 'roma-hotel-1.jpg', query: 'rome,hotel,boutique' },
  { filename: 'roma-activity-1.jpg', query: 'rome,colosseum' },
  { filename: 'tokio-hotel-1.jpg', query: 'tokyo,hotel,modern' },
  { filename: 'tokio-activity-1.jpg', query: 'tokyo,shrine' },
  { filename: 'newyork-hotel-1.jpg', query: 'newyork,hotel,manhattan' },
  { filename: 'newyork-activity-1.jpg', query: 'newyork,statue,liberty' },
  { filename: 'santorini-hotel-1.jpg', query: 'santorini,hotel,greece' },
  { filename: 'santorini-activity-1.jpg', query: 'santorini,sunset' },
  { filename: 'marrakech-hotel-1.jpg', query: 'marrakech,riad' },
  { filename: 'marrakech-activity-1.jpg', query: 'marrakech,medina' },
  { filename: 'vehicle-car.jpg', query: 'car,rental,europe' },
  { filename: 'vehicle-van.jpg', query: 'van,minivan' },
  { filename: 'vehicle-suv.jpg', query: 'suv,toyota' },
  { filename: 'vehicle-motorcycle.jpg', query: 'motorcycle,touring' },
  { filename: 'paquete-paris.jpg', query: 'paris,romantic,trip' },
  { filename: 'paquete-roma.jpg', query: 'rome,vacation' },
  { filename: 'paquete-santorini.jpg', query: 'santorini,vacation' },
];

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        download(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function fetchUnsplashUrl(query: string): Promise<string | null> {
  if (!UNSPLASH_KEY) return null;
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.unsplash.com',
      path: `/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.urls?.regular ?? null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  for (const img of IMAGES) {
    const dest = path.join(UPLOADS_DIR, img.filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) {
      console.log(`✓ ${img.filename} (cache)`);
      continue;
    }

    let url: string | null = null;
    if (UNSPLASH_KEY) {
      url = await fetchUnsplashUrl(img.query);
    }
    if (!url) {
      // Fallback: usar picsum.photos como placeholder elegante
      url = `https://picsum.photos/seed/${encodeURIComponent(img.filename)}/1200/800`;
    }

    try {
      await download(url, dest);
      console.log(`✓ ${img.filename} <- ${url.slice(0, 60)}`);
    } catch (err) {
      console.warn(`✗ ${img.filename}: ${(err as Error).message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Probar el script**

```powershell
docker compose --env-file .env.docker exec backend npx tsx prisma/seed-images.ts
```
Expected: descarga ~19 imágenes a `backend/uploads/`. Si no hay `UNSPLASH_ACCESS_KEY`, usa picsum como fallback (suficiente para demo).

- [ ] **Step 3: Verificar**

```powershell
Get-ChildItem backend/uploads | Measure-Object | Select-Object Count
```
Expected: ~19 archivos + `.gitkeep`.

- [ ] **Step 4: Commit**

```powershell
git add backend/prisma/seed-images.ts backend/uploads/
git commit -m "feat(seed): script seed-images con Unsplash y fallback picsum"
```

### Tarea 8.3: Reescribir el seeder `seed-turidove.ts`

**Files:**
- Create: `backend/prisma/seed-turidove.ts`
- Modify: `backend/package.json` (cambiar `prisma.seed` a apuntar al nuevo archivo)

- [ ] **Step 1: Inspeccionar el seed existente para entender el patrón de hash y orden**

```powershell
Get-Content backend/prisma/seed.ts | Select-Object -First 60
```

- [ ] **Step 2: Crear `seed-turidove.ts`**

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TuriDove...');

  // --- Usuarios ---
  const hash = (pwd: string) => bcrypt.hash(pwd, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@turidove.com' },
    update: {},
    create: {
      email: 'admin@turidove.com',
      password: await hash('Admin123!'),
      nombre: 'Admin TuriDove',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const parisProv = await prisma.user.upsert({
    where: { email: 'paris.provider@turidove.com' },
    update: {},
    create: {
      email: 'paris.provider@turidove.com',
      password: await hash('Provider123!'),
      nombre: 'París Provider',
      role: 'PROVEEDOR',
      isActive: true,
    },
  });

  const asiaProv = await prisma.user.upsert({
    where: { email: 'asia.provider@turidove.com' },
    update: {},
    create: {
      email: 'asia.provider@turidove.com',
      password: await hash('Provider123!'),
      nombre: 'Asia Provider',
      role: 'PROVEEDOR',
      isActive: true,
    },
  });

  const boutiqueAg = await prisma.user.upsert({
    where: { email: 'boutique.agency@turidove.com' },
    update: {},
    create: {
      email: 'boutique.agency@turidove.com',
      password: await hash('Agency123!'),
      nombre: 'Boutique Agency',
      role: 'AGENCIA',
      isActive: true,
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@turidove.com' },
    update: {},
    create: {
      email: 'operator@turidove.com',
      password: await hash('Operator123!'),
      nombre: 'Operator',
      role: 'OPERADOR',
      isActive: true,
    },
  });

  const cliente1 = await prisma.user.upsert({
    where: { email: 'cliente1@example.com' },
    update: {},
    create: {
      email: 'cliente1@example.com',
      password: await hash('Client123!'),
      nombre: 'Cliente Uno',
      role: 'CLIENTE',
      isActive: true,
    },
  });

  const cliente2 = await prisma.user.upsert({
    where: { email: 'cliente2@example.com' },
    update: {},
    create: {
      email: 'cliente2@example.com',
      password: await hash('Client123!'),
      nombre: 'Cliente Dos',
      role: 'CLIENTE',
      isActive: true,
    },
  });

  console.log('✓ Usuarios');

  // --- Hospedajes (6 destinos) ---
  // NOTA: ajustar nombres de campos a los REALES del schema (`ciudad`, `pais`, `precioBase`...).
  const destinos = [
    { city: 'Paris', country: 'Francia', slug: 'paris-le-marais', name: 'Le Marais Boutique', image: '/uploads/paris-hotel-1.jpg', propietarioId: parisProv.id },
    { city: 'Roma', country: 'Italia', slug: 'roma-trastevere', name: 'Trastevere Suites', image: '/uploads/roma-hotel-1.jpg', propietarioId: parisProv.id },
    { city: 'Tokio', country: 'Japón', slug: 'tokio-shibuya', name: 'Shibuya Modern', image: '/uploads/tokio-hotel-1.jpg', propietarioId: asiaProv.id },
    { city: 'Nueva York', country: 'EE.UU.', slug: 'nyc-midtown', name: 'Midtown Premier', image: '/uploads/newyork-hotel-1.jpg', propietarioId: admin.id },
    { city: 'Santorini', country: 'Grecia', slug: 'santorini-cliff', name: 'Cliff View Santorini', image: '/uploads/santorini-hotel-1.jpg', propietarioId: boutiqueAg.id },
    { city: 'Marrakech', country: 'Marruecos', slug: 'marrakech-riad', name: 'Riad Yasmine', image: '/uploads/marrakech-hotel-1.jpg', propietarioId: boutiqueAg.id },
  ];

  for (const d of destinos) {
    await prisma.hospedaje.upsert({
      where: { slug: d.slug },
      update: {},
      create: {
        nombre: d.name,
        slug: d.slug,
        descripcion: `${d.name} en ${d.city}. Hotel boutique con encanto local.`,
        ciudad: d.city,
        pais: d.country,
        direccion: `${d.city}, ${d.country}`,
        imagenPrincipal: d.image,
        propietarioId: d.propietarioId,
        isFeatured: true,
        isActive: true,
      },
    });
  }
  console.log('✓ Hospedajes');

  // --- Habitaciones (2 por hospedaje) + Tarifas ---
  const hospedajes = await prisma.hospedaje.findMany({ where: { slug: { in: destinos.map((d) => d.slug) } } });
  for (const h of hospedajes) {
    await prisma.habitacion.upsert({
      where: { slug: `${h.slug}-doble` },
      update: {},
      create: {
        hospedajeId: h.id,
        nombre: 'Doble Estándar',
        slug: `${h.slug}-doble`,
        tipo: 'DOBLE',
        capacidad: 2,
        precio: 180,
      },
    });
    await prisma.habitacion.upsert({
      where: { slug: `${h.slug}-suite` },
      update: {},
      create: {
        hospedajeId: h.id,
        nombre: 'Suite Premium',
        slug: `${h.slug}-suite`,
        tipo: 'SUITE',
        capacidad: 4,
        precio: 320,
      },
    });
  }
  console.log('✓ Habitaciones');

  // --- Actividades (1 por destino, 3 featured) ---
  const actividades = [
    { city: 'Paris', name: 'Tour Torre Eiffel', slug: 'tour-eiffel', precio: 80, featured: true, image: '/uploads/paris-activity-1.jpg' },
    { city: 'Roma', name: 'Coliseo y Foro', slug: 'coliseo-foro', precio: 90, featured: true, image: '/uploads/roma-activity-1.jpg' },
    { city: 'Tokio', name: 'Templo Senso-ji', slug: 'senso-ji', precio: 70, featured: true, image: '/uploads/tokio-activity-1.jpg' },
    { city: 'Nueva York', name: 'Estatua de la Libertad', slug: 'estatua-libertad', precio: 95, featured: false, image: '/uploads/newyork-activity-1.jpg' },
    { city: 'Santorini', name: 'Atardecer en Oia', slug: 'atardecer-oia', precio: 60, featured: false, image: '/uploads/santorini-activity-1.jpg' },
    { city: 'Marrakech', name: 'Medina y Zoco', slug: 'medina-zoco', precio: 55, featured: false, image: '/uploads/marrakech-activity-1.jpg' },
  ];

  for (const a of actividades) {
    await prisma.actividad.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        nombre: a.name,
        slug: a.slug,
        descripcion: `${a.name} en ${a.city}.`,
        ciudad: a.city,
        duracion: 3,
        precio: a.precio,
        isFeatured: a.featured,
        isActive: true,
        imagenPrincipal: a.image,
      },
    });
  }
  console.log('✓ Actividades');

  // --- Vehículos (4) ---
  const vehiculos = [
    { marca: 'Renault', modelo: 'Clio', tipo: 'CAR', capacidad: 4, precio: 60, city: 'Paris', image: '/uploads/vehicle-car.jpg' },
    { marca: 'Fiat', modelo: 'Doblo', tipo: 'VAN', capacidad: 7, precio: 90, city: 'Roma', image: '/uploads/vehicle-van.jpg' },
    { marca: 'Toyota', modelo: 'RAV4', tipo: 'SUV', capacidad: 5, precio: 110, city: 'Nueva York', image: '/uploads/vehicle-suv.jpg' },
    { marca: 'Yamaha', modelo: 'MT-07', tipo: 'MOTOCICLETA', capacidad: 2, precio: 50, city: 'Santorini', image: '/uploads/vehicle-motorcycle.jpg' },
  ];

  for (const v of vehiculos) {
    await prisma.vehiculo.upsert({
      where: { placa: `TD-${v.modelo.toUpperCase()}` },
      update: {},
      create: {
        marca: v.marca,
        modelo: v.modelo,
        placa: `TD-${v.modelo.toUpperCase()}`,
        tipo: v.tipo as any,
        capacidad: v.capacidad,
        precioPorDia: v.precio,
        ciudad: v.city,
        imagenPrincipal: v.image,
        isActive: true,
      },
    });
  }
  console.log('✓ Vehiculos');

  // --- Transfers (3) ---
  const transfers = [
    { nombre: 'París CDG ↔ Hotel', origen: 'Aeropuerto CDG', destino: 'Centro París', precio: 70 },
    { nombre: 'Roma FCO ↔ Hotel', origen: 'Aeropuerto FCO', destino: 'Centro Roma', precio: 80 },
    { nombre: 'NY JFK ↔ Manhattan', origen: 'Aeropuerto JFK', destino: 'Manhattan', precio: 120 },
  ];
  for (const t of transfers) {
    await prisma.transfer.upsert({
      where: { nombre: t.nombre },
      update: {},
      create: {
        nombre: t.nombre,
        origen: t.origen,
        destino: t.destino,
        precio: t.precio,
        isActive: true,
      },
    });
  }
  console.log('✓ Transfers');

  // --- Paquetes (3 featured) ---
  const habs = await prisma.habitacion.findMany({ where: { slug: { in: ['paris-le-marais-doble', 'roma-trastevere-doble', 'santorini-cliff-suite'] } } });
  const acts = await prisma.actividad.findMany({ where: { slug: { in: ['tour-eiffel', 'coliseo-foro'] } } });
  const veh = await prisma.vehiculo.findFirst({ where: { placa: 'TD-DOBLO' } });

  const paquetes = [
    {
      nombre: 'París Esencial',
      slug: 'paris-esencial',
      descripcion: 'Tres noches en Le Marais + tour Eiffel.',
      hospedajeId: habs.find((h) => h.slug === 'paris-le-marais-doble')!.hospedajeId,
      habitacionId: habs.find((h) => h.slug === 'paris-le-marais-doble')!.id,
      actividadId: acts.find((a) => a.slug === 'tour-eiffel')!.id,
      vehiculoId: null as string | null,
      diasDuracion: 3,
      noches: 3,
      descuentoPorcentaje: 10,
      imagenPrincipal: '/uploads/paquete-paris.jpg',
    },
    {
      nombre: 'Roma Imperial',
      slug: 'roma-imperial',
      descripcion: 'Tres noches en Trastevere + Coliseo + van.',
      hospedajeId: habs.find((h) => h.slug === 'roma-trastevere-doble')!.hospedajeId,
      habitacionId: habs.find((h) => h.slug === 'roma-trastevere-doble')!.id,
      actividadId: acts.find((a) => a.slug === 'coliseo-foro')!.id,
      vehiculoId: veh?.id ?? null,
      diasDuracion: 3,
      noches: 3,
      descuentoPorcentaje: 15,
      imagenPrincipal: '/uploads/paquete-roma.jpg',
    },
    {
      nombre: 'Santorini Relax',
      slug: 'santorini-relax',
      descripcion: 'Cinco noches en Cliff View Suite.',
      hospedajeId: habs.find((h) => h.slug === 'santorini-cliff-suite')!.hospedajeId,
      habitacionId: habs.find((h) => h.slug === 'santorini-cliff-suite')!.id,
      actividadId: null as string | null,
      vehiculoId: null as string | null,
      diasDuracion: 5,
      noches: 5,
      descuentoPorcentaje: 5,
      imagenPrincipal: '/uploads/paquete-santorini.jpg',
    },
  ];

  const now = new Date();
  const validUntil = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  for (const p of paquetes) {
    await prisma.paquete.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        isFeatured: true,
        isActive: true,
        validoDesde: now,
        validoHasta: validUntil,
        proveedorId: admin.id,
      },
    });
  }
  console.log('✓ Paquetes');

  console.log('Seed completo. Usuarios:');
  console.log('  ADMIN: admin@turidove.com / Admin123!');
  console.log('  CLIENTE: cliente1@example.com / Client123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 3: Cambiar `prisma.seed` en `backend/package.json`**

Buscar:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```
Cambiar a:
```json
"prisma": { "seed": "ts-node prisma/seed-turidove.ts" }
```

(Si usa `tsx`, ajustar acorde.)

- [ ] **Step 4: Borrar la BD y correr el nuevo seed**

```powershell
docker compose --env-file .env.docker exec backend npx prisma migrate reset --force --skip-seed
docker compose --env-file .env.docker exec backend npx tsx prisma/seed-images.ts
docker compose --env-file .env.docker exec backend npx prisma db seed
```
Expected: BD limpia + imágenes en uploads + 6 hospedajes + 12 habitaciones + 6 actividades + 4 vehículos + 3 transfers + 3 paquetes.

- [ ] **Step 5: Verificar**

```powershell
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "SELECT count(*) FROM hospedajes;"
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "SELECT count(*) FROM paquetes;"
```
Expected: 6 hospedajes, 3 paquetes.

- [ ] **Step 6: Smoke test en navegador**

http://localhost:3000/ — verificar:
- FeaturedPackages muestra París Esencial, Roma Imperial, Santorini Relax.
- FeaturedActivities muestra Tour Eiffel, Coliseo y Foro, Senso-ji.
- AvailableVehicles muestra 3 de los 4 vehículos.
- PopularDestinations muestra los 6 destinos.

- [ ] **Step 7: Commit**

```powershell
git add backend/prisma/seed-turidove.ts backend/package.json
git commit -m "feat(seed): seed-turidove con 6 destinos internacionales, 3 paquetes"
```

### Tarea 8.4: Regenerar dump SQL para inicialización automática

**Files:**
- Modify: `docker/postgres/init/01-dump.sql`

- [ ] **Step 1: Verificar que el seed haya corrido correctamente**

```powershell
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "\dt"
```

- [ ] **Step 2: Generar el dump**

```powershell
docker compose --env-file .env.docker exec postgres pg_dump -U postgres -d turidove --no-owner --no-acl --inserts > docker/postgres/init/01-dump.sql
```

- [ ] **Step 3: Verificar tamaño y header del dump**

```powershell
Get-Item docker/postgres/init/01-dump.sql | Select-Object Length
Get-Content docker/postgres/init/01-dump.sql -TotalCount 10
```

- [ ] **Step 4: Probar reset completo + arranque limpio**

```powershell
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d
Start-Sleep -Seconds 20
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove -c "SELECT count(*) FROM hospedajes;"
```
Expected: 6 hospedajes (vienen del dump, no del seed).

- [ ] **Step 5: Commit**

```powershell
git add docker/postgres/init/01-dump.sql
git commit -m "chore(seed): regenerar dump SQL con datos TuriDove"
```

### Tarea 8.5: Actualizar README con credenciales nuevas

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Reemplazar la tabla de credenciales seed**

Buscar la tabla en README.md y reemplazar las filas con:

```markdown
| Rol | Email | Contraseña |
|-----|-------|-----------|
| ADMIN | `admin@turidove.com` | `Admin123!` |
| PROVEEDOR (París/Roma) | `paris.provider@turidove.com` | `Provider123!` |
| PROVEEDOR (Tokio) | `asia.provider@turidove.com` | `Provider123!` |
| AGENCIA (Santorini/Marrakech) | `boutique.agency@turidove.com` | `Agency123!` |
| OPERADOR | `operator@turidove.com` | `Operator123!` |
| CLIENTE | `cliente1@example.com` | `Client123!` |
| CLIENTE | `cliente2@example.com` | `Client123!` |
```

- [ ] **Step 2: Commit**

```powershell
git add README.md
git commit -m "docs: actualizar credenciales seed TuriDove"
```

### Tarea 8.6: Verificación final end-to-end

- [ ] **Step 1: Reset completo simulando primera instalación**

```powershell
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d --build
Start-Sleep -Seconds 30
```

- [ ] **Step 2: Verificar que `setup.ps1` también levanta limpio**

(Opcional) Documentar para el usuario el comando `./setup.ps1`.

- [ ] **Step 3: Smoke test global**

- http://localhost:3000/ se ve TuriDove premium con todas las secciones.
- Login `admin@turidove.com` / `Admin123!` funciona.
- /admin muestra dashboard con sidebar TuriDove + ADMIN.
- /admin/paquetes lista los 3 paquetes seed.
- Crear un nuevo paquete funciona.
- /paquetes lista 3 paquetes.
- Click en "París Esencial" abre el detalle.
- Logueado como cliente, click "Reservar paquete" → Stripe Checkout → tarjeta 4242 → webhook → reserva CONFIRMADA.
- Admin reembolsa el pago → estado REEMBOLSADO.

- [ ] **Step 4: Sin commit. Fin del plan.**

---

## Criterios de éxito (recordatorio del spec)

- `setup.ps1` arranca TuriDove sin intervención manual.
- `docker compose up -d` levanta y la BD se inicializa con destinos internacionales.
- Flujos existentes (reserva, dashboards por rol, auditoría) siguen funcionando.
- Home y paneles se ven boutique premium navy/gold/cream con Playfair/DM Sans.
- Módulo Paquetes funcional end-to-end.
- Stripe Checkout funciona en modo test con tarjeta 4242, webhook actualiza la BD, reembolso desde admin funciona.
- UI muestra USD en todas las páginas.
- Sin referencias visibles a Agroturismo/Panamá rural en código activo.
