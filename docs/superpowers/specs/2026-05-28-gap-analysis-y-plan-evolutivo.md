# Análisis comparativo TuriDove vs sprints turitravel_v2 + plan evolutivo

> **Origen del análisis:** [c:/ServBay/www/turitravel_v2/agents/docs/sprints/SPRINT_*_PLANNING_COMPLETO.md](file:///c:/ServBay/www/turitravel_v2/agents/docs/sprints/) (11 sprints: 0–10).
>
> **Estado de TuriDove:** rebrand visual completo + módulos básicos (Hospedajes, Actividades, Vehículos, Transfers, Paquetes, Reservas, Pagos con Stripe Checkout) + 5 roles + admin/proveedor/agencia/operador/cliente.
>
> **Restricción del usuario:** mantener la estructura actual del proyecto (NestJS modular tradicional, Prisma 5, Next.js 15 App Router con React Query, modelos en español, 5 roles). Solo mejorarlo incorporando las funcionalidades que faltan de la planificación. **Foco especial en Actividades y Paquetes**.

---

## 1. Diferencias estructurales fundamentales

| Dimensión | TuriDove (actual) | turitravel_v2 (planificado) |
|---|---|---|
| Modelo arquitectónico | NestJS modular tradicional (`modules/<feature>/{controller,service,dto}`) | Arquitectura hexagonal por bounded context (`domain/entities`, `application/use-cases`, `infrastructure/repositories`) |
| Idioma del dominio | Español (`Hospedaje`, `Actividad`, `Reserva`) | Inglés (`Hotel`, `Activity`, `Booking`) |
| Roles | 5: ADMIN, PROVEEDOR, AGENCIA, OPERADOR, CLIENTE | 3: ADMIN, OPERATOR, CUSTOMER |
| Pago | Stripe Checkout hosted | Stripe Payment Intents + Elements (UI embebida) + idempotencia |
| Workflow de reservas | Reserva PENDIENTE → CONFIRMADA al pagar | Reserva PENDING con TTL 15min → expira por BullMQ job → expirada/cancelada |
| Refresh tokens | JWT simple (sin rotación) | JWT RS256 + RefreshToken con rotación familiar + blacklist Redis |
| Estado de email | Sin verificación | EmailVerification + token expirable + flujo doble opt-in |
| Cache | Sin Redis | Redis para disponibilidad, cotizaciones, ratings, banners |
| Jobs en background | No | BullMQ (expiración de reservas, envíos masivos, notificaciones diferidas) |
| Tests | Casi nulos | TDD obligatorio (unitarios + integración + E2E) |
| Documentación SEO | Solo metadata base de TuriDove | `generateMetadata()` dinámica + JSON-LD Schema.org + sitemap.ts + robots.ts |
| Observabilidad | Logs básicos NestJS | Health checks + métricas + alertas + runbook |
| Pasarela de email | Sin email transaccional | Resend/Nodemailer con plantillas |

**Decisión de alcance:** el plan **NO** propone migrar a arquitectura hexagonal ni cambiar el idioma del dominio. Mantenemos la estructura actual y agregamos features encima. Cuando un módulo nuevo (ej. Reviews, Notifications) no existe en TuriDove, lo creamos siguiendo el patrón modular tradicional ya establecido.

---

## 2. Inventario de funcionalidades

### 2.1 Lo que TuriDove YA tiene

- ✅ **Auth** básico (JWT, login/registro/cambio de password, 5 roles, RBAC con `@Roles()`).
- ✅ **Hospedajes** (CRUD + habitaciones + tarifas por temporada + disponibilidad básica + `isFeatured`).
- ✅ **Actividades** (CRUD + tarifas + paquetes-actividad anidados + calendario, todos en español).
- ✅ **Vehículos** (CRUD + tarifas + disponibilidad).
- ✅ **Transfers** (CRUD + tarifas + vehículos asignados).
- ✅ **Paquetes** (Hotel + Habitación + Actividad? + Vehículo? con descuento %).
- ✅ **Reservas** (estados PENDIENTE/CONFIRMADA/CANCELADA/COMPLETADA + 4 subtablas: ReservaHospedaje/Actividad/Transfer/Vehiculo + ReservaPaquete).
- ✅ **Pagos** (Stripe Checkout + Webhook + reembolsos via Stripe API + tabla StripeEvent para idempotencia).
- ✅ **Comisiones** (cálculo de margen comercial configurable).
- ✅ **Auditoría** (AuditLog con interceptor que captura POST/PATCH/DELETE).
- ✅ **Uploads** (multipart de imágenes, servido vía `/uploads`).
- ✅ **5 paneles** (admin/proveedor/agencia/operador/cliente) repintados con design system TuriDove.
- ✅ **Home pública** con 10 secciones + chrome (Header/Footer) + auth pages.
- ✅ **i18n** ES/EN.
- ✅ **Expiración de sesión por inactividad** (Zustand `lastActivity`).

### 2.2 Lo que turitravel_v2 planifica que TuriDove NO tiene

Agrupado por dominio funcional. Cada item está mapeado al sprint/US de origen entre paréntesis.

#### Auth y seguridad

- ❌ **Verificación de email** con token y flujo de activación (S1 / US-011).
- ❌ **Refresh token con rotación y blacklist Redis** (S1 / US-013, US-014).
- ❌ **JWT con claves asimétricas RS256** (actualmente HS256 con secret simétrico) (S1 / US-012).
- ❌ **Recuperación de contraseña** vía email con token expirable (S1 / US-016).
- ❌ **Rate limiting** declarado por endpoint sensible (auth: 5 req/min, búsqueda: 120 req/min, admin: 20 req/min) (S1, S2, S3).
- ❌ **Helmet + CSP estricta** (S0 / US-006).

#### Reservas y pagos avanzados

- ❌ **TTL automático de reservas PENDIENTE** (BullMQ job de 15 min que las cancela si no se paga) (S4 / US-043).
- ❌ **Stripe Elements embebido** (UI de tarjeta dentro del sitio sin redirect) en vez de Checkout hosted (S4 / US-041).
- ❌ **Idempotency key en `Booking`** (S0, S4 / US-040, US-042).
- ❌ **Email de confirmación de reserva** (Resend/Nodemailer) (S4 / US-046).
- ❌ **Cancelación con reembolso** desde panel cliente (no solo admin) (S4 / US-045).
- ❌ **Quote/Cotización de transfers con Redis TTL 15 min** y precio calculado server-side (S7 / US-070).

#### Disponibilidad y cache

- ❌ **Motor de disponibilidad real con cache Redis** (TTL configurable, invalidación por evento) (S2 / US-022, US-023).
- ❌ **Búsqueda con filtros y paginación robusta** (sort, rangos de precio, dispo por fechas) — el actual filtra por substring (S2 / US-024).

#### Reviews (módulo nuevo)

- ❌ **Review entity** con `serviceType` polimórfico (HOTEL/ACTIVITY/VEHICLE/TRANSFER) (S7 / US-077).
- ❌ **Submit review** con verificación de booking comprado (S7 / US-078).
- ❌ **Moderate review** por admin con eventos `review.approved/rejected` (S7 / US-079).
- ❌ **Rating promedio + cache Redis** y SSR de reviews por entidad (S8 / US-080, US-081).
- ❌ **Respuesta del operador** a reseñas (S8 / US-082).

#### Notificaciones (módulo nuevo)

- ❌ **Notification entity** con tipos (booking_confirmed, payment_failed, review_approved, etc.) (S8 / US-083).
- ❌ **CRUD de notificaciones del usuario** con guardia IDOR (S8 / US-084).
- ❌ **Event listeners** que generan notificaciones automáticas (S8 / US-085).
- ❌ **NotificationBell** en header con badge + dropdown (S8 / US-086).

#### Vouchers de viaje (PDF)

- ❌ **PDFKit infrastructure** para generación de comprobantes (S8 / US-087).
- ❌ **Endpoint voucher PDF** por booking con QR + IDOR check (S8 / US-088, US-089).

#### Favoritos / Wishlist

- ❌ **Favorite entity** con relación polimórfica al servicio (S8 / US-090).
- ❌ **Toggle + Get + Check** favorito con guardia IDOR (S8 / US-091).
- ❌ **Página `/wishlist`** del cliente (S8 / US-092).

#### Banners promocionales (CMS)

- ❌ **Banner entity** con ubicaciones (HOME_HERO, HOTELS_TOP, etc.) (S8 / US-093).
- ❌ **Admin CRUD + reorder + cache Redis** (S8 / US-093, US-094).
- ❌ **BannerSection SSR** que renderiza banners por zona de página (S8 / US-095).

#### SEO y discoverabilidad

- ❌ **`generateMetadata()` dinámica** por entidad (hotel/actividad/etc.) con OG tags (S7 / US-074).
- ❌ **JSON-LD Schema.org** (`LodgingBusiness`, `TouristAttraction`, `TouristTrip`) (S7 / US-074).
- ❌ **`sitemap.ts` + `robots.ts`** en App Router (S7 / US-075).
- ❌ **SeoConfig admin** (overrides por página + cache Redis) (S7 / US-076).

#### Destinations (módulo nuevo)

- ❌ **Destination entity** (curated cities/countries con contadores de hotel/activity/package) (S9 / US-096).
- ❌ **Admin CRUD destinations** (S9 / US-096).
- ❌ **Página `/destinations` + `/destinations/[slug]`** SSR + JSON-LD (S9 / US-097, US-098).

#### Rental Locations (sucursales de vehículos)

- ❌ **RentalLocation entity** con coordenadas (S9 / US-099).
- ❌ **API pública** para selector de pickup/dropoff (S9 / US-100).

#### Analytics

- ❌ **Dashboard de KPIs admin** (revenue, bookings, ocupación, top services) con cache Redis (S9 / US-101).
- ❌ **Revenue por período** con segmentación por servicio (S9 / US-102).
- ❌ **Frontend Server Component** del dashboard con charts (S9 / US-103).

#### Newsletter (campañas)

- ❌ **NewsletterSubscriber con doble opt-in** real (S5 / US-056).
- ❌ **NewsletterCampaign + envío masivo BullMQ** (S10 / US-104, US-105).
- ❌ **Modo test + scheduling** delayed jobs (S10 / US-106, US-107).

#### Vouchers de descuento (cupones)

- ❌ **Voucher entity** (código + tipo PERCENTAGE/FIXED + maxUses + currentUses + vigencia) (S10 / US-108).
- ❌ **Admin CRUD vouchers** (S10 / US-109).
- ❌ **Validate atómico** (race condition safe via DB transaction) (S10 / US-110).
- ❌ **Apply al checkout** con UI (S10 / US-111).

#### Infra y operación

- ❌ **Redis** integrado al stack (S0 / US-002b).
- ❌ **BullMQ** para jobs (S4 / US-043, S10 / US-105).
- ❌ **Resend/Nodemailer** para emails transaccionales (S4 / US-046).
- ❌ **Health checks `/health` con dependencias** (DB, Redis, queue) (S6 / US-063).
- ❌ **Monitoreo activo** (logs estructurados + alertas) (S6 / US-063).
- ❌ **Runbook de incidentes** documentado (S6 / US-062).
- ❌ **k6 load tests + optimizaciones** (S6 / US-061).
- ❌ **OWASP ZAP audit + remediaciones** (S6 / US-060).
- ❌ **Tests automatizados** (Jest unit + Playwright E2E) (transversal).

---

## 3. Foco especial: Actividades y Paquetes

### 3.1 Comparación profunda — Actividades

**Modelo turitravel_v2 (Sprint 3 / US-033, US-034):**

```prisma
model Activity {
  id              String           @id @default(uuid())
  name            String
  slug            String           @unique     // ← TuriDove NO tiene slug
  description     String
  categoryId      String                       // ← TuriDove tiene enum TipoActividad fijo
  city            String
  duration        Float                        // horas 0.5–168 (hasta 7 días!)
  capacity        Int                          // 1–1000
  price           Decimal          @db.Decimal(10, 2)  // ← TuriDove usa tabla TarifaActividad separada
  included        String[]
  notIncluded     String[]
  mainImage       String?
  status          ActivityStatus               // DRAFT | ACTIVE | INACTIVE  ← TuriDove solo tiene boolean activo
  creatorId       String                       // adminId del JWT, no del body
  itinerary       ItineraryItem[]              // ← TuriDove NO tiene itinerario multi-día
}

model ItineraryItem {
  id            String   @id @default(uuid())
  activityId    String
  day           Int                             // ordinal 1, 2, 3...
  title         String
  description   String
  lat           Float?                          // validados ∈ [-90, 90]
  lng           Float?                          // validados ∈ [-180, 180]
  locationName  String?
  @@unique([activityId, day])
}

model ActivityCategory {                        // ← TuriDove NO tiene tabla, solo enum
  id      String     @id @default(uuid())
  name    String     @unique
  slug    String     @unique
  icon    String?
  isActive Boolean   @default(true)
  activities Activity[]
}
```

**Modelo TuriDove (actual):**

```prisma
model Actividad {
  id              String        @id @default(uuid())
  nombre          String                       // sin slug
  descripcion     String
  tipo            TipoActividad                // enum estático AVENTURA/CULTURAL/...
  duracionHoras   Float                        // sin rango declarado
  ubicacion       String                       // string libre
  provincia       String
  distrito        String
  imagenes        String[]                     // array sin imagen principal designada
  incluye         String[]
  noIncluye       String[]
  requisitos      String[]                     // ← TuriDove SÍ tiene esto, turitravel no
  edadMinima      Int
  capacidadMaxima Int
  activo          Boolean                      // sin estado DRAFT
  proveedorId     String                       // similar a creatorId
  isFeatured      Boolean
}

model TarifaActividad {                        // ← TuriDove SÍ tiene tarifas separadas
  id            String   @id
  actividadId   String
  temporada     Temporada  // ALTA/MEDIA/BAJA
  precioAdulto  Decimal                        // precio diferenciado
  precioNino    Decimal                        //   por tipo de visitante
  precioGrupo   Decimal?                       //   y por grupo
  minimoPersonas Int
  fechaInicio   DateTime
  fechaFin      DateTime
}

model PaqueteActividad {                       // ← TuriDove tiene "sub-paquetes" dentro de la actividad
  id                String
  actividadId       String
  nombre            String
  descripcion       String
  duracionDias      Int
  precioPorPersona  Decimal
  minimoParticipantes Int
}

model CalendarioActividad {                    // ← TuriDove tiene disponibilidad por fecha+horario
  id          String
  actividadId String
  fecha       DateTime
  horaInicio  String
  cuposDisponibles Int
}
```

**Gaps en Actividades:**

1. **Falta `slug`** único para URLs SEO-friendly.
2. **Falta `status` (DRAFT/ACTIVE/INACTIVE)** — actualmente solo boolean. Esto impide tener actividades en preparación visibles solo a admin.
3. **Falta `ItineraryItem`** (descripción día a día con coordenadas geo). turitravel concibe actividades multi-día con etapas; TuriDove las trata como evento puntual + `PaqueteActividad` (que es distinto, son combos).
4. **Categorías deberían ser tabla**, no enum fijo. Permite que admin agregue/edite categorías sin migración.
5. **`mainImage` designada** vs `imagenes[]` sin orden — para portadas en cards.
6. **`creatorId`/auditoría de creación** explícita.

**Ventajas que TuriDove TIENE sobre el plan:**

1. ✅ Tarifas separadas por temporada (ALTA/MEDIA/BAJA) + por tipo de visitante (adulto/niño/grupo). turitravel solo tiene `price` único.
2. ✅ Calendario de disponibilidad con horarios y cupos diferenciados.
3. ✅ `requisitos[]`, `edadMinima`.
4. ✅ `PaqueteActividad` interno (sub-combos de la misma actividad — feature distintiva).

### 3.2 Comparación profunda — Paquetes

**Modelo turitravel_v2 (Sprint 5 / US-052):**

```prisma
model Package {
  id                 String   @id
  name               String
  description        String
  hotelId            String                  // siempre tiene hotel
  roomTypeId         String                  // y room type específico
  activityId         String?                 // actividad opcional
  vehicleId          String?                 // vehículo opcional
  discountPercentage Decimal  @db.Decimal(5, 2)  // 0–80
  validFrom          DateTime
  validTo            DateTime
  isActive           Boolean
}
```

Reglas (US-053):
- Precio = suma de componentes × (1 - discount/100), calculado **siempre en servidor**.
- Reserva en transacción atómica (rollback si falla cualquier disponibilidad).
- Un solo PaymentIntent para todo el paquete.
- 1 booking + N booking items (uno por componente).

**Modelo TuriDove (actual):**

```prisma
model Paquete {
  id                  String   @id
  nombre              String
  slug                String   @unique         // ← TuriDove SÍ tiene slug (mejor)
  descripcion         String
  hospedajeId         String
  habitacionId        String
  actividadId         String?
  vehiculoId          String?
  diasDuracion        Int                      // ← TuriDove duración explícita
  noches              Int                      // ← TuriDove cuenta noches
  descuentoPorcentaje Decimal  @db.Decimal(5, 2)
  imagenPrincipal     String?                  // ← TuriDove tiene imagen
  isFeatured          Boolean
  isActive            Boolean
  validoDesde         DateTime
  validoHasta         DateTime
  proveedorId         String?                  // ← TuriDove tiene dueño
}

model ReservaPaquete {                         // ← TuriDove tiene sub-tabla de reserva
  id          String
  reservaId   String
  paqueteId   String
  fechaInicio DateTime
  huespedes   Int
  precioFinal Decimal
}
```

**Gaps en Paquetes:**

1. **Validación del descuento** — turitravel limita a 80% por seguridad. TuriDove acepta 0–50.
2. **Cálculo del precio:** TuriDove ya lo hace bien (en `paquetes.service.ts#calcularPrecio`). turitravel agrega validaciones específicas (precio nunca del cliente, cálculo desde DB).
3. **Disponibilidad atómica de componentes:** turitravel verifica que TODOS los componentes (hotel + actividad + vehículo) tengan disponibilidad para las fechas antes de crear la reserva. Si falla uno → rollback. **TuriDove actualmente no lo hace** — crea la reserva sin chequear disponibilidad cruzada.
4. **Categorización / curaduría:** turitravel no tiene categorías de paquetes; TuriDove tampoco. Es coherente.

**Ventajas que TuriDove TIENE sobre el plan:**

1. ✅ `slug` para URLs SEO-friendly.
2. ✅ `imagenPrincipal` explícita.
3. ✅ `diasDuracion` + `noches` (cálculo del precio del hospedaje × noches).
4. ✅ `proveedorId` (ownership para que un proveedor solo combine sus propios recursos).
5. ✅ `ReservaPaquete` subtabla (separación clara de la reserva polimórfica).

### 3.3 Conclusión sobre Actividades y Paquetes

**Paquetes:** TuriDove está mejor estructurado que el plan turitravel. Solo necesita reforzar la validación de disponibilidad cruzada al reservar.

**Actividades:** TuriDove está más completo en algunas dimensiones (tarifas multidimensionales, calendario, requisitos) pero falta lo esencial para SEO/operación: **slug**, **status DRAFT**, **categorías como tabla**, **itinerario multi-día** e **imagen principal designada**.

---

## 4. Plan evolutivo

Fases ordenadas por valor de negocio, riesgo técnico y dependencias. Cada fase es ejecutable de forma independiente y deja el sistema en estado funcional.

**Principio rector:** mantener la estructura modular tradicional actual. NO migrar a arquitectura hexagonal. NO renombrar al inglés. NO romper las 5 roles ni las rutas REST existentes.

### Fase A — Endurecimiento de Actividades (foco del usuario)

**Objetivo:** Llevar el módulo de Actividades al nivel funcional del plan, **preservando** las tarifas multidimensionales y el `PaqueteActividad` que TuriDove ya tiene.

**Cambios:**
1. Agregar `slug` único + autogeneración server-side desde `nombre + provincia`.
2. Agregar enum `EstadoActividad { DRAFT | ACTIVE | INACTIVE }` (reemplaza el booleano `activo`, manteniendo retrocompat).
3. Agregar `imagenPrincipal String?` (campo dedicado para la portada). Lógica: si nulo, usar `imagenes[0]`.
4. Migrar enum `TipoActividad` → tabla `CategoriaActividad { id, nombre, slug, icono, activo, descripcion? }`. Mantener relación FK desde `Actividad.categoriaId`. Seed con las 6 categorías actuales (AVENTURA, CULTURAL, GASTRONOMICA, NATURALEZA, EDUCATIVA, DEPORTIVA).
5. Crear `ItinerarioActividad { id, actividadId, dia, titulo, descripcion, lat?, lng?, nombreUbicacion?, @@unique([actividadId, dia]) }`.
6. Admin CRUD de categorías (`/admin/actividades/categorias`).
7. Admin CRUD de itinerario en la página de edición de actividad.
8. Frontend público: mostrar itinerario en `/actividades/[slug]` con timeline visual.
9. SSR: cambiar todas las rutas de `/actividades/[id]` a `/actividades/[slug]` (con redirect 301 desde id legacy).
10. Validaciones server-side: `duracionHoras` ∈ [0.5, 168]; itinerario sin días duplicados; coordenadas ∈ rangos válidos.

**Migración:**
- `prisma migrate dev --name actividad_v2`.
- Script de data migration: poblar `slug` desde nombres existentes; copiar `tipo` enum → FK a `CategoriaActividad`; mapear `activo: true` → `estado: ACTIVE`.

**Out of scope de esta fase:** ratings, reviews, calendario de fechas específicas (ya existe).

### Fase B — Reviews y reputación

**Objetivo:** Sistema de reseñas verificadas (solo quien reservó puede reseñar) que aplica a Hospedajes, Actividades, Vehículos y Transfers.

**Modelos nuevos:**
```prisma
enum TipoServicio { HOSPEDAJE  ACTIVIDAD  VEHICULO  TRANSFER }
enum EstadoResena { PENDIENTE  APROBADA  RECHAZADA }

model Resena {
  id             String        @id @default(uuid())
  usuarioId      String
  reservaId      String                       // proof of purchase
  tipoServicio   TipoServicio
  servicioId     String                       // FK polimórfica
  rating         Int                          // 1..5
  titulo         String?
  comentario     String
  estado         EstadoResena  @default(PENDIENTE)
  destacada      Boolean       @default(false)
  respuestaOperador String?                   // operador responde
  respondidaEn   DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  usuario        User          @relation(fields: [usuarioId], references: [id])
  reserva        Reserva       @relation(fields: [reservaId], references: [id])
  @@unique([usuarioId, tipoServicio, servicioId])  // 1 reseña por usuario por servicio
  @@index([tipoServicio, servicioId, estado])
}
```

**Funcionalidad:**
- `POST /resenas` (CLIENTE autenticado): verifica que `reservaId` pertenezca al usuario y sea CONFIRMADA/COMPLETADA, y que el `servicioId` esté efectivamente reservado en esa reserva.
- `PATCH /resenas/:id/moderar` (ADMIN/OPERADOR): aprobar o rechazar; setear `destacada`.
- `POST /resenas/:id/responder` (PROVEEDOR/AGENCIA propietario del servicio): añadir respuesta.
- `GET /resenas?tipoServicio=&servicioId=` público: solo APROBADA. Trae usuario sanitizado (firstName + initial del apellido).
- `GET /resenas/agregado?tipoServicio=&servicioId=` público: `{ promedio, total, distribucion: {5: N, 4: N, ...} }`.
- Frontend público: `<ReviewsSection>` en cada detalle (hospedaje/actividad/vehículo/transfer).
- Admin: lista de reseñas con filtros + acciones moderar/destacar.

**Eventos emitidos** (para Fase C de notificaciones):
- `resena.creada` → admin/moderador.
- `resena.aprobada` → autor.
- `resena.rechazada` → autor con razón.
- `resena.respondida` → autor.

### Fase C — Notificaciones in-app

**Objetivo:** Notification center con badge en header. Eventos automáticos del backend disparan notificaciones al usuario correspondiente.

**Modelo nuevo:**
```prisma
enum TipoNotificacion {
  RESERVA_CONFIRMADA
  RESERVA_CANCELADA
  PAGO_FALLIDO
  REEMBOLSO_PROCESADO
  RESENA_APROBADA
  RESENA_RECHAZADA
  RESENA_RESPONDIDA
  TRANSFER_CONFIRMADO
  PASSWORD_CAMBIADA
}

model Notificacion {
  id           String           @id @default(uuid())
  usuarioId    String
  tipo         TipoNotificacion
  titulo       String
  mensaje      String
  link         String?                          // ruta interna para click
  leida        Boolean          @default(false)
  leidaEn      DateTime?
  payload      Json?                            // datos extra
  createdAt    DateTime         @default(now())
  usuario      User             @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  @@index([usuarioId, leida, createdAt])
}
```

**Funcionalidad:**
- Service `NotificacionesService` con método `crearParaUsuario(usuarioId, tipo, datos)`.
- Listeners (`@OnEvent` de Nest EventEmitter) que reaccionan a:
  - Pago COMPLETADO → `RESERVA_CONFIRMADA`.
  - Reserva CANCELADA → notif al cliente.
  - Reembolso procesado → notif.
  - Reseña aprobada/rechazada/respondida (Fase B).
- Endpoints:
  - `GET /notificaciones` — lista del usuario autenticado, ordenada DESC, paginada.
  - `PATCH /notificaciones/:id/leer` — marcar leída.
  - `POST /notificaciones/marcar-todas-leidas`.
  - `GET /notificaciones/contador-no-leidas` — para el badge.
- Frontend: `<NotificationBell>` en el header (Header.tsx) que usa React Query con `refetchInterval: 30s`. Dropdown con últimas 10.
- Sin push web real (out of scope). Solo in-app.

### Fase D — Endurecimiento Auth

**Objetivo:** Llevar Auth al estándar del plan sin romper sesiones existentes.

**Cambios:**
1. **Refresh token con rotación:**
   - Modelo `RefreshToken { id, tokenHash, family, userId, expiresAt, revokedAt? }`.
   - Login devuelve `accessToken` (15 min) + `refreshToken` (7 días).
   - `POST /auth/refresh` rota: invalida el viejo, genera uno nuevo con misma `family`.
   - Si se usa un refresh token revocado → invalida toda la familia (detección de robo).
2. **Verificación de email:**
   - Campo `User.emailVerifiedAt DateTime?`.
   - Tras registro: enviar email con token (almacenado hasheado en tabla `EmailVerification { token, userId, expiresAt }`).
   - Endpoint `POST /auth/verify-email` consume token.
   - Login bloqueado si `!emailVerifiedAt` (configurable; opcional permitir login sin verificar pero con badge).
3. **Recuperación de contraseña:**
   - Modelo `PasswordReset { id, token (UUID), userId, expiresAt (1h), usedAt? }`.
   - `POST /auth/password-reset/request` con email → envía email con link.
   - `POST /auth/password-reset/confirm` con token + nueva password.
4. **Rate limiting** (instalar `@nestjs/throttler`):
   - Login/registro: 5 req/min por IP.
   - Recuperación: 3 req/15min por email.
   - Búsqueda pública: 120 req/min.
5. **Helmet + CSP** en `main.ts`.

**Dependencia:** Resend (o Nodemailer + SMTP) para envío de emails. Configurar en `.env.docker`:
```
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
EMAIL_FROM=noreply@turidove.com
```

### Fase E — Operación de reservas (TTL + emails)

**Objetivo:** Las reservas PENDIENTE caducan automáticamente; cada confirmación envía email.

**Cambios:**
1. Agregar `Reserva.idempotencyKey String? @unique` y `expiresAt DateTime?`.
2. Instalar BullMQ + Redis:
   - `BookingExpirationProcessor`: cola `bookings-expire` con delay 15 min.
   - Cuando crea reserva PENDIENTE → encola job. Si al ejecutar la reserva sigue PENDIENTE → marca CANCELADA y libera disponibilidad.
3. Cliente puede **reintentar el pago** de una reserva PENDIENTE no expirada — endpoint `POST /pagos/checkout/:reservaId` ya existe.
4. **Email de confirmación** tras webhook `checkout.session.completed`:
   - Listener escucha el evento en `PagosService.handleWebhook`.
   - Renderiza plantilla con datos de la reserva.
   - Envía vía proveedor configurado.
5. **Email de fallo de pago** tras `payment_intent.payment_failed`.
6. **Email de reembolso** tras `charge.refunded`.

### Fase F — Vouchers de descuento (cupones)

**Objetivo:** Códigos de descuento que se aplican al checkout.

**Modelos nuevos:**
```prisma
enum TipoDescuento { PORCENTAJE  MONTO_FIJO }

model Voucher {
  id            String        @id @default(uuid())
  codigo        String        @unique        // case-insensitive en validación
  tipo          TipoDescuento
  valor         Int                          // porcentaje 1–100 o centavos USD
  maxUsos       Int
  usosActuales  Int           @default(0)
  validoDesde   DateTime
  validoHasta   DateTime
  activo        Boolean       @default(true)
  createdAt     DateTime      @default(now())
  usos          VoucherUso[]
  @@index([codigo, activo])
}

model VoucherUso {
  id        String   @id @default(uuid())
  voucherId String
  usuarioId String
  reservaId String?
  usadoEn   DateTime @default(now())
  voucher   Voucher  @relation(fields: [voucherId], references: [id])
  @@unique([voucherId, usuarioId])           // un usuario, un uso por voucher
}
```

**Funcionalidad:**
- Admin CRUD vouchers (`/admin/vouchers`).
- `POST /vouchers/validar` público (cliente autenticado): recibe `{ codigo, montoTotal }`, retorna `{ valido, montoDescuento, montoFinal, razon? }`. Solo valida, NO aplica.
- `POST /vouchers/aplicar` (cliente autenticado): transacción atómica — incrementa `usosActuales` con `Prisma.transaction()` chequeando `currentUses < maxUsos` y crea `VoucherUso`. Si falla por race condition (P2002) → retorna 409.
- Frontend: input de cupón en el `CheckoutSummary` (Stripe Checkout no soporta cupones nativos, así que el descuento se aplica al monto **antes** de crear la session).

### Fase G — Favoritos / Wishlist

**Objetivo:** Cliente marca servicios favoritos.

**Modelo nuevo:**
```prisma
model Favorito {
  id           String        @id @default(uuid())
  usuarioId    String
  tipoServicio TipoServicio  // mismo enum de Fase B
  servicioId   String
  createdAt    DateTime      @default(now())
  usuario      User          @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  @@unique([usuarioId, tipoServicio, servicioId])
  @@index([usuarioId])
}
```

**Funcionalidad:**
- `POST /favoritos/toggle` (CLIENTE): `{ tipoServicio, servicioId }`. Si existe → elimina; si no → crea.
- `GET /favoritos` (CLIENTE): lista del usuario autenticado con join al servicio para mostrar info en wishlist.
- `GET /favoritos/check?tipoServicio=&servicioId=` (CLIENTE): booleano.
- Frontend: icono de corazón en cards (`HospedajeCard`, `ActividadCard`, etc.). Toggle optimista con React Query.
- Página `/cliente/favoritos` (lista del cliente).

### Fase H — Banners CMS

**Objetivo:** Admin sube banners promocionales para zonas específicas del home y de páginas listado.

**Modelo nuevo:**
```prisma
enum UbicacionBanner {
  HOME_HERO
  HOME_SECUNDARIO
  HOSPEDAJES_TOP
  ACTIVIDADES_TOP
  VEHICULOS_TOP
  TRANSFERS_TOP
  PAQUETES_TOP
}

model Banner {
  id              String          @id @default(uuid())
  ubicacion       UbicacionBanner
  titulo          String?
  subtitulo       String?
  imagenUrl       String
  textoBoton      String?
  urlBoton        String?
  ordenSecuencia  Int             @default(0)
  validoDesde     DateTime?
  validoHasta     DateTime?
  activo          Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  @@index([ubicacion, activo, ordenSecuencia])
}
```

**Funcionalidad:**
- Admin CRUD `/admin/banners` con previsualización + reorder drag-and-drop.
- `GET /banners?ubicacion=HOME_HERO` público: lista activa y vigente, ordenada.
- Frontend: componente `<BannerSection ubicacion="HOME_HERO" />` que reemplaza un slot en home.
- Cache server-side simple (revalidate 60s) sin Redis dependency obligatoria.

### Fase I — Destinations y Analytics

**Objetivo:** Curadura de destinos (separado del seed actual hardcoded) + dashboard de KPIs.

**Modelos nuevos:**
```prisma
model Destino {
  id             String   @id @default(uuid())
  nombre         String
  slug           String   @unique
  pais           String
  descripcion    String?
  imagenUrl      String?
  hospedajesCount Int     @default(0)  // contadores denormalizados
  actividadesCount Int    @default(0)
  paquetesCount  Int      @default(0)
  destacado      Boolean  @default(false)
  activo         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Funcionalidad Destinos:**
- Admin CRUD `/admin/destinos`.
- Frontend: `/destinos` (grid) y `/destinos/[slug]` (página del destino con hoteles/actividades/paquetes filtrados por provincia o ciudad relacionada).
- Reemplazar el array hardcoded de `SITE_CONFIG.destinations` por consumo desde API.
- Sección `PopularDestinations` del home consume destinos `destacado=true` (ya consume `/hospedajes?featured=true` actualmente — migrar a `/destinos?destacado=true`).

**Funcionalidad Analytics:**
- `GET /admin/analytics/resumen` (ADMIN): ingresos del mes, bookings del mes, ocupación promedio, top 5 servicios.
- `GET /admin/analytics/ingresos?desde=&hasta=&granularidad=dia|semana|mes` (ADMIN): serie temporal.
- `GET /admin/analytics/por-servicio?tipo=` (ADMIN): bookings y revenue por servicio.
- Dashboard `/admin/analytics` con charts (Recharts o Chart.js).

### Fase J — SEO

**Objetivo:** El sitio se indexa correctamente en Google con rich snippets.

**Cambios:**
1. `generateMetadata()` dinámica en `(public)/hospedajes/[slug]/page.tsx`, `actividades/[slug]`, `paquetes/[slug]`, `vehiculos/[id]`, `transfers/[id]`, `destinos/[slug]`. Carga el recurso y construye title/description/og.
2. JSON-LD por tipo de página inyectado en `<head>`:
   - `LodgingBusiness` para hospedajes.
   - `TouristAttraction` para actividades.
   - `TouristTrip` para paquetes.
   - `Place` para destinos.
3. `app/sitemap.ts` que enumera todas las rutas activas (consume API).
4. `app/robots.ts` con disallow de paneles privados.
5. Canonical URLs.

### Fase K — Producción y observabilidad

**Objetivo:** Listo para tráfico real.

**Cambios:**
1. Health check `/health` enriquecido (DB ping + Redis ping + queue depth).
2. Logs estructurados (Pino o similar) con request-id correlacionado.
3. Tests:
   - Jest unit para servicios críticos (cálculo de precio Paquete, validate voucher, refresh token rotation).
   - Playwright E2E del flujo crítico: registro → reserva → pago test → confirmación.
4. Documentar runbook básico (cómo restaurar BD desde dump, cómo reprocesar webhook, cómo invalidar cache).
5. Configurar `helmet` con CSP estricta.

---

## 5. Orden de ejecución recomendado

Por dependencias técnicas y valor de negocio:

| Fase | Nombre | Esfuerzo (días-dev) | Bloquea a | Valor |
|---|---|---|---|---|
| A | Endurecimiento Actividades | 4-5 | I (Destinos) | Alto — foco del usuario |
| D | Endurecimiento Auth | 4-5 | E, B (verify email para reseñar) | Alto — seguridad |
| E | Operación reservas (TTL + emails) | 3-4 | F | Alto — confiabilidad |
| B | Reviews | 4-5 | C | Alto — confianza |
| C | Notificaciones | 2-3 | — | Medio — UX |
| F | Vouchers descuento | 3-4 | — | Medio — marketing |
| G | Favoritos | 2-3 | — | Medio |
| H | Banners CMS | 2-3 | — | Medio |
| I | Destinos + Analytics | 4-5 | — | Medio-alto |
| J | SEO | 3-4 | — | Alto (long-tail) |
| K | Producción/observabilidad | 3-5 | — | Alto |

Total estimado: **34-46 días-dev**.

**Camino crítico recomendado para liberar valor temprano:**
**A → D → E → B → J** (Actividades robustas + auth real + reservas confiables + reseñas + SEO).

Las fases C, F, G, H, I, K pueden ejecutarse en paralelo o post-MVP de las primeras 5.

---

## 6. Lo que NO se hará (alcance excluido)

- ❌ Migración a arquitectura hexagonal.
- ❌ Renombrado del dominio al inglés.
- ❌ Reducir los 5 roles a 3.
- ❌ Migrar de NestJS modules a microservicios.
- ❌ Cambiar el ORM (Prisma se queda).
- ❌ Cambiar Stripe Checkout hosted a Elements embebido (excepto si la Fase E lo requiere para reintentos; se reevalúa entonces).
- ❌ ETL desde un sistema legado (no aplica — TuriDove nace limpio).
- ❌ Newsletter de campañas masivas (S10 / US-104..107). El newsletter actual con doble opt-in (Fase D) cubre el caso esencial; campañas se hace en una fase ulterior si hay necesidad real.
- ❌ Voucher PDF de booking (S8 / US-087..089). Tabla diferida — el email de confirmación cumple el rol esencial.
- ❌ Sucursales de vehículos (S9 / US-099, US-100). Diferido a cuando haya flota multi-ubicación.

Estas exclusiones pueden revisarse después de las primeras 5 fases si surge la necesidad.

---

## 7. Próximos pasos sugeridos

1. **Revisar este documento** y validar el alcance de cada fase. Marcar las que NO interesan.
2. Para la **Fase A (Actividades)** que es la prioridad declarada del usuario, crear un spec detallado y plan de implementación con migración Prisma incluida.
3. Decidir el **provider de email** (Resend recomendado por simplicidad de DX) antes de la Fase D/E.
4. Decidir si **Redis** se introduce ya en la Fase E (requerido para BullMQ) o se posterga (BullMQ + Redis es de las dependencias más pesadas — alternativa: `node-cron` simple para TTL si solo es esa feature).

**Última actualización:** 2026-05-28
**Documentos de referencia:**
- Sprints turitravel_v2: `c:/ServBay/www/turitravel_v2/agents/docs/sprints/SPRINT_*_PLANNING_COMPLETO.md`
- Spec rebranding TuriDove: `docs/superpowers/specs/2026-05-24-turidove-rebranding-design.md`
