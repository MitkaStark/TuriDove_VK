# Auto-refresh interceptor — design

> Sigue al PR #1 (Opción C). Resuelve el follow-up "interceptor axios para rotar refresh tokens automáticamente" anotado en ese PR.

## Problema

Con D.3 (refresh tokens con rotación familiar) merged, el backend ya emite pares `accessToken + refreshToken` y soporta `/auth/refresh` para rotarlos. El access token expira a los 15 minutos.

Pero el frontend:

1. Solo guarda el `accessToken` en `localStorage` y en el zustand store. El `refreshToken` que devuelve el login se descarta.
2. El interceptor de response actual (`frontend/src/lib/axios.ts`) ante un 401 hace logout brutal y redirige a `/login`. Nunca intenta rotar.

Resultado UX: el usuario debe re-loguearse cada 15 minutos, perdiendo cualquier trabajo en curso. Toda la inversión en refresh tokens del bloque D.3 queda sin uso.

## Objetivo

Cuando el access token expire (401), el frontend debe rotar usando el refresh token de forma transparente y reintentar la request original. Solo si el refresh también falla (refresh expirado a los 7 días o sesión revocada por reuse), entonces sí hacer logout limpio.

Adicionalmente, mover el refresh token de un storage accesible por JavaScript a una cookie httpOnly — el access token sigue en localStorage (igual que hoy), pero el refresh queda fuera del alcance de XSS.

## Restricciones

- **Compatible con la rotación familiar del backend.** Solo un refresh concurrente por sesión: si dispara N a la vez, el segundo recibirá el RT viejo (ya revocado en la primera rotación) y dispararía la detección de reuse, cerrando la sesión legítima. La cola es obligatoria.
- **No tocar la lógica de login/register existente más allá de adaptar el payload de respuesta.** El flow de verify email, password reset, y refresh token service del backend se quedan iguales.
- **No introducir dependencias nuevas.** axios + zustand + react-hot-toast ya están.
- **SSR safe.** El interceptor corre solo en cliente. Importante para no romper builds de Next.js App Router.

## Arquitectura

Tres piezas, en orden de implementación:

### 1. Backend: cookie httpOnly en endpoints de auth

Endpoints afectados:
- `POST /auth/login` — además del JSON con `accessToken`, setear cookie `tdv_rt`.
- `POST /auth/register` — actualmente no emite tokens (verify email obligatorio). Sin cambios.
- `POST /auth/refresh` — leer RT de cookie en vez de body; setear nueva cookie en la respuesta.
- `POST /auth/logout` — leer cookie, revocar, borrar cookie en respuesta.

Cookie config:
- Nombre: `tdv_rt`
- Atributos: `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, `Max-Age=7d`
- En producción (NODE_ENV=production): añadir `Secure`.

`Path=/api/v1/auth` limita la cookie a endpoints de auth (no se envía con cada GET de hospedajes/etc).

El body del login retorna solo:
```json
{ "user": {...}, "accessToken": "...", "token": "..." }
```
(eliminar `refreshToken` del body — queda solo en la cookie).

### 2. Frontend: axios + storage

`frontend/src/lib/axios.ts`:
- `axios.create({ ..., withCredentials: true })` para que las cookies viajen.

`frontend/src/store/auth.store.ts`:
- Sin cambios — sigue guardando solo `user + token` (access). El refresh ya no es problema suyo.

`frontend/src/services/auth.service.ts`:
- `refreshSession()` ya no toma argumento — la cookie viaja sola.
- `logout()` igual — sin argumento.
- `login()` retorna solo `accessToken` (el refresh va por cookie).

### 3. Frontend: interceptor con cola

Estado interno del módulo:
```ts
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];
```

Pseudo-flujo del interceptor de response en error:

```
if status !== 401 → reject (propagar)
if request.url empieza con '/auth/refresh' → reject + logout (refresh falló)
if request._retry === true → reject + logout (ya reintentamos una vez)

request._retry = true

if isRefreshing:
  encolar { resolve, reject }, retornar promesa que resuelve cuando termine el refresh
else:
  isRefreshing = true
  try:
    nuevo_access = await api.post('/auth/refresh') (sin body, cookie viaja sola)
    guardar nuevo access en store + localStorage
    despertar cola con éxito (cada uno reintenta su request)
    reintentar la request original
  catch:
    despertar cola con error
    toast.error('Tu sesión expiró')
    logout()
    redirect a /login
  finally:
    isRefreshing = false
    pendingQueue = []
```

### Componentes

```
backend/src/modules/auth/auth.controller.ts          [modify]
  └ login(): setear cookie + body sin refreshToken
  └ refresh(): leer cookie + setear nueva cookie
  └ logout(): leer cookie + borrar cookie

backend/src/modules/auth/refresh-cookie.util.ts      [create]
  └ setRefreshCookie(res, rt)
  └ clearRefreshCookie(res)
  └ readRefreshCookie(req): string | null

backend/src/main.ts                                  [modify]
  └ habilitar cookie-parser
  └ ajustar CORS para credentials: true (probablemente ya lo está)

frontend/src/lib/axios.ts                            [modify]
  └ withCredentials: true
  └ interceptor de response con cola

frontend/src/services/auth.service.ts                [modify]
  └ refreshSession() sin args (lee cookie)
  └ logout() sin args (lee cookie)

frontend/src/types/index.ts                          [modify]
  └ AuthResponse: quitar refreshToken del tipo
```

### Data flow

**Login:**
```
client → POST /auth/login (body: email+pass)
backend → valida, emite par (access, refresh)
       → response:
            Set-Cookie: tdv_rt=...; HttpOnly; Path=/api/v1/auth; ...
            Body: { user, accessToken, token }
client → guarda accessToken en localStorage, ignora cookie (no la ve)
```

**Request normal:**
```
client → GET /api/v1/algo (header: Authorization Bearer <access>)
backend → 200 OK
```

**Request con access expirado:**
```
client → GET /api/v1/algo (Bearer <access viejo>)
backend → 401
client interceptor:
  isRefreshing = true
  client → POST /auth/refresh (Cookie: tdv_rt=...)
  backend → rota, valida, devuelve nuevo access + nueva cookie
  client → guarda nuevo access
  client → retry GET /api/v1/algo (Bearer <access nuevo>)
backend → 200 OK
```

**Refresh fallido (7d expirado):**
```
client → GET /api/v1/algo (Bearer <access viejo>)
backend → 401
client interceptor:
  client → POST /auth/refresh (Cookie expirada / sesión revocada)
  backend → 401 Unauthorized
  client → toast + logout + redirect /login
```

**Concurrencia (5 requests en paralelo):**
```
T0:   client → req1, req2, req3, req4, req5 (todos con access viejo)
T1:   backend → 401 × 5
T2:   interceptor:
        req1: isRefreshing=true, dispara /auth/refresh
        req2-5: ven isRefreshing=true, se encolan
T3:   backend → /auth/refresh OK con nuevo access
T4:   interceptor:
        despierta cola: req2-5 reciben nuevo token y reintentan
        req1 reintenta
T5:   backend → 200 × 5
```

### Error handling

El interceptor distingue por status del error de refresh:

| Caso | Status devuelto por /auth/refresh | Acción |
|---|---|---|
| Refresh válido | 200 | guardar nuevo access, despertar cola, retry original |
| RT expirado o reusado | 401 | toast "Sesión expiró", logout, redirect /login |
| Cookie ausente | 401 (backend la trata igual que inválida) | mismo trato que refresh expirado |
| Backend caído | 5xx, network error, o timeout | propagar el error a la cola y al original SIN logout (sesión sigue válida; el usuario ve el error en su acción y puede reintentar) |

En código: `try` rota; `catch` discrimina por `error.response?.status === 401` para hacer logout vs. propagar el error tal cual.

### Testing manual

Plan corto al final del implementation plan:

1. **Login normal:** entra OK, navega, no rompe nada.
2. **Token rotation transparente:** bajar `ACCESS_TOKEN_EXPIRATION=10s` en `.env.docker`, login, esperar 15s, navegar → debe rotar sin tirar al usuario.
3. **Sesión expirada:** borrar cookie manualmente en DevTools, intentar acción → toast "Sesión expiró" + redirect.
4. **Concurrencia:** navegar a `/admin/sistema` (3 queries en paralelo) con access expirado → SOLO un POST a `/auth/refresh` en Network tab (no 3).
5. **Verificar cookie en DevTools:** debe ser `HttpOnly=true`, `Path=/api/v1/auth`, `Max-Age` ~7d, `Secure=false` en local, `true` en prod.
6. **Logout limpio:** click en logout → cookie borrada (DevTools confirma), redirect a /login, ningún refresh subsecuente funciona.

## Out of scope

- Background refresh proactivo (refrescar antes de que expire, p.ej. cada 14min). Mantenemos el patrón reactivo (refresh on 401) — más simple, mismo resultado UX. Si después medimos pico de 401s, lo reconsideramos.
- Mover el access token también a cookie httpOnly. Cambio invasivo a todas las llamadas, no aporta seguridad significativa si XSS ya tiene control del DOM. Decisión: queda en localStorage.
- Migración de pestañas concurrentes vía `BroadcastChannel` para sincronizar tokens. YAGNI en este punto — múltiples pestañas funcionarán correctamente, en el peor caso una dispara reuse detection y todas se cierran (aceptable).
- Endpoint `/auth/sessions` para que el usuario vea sus refresh tokens activos y revoque alguno. Feature aparte si surge la necesidad.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| CORS rompe con `credentials: true` | Verificar que `CORS_ORIGIN` esté bien configurado y `credentials: true` en el `enableCors()` del backend. Ya está pero revalidar. |
| Cookie no llega en dev local por `Path=/api/v1/auth` y misma URL | Path coincide con el endpoint, debería funcionar. Test 5 lo valida. |
| Endpoints actualizados rompen contratos viejos | El `refreshToken` en body se queda como `null`/ausente, no como error. Clientes viejos del access seguirán funcionando — solo dejan de poder llamar refresh manualmente. |
| Race condition cookie vs body en `/auth/refresh` | El backend ya solo aceptará cookie. Si llega el body, lo ignora. Sin doble lectura. |

## Definición de éxito

- Tras login, usuario puede navegar 8+ horas sin re-loguearse (refresh válido por 7 días).
- En Network tab, request fallido con 401 → un POST a `/auth/refresh` → retry de la original. Todo en menos de 500ms desde la perspectiva del usuario.
- Concurrencia: 5 requests simultáneos en panel admin disparan UN solo refresh (no 5).
- Refresh expirado o sesión revocada: toast claro + redirect a /login, sin loops ni errores en consola.
- Cookie en DevTools muestra `HttpOnly=true`. `document.cookie` desde la consola del navegador NO retorna `tdv_rt`.
