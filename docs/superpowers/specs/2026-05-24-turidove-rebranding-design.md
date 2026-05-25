# TuriDove — Diseño de transformación

> **Origen:** proyecto Agroturismo Panamá (Next.js 15 + NestJS 10 + Prisma 5 + PostgreSQL 18, dockerizado).
> **Destino:** TuriDove — agencia de viajes boutique internacional con el design system de TuriTravel v2.
> **Naturaleza:** rebranding visual profundo + adición del módulo Paquetes + seed internacional. La lógica de negocio y el modelo de datos existente se conservan.
> **Documentos de referencia:** [docs/DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) y [docs/CONTENT_MIGRATION.md](../../CONTENT_MIGRATION.md).

---

## 1. Arquitectura y alcance

### Lo que NO cambia

- **Stack:** Next.js 15 (App Router) + TypeScript, NestJS 10 + TypeScript, Prisma 5, PostgreSQL 18, Docker Compose con 3 servicios.
- **Modelo de datos existente:** entidades Prisma (`Hospedaje`, `Habitacion`, `Actividad`, `Transfer`, `Vehiculo`, `Reserva`, `Pago`, `Auditoria`, `User`, `Configuracion`).
- **Roles RBAC:** ADMIN, PROVEEDOR, AGENCIA, OPERADOR, CLIENTE. Lógica de ownership, guards y decoradores `@Roles()` se conservan tal cual.
- **Rutas REST:** `/api/v1/hospedajes`, `/api/v1/actividades`, etc. (no se renombran a `/hotels`).
- **Sistema de margen comercial** configurable por servicio.
- **Auditoría automática** (interceptor en escrituras).
- **Expiración de sesión** por inactividad (Zustand + `lastActivity`).
- **i18n ES/EN** (estructura de traducciones).
- **Estados de pago** (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`) y la tabla `Pago` con sus campos. La estructura se conserva; cambia la pasarela.
- **Flujos existentes:** reserva, carrito de cliente, dashboards por rol, gestión de habitaciones con tarifas por temporada, upload de imágenes multipart.

### Lo que cambia

- **Identidad visual completa:** paleta `navy/gold/cream`, tipografías Playfair Display + DM Sans, sombras `card`/`card-hover`, radios escalonados, todos los componentes UI repintados.
- **Branding global:** nombre, metadata SEO, dominios en envs, admin email, nombres de contenedores Docker, copyright.
- **Home público:** rehecho desde cero con 10 secciones del design system de TuriTravel v2 (sin `FeaturedHotels` ni `SeasonalOffers`).
- **Header y Footer:** sustituidos por las versiones del manual de design system.
- **Paneles privados** (admin, proveedor, agencia, operador, cliente): repintados con el design system. Estructura interna conservada.
- **Etiquetas UI:** "Hospedaje(s)" → "Hotel(es)" en **todos los textos visibles al usuario**: títulos de página, labels de nav, breadcrumbs, botones (`+ Nuevo Hotel`), confirmaciones, mensajes de error, strings i18n. Las rutas REST, nombres de entidades Prisma, variables del código y nombres de archivos **no cambian** (`Hospedaje` sigue siendo `Hospedaje` en `schema.prisma`, `/api/v1/hospedajes` sigue siendo el endpoint, `HospedajesModule` sigue siendo el módulo NestJS).
- **Módulo nuevo: Paquetes** — combos Hotel + Actividad opcional + Vehículo opcional con descuento porcentual y vigencia.
- **Seed:** mínimo de muestra con 6 destinos internacionales (París, Roma, Tokio, Nueva York, Santorini, Marrakech).
- **Pasarela de pago real:** integración con **Stripe Checkout (hosteado)** como única vía de pago. Reemplaza completamente el modal de pago simulado actual (Tarjeta/Yappy/Transferencia/Efectivo). Incluye webhooks para confirmar reservas.
- **Moneda:** USD en toda la UI y como moneda de Stripe.
- **Imágenes seed:** script automático que descarga ~30-40 fotos de Unsplash/Pexels por destino.

### Lo que NO se hace ahora (alcance excluido)

- No se renombran entidades Prisma (`Hospedaje` sigue siendo `Hospedaje`).
- No se cambian endpoints REST.
- No se eliminan transfers ni vehículos.
- No se integra email transaccional, notificaciones push, reviews públicas, ni wishlist/favoritos.
- No se agrega tabla `Banner` (la sección `SeasonalOffers` queda fuera del home).
- No se reescribe el sistema de auditoría ni el de márgenes.

---

## 2. Principios de aplicación visual

Estos principios guían **cómo** se aplica el design system para conseguir la visión **minimalismo + lujo + buen gusto**.

- **Menos densidad, más respiración.** Padding vertical de secciones tiende al alto del manual (`py-20`/`py-24` cuando hay duda). Grids con `gap` generoso. Headers de sección centrados con lead corto.
- **Tipografía dramática contenida.** Playfair en headings sin tracking decorativo. Italic solo en la palabra de marca del hero (firma del manual). Nunca italic en otros lugares. DM Sans cuerpo con `leading-relaxed` en párrafos.
- **Gold como joya, no como ruido.** El gradiente dorado se reserva para: CTA primario, avatares, acento lateral del sidebar activo, palabra de marca del hero, y "Ver todos →". Nunca para íconos genéricos, badges informativos, o bordes decorativos.
- **Fondos sólidos, no patterns.** Solo se permite la decoración radial dorada del hero. Nada de texturas, ilustraciones de fondo, ni gradientes en secciones internas.
- **Sombras suaves.** Solo `shadow-card` / `shadow-card-hover`. Prohibido `shadow-2xl` o coloridos. El hero search widget es la única excepción (`shadow-xl`).
- **Bordes fantasma.** `border-navy-100/50` es el default. Nunca bordes oscuros visibles excepto en focus states (`ring-gold-400/50`).
- **Imágenes que respiran.** Si no hay foto de calidad, se usa un gradiente sólido elegante (cream/navy suave), no un placeholder genérico. Aspect ratios consistentes, sin recortes agresivos.
- **Copy corto.** Headings de 2-5 palabras, leads de una frase, descripciones de card en 1-2 líneas.
- **Animaciones discretas.** `transition-colors duration-300` por defecto. Zoom suave (`scale-105 duration-500`) solo en imágenes al hover. Sin bounces ni rebounds.
- **Densidad de información baja.** Cards muestran solo lo esencial (imagen + título + ubicación + precio). Detalles secundarios solo en modales/páginas detalle.

---

## 3. Sistema de diseño visual

### 3.1 Paleta (Tailwind config)

Tres familias principales más semánticos:

- **Navy** (`50` → `900`): base de textos, fondos oscuros, headings. Body default `navy-600`, headings `navy-800`, footer `navy-900`.
- **Gold** (`50` → `900`): acento de marca, CTAs, focus rings, estrellas. CTA principal: `bg-gradient-to-r from-gold-400 to-gold-500`.
- **Cream**: `DEFAULT #FEFBF4`, `100 #FDF8ED`, `200 #FAF2DE`. Fondo del body y alternancia.
- **Semánticos**: green/yellow/red/gray/purple con tonos suaves para estados de booking/pago (tabla 13.1 del manual).

Valores hex exactos: ver `docs/DESIGN_SYSTEM.md` sección 1.5.

### 3.2 Tipografía

- `font-display`: **Playfair Display** vía `next/font/google`, variable `--font-display`.
- `font-body`: **DM Sans** vía `next/font/google`, variable `--font-body`.
- Reglas globales en `globals.css`:
  - `body { @apply font-body text-navy-600 bg-cream antialiased }`
  - `h1..h6 { @apply font-display text-navy-800 }`
  - `html { scroll-behavior: smooth }`

### 3.3 Sombras y radios

- `boxShadow.card`: `0 4px 20px rgba(26,54,93,0.08)`
- `boxShadow.card-hover`: `0 8px 30px rgba(26,54,93,0.12)`
- Jerarquía de radios: `rounded-2xl` cards, `rounded-xl` dropdowns, `rounded-lg` inputs/botones secundarios, `rounded-full` CTAs pill/avatars/badges.

### 3.4 Firmas visuales distintivas (10 elementos no negociables)

1. Logo: triángulo dorado en doble path (uno `fillOpacity 0.6` detrás, otro sólido encima), `text-gold-400`.
2. Kicker uppercase con `tracking-[0.2em]` sobre el wordmark del logo.
3. CTAs primarios con gradiente horizontal dorado pill (`from-gold-400 to-gold-500`, hover `from-gold-500 to-gold-600`).
4. Avatares con gradiente diagonal `from-gold-400 to-gold-500 to-br`.
5. Acento lateral 3px dorado en items activos del sidebar (`absolute left-0 w-[3px] bg-gold-400 rounded-full`).
6. Decoración radial dorada en hero (`bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,83,0.12),transparent_60%)]`).
7. Palabra de marca en el H1 del hero: `<span className="text-gold-300 italic">TuriDove</span>`.
8. Bordes "fantasma" `border-navy-100/50`.
9. Hamburger animado: 3 spans `w-5 h-0.5 bg-navy-600` que rotan a X.
10. Ritmo de fondos del home: navy → white → cream → … → navy-800 → navy-900.

### 3.5 Componentes UI base a rehacer

- **Header público** (sticky, `h-16`, `bg-white/95 backdrop-blur-md`).
- **Footer** (`bg-navy-900`, 4 columnas + redes + copyright).
- **Cards** con variantes: Service, Hotel/Package featured, Destination overlay, Testimonial, Auth, Search widget.
- **Botones**: Primary pill dorado, Secondary outline blanco, Tab navy, Link ghost dorado.
- **Inputs** premium (`border-navy-200`, focus `ring-gold-400/50` y `border-gold-400`).
- **Badges** de estado (booking/pago) con la tabla semántica.
- **Dropdown** de usuario.
- **Sidebar admin** con kicker, acento lateral dorado, items activos `bg-gold-50/80`.

### 3.6 Reestilizado de Shadcn/UI

Los componentes Shadcn existentes se conservan. En `globals.css` se redirigen sus variables CSS de tema (`--primary`, `--secondary`, `--background`, `--foreground`, `--border`, `--ring`, `--radius`) hacia la nueva paleta. No se modifican los archivos en `components/ui/`.

### 3.7 Iconografía

Convención: `lucide-react` para todos los iconos del nuevo chrome (header, footer, sidebar, cards). Si el proyecto actual no la tiene instalada, se agrega como dependencia. Tamaños recurrentes:

- `w-3.5 h-3.5` estrellas pequeñas
- `w-4 h-4` iconos micro (search admin)
- `w-[18px] h-[18px]` iconos sidebar admin
- `w-5 h-5` notificaciones
- `w-7 h-7` WhyChoose features
- `w-8 h-8` Services

Colores: inactivos `text-navy-400`, sobre círculo `bg-navy-50` → `text-navy-500`, acento `text-gold-400/500`, sobre oscuro `text-white/80` o `text-gold-300`.

---

## 4. Rebrand global

### 4.1 Reemplazos textuales

| Buscar | Reemplazar por |
|---|---|
| `Agroturismo Panamá` / `Agroturismo` | `TuriDove` |
| `agroturismo` (slugs, dominio, contenedores) | `turidove` |
| `admin@agroturismo.pa` | `admin@turidove.com` |
| `agroturismo` (DB), `agroturismo-postgres`, `-backend`, `-frontend` | `turidove`, `turidove-postgres`, `turidove-backend`, `turidove-frontend` |
| Tagline "Turismo rural y sostenible" | "Viajes boutique con destinos únicos" |
| Referencias a "Panamá" en copy de marca | reescribir neutralmente ("destinos internacionales", "tu próxima aventura") |

### 4.2 Archivos afectados (lista no exhaustiva)

- `README.md`, `DEPLOYMENT.md`, `DOCKER.md`, `CONTEXT.md` — referencias al nombre.
- `docker-compose.yml` — `container_name`, `POSTGRES_DB` default.
- `.env.docker`, `.env.docker.example` — variables.
- `setup.ps1`, `setup.sh` — mensajes de consola.
- `backend/package.json`, `frontend/package.json` — `name`.
- `frontend/src/app/layout.tsx` — metadata SEO.
- `frontend/src/app/page.tsx` — JSON-LD.
- `frontend/src/lib/translations/*` — strings ES/EN con el nombre viejo.
- `backend/src/main.ts` — title de Swagger.
- `backend/prisma/seed.ts` — datos seed.

### 4.3 Metadata SEO

```ts
title: 'TuriDove — Viajes boutique, hoteles, actividades y paquetes'
description: 'Reserva hoteles boutique, actividades únicas, vehículos y paquetes de viaje internacionales. Experiencias curadas con atención personalizada.'
```

- `<html lang="es">` (default).
- OG title/description/url y JSON-LD (`TravelAgency`/`Organization` con `name`, `description`, `url`, `areaServed: "Internacional"`).

### 4.4 Anclas internas

- `#destinos` → `PopularDestinations`
- `#paquetes` → `FeaturedPackages`
- `#contacto` → `Footer`

### 4.5 Moneda USD

- Helper de formateo en `frontend/src/lib/format-price.ts` (o similar existente) ajustado a `USD 1,234.00`.
- Backend: si existe un campo `currency` en alguna tabla, default `USD`. Si no existe, no se agrega.
- Validators de precios sin cambio.

### 4.6 Credenciales seed (cambios)

| Rol | Email nuevo | Contraseña |
|---|---|---|
| ADMIN | `admin@turidove.com` | `Admin123!` |
| PROVEEDOR | `paris.provider@turidove.com` | `Provider123!` |
| PROVEEDOR | `asia.provider@turidove.com` | `Provider123!` |
| AGENCIA | `boutique.agency@turidove.com` | `Agency123!` |
| OPERADOR | `operator@turidove.com` | `Operator123!` |
| CLIENTE | `cliente1@example.com` | `Client123!` |
| CLIENTE | `cliente2@example.com` | `Client123!` |

---

## 5. Home público y chrome global

### 5.1 Composición del home

Página `frontend/src/app/(public)/page.tsx`, en orden vertical:

| # | Sección | Fondo | Datos |
|---|---|---|---|
| 1 | `HeroSection` | navy gradient + decoración radial dorada | estático (copy + tabs) |
| 2 | `WhyChooseSection` | `bg-white` | 4 features estáticos |
| 3 | `ServicesSection` | `bg-cream` | 4 servicios estáticos |
| 4 | `FeaturedPackages` (ancla `#paquetes`) | `bg-white` | `GET /api/v1/paquetes?limit=3&featured=true` |
| 5 | `FeaturedActivities` | `bg-cream` | `GET /api/v1/actividades?featured=true&limit=3` |
| 6 | `AvailableVehicles` | `bg-white` | `GET /api/v1/vehiculos?limit=3` |
| 7 | `PopularDestinations` (ancla `#destinos`) | `bg-cream` | 6 destinos curados estáticos |
| 8 | `WelcomeBanner` | navy gradient | estático |
| 9 | `Testimonials` | `bg-navy-800` | 3 testimonios curados estáticos |
| 10 | `Footer` | `bg-navy-900` | estático |

Ritmo de fondos: navy → white → cream → white → cream → white → cream → navy → navy-800 → navy-900.

### 5.2 HeroSection (detalle)

- H1 `font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight`. Termina con `<span className="text-gold-300 italic">TuriDove</span>`.
- Subtítulo de una frase: "Viajes boutique con destinos únicos al mejor precio."
- 2 CTAs:
  - Pill dorado: "Buscar destinos" → `#destinos`.
  - Outline blanco: "Ver paquetes" → `#paquetes`.
- Search widget a la derecha (en mobile va debajo):
  - Card `bg-white rounded-2xl p-5 sm:p-6 shadow-xl`.
  - 4 tabs: Hoteles, Paquetes, Actividades, Vehículos.
  - Inputs por tab:
    - Hoteles: destino, fecha entrada/salida, huéspedes → `/hospedajes?...`
    - Paquetes: destino, fecha → `/paquetes?...`
    - Actividades: destino, fecha, personas → `/actividades?...`
    - Vehículos: ciudad, fecha recogida/devolución → `/vehiculos?...`
  - Submit pill dorado "Buscar".

### 5.3 Sección Featured* (Packages, Activities, Vehicles)

- Server components que consumen la API.
- Loading: skeleton cards (`bg-navy-100 animate-pulse`) — 3 cards.
- Empty state: si la API devuelve 0 items, la sección entera no se renderiza.
- Header centrado: H2 Playfair + lead `text-navy-400` + (opcional) "Ver todos →" en `text-gold-500`.
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6`.

### 5.4 Endpoints nuevos requeridos

- `GET /api/v1/hospedajes?featured=true` — soportar query param `featured` (booleano).
- `GET /api/v1/actividades?featured=true` — ídem.
- `GET /api/v1/paquetes` — endpoint nuevo (sección 6).
- Vehículos y transfers: el endpoint listado actual sirve con `?limit=N`.

### 5.5 Campo nuevo `isFeatured`

- Se agrega a `Hospedaje`, `Actividad`, `Vehiculo`, `Transfer`. Booleano default `false`.
- Migración Prisma con default no rompe seed existente.
- Editable desde admin (toggle) y desde el panel del proveedor dueño.
- Aunque `FeaturedHotels` no aparece en el home, el campo queda disponible para listados/búsqueda.

### 5.6 Header público

`frontend/src/components/layout/header.tsx` (reemplazo):

- Sticky, `h-16`, `bg-white/95 backdrop-blur-md`, border-bottom `border-navy-100/50`, `z-50`.
- Logo: triángulo dorado doble + kicker `VIAJES` (`text-[10px] tracking-[0.2em] uppercase text-navy-400`) + wordmark `TuriDove`.
- Nav desktop: `Inicio`, `Hoteles` (→ `/hospedajes`), `Paquetes` (→ `/paquetes`), `Actividades` (→ `/actividades`), `Contacto` (→ `#contacto`).
- No autenticado: `Iniciar sesión` (link navy) + `Registrarse` (CTA pill dorado).
- Autenticado: dropdown con avatar (gradiente dorado, iniciales). Items dinámicos según rol:
  - CLIENTE: Mis Reservas, Mis Pagos, Mi Perfil, Cerrar sesión.
  - PROVEEDOR / AGENCIA: Panel + items específicos del rol.
  - OPERADOR: Panel operador.
  - ADMIN: Panel admin.
- Hamburger animado (3 spans → X) en mobile.

### 5.7 Footer

`frontend/src/components/layout/footer.tsx`:

- `bg-navy-900 text-white`, 4 columnas en desktop, 2 en mobile.
  - **Brand:** logo + descripción corta + 4 social icons (placeholders `#`).
  - **Destinos:** 4 destinos (París, Roma, Tokio, Nueva York — coherente con seed). Cada link va a `/hospedajes?search={ciudad}` (usa el filtro `search` existente del módulo de hospedajes).
  - **Servicios:** Hoteles, Paquetes, Actividades, Vehículos.
  - **Empresa:** Sobre nosotros, Términos, Privacidad, Contacto (placeholders `#`).
- Divisor `border-white/10`, copyright "© 2026 TuriDove. Todos los derechos reservados."
- `id="contacto"`.

### 5.8 Páginas públicas no-home

- **Listados** (`/hospedajes`, `/actividades`, `/vehiculos`, `/transfers`, `/paquetes`): header con título Playfair + lead, filtros sticky a la izquierda en desktop, grid de cards con `rounded-2xl shadow-card`. Título visible: "Hoteles" (no "Hospedajes").
- **Detalles** (`/hospedajes/[slug]`, etc.): hero con galería, contenido en 2 columnas (info + sticky CTA reservar pill dorado).
- **Auth** (`/login`, `/register`, `/forgot-password`): card `rounded-2xl shadow-sm border border-navy-100/50 bg-white p-8 max-w-md` centrada sobre `bg-cream`. Sin imagen de fondo decorativa.

---

## 6. Módulo Paquetes (nuevo)

### 6.1 Modelo Prisma

```prisma
model Paquete {
  id                  String    @id @default(cuid())
  nombre              String
  slug                String    @unique
  descripcion         String
  hospedajeId         String
  habitacionId        String
  actividadId         String?
  vehiculoId          String?
  diasDuracion        Int       // 1-30
  noches              Int       // 0-29
  descuentoPorcentaje Decimal   @db.Decimal(5,2) @default(0)  // 0-50
  imagenPrincipal     String?
  isFeatured          Boolean   @default(false)
  isActive            Boolean   @default(true)
  validoDesde         DateTime
  validoHasta         DateTime
  proveedorId         String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  hospedaje           Hospedaje  @relation(fields: [hospedajeId], references: [id])
  habitacion          Habitacion @relation(fields: [habitacionId], references: [id])
  actividad           Actividad? @relation(fields: [actividadId], references: [id])
  vehiculo            Vehiculo?  @relation(fields: [vehiculoId], references: [id])
  proveedor           User?      @relation(fields: [proveedorId], references: [id])
  reservas            Reserva[]

  @@index([slug])
  @@index([isFeatured, isActive])
}
```

### 6.2 Reservas

- Enum `TipoReserva` extendido con `PAQUETE`.
- Tabla `Reserva` recibe campo opcional `paqueteId String?` con su FK.
- El flujo de pago usa `montoTotal` existente.

### 6.3 Cálculo de precio (backend, no almacenado)

```
precioBase = (habitacion.precioTemporada × noches)
           + (actividad?.precio ?? 0)
           + (vehiculo?.pricePerDay × diasDuracion ?? 0)

precioConDescuento = precioBase × (1 - descuentoPorcentaje/100)

precioFinal = precioConDescuento × (1 + margenComercial.paquetes/100)
```

Se agrega campo `margenPaquetes` (default 12) a la entidad `Configuracion`.

### 6.4 Endpoints

Módulo `backend/src/modules/paquetes/`:

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/paquetes` | público | Listado con `?search`, `?featured`, `?limit`, `?page` |
| `GET` | `/api/v1/paquetes/:slug` | público | Detalle por slug |
| `GET` | `/api/v1/paquetes/:id/precio` | público | Cálculo dinámico (recibe `fechaInicio` query) |
| `POST` | `/api/v1/paquetes` | ADMIN, PROVEEDOR, AGENCIA | Crear |
| `PATCH` | `/api/v1/paquetes/:id` | ADMIN + owner | Actualizar |
| `DELETE` | `/api/v1/paquetes/:id` | ADMIN + owner | Soft delete (`isActive=false`) |
| `POST` | `/api/v1/reservas` | CLIENTE | Acepta `{ tipo: 'PAQUETE', paqueteId, fechaInicio, huespedes }` |

**Validaciones de creación:**
- `habitacionId` pertenece a `hospedajeId`.
- Si `proveedorId` no es admin: `hospedajeId`/`actividadId`/`vehiculoId` deben ser del mismo proveedor (ownership).
- `validoHasta > validoDesde`.
- `descuentoPorcentaje` entre 0 y 50.

Auditoría: el interceptor existente captura POST/PATCH/DELETE automáticamente.

### 6.5 Frontend — páginas públicas

**`/paquetes`** (listado):
- Hero corto con H2 "Paquetes destacados" + lead.
- Filtros: búsqueda por nombre, rango de precio, días de duración.
- Grid 3 columnas con cards `rounded-2xl shadow-card`.
- Card: imagen, nombre Playfair, destino (`hospedaje.ciudad`), días, `Desde $X,XXX`, badge "Ahorra X%" en `bg-gold-400` si `descuentoPorcentaje > 0`.

**`/paquetes/[slug]`** (detalle):
- Galería arriba (imagen principal + imágenes del hospedaje).
- Secciones verticales: "Qué incluye" (lista con icono — Hospedaje, Actividad si hay, Vehículo si hay), "Itinerario sugerido" (descripción + duración), "Política y vigencia" (rango de fechas).
- Sticky lateral derecho: selector de fecha de inicio + cálculo de precio en vivo (consume `/precio`), CTA pill dorado "Reservar paquete".
- Flujo de reserva usa la pantalla de pago simulado existente.

**`FeaturedPackages` (home):** 3 cards con `Desde $X,XXX` + badge de descuento + CTA "Reservar".

### 6.6 Frontend — paneles privados

- **Admin → Paquetes:** DataTable con todos. Formulario crear/editar con dropdowns dependientes (`hospedaje` → carga `habitaciones`), opcionales para actividad/vehículo, slider de descuento, date pickers de vigencia, toggle `isFeatured` (solo admin).
- **Proveedor / Agencia → Mis Paquetes:** misma pantalla pero filtrada a sus recursos. Solo puede combinar recursos propios.
- **Operador:** ve paquetes en el flujo de reservas, no los crea.
- **Cliente:** los ve en home/listado y en `Mis Reservas` cuando tiene una reserva tipo `PAQUETE`.

### 6.7 Configuración

`Admin → Configuración → Márgenes` agrega "Paquetes — Margen (%)" (default 12).

### 6.8 i18n

Strings nuevos ES/EN:
- `paquetes.titulo`, `paquetes.subtitulo`, `paquetes.incluye`, `paquetes.ahorra`, `paquetes.desde`, `paquetes.validoHasta`, `paquetes.reservar`, más ~10 strings del formulario admin.

### 6.9 Alcance excluido del módulo

- Sin reviews/rating de paquetes.
- Sin wishlist/favoritos.
- Sin packages dinámicos autogenerados.
- Sin inventario propio del paquete: depende de disponibilidad de hospedaje/actividad/vehículo.

---

## 7. Paneles privados y repintado

### 7.1 Layout admin

- `fixed inset-0 z-[100] flex bg-cream` — toma toda la pantalla.
- Sidebar `w-[260px]` a la izquierda.
- Contenido: header admin `h-16` + área scroll `p-8`.

### 7.2 Sidebar

`frontend/src/components/admin/sidebar.tsx` (compartido con variantes por rol):

- Logo header (`h-16`) con triángulo dorado + kicker uppercase según rol (`ADMIN`, `PROVEEDOR`, `AGENCIA`, `OPERADOR`, `MI CUENTA`) + wordmark `TuriDove`.
- Nav agrupado por secciones con eyebrow `text-[10px] tracking-[0.15em] uppercase text-navy-300`.
- Item inactivo: `text-navy-500`, icono `text-navy-400`, hover `bg-navy-50/60`.
- Item activo: `bg-gold-50/80`, `text-navy-800 font-medium`, icono `text-gold-500`, acento lateral 3px dorado.
- Iconos `w-[18px] h-[18px]` (Lucide).

### 7.3 Estructura del sidebar por rol

| Rol | Secciones |
|---|---|
| ADMIN | Principal (Dashboard) · Catálogo (Hoteles, Actividades, Paquetes, Transfers, Vehículos) · Operación (Reservas, Pagos) · Finanzas (Resumen, Proveedores, Ocupación) · Sistema (Usuarios, Auditoría, Configuración) |
| PROVEEDOR | Principal (Dashboard) · Mis Recursos (Hoteles, Actividades, Vehículos, Paquetes) · Operación (Reservas) · Finanzas (Mis ingresos) |
| AGENCIA | Igual a PROVEEDOR |
| OPERADOR | Principal (Dashboard) · Operación (Reservas, Transfers) · Reportes |
| CLIENTE | Mis Reservas · Mis Pagos · Mi Perfil · Carrito |

### 7.4 Header admin

- Izquierda: H1 `text-lg font-display font-bold text-navy-800` (título de página) + breadcrumb `text-xs text-navy-400`.
- Derecha: search box inline (`bg-navy-50/60 border-navy-100/40`, con `⌘K` kbd), botón notificaciones (campana `w-5 h-5 text-navy-400` con dot dorado si hay), avatar gradiente dorado.

### 7.5 Componentes compartidos a repintar

| Componente | Cambios |
|---|---|
| `DataTable` | Bordes `border-navy-100/50`. Headers `text-navy-400 uppercase text-[10px] tracking-[0.15em]`. Hover de fila `bg-navy-50/40`. Paginación con botones outline + número activo pill dorado. |
| `PageHeader` | Título Playfair `text-2xl` + lead corto `text-navy-400`. CTA primario pill dorado a la derecha. |
| `PaymentModal` | Card `rounded-2xl bg-white shadow-xl`. Opciones como cards seleccionables (radio cards con borde dorado al activo). |
| `ConfirmationModal` | Misma estética. CTA destructivo pill `bg-red-500 hover:bg-red-600`. |
| `FileUploader` | Drop zone `border-2 border-dashed border-navy-100 hover:border-gold-400 rounded-2xl bg-cream/50`. Preview en grid `rounded-xl`. |
| `SearchInput` | Input premium del manual. |
| `EmptyState` | Icono `w-12 h-12 text-navy-300`, título Playfair, lead corto, CTA pill dorado. |
| `LoadingSpinner` | `border-2 border-gold-400 border-t-transparent rounded-full animate-spin`. |
| `Skeleton` | `bg-navy-100 animate-pulse rounded-lg`. |
| `Badge` (estado) | Tabla semántica del manual (sección 13.1). |
| `Tabs` | Activo `bg-navy-600 text-white`. Inactivo `bg-navy-50 text-navy-500 hover:bg-navy-100`. |

### 7.6 Páginas privadas a repintar

- **Dashboards** (admin, proveedor, agencia, operador, cliente): cards KPI `rounded-2xl shadow-card`, número grande Playfair, lead `text-navy-400`. Charts existentes con paleta gold/navy.
- **Listados de catálogo:** DataTable repintado + filtros premium + CTA `+ Nuevo` pill dorado.
- **Formularios crear/editar:** card `rounded-2xl bg-white shadow-card p-8`, secciones separadas por divisores `border-navy-100/50`, labels `text-navy-700`, inputs premium, helper text `text-navy-400`, footer con `Cancelar` (ghost) + `Guardar` (pill dorado).
- **Reservas admin/operador:** DataTable con badges de estado.
- **Reservas cliente:** cards stack vertical (no tabla), cada una `rounded-2xl shadow-card` con imagen del recurso.
- **Pagos:** DataTable admin / cards cliente.
- **Auditoría:** DataTable con filtros (entidad, usuario, fecha).
- **Configuración admin:** card con tabs (Márgenes, Idioma, Notificaciones).

---

## 8. Seed y contenido inicial

### 8.1 Destinos curados (6)

| # | Destino | País | Etiqueta |
|---|---|---|---|
| 1 | París | Francia | Capital |
| 2 | Roma | Italia | Histórica |
| 3 | Tokio | Japón | Asia |
| 4 | Nueva York | EE.UU. | Urbana |
| 5 | Santorini | Grecia | Isla |
| 6 | Marrakech | Marruecos | Boutique |

Los 4 del footer son París, Roma, Tokio, Nueva York.

### 8.2 Usuarios seed

Ver tabla en sección 4.6.

### 8.3 Catálogo seed

| Entidad | Cantidad | Notas |
|---|---|---|
| Hoteles | 6 | 1 por destino. 2 tipos de habitación cada uno. |
| Tipos de habitación | 12 | Single/Double/Suite/Family variados. |
| Tarifas de habitación | 36 | 3 temporadas (Alta/Media/Baja) × 12. |
| Actividades | 6 | 1 por destino. 3 marcadas `isFeatured`. |
| Vehículos | 4 | Distribuidos en 4 destinos, una categoría cada uno. |
| Transfers | 3 | París CDG↔Hotel, Roma FCO↔Hotel, NY JFK↔Manhattan. |
| Paquetes | 3 | "París Esencial", "Roma Imperial", "Santorini Relax". Todos `isFeatured: true`. |
| Reservas ejemplo | 2 | 1 confirmada (cliente1), 1 pendiente (cliente2). |

### 8.4 Imágenes

- Borrar contenido actual de `backend/uploads/` (imágenes panameñas).
- Script nuevo `backend/prisma/seed-images.ts`:
  - Descarga ~30-40 imágenes de Unsplash/Pexels (API pública o URLs directas con query por destino).
  - Las guarda en `backend/uploads/` con nombres deterministas (`paris-hotel-1.jpg`, etc.).
  - Asocia cada imagen a las entidades del seed.
  - Idempotente: si el archivo ya existe, no lo redescarga.
- Si la descarga falla (red, rate limit), el seed continúa con `mainImage: null` — la UI muestra gradiente placeholder elegante hasta que admin suba reales.

### 8.5 Configuración inicial (tabla `Configuracion`)

- Márgenes: Hoteles 15%, Actividades 12%, Transfers 10%, Vehículos 10%, **Paquetes 12%** (nuevo).
- Moneda: `USD`.
- Idioma default: `es`.

### 8.6 Testimonios estáticos (hardcoded en `Testimonials.tsx`)

| Cliente | Ubicación | Rating | Texto |
|---|---|---|---|
| Sofía Lima | São Paulo | ★★★★★ | "París con TuriDove fue una experiencia única. Cada detalle pensado, cada recomendación acertada." |
| James Chen | Singapur | ★★★★★ | "El paquete a Tokio superó todas mis expectativas. Boutique, personalizado, impecable." |
| Lucía Fernández | Madrid | ★★★★☆ | "Excelente atención. Santorini fue un sueño, y todo organizado al detalle." |

### 8.7 Implementación

- Reemplazar `backend/prisma/seed.ts` con el nuevo seeder TuriDove.
- Mantener idempotencia (upserts por email/slug).
- Mantener hash bcrypt 10 rounds.
- Regenerar `docker/postgres/init/01-dump.sql` después del nuevo seed para que `setup.sh` levante TuriDove directo sin paso manual.
- Comando: `npm run seed` corre el nuevo seeder.

---

## 9. Integración con Stripe (pasarela de pago)

### 9.1 Modalidad

**Stripe Checkout hosteado** + **webhooks** de confirmación. Es la única vía de pago: se eliminan los métodos simulados Tarjeta/Yappy/Transferencia/Efectivo del modal actual.

Flujo:
1. Cliente confirma reserva → backend crea `Reserva` en estado `PENDIENTE` + `Pago` en `PENDING`.
2. Backend llama a `stripe.checkout.sessions.create()` y devuelve `session.url` al frontend.
3. Frontend redirige al cliente a la URL de Stripe.
4. Cliente paga (o cancela) en página de Stripe.
5. Stripe redirige a `success_url` o `cancel_url` (páginas del frontend).
6. **En paralelo:** Stripe envía webhook `checkout.session.completed` (o `payment_intent.payment_failed`) al backend.
7. Backend actualiza `Pago` a `COMPLETED`/`FAILED` y `Reserva` a `CONFIRMADA`/`CANCELADA` según el evento.

La confirmación se hace por **webhook**, no por redirect. El redirect solo lleva al cliente a una página de "Pago recibido, te enviaremos confirmación".

### 9.2 Modelo de datos (cambios en `Pago`)

Campos nuevos en la tabla `Pago`:

```prisma
stripeSessionId       String?  @unique
stripePaymentIntentId String?  @unique
stripeCheckoutUrl     String?
stripeEventLog        Json?    // últimos eventos recibidos por webhook
```

Se elimina el campo `metodoPago` (o se conserva como `metodoPago String @default("STRIPE")` por compatibilidad con queries existentes; ver decisión en plan).

### 9.3 Endpoints nuevos / modificados

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/pagos/checkout` | CLIENTE | Crea Checkout Session para una reserva pendiente. Devuelve `{ url, sessionId }`. |
| `POST` | `/api/v1/pagos/webhook` | Stripe (firma) | Recibe webhooks de Stripe. Verifica firma con `STRIPE_WEBHOOK_SECRET`. Idempotente. |
| `POST` | `/api/v1/pagos/:id/reembolso` | ADMIN | Crea reembolso vía `stripe.refunds.create()`. Marca `Pago` como `REFUNDED`. |
| `GET` | `/api/v1/pagos/:id` | dueño + ADMIN | Devuelve estado y datos de Stripe (sin secrets). |

**Eventos de webhook manejados:**
- `checkout.session.completed` → `Pago.COMPLETED` + `Reserva.CONFIRMADA`
- `checkout.session.expired` → `Pago.FAILED` + `Reserva.CANCELADA`
- `payment_intent.payment_failed` → `Pago.FAILED`
- `charge.refunded` → `Pago.REFUNDED`

**Idempotencia:** cada webhook trae un `event.id` único. Se mantiene tabla `StripeEvent` (o columna `eventosProcesados` en `Pago`) para no procesar el mismo evento dos veces.

### 9.4 Frontend — flujo de pago

Reemplazo del `PaymentModal` actual:

- Pantalla de **resumen de reserva** previa al pago (card `rounded-2xl shadow-card` con detalle del recurso, fechas, total).
- CTA único pill dorado: **"Pagar con tarjeta"** (subtítulo pequeño: "Procesado de forma segura por Stripe").
- Footer del modal con logos `Visa / Mastercard / Amex / Stripe` (SVGs pequeños en `text-navy-400`).
- Al hacer click: spinner, llamada a `/pagos/checkout`, redirect a `session.url`.
- Páginas nuevas:
  - `/reservas/[id]/pago/exito` — Card `rounded-2xl bg-white shadow-card`, icono de check dorado, mensaje "Recibimos tu pago. Tu reserva está confirmada.", CTA a "Mis Reservas".
  - `/reservas/[id]/pago/cancelado` — Card neutra, mensaje "El pago fue cancelado. Tu reserva sigue pendiente.", CTA a "Reintentar pago".

### 9.5 Backend — implementación

- Módulo `backend/src/modules/stripe/` con `StripeService` (cliente singleton, lee `STRIPE_SECRET_KEY` del env).
- Inyectado en `PagosService`.
- Webhook route con `@Public()` (sin JWT) y verificación de firma con `stripe.webhooks.constructEvent()`. **Importante:** el body debe llegar RAW (no parseado) — configurar `bodyParser: false` para esa ruta en `main.ts`.
- Reembolsos: llamada a `stripe.refunds.create({ payment_intent })` desde `PagosService.reembolsar()`.

### 9.6 Configuración (envs nuevos)

En `.env.docker` y `.env.docker.example`:

```env
# Stripe (modo test por defecto)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CURRENCY=usd
STRIPE_SUCCESS_URL=http://localhost:3000/reservas/{RESERVA_ID}/pago/exito
STRIPE_CANCEL_URL=http://localhost:3000/reservas/{RESERVA_ID}/pago/cancelado
```

El frontend expone solo `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` (no usa el secreto). Como es Checkout hosteado, en realidad ni siquiera necesita la public key en runtime para esta integración — todo lo orquesta el backend. Se documenta el env para futuras integraciones con Elements.

### 9.7 Modo desarrollo

- Stripe modo **test** por defecto en `.env.docker.example` (claves `sk_test_` / `pk_test_`).
- Webhooks en desarrollo: documentar uso de `stripe listen --forward-to localhost:3001/api/v1/pagos/webhook` (CLI de Stripe).
- Sin Stripe CLI, los webhooks no llegan en local — pero el flujo funciona vía `success_url` redirect (la reserva queda en `PENDIENTE` hasta que llegue el webhook real).
- En seed: las 2 reservas de ejemplo no usan Stripe real — se insertan ya `CONFIRMADA` para mostrar UI poblada.

### 9.8 Auditoría y i18n

- El interceptor de auditoría captura POST a `/pagos/checkout` y `/pagos/:id/reembolso`.
- Webhooks no se auditan (vienen de Stripe, no de usuarios).
- Strings nuevos ES/EN: `pagos.pagarConTarjeta`, `pagos.procesadoPorStripe`, `pagos.exitoTitulo`, `pagos.exitoLead`, `pagos.canceladoTitulo`, `pagos.canceladoLead`, `pagos.reintentar`.

### 9.9 Alcance excluido del módulo Stripe

- Sin suscripciones / pagos recurrentes (todo es one-shot).
- Sin Stripe Connect / multi-vendor (todos los pagos van a una sola cuenta de plataforma — el reparto a proveedores sigue siendo manual vía el módulo Financiero existente).
- Sin guardado de tarjeta para futuros usos (no se crean `Customer` permanentes en Stripe).
- Sin 3DS adicional manual (Stripe Checkout lo maneja automáticamente).
- Sin pagos parciales / depósitos (siempre se cobra el total).

---

## 10. Fases de implementación (resumen)

Orden recomendado para minimizar reproceso. Cada fase es testeable de forma independiente.

1. **Fase 1 — Cimientos visuales.** Tailwind config (paleta + sombras + radios), fuentes Playfair + DM Sans, `globals.css`, variables CSS de Shadcn redirigidas.
2. **Fase 2 — Rebrand global.** Reemplazos textuales en envs, docker, README, metadata, i18n, seed admin.
3. **Fase 3 — Chrome global.** Header + Footer + páginas auth con el design system.
4. **Fase 4 — Home nuevo.** 10 secciones (incluido el campo `isFeatured` en Hospedaje/Actividad/Vehiculo/Transfer y los query params `featured` en los endpoints).
5. **Fase 5 — Paneles repintados.** Sidebar, header admin, componentes compartidos, dashboards, listados, formularios, reservas, pagos, auditoría, configuración.
6. **Fase 6 — Módulo Paquetes.** Migración Prisma, endpoints, validaciones, frontend público (listado + detalle), frontend admin/proveedor/agencia, integración con reservas y pagos, configuración de margen.
7. **Fase 7 — Integración Stripe.** Módulo `stripe`, migración de `Pago` con campos Stripe, endpoint `/pagos/checkout`, webhook con verificación de firma, páginas de éxito/cancelado, reemplazo del `PaymentModal`, reembolsos admin via Stripe API, envs.
8. **Fase 8 — Seed internacional.** Borrado de imágenes antiguas, nuevo seeder, script de descarga de imágenes, regeneración del dump SQL.

Cada fase queda formalmente especificada en el plan de implementación (paso siguiente al spec).

---

## 11. Criterios de éxito

- El proyecto sigue arrancando con `setup.ps1`/`setup.sh` sin intervención manual.
- `docker compose --env-file .env.docker up -d` levanta TuriDove con catálogo internacional poblado.
- Todos los flujos existentes (reserva, pago, dashboards por rol, auditoría) funcionan idénticos.
- El home se ve como un sitio de agencia de viajes boutique premium (no como un sitio rural).
- El módulo Paquetes es usable end-to-end: admin crea → cliente reserva → pago se registra → auditoría captura.
- El flujo de pago con Stripe funciona end-to-end en modo test: cliente reserva → Checkout → tarjeta de prueba Stripe (`4242 4242 4242 4242`) → webhook llega → reserva queda confirmada → admin puede reembolsar.
- La UI muestra USD en todas las páginas (no balboas/PAB).
- Sin referencias visibles a "Agroturismo", "Panamá rural" o credenciales antiguas en producción.
- Lighthouse/visual: jerarquía clara, espacios consistentes, sin elementos rotos en mobile.
