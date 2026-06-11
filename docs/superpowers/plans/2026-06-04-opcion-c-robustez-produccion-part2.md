# Opción C — Parte 2: TTL de reservas + Idempotency + Webhooks tracking

> Continuación de [2026-06-04-opcion-c-robustez-produccion.md](2026-06-04-opcion-c-robustez-produccion.md). Las tareas aquí siguen numeradas en secuencia.

---

## Fase E.3 — TTL de reservas

> Objetivo: las reservas PENDIENTES se cancelan automáticamente a los 15 minutos. Liberación de inventario + email de notificación.

### Tarea 17: Schema Prisma — Reserva.expiresAt

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Localizar bloque `model Reserva`**

```powershell
Select-String -Path backend/prisma/schema.prisma -Pattern "^model Reserva " -Context 0,30
```

- [ ] **Step 2: Agregar campos al modelo Reserva**

Después del último campo (antes del `@@map("reservas")`) agregar:

```prisma
  expiresAt      DateTime? @map("expires_at")
  idempotencyKey String?   @unique @map("idempotency_key")
```

- [ ] **Step 3: Crear migration**

```powershell
$ts = Get-Date -Format "yyyyMMddHHmmss"
$migDir = "backend/prisma/migrations/${ts}_reserva_expires_idempotency"
New-Item -ItemType Directory -Path $migDir -Force | Out-Null
```

Crear `$migDir/migration.sql`:

```sql
ALTER TABLE "reservas"
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "reservas_idempotency_key_key" ON "reservas"("idempotency_key");
```

- [ ] **Step 4: Aplicar**

```powershell
$migName = Split-Path $migDir -Leaf
docker cp backend/prisma/schema.prisma turidove_vk_api:/app/prisma/schema.prisma
docker exec turidove_vk_api sh -c "mkdir -p /app/prisma/migrations/$migName"
docker cp "$migDir/migration.sql" "turidove_vk_api:/app/prisma/migrations/$migName/migration.sql"
docker exec turidove_vk_api npx prisma migrate deploy
docker exec turidove_vk_api npx prisma generate
```

Verificar:
```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "\d reservas" | Select-String "expires_at|idempotency_key"
```
Expected: ambas columnas listadas.

- [ ] **Step 5: Commit**

```powershell
git add backend/prisma/
git commit -m "feat(db): Reserva.expiresAt + idempotencyKey para TTL y anti-duplicados"
```

### Tarea 18: Reserva expiration processor (BullMQ)

**Files:**
- Create: `backend/src/modules/reservas/reserva-expiration.processor.ts`
- Modify: `backend/src/modules/reservas/reservas.module.ts`

- [ ] **Step 1: Crear processor**

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { reservaCanceladaTiempoTemplate } from '../mail/templates/reserva-cancelada-tiempo';

export interface ExpireReservaJob {
  reservaId: string;
}

@Processor('reservas-expirations')
export class ReservaExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservaExpirationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job<ExpireReservaJob>): Promise<{ cancelled: boolean }> {
    const { reservaId } = job.data;

    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { user: true },
    });

    if (!reserva) {
      this.logger.warn(`Reserva ${reservaId} no existe; job ignorado`);
      return { cancelled: false };
    }

    if (reserva.estado !== 'PENDIENTE') {
      this.logger.log(`Reserva ${reservaId} ya no está PENDIENTE (${reserva.estado}); job ignorado`);
      return { cancelled: false };
    }

    if (reserva.expiresAt && reserva.expiresAt > new Date()) {
      this.logger.warn(`Reserva ${reservaId} aún no expira; job se ejecutó antes de tiempo`);
      return { cancelled: false };
    }

    await this.prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: 'CANCELADA' },
    });

    this.logger.log(`Reserva ${reservaId} cancelada por TTL`);

    if (reserva.user?.email) {
      const nombre = `${reserva.user.nombre ?? ''} ${reserva.user.apellido ?? ''}`.trim() || 'cliente';
      const email = reservaCanceladaTiempoTemplate({ nombre, codigo: reserva.codigo });
      await this.mail.send(reserva.user.email, email, 'reserva-cancelada-tiempo');
    }

    return { cancelled: true };
  }
}
```

- [ ] **Step 2: Registrar en ReservasModule**

Leer `backend/src/modules/reservas/reservas.module.ts` y agregar:

```ts
import { BullModule } from '@nestjs/bullmq';
import { ReservaExpirationProcessor } from './reserva-expiration.processor';
```

En `imports:`:
```ts
BullModule.registerQueue({ name: 'reservas-expirations' }),
```

En `providers:`:
```ts
ReservaExpirationProcessor,
```

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/reservas/
git commit -m "feat(reservas): ReservaExpirationProcessor cancela PENDIENTES vencidas y notifica"
```

### Tarea 19: ReservasService — setear expiresAt + encolar job

**Files:**
- Modify: `backend/src/modules/reservas/reservas.service.ts`

- [ ] **Step 1: Inspeccionar el método de creación**

```powershell
Select-String -Path backend/src/modules/reservas/reservas.service.ts -Pattern "async create" -Context 0,20
```

- [ ] **Step 2: Agregar inyección de la cola al constructor**

Imports nuevos al top:
```ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
```

Modificar el constructor para inyectar la cola (`@InjectQueue('reservas-expirations') private readonly expirationsQueue: Queue,`).

- [ ] **Step 3: En el método `create` (o el equivalente que crea la reserva PENDIENTE)**

Antes del `return`, después de crear la reserva con Prisma:

```ts
const ttlMinutes = parseInt(process.env.RESERVA_TTL_MINUTES ?? '15', 10);
const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

await this.prisma.reserva.update({
  where: { id: reserva.id },
  data: { expiresAt },
});

await this.expirationsQueue.add(
  'expire-reserva',
  { reservaId: reserva.id },
  { delay: ttlMinutes * 60_000, jobId: `expire-${reserva.id}` },
);
```

> Nota: `jobId: 'expire-{id}'` evita duplicados si la lógica de creación se reintenta (BullMQ deduplica por jobId).

- [ ] **Step 4: Commit**

```powershell
git add backend/src/modules/reservas/reservas.service.ts
git commit -m "feat(reservas): TTL 15min — expiresAt + job BullMQ con jobId estable"
```

### Tarea 20: Rebuild + smoke test TTL

- [ ] **Step 1: Rebuild backend**

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d --force-recreate backend
```

- [ ] **Step 2: Verificar que BullMQ tomó la cola**

```powershell
docker logs turidove_vk_api --tail 30 | Select-String "reservas-expirations|EmailSendProcessor|ReservaExpirationProcessor"
```
Expected: ambos processors registrados.

- [ ] **Step 3: Test rápido de TTL (delay corto para no esperar 15 min)**

Temporalmente cambiar `RESERVA_TTL_MINUTES=0` (vía override en `.env.docker`) NO se hace porque setting global. Mejor: validar que la cola tiene el job encolado tras crear una reserva.

Crear reserva de prueba (usar el flujo normal del frontend o un curl), luego inspeccionar Redis:

```powershell
docker exec turidove_vk_redis redis-cli KEYS "bull:reservas-expirations:*"
```
Expected: keys con `delayed` o `wait`. Si vemos `bull:reservas-expirations:delayed`, la cola está funcionando.

- [ ] **Step 4: Sin commit. Fin de E.3.**

---

## Fase E.4 — Idempotency + tracking de webhooks fallidos

> Objetivo: doble-click en "Pagar" no crea sessions duplicadas. Webhooks fallidos quedan registrados con error y son reintentables desde admin.

### Tarea 21: Schema — StripeEvent ampliado

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Localizar `model StripeEvent`**

```powershell
Select-String -Path backend/prisma/schema.prisma -Pattern "^model StripeEvent" -Context 0,15
```

- [ ] **Step 2: Agregar campos**

Dentro del modelo, antes del último `@@map`:

```prisma
  processedSuccessfully Boolean  @default(true) @map("processed_successfully")
  errorMessage          String?  @map("error_message")
  retries               Int      @default(0)
```

Y agregar índice:
```prisma
  @@index([processedSuccessfully])
```

- [ ] **Step 3: Crear migration**

```powershell
$ts = Get-Date -Format "yyyyMMddHHmmss"
$migDir = "backend/prisma/migrations/${ts}_stripe_event_tracking"
New-Item -ItemType Directory -Path $migDir -Force | Out-Null
```

Crear `$migDir/migration.sql`:

```sql
ALTER TABLE "stripe_events"
  ADD COLUMN "processed_successfully" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "error_message" TEXT,
  ADD COLUMN "retries" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "stripe_events_processed_successfully_idx" ON "stripe_events"("processed_successfully");
```

- [ ] **Step 4: Aplicar**

```powershell
$migName = Split-Path $migDir -Leaf
docker cp backend/prisma/schema.prisma turidove_vk_api:/app/prisma/schema.prisma
docker exec turidove_vk_api sh -c "mkdir -p /app/prisma/migrations/$migName"
docker cp "$migDir/migration.sql" "turidove_vk_api:/app/prisma/migrations/$migName/migration.sql"
docker exec turidove_vk_api npx prisma migrate deploy
docker exec turidove_vk_api npx prisma generate
```

Verificar:
```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "\d stripe_events" | Select-String "processed_successfully|error_message|retries"
```

- [ ] **Step 5: Commit**

```powershell
git add backend/prisma/
git commit -m "feat(db): StripeEvent.processedSuccessfully + errorMessage + retries"
```

### Tarea 22: Idempotency en checkout

**Files:**
- Modify: `backend/src/modules/stripe/stripe.service.ts:212-228`
- Modify: `backend/src/modules/pagos/pagos.service.ts`

- [ ] **Step 1: Aceptar idempotencyKey en stripeService.createCheckoutSession**

Modificar la firma para incluir `idempotencyKey?: string`:

```ts
async createCheckoutSession(params: {
  reservaId: string;
  amount: number;
  description?: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey?: string;
}): Promise<{ url: string; sessionId: string }> {
  const cfg = this.cachedConfig;
  if (!cfg || !cfg.secretKey || cfg.secretKey.includes('placeholder') || cfg.secretKey.includes('REPLACE_ME')) {
    throw new ServiceUnavailableException(
      'La pasarela de pago no está configurada. Un administrador debe configurarla en /admin/configuracion/pasarela.',
    );
  }

  const session = await this.stripe.checkout.sessions.create(
    {
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
    },
    params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined,
  );
  if (!session.url) throw new Error('Stripe devolvio session sin URL');
  return { url: session.url, sessionId: session.id };
}
```

- [ ] **Step 2: En pagos.service.ts, generar/pasar idempotency-key**

Localizar el método que invoca `stripe.createCheckoutSession` (probablemente en un método como `crearCheckout(reservaId)`):

```powershell
Select-String -Path backend/src/modules/pagos/pagos.service.ts -Pattern "createCheckoutSession" -Context 5,5
```

Antes de la llamada, generar/recuperar la idempotency key. Persistirla en la reserva la primera vez para que un reintento devuelva la misma session:

```ts
// Antes de createCheckoutSession:
const reserva = await this.prisma.reserva.findUnique({ where: { id: reservaId } });
if (!reserva) throw new NotFoundException('Reserva no existe');

if (reserva.expiresAt && reserva.expiresAt < new Date()) {
  throw new BadRequestException('La reserva expiró. Crea una nueva.');
}

let idempotencyKey = reserva.idempotencyKey;
if (!idempotencyKey) {
  idempotencyKey = `reserva-${reservaId}-${Date.now()}`;
  await this.prisma.reserva.update({
    where: { id: reservaId },
    data: { idempotencyKey },
  });
}

const session = await this.stripeService.createCheckoutSession({
  reservaId,
  amount: Number(reserva.total),
  description: `Reserva ${reserva.codigo}`,
  successUrl: process.env.STRIPE_SUCCESS_URL ?? '',
  cancelUrl: process.env.STRIPE_CANCEL_URL ?? '',
  idempotencyKey,
});
```

Asegurar imports de `BadRequestException`, `NotFoundException` si faltan.

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/stripe/stripe.service.ts backend/src/modules/pagos/pagos.service.ts
git commit -m "feat(pagos): idempotencyKey en checkout — evita sessions duplicadas + valida expiresAt"
```

### Tarea 23: Tracking de webhooks fallidos

**Files:**
- Modify: `backend/src/modules/pagos/pagos.service.ts` (handler de webhook)

- [ ] **Step 1: Localizar el handler de webhook**

```powershell
Select-String -Path backend/src/modules/pagos/pagos.service.ts -Pattern "handleWebhook|processWebhook|StripeEvent" -Context 3,3
```

- [ ] **Step 2: Envolver el procesamiento en try/catch que registre fallos**

El patrón actual probablemente crea un `stripe_events` row sólo en éxito. Cambiar a:

```ts
async handleWebhookEvent(event: any): Promise<void> {
  const existing = await this.prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing && existing.processedSuccessfully) {
    this.logger.log(`Evento ${event.id} ya procesado; ignorado (idempotencia)`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.processCheckoutCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await this.processCheckoutExpired(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.processPaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.processChargeRefunded(event.data.object);
        break;
      default:
        this.logger.warn(`Evento Stripe sin handler: ${event.type}`);
    }

    await this.prisma.stripeEvent.upsert({
      where: { stripeEventId: event.id },
      update: { processedSuccessfully: true, errorMessage: null, retries: { increment: 0 } },
      create: {
        stripeEventId: event.id,
        type: event.type,
        processedSuccessfully: true,
        payload: event as any,
      },
    });
  } catch (e: any) {
    const msg = e?.message ?? 'Error procesando webhook';
    this.logger.error(`Webhook ${event.id} (${event.type}) falló: ${msg}`);

    await this.prisma.stripeEvent.upsert({
      where: { stripeEventId: event.id },
      update: { processedSuccessfully: false, errorMessage: msg, retries: { increment: 1 } },
      create: {
        stripeEventId: event.id,
        type: event.type,
        processedSuccessfully: false,
        errorMessage: msg,
        retries: 1,
        payload: event as any,
      },
    });
    throw e; // dejar que Stripe reintente
  }
}
```

> Adaptar los nombres de métodos privados (`processCheckoutCompleted`, etc.) a los que existan realmente en el archivo. Si los handlers están inline en el switch, mantenerlos pero envueltos en el try.

- [ ] **Step 3: Hookear emails de éxito/fallo/reembolso**

Dentro de `processCheckoutCompleted` (o equivalente), tras actualizar el Pago a COMPLETADO y la Reserva a CONFIRMADA:

```ts
const reserva = await this.prisma.reserva.findUnique({
  where: { id: pago.reservaId },
  include: { user: true },
});
if (reserva?.user?.email) {
  const nombre = `${reserva.user.nombre ?? ''} ${reserva.user.apellido ?? ''}`.trim() || 'cliente';
  const email = reservaConfirmadaTemplate({
    nombre,
    codigo: reserva.codigo,
    total: String(reserva.total),
    moneda: 'USD',
  });
  await this.mail.send(reserva.user.email, email, 'reserva-confirmada');
}
```

Similar para `processPaymentFailed` (con `pagoFallidoTemplate`) y `processChargeRefunded` (con `reembolsoProcesadoTemplate`).

Imports necesarios:
```ts
import { reservaConfirmadaTemplate } from '../mail/templates/reserva-confirmada';
import { pagoFallidoTemplate } from '../mail/templates/pago-fallido';
import { reembolsoProcesadoTemplate } from '../mail/templates/reembolso-procesado';
import { MailService } from '../mail/mail.service';
```

Inyectar `MailService` en el constructor del PagosService (`private readonly mail: MailService`).

- [ ] **Step 4: Commit**

```powershell
git add backend/src/modules/pagos/pagos.service.ts
git commit -m "feat(pagos): tracking de webhooks fallidos (processedSuccessfully+error+retries) + emails transaccionales"
```

### Tarea 24: Endpoints admin para webhooks fallidos

**Files:**
- Create: `backend/src/modules/sistema/sistema.module.ts`
- Create: `backend/src/modules/sistema/sistema.controller.ts`
- Create: `backend/src/modules/sistema/sistema.service.ts`

- [ ] **Step 1: Crear sistema.service.ts**

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PagosService } from '../pagos/pagos.service';

@Injectable()
export class SistemaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagos: PagosService,
  ) {}

  async listStripeEvents(filter: { status?: 'all' | 'failed' | 'ok'; type?: string; limit?: number }) {
    const where: any = {};
    if (filter.status === 'failed') where.processedSuccessfully = false;
    if (filter.status === 'ok') where.processedSuccessfully = true;
    if (filter.type) where.type = filter.type;

    return this.prisma.stripeEvent.findMany({
      where,
      orderBy: { processedAt: 'desc' },
      take: filter.limit ?? 100,
    });
  }

  async retryStripeEvent(eventId: string) {
    const ev = await this.prisma.stripeEvent.findUnique({ where: { id: eventId } });
    if (!ev) throw new Error('Evento no existe');
    await this.pagos.handleWebhookEvent(ev.payload as any);
    return { ok: true };
  }

  async listEmailLogs(filter: { status?: 'sent' | 'failed' | 'all'; limit?: number }) {
    const where: any = {};
    if (filter.status === 'sent') where.status = 'sent';
    if (filter.status === 'failed') where.status = 'failed';

    return this.prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 100,
    });
  }
}
```

- [ ] **Step 2: Crear sistema.controller.ts**

```ts
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SistemaService } from './sistema.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('admin/system')
@Controller('admin/system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SistemaController {
  constructor(private readonly sistema: SistemaService) {}

  @Get('stripe-events')
  listStripeEvents(@Query('status') status?: 'all' | 'failed' | 'ok', @Query('type') type?: string) {
    return this.sistema.listStripeEvents({ status, type });
  }

  @Post('stripe-events/:id/retry')
  retry(@Param('id') id: string) {
    return this.sistema.retryStripeEvent(id);
  }

  @Get('email-logs')
  listEmailLogs(@Query('status') status?: 'sent' | 'failed' | 'all') {
    return this.sistema.listEmailLogs({ status });
  }
}
```

- [ ] **Step 3: Crear sistema.module.ts**

```ts
import { Module, forwardRef } from '@nestjs/common';
import { SistemaController } from './sistema.controller';
import { SistemaService } from './sistema.service';
import { PagosModule } from '../pagos/pagos.module';

@Module({
  imports: [forwardRef(() => PagosModule)],
  controllers: [SistemaController],
  providers: [SistemaService],
  exports: [SistemaService],
})
export class SistemaModule {}
```

- [ ] **Step 4: Asegurar que PagosService es exportable**

Revisar `backend/src/modules/pagos/pagos.module.ts` y agregar `PagosService` a `exports:` si no está.

- [ ] **Step 5: Registrar SistemaModule en app.module.ts**

```ts
import { SistemaModule } from './modules/sistema/sistema.module';
```
Y `SistemaModule,` al array `imports:`.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/modules/sistema/ backend/src/modules/pagos/pagos.module.ts backend/src/app.module.ts
git commit -m "feat(admin): SistemaModule con listar stripe events + retry + listar email logs"
```

### Tarea 25: Rebuild + smoke test E.4

- [ ] **Step 1: Rebuild backend**

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d --force-recreate backend
```

- [ ] **Step 2: Test endpoints admin**

```powershell
$T = (Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"admin@turidove.com","password":"Admin123!"}').data.token
Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/system/stripe-events?status=all" -Headers @{ Authorization = "Bearer $T" }
```
Expected: array (puede ser vacío si no hay eventos).

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/system/email-logs?status=all" -Headers @{ Authorization = "Bearer $T" }
```
Expected: array.

- [ ] **Step 3: Sin commit. Fin de E.4 y fin del bloque E.**

---

**Siguiente:** [Parte 3 — Fase D (Auth)](2026-06-04-opcion-c-robustez-produccion-part3.md)
