# Opción C — Plan completo (índice)

> **Spec:** [docs/superpowers/specs/2026-06-04-opcion-c-robustez-produccion-design.md](../specs/2026-06-04-opcion-c-robustez-produccion-design.md)
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o superpowers:executing-plans para implementar tarea por tarea. Steps usan `- [ ]` para tracking.

**Goal:** llevar TuriDove de MVP a plataforma robusta para producción agregando emails transaccionales, TTL automático de reservas, verify email + password reset + refresh token rotation, rate limiting, Helmet + CSP, y dashboard admin de sistema.

**Estimación:** 3-5 semanas de trabajo. 46 tareas distribuidas en 5 archivos.

## Lectura ordenada

| Archivo | Fase | Tareas | Contenido |
|---|---|---|---|
| [Parte 1](2026-06-04-opcion-c-robustez-produccion.md) | **E.1 + E.2** | 1–16 | Redis + BullMQ + Pino + Helmet + Throttler base; Resend integration + MailService + 8 plantillas + página admin email |
| [Parte 2](2026-06-04-opcion-c-robustez-produccion-part2.md) | **E.3 + E.4** | 17–25 | TTL de reservas (cancelación automática + email); Idempotency en checkout; tracking de webhooks fallidos; endpoints admin de sistema |
| [Parte 3](2026-06-04-opcion-c-robustez-produccion-part3.md) | **D.1 + D.2** | 26–33 | Verify email obligatorio (registro dispara + login bloquea); Password reset + change password + UI |
| [Parte 4](2026-06-04-opcion-c-robustez-produccion-part4.md) | **D.3 + D.4** | 34–40 | Refresh token con rotación familiar + detección de reuso; Rate limit por endpoint; CSP polish |
| [Parte 5](2026-06-04-opcion-c-robustez-produccion-part5.md) | **K.1 + cierre** | 41–46 | Health check enriquecido; Dashboard `/admin/sistema`; Smoke test integral |

## Orden de ejecución estricto

Las fases tienen dependencias hard. Respetar el orden:

```
E.1 (Infra base)
  ↓
E.2 (Mail)
  ↓
E.3 (TTL reservas)   ← usa Mail
  ↓
E.4 (Webhooks)       ← usa Mail + StripeEvent ampliado
  ↓
D.1 (Verify email)   ← usa Mail
  ↓
D.2 (Password reset) ← usa Mail
  ↓
D.3 (Refresh tokens)
  ↓
D.4 (Rate limit endpoint-level)
  ↓
K.1 (Observabilidad) ← usa todo lo anterior
```

## Decisiones tomadas

1. **Workers:** BullMQ + Redis (contenedor `turidove_vk_redis`).
2. **Email provider:** Resend (con fallback SMTP en el modelo).
3. **Verify email:** obligatorio. Users existentes auto-verificados en la migración.
4. **Logger:** nestjs-pino con pino-pretty en dev.
5. **Rate limiting:** @nestjs/throttler con storage Redis.
6. **TTL reservas:** 15 min (configurable por env).
7. **Plantillas:** HTML responsive table-layout + texto plano. Inline CSS.

## Recordatorios para el ejecutor

- **Working directory:** `c:\ServBay\www\TuriDove_VK`
- **Docker corriendo.** Backend puerto 3002, frontend 3003.
- **Build cache bug conocido:** si el backend no recoge cambios, usar `build --no-cache backend`.
- **Migraciones Prisma:** crear manualmente el `migration.sql`, `docker cp` + `prisma migrate deploy` + `prisma generate`.
- **Commits en español**, formato convencional.
- **NO push automático** — el usuario decide al final con la Tarea 46.6.

## Criterios de éxito (resumen del spec)

- ✅ Reserva PENDIENTE sin pagar en 15 min se cancela automáticamente.
- ✅ Cliente recibe email cuando: registra, verifica, cambia password, reserva expira/confirma, pago falla, reembolso procesa.
- ✅ Doble-click en "Pagar" no crea 2 sessions de Stripe.
- ✅ Webhook fallido se reintenta + aparece en `/admin/sistema`.
- ✅ Login bloqueado si email sin verificar.
- ✅ Refresh token reusado revoca toda la familia.
- ✅ 6º intento de login en 60s → 429.
- ✅ `/health` muestra todos los servicios en verde.
- ✅ `/admin/sistema` accesible con datos en vivo.
