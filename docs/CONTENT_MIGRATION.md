# TuriTravel v2 → TuriDove — Manual de Contenido y Migración

> **Propósito:** Inventario completo del contenido, taxonomía y copy de TuriTravel v2 para guiar la transformación del proyecto destino en **TuriDove** (agencia de turismo, distintos destinos, mismo modelo de negocio).
>
> **Cómo usar este documento:**
> - **Secciones 1-3** → describen QUÉ vende el sitio (taxonomía, entidades, estados). Replicar tal cual.
> - **Sección 4** → catálogo de datos hardcoded actualmente visibles. **Estos son los textos/datos a REEMPLAZAR** en TuriDove.
> - **Sección 5** → copy textual (títulos, CTAs, descripciones). Cambiar branding pero mantener tono.
> - **Sección 6** → guía explícita de cambios "TuriTravel → TuriDove".
>
> **Acompaña a:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (identidad visual).

---

## 1. Modelo de negocio (qué vende el sitio)

TuriTravel es una **agencia de viajes online** con cinco líneas de producto:

| # | Servicio | Descripción | Modelo de cobro |
|---|---|---|---|
| 1 | **Hoteles** | Alojamiento por noche en hoteles con habitaciones tipificadas (single, double, suite, family) | Precio por habitación × noches |
| 2 | **Actividades** | Tours, excursiones y experiencias guiadas con itinerario opcional multi-día | Precio por persona |
| 3 | **Vehículos** | Alquiler de autos, vans, buses, motos y minibuses | Precio por día |
| 4 | **Traslados** (Transfers) | Servicios de transporte punto a punto (aeropuerto, hotel, ciudad, puerto) con conductor | Precio fijo / por km / por hora |
| 5 | **Paquetes** | Combos de hotel + (actividad y/o vehículo) con descuento porcentual y vigencia | Precio compuesto con descuento |

**Características transversales:**
- Reservas, pagos con Stripe (precios en centavos de COP), webhooks de confirmación.
- Cuentas de usuario con verificación de email, favoritos (wishlist), reseñas, notificaciones in-app.
- Banners promocionales por zona de página.
- Newsletter con doble opt-in.
- Roles: ADMIN, OPERATOR, CUSTOMER.

---

## 2. Taxonomía completa (enums del schema)

Todos los conjuntos cerrados de valores que existen en el modelo. Sirven para validar formularios, filtros, badges y mostrar etiquetas legibles.

### 2.1 Roles de usuario (`UserRole`)
- `ADMIN` — Acceso total
- `OPERATOR` — Gestiona hoteles/vehículos asignados
- `CUSTOMER` — Cliente final (por defecto al registrarse)

### 2.2 Categorías de habitación (`RoomCategory`)
- `SINGLE` — Individual
- `DOUBLE` — Doble
- `SUITE` — Suite
- `FAMILY` — Familiar

### 2.3 Tipo de vehículo (`VehicleType`)
- `CAR` — Auto
- `VAN` — Van
- `BUS` — Bus
- `MOTORCYCLE` — Moto
- `MINIBUS` — Minibús

### 2.4 Estado de vehículo (`VehicleStatus`)
- `ACTIVE` · `INACTIVE` · `MAINTENANCE`

### 2.5 Estado de hotel/actividad (`HotelStatus`, `ActivityStatus`)
- `DRAFT` — Borrador (no público)
- `ACTIVE` — Publicado
- `INACTIVE` — Despublicado temporalmente

### 2.6 Tipo de reserva (`BookingType`)
- `HOTEL` · `ACTIVITY` · `VEHICLE` · `PACKAGE`

### 2.7 Estado de reserva (`BookingStatus`)
- `PENDING` — Pago en curso (TTL aprox 15 min)
- `CONFIRMED` — Pago exitoso
- `CANCELLED` — Cancelada por usuario u operador
- `EXPIRED` — Pago no completado a tiempo
- `PAYMENT_FAILED` — Stripe rechazó el pago
- `REFUNDED` — Reembolso total
- `PARTIALLY_REFUNDED` — Reembolso parcial

### 2.8 Estado de pago (`PaymentStatus`)
- `PENDING` · `COMPLETED` · `FAILED` · `REFUNDED`

### 2.9 Modo de pricing de transfer (`TransferPricingMode`)
- `FIXED` — Precio fijo por ruta
- `PER_KM` — Precio por kilómetro
- `PER_HOUR` — Precio por hora

### 2.10 Estado de reserva de transfer (`TransferBookingStatus`)
- `PENDING` · `CONFIRMED` · `CANCELLED` · `COMPLETED` · `EXPIRED` · `REFUNDED`

### 2.11 Tipos para Transfers (strings libres, no enum)

**Origin/Destination type:** `airport`, `hotel`, `city_center`, `port`
**Vehicle type de transfer (string):** `sedan`, `suv`, `van`, `minibus`, `bus`

### 2.12 Tipo de servicio (Review/Favorite — `ServiceType`)
- `HOTEL` · `ACTIVITY` · `VEHICLE` · `TRANSFER`

### 2.13 Estado de review (`ReviewStatus`)
- `PENDING` (moderación) · `APPROVED` · `REJECTED`

### 2.14 Tipo de notificación (`NotificationType`)
- `BOOKING_CONFIRMED`
- `BOOKING_CANCELLED`
- `PAYMENT_FAILED`
- `REVIEW_APPROVED`
- `REVIEW_REJECTED`
- `TRANSFER_CONFIRMED`
- `PASSWORD_CHANGED`

### 2.15 Ubicación de banner (`PageLocation`)
- `HOME_HERO`
- `HOME_SECONDARY`
- `HOTELS_TOP`
- `ACTIVITIES_TOP`
- `VEHICLES_TOP`
- `TRANSFERS_TOP`

### 2.16 Newsletter status (string, no enum)
- `PENDING_CONFIRMATION` · `CONFIRMED` · `UNSUBSCRIBED`

---

## 3. Esquema de datos por entidad (campos a poblar en TuriDove)

### 3.1 Hotel

| Campo | Tipo | Notas |
|---|---|---|
| `name` | String | Nombre comercial |
| `slug` | String único | URL-safe (kebab-case) |
| `description` | String | Descripción larga |
| `address` | String | Dirección postal |
| `city` | String | Ciudad |
| `country` | String (ISO-2) | Default `CO` |
| `stars` | Int 1–5 | Default 3 |
| `amenities` | String[] | Lista libre (ej. WiFi, Pool, Spa, Gym) |
| `mainImage` | String? | URL |
| `latitude`, `longitude` | Float? | Coordenadas |
| `status` | HotelStatus | DRAFT/ACTIVE/INACTIVE |
| `operatorId` | String? | Owner |
| `isActive` | Boolean | Soft flag |

**Relaciones:** `roomTypes` (1:N), `images` (1:N), `packages` (1:N).

### 3.2 RoomType (Tipo de habitación)

| Campo | Tipo | Notas |
|---|---|---|
| `hotelId` | String | FK a Hotel |
| `name` | String | Ej. "Suite con balcón al mar" |
| `description` | String? | |
| `category` | RoomCategory | SINGLE/DOUBLE/SUITE/FAMILY |
| `capacity` | Int | Número de personas |
| `pricePerNight` | Decimal(10,2) | En COP |
| `totalRooms` | Int | Inventario disponible |
| `amenities` | String[] | Específicos de la habitación |

### 3.3 Activity (Actividad turística)

| Campo | Tipo | Notas |
|---|---|---|
| `name` | String | |
| `slug` | String único | |
| `description` | String | |
| `categoryId` | String | FK a ActivityCategory |
| `city` | String | |
| `duration` | Float | Horas (0.5 a 168, hasta 7 días) |
| `capacity` | Int | 1 a 1000 personas |
| `price` | Decimal(10,2) | Por persona, en COP |
| `included` | String[] | Lista de inclusiones |
| `notIncluded` | String[] | Lista de exclusiones |
| `mainImage` | String? | |
| `status` | ActivityStatus | |

**Relaciones:** `category` (N:1), `itinerary` (1:N días).

**ItineraryItem:** `day` (Int), `title`, `description`, `lat/lng/locationName` opcionales. Único por (`activityId`, `day`).

### 3.4 ActivityCategory

| Campo | Notas |
|---|---|
| `name` único | Ej. "Aventura", "Cultural" |
| `slug` único | |
| `icon` | String? (nombre de ícono) |

### 3.5 Vehicle (Vehículo de alquiler)

| Campo | Tipo | Notas |
|---|---|---|
| `brand` | String | Ej. Toyota |
| `model` | String | Ej. Hilux |
| `slug` | String único | |
| `year` | Int | |
| `type` | VehicleType | |
| `capacity` | Int | Pasajeros |
| `pricePerDay` | Decimal(10,2) | En COP |
| `features` | String[] | Ej. ["AC","GPS","Bluetooth"] |
| `city` | String | Ciudad de origen |

### 3.6 Transfer (Servicio de traslado)

| Campo | Tipo | Notas |
|---|---|---|
| `vehicleType` | String | sedan/suv/van/minibus/bus |
| `capacityPassengers` | Int | |
| `capacityLuggage` | Int | |
| `priceCalculationMode` | TransferPricingMode | FIXED / PER_KM / PER_HOUR |
| `amenities` | Json | Default `[]` |
| `driverName`, `driverPhone` | String? | |
| `companyName`, `companyLicense` | String? | |
| `available24h` | Boolean | |
| `advanceBookingHours` | Int | Default 24 |

### 3.7 TransferRoute (Ruta servida)

| Campo | Notas |
|---|---|
| `originName`, `originLat`, `originLng`, `originType` | airport/hotel/city_center/port |
| `destinationName`, `destinationLat`, `destinationLng`, `destinationType` | |
| `distanceKm` | Float |
| `estimatedDurationMinutes` | Int |
| `fixedPrice` / `pricePerKm` / `pricePerHour` | Solo uno según modo |
| `isBidirectional` | Boolean |
| `isPopular` | Boolean (para destacar) |

### 3.8 Package (Paquete combinado)

| Campo | Notas |
|---|---|
| `name`, `slug`, `description` | |
| `hotelId` + `roomTypeId` | Obligatorios |
| `activityId`, `vehicleId` | Opcionales |
| `discountPercentage` | Decimal(5,2), default 0 |
| `validFrom`, `validTo` | DateTime |

### 3.9 Banner

| Campo | Notas |
|---|---|
| `pageLocation` | Enum PageLocation |
| `title`, `subtitle` | Strings opcionales |
| `imageUrl` | URL |
| `buttonText`, `buttonUrl` | CTA |
| `sortOrder` | Int |
| `validFrom`, `validUntil` | Ventana opcional |

### 3.10 Review

| Campo | Notas |
|---|---|
| `serviceType` + `serviceId` | A qué entidad apunta |
| `bookingId` | Proof of purchase obligatorio |
| `rating` | Int 1–5 |
| `title`, `body` | |
| `status` | PENDING → moderación |
| `isFeatured` | Boolean |
| `replyText`, `replyAt` | Respuesta del operador |
| Constraint único | `(userId, serviceType, serviceId)` — 1 review por servicio por usuario |

### 3.11 NewsletterSubscriber

| Campo | Notas |
|---|---|
| `email` único | |
| `status` | PENDING_CONFIRMATION → CONFIRMED → UNSUBSCRIBED |
| `tokenHash`, `tokenExpiry`, `isTokenUsed` | Doble opt-in |

---

## 4. Catálogo de contenido actual (datos a reemplazar)

> **Nota crítica:** El seed (`packages/database/prisma/seed.ts`) **solo crea un usuario admin**. Todo el catálogo mostrado en el home está **hardcoded en los componentes del frontend** como arrays inline. Esto significa que para TuriDove:
>
> - O se reemplazan los arrays inline en cada componente del home (más rápido para un demo).
> - O se construye un seeder real y los componentes pasan a consumir el backend (recomendado a mediano plazo).

### 4.1 Usuario admin sembrado

| Campo | Valor por defecto | Variable de entorno |
|---|---|---|
| email | `admin@turitravel.com` | `ADMIN_EMAIL` |
| password | `Admin123!` | `ADMIN_PASSWORD` |
| firstName | `Admin` | `ADMIN_FIRST_NAME` |
| role | `ADMIN` | (fijo) |
| isActive | `true` | (fijo) |

**Para TuriDove:** cambiar a `admin@turidove.com` y nueva contraseña.

### 4.2 Hoteles destacados (en `FeaturedHotels.tsx`)

| Nombre | Ciudad | Estrellas | Precio/noche |
|---|---|---|---|
| Hotel Caribe | Cartagena | 4 | $450.000 COP |
| Hotel Las Américas | Cartagena | 5 | $680.000 COP |
| Hotel Santa Clara | Cartagena | 5 | $920.000 COP |
| Hotel Dann Carlton | Medellín | 4 | $320.000 COP |
| Estelar Santamar | Santa Marta | 4 | $380.000 COP |
| Hotel Decameron | San Andrés | 4 | $520.000 COP |

### 4.3 Paquetes destacados (en `FeaturedPackages.tsx`)

| Nombre | Destino | Días | Precio (desde) |
|---|---|---|---|
| Caribe Mágico | Cartagena + San Andrés | 5 | $2.500.000 COP |
| Ruta del Café | Eje Cafetero | 4 | $1.800.000 COP |
| San Andrés All Inclusive | San Andrés | 6 | $3.200.000 COP |

### 4.4 Actividades destacadas (en `FeaturedActivities.tsx`)

| Nombre | Ciudad | Rating | Reseñas | Precio |
|---|---|---|---|---|
| Tour Ciudad Amurallada | Cartagena | 4.8 | 124 | $120.000 COP/persona |
| Avistamiento de Ballenas | Bahía Solano | 4.9 | 87 | $250.000 COP/persona |
| Tour del Café | Eje Cafetero | 4.7 | 203 | $180.000 COP/persona |

### 4.5 Vehículos disponibles (en `AvailableVehicles.tsx`)

| Modelo | Tipo | Capacidad | Precio/día |
|---|---|---|---|
| Kia Picanto | Económico | 4 pasajeros | $120.000 COP |
| Chevrolet Onix | Sedán | 5 pasajeros | $180.000 COP |
| Hyundai Tucson | SUV | 5 pasajeros | $280.000 COP |

### 4.6 Destinos populares (en `PopularDestinations.tsx`)

| Destino | Etiqueta |
|---|---|
| Cartagena | Caribe |
| Santa Marta | Playa |
| San Andrés | Isla |
| Medellín | Ciudad |
| Villa de Leyva | Colonial |
| Leticia | Amazonas |

### 4.7 Testimonios (en `Testimonials.tsx`)

**Testimonio 1 — María García (Bogotá, ⭐⭐⭐⭐⭐)**
> "Excelente experiencia con TuriTravel. El hotel en Cartagena superó nuestras expectativas y el servicio fue impecable de principio a fin."

**Testimonio 2 — Carlos Rodríguez (Medellín, ⭐⭐⭐⭐⭐)**
> "El paquete al Eje Cafetero fue increíble. Todo perfectamente organizado, los guías muy profesionales y los paisajes de ensueño."

**Testimonio 3 — Ana Martínez (Cali, ⭐⭐⭐⭐)**
> "Muy buena atención al cliente. Nos ayudaron a organizar todo el viaje a San Andrés. Los precios muy competitivos."

---

## 5. Copy textual completo (textos a adaptar)

Tono general: **profesional, cálido, español neutro de Colombia**. Mezcla tú/usted suave (más tú directo en CTAs, más impersonal en metadatos). Promesas centradas en confianza, precio y experiencias únicas.

### 5.1 Metadata / SEO

| Campo | Texto |
|---|---|
| Title (layout) | `TuriTravel — Hoteles, Actividades, Vehículos y Traslados en Colombia` |
| Description (layout) | `Reserva hoteles, actividades turísticas, alquiler de vehículos y traslados privados en Colombia.` |
| Title (home) | mismo que layout |
| Description (home) | `Reserva hoteles, actividades turísticas, alquiler de vehículos y traslados privados en Colombia. Los mejores precios garantizados.` |
| OG Title | `TuriTravel — Tu agencia de viajes en Colombia` |
| OG Description | `Hoteles, actividades, vehículos y traslados privados en Colombia.` |
| JSON-LD name | `TuriTravel` |
| JSON-LD description | `Agencia de viajes en Colombia. Hoteles, actividades turísticas, alquiler de vehículos y traslados privados.` |
| JSON-LD url | `https://turitravel.com` |
| areaServed | `Colombia` |
| `html lang` | `es` |

### 5.2 Header

- Kicker logo: `Turismo`
- Brand: `TuriTravel`
- Nav: `Inicio` · `Destinos` (#destinos) · `Actividades` (/activities) · `Contacto` (#contacto)
- CTAs no autenticado: `Iniciar Sesión` · `Registrarse`
- Dropdown usuario: `Mis Reservas` · `Mis Favoritos` · `Cerrar Sesión`
- aria-label hamburger: `Menú`

### 5.3 Hero

- **H1:** `Descubre el Mundo con` + *TuriTravel* (palabra en gold-300 italic)
- **Subtítulo:** `Tu agencia de viajes en Colombia. Encuentra experiencias únicas, los mejores hoteles y paquetes turísticos al mejor precio.`
- **CTAs:** `Buscar destinos` (→#destinos) · `Ver Paquetes` (→#paquetes)
- **Widget search título:** `¿A dónde vamos?`
- **Tabs:** `Hoteles` · `Paquetes` · `Actividades` · `Vehículos`
- **Placeholder destino:** `¿A dónde quieres ir?`
- **Placeholder huéspedes:** `Huéspedes`
- **Botón:** `Buscar`

### 5.4 WhyChooseSection

- **H2:** `¿Por qué elegir TuriTravel?`
- **Lead:** `Viajamos por ti. Los mejores destinos, los mejores precios y la mejor atención.`
- **Features:**
  1. **Reserva Segura** — `Pagos protegidos y confirmación inmediata`
  2. **Soporte 24/7** — `Atención personalizada en todo momento`
  3. **Mejores Precios** — `Garantía del mejor precio disponible`
  4. **Destinos Únicos** — `Experiencias exclusivas en toda Colombia`

### 5.5 ServicesSection

- **H2:** `Nuestros Servicios`
- **Lead:** `Todo lo que necesitas para tu viaje perfecto`
- **Servicios:**
  - `Hoteles` — `Los mejores alojamientos`
  - `Paquetes Turísticos` — `Todo incluido al mejor precio`
  - `Actividades` — `Experiencias inolvidables`
  - `Alquiler de Vehículos` — `Viaja a tu ritmo`

### 5.6 WelcomeBanner
- **H2:** `Bienvenido a` + *TuriTravel* (gold)
- **CTA:** `Comenzar Viaje`

### 5.7 FeaturedHotels
- **H2:** `Hoteles Destacados`
- **Lead:** `Los mejores alojamientos para tu viaje`
- **CTA top-right:** `Ver todos →`
- **CTA mobile:** `Ver todos los hoteles →`
- **CTA per card:** `Ver →`
- **Sufijo precio:** `/ noche`

### 5.8 SeasonalOffers
- **Kicker:** `Ofertas limitadas`
- **H2:** `Ofertas Especiales de Temporada`
- **Lead:** `Aprovecha descuentos exclusivos en los destinos más populares de Colombia`
- **CTA:** `Ver Ofertas`

### 5.9 FeaturedPackages
- **H2:** `Paquetes Destacados`
- **Lead:** `Viajes completos con todo incluido`
- **CTA top:** `Ver todos`
- **CTA per card:** `Reservar`
- **Etiqueta:** `{N} días`
- **Prefijo precio:** `Desde`

### 5.10 FeaturedActivities
- **H2:** `Actividades Destacadas`
- **Lead:** `Experiencias únicas que no te puedes perder`
- **CTA:** `Ver todas →`
- **Sufijo precio:** `/ persona`
- **Sufijo rating:** `({N} reseñas)`

### 5.11 AvailableVehicles
- **H2:** `Vehículos Disponibles`
- **Lead:** `Alquila el vehículo perfecto para tu aventura`
- **CTA top:** `Ver todos →`
- **CTA per card:** `Reservar →`
- **Badge capacidad:** `{N} pasajeros`
- **Sufijo precio:** `/ día`

### 5.12 PopularDestinations
- **H2:** `Destinos Populares`
- **Lead:** `Los destinos más buscados. Elige tu próxima aventura en Colombia.`

### 5.13 Testimonials
- **H2:** `Lo que dicen nuestros clientes`
- **Lead:** `Miles de viajeros confían en nosotros para sus aventuras`

### 5.14 Footer
- **Descripción:** `Tu agencia de viajes en Colombia. Experiencias únicas al mejor precio.`
- **Columnas:**
  - `Destinos`: Cartagena, Santa Marta, San Andrés, Medellín
  - `Servicios`: Hoteles, Actividades, Vehículos, Traslados
  - `Empresa`: Sobre nosotros, Términos y condiciones, Política de privacidad, Contacto
- **Redes:** Facebook, Instagram, Twitter, YouTube
- **Copyright:** `© 2024 TuriTravel. Todos los derechos reservados — Colombia`

---

## 6. Guía de transformación TuriTravel → TuriDove

### 6.1 Reemplazos globales de marca

| Buscar | Reemplazar por |
|---|---|
| `TuriTravel` | `TuriDove` |
| `turitravel` (slugs, emails) | `turidove` |
| `turitravel.com` | (dominio TuriDove) |
| `admin@turitravel.com` | `admin@turidove.com` |
| `turitravel_dev` (DB), `turitravel-postgres`, `turitravel-redis` (containers) | `turidove_dev`, `turidove-postgres`, `turidove-redis` |
| Tagline kicker `Turismo` | (mantener o personalizar, ej. `Viajes`, `Boutique`) |

### 6.2 Decisiones de contenido pendientes (para TuriDove)

Como el enfoque es "**otra agencia de turismo, distintos destinos, mismo modelo**", lo que cambia es:

| Bloque | Acción recomendada |
|---|---|
| **Destinos populares** (sección 4.6) | **Reemplazar los 6 destinos colombianos** por los destinos objetivo de TuriDove (ej. internacionales: París, Roma, Tokio… o regionales distintos). Mantener formato `nombre + etiqueta`. |
| **Hoteles destacados** (4.2) | Reemplazar los 6 hoteles colombianos por hoteles de los destinos de TuriDove. Mantener el formato `nombre, ciudad, estrellas, precio/noche`. |
| **Paquetes destacados** (4.3) | Reemplazar los 3 paquetes por combos relevantes a los destinos de TuriDove. Mantener formato `nombre, destino combinado, días, precio desde`. |
| **Actividades destacadas** (4.4) | Reemplazar las 3 actividades por experiencias propias de los destinos de TuriDove. Mantener `nombre, ciudad, rating, reseñas, precio/persona`. |
| **Vehículos disponibles** (4.5) | Decidir si TuriDove maneja alquiler de vehículos. Si sí, mantener; si no, **quitar la sección entera** y los respectivos servicios del ServicesSection. |
| **Traslados** | Decidir si TuriDove ofrece traslados. Si no, retirar el link "Traslados" del Footer y la opción del menú. |
| **Testimonios** (4.7) | Reemplazar los 3 con testimonios nuevos (mismo formato: texto + nombre + ciudad + rating). Mantener tono cálido. |
| **País / áreas servidas** | Cambiar `Colombia` por el país/región de TuriDove en metadata, JSON-LD, copy del WhyChoose ("Experiencias exclusivas en toda Colombia"), Hero subtítulo, Footer copyright, descripción de marca. |
| **Moneda / formato de precio** | El backend usa centavos COP. Si TuriDove opera en otra moneda, ajustar: `Booking.currency` default (`'cop'` → otra), formato de visualización de precios (separadores miles), y configuración Stripe. |
| **Categorías de actividades** | Crear las categorías acordes (ej. Aventura, Cultural, Gastronómica, Bienestar, Playa). Necesitan slug + nombre + icono. |

### 6.3 Plan de adaptación por archivo

**Archivos donde cambiar copy/datos hardcoded:**

| Archivo | Qué editar |
|---|---|
| `apps/web/src/app/layout.tsx` | metadata title/description, brand name |
| `apps/web/src/app/page.tsx` | metadata + JSON-LD (name, description, url, areaServed) |
| `apps/web/src/components/shared/Header.tsx` | logo SVG, kicker, brand, links del nav |
| `apps/web/src/components/home/HeroSection.tsx` | H1, subtítulo, tabs, placeholders, CTAs |
| `apps/web/src/components/home/WhyChooseSection.tsx` | 4 features (referencias a "Colombia") |
| `apps/web/src/components/home/ServicesSection.tsx` | 4 servicios (mantener si aplican) |
| `apps/web/src/components/home/WelcomeBanner.tsx` | brand name |
| `apps/web/src/components/home/FeaturedHotels.tsx` | **Array inline de 6 hoteles** |
| `apps/web/src/components/home/SeasonalOffers.tsx` | Copy promocional |
| `apps/web/src/components/home/FeaturedPackages.tsx` | **Array inline de 3 paquetes** |
| `apps/web/src/components/home/FeaturedActivities.tsx` | **Array inline de 3 actividades** |
| `apps/web/src/components/home/AvailableVehicles.tsx` | **Array inline de 3 vehículos** (o eliminar sección) |
| `apps/web/src/components/home/PopularDestinations.tsx` | **Array inline de 6 destinos** |
| `apps/web/src/components/home/Testimonials.tsx` | **Array inline de 3 testimonios** |
| `apps/web/src/components/home/Footer.tsx` | descripción, columna Destinos (4 ciudades), copyright |
| `packages/database/prisma/seed.ts` | admin email |
| `.env` | DATABASE_URL, REDIS_URL, dominios, admin credentials |
| `docker-compose.yml` | container names, DB name, credentials |

### 6.4 Anclas internas a respetar

Estas anclas se usan en CTAs del Hero y nav. Si las renombras, busca y reemplaza todas las referencias:

- `#destinos` — apunta a `<section id="destinos">` en PopularDestinations
- `#paquetes` — apunta a `<section id="paquetes">` en FeaturedPackages
- `#contacto` — apunta a `<footer id="contacto">`

### 6.5 Componentes no utilizados actualmente (oportunidad)

Existen y están sin usar en `page.tsx`. Si quieres ampliar TuriDove, puedes activarlos:

- `DestinationsSection.tsx`
- `RecommendationsSection.tsx`
- `RegistrationSection.tsx`
- `VideoSection.tsx`

### 6.6 Componentes legacy que NO siguen el design system

Estos componentes usan paleta genérica (`bg-blue-600`, `gray-*`, `rounded-md`) y deben repintarse con `navy/gold/cream` según [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md):

- `components/hotels/HotelCard.tsx`
- `components/hotels/HotelFilters.tsx`
- `components/activities/ActivityCard.tsx`
- `components/bookings/BookingCard.tsx`
- `components/bookings/BookingStatusBadge.tsx` (parcial — colores semánticos OK, pero radius/font)
- `components/bookings/CheckoutForm.tsx`
- `components/shared/Pagination.tsx`
- `components/shared/StarRating.tsx`

### 6.7 Imágenes que faltan en todo el home

Todos los cards (hoteles, paquetes, actividades, vehículos, destinos) usan **gradientes CSS como placeholder**, con comentarios `{/* Replace gradient with <Image> */}`. Para TuriDove:

1. Conseguir/contratar fotografía de los destinos objetivo (idealmente verticales/cuadradas, alta calidad).
2. Reemplazar los `<div className="absolute inset-0 bg-gradient-to-br ...">` por `<Image fill src="..." className="object-cover">` de Next.js.
3. El gradient overlay para legibilidad de texto (`from-navy-900/70 via-navy-900/20 to-transparent`) SÍ debe quedarse para destinos con texto encima.

### 6.8 Links rotos a completar

Estos `href="#"` quedaron pendientes y conviene definir destinos reales en TuriDove:

- Footer → columna Destinos (4 ciudades, todos `#`)
- Footer → columna Empresa: `Sobre nosotros`, `Términos y condiciones`, `Política de privacidad` (`#`)
- Footer → Redes sociales (Facebook, Instagram, Twitter, YouTube → `#`)
- `FeaturedPackages` → `Ver todos` → `#`

### 6.9 Checklist final para arrancar TuriDove

- [ ] Definir lista de destinos objetivo (6 para "PopularDestinations")
- [ ] Conseguir/curar fotografía de cada destino + de hoteles/actividades/vehículos featured
- [ ] Decidir si TuriDove ofrece Vehículos y Traslados (sí/no)
- [ ] Decidir moneda y país de operación
- [ ] Sustituir todos los arrays inline de los componentes home (sección 6.3)
- [ ] Cambiar branding global (sección 6.1)
- [ ] Cambiar credenciales admin + variables de entorno + nombres de contenedores Docker
- [ ] Reescribir testimonios con voces propias del nuevo cliente
- [ ] Repintar componentes legacy con el design system (sección 6.6)
- [ ] Implementar links de redes sociales y páginas legales reales
- [ ] Configurar dominio + Stripe keys + Resend (email) + JWT keys propios
- [ ] (Opcional) Crear seeder real con catálogo en DB en lugar de arrays inline

---

**Última actualización:** 2026-05-24
**Origen:** `c:\ServBay\www\turitravel_v2` — repo TuriTravel v2
**Documento hermano:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
