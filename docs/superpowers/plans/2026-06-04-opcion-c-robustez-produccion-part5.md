# Opción C — Parte 5: Observabilidad (K.1)

> Continuación. Numeración sigue desde Parte 4.

---

## Fase K.1 — Health check + Dashboard admin de sistema

> Objetivo: endpoint `/health` enriquecido con todos los servicios, dashboard `/admin/sistema` con estado en vivo + lista de webhooks Stripe + lista de email logs con retry.

### Tarea 41: HealthModule + endpoint /health

**Files:**
- Create: `backend/src/modules/health/health.module.ts`
- Create: `backend/src/modules/health/health.controller.ts`
- Create: `backend/src/modules/health/health.service.ts`

- [ ] **Step 1: HealthService**

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../stripe/stripe.service';
import { MailService } from '../mail/mail.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly stripe: StripeService,
    private readonly mail: MailService,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    @InjectQueue('reservas-expirations') private readonly reservasQueue: Queue,
  ) {}

  async check() {
    const start = Date.now();

    const [dbCheck, redisCheck, stripeStatus, emailStatus, emailsCounts, reservasCounts] =
      await Promise.allSettled([
        this.pingDb(),
        this.redis.ping(),
        this.stripe.getStatus(),
        this.mail.getStatus(),
        this.emailsQueue.getJobCounts('active', 'waiting', 'failed', 'completed'),
        this.reservasQueue.getJobCounts('active', 'waiting', 'failed', 'completed', 'delayed'),
      ]);

    const checks = {
      database: this.unwrap(dbCheck, { ok: false, latencyMs: -1 }),
      redis: this.unwrap(redisCheck, { ok: false, latencyMs: -1 }),
      stripe: this.unwrap(stripeStatus, null),
      email: this.unwrap(emailStatus, null),
      queues: {
        emails: this.unwrap(emailsCounts, {}),
        'reservas-expirations': this.unwrap(reservasCounts, {}),
      },
    };

    const allOk =
      checks.database.ok &&
      checks.redis.ok;
    // Stripe y email pueden estar "configurado=false" sin ser unhealthy del sistema base.

    return {
      status: allOk ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
      totalLatencyMs: Date.now() - start,
      checks,
    };
  }

  private async pingDb(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }

  private unwrap<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }
}
```

- [ ] **Step 2: HealthController**

```ts
import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health')
  async getHealth(@Res() res: Response) {
    const r = await this.health.check();
    res.status(r.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(r);
  }
}
```

- [ ] **Step 3: HealthModule**

```ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'emails' }),
    BullModule.registerQueue({ name: 'reservas-expirations' }),
    StripeModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

(StripeService debe estar exportado en su módulo. Si no lo está, agregarlo a `exports:` de `stripe.module.ts`.)

- [ ] **Step 4: Registrar en app.module.ts**

```ts
import { HealthModule } from './modules/health/health.module';
```
Y al array `imports:` agregar `HealthModule,`.

Para que `/health` NO tenga el prefix `/api/v1` global, una opción es excluirlo en `main.ts`. Buscar `setGlobalPrefix` en main.ts y modificar:

```ts
app.setGlobalPrefix('api/v1', { exclude: [{ path: 'health', method: RequestMethod.GET }] });
```

Imports al top de main.ts:
```ts
import { RequestMethod } from '@nestjs/common';
```

Así `/health` queda en la raíz para load balancers / docker healthchecks.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/modules/health/ backend/src/main.ts backend/src/app.module.ts backend/src/modules/stripe/stripe.module.ts
git commit -m "feat(observability): /health endpoint con check de DB+Redis+Stripe+Email+queues"
```

### Tarea 42: Smoke test /health

- [ ] **Step 1: Rebuild + recreate**

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d --force-recreate backend
```

- [ ] **Step 2: Probar el endpoint**

```powershell
Invoke-RestMethod -Uri http://localhost:3002/health | ConvertTo-Json -Depth 6
```
Expected: JSON con `status: ok`, `checks.database.ok: true`, `checks.redis.ok: true`, `checks.queues.*` con counts.

- [ ] **Step 3: Probar shutdown de redis**

```powershell
docker stop turidove_vk_redis
Start-Sleep -Seconds 2
try { Invoke-RestMethod -Uri http://localhost:3002/health } catch { $_.Exception.Response.StatusCode; $_.ErrorDetails.Message }
docker start turidove_vk_redis
```
Expected: 503 con `checks.redis.ok: false`. Tras restart vuelve a 200.

- [ ] **Step 4: Sin commit. Fin del setup de /health.**

### Tarea 43: Frontend service para /admin/sistema

**Files:**
- Create: `frontend/src/services/sistema.service.ts`

- [ ] **Step 1: Service**

```ts
import { api } from '@/lib/axios';

export interface SystemHealth {
  status: 'ok' | 'degraded';
  version: string;
  uptimeSeconds: number;
  checkedAt: string;
  totalLatencyMs: number;
  checks: {
    database: { ok: boolean; latencyMs: number };
    redis: { ok: boolean; latencyMs: number };
    stripe: any;
    email: any;
    queues: Record<string, Record<string, number>>;
  };
}

export interface StripeEventRow {
  id: string;
  stripeEventId: string;
  type: string;
  processedAt: string;
  processedSuccessfully: boolean;
  errorMessage: string | null;
  retries: number;
}

export interface EmailLogRow {
  id: string;
  toEmail: string;
  subject: string;
  template: string;
  status: 'sent' | 'failed';
  errorMsg: string | null;
  providerId: string | null;
  createdAt: string;
}

export const sistemaService = {
  async getHealth(): Promise<SystemHealth> {
    // health vive fuera del prefix; usar URL absoluta
    const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1').replace('/api/v1', '');
    const r = await fetch(`${base}/health`);
    return r.json();
  },

  async listStripeEvents(status: 'all' | 'failed' | 'ok' = 'all'): Promise<StripeEventRow[]> {
    const { data } = await api.get('/admin/system/stripe-events', { params: { status } });
    return data;
  },

  async retryStripeEvent(id: string): Promise<{ ok: boolean }> {
    const { data } = await api.post(`/admin/system/stripe-events/${id}/retry`);
    return data;
  },

  async listEmailLogs(status: 'all' | 'sent' | 'failed' = 'all'): Promise<EmailLogRow[]> {
    const { data } = await api.get('/admin/system/email-logs', { params: { status } });
    return data;
  },
};
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/services/sistema.service.ts
git commit -m "feat(frontend): sistema.service con health, stripe events list/retry, email logs"
```

### Tarea 44: Pagina /admin/sistema

**Files:**
- Create: `frontend/src/app/admin/sistema/page.tsx`
- Modify: `frontend/src/components/shared/sidebar-nav.tsx`

- [ ] **Step 1: Pagina**

```tsx
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, RefreshCcw, Activity, Database, Server, Mail, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sistemaService } from '@/services/sistema.service';
import { PageHeader } from '@/components/shared/page-header';

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-xs font-semibold border border-green-200">
      <CheckCircle2 className="w-3 h-3" />OK
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2.5 py-0.5 text-xs font-semibold border border-red-200">
      <XCircle className="w-3 h-3" />Falla
    </span>
  );
}

export default function SistemaPage() {
  const qc = useQueryClient();
  const [eventStatus, setEventStatus] = useState<'all' | 'failed' | 'ok'>('failed');
  const [emailStatus, setEmailStatus] = useState<'all' | 'sent' | 'failed'>('all');

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['sistema', 'health'],
    queryFn: () => sistemaService.getHealth(),
    refetchInterval: 15_000,
  });

  const { data: events } = useQuery({
    queryKey: ['sistema', 'stripe-events', eventStatus],
    queryFn: () => sistemaService.listStripeEvents(eventStatus),
  });

  const { data: emails } = useQuery({
    queryKey: ['sistema', 'email-logs', emailStatus],
    queryFn: () => sistemaService.listEmailLogs(emailStatus),
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => sistemaService.retryStripeEvent(id),
    onSuccess: () => {
      toast.success('Evento reintentado');
      qc.invalidateQueries({ queryKey: ['sistema', 'stripe-events'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al reintentar'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Sistema" description="Estado de servicios + webhooks Stripe + emails" />

      {/* Tarjetas de salud */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard icon={Database} label="Base de datos" ok={health?.checks.database.ok ?? false} subtitle={`${health?.checks.database.latencyMs ?? '—'}ms`} />
        <HealthCard icon={Server} label="Redis" ok={health?.checks.redis.ok ?? false} subtitle={`${health?.checks.redis.latencyMs ?? '—'}ms`} />
        <HealthCard icon={CreditCard} label="Stripe" ok={health?.checks.stripe?.configured ?? false} subtitle={health?.checks.stripe?.mode ?? '—'} />
        <HealthCard icon={Mail} label="Email" ok={health?.checks.email?.configured ?? false} subtitle={health?.checks.email?.provider ?? '—'} />
      </div>

      {/* Colas */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h2 className="flex items-center gap-2 text-base font-display font-bold text-navy-800 mb-4">
          <Activity className="w-5 h-5 text-gold-500" />Colas BullMQ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {health?.checks.queues && Object.entries(health.checks.queues).map(([name, counts]) => (
            <div key={name} className="border border-navy-100/50 rounded-xl p-4">
              <p className="text-sm font-display font-semibold text-navy-800">{name}</p>
              <div className="mt-2 grid grid-cols-5 gap-2 text-xs font-body text-navy-500">
                {['waiting', 'active', 'delayed', 'completed', 'failed'].map((k) => (
                  <div key={k} className="text-center">
                    <div className={`text-base font-bold ${k === 'failed' && (counts[k] ?? 0) > 0 ? 'text-red-600' : 'text-navy-700'}`}>{counts[k] ?? 0}</div>
                    <div className="capitalize">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-navy-400">
          <span><Clock className="inline w-3 h-3 mr-1" />Uptime: {Math.floor((health?.uptimeSeconds ?? 0) / 60)} min</span>
          <button onClick={() => refetchHealth()} className="inline-flex items-center gap-1 text-gold-600 hover:underline">
            <RefreshCcw className="w-3 h-3" />Actualizar
          </button>
        </div>
      </div>

      {/* Webhooks Stripe */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-display font-bold text-navy-800">
            <CreditCard className="w-5 h-5 text-gold-500" />Webhooks Stripe
          </h2>
          <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value as any)} className="text-xs border border-navy-200 rounded-lg px-2 py-1">
            <option value="failed">Solo fallidos</option>
            <option value="ok">Solo exitosos</option>
            <option value="all">Todos</option>
          </select>
        </div>
        {events && events.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="text-navy-400 text-left">
              <tr><th className="py-1.5">Tipo</th><th>Stripe Event ID</th><th>Procesado</th><th>Estado</th><th>Reintentos</th><th></th></tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-navy-100/40">
                  <td className="py-1.5 font-body text-navy-700">{ev.type}</td>
                  <td className="font-mono text-navy-500">{ev.stripeEventId.slice(0, 18)}...</td>
                  <td className="text-navy-500">{new Date(ev.processedAt).toLocaleString('es-PA')}</td>
                  <td>
                    {ev.processedSuccessfully ? (
                      <span className="text-green-700">OK</span>
                    ) : (
                      <span title={ev.errorMessage ?? ''} className="text-red-700">FALLO</span>
                    )}
                  </td>
                  <td className="text-navy-500">{ev.retries}</td>
                  <td>
                    {!ev.processedSuccessfully && (
                      <button
                        onClick={() => retryMut.mutate(ev.id)}
                        disabled={retryMut.isPending}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                      >
                        <RefreshCcw className="w-3 h-3" />Reintentar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-navy-400 font-body italic">Sin eventos en este filtro.</p>
        )}
      </div>

      {/* Email logs */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-display font-bold text-navy-800">
            <Mail className="w-5 h-5 text-gold-500" />Emails recientes
          </h2>
          <select value={emailStatus} onChange={(e) => setEmailStatus(e.target.value as any)} className="text-xs border border-navy-200 rounded-lg px-2 py-1">
            <option value="all">Todos</option>
            <option value="sent">Solo enviados</option>
            <option value="failed">Solo fallidos</option>
          </select>
        </div>
        {emails && emails.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="text-navy-400 text-left">
              <tr><th className="py-1.5">Plantilla</th><th>Para</th><th>Asunto</th><th>Estado</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {emails.slice(0, 50).map((em) => (
                <tr key={em.id} className="border-t border-navy-100/40">
                  <td className="py-1.5 font-body text-navy-700">{em.template}</td>
                  <td className="font-mono text-navy-500">{em.toEmail}</td>
                  <td className="text-navy-700">{em.subject}</td>
                  <td>
                    {em.status === 'sent' ? (
                      <span className="text-green-700">SENT</span>
                    ) : (
                      <span title={em.errorMsg ?? ''} className="text-red-700">FAIL</span>
                    )}
                  </td>
                  <td className="text-navy-500">{new Date(em.createdAt).toLocaleString('es-PA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-navy-400 font-body italic">Sin emails en este filtro.</p>
        )}
      </div>
    </div>
  );
}

function HealthCard({ icon: Icon, label, ok, subtitle }: { icon: any; label: string; ok: boolean; subtitle?: string }) {
  return (
    <div className={`rounded-2xl shadow-card p-4 border ${ok ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${ok ? 'text-green-600' : 'text-red-600'}`} />
        {ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
      </div>
      <p className="mt-2 text-sm font-display font-semibold text-navy-800">{label}</p>
      <p className="text-xs text-navy-400 font-body">{subtitle ?? ''}</p>
    </div>
  );
}
```

- [ ] **Step 2: Agregar item en sidebar admin**

Inspeccionar primero la estructura del sidebar:
```powershell
Select-String -Path frontend/src/components/shared/sidebar-nav.tsx -Pattern "admin|Configuracion|Auditoria" -Context 0,3 | Select-Object -First 30
```

Localizar el array de items del sidebar admin y agregar antes de "Auditoria" (o como último item):

```tsx
{ href: '/admin/sistema', label: 'Sistema', icon: Activity },
```

Importar `Activity` de lucide-react al top.

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/app/admin/sistema/ frontend/src/components/shared/sidebar-nav.tsx
git commit -m "feat(admin): pagina /admin/sistema con health, colas, webhooks Stripe (retry) y emails"
```

### Tarea 45: Rebuild + smoke test K.1

- [ ] **Step 1: Rebuild frontend + backend**

```powershell
docker compose --env-file .env.docker build frontend backend
docker compose --env-file .env.docker up -d --force-recreate frontend backend
```

- [ ] **Step 2: Login admin y navegar a /admin/sistema**

Abrir http://localhost:3003/admin/sistema. Expected:
- 4 tarjetas de health (DB, Redis, Stripe, Email) en verde o rojo según config.
- Bloque de colas BullMQ con counts.
- Tabla de webhooks Stripe (vacía si no hay fallidos, filtro por defecto "Solo fallidos").
- Tabla de emails recientes.

- [ ] **Step 3: Simular un webhook fallido manualmente (opcional)**

Crear row directo en BD:
```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "INSERT INTO stripe_events (id, stripe_event_id, type, processed_at, processed_successfully, error_message, retries, payload) VALUES (gen_random_uuid(), 'evt_test_fake_001', 'checkout.session.completed', NOW(), false, 'Test error simulado', 1, '{}'::jsonb);"
```

Refrescar /admin/sistema → ver row con botón "Reintentar". Click → debe mostrar toast (puede fallar el retry porque el payload está vacío, pero el endpoint se ejecutó).

- [ ] **Step 4: Sin commit. Fin de K.1 y fin del plan.**

---

## Cierre — verificación end-to-end

### Tarea 46: Smoke test integral

- [ ] **Step 1: Configurar Resend (manual)**

Login como admin → /admin/configuracion/email → pegar Resend API key (`re_...`) + from email + from name → Guardar → "Enviar email de prueba". Debe llegar a la inbox del admin.

- [ ] **Step 2: Registrar un usuario nuevo y validar flujo verify**

```powershell
Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/register -Method Post -ContentType 'application/json' -Body '{"email":"<TU_EMAIL_REAL>","password":"Test1234!","nombre":"Test","apellido":"User"}'
```

Debe llegar email "Confirma tu cuenta". Click → /verify-email/<token> auto-verifica.

- [ ] **Step 3: Hacer una reserva test, no pagar, esperar 15 min**

Después de 15 min, la reserva debe quedar CANCELADA y el cliente debe haber recibido email "Tu reserva expiró".

Verificar:
```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT id, estado, expires_at FROM reservas ORDER BY created_at DESC LIMIT 3;"
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT template, to_email, status FROM email_logs ORDER BY created_at DESC LIMIT 5;"
```

- [ ] **Step 4: Hacer una reserva y pagar — verificar email "reserva confirmada"**

Después del pago exitoso, el cliente debe recibir email con `reserva-confirmada`.

- [ ] **Step 5: Reembolso desde admin — verificar email "reembolso procesado"**

Después del reembolso, el cliente debe recibir email `reembolso-procesado`.

- [ ] **Step 6: Push al remote (cuando el usuario apruebe)**

```powershell
git log origin/main..HEAD --oneline | Measure-Object -Line
git push origin main
```

---

## Fin del plan

Todas las fases (E.1 - E.4, D.1 - D.4, K.1) están cubiertas en las 46 tareas distribuidas en este archivo y los 4 anteriores.
