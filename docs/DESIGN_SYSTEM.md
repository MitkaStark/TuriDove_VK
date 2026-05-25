# TuriTravel v2 — Manual de Identidad Visual y Design System

> **Propósito de este documento:** Permitir replicar 1:1 la identidad visual de TuriTravel v2 en otro proyecto. Contiene todos los tokens, valores, clases y patrones necesarios para reproducir el look & feel sin tener que abrir el código fuente original.
>
> **Stack visual:** Tailwind CSS 3 + Next.js 14 + Playfair Display (Google Fonts) + DM Sans (Google Fonts).
>
> **Lenguaje visual:** "Premium navy/gold turismo". Inspirado en branding de agencias de viaje boutique: serif elegante para titulares, sans humanista para cuerpo, paleta navy profundo + dorado champagne sobre crema cálido.

---

## 1. Paleta de colores

La paleta es el alma del sistema. Tres familias principales (`navy`, `gold`, `cream`) y un grupo de colores semánticos para estados.

### 1.1 Familia Navy (color principal — base, textos, fondos oscuros)

| Token | Hex | Uso recomendado |
|---|---|---|
| `navy-50` | `#EDF1F7` | Fondos de inputs sutiles, hover de items inactivos |
| `navy-100` | `#D1DAE8` | Bordes muy suaves (a menudo con opacidad `/50` o `/30`) |
| `navy-200` | `#A3B5D1` | Estrellas vacías, bordes de inputs |
| `navy-300` | `#7590BA` | Placeholders, texto deshabilitado |
| `navy-400` | `#4A6FA3` | Texto secundario, iconos inactivos, descripciones |
| `navy-500` | `#2B5592` | Texto de navegación, links secundarios |
| `navy-600` | `#1A365D` | **Color de texto principal del body** |
| `navy-700` | `#152C4D` | Fondos hero (gradiente), texto fuerte |
| `navy-800` | `#10213A` | **Color de todos los headings**, fondos oscuros |
| `navy-900` | `#0B1627` | Fondo del Footer, secciones más oscuras |

### 1.2 Familia Gold (color de acento — CTAs, marca)

| Token | Hex | Uso recomendado |
|---|---|---|
| `gold-50` | `#FDF9EF` | Fondo de items activos del sidebar (con opacidad `/80`) |
| `gold-100` | `#F9F0D9` | Backgrounds muy sutiles de acento |
| `gold-200` | `#F0DEB0` | — |
| `gold-300` | `#E7CB87` | Acento en H1 sobre fondo oscuro (cursiva del brand), pills sobre fotos |
| `gold-400` | `#D4A853` | **Color de acento principal**: logo, focus rings, indicador activo, estrellas |
| `gold-500` | `#C49A3D` | Hover del oro, link "Ver todos →" |
| `gold-600` | `#A67F2E` | Hover de links dorados en formularios |
| `gold-700` | `#886524` | Hover profundo (raro) |
| `gold-800` | `#6A4E1B` | — |
| `gold-900` | `#4C3712` | — |

### 1.3 Familia Cream (color de fondo cálido)

| Token | Hex | Uso recomendado |
|---|---|---|
| `cream` (DEFAULT) | `#FEFBF4` | **Fondo del body**, fondo del layout admin |
| `cream-100` | `#FDF8ED` | Fondo alternado de secciones |
| `cream-200` | `#FAF2DE` | Fondo más pronunciado, acentos cálidos |

### 1.4 Colores neutros y semánticos

| Uso | Token / Hex | Notas |
|---|---|---|
| Blanco puro | `#FFFFFF` | Fondos de cards, headers, secciones claras |
| Blanco translúcido | `white/95`, `white/80`, `white/50`, `white/30`, `white/15`, `white/10`, `white/5` | Textos y fondos sobre superficies oscuras (`/80` texto principal, `/50` secundario, `/30` deshabilitado, `/10`-`/15` superficies, `/5` cards sobre oscuro) |
| Éxito | `green-100` bg / `green-800` text / `green-200` border | Badge `CONFIRMED` |
| Advertencia | `yellow-100` bg / `yellow-800` text / `yellow-200` border | Badge `PENDING` |
| Error suave | `red-50` bg / `red-200` border / `red-700` text | Alerts de formularios, badge `EXPIRED` |
| Error fuerte | `red-200` bg / `red-900` text / `red-300` border | Badge `PAYMENT_FAILED` |
| Neutro inactivo | `gray-100` bg / `gray-600` text / `gray-200` border | Badge `CANCELLED` |
| Info | `purple-100` bg / `purple-800` text / `purple-200` border | Badge `REFUNDED` |

### 1.5 Configuración Tailwind exacta

```ts
// tailwind.config.ts
colors: {
  navy: {
    50: '#EDF1F7', 100: '#D1DAE8', 200: '#A3B5D1', 300: '#7590BA',
    400: '#4A6FA3', 500: '#2B5592', 600: '#1A365D', 700: '#152C4D',
    800: '#10213A', 900: '#0B1627',
  },
  gold: {
    50: '#FDF9EF', 100: '#F9F0D9', 200: '#F0DEB0', 300: '#E7CB87',
    400: '#D4A853', 500: '#C49A3D', 600: '#A67F2E', 700: '#886524',
    800: '#6A4E1B', 900: '#4C3712',
  },
  cream: {
    DEFAULT: '#FEFBF4', 100: '#FDF8ED', 200: '#FAF2DE',
  },
}
```

---

## 2. Tipografía

Dos familias contrastadas: una serif elegante para títulos, una sans humanista limpia para cuerpo.

### 2.1 Familias

| Rol | Familia | Origen | Variable CSS | Fallback |
|---|---|---|---|---|
| `font-display` (títulos) | **Playfair Display** | Google Fonts (`subsets: ['latin'], display: 'swap'`) | `--font-display` | `Georgia, serif` |
| `font-body` (cuerpo) | **DM Sans** | Google Fonts (`subsets: ['latin'], display: 'swap'`) | `--font-body` | `system-ui, sans-serif` |

Carga en Next.js (`app/layout.tsx`):

```tsx
import { Playfair_Display, DM_Sans } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'], variable: '--font-display', display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'], variable: '--font-body', display: 'swap',
});

<html className={`${playfair.variable} ${dmSans.variable}`}>
  <body className="font-body text-navy-600 bg-cream antialiased overflow-x-hidden">
```

Configuración Tailwind:

```ts
fontFamily: {
  display: ['var(--font-display)', 'Georgia', 'serif'],
  body: ['var(--font-body)', 'system-ui', 'sans-serif'],
}
```

### 2.2 Reglas globales (en `globals.css`)

```css
@layer base {
  html { scroll-behavior: smooth; }
  body { @apply font-body text-navy-600 bg-cream antialiased; }
  h1, h2, h3, h4, h5, h6 { @apply font-display text-navy-800; }
}
```

> Todo título por defecto usa Playfair Display en `navy-800`. Todo texto por defecto usa DM Sans en `navy-600` sobre `cream`.

### 2.3 Escala tipográfica aplicada

| Elemento | Clases Tailwind | Notas |
|---|---|---|
| **H1 hero** | `font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight` | Sobre fondo oscuro. Marca dentro: `<span className="text-gold-300 italic">` |
| **H1 auth/form** | `text-2xl font-display font-bold text-navy-800` | |
| **H1 admin (pageTitle)** | `text-lg font-display font-bold text-navy-800` | Compacto |
| **H2 de sección home** | `text-2xl sm:text-3xl font-display font-bold text-navy-800` (o `text-white` sobre oscuro) `text-center mb-2` | Casi siempre centrado |
| **H2 widget interno** | `font-display font-bold text-navy-800 text-lg sm:text-xl` | Search widget, modales |
| **H3 card service** | `font-body font-semibold text-navy-800 text-xs sm:text-sm` | (No usa display) |
| **H3 card hotel/destination** | `font-body font-semibold text-navy-800 text-sm sm:text-base` | |
| **H3 destination overlay** | `font-display font-bold text-white text-sm sm:text-base md:text-lg` | Sobre imagen |
| **H3 footer column** | `font-body font-semibold text-sm text-white` | |
| **Lead bajo H2** | `text-sm text-navy-400 font-body text-center mb-8 sm:mb-10 max-w-md mx-auto` | (En oscuro: `text-white/50`) |
| **Hero subtítulo** | `text-sm sm:text-base text-white/80 font-body max-w-md mb-6 sm:mb-8 leading-relaxed` | |
| **Body párrafo card** | `text-[11px] sm:text-xs text-navy-400 font-body leading-relaxed` | Descripciones |
| **Helper de formulario** | `text-xs text-navy-400 font-body` | |
| **Label de formulario** | `block text-sm font-body font-medium text-navy-700 mb-1.5` | |
| **Link de navegación** | `text-sm text-navy-500 hover:text-navy-800 font-body transition-colors` | |
| **Footer link** | `text-xs text-white/50 hover:text-gold-300 font-body transition-colors` | |
| **Eyebrow / kicker** | `text-[10px] tracking-[0.2em] uppercase font-body leading-none text-navy-400` | Usado en logo y sidebar admin |

### 2.4 Pesos usados

| Peso | Cuándo |
|---|---|
| `font-bold` (700) | Headings display, precios destacados |
| `font-semibold` (600) | Títulos de card body, CTAs, links destacados, columnas footer |
| `font-medium` (500) | Labels, tabs, item activo de sidebar, badges, nav links destacados |
| (regular 400) | Body por defecto |

### 2.5 Tracking y leading que se repiten

| Utility | Uso |
|---|---|
| `tracking-[0.2em]` | Kicker uppercase del logo (TURISMO/ADMIN) |
| `tracking-[0.15em] uppercase` | Eyebrow de secciones del sidebar admin |
| `leading-none` | Kickers / micro labels |
| `leading-tight` | Brand wordmark, H1 hero |
| `leading-relaxed` | Párrafos largos (hero, testimonios, descripciones) |

### 2.6 Tamaños arbitrarios (no estándar Tailwind) usados intencionalmente

`text-[9px]`, `text-[10px]`, `text-[11px]`, `w-[18px] h-[18px]`, `w-[260px]`, `w-[3px]`, `max-w-[200px]`.

---

## 3. Sombras y radios

### 3.1 Sombras personalizadas (en `tailwind.config.ts`)

```ts
boxShadow: {
  card:        '0 4px 20px rgba(26, 54, 93, 0.08)',
  'card-hover':'0 8px 30px rgba(26, 54, 93, 0.12)',
}
```

> Color base: `navy-600` (`#1A365D`) con opacidad muy baja. Crea sombras suaves, frías, premium.

### 3.2 Tabla de uso

| Sombra | Cuándo |
|---|---|
| `shadow-card` | Cards estándar (servicios, hoteles, destinos) |
| `shadow-card-hover` | Estado hover de las cards anteriores |
| `shadow-sm` | CTAs dorados (estado reposo), dropdowns admin |
| `shadow-md` | CTAs Hero, hover de cards estándar (fallback) |
| `shadow-xl` | Search widget del Hero (única ocurrencia destacada) |
| `shadow-lg` | Dropdown del menú de usuario en Header |

### 3.3 Border-radius — Jerarquía clara

| Radio | Uso |
|---|---|
| `rounded-2xl` (1rem) | **Cards principales**, search widget, auth forms, testimonials, destinations |
| `rounded-xl` (0.75rem) | Dropdown de menú usuario |
| `rounded-lg` (0.5rem) | Inputs, botones secundarios, alerts, items de menú móvil, search admin |
| `rounded-full` | **CTAs principales pill**, avatars, badges, social icons del footer, indicador dorado de sidebar, dot de notificación |
| `rounded-md` (0.375rem) | (Solo legacy — evitar en componentes nuevos) |

---

## 4. Espaciado y layout

### 4.1 Container responsive (regla universal)

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

> `max-w-7xl` = `80rem` (`1280px`). Se aplica en todas las secciones del home, header, footer. Padding lateral escala con breakpoint.

### 4.2 Padding vertical de secciones

| Sección | Clases |
|---|---|
| Hero | `py-12 sm:py-16 md:py-20 lg:py-24` |
| Sección home estándar | `py-14 sm:py-16 md:py-20` |
| Sección compacta | `py-12 sm:py-16` |
| Footer | `py-12 sm:py-16` |
| Admin main content | `p-8` (interior) |

### 4.3 Padding interno de cards

| Tipo | Clases |
|---|---|
| Card de servicio / hotel destacado | `p-4 sm:p-5` |
| Card grande (search widget, auth) | `p-5 sm:p-6` o `p-8` |
| Testimonial card | `p-5 sm:p-6` |

### 4.4 Spacing vertical entre header de sección y grid

| Caso | Clase |
|---|---|
| Con lead/descripción | `mb-8 sm:mb-10` |
| Sin lead (solo h2) | `mb-10 sm:mb-12` |

### 4.5 Grids recurrentes

| Patrón | Clases |
|---|---|
| 4-col features (WhyChoose) | `grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8` |
| 4-col servicios | `grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6` |
| 3-col cards | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6` |
| 3-col destinos | `grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5` |
| Footer | `grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10` |
| Auth (nombre+apellido) | `grid grid-cols-2 gap-4` |
| Filtros | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3` |

### 4.6 Form spacing

```html
<form className="space-y-5">   <!-- Auth -->
<form className="space-y-3">   <!-- Search widget compacto -->
<form className="space-y-6">   <!-- Checkout, formularios largos -->
```

### 4.7 Alternancia de fondos en home (ritmo visual)

Secuencia típica: `bg-white` → `bg-cream` → `bg-white` → `bg-navy-800` (sección oscura, ej. Testimonials) → `bg-white` → `bg-navy-900` (Footer).

---

## 5. Botones — Catálogo completo

### 5.1 Botón Primario "Pill dorado" (el CTA principal del sitio)

```html
<button class="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500
               text-white font-body font-semibold text-sm
               hover:from-gold-500 hover:to-gold-600
               transition-all shadow-sm
               disabled:opacity-50 disabled:cursor-not-allowed">
  Registrarse
</button>
```

Variantes de tamaño:
- `px-5 py-2` (header)
- `px-6 py-3` (hero CTAs, usa `rounded-lg` en hero)
- `w-full py-2.5` / `w-full py-3` (forms full-width)

### 5.2 Botón Secundario "Outline blanco sobre oscuro"

```html
<button class="px-6 py-3 rounded-lg border-2 border-white/30 text-white
               font-body font-semibold text-sm
               hover:bg-white/10 transition-all">
  Explorar destinos
</button>
```

### 5.3 Tab/Toggle navy

```html
<!-- Activo -->
<button class="px-3 sm:px-4 py-2 rounded-lg bg-navy-600 text-white
               text-xs sm:text-sm font-body font-medium">Hoteles</button>

<!-- Inactivo -->
<button class="px-3 sm:px-4 py-2 rounded-lg bg-navy-50 text-navy-500
               hover:bg-navy-100 text-xs sm:text-sm font-body font-medium
               transition-colors">Actividades</button>
```

### 5.4 Link/Ghost dorado con flecha

```html
<a href="#" class="text-sm font-body font-medium text-gold-500
                   hover:text-gold-600 transition-colors">
  Ver todos →
</a>
```

### 5.5 Link de navegación

```html
<a class="text-sm text-navy-500 hover:text-navy-800 font-body transition-colors">
  Hoteles
</a>
```

### 5.6 Link dorado en formularios

```html
<a class="text-gold-600 hover:text-gold-700 font-body font-semibold transition-colors">
  Olvidé mi contraseña
</a>
```

### 5.7 Botón móvil outline (mobile menu)

```html
<a class="flex-1 text-center text-sm text-navy-600 font-body py-2.5
          rounded-lg border border-navy-200">
  Iniciar sesión
</a>
```

---

## 6. Inputs y formularios

### 6.1 Input premium (estándar — usar SIEMPRE este)

```html
<input class="w-full px-4 py-2.5 rounded-lg border border-navy-200
              text-sm font-body text-navy-800 placeholder:text-navy-300
              focus:outline-none focus:ring-2 focus:ring-gold-400/50
              focus:border-gold-400 transition-colors" />
```

**Variante Hero** (más sutil, sobre fondo de card):
```html
<input class="w-full px-4 py-3 rounded-lg border border-navy-100 bg-cream/50
              text-sm font-body text-navy-800 placeholder:text-navy-300
              focus:outline-none focus:border-gold-400 focus:ring-1
              focus:ring-gold-400 transition-colors" />
```

### 6.2 Search embebido (header admin)

```html
<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg
            bg-navy-50/60 border border-navy-100/40">
  <svg class="w-4 h-4 text-navy-400">...</svg>
  <input class="bg-transparent text-sm font-body text-navy-700
                placeholder:text-navy-300 outline-none w-40" />
  <kbd class="text-[10px] border border-navy-200/60 rounded px-1 py-0.5">⌘K</kbd>
</div>
```

### 6.3 Label

```html
<label class="block text-sm font-body font-medium text-navy-700 mb-1.5">
  Correo electrónico
</label>
```

### 6.4 Helper text

```html
<p class="mt-1 text-xs text-navy-400 font-body">
  Mínimo 8 caracteres, incluye un número.
</p>
```

### 6.5 Mensaje de error / alert

```html
<div class="bg-red-50 border border-red-200 text-red-700 text-sm
            rounded-lg px-4 py-3">
  Credenciales inválidas.
</div>
```

### 6.6 Toggle de password (icono ojo)

```html
<div class="relative">
  <input type="password" class="..." />
  <button type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2
                 text-navy-400 hover:text-navy-600">
    <svg class="w-5 h-5">...</svg>
  </button>
</div>
```

### 6.7 Estado deshabilitado

```
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## 7. Cards

### 7.1 Anatomía base

```html
<article class="bg-white rounded-2xl shadow-card hover:shadow-card-hover
                transition-all duration-300 overflow-hidden">
  <!-- Imagen (opcional) -->
  <div class="relative h-40 sm:h-44 overflow-hidden">
    <img class="object-cover group-hover:scale-105 transition-transform duration-500" />
  </div>
  <!-- Body -->
  <div class="p-4 sm:p-5">
    <h3 class="font-body font-semibold text-navy-800 text-sm sm:text-base">...</h3>
    <p class="text-[11px] sm:text-xs text-navy-400 font-body mt-1">...</p>
  </div>
</article>
```

### 7.2 Variante "Service" (icono + texto)

- Icono circular `w-12 h-12 rounded-full bg-navy-50 group-hover:bg-gold-50 transition-colors`
- Icono SVG `w-8 h-8 text-navy-500 group-hover:text-gold-500`
- `hover:-translate-y-1` para efecto lift
- Texto centrado

### 7.3 Variante "Hotel destacado / featured"

- Imagen top con altura `h-40 sm:h-44`
- Body con: título → ubicación (texto pequeño) → estrellas → precio en oro
- Precio: `text-base font-display font-bold text-gold-500`

### 7.4 Variante "Destination overlay" (imagen full bleed)

```html
<article class="relative h-36 sm:h-44 md:h-52 rounded-2xl overflow-hidden
                shadow-card hover:shadow-card-hover transition-all duration-300 group">
  <img class="absolute inset-0 object-cover group-hover:scale-105
              transition-transform duration-700" />
  <div class="absolute inset-0 bg-gradient-to-t
              from-navy-900/70 via-navy-900/20 to-transparent"></div>
  <div class="absolute bottom-0 left-0 right-0 p-4">
    <span class="inline-block text-[10px] sm:text-xs font-body font-medium
                 text-gold-300 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
      Caribe
    </span>
    <h3 class="font-display font-bold text-white text-sm sm:text-base md:text-lg
               mt-2 group-hover:translate-x-1 transition-transform duration-300">
      Cartagena
    </h3>
  </div>
</article>
```

### 7.5 Variante "Testimonial" (sobre fondo oscuro)

```html
<article class="bg-white/5 backdrop-blur-sm border border-white/10
                rounded-2xl p-5 sm:p-6">
  <!-- Estrellas en gold-400 / white/20 -->
  <p class="text-sm text-white/80 font-body leading-relaxed">"..."</p>
  <!-- Avatar + nombre -->
</article>
```

### 7.6 Variante "Auth form card"

```html
<div class="bg-white rounded-2xl shadow-sm border border-navy-100/50 p-8 max-w-md w-full">
  <h1 class="text-2xl font-display font-bold text-navy-800 text-center mb-2">
    Iniciar sesión
  </h1>
  <!-- form... -->
</div>
```

### 7.7 Variante "Search widget" (Hero)

```html
<div class="bg-white rounded-2xl p-5 sm:p-6 shadow-xl">
  <!-- tabs + inputs -->
</div>
```

---

## 8. Header

### 8.1 Header público

```html
<header class="sticky top-0 z-50 border-b border-navy-100/50
               bg-white/95 backdrop-blur-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16
              flex items-center justify-between">
    <!-- Logo -->
    <a class="flex items-center gap-2.5">
      <svg class="text-gold-400 w-8 h-8"><!-- triángulo doble --></svg>
      <div>
        <p class="text-[10px] tracking-[0.2em] text-navy-400 uppercase
                  font-body leading-none">TURISMO</p>
        <p class="text-base font-display font-bold text-navy-700 leading-tight">
          TuriTravel
        </p>
      </div>
    </a>
    <!-- Nav desktop -->
    <nav class="hidden md:flex items-center gap-6">
      <a class="text-sm text-navy-500 hover:text-navy-800 font-body transition-colors">Hoteles</a>
      <!-- ... -->
    </nav>
    <!-- CTA -->
    <a class="hidden md:inline-flex px-5 py-2 rounded-full
              bg-gradient-to-r from-gold-400 to-gold-500 text-white
              font-body font-semibold text-sm
              hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm">
      Registrarse
    </a>
    <!-- Hamburger móvil -->
  </div>
</header>
```

**Especificaciones:**
- Altura: `h-16` (64px)
- Fondo: blanco con 95% opacidad + backdrop blur
- Border inferior: `border-navy-100/50` (casi invisible)
- Sticky con `z-50`

### 8.2 Header admin

```html
<header class="h-16 shrink-0 flex items-center justify-between px-8
               border-b border-navy-100/50 bg-white">
  <div>
    <h1 class="text-lg font-display font-bold text-navy-800">Dashboard</h1>
    <p class="text-xs font-body text-navy-400">Admin / Dashboard</p>
  </div>
  <!-- Search + notif + avatar -->
</header>
```

### 8.3 Menú de usuario (dropdown)

```html
<div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg
            border border-navy-100/50 py-2 z-50">
  <a class="block px-4 py-2.5 text-sm text-navy-600 hover:bg-navy-50
            font-body transition-colors">Mi cuenta</a>
</div>
```

### 8.4 Mobile menu / hamburger

- Tres `<span>` `w-5 h-0.5 bg-navy-600 transition-all duration-300`
- En estado abierto: el primero rota 45°, el segundo se desvanece, el tercero rota -45° formando una X
- Contenedor del menú: `overflow-hidden transition-all duration-300 max-h-96` (abierto) / `max-h-0` (cerrado)

---

## 9. Sidebar admin

```html
<aside class="w-[260px] shrink-0 border-r border-navy-100/50 bg-white
              flex flex-col h-full">
  <!-- Logo header -->
  <div class="h-16 flex items-center gap-2.5 px-6 border-b border-navy-100/50">
    <!-- logo + ADMIN kicker -->
  </div>

  <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
    <!-- Sección -->
    <div>
      <p class="px-3 mb-2 text-[10px] font-body font-semibold
                tracking-[0.15em] uppercase text-navy-300">Principal</p>
      <ul class="space-y-1">
        <!-- Item activo -->
        <li>
          <a class="group relative flex items-center gap-3 px-3 py-2
                    rounded-lg text-sm font-body
                    bg-gold-50/80 text-navy-800 font-medium">
            <span class="absolute left-0 top-1.5 bottom-1.5 w-[3px]
                         rounded-full bg-gold-400"></span>
            <svg class="w-[18px] h-[18px] text-gold-500">...</svg>
            Dashboard
          </a>
        </li>
        <!-- Item inactivo -->
        <li>
          <a class="group flex items-center gap-3 px-3 py-2 rounded-lg
                    text-sm font-body text-navy-500
                    hover:bg-navy-50/60 hover:text-navy-700 transition-colors">
            <svg class="w-[18px] h-[18px] text-navy-400
                        group-hover:text-navy-500">...</svg>
            Reservas
          </a>
        </li>
      </ul>
    </div>
  </nav>
</aside>
```

**Layout admin global:** `fixed inset-0 z-[100] flex bg-cream` — el admin toma toda la pantalla y secuestra el scroll.

---

## 10. Footer

```html
<footer id="contacto" class="bg-navy-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">

      <!-- Brand col -->
      <div class="col-span-2 md:col-span-1">
        <!-- Logo + nombre font-display font-bold text-lg -->
        <p class="text-xs text-white/50 font-body leading-relaxed max-w-[200px] mt-3">
          Tu agencia de confianza en Colombia.
        </p>
        <!-- Social icons -->
        <div class="flex gap-2 mt-4">
          <a class="w-8 h-8 rounded-full bg-white/10 flex items-center
                    justify-center hover:bg-gold-400/80 transition-colors">
            <svg class="w-4 h-4" fill="currentColor">...</svg>
          </a>
        </div>
      </div>

      <!-- Columna de links -->
      <div>
        <h3 class="font-body font-semibold text-sm text-white mb-3 sm:mb-4">
          Empresa
        </h3>
        <ul class="space-y-2">
          <li><a class="text-xs text-white/50 hover:text-gold-300
                        font-body transition-colors">Sobre nosotros</a></li>
        </ul>
      </div>
    </div>

    <!-- Copyright -->
    <div class="border-t border-white/10 pt-6 sm:pt-8 text-center">
      <p class="text-xs text-white/30 font-body">
        © 2026 <span class="text-gold-400">TuriTravel</span>. Todos los derechos reservados.
      </p>
    </div>
  </div>
</footer>
```

---

## 11. Hero

```html
<section class="relative overflow-hidden
                bg-gradient-to-br from-navy-700 via-navy-500 to-navy-400">

  <!-- Decoración radial dorada (firma del proyecto) -->
  <div class="absolute inset-0
              bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,83,0.12),transparent_60%)]">
  </div>

  <!-- Overlay inferior -->
  <div class="absolute inset-0 bg-gradient-to-t from-navy-800/40 to-transparent"></div>

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
              py-12 sm:py-16 md:py-20 lg:py-24">
    <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <div>
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl
                   font-bold text-white leading-tight mb-4 sm:mb-6">
          Descubre Colombia con
          <span class="text-gold-300 italic">TuriTravel</span>
        </h1>
        <p class="text-sm sm:text-base text-white/80 font-body
                  max-w-md mb-6 sm:mb-8 leading-relaxed">
          Hoteles, actividades, vehículos y traslados...
        </p>
        <div class="flex flex-wrap gap-3">
          <!-- CTA dorado y CTA outline blanco -->
        </div>
      </div>
      <!-- Search widget (card blanca a la derecha) -->
    </div>
  </div>
</section>
```

---

## 12. Sección de home estándar

```html
<section class="py-14 sm:py-16 md:py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Header centrado: H2 + lead -->
    <div class="text-center mb-8 sm:mb-10">
      <h2 class="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
        Hoteles destacados
      </h2>
      <p class="text-sm text-navy-400 font-body max-w-md mx-auto">
        Los mejores hoteles seleccionados para tu próxima escapada.
      </p>
    </div>

    <!-- Variante: header con CTA a la derecha -->
    <div class="flex items-end justify-between mb-8 sm:mb-10">
      <h2 class="text-2xl sm:text-3xl font-display font-bold text-navy-800">
        Actividades
      </h2>
      <a class="text-sm font-body font-medium text-gold-500
                hover:text-gold-600 transition-colors">Ver todos →</a>
    </div>

    <!-- Grid de cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      <!-- ... -->
    </div>
  </div>
</section>
```

**Para una sección oscura** (ej. Testimonials), cambiar:
- `bg-white` → `bg-navy-800`
- `text-navy-800` → `text-white`
- `text-navy-400` → `text-white/50`

---

## 13. Badges, pills y tags

### 13.1 Badge de estado (BookingStatus)

```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full
             text-xs font-medium border
             bg-green-100 text-green-800 border-green-200">
  Confirmada
</span>
```

| Estado | Bg | Text | Border |
|---|---|---|---|
| PENDING | `yellow-100` | `yellow-800` | `yellow-200` |
| CONFIRMED | `green-100` | `green-800` | `green-200` |
| CANCELLED | `gray-100` | `gray-600` | `gray-200` |
| EXPIRED | `red-50` | `red-700` | `red-200` |
| PAYMENT_FAILED | `red-200` | `red-900` | `red-300` |
| REFUNDED | `purple-100` | `purple-800` | `purple-200` |

### 13.2 Tag sobre imagen (categoría)

```html
<span class="absolute top-2 left-2 px-2 py-1 bg-white/90
             text-xs font-medium rounded-full">
  Aventura
</span>
```

### 13.3 Pill destacado sobre fondo oscuro

```html
<span class="inline-block text-[10px] sm:text-xs font-body font-medium
             text-gold-300 bg-white/15 backdrop-blur-sm
             px-2 py-0.5 rounded-full">
  Top destino
</span>
```

### 13.4 Avatar de iniciales

```html
<div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-500
            text-white text-xs font-semibold flex items-center justify-center">
  JD
</div>
```

---

## 14. Iconografía

### 14.1 Convención

- **No hay librería externa instalada.** Todos los iconos son **SVG inline** (paths copiados principalmente de **Heroicons**).
- `viewBox="0 0 24 24"` con `stroke="currentColor"`, `fill="none"`, `strokeWidth={1.5}` o `2`.
- Las estrellas son SVG inline propios (`viewBox="0 0 20 20"`, `fill="currentColor"`).

> **Recomendación al portar:** instalar `lucide-react` (peso ligero, API consistente, se mantiene mejor que paths inline duplicados).

### 14.2 Tamaños recurrentes

| Tamaño | Uso |
|---|---|
| `w-3.5 h-3.5` | Estrellas pequeñas en cards |
| `w-4 h-4` | Iconos micro (search admin, chevron usuario) |
| `w-[18px] h-[18px]` | Iconos del sidebar admin |
| `w-5 h-5` | Notificaciones admin, estrella rating md |
| `w-6 h-6` | Estrella rating lg |
| `w-7 h-7` | Iconos de WhyChoose (en círculo) |
| `w-8 h-8` | Iconos de Services (en círculo) |

### 14.3 Colores

- Iconos inactivos: `text-navy-400`
- Iconos sobre círculo `bg-navy-50`: `text-navy-500`
- Iconos activos / acento: `text-gold-400` o `text-gold-500`
- Iconos sobre fondo oscuro: `text-gold-300` (acento) / `text-white/80` (neutro)
- Estrellas llenas: `text-gold-400`
- Estrellas vacías: `text-navy-200` (sobre claro) / `text-white/20` (sobre oscuro)

---

## 15. Estados interactivos y animaciones

### 15.1 Transiciones — qué usar para qué

| Propósito | Clases |
|---|---|
| Color de texto/fondo (links, hover de items) | `transition-colors` |
| Compuesto (sombra+transform+color) | `transition-all duration-300` |
| Solo transform (hamburger, chevron, zoom imagen) | `transition-transform` con `duration-300` o `duration-500`/`duration-700` |
| Imagen con zoom suave | `transition-transform duration-500` (o `duration-700` para más drama) |

### 15.2 Hovers característicos

```css
/* Card lift */
hover:shadow-card-hover transition-all duration-300
hover:-translate-y-1                          /* Services */

/* Zoom de imagen dentro de card */
group-hover:scale-105 duration-500

/* Icon container que cambia a oro */
group-hover:bg-gold-50 group-hover:text-gold-500

/* Título que se desplaza al hover */
group-hover:translate-x-1 duration-300
```

### 15.3 Focus en inputs

```
focus:outline-none focus:ring-2 focus:ring-gold-400/50
focus:border-gold-400 transition-colors
```

### 15.4 Loading / spinner

```html
<div class="w-8 h-8 border-2 border-gold-400 border-t-transparent
            rounded-full animate-spin"></div>
```

### 15.5 Skeleton (avatar cargando)

```html
<div class="w-8 h-8 rounded-full bg-navy-100 animate-pulse"></div>
```

---

## 16. Imágenes

### 16.1 Implementación con Next.js Image

```html
<div class="relative h-48 w-full">
  <Image
    src="..."
    alt="..."
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

### 16.2 Aspect ratios por tipo de card

| Tipo | Altura |
|---|---|
| Hotel featured | `h-40 sm:h-44` |
| Destination | `h-36 sm:h-44 md:h-52` |
| HotelCard listado | `h-48 w-full` |

### 16.3 Overlays sobre imágenes (siempre que haya texto encima)

```html
<!-- Gradiente oscuro inferior para legibilidad -->
<div class="absolute inset-0 bg-gradient-to-t
            from-navy-900/70 via-navy-900/20 to-transparent"></div>
```

### 16.4 Placeholders mientras no hay foto

Usar `<div class="absolute inset-0 bg-gradient-to-br ${gradient}"></div>` con paletas tropicales (`from-sky-400 to-blue-600`, `from-amber-300 to-orange-500`, `from-emerald-400 to-teal-600`, `from-violet-400 to-purple-600`, `from-rose-400 to-pink-600`, etc.) — pero idealmente reemplazar por `<Image>` real.

---

## 17. Firmas visuales distintivas (la "personalidad" del sitio)

Estos son los **elementos que dan identidad** al sistema. Si los reproduces, el otro proyecto se va a sentir como TuriTravel. Si no los reproduces, perderás el carácter aunque uses la paleta.

1. **Logo: triángulo dorado en doble path** (uno con `fillOpacity="0.6"` detrás, otro lleno encima) en `text-gold-400`. Simula montañas u origami.

2. **Kicker uppercase con tracking enorme:** `text-[10px] tracking-[0.2em] uppercase font-body leading-none text-navy-400` sobre el wordmark. Es la firma del logo.

3. **Gradiente horizontal dorado en TODOS los CTAs principales:**
   ```
   bg-gradient-to-r from-gold-400 to-gold-500
   hover:from-gold-500 hover:to-gold-600
   ```
   Es el sello del sistema. No usar dorado plano.

4. **Avatar con gradiente diagonal dorado:**
   ```
   bg-gradient-to-br from-gold-400 to-gold-500
   ```
   (Nota: `to-br` no `to-r`, da más profundidad para superficies pequeñas circulares.)

5. **Acento dorado lateral de 3px en items activos del sidebar:**
   ```html
   <span class="absolute left-0 top-1.5 bottom-1.5 w-[3px]
                rounded-full bg-gold-400"></span>
   ```
   Combina con `bg-gold-50/80` del item y `text-gold-500` del icono.

6. **Decoración radial dorado en zonas hero:**
   ```
   bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,83,0.12),transparent_60%)]
   ```

7. **Acento "italic + gold-300" en el brand dentro del H1 hero:**
   ```html
   <span class="text-gold-300 italic">TuriTravel</span>
   ```
   Aprovecha la cursiva del Playfair Display como diferenciador semántico.

8. **Bordes "fantasma" `border-navy-100/50` (con opacidad):** divisiones casi invisibles que estructuran sin gritar. Usar en headers, sidebars, dropdowns, cards de auth.

9. **Hamburger animado** → 3 spans de `w-5 h-0.5 bg-navy-600` que rotan a una X con `transition-all duration-300`.

10. **Ritmo de fondos en el home:** white → cream → white → navy-800 (sección oscura) → white → navy-900 (footer). Crea respiración y jerarquía.

---

## 18. Breakpoints

Tailwind por defecto:

| Breakpoint | Min-width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

Estrategia: **mobile-first**. Las clases sin prefijo son la base; `sm:` y arriba son enhancements. Los gaps, padding y tamaños tipográficos escalan típicamente con dos breakpoints (`sm:` y `md:` o `lg:`).

---

## 19. Accesibilidad y semántica

- `html lang="es"` en el layout root.
- `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<nav>` usados semánticamente.
- Iconos decorativos sin `aria-label`. Iconos clicables → con `aria-label` (botón de notificaciones, hamburger, toggle password).
- Focus states con `focus:ring-2 focus:ring-gold-400/50` para teclado.
- Smooth scroll global: `html { scroll-behavior: smooth; }`.
- Anclas internas: `<footer id="contacto">` + `<a href="#contacto">`.

---

## 20. Resumen — Lista de chequeo para replicar el look

Para que el otro proyecto se vea como TuriTravel, asegúrate de tener:

- [ ] Tailwind CSS configurado con la paleta `navy`, `gold`, `cream` exacta (sección 1.5)
- [ ] Fuentes Playfair Display + DM Sans cargadas vía `next/font/google` (o equivalente) con variables CSS `--font-display` y `--font-body`
- [ ] `boxShadow.card` y `boxShadow.card-hover` agregados al config (sección 3.1)
- [ ] `globals.css` con las reglas de base que aplican `font-body`, `text-navy-600`, `bg-cream`, `antialiased` al body y `font-display text-navy-800` a todos los headings
- [ ] Container universal `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- [ ] Padding vertical de sección `py-14 sm:py-16 md:py-20`
- [ ] CTAs primarios con **gradiente dorado horizontal pill** (sección 5.1)
- [ ] Cards estándar `rounded-2xl shadow-card hover:shadow-card-hover`
- [ ] Inputs con `border-navy-200`, focus `ring-gold-400/50` y `border-gold-400`
- [ ] Header sticky `h-16` con `bg-white/95 backdrop-blur-md`
- [ ] Footer `bg-navy-900` con divisor `border-white/10`
- [ ] Hero con gradiente `from-navy-700 via-navy-500 to-navy-400` + decoración radial dorado
- [ ] Logo con triángulo doble dorado + kicker uppercase tracked
- [ ] Acento dorado italic en el brand del H1 hero
- [ ] Sistema de eyebrow uppercase `text-[10px] tracking-[0.2em]` para kickers de marca
- [ ] Alternancia de fondos white ↔ cream ↔ navy-800 en home

---

**Última actualización:** 2026-05-24
**Origen:** `c:\ServBay\www\turitravel_v2\apps\web` — proyecto TuriTravel v2 (Next.js 14 + Tailwind 3)
