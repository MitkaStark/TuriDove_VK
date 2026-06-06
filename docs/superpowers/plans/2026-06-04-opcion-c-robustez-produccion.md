# Opción C — Robustez para producción Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar TuriDove de MVP a plataforma robusta para producción agregando Redis + BullMQ (TTL de reservas + jobs asíncronos), Resend para emails transaccionales, verify email obligatorio, password reset, refresh token rotation, rate limiting, Helmet + CSP, logger Pino y dashboard admin de sistema.

**Architecture:** Se conserva el stack actual (NestJS + Prisma + PostgreSQL + Next.js). Se agrega Redis como contenedor nuevo, BullMQ con worker en proceso, y Resend como provider de email (configurable desde admin con cifrado AES-256 igual que Stripe). El plan se divide en 9 sub-fases (E.1–E.4 operación, D.1–D.4 auth, K.1 observabilidad) ejecutables en orden estricto por dependencias.

**Tech Stack:** NestJS 10 + BullMQ + ioredis + nestjs-pino + Resend SDK + nodemailer (fallback SMTP) + @nestjs/throttler + helmet + Prisma 5 + PostgreSQL 18 + Redis 7-alpine + Docker Compose.

**Spec de referencia:** [docs/superpowers/specs/2026-06-04-opcion-c-robustez-produccion-design.md](../specs/2026-06-04-opcion-c-robustez-produccion-design.md)

---

## Convenciones del plan

- **Working directory:** `c:\ServBay\www\TuriDove_VK`.
- **Docker corriendo.** Contenedores: `turidove_vk_api` (backend), `turidove_vk_web` (frontend), `turidove_vk_db` (postgres). Puertos host: backend 3002, frontend 3003, postgres 5435. DB: `turidove_vk`.
- **Backend image build-time:** después de cambios en `backend/src/*` necesita `docker compose --env-file .env.docker build backend` + `up -d --force-recreate backend` (~2-3 min). **Estrategia:** agrupar cambios por sub-fase, rebuild una sola vez al final de cada bloque.
- **Hay un bug conocido de cache:** si el build no recoge cambios, usar `docker compose --env-file .env.docker build --no-cache backend`.
- **Frontend build similar:** ~30-60s.
- **Prisma migrations:** usar el patrón validado en Fase A — crear migration manualmente en `backend/prisma/migrations/<timestamp>_<name>/migration.sql`, copiar al contenedor con `docker cp`, aplicar con `npx prisma migrate deploy` + `npx prisma generate`.
- **Commits frecuentes** en español, formato convencional.
- **NO push automático** al remote — el usuario decide al final.

---

## Decisiones tomadas

1. **Workers:** BullMQ + Redis (Redis 7-alpine como nuevo contenedor).
2. **Email provider:** Resend (con fallback genérico SMTP soportado en el modelo de configuración).
3. **Verify email:** obligatorio para login (los users actuales se auto-verifican en la migración).
4. **Logger:** nestjs-pino con pino-pretty en dev, JSON estructurado en producción.
5. **Rate limiting:** @nestjs/throttler con storage Redis (no in-memory).
6. **Helmet:** activado con CSP estricta configurable.
7. **TTL default de reservas:** 15 minutos (configurable por env `RESERVA_TTL_MINUTES`).
8. **Plantillas email:** HTML responsive con tabla layout + texto plano. Inline CSS.

---

## Estructura de archivos

### Archivos NUEVOS

**Backend — infra:**
- `backend/prisma/migrations/<ts>_opcion_c/migration.sql` — única migración con todos los modelos nuevos
- `backend/src/modules/redis/redis.module.ts`
- `backend/src/modules/redis/redis.service.ts` — ioredis client + helpers
- `backend/src/modules/queue/queue.module.ts` — BullMQ setup con 3 colas
- `backend/src/modules/queue/queue.service.ts` — helpers para encolar jobs

**Backend — mail:**
- `backend/src/modules/mail/mail.module.ts`
- `backend/src/modules/mail/mail.service.ts` — abstracción con Resend + fallback SMTP
- `backend/src/modules/mail/mail.controller.ts` — endpoints admin config
- `backend/src/modules/mail/dto/update-email-config.dto.ts`
- `backend/src/modules/mail/templates/render.util.ts` — render de plantillas
- `backend/src/modules/mail/templates/base.layout.ts` — layout HTML base
- `backend/src/modules/mail/templates/verify-email.ts`
- `backend/src/modules/mail/templates/welcome.ts`
- `backend/src/modules/mail/templates/password-reset.ts`
- `backend/src/modules/mail/templates/password-changed.ts`
- `backend/src/modules/mail/templates/reserva-confirmada.ts`
- `backend/src/modules/mail/templates/reserva-cancelada-tiempo.ts`
- `backend/src/modules/mail/templates/pago-fallido.ts`
- `backend/src/modules/mail/templates/reembolso-procesado.ts`
- `backend/src/modules/mail/email-send.processor.ts` — BullMQ processor

**Backend — reservas TTL:**
- `backend/src/modules/reservas/reserva-expiration.processor.ts` — BullMQ processor

**Backend — webhooks retry:**
- `backend/src/modules/pagos/webhook-retry.processor.ts` — BullMQ processor

**Backend — auth (verify email, password reset, refresh):**
- `backend/src/modules/auth/dto/verify-email.dto.ts`
- `backend/src/modules/auth/dto/resend-verification.dto.ts`
- `backend/src/modules/auth/dto/password-reset-request.dto.ts`
- `backend/src/modules/auth/dto/password-reset-confirm.dto.ts`
- `backend/src/modules/auth/dto/refresh.dto.ts`
- `backend/src/modules/auth/dto/change-password.dto.ts`
- `backend/src/modules/auth/services/email-verification.service.ts`
- `backend/src/modules/auth/services/password-reset.service.ts`
- `backend/src/modules/auth/services/refresh-token.service.ts`

**Backend — sistema admin:**
- `backend/src/modules/sistema/sistema.module.ts`
- `backend/src/modules/sistema/sistema.controller.ts`
- `backend/src/modules/sistema/sistema.service.ts`

**Backend — health:**
- `backend/src/modules/health/health.module.ts`
- `backend/src/modules/health/health.controller.ts`
- `backend/src/modules/health/health.service.ts`

**Frontend — config email admin:**
- `frontend/src/services/email-admin.service.ts`
- `frontend/src/app/admin/configuracion/email/page.tsx`

**Frontend — sistema admin:**
- `frontend/src/services/sistema.service.ts`
- `frontend/src/app/admin/sistema/page.tsx`

**Frontend — auth flows nuevos:**
- `frontend/src/app/(auth)/verify-email/page.tsx`
- `frontend/src/app/(auth)/verify-email/[token]/page.tsx`
- `frontend/src/app/(auth)/password-reset/page.tsx`
- `frontend/src/app/(auth)/password-reset/[token]/page.tsx`

### Archivos MODIFICADOS

**Backend:**
- `backend/prisma/schema.prisma` — User.emailVerifiedAt, Reserva.expiresAt/idempotencyKey, StripeEvent.processedSuccessfully/errorMessage/retries, + 5 modelos nuevos
- `backend/package.json` — agregar deps
- `backend/src/main.ts` — Helmet, Pino, body raw mantenido
- `backend/src/app.module.ts` — registrar RedisModule, QueueModule, MailModule, SistemaModule, HealthModule + ThrottlerModule
- `backend/src/modules/auth/auth.module.ts` — registrar nuevos services
- `backend/src/modules/auth/auth.service.ts` — bloquear login si !emailVerifiedAt, integrar refresh con familyId
- `backend/src/modules/auth/auth.controller.ts` — nuevos endpoints
- `backend/src/modules/reservas/reservas.service.ts` — setear expiresAt, encolar job, validar expiresAt
- `backend/src/modules/pagos/pagos.service.ts` — idempotency key en checkout, marcar StripeEvent con success/error
- `backend/src/modules/stripe/stripe.service.ts` — pasar idempotencyKey a checkout.sessions.create
- `docker-compose.yml` — agregar contenedor redis, REDIS_HOST/PORT a backend

**Frontend:**
- `frontend/src/app/(auth)/login/page.tsx` — manejar 403 con mensaje "verifica tu email" + botón reenviar
- `frontend/src/app/(auth)/register/page.tsx` — mostrar "te enviamos un email de verificación"
- `frontend/src/services/auth.service.ts` — nuevos métodos
- `frontend/src/app/admin/configuracion/page.tsx` — agregar card "Email" debajo de "Pasarela de pago"
- `frontend/src/components/shared/sidebar-nav.tsx` — agregar item "Sistema" en sidebar admin

**Raíz:**
- `.env.docker.example` — variables nuevas

---

## Fase E.1 — Infra base (Redis + BullMQ + Pino + Helmet)

> Objetivo: dejar el backend con Redis disponible, BullMQ inicializado (sin colas todavía), logger Pino activado, y Helmet con CSP. Sin features funcionales todavía — solo infraestructura.

### Tarea 1: Agregar contenedor Redis a docker-compose

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.docker.example`

- [ ] **Step 1: Inspeccionar docker-compose actual**

```powershell
Get-Content docker-compose.yml | Select-String -Pattern "^  (postgres|backend|frontend|redis):" -SimpleMatch
```
Expected: ver `postgres`, `backend`, `frontend`. NO `redis` (todavía).

- [ ] **Step 2: Agregar bloque redis en docker-compose.yml**

Localizar el final del bloque `postgres:` (justo antes del bloque `backend:`) y agregar:

```yaml
  redis:
    image: redis:7-alpine
    container_name: turidove_vk_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "${REDIS_PORT:-6380}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - turidove_vk_net
```

Y agregar el volumen `redis_data` al bloque `volumes:` al final del archivo. Si ya hay `volumes:`, agregar entrada nueva:

```yaml
volumes:
  postgres_data:
  redis_data:
```

(Si la sección no existía, crearla. Inspeccionar el archivo actual con `Get-Content docker-compose.yml | Select-String "^volumes" -Context 0,5`.)

- [ ] **Step 3: Agregar variables al servicio backend**

Localizar `environment:` del servicio `backend:` y agregar al final:

```yaml
      REDIS_HOST: ${REDIS_HOST:-redis}
      REDIS_PORT: ${REDIS_PORT_INTERNAL:-6379}
```

Agregar también dependencia:

```yaml
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

(Si ya existía `depends_on` solo con postgres, expandir.)

- [ ] **Step 4: Actualizar `.env.docker.example`**

Al final del archivo agregar:

```env

# ─────────── Redis (BullMQ + cache rate limiting) ───────────
REDIS_PORT=6380
REDIS_PORT_INTERNAL=6379
REDIS_HOST=redis
```

- [ ] **Step 5: Actualizar `.env.docker` (no committed)**

```powershell
Add-Content -Path .env.docker -Value @"

# Redis
REDIS_PORT=6380
REDIS_PORT_INTERNAL=6379
REDIS_HOST=redis
"@
```

- [ ] **Step 6: Levantar el contenedor redis**

```powershell
docker compose --env-file .env.docker up -d redis
```
Expected:
- Pull de la imagen redis:7-alpine la primera vez (~10s).
- `Container turidove_vk_redis Started`.

- [ ] **Step 7: Verificar healthy**

```powershell
Start-Sleep -Seconds 10
docker ps --filter name=turidove_vk_redis --format "{{.Status}}"
```
Expected: `Up X seconds (healthy)`.

- [ ] **Step 8: Test de conectividad desde el host**

```powershell
docker exec turidove_vk_redis redis-cli ping
```
Expected: `PONG`.

- [ ] **Step 9: Commit**

```powershell
git add docker-compose.yml .env.docker.example
git commit -m "feat(docker): agregar contenedor Redis 7-alpine para BullMQ + cache"
```

### Tarea 2: Instalar dependencias backend

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Instalar deps en el contenedor backend**

Las nuevas deps incluyen:
- `ioredis` — cliente Redis.
- `@nestjs/bullmq` + `bullmq` — sistema de colas.
- `nestjs-pino` + `pino-http` + `pino-pretty` — logger estructurado.
- `helmet` — security headers.
- `@nestjs/throttler` — rate limiting.
- `nestjs-throttler-storage-redis` — storage Redis para throttler.

```powershell
docker exec turidove_vk_api npm install ioredis @nestjs/bullmq bullmq nestjs-pino pino-http pino-pretty helmet @nestjs/throttler @nest-lab/throttler-storage-redis --legacy-peer-deps
```

Notas: usamos `@nest-lab/throttler-storage-redis` (fork mantenido) en lugar de `nestjs-throttler-storage-redis` original que está abandonado.

Expected: `added N packages` sin errores fatales.

- [ ] **Step 2: Copiar package.json y package-lock.json del contenedor al host**

```powershell
docker cp turidove_vk_api:/app/package.json backend/package.json
docker cp turidove_vk_api:/app/package-lock.json backend/package-lock.json
```

- [ ] **Step 3: Verificar que aparecen en deps**

```powershell
Select-String -Path backend/package.json -Pattern "ioredis|bullmq|nestjs-pino|helmet|throttler"
```
Expected: 7+ matches con todas las deps.

- [ ] **Step 4: Commit**

```powershell
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): instalar ioredis + bullmq + nestjs-pino + helmet + throttler"
```

### Tarea 3: RedisModule + RedisService

**Files:**
- Create: `backend/src/modules/redis/redis.module.ts`
- Create: `backend/src/modules/redis/redis.service.ts`

- [ ] **Step 1: Crear redis.service.ts**

```ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  async onModuleInit() {
    const host = process.env.REDIS_HOST ?? 'localhost';
    const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: null, // requerido por BullMQ
      lazyConnect: false,
    });
    this.client.on('connect', () => this.logger.log(`Redis conectado a ${host}:${port}`));
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.client.ping();
      return { ok: true, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }
}
```

- [ ] **Step 2: Crear redis.module.ts**

```ts
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

- [ ] **Step 3: Registrar en app.module.ts**

Inspeccionar la sección `imports:` actual:

```powershell
Get-Content backend/src/app.module.ts | Select-String "imports:" -Context 0,30
```

Agregar import al inicio:
```ts
import { RedisModule } from './modules/redis/redis.module';
```

Y agregar `RedisModule,` al array `imports:` (al inicio, antes de otros módulos para que esté disponible globalmente).

- [ ] **Step 4: Commit**

```powershell
git add backend/src/modules/redis/ backend/src/app.module.ts
git commit -m "feat(redis): RedisModule + service con ping y getClient()"
```

### Tarea 4: QueueModule (BullMQ) sin colas todavía

**Files:**
- Create: `backend/src/modules/queue/queue.module.ts`

- [ ] **Step 1: Crear queue.module.ts**

```ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: { count: 1000, age: 24 * 3600 },
          removeOnFail: { count: 5000, age: 7 * 24 * 3600 },
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

- [ ] **Step 2: Registrar en app.module.ts**

Agregar:
```ts
import { QueueModule } from './modules/queue/queue.module';
```

Y `QueueModule,` al array `imports:`.

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/queue/ backend/src/app.module.ts
git commit -m "feat(queue): QueueModule con BullMQ configurado contra Redis"
```

### Tarea 5: Logger Pino

**Files:**
- Modify: `backend/src/main.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Registrar LoggerModule en app.module.ts**

Agregar import:
```ts
import { LoggerModule } from 'nestjs-pino';
```

Agregar al array `imports:`:
```ts
LoggerModule.forRoot({
  pinoHttp: {
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { singleLine: true } }
      : undefined,
    redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secretKey'],
    customProps: () => ({ service: 'turidove-backend' }),
    autoLogging: true,
  },
}),
```

- [ ] **Step 2: Activar Logger en main.ts**

Leer main.ts:
```powershell
Get-Content backend/src/main.ts | Select-Object -First 15
```

Agregar import:
```ts
import { Logger as PinoLogger } from 'nestjs-pino';
```

Después de `const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });` agregar:

```ts
app.useLogger(app.get(PinoLogger));
```

- [ ] **Step 3: Commit**

```powershell
git add backend/src/main.ts backend/src/app.module.ts
git commit -m "feat(logging): nestjs-pino con redact de secretos + pino-pretty en dev"
```

### Tarea 6: Helmet con CSP

**Files:**
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Agregar Helmet a main.ts**

Después de `app.enableCors(...)` agregar:

```ts
import helmet from 'helmet';

// dentro de bootstrap, después de enableCors:
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      },
    },
    crossOriginEmbedderPolicy: false, // permite imágenes externas
  }),
);
```

Mover el `import helmet from 'helmet';` al top junto a los demás imports.

- [ ] **Step 2: Commit**

```powershell
git add backend/src/main.ts
git commit -m "feat(security): Helmet con CSP estricta (permite Stripe Checkout)"
```

### Tarea 7: ThrottlerModule (global pero sin overrides aún)

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Agregar ThrottlerModule**

Imports:
```ts
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
```

Agregar al array `imports:`:
```ts
ThrottlerModule.forRootAsync({
  useFactory: () => ({
    throttlers: [
      { name: 'short',  ttl: 1000,  limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 120 },
    ],
    storage: new ThrottlerStorageRedisService(
      new Redis({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        maxRetriesPerRequest: null,
      }),
    ),
  }),
}),
```

Y registrar el guard global. Agregar imports:
```ts
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
```

En `providers:` array agregar:
```ts
{ provide: APP_GUARD, useClass: ThrottlerGuard },
```

- [ ] **Step 2: Commit**

```powershell
git add backend/src/app.module.ts
git commit -m "feat(security): ThrottlerModule global con storage Redis (10/seg + 120/min default)"
```

### Tarea 8: Rebuild + smoke test E.1

- [ ] **Step 1: Rebuild backend**

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d --force-recreate backend
```
Expected: build OK, contenedor arranca.

- [ ] **Step 2: Verificar logs**

```powershell
Start-Sleep -Seconds 10
docker logs turidove_vk_api --tail 30
```
Expected:
- `Redis conectado a redis:6379`
- `Nest application successfully started`
- Sin errores.

- [ ] **Step 3: Test rate limit**

```powershell
1..15 | ForEach-Object { curl -sS -o $null -w "%{http_code} " http://localhost:3002/api/v1/hospedajes?limit=1 }
```
Expected: las primeras 10 retornan 200, las restantes 429 (rate limit short=10/seg).

Si todos retornan 200, el throttler no se activó — revisar logs por errores de inicialización.

- [ ] **Step 4: Verificar logger Pino**

Ya debe verse logging estructurado en los logs (con request-id, etc.). Si solo aparece formato Nest viejo, verificar que `app.useLogger` se ejecutó.

- [ ] **Step 5: Sin commit. Fin de E.1.**

---

## Fase E.2 — Resend integration + Mail module

### Tarea 9: Schema Prisma para ConfiguracionEmail + EmailLog

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Agregar al final del schema**

```prisma
model ConfiguracionEmail {
  id              String   @id @default("singleton")
  provider        String?
  resendApiKeyEnc String?  @map("resend_api_key_enc")
  smtpHost        String?  @map("smtp_host")
  smtpPort        Int?     @map("smtp_port")
  smtpUserEnc     String?  @map("smtp_user_enc")
  smtpPassEnc     String?  @map("smtp_pass_enc")
  fromEmail       String?  @map("from_email")
  fromName        String?  @map("from_name")
  updatedBy       String?  @map("updated_by")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("configuracion_email")
}

model EmailLog {
  id         String   @id @default(uuid())
  toEmail    String   @map("to_email")
  subject    String
  template   String
  status     String
  errorMsg   String?  @map("error_msg")
  providerId String?  @map("provider_id")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([toEmail])
  @@index([template])
  @@index([status])
  @@map("email_logs")
}
```

- [ ] **Step 2: Crear migration manualmente**

```powershell
$ts = Get-Date -Format "yyyyMMddHHmmss"
$migDir = "backend/prisma/migrations/${ts}_email_config_and_logs"
New-Item -ItemType Directory -Path $migDir -Force | Out-Null
```

Crear `$migDir/migration.sql` con:

```sql
CREATE TABLE "configuracion_email" (
  "id"                  TEXT NOT NULL DEFAULT 'singleton',
  "provider"            TEXT,
  "resend_api_key_enc"  TEXT,
  "smtp_host"           TEXT,
  "smtp_port"           INTEGER,
  "smtp_user_enc"       TEXT,
  "smtp_pass_enc"       TEXT,
  "from_email"          TEXT,
  "from_name"           TEXT,
  "updated_by"          TEXT,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "configuracion_email_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_logs" (
  "id"          TEXT NOT NULL,
  "to_email"    TEXT NOT NULL,
  "subject"     TEXT NOT NULL,
  "template"    TEXT NOT NULL,
  "status"      TEXT NOT NULL,
  "error_msg"   TEXT,
  "provider_id" TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_to_email_idx" ON "email_logs"("to_email");
CREATE INDEX "email_logs_template_idx" ON "email_logs"("template");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
```

- [ ] **Step 3: Aplicar migration**

```powershell
docker cp backend/prisma/schema.prisma turidove_vk_api:/app/prisma/schema.prisma
docker cp "$migDir/migration.sql" "turidove_vk_api:/app/prisma/migrations/$(Split-Path $migDir -Leaf)/migration.sql"
docker exec turidove_vk_api sh -c "mkdir -p /app/prisma/migrations/$(Split-Path $migDir -Leaf)"
docker cp "$migDir/migration.sql" "turidove_vk_api:/app/prisma/migrations/$(Split-Path $migDir -Leaf)/migration.sql"
docker exec turidove_vk_api npx prisma migrate deploy
docker exec turidove_vk_api npx prisma generate
```

Verificar:
```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "\d configuracion_email"
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "\d email_logs"
```
Expected: ambas tablas listadas.

- [ ] **Step 4: Commit**

```powershell
git add backend/prisma/
git commit -m "feat(db): tabla configuracion_email (singleton) + email_logs"
```

### Tarea 10: Instalar Resend SDK

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Instalar**

```powershell
docker exec turidove_vk_api npm install resend nodemailer --legacy-peer-deps
docker exec turidove_vk_api npm install --save-dev @types/nodemailer --legacy-peer-deps
docker cp turidove_vk_api:/app/package.json backend/package.json
docker cp turidove_vk_api:/app/package-lock.json backend/package-lock.json
```

- [ ] **Step 2: Commit**

```powershell
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): instalar resend + nodemailer (fallback SMTP)"
```

### Tarea 11: MailService — renderer + sender

**Files:**
- Create: `backend/src/modules/mail/templates/render.util.ts`
- Create: `backend/src/modules/mail/templates/base.layout.ts`
- Create: `backend/src/modules/mail/mail.service.ts`

- [ ] **Step 1: Crear base.layout.ts**

```ts
export interface LayoutContent {
  title: string;
  preheader?: string;
  heading: string;
  bodyHtml: string;       // HTML del cuerpo (entre el heading y el footer)
  ctaUrl?: string;
  ctaText?: string;
  footerText?: string;
}

const NAVY_800 = '#10213A';
const NAVY_600 = '#1A365D';
const NAVY_400 = '#4A6FA3';
const GOLD_500 = '#C49A3D';
const CREAM    = '#FEFBF4';
const WHITE    = '#FFFFFF';

/**
 * Layout HTML responsive con table-based layout (compatibilidad con clientes mail viejos).
 * Inline CSS porque la mayoría de clientes stripean <style>.
 */
export function renderBaseLayout(c: LayoutContent): string {
  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(c.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};font-family:Georgia,serif;color:${NAVY_600};">
${c.preheader ? `<div style="display:none;font-size:1px;color:${CREAM};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(c.preheader)}</div>` : ''}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${CREAM};">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:${WHITE};border-radius:16px;overflow:hidden;">
      <tr><td style="padding:24px 32px;border-bottom:1px solid #E0E5EF;text-align:center;">
        <div style="font-size:10px;letter-spacing:2px;color:${NAVY_400};text-transform:uppercase;">VIAJES</div>
        <div style="font-size:20px;font-weight:bold;color:${NAVY_800};margin-top:4px;">TuriDove</div>
      </td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:24px;color:${NAVY_800};font-weight:bold;">${escapeHtml(c.heading)}</h1>
        <div style="font-size:15px;line-height:1.6;color:${NAVY_600};font-family:Arial,sans-serif;">${c.bodyHtml}</div>
        ${c.ctaUrl && c.ctaText ? `<div style="text-align:center;margin:32px 0 8px;"><a href="${escapeAttr(c.ctaUrl)}" style="display:inline-block;background:${GOLD_500};color:${WHITE};text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(c.ctaText)}</a></div>` : ''}
      </td></tr>
      <tr><td style="padding:20px 32px;background-color:${NAVY_800};color:#A3B5D1;text-align:center;font-size:12px;font-family:Arial,sans-serif;">
        ${c.footerText ? `<p style="margin:0 0 8px;">${escapeHtml(c.footerText)}</p>` : ''}
        <p style="margin:0;">© ${new Date().getFullYear()} TuriDove · Todos los derechos reservados</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
```

- [ ] **Step 2: Crear render.util.ts**

```ts
import { renderBaseLayout, LayoutContent } from './base.layout';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Strips HTML tags y normaliza para versión texto plano de cada email.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

export function renderEmail(subject: string, layout: LayoutContent, plainText: string): RenderedEmail {
  return {
    subject,
    html: renderBaseLayout(layout),
    text: plainText,
  };
}
```

- [ ] **Step 3: Crear mail.service.ts (stub sin provider real todavía)**

```ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptSecret, encryptSecret, maskKey } from '../../common/utils/crypto.util';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { RenderedEmail } from './templates/render.util';

export interface MailConfig {
  provider: 'resend' | 'smtp' | 'none';
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private cachedConfig: MailConfig | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async loadConfig(): Promise<MailConfig> {
    let row: any = null;
    try {
      row = await this.prisma.configuracionEmail.findUnique({ where: { id: 'singleton' } });
    } catch (e) {
      this.logger.warn(`No se pudo leer configuracion_email: ${(e as Error).message}`);
    }

    const fromEnv = (v: string | undefined, ph: string) => v && !v.includes('REPLACE_ME') ? v : ph;

    const provider = (row?.provider ?? (process.env.RESEND_API_KEY ? 'resend' : 'none')) as MailConfig['provider'];
    const resendApiKey = row?.resendApiKeyEnc ? safeDecrypt(row.resendApiKeyEnc) : fromEnv(process.env.RESEND_API_KEY, '');
    const fromEmail = row?.fromEmail ?? process.env.EMAIL_FROM ?? 'noreply@turidove.com';
    const fromName  = row?.fromName  ?? process.env.EMAIL_FROM_NAME ?? 'TuriDove';

    const cfg: MailConfig = { provider, resendApiKey, fromEmail, fromName };
    if (provider === 'smtp') {
      cfg.smtpHost = row?.smtpHost ?? process.env.SMTP_HOST;
      cfg.smtpPort = row?.smtpPort ?? parseInt(process.env.SMTP_PORT ?? '587', 10);
      cfg.smtpUser = row?.smtpUserEnc ? safeDecrypt(row.smtpUserEnc) : process.env.SMTP_USER;
      cfg.smtpPass = row?.smtpPassEnc ? safeDecrypt(row.smtpPassEnc) : process.env.SMTP_PASS;
    }
    this.cachedConfig = cfg;
    return cfg;
  }

  async refresh(): Promise<MailConfig> {
    return this.loadConfig();
  }

  async getStatus() {
    const cfg = this.cachedConfig ?? (await this.loadConfig());
    return {
      configured: cfg.provider !== 'none' && !!(cfg.resendApiKey || (cfg.smtpHost && cfg.smtpUser && cfg.smtpPass)),
      provider: cfg.provider,
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName,
      resendKeyMasked: cfg.resendApiKey ? maskKey(cfg.resendApiKey) : null,
      smtpHost: cfg.smtpHost ?? null,
      smtpPort: cfg.smtpPort ?? null,
      smtpUserMasked: cfg.smtpUser ? maskKey(cfg.smtpUser) : null,
    };
  }

  async updateConfig(
    payload: {
      provider?: 'resend' | 'smtp';
      resendApiKey?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPass?: string;
      fromEmail?: string;
      fromName?: string;
    },
    updatedBy: string,
  ): Promise<MailConfig> {
    const data: any = { updatedBy };
    if (payload.provider !== undefined) data.provider = payload.provider;
    if (payload.resendApiKey !== undefined) {
      data.resendApiKeyEnc = payload.resendApiKey ? encryptSecret(payload.resendApiKey) : null;
    }
    if (payload.smtpHost !== undefined) data.smtpHost = payload.smtpHost || null;
    if (payload.smtpPort !== undefined) data.smtpPort = payload.smtpPort || null;
    if (payload.smtpUser !== undefined) {
      data.smtpUserEnc = payload.smtpUser ? encryptSecret(payload.smtpUser) : null;
    }
    if (payload.smtpPass !== undefined) {
      data.smtpPassEnc = payload.smtpPass ? encryptSecret(payload.smtpPass) : null;
    }
    if (payload.fromEmail !== undefined) data.fromEmail = payload.fromEmail || null;
    if (payload.fromName !== undefined) data.fromName = payload.fromName || null;

    await this.prisma.configuracionEmail.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    return this.refresh();
  }

  /**
   * Envía un email DIRECTAMENTE (sin cola). Usado para tests y para
   * casos donde queremos error inmediato. La cola lo invoca igual.
   */
  async sendNow(to: string, email: RenderedEmail, template: string): Promise<{ ok: boolean; id?: string; error?: string }> {
    const cfg = this.cachedConfig ?? (await this.loadConfig());
    if (cfg.provider === 'none') {
      const err = 'Mail provider no configurado';
      await this.logEmail(to, email.subject, template, 'failed', err, null);
      return { ok: false, error: err };
    }

    try {
      let providerId: string | null = null;
      if (cfg.provider === 'resend') {
        if (!cfg.resendApiKey) throw new Error('Resend API key vacía');
        const resend = new Resend(cfg.resendApiKey);
        const { data, error } = await resend.emails.send({
          from: `${cfg.fromName} <${cfg.fromEmail}>`,
          to,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
        if (error) throw new Error(error.message);
        providerId = data?.id ?? null;
      } else if (cfg.provider === 'smtp') {
        const transporter = nodemailer.createTransport({
          host: cfg.smtpHost,
          port: cfg.smtpPort ?? 587,
          secure: (cfg.smtpPort ?? 587) === 465,
          auth: { user: cfg.smtpUser!, pass: cfg.smtpPass! },
        });
        const info = await transporter.sendMail({
          from: `${cfg.fromName} <${cfg.fromEmail}>`,
          to,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
        providerId = info.messageId;
      }
      await this.logEmail(to, email.subject, template, 'sent', null, providerId);
      return { ok: true, id: providerId ?? undefined };
    } catch (e: any) {
      const msg = e?.message ?? 'Error desconocido';
      this.logger.error(`Email a ${to} (${template}) falló: ${msg}`);
      await this.logEmail(to, email.subject, template, 'failed', msg, null);
      return { ok: false, error: msg };
    }
  }

  private async logEmail(to: string, subject: string, template: string, status: 'sent'|'failed', errorMsg: string | null, providerId: string | null) {
    try {
      await this.prisma.emailLog.create({
        data: { toEmail: to, subject, template, status, errorMsg, providerId },
      });
    } catch (e) {
      this.logger.warn(`No se pudo registrar email_log: ${(e as Error).message}`);
    }
  }
}

function safeDecrypt(enc: string): string {
  try {
    return decryptSecret(enc);
  } catch {
    return '';
  }
}
```

- [ ] **Step 4: Commit**

```powershell
git add backend/src/modules/mail/
git commit -m "feat(mail): MailService con Resend + SMTP fallback + EmailLog + getStatus/updateConfig"
```

### Tarea 12: MailModule + Controller admin

**Files:**
- Create: `backend/src/modules/mail/mail.module.ts`
- Create: `backend/src/modules/mail/mail.controller.ts`
- Create: `backend/src/modules/mail/dto/update-email-config.dto.ts`

- [ ] **Step 1: Crear DTO**

```ts
import { IsOptional, IsString, IsEmail, IsInt, IsIn } from 'class-validator';

export class UpdateEmailConfigDto {
  @IsOptional()
  @IsIn(['resend', 'smtp'])
  provider?: 'resend' | 'smtp';

  @IsOptional()
  @IsString()
  resendApiKey?: string;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPass?: string;

  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  fromName?: string;
}
```

- [ ] **Step 2: Crear mail.controller.ts**

```ts
import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { renderEmail } from './templates/render.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('admin/email')
@Controller('admin/email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get('status')
  status() {
    return this.mail.getStatus();
  }

  @Patch('config')
  async updateConfig(@Body() dto: UpdateEmailConfigDto, @Req() req: any) {
    await this.mail.updateConfig(dto, req.user?.id ?? 'unknown');
    return this.mail.getStatus();
  }

  @Post('test')
  @ApiOperation({ summary: 'Envía un email de prueba al admin autenticado.' })
  async sendTest(@Req() req: any) {
    const to = req.user?.email;
    if (!to) return { ok: false, error: 'Sin email en el token JWT' };
    const email = renderEmail(
      'Email de prueba — TuriDove',
      {
        title: 'Email de prueba',
        preheader: 'Confirmación de que la configuración de email funciona',
        heading: '¡Funciona!',
        bodyHtml: '<p>Si recibes este mensaje, la configuración de email de TuriDove está operativa.</p><p>Provider activo: <strong>verificado desde el panel admin</strong>.</p>',
        ctaUrl: 'http://localhost:3003/admin/configuracion/email',
        ctaText: 'Volver al panel',
        footerText: 'Email enviado desde el endpoint de prueba.',
      },
      'Si recibes este mensaje, la configuración de email de TuriDove está operativa.',
    );
    return this.mail.sendNow(to, email, 'test');
  }
}
```

- [ ] **Step 3: Crear mail.module.ts**

```ts
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Global()
@Module({
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

- [ ] **Step 4: Registrar en app.module.ts**

Agregar:
```ts
import { MailModule } from './modules/mail/mail.module';
```
Y `MailModule,` al array `imports:`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/modules/mail/
git commit -m "feat(mail): MailModule + Controller admin con status, updateConfig, test"
```

### Tarea 13: 8 plantillas de email

**Files:**
- Create: 8 archivos en `backend/src/modules/mail/templates/`

Cada plantilla es una función pura que recibe el contexto y devuelve un `RenderedEmail`.

- [ ] **Step 1: verify-email.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function verifyEmailTemplate(c: { nombre: string; url: string }): RenderedEmail {
  return renderEmail(
    'Confirma tu cuenta en TuriDove',
    {
      title: 'Confirma tu cuenta',
      preheader: 'Un último paso para activar tu cuenta',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Gracias por registrarte en TuriDove. Para activar tu cuenta y comenzar a reservar, confirma tu email haciendo click en el botón siguiente.</p><p>El link expira en 24 horas.</p>`,
      ctaUrl: c.url,
      ctaText: 'Confirmar mi cuenta',
      footerText: 'Si no creaste esta cuenta, ignora este email.',
    },
    `Hola ${c.nombre},\n\nConfirma tu cuenta visitando: ${c.url}\n\nEl link expira en 24 horas.\n\nSi no creaste esta cuenta, ignora este email.`,
  );
}
```

- [ ] **Step 2: welcome.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function welcomeTemplate(c: { nombre: string }): RenderedEmail {
  return renderEmail(
    'Bienvenido a TuriDove',
    {
      title: 'Bienvenido',
      preheader: 'Tu cuenta está lista',
      heading: `¡Bienvenido a TuriDove, ${c.nombre}!`,
      bodyHtml: `<p>Tu cuenta ya está activada. Explora nuestros hoteles boutique, actividades curadas, vehículos y paquetes turísticos.</p>`,
      ctaUrl: 'http://localhost:3003',
      ctaText: 'Explorar TuriDove',
    },
    `¡Bienvenido a TuriDove, ${c.nombre}!\n\nTu cuenta ya está activada. Explora hoteles, actividades, vehículos y paquetes en http://localhost:3003`,
  );
}
```

- [ ] **Step 3: password-reset.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function passwordResetTemplate(c: { nombre: string; url: string }): RenderedEmail {
  return renderEmail(
    'Recupera tu contraseña en TuriDove',
    {
      title: 'Recupera tu contraseña',
      preheader: 'Solicitud de cambio de contraseña',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, haz click en el botón siguiente. El link expira en 1 hora.</p>`,
      ctaUrl: c.url,
      ctaText: 'Restablecer contraseña',
      footerText: 'Si no solicitaste el cambio, ignora este email. Tu contraseña permanece intacta.',
    },
    `Hola ${c.nombre},\n\nRestablece tu contraseña visitando: ${c.url}\n\nEl link expira en 1 hora. Si no solicitaste el cambio, ignora este email.`,
  );
}
```

- [ ] **Step 4: password-changed.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function passwordChangedTemplate(c: { nombre: string }): RenderedEmail {
  return renderEmail(
    'Tu contraseña fue actualizada',
    {
      title: 'Contraseña actualizada',
      preheader: 'Confirmación de cambio',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Tu contraseña en TuriDove fue actualizada exitosamente.</p><p>Si no realizaste este cambio, contacta a soporte inmediatamente.</p>`,
    },
    `Hola ${c.nombre},\n\nTu contraseña en TuriDove fue actualizada exitosamente. Si no realizaste este cambio, contacta a soporte inmediatamente.`,
  );
}
```

- [ ] **Step 5: reserva-confirmada.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function reservaConfirmadaTemplate(c: { nombre: string; codigo: string; total: string; moneda: string }): RenderedEmail {
  return renderEmail(
    `Reserva confirmada · ${c.codigo}`,
    {
      title: 'Reserva confirmada',
      preheader: 'Tu pago fue recibido',
      heading: `¡Tu reserva está confirmada, ${c.nombre}!`,
      bodyHtml: `<p>Recibimos tu pago y tu reserva está lista.</p><p style="margin:24px 0;padding:16px;background:#FDF8ED;border-radius:8px;font-family:monospace;font-size:13px;"><strong>Código de reserva:</strong> ${c.codigo}<br><strong>Total cobrado:</strong> ${c.moneda} ${c.total}</p><p>Puedes revisar el detalle desde tu panel de cliente.</p>`,
      ctaUrl: 'http://localhost:3003/cliente/reservas',
      ctaText: 'Ver mis reservas',
    },
    `¡Tu reserva está confirmada, ${c.nombre}!\n\nCódigo: ${c.codigo}\nTotal cobrado: ${c.moneda} ${c.total}\n\nVe el detalle: http://localhost:3003/cliente/reservas`,
  );
}
```

- [ ] **Step 6: reserva-cancelada-tiempo.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function reservaCanceladaTiempoTemplate(c: { nombre: string; codigo: string }): RenderedEmail {
  return renderEmail(
    `Tu reserva expiró · ${c.codigo}`,
    {
      title: 'Reserva expirada',
      preheader: 'No completaste el pago a tiempo',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Tu reserva <strong>${c.codigo}</strong> fue cancelada automáticamente porque no completaste el pago dentro del tiempo límite (15 minutos).</p><p>El inventario fue liberado. Si aún quieres reservar, vuelve a iniciar el proceso.</p>`,
      ctaUrl: 'http://localhost:3003',
      ctaText: 'Volver a reservar',
    },
    `Hola ${c.nombre},\n\nTu reserva ${c.codigo} fue cancelada porque no completaste el pago a tiempo. El inventario fue liberado.\n\nVuelve a reservar en: http://localhost:3003`,
  );
}
```

- [ ] **Step 7: pago-fallido.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function pagoFallidoTemplate(c: { nombre: string; codigo: string }): RenderedEmail {
  return renderEmail(
    `Pago no completado · ${c.codigo}`,
    {
      title: 'Pago no completado',
      preheader: 'Tu pago no pudo procesarse',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>El intento de pago para la reserva <strong>${c.codigo}</strong> no se pudo procesar.</p><p>Puedes reintentar desde tu panel de reservas. La reserva sigue activa hasta que expire el tiempo límite.</p>`,
      ctaUrl: `http://localhost:3003/cliente/reservas`,
      ctaText: 'Reintentar pago',
    },
    `Hola ${c.nombre},\n\nEl intento de pago para la reserva ${c.codigo} no se pudo procesar. Reintenta en: http://localhost:3003/cliente/reservas`,
  );
}
```

- [ ] **Step 8: reembolso-procesado.ts**

```ts
import { renderEmail, RenderedEmail } from './render.util';

export function reembolsoProcesadoTemplate(c: { nombre: string; codigo: string; total: string; moneda: string }): RenderedEmail {
  return renderEmail(
    `Reembolso procesado · ${c.codigo}`,
    {
      title: 'Reembolso procesado',
      preheader: 'Tu dinero está en camino',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Procesamos el reembolso de tu reserva <strong>${c.codigo}</strong>.</p><p style="margin:24px 0;padding:16px;background:#FDF8ED;border-radius:8px;font-family:monospace;font-size:13px;"><strong>Monto reembolsado:</strong> ${c.moneda} ${c.total}</p><p>El dinero estará disponible en tu medio de pago en 5-10 días hábiles, dependiendo de tu banco.</p>`,
    },
    `Hola ${c.nombre},\n\nProcesamos el reembolso de tu reserva ${c.codigo}.\nMonto: ${c.moneda} ${c.total}\n\nEl dinero estará disponible en 5-10 días hábiles.`,
  );
}
```

- [ ] **Step 9: Commit**

```powershell
git add backend/src/modules/mail/templates/
git commit -m "feat(mail): 8 plantillas (verify, welcome, password-reset/changed, reserva-confirmada/expirada, pago-fallido, reembolso)"
```

### Tarea 14: Email send processor (BullMQ)

**Files:**
- Create: `backend/src/modules/mail/email-send.processor.ts`
- Modify: `backend/src/modules/mail/mail.module.ts`
- Modify: `backend/src/modules/mail/mail.service.ts`

- [ ] **Step 1: Crear processor**

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from './mail.service';
import { RenderedEmail } from './templates/render.util';

export interface SendEmailJob {
  to: string;
  email: RenderedEmail;
  template: string;
}

@Processor('emails')
export class EmailSendProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailSendProcessor.name);
  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job<SendEmailJob>): Promise<{ ok: boolean; id?: string }> {
    const { to, email, template } = job.data;
    const r = await this.mail.sendNow(to, email, template);
    if (!r.ok) {
      throw new Error(r.error ?? 'Error al enviar email');
    }
    this.logger.log(`Email ${template} enviado a ${to} (id: ${r.id})`);
    return { ok: true, id: r.id };
  }
}
```

- [ ] **Step 2: Agregar BullModule.registerQueue al MailModule**

```ts
import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { EmailSendProcessor } from './email-send.processor';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'emails' })],
  controllers: [MailController],
  providers: [MailService, EmailSendProcessor],
  exports: [MailService, BullModule],
})
export class MailModule {}
```

- [ ] **Step 3: Agregar método `send` (encolado) al MailService**

Al final de la clase `MailService`, agregar:

```ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// dentro del constructor del MailService, agregar:
// @InjectQueue('emails') private readonly emailsQueue: Queue,

// método nuevo:
async send(to: string, email: RenderedEmail, template: string): Promise<void> {
  await this.emailsQueue.add('send-email', { to, email, template });
}
```

(El cambio al constructor lo haces editando la firma — termina así:)

```ts
constructor(
  private readonly prisma: PrismaService,
  @InjectQueue('emails') private readonly emailsQueue: Queue,
) {}
```

Imports a agregar al top:
```ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
```

- [ ] **Step 4: Commit**

```powershell
git add backend/src/modules/mail/
git commit -m "feat(mail): EmailSendProcessor (BullMQ) + cola 'emails' con retries"
```

### Tarea 15: Frontend admin /admin/configuracion/email

**Files:**
- Create: `frontend/src/services/email-admin.service.ts`
- Create: `frontend/src/app/admin/configuracion/email/page.tsx`
- Modify: `frontend/src/app/admin/configuracion/page.tsx`

- [ ] **Step 1: Service**

```ts
import { api } from '@/lib/axios';

export interface EmailStatus {
  configured: boolean;
  provider: 'resend' | 'smtp' | 'none';
  fromEmail: string;
  fromName: string;
  resendKeyMasked: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUserMasked: string | null;
}

export const emailAdminService = {
  async getStatus(): Promise<EmailStatus> {
    const { data } = await api.get('/admin/email/status');
    return data as EmailStatus;
  },
  async updateConfig(payload: Partial<{ provider: 'resend' | 'smtp'; resendApiKey: string; smtpHost: string; smtpPort: number; smtpUser: string; smtpPass: string; fromEmail: string; fromName: string }>) {
    const { data } = await api.patch('/admin/email/config', payload);
    return data as EmailStatus;
  },
  async test(): Promise<{ ok: boolean; id?: string; error?: string }> {
    const { data } = await api.post('/admin/email/test', {});
    return data;
  },
};
```

- [ ] **Step 2: Página**

```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Mail, Eye, EyeOff, Save, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { emailAdminService } from '@/services/email-admin.service';

export default function ConfigEmailPage() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ['admin', 'email-status'],
    queryFn: () => emailAdminService.getStatus(),
  });

  const [form, setForm] = useState({
    provider: 'resend' as 'resend' | 'smtp',
    resendApiKey: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: '',
  });
  const [showKeys, setShowKeys] = useState(false);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: any = { provider: form.provider, fromEmail: form.fromEmail || undefined, fromName: form.fromName || undefined };
      if (form.provider === 'resend') {
        if (form.resendApiKey) payload.resendApiKey = form.resendApiKey;
      } else {
        if (form.smtpHost) payload.smtpHost = form.smtpHost;
        if (form.smtpPort) payload.smtpPort = form.smtpPort;
        if (form.smtpUser) payload.smtpUser = form.smtpUser;
        if (form.smtpPass) payload.smtpPass = form.smtpPass;
      }
      return emailAdminService.updateConfig(payload);
    },
    onSuccess: () => {
      toast.success('Configuración guardada');
      qc.invalidateQueries({ queryKey: ['admin', 'email-status'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const testMut = useMutation({
    mutationFn: () => emailAdminService.test(),
    onSuccess: (r) => {
      if (r.ok) toast.success(`Email de prueba enviado (id: ${r.id ?? '—'})`);
      else toast.error(r.error ?? 'Error al enviar');
    },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy-800">Email transaccional</h1>
        <p className="text-sm text-navy-400 font-body mt-1">
          <Link href="/admin/configuracion" className="text-gold-600">← Volver a configuración</Link>
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm font-body text-amber-900">
          Las claves se guardan cifradas (AES-256-GCM) en la base de datos. Las usamos para enviar emails de verificación, password reset, y notificaciones de pago.
        </div>
      </div>

      {data && (
        <>
          <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-display font-bold text-navy-800">Estado actual</h2>
                <p className="text-sm text-navy-400 font-body mt-1">Provider: <strong>{data.provider}</strong></p>
                <p className="text-sm text-navy-400 font-body">From: <strong>{data.fromName} &lt;{data.fromEmail}&gt;</strong></p>
              </div>
              {data.configured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />Operativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold border border-red-200">
                  <XCircle className="w-3.5 h-3.5" />Sin configurar
                </span>
              )}
            </div>
            {data.resendKeyMasked && <p className="mt-3 text-xs text-navy-500"><strong>Resend API key:</strong> <code className="font-mono">{data.resendKeyMasked}</code></p>}
            {data.smtpHost && <p className="text-xs text-navy-500"><strong>SMTP:</strong> {data.smtpUserMasked} @ {data.smtpHost}:{data.smtpPort}</p>}

            <div className="mt-5 pt-5 border-t border-navy-100/50">
              <button onClick={() => testMut.mutate()} disabled={!data.configured || testMut.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-600 text-white text-sm font-body font-medium hover:bg-navy-700 disabled:opacity-50">
                <Send className="w-4 h-4" />
                {testMut.isPending ? 'Enviando...' : 'Enviar email de prueba'}
              </button>
              <p className="text-xs text-navy-400 mt-1">Llegará a tu email de admin.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-4">Actualizar configuración</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">Provider</label>
                <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800">
                  <option value="resend">Resend (recomendado)</option>
                  <option value="smtp">SMTP genérico</option>
                </select>
              </div>

              {form.provider === 'resend' ? (
                <div>
                  <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">Resend API key</label>
                  <div className="relative">
                    <input type={showKeys ? 'text' : 'password'} value={form.resendApiKey} onChange={(e) => setForm({ ...form, resendApiKey: e.target.value })} placeholder="re_..." className="w-full px-3 py-2 pr-10 rounded-lg border border-navy-200 text-sm font-mono text-navy-800" />
                    <button type="button" onClick={() => setShowKeys((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-400">
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-navy-400 mt-1">Obtén la clave en <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-gold-600">resend.com/api-keys</a>.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">SMTP Host</label>
                      <input value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                    </div>
                    <div>
                      <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">Port</label>
                      <input type="number" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">SMTP user</label>
                    <input value={form.smtpUser} onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">SMTP password</label>
                    <input type={showKeys ? 'text' : 'password'} value={form.smtpPass} onChange={(e) => setForm({ ...form, smtpPass: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">From email</label>
                  <input value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} placeholder="noreply@turidove.com" className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">From name</label>
                  <input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="TuriDove" className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold shadow-sm disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saveMut.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Agregar card en /admin/configuracion**

Localizar el card de "Pasarela de pago" en `frontend/src/app/admin/configuracion/page.tsx` y agregar uno similar JUSTO ABAJO:

```tsx
<Link
  href="/admin/configuracion/email"
  className="block bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all p-5"
>
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center shrink-0">
      <Mail className="w-6 h-6 text-gold-500" />
    </div>
    <div className="flex-1">
      <h3 className="text-base font-display font-bold text-navy-800">Email transaccional</h3>
      <p className="text-sm text-navy-400 font-body mt-0.5">
        Configuración del proveedor de emails (Resend / SMTP).
      </p>
    </div>
    <ChevronRight className="w-5 h-5 text-navy-400 shrink-0" />
  </div>
</Link>
```

Verificar que `Mail` esté importado desde lucide-react (agregar si no).

- [ ] **Step 4: Commit**

```powershell
git add frontend/src/services/email-admin.service.ts frontend/src/app/admin/configuracion/email/ frontend/src/app/admin/configuracion/page.tsx
git commit -m "feat(admin): pagina /admin/configuracion/email + card en configuracion"
```

### Tarea 16: Rebuild + smoke test E.2

- [ ] **Step 1: Rebuild backend + frontend**

```powershell
docker compose --env-file .env.docker build backend frontend
docker compose --env-file .env.docker up -d --force-recreate backend frontend
```
Si el backend no recoge cambios: `build --no-cache backend`.

- [ ] **Step 2: Verificar endpoint status**

```powershell
$T = (Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"admin@turidove.com","password":"Admin123!"}').data.token
Invoke-RestMethod -Uri http://localhost:3002/api/v1/admin/email/status -Headers @{ Authorization = "Bearer $T" }
```
Expected: respuesta JSON con `configured: false` y `provider: none`.

- [ ] **Step 3: Verificar UI**

Abrir http://localhost:3003/admin/configuracion → ver card nuevo "Email transaccional" debajo de "Pasarela de pago". Click → la página `/admin/configuracion/email` carga sin errores.

- [ ] **Step 4: Sin commit. Fin de E.2.**

---

> **Continúa en la siguiente parte del plan...** Las fases E.3 a K.1 se detallan en `2026-06-04-opcion-c-robustez-produccion-part2.md` debido al tamaño del plan completo. La sub-fase actual deja el sistema operativo y el siguiente bloque (TTL de reservas) se basa directamente en la cola `emails` y el `MailService` creado aquí.
