# Stripe — Activación de la pasarela

> El módulo Stripe Checkout ya está implementado (módulo `stripe`, endpoints `/pagos/checkout/:reservaId` y `/pagos/webhook`, idempotencia por `StripeEvent`, reembolsos vía API).
> Este documento explica qué hacer para activarlo con tu cuenta Stripe en modo test.

---

## 1. Cuenta Stripe (5 min)

1. Registra tu cuenta en https://stripe.com/register (gratis).
2. Confirma el email y entra al [Dashboard](https://dashboard.stripe.com).
3. **Asegúrate de estar en modo Test** (toggle "Test mode" arriba a la derecha del dashboard).

## 2. Obtener las claves API

Desde el dashboard:

- Menú **Developers → API keys**
  - Copia **Publishable key** (`pk_test_...`)
  - Copia **Secret key** (`sk_test_...`) — clic en "Reveal test key"

## 3. Configurar las claves en `.env.docker`

Edita `c:\ServBay\www\TuriDove_VK\.env.docker` y reemplaza los placeholders:

```env
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_AQUI
STRIPE_PUBLIC_KEY=pk_test_TU_CLAVE_AQUI
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_TU_CLAVE_AQUI
# STRIPE_WEBHOOK_SECRET queda pendiente — lo obtienes en el paso 4
```

## 4. Webhook con Stripe CLI (desarrollo local)

El webhook recibe eventos cuando un pago se completa, expira, falla o se reembolsa. En producción es una URL pública HTTPS. En **desarrollo local**, usamos la CLI de Stripe para reenviar eventos al backend local.

### Instalar Stripe CLI

**Windows (PowerShell con scoop):**
```powershell
scoop install stripe
```

**Windows (descarga directa):** https://github.com/stripe/stripe-cli/releases/latest → descarga el `.exe` y agrégalo al PATH.

**Verificar:**
```powershell
stripe --version
```

### Autenticar la CLI

```powershell
stripe login
```
Abre el navegador y autoriza la CLI. Solo necesario una vez.

### Iniciar el listener (deja esta terminal abierta mientras pruebas)

```powershell
stripe listen --forward-to http://localhost:3002/api/v1/pagos/webhook
```

Output esperado:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx (^C to quit)
```

**Copia ese `whsec_...`** y pégalo en `.env.docker`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

> 💡 El `whsec_` de la CLI es **distinto** al del dashboard. Para desarrollo local SIEMPRE usa el de la CLI.

### Eventos que escuchamos

Stripe CLI por defecto reenvía todos. Nuestro backend solo procesa:
- `checkout.session.completed` → reserva CONFIRMADA + pago COMPLETADO
- `checkout.session.expired` → reserva CANCELADA + pago FALLIDO
- `payment_intent.payment_failed` → pago FALLIDO
- `charge.refunded` → pago REEMBOLSADO

Los demás se loguean y descartan idempotentemente.

## 5. Reiniciar el backend

Después de editar `.env.docker`:

```powershell
docker compose --env-file .env.docker up -d --force-recreate backend
```

Espera ~10s a que arranque. Verifica que no hay errores:

```powershell
docker logs turidove_vk_api --tail 20
```

## 6. Smoke test end-to-end

1. Abre http://localhost:3003 e inicia sesión como cliente:
   - Email: `cliente1@example.com`
   - Password: `Client123!`
2. Reserva una actividad o hospedaje (cualquier flujo de reserva existente).
3. En el modal de pago, click "Pagar con tarjeta" → te redirige a Stripe Checkout.
4. Usa la tarjeta de prueba de Stripe:
   - **Número:** `4242 4242 4242 4242`
   - **Fecha:** cualquiera futura (ej. `12/30`)
   - **CVC:** cualquier 3 dígitos (ej. `123`)
   - **Email/nombre:** cualquier valor
5. Click "Pagar". Stripe procesa y redirige a `http://localhost:3003/reservas/<id>/pago/exito`.
6. **En la terminal de `stripe listen`** debe aparecer `[200] POST /api/v1/pagos/webhook` con el evento `checkout.session.completed`.
7. Verifica en la BD que la reserva quedó CONFIRMADA:
   ```powershell
   docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT id, estado, total FROM reservas ORDER BY created_at DESC LIMIT 3;"
   ```
   Expected: la reserva más reciente con `estado = CONFIRMADA`.
8. **Y el pago COMPLETADO:**
   ```powershell
   docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT id, estado, metodo, stripe_session_id IS NOT NULL AS has_session FROM pagos ORDER BY created_at DESC LIMIT 3;"
   ```

## 7. Probar reembolso desde admin

1. Logueate como admin (`admin@turidove.com` / `Admin123!`).
2. Ve a `/admin/pagos`.
3. Encuentra el pago recién completado, click "Reembolsar".
4. En la terminal de Stripe CLI debe llegar `charge.refunded`.
5. Verifica: `SELECT estado FROM pagos WHERE id='...'` → `REEMBOLSADO`.

## 8. Otras tarjetas de prueba útiles

Stripe ofrece tarjetas que simulan diferentes escenarios:

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | Pago exitoso |
| `4000 0000 0000 0002` | Tarjeta rechazada (`card_declined`) |
| `4000 0000 0000 9995` | Fondos insuficientes |
| `4000 0025 0000 3155` | Requiere autenticación 3D Secure |
| `4000 0000 0000 0341` | Falla después de adjuntar al cliente |

Lista completa: https://stripe.com/docs/testing

## 9. Mover a producción

Cuando estés listo:

1. **Toggle a Live mode** en el dashboard.
2. Obtén nuevas claves (`sk_live_...`, `pk_live_...`).
3. Crea un webhook real en `Developers → Webhooks → Add endpoint`:
   - URL: `https://tu-dominio.com/api/v1/pagos/webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
   - Copia el `whsec_` que muestra ahí.
4. Actualiza `.env.docker` (o las variables del servidor de producción) con las 3 claves live.
5. Cambia las URLs de redirect:
   ```env
   STRIPE_SUCCESS_URL=https://tu-dominio.com/reservas/{RESERVA_ID}/pago/exito
   STRIPE_CANCEL_URL=https://tu-dominio.com/reservas/{RESERVA_ID}/pago/cancelado
   ```
6. Reinicia el backend.

## Troubleshooting

**`Cannot find STRIPE_SECRET_KEY`:** el backend arrancó sin las variables. Verifica el `.env.docker` y reinicia con `--force-recreate`.

**Webhook devuelve 400 con `Stripe signature verification failed`:** el `STRIPE_WEBHOOK_SECRET` en `.env.docker` no coincide con el que dio `stripe listen`. Reinicia el listener y copia el nuevo secret.

**El frontend muestra "Error al iniciar el pago":** abre devtools del navegador → Network → busca la request `POST /api/v1/pagos/checkout/...`. El body de respuesta tendrá el detalle (probablemente clave Stripe mal configurada).

**`stripe listen` se desconecta:** la sesión de CLI debe mantenerse abierta mientras pruebas. Si la cierras, el webhook secret se invalida y al reiniciar te da uno nuevo.

---

**Estado del módulo (Fase 7 ya implementada):**
- ✅ Modelo `StripeEvent` para idempotencia
- ✅ Endpoint `POST /pagos/checkout/:reservaId` que crea la Checkout Session
- ✅ Endpoint `POST /pagos/webhook` con verificación de firma `constructEvent`
- ✅ Reembolsos con `stripe.refunds.create`
- ✅ Páginas frontend `/reservas/:id/pago/exito` y `/reservas/:id/pago/cancelado`
- ✅ Componente `CheckoutSummary` reemplaza el modal de pago simulado
