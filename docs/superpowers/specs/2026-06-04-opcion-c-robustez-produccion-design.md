# TuriDove — Robustez para producción (Opción C)

> **Contexto:** la pasarela Stripe está funcionando end-to-end en modo test (Fase 7 + editor de claves admin + reembolsos). Ahora vamos a llevar TuriDove de "MVP funcional" a "plataforma robusta para producción" antes de hacer el deployment real.
>
> **Origen:** [docs/superpowers/specs/2026-05-28-gap-analysis-y-plan-evolutivo.md](2026-05-28-gap-analysis-y-plan-evolutivo.md) Fases D + E + parte de K (observabilidad).
>
> **Decisiones tomadas:**
> - **BullMQ + Redis** para jobs asíncronos.
> - **Resend** como proveedor de email transaccional.
> - **Verify email obligatorio** para login (sin verificar no puede usar la cuenta).

---

## 1. Alcance

### 1.1 Lo que se hace

**Infraestructura nueva:**
- Contenedor `redis` en docker-compose (Redis 7-alpine).
- Cliente Resend integrado.
- BullMQ con un worker en proceso (`@nestjs/bullmq`).

**Operación de reservas (de la Fase E):**
- TTL automático de reservas PENDIENTE: cancelación + liberación de disponibilidad a los 15 min sin pago.
- Idempotency-key en `stripe.checkout.sessions.create()` para evitar sessions duplicadas por doble-click.
- Tracking de webhooks fallidos en `StripeEvent` (nueva columna `processedSuccessfully` + `error?`).
- Dashboard admin de eventos Stripe con filtros (todos / fallidos / por tipo).
- Endpoint admin para reintentar webhook fallido manualmente.

**Emails transaccionales:**
- Servicio `MailService` con plantillas tipadas.
- Plantillas: verify-email, password-reset, password-changed, reserva-confirmada, reserva-cancelada, pago-fallido, reembolso-procesado.
- Plantillas en formato HTML responsive + texto plano.
- Configuración del provider (Resend) en `.env.docker` y editable desde admin (cifrado AES-256 igual que Stripe).

**Auth endurecido (de la Fase D):**
- Verificación de email obligatoria con token expirable.
- Login bloqueado para usuarios sin `emailVerifiedAt`.
- Recuperación de contraseña con email + token expirable (1h).
- Refresh token con rotación familiar + blacklist Redis para revocación.
- Rate limiting (`@nestjs/throttler`):
  - `/auth/login`, `/auth/register`: 5 req/min/IP.
  - `/auth/password-reset/request`: 3 req/15min/email.
  - `/auth/verify-email`: 10 req/min/IP.
  - Búsquedas públicas: 120 req/min/IP.
- Helmet + Content Security Policy estricta.

**Observabilidad:**
- Logger estructurado JSON (Pino) con `request-id` correlacionado.
- Health check `/health` enriquecido: DB ping + Redis ping + Resend ping + estado de Stripe.
- Dashboard admin de sistema: estado de servicios + cola BullMQ + métricas básicas (reservas pendientes/min, webhooks/hora).

**Stripe extras (refinamiento):**
- `statement_descriptor` de "TURIDOVE" en cargos.
- Branding del Checkout (logo + color) — esto se hace desde el Stripe Dashboard, solo documentar.
- Recibos automáticos por email — activación documentada en Stripe Dashboard.

### 1.2 Lo que NO se hace en esta etapa

- ❌ Stripe Tax (cálculo de impuestos): se deja para cuando el negocio esté operando y sepamos el régimen fiscal.
- ❌ Stripe Connect (multi-vendor): los pagos siguen yendo a la cuenta principal; el reparto a proveedores sigue manual vía módulo Financiero.
- ❌ Stripe Radar custom rules: la configuración por defecto de Radar viene activa y es suficiente para empezar.
- ❌ Migración a arquitectura hexagonal — sigue siendo modular tradicional NestJS.
- ❌ Migración del dominio a inglés — todo en español.
- ❌ Reducir roles — siguen siendo 5.
- ❌ Reviews, Notifications, Favoritos, Banners, Destinos, Analytics — son las Fases B/C/G/H/I del plan evolutivo, posteriores.

### 1.3 Lo que se conserva intacto

- Stack: Next.js 15, NestJS 10, Prisma 5, PostgreSQL 18, Docker.
- 5 roles RBAC.
- Stripe Checkout hosteado (no migramos a Elements embebido).
- Idioma del dominio en español.
- Estructura modular tradicional.

---

## 2. Modelos de datos nuevos / modificados

### 2.1 Auth

**Modificar `User`:**
```prisma
model User {
  // ... campos existentes
  emailVerifiedAt DateTime? @map("email_verified_at")
  // ... resto
}
```

**Nuevo modelo:**
```prisma
model EmailVerification {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash")    // SHA-256 del token
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
  @@map("email_verifications")
}

model PasswordReset {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash")
  expiresAt DateTime  @map("expires_at")            // típicamente 1h
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
  @@map("password_resets")
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash")
  family    String                                  // todos los rotated del mismo flow comparten family
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([family])
  @@index([userId])
  @@map("refresh_tokens")
}
```

### 2.2 Reservas / Pagos

**Modificar `Reserva`:**
```prisma
model Reserva {
  // ... campos existentes
  expiresAt      DateTime? @map("expires_at")        // TTL para PENDIENTES
  idempotencyKey String?   @unique @map("idempotency_key")
  // ... resto
}
```

**Modificar `StripeEvent`:**
```prisma
model StripeEvent {
  id                   String   @id @default(uuid())
  stripeEventId        String   @unique @map("stripe_event_id")
  type                 String
  processedAt          DateTime @default(now()) @map("processed_at")
  processedSuccessfully Boolean @default(true) @map("processed_successfully")
  errorMessage         String?  @map("error_message")
  retries              Int      @default(0)
  payload              Json

  @@index([type])
  @@index([processedSuccessfully])
  @@map("stripe_events")
}
```

### 2.3 Configuración email

**Nuevo modelo:**
```prisma
model ConfiguracionEmail {
  id           String   @id @default("singleton")
  provider     String?                              // 'resend' | 'smtp'
  resendApiKeyEnc String? @map("resend_api_key_enc") // cifrado AES-256-GCM
  smtpHost     String?  @map("smtp_host")
  smtpPort     Int?     @map("smtp_port")
  smtpUserEnc  String?  @map("smtp_user_enc")
  smtpPassEnc  String?  @map("smtp_pass_enc")
  fromEmail    String?  @map("from_email")
  fromName     String?  @map("from_name")
  updatedBy    String?  @map("updated_by")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("configuracion_email")
}
```

### 2.4 Logs de email enviados

**Nuevo modelo (opcional pero útil para soporte):**
```prisma
model EmailLog {
  id         String   @id @default(uuid())
  toEmail    String   @map("to_email")
  subject    String
  template   String                                  // 'verify-email' | 'password-reset' | ...
  status     String                                  // 'sent' | 'failed'
  errorMsg   String?  @map("error_msg")
  providerId String?  @map("provider_id")           // id que devuelve Resend
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([toEmail])
  @@index([template])
  @@index([status])
  @@map("email_logs")
}
```

---

## 3. Endpoints nuevos / modificados

### 3.1 Auth

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | público (rate limit) | Crea user + `emailVerifiedAt:null`, dispara email de verificación. |
| `POST` | `/auth/login` | público (rate limit) | Rechaza con 403 si `emailVerifiedAt === null`. Devuelve `{ accessToken, refreshToken, user }`. |
| `POST` | `/auth/verify-email` | público (rate limit) | Body: `{ token }`. Marca `emailVerifiedAt`. |
| `POST` | `/auth/resend-verification` | público (rate limit) | Body: `{ email }`. Si no existe, responde 200 silencioso (no leakea). |
| `POST` | `/auth/refresh` | público | Body: `{ refreshToken }`. Rota el familyId. Si recibe un token revocado, invalida toda la familia. |
| `POST` | `/auth/logout` | CLIENTE+ | Revoca el refresh actual (blacklist Redis). |
| `POST` | `/auth/password-reset/request` | público (rate limit) | Body: `{ email }`. Silencioso si no existe. |
| `POST` | `/auth/password-reset/confirm` | público | Body: `{ token, newPassword }`. |
| `POST` | `/auth/change-password` | autenticado | Body: `{ currentPassword, newPassword }`. |

### 3.2 Admin / Sistema

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/admin/system/health-detailed` | ADMIN | DB + Redis + Stripe + Resend + BullMQ queue depth. |
| `GET` | `/admin/system/stripe-events` | ADMIN | Lista con filtros `?type=&status=`. |
| `POST` | `/admin/system/stripe-events/:id/retry` | ADMIN | Reintenta procesar un evento fallido. |
| `GET` | `/admin/system/email-logs` | ADMIN | Lista de emails enviados con filtros. |
| `GET` | `/admin/system/queue` | ADMIN | Estado de la cola BullMQ (activos, completados, fallidos). |
| `GET` | `/admin/configuracion/email/status` | ADMIN | Estado del provider (configurado/no, masked). |
| `PATCH` | `/admin/configuracion/email/config` | ADMIN | Actualiza claves del provider. |
| `POST` | `/admin/configuracion/email/test` | ADMIN | Envía email de prueba. |

### 3.3 Reservas (cambios)

- `POST /reservas` ahora setea `expiresAt = now() + 15min` cuando estado es PENDIENTE.
- `POST /pagos/checkout/:reservaId` ahora valida `reserva.expiresAt > now()` antes de crear session.

---

## 4. Jobs BullMQ

### 4.1 Cola `reservas-expirations`

**Job `expire-reserva`:**
- Delay: 15 minutos desde la creación de la reserva.
- Trigger: encolado automático cuando `Reservas.create` produce una PENDIENTE.
- Acción: si la reserva sigue PENDIENTE, marcar como CANCELADA + liberar disponibilidad + enviar email de "tu reserva expiró".

### 4.2 Cola `emails`

**Job `send-email`:**
- Sin delay (procesamiento inmediato).
- Trigger: `mailService.send()` lo encola en lugar de mandar inline.
- Acción: llama al provider (Resend), guarda en `EmailLog`, reintenta hasta 3 veces con backoff exponencial si falla.

### 4.3 Cola `stripe-webhooks-retry`

**Job `retry-webhook`:**
- Trigger: cuando un handler de webhook lanza excepción, se encola con backoff.
- Acción: vuelve a invocar el handler con el `eventId`. Después de 5 reintentos, marca como definitivamente fallido y notifica al admin (email + entrada en tabla).

---

## 5. Plantillas de email

Todas en español, branding TuriDove (navy + gold), tipografía Playfair + DM Sans (con fallback web-safe).

| Template | Asunto | Trigger |
|---|---|---|
| `verify-email` | Confirma tu cuenta en TuriDove | Tras registro |
| `welcome` | Bienvenido a TuriDove | Tras verificar email |
| `password-reset` | Recupera tu contraseña | `POST /auth/password-reset/request` |
| `password-changed` | Tu contraseña fue actualizada | Cambio exitoso |
| `reserva-confirmada` | Tu reserva está confirmada | Webhook `checkout.session.completed` |
| `reserva-cancelada-tiempo` | Tu reserva expiró | TTL job |
| `pago-fallido` | Tu pago no se completó | Webhook `payment_intent.payment_failed` |
| `reembolso-procesado` | Tu reembolso se completó | Webhook `charge.refunded` |

**Formato:**
- HTML responsive con tabla layout (compatibilidad con clientes viejos).
- Versión texto plano siempre incluida (anti-spam + accesibilidad).
- Inline CSS (los clientes mail strip `<style>`).

---

## 6. Rate limiting

Stack: `@nestjs/throttler` con storage Redis.

```typescript
// Configuración global
ThrottlerModule.forRoot([
  { name: 'short',  ttl: 1000,  limit: 10 },   // 10 req/seg/IP
  { name: 'medium', ttl: 60_000, limit: 120 }, // 120 req/min/IP
])
```

Overrides por endpoint:
```typescript
@Throttle({ default: { limit: 5, ttl: 60_000 } })  // login
@Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })  // password reset
```

---

## 7. Observabilidad

### 7.1 Logger Pino

```typescript
import pino from 'pino';
// app.module.ts
LoggerModule.forRoot({
  pinoHttp: {
    transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
    redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    customProps: () => ({ service: 'turidove-backend' }),
  },
})
```

Cada request: `request-id`, `userId` (si auth), `method`, `path`, `status`, `latency_ms`.

### 7.2 Health check

```ts
GET /health
{
  "status": "ok",
  "version": "1.x.x",
  "uptime_seconds": 1234,
  "checks": {
    "database": { "ok": true, "latency_ms": 4 },
    "redis": { "ok": true, "latency_ms": 1 },
    "stripe": { "ok": true, "mode": "live" },
    "email": { "ok": true, "provider": "resend" },
    "queues": { "reservas-expirations": { "active": 0, "waiting": 2, "failed": 0 } }
  }
}
```

Si cualquier check falla → 503.

### 7.3 Dashboard admin de sistema

Página `/admin/sistema` con:
- Tarjetas de salud por servicio (verde/rojo).
- Tabla de últimos 100 eventos Stripe con filtro de fallidos.
- Tabla de últimos emails enviados.
- Botón "Reintentar" en eventos fallidos.
- Gráfico simple de reservas por estado (últimas 24h).

---

## 8. Variables de entorno nuevas

```env
# Redis (interno de Docker)
REDIS_HOST=redis
REDIS_PORT=6379

# BullMQ (puede usar el mismo Redis o uno separado)
BULL_REDIS_HOST=redis
BULL_REDIS_PORT=6379

# Resend
RESEND_API_KEY=re_REPLACE_ME
EMAIL_FROM=noreply@turidove.com
EMAIL_FROM_NAME=TuriDove

# TTL de reservas
RESERVA_TTL_MINUTES=15

# Auth tokens
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
VERIFY_EMAIL_TOKEN_EXPIRATION=24h
PASSWORD_RESET_TOKEN_EXPIRATION=1h

# URLs públicas (para links en emails)
PUBLIC_BASE_URL=http://localhost:3003
```

---

## 9. Migración / coexistencia

- Usuarios ya creados quedan con `emailVerifiedAt = updatedAt` (auto-verificados) en la migración inicial — no obligamos a verificar cuentas pre-existentes.
- Reservas ya creadas sin `expiresAt` quedan tal cual (no se cancelan por TTL).
- Eventos Stripe pre-existentes: `processedSuccessfully = true` en la migración.
- Refresh tokens nuevos: se generan en el primer login después del deploy.

---

## 10. Criterios de éxito

- ✅ Reserva PENDIENTE sin pagar en 15 min se cancela automáticamente y libera inventario.
- ✅ Cliente recibe email de "reserva expiró".
- ✅ Cliente recibe email de "reserva confirmada" en menos de 60 seg desde el pago.
- ✅ Doble-click en "Pagar" no crea 2 sessions de Stripe (idempotency).
- ✅ Webhook fallido se reintenta automáticamente; si supera reintentos, aparece en `/admin/sistema`.
- ✅ Login bloqueado si email sin verificar.
- ✅ Password reset flow funcional.
- ✅ Refresh token reusado dos veces revoca toda la familia.
- ✅ Rate limit visible: 6º intento de login en 60s → 429 Too Many Requests.
- ✅ Health check muestra todos los servicios en verde.
- ✅ Dashboard `/admin/sistema` accesible y datos en vivo.
- ✅ Email de prueba desde `/admin/configuracion/email` llega al destinatario en < 30 seg.

---

## 11. Fases de implementación (resumen)

1. **Fase E.1 — Infra base:** Redis container + BullMQ + Pino logger + helper de mail (sin proveedor todavía, solo abstracción).
2. **Fase E.2 — Resend integration:** MailService, plantillas, configuración admin, smoke test.
3. **Fase E.3 — TTL de reservas:** modelo `expiresAt`, job de expiración, integración con flujo de checkout, email de expiración.
4. **Fase E.4 — Idempotency + tracking de webhooks:** idempotency-key en checkout, columnas nuevas de `StripeEvent`, retry de webhooks, dashboard admin.
5. **Fase D.1 — Verify email:** modelo + endpoints + email + bloqueo de login.
6. **Fase D.2 — Password reset:** modelo + endpoints + email.
7. **Fase D.3 — Refresh token rotation:** modelo + rotación + revocación familiar + blacklist Redis.
8. **Fase D.4 — Rate limiting + Helmet:** throttler + CSP.
9. **K.1 — Observabilidad:** health check enriquecido + dashboard `/admin/sistema`.

Cada fase es un bloque independiente con commits granulares y se puede ejecutar con el patrón subagent-driven.

---

**Última actualización:** 2026-06-04
**Estado:** spec en revisión
**Spec hermano:** [docs/superpowers/specs/2026-05-28-gap-analysis-y-plan-evolutivo.md](2026-05-28-gap-analysis-y-plan-evolutivo.md)
