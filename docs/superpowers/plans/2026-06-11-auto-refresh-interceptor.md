# Auto-refresh interceptor — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rotación transparente de tokens cuando el access expire (cada 15 min) usando refresh token guardado en cookie httpOnly. Sin esto el usuario se desloguea cada 15 min.

**Architecture:** Backend setea refresh token en cookie httpOnly (`tdv_rt`, Path=/api/v1/auth, 7d). Frontend ya no maneja el refresh — el axios envía cookies con `withCredentials: true`. Un interceptor de response intercepta 401, dispara un único refresh con cola compartida para evitar stampede (la rotación familiar del backend invalidaría todo si dispara N refreshes a la vez).

**Tech Stack:** NestJS 10 backend, Next.js 15 frontend, axios, zustand, react-hot-toast, cookie-parser.

**Spec:** [docs/superpowers/specs/2026-06-11-auto-refresh-interceptor-design.md](../specs/2026-06-11-auto-refresh-interceptor-design.md)

**Working directory:** `c:\ServBay\www\TuriDove_VK`
**Branch:** `feat/auto-refresh-interceptor` (ya creada con el spec commiteado)
**Shell:** PowerShell.

---

## File structure

```
backend/
  src/
    modules/auth/
      auth.controller.ts      [modify] login/refresh/logout setean/leen/borran cookie
      auth.module.ts          [modify] importar nuevo util si hace falta
      utils/
        refresh-cookie.util.ts [create] setRefreshCookie, clearRefreshCookie, readRefreshCookie
    main.ts                   [modify] habilitar cookie-parser + verificar CORS credentials

frontend/
  src/
    lib/axios.ts              [modify] withCredentials:true + interceptor con cola
    services/auth.service.ts  [modify] refreshSession() sin args, logout() sin args
    types/index.ts            [modify] AuthResponse sin refreshToken
    hooks/use-auth.ts         [modify] no parsear refreshToken del response
    store/auth.store.ts       [sin cambios]
```

---

## Tarea 1: Backend — cookie-parser + util de cookie

**Files:**
- Modify: `backend/package.json` (install cookie-parser + types)
- Modify: `backend/src/main.ts`
- Create: `backend/src/modules/auth/utils/refresh-cookie.util.ts`

- [ ] **Step 1: Instalar cookie-parser dentro del container**

```powershell
docker exec turidove_vk_api npm install cookie-parser --legacy-peer-deps
docker exec turidove_vk_api npm install --save-dev @types/cookie-parser --legacy-peer-deps
docker cp turidove_vk_api:/app/package.json backend/package.json
docker cp turidove_vk_api:/app/package-lock.json backend/package-lock.json
```

Verifica:
```powershell
Select-String -Path backend/package.json -Pattern "cookie-parser"
```
Expected: 2 hits (deps + devDeps).

- [ ] **Step 2: Habilitar cookie-parser en main.ts**

Lee `backend/src/main.ts`. Agrega al top junto a los otros imports:
```ts
import * as cookieParser from 'cookie-parser';
```

Después de `const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });` y antes de `app.useLogger(...)`, agrega:
```ts
app.use(cookieParser());
```

Verifica que `enableCors` ya tenga `credentials: true`. Lee la sección de CORS — si no lo tiene, agrégalo:
```ts
app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  // ... resto de la config existente
});
```

- [ ] **Step 3: Crear refresh-cookie.util.ts**

`backend/src/modules/auth/utils/refresh-cookie.util.ts`:

```ts
import type { Request, Response, CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'tdv_rt';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: 0,
  });
}

export function readRefreshCookie(req: Request): string | null {
  const value = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length >= 64 ? value : null;
}
```

- [ ] **Step 4: Commit**

```powershell
git add backend/package.json backend/package-lock.json backend/src/main.ts backend/src/modules/auth/utils/refresh-cookie.util.ts
git commit -m "feat(auth): util de cookie httpOnly + cookie-parser habilitado"
```

---

## Tarea 2: Backend — endpoints auth setean/leen/borran cookie

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Login — setear cookie + quitar refreshToken del body**

Lee `backend/src/modules/auth/auth.controller.ts`. Localiza el método `async login(...)`.

Cambia la firma para inyectar `@Res({ passthrough: true }) res: Response`:

Imports al top:
```ts
import type { Response, Request as ExpressRequest } from 'express';
import { Res, Req } from '@nestjs/common';
import { setRefreshCookie, clearRefreshCookie, readRefreshCookie } from './utils/refresh-cookie.util';
```

Firma actualizada:
```ts
async login(
  @Body() loginDto: LoginDto,
  @Request() req: any,
  @Res({ passthrough: true }) res: Response,
) {
```

Dentro del método, después de obtener el `pair` con `issueTokensForUser`, REEMPLAZAR el return por:

```ts
setRefreshCookie(res, pair.refreshToken);
const { password: _, ...userWithoutPassword } = req.user;
return {
  user: userWithoutPassword,
  token: pair.accessToken,
  accessToken: pair.accessToken,
};
```

Nota: ya NO incluimos `refreshToken` en el body.

- [ ] **Step 2: Refresh — leer cookie + setear cookie nueva**

Localiza el método `refresh`. La firma actual usa `@Body() dto: RefreshDto`. Cambia a:

```ts
@Public()
@Post('refresh')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
async refresh(
  @Req() req: ExpressRequest,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = readRefreshCookie(req);
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token no presente');
  }
  const pair = await this.refreshTokens.rotate(refreshToken);
  setRefreshCookie(res, pair.refreshToken);
  return { accessToken: pair.accessToken };
}
```

`UnauthorizedException` ya está importado en este archivo (usado en otros lugares); si no, importa de `@nestjs/common`.

El DTO `RefreshDto` queda obsoleto en este endpoint pero el archivo se queda — todavía hay tests que lo referencian si los hubiera. No lo borres en esta tarea.

- [ ] **Step 3: Logout — leer cookie + borrar cookie**

Localiza el método `logout`. Cambia a:

```ts
@Post('logout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async logout(
  @Req() req: ExpressRequest,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = readRefreshCookie(req);
  if (refreshToken) {
    await this.refreshTokens.revoke(refreshToken);
  }
  clearRefreshCookie(res);
  return { ok: true };
}
```

- [ ] **Step 4: AuthService.register también setea cookie? NO**

Lee el método `register` del controller (que solo invoca `authService.register(registerDto)`).

En el merge previo, `register` ya NO emite tokens (verify email obligatorio). El service retorna `{ user, requiresEmailVerification: true, message: '...' }`. **No tocar register** — el usuario debe verificar email antes de loguearse, y la cookie solo aplica una vez logueado.

(Si te das cuenta que tenías `register` antiguo emitiendo tokens, esa es una regresión — para. Verifica primero leyendo `backend/src/modules/auth/auth.service.ts:27-68`.)

- [ ] **Step 5: AuthService.login — ya no necesita retornar refreshToken**

Lee `backend/src/modules/auth/auth.service.ts`. El método `async login(email, password)` retorna `{ user, token, accessToken, refreshToken }`. Eso lo invoca el controller en `LocalAuthGuard` flow PERO el controller del login YA usa `issueTokensForUser(req.user)` directamente — NO llama `authService.login(email, password)` para el path normal.

Decisión: dejar `authService.login()` igual (sigue retornando los 4 campos). Si quedó código viejo que llama a `authService.login()` y depende de `refreshToken` del body, no rompe nada por el cambio del controller. Cero riesgo de regresión.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/modules/auth/auth.controller.ts
git commit -m "feat(auth): login/refresh/logout usan cookie httpOnly para refresh token"
```

---

## Tarea 3: Backend — rebuild + smoke test API directa

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Rebuild backend**

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d --force-recreate backend
```

Espera a que esté listo:
```powershell
do { Start-Sleep -Seconds 2 } until ((Invoke-WebRequest -Uri http://localhost:3002/health -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode -eq 200)
```

- [ ] **Step 2: Verificar que login setea cookie + no devuelve refreshToken en body**

```powershell
$response = Invoke-WebRequest -Uri http://localhost:3002/api/v1/auth/login -Method POST -ContentType 'application/json' -Body '{"email":"admin@turidove.com","password":"Admin123!"}' -SessionVariable session
$response.Headers.'Set-Cookie' | Select-String "tdv_rt"
$response.Content | ConvertFrom-Json | Select-Object -ExpandProperty data | Get-Member -MemberType NoteProperty | Select-Object Name
```

Expected:
- `Set-Cookie` header con `tdv_rt=...; HttpOnly; ...`
- Props del body: `user`, `accessToken`, `token` (NO `refreshToken`)

- [ ] **Step 3: Verificar refresh usando la cookie de la sesión**

```powershell
$r = Invoke-WebRequest -Uri http://localhost:3002/api/v1/auth/refresh -Method POST -WebSession $session
$r.StatusCode  # 200 esperado
$r.Headers.'Set-Cookie' | Select-String "tdv_rt"  # nueva cookie
($r.Content | ConvertFrom-Json).data | Get-Member -MemberType NoteProperty | Select-Object Name  # accessToken
```

Expected: `200`, nueva cookie `tdv_rt=...`, body con `accessToken`.

- [ ] **Step 4: Verificar refresh SIN cookie da 401**

```powershell
try {
  Invoke-WebRequest -Uri http://localhost:3002/api/v1/auth/refresh -Method POST
} catch {
  $_.Exception.Response.StatusCode  # 401 Unauthorized
}
```

- [ ] **Step 5: Verificar reuse del MISMO refresh token (cookie vieja) sigue dando 401**

(Después del refresh anterior, la cookie de `$session` es la NUEVA. La vieja ya quedó revocada. No hay forma trivial de testear esto sin guardar la cookie cruda manualmente — se valida implícitamente en la prueba integración del frontend.)

Sin commit (es solo verificación).

---

## Tarea 4: Frontend — withCredentials + tipos

**Files:**
- Modify: `frontend/src/lib/axios.ts`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/auth.service.ts`
- Modify: `frontend/src/hooks/use-auth.ts`

- [ ] **Step 1: axios con withCredentials**

Lee `frontend/src/lib/axios.ts`. En la creación del `api`:

```ts
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

Solo añadir `withCredentials: true`. **No tocar los interceptores en esta tarea** — los rehago entero en la Tarea 5.

- [ ] **Step 2: types/index.ts — quitar refreshToken**

Lee `frontend/src/types/index.ts`. Localiza `AuthResponse` o el tipo del response de login.

```powershell
Select-String -Path frontend/src/types/index.ts -Pattern "refreshToken" -Context 2,2
```

En la interface (probable AuthResponse), QUITAR el campo `refreshToken: string;`.

También quitar de cualquier otra interface donde aparezca como respuesta del backend (NO de un payload de request).

- [ ] **Step 3: auth.service.ts — refreshSession y logout sin args**

Lee `frontend/src/services/auth.service.ts`. Localiza los métodos `refreshSession` y `logout`:

```ts
async refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await api.post('/auth/refresh', { refreshToken });
  return data;
}

async logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}
```

Reemplazar por:

```ts
async refreshSession(): Promise<{ accessToken: string }> {
  const { data } = await api.post('/auth/refresh');
  return data;
}

async logout(): Promise<void> {
  await api.post('/auth/logout');
}
```

Buscar también el método obsoleto `refreshToken()` (sin args, viejo flow) y verificar si todavía lo usa alguien. Si existe y es de la versión vieja, déjalo apuntando a `/auth/refresh` también pero NO lo borres aquí.

- [ ] **Step 4: use-auth.ts — no pasar refreshToken del response**

Lee `frontend/src/hooks/use-auth.ts`. La mutation de login probablemente hace algo como:

```ts
onSuccess: (data) => {
  login(data.user, data.token);
  ...
}
```

Verificar que NO esté guardando `data.refreshToken` en ningún lado. Si lo hace, quitarlo.

Igual para registerMutation: ya no guarda nada (fix del PR #1).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/lib/axios.ts frontend/src/types/index.ts frontend/src/services/auth.service.ts frontend/src/hooks/use-auth.ts
git commit -m "feat(frontend): axios withCredentials + auth service sin refresh token en body"
```

---

## Tarea 5: Frontend — interceptor con cola

**Files:**
- Modify: `frontend/src/lib/axios.ts`

- [ ] **Step 1: Reemplazar el interceptor de response**

Lee `frontend/src/lib/axios.ts` completo. La estructura actual:
- Request interceptor: adjunta Bearer y actualiza lastActivity. **Mantener.**
- Response interceptor: dos handlers (uno desempaqueta `{data, meta}`, otro maneja 401/403/500). **Reemplazar la lógica de 401 entera.**

Reemplazar TODO el response interceptor por este bloque (el de éxito que desempaqueta queda igual, solo cambia el error handler):

```ts
// State para la cola de refresh
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(token: string | null, err: unknown = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (err || !token) reject(err);
    else resolve(token);
  });
  pendingQueue = [];
}

function doLogoutAndRedirect(message?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
  } catch {}
  // Dynamic import para evitar circular deps con react-hot-toast en SSR
  import('react-hot-toast').then((mod) => {
    mod.default.error(message ?? 'Tu sesión expiró. Inicia sesión de nuevo.', { duration: 4000 });
  }).catch(() => {});
  window.location.href = '/login';
}

api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'meta' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, config } = error.response;
    const originalConfig = error.config;

    // 401 en /auth/refresh → refresh muerto. Logout sin retry.
    if (status === 401 && originalConfig?.url?.includes('/auth/refresh')) {
      doLogoutAndRedirect();
      return Promise.reject(error);
    }

    // 401 con _retry ya marcado → ya intentamos rotar una vez. Logout.
    if (status === 401 && originalConfig?._retry) {
      doLogoutAndRedirect();
      return Promise.reject(error);
    }

    if (status === 401 && originalConfig) {
      originalConfig._retry = true;

      // Otro refresh en curso: encolar
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (newToken: string) => {
              originalConfig.headers = originalConfig.headers ?? {};
              originalConfig.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalConfig));
            },
            reject,
          });
        });
      }

      // Disparar refresh
      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newAccessToken = data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Refresh response sin accessToken');
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newAccessToken);
          // Actualizar también el zustand store si está hidratado
          try {
            const stored = localStorage.getItem('auth-storage');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.state) {
                parsed.state.token = newAccessToken;
                localStorage.setItem('auth-storage', JSON.stringify(parsed));
              }
            }
          } catch {}
        }

        flushQueue(newAccessToken);

        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalConfig);
      } catch (refreshError: any) {
        flushQueue(null, refreshError);
        // Distinguir: 401 → sesión muerta; otros → propagar el error sin logout
        if (refreshError?.response?.status === 401) {
          doLogoutAndRedirect();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      console.error('Acceso denegado: no tienes permisos para esta acción.');
    }
    if (status === 500) {
      console.error('Error interno del servidor.');
    }

    return Promise.reject(error);
  },
);
```

NOTA: el bloque `if (status === 401)` viejo que hacía redirect directo **se reemplaza completamente** por la lógica de cola. Borrar el viejo.

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/lib/axios.ts
git commit -m "feat(frontend): interceptor con cola que rota refresh token transparente"
```

---

## Tarea 6: Rebuild frontend + smoke E2E

**Files:** ninguno

- [ ] **Step 1: Rebuild frontend**

```powershell
docker compose --env-file .env.docker build frontend
docker compose --env-file .env.docker up -d --force-recreate frontend
do { Start-Sleep -Seconds 2 } until ((Invoke-WebRequest -Uri http://localhost:3003/ -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode -eq 200)
```

- [ ] **Step 2: Bajar el TTL del access token a 10 segundos en .env.docker para test**

Lee `.env.docker`. Localiza `ACCESS_TOKEN_EXPIRATION` (si no está, agrégala).

```env
ACCESS_TOKEN_EXPIRATION=10s
```

Recrea solo el backend para que tome el cambio:
```powershell
docker compose --env-file .env.docker up -d --force-recreate backend
```

- [ ] **Step 3: Smoke en navegador — rotación transparente**

1. Abre http://localhost:3003/login en una pestaña incógnita (cookies limpias).
2. Login con `admin@turidove.com / Admin123!`.
3. Abre DevTools → Network → filtra por `/api/v1`.
4. Espera 15 segundos sin tocar nada.
5. Click en `/admin/sistema` (o cualquier ruta admin que dispare queries).
6. Expected en Network:
   - Primer request a la ruta admin: **401**.
   - Inmediatamente después: `POST /auth/refresh` → **200**.
   - Retry automático del request original: **200**.
7. La página carga normal. El usuario NO ve nada raro.

- [ ] **Step 4: Smoke — cookie httpOnly verificada**

1. En DevTools → Application → Cookies → `http://localhost:3003`.
2. Busca cookie `tdv_rt`.
3. Verifica columnas: `HttpOnly=✓`, `Path=/api/v1/auth`, `Max-Age` ~7 días (604800).
4. En la consola: `document.cookie` — la respuesta NO debe contener `tdv_rt`.

- [ ] **Step 5: Smoke — concurrencia**

1. Recarga la página de login (limpia cookies primero si quieres). Login.
2. Espera 15s.
3. Navega a `/admin/sistema` (que dispara 3 queries en paralelo: health, stripe-events, email-logs).
4. En Network, filtrando `/auth/refresh`, debes ver **EXACTAMENTE 1 POST**, no 3.
5. Los 3 queries originales completan con 200 después del refresh.

- [ ] **Step 6: Smoke — sesión expirada**

1. En DevTools → Application → Cookies → borra manualmente la cookie `tdv_rt`.
2. Espera 15s (para que expire el access).
3. Intenta navegar / hacer una acción.
4. Expected:
   - Network: GET algo → 401 → POST /auth/refresh → 401.
   - Toast "Tu sesión expiró. Inicia sesión de nuevo."
   - Redirect a `/login`.

- [ ] **Step 7: Smoke — logout limpio**

1. Vuelve a loguearte.
2. En la app, hacer logout (donde sea que esté el botón).
3. En Network: `POST /auth/logout` → 200 con `Set-Cookie` que borra `tdv_rt` (Max-Age=0).
4. En Application → Cookies, `tdv_rt` ya no aparece.
5. Intentar ir a `/admin` → redirect a `/login`.

- [ ] **Step 8: Restaurar TTL en .env.docker**

Vuelve a poner:
```env
ACCESS_TOKEN_EXPIRATION=15m
```

(O quita la línea si no existía antes.)

Recrea backend:
```powershell
docker compose --env-file .env.docker up -d --force-recreate backend
```

Sin commit (es solo testing).

---

## Tarea 7: Pulir + PR

**Files:** ninguno (limpieza + push)

- [ ] **Step 1: Verificar que no quedó código muerto**

```powershell
Select-String -Path frontend/src -Pattern "refresh_token|refreshToken" -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.Line -notmatch "//" }
```

Expected: solo apariciones en `auth.service.ts` (el campo de respuesta tipado).

```powershell
Select-String -Path backend/src -Pattern "RefreshDto" -Recurse -Include "*.ts"
```

Si `RefreshDto` solo se usa para el shape de tipo del body viejo y ya no se importa en `auth.controller.ts`, eliminarlo es seguro pero opcional. **Dejar en este PR para mantener el diff chico.**

- [ ] **Step 2: Push branch**

```powershell
git push -u origin feat/auto-refresh-interceptor
```

- [ ] **Step 3: Abrir PR**

URL: `https://github.com/MitkaStark/TuriDove_VK/pull/new/feat/auto-refresh-interceptor`

Título: `Auto-refresh interceptor (cookie httpOnly + cola compartida)`

Body:
```markdown
## Resumen

Resuelve el follow-up del PR #1: ahora el frontend rota el refresh token transparentemente cuando el access expira (15 min). Sin esto, el usuario era expulsado cada 15 min aunque la rotación familiar del backend estuviera operativa.

## Cambios

**Backend:**
- `cookie-parser` habilitado en `main.ts`.
- Login/refresh/logout setean/leen/borran cookie `tdv_rt` (httpOnly, Path=/api/v1/auth, 7d, Secure en prod).
- `POST /auth/refresh` ya NO requiere body — lee la cookie. 401 si la cookie está ausente.
- El body del login ya NO devuelve `refreshToken` (queda solo en la cookie).

**Frontend:**
- `axios` ahora envía credentials (cookies).
- Interceptor de response con **cola compartida**: si N requests fallan con 401 al mismo tiempo, solo dispara UN refresh y los demás esperan.
- Sesión expirada (refresh devuelve 401): toast `'Tu sesión expiró'` + logout + redirect.
- Errores 5xx en refresh: propagados sin logout (sesión sigue válida).

## Test plan

- [x] Login normal funciona.
- [x] Cookie `tdv_rt` aparece como HttpOnly en DevTools.
- [x] `document.cookie` desde consola NO retorna `tdv_rt`.
- [x] Con `ACCESS_TOKEN_EXPIRATION=10s`, navegar tras 15s rota transparente (visible en Network: 401 → /auth/refresh → retry 200).
- [x] Concurrencia: `/admin/sistema` con 3 queries en paralelo → SOLO 1 POST /auth/refresh.
- [x] Borrar cookie manualmente → toast + redirect /login.
- [x] Logout limpia la cookie en el servidor (Set-Cookie con Max-Age=0).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Sin commit (el PR es el "entregable" final).

---

## Self-review

### Spec coverage

| Sección del spec | Tarea | OK |
|---|---|---|
| Cookie httpOnly, Path=/api/v1/auth, 7d, Secure en prod | T1 step 3 | ✅ |
| `/auth/login` setea cookie, body sin refreshToken | T2 step 1 | ✅ |
| `/auth/refresh` lee cookie, devuelve nueva cookie | T2 step 2 | ✅ |
| `/auth/logout` lee cookie, borra cookie | T2 step 3 | ✅ |
| `cookie-parser` + CORS con credentials | T1 step 2 | ✅ |
| Frontend `withCredentials: true` | T4 step 1 | ✅ |
| Tipos sin `refreshToken` | T4 step 2 | ✅ |
| `auth.service` sin args en refresh/logout | T4 step 3 | ✅ |
| Interceptor con cola compartida | T5 step 1 | ✅ |
| Discriminar 401 (logout) vs 5xx/network (propagate) | T5 step 1 | ✅ |
| Toast en sesión expirada | T5 step 1 (`doLogoutAndRedirect`) | ✅ |
| Testing 1-6 del spec | T6 steps 3-7 | ✅ |

Sin gaps.

### Placeholder scan

Ningún `TBD`, `TODO`, "implementar luego". Cada step tiene código real o comando exacto.

### Type consistency

- `setRefreshCookie(res, refreshToken)` definido en T1, usado en T2.
- `readRefreshCookie(req)` definido en T1, usado en T2.
- `REFRESH_COOKIE_NAME = 'tdv_rt'` definido en T1, mencionado por nombre en T6.
- Interceptor `flushQueue`, `doLogoutAndRedirect`, `pendingQueue` — todos locales al archivo en T5.
- Backend `pair.accessToken` / `pair.refreshToken` shape preservado del bloque D.3 (no se cambia).

Consistente.

---

## Execution

**Plan completo y commiteable.** Branch `feat/auto-refresh-interceptor` ya creada con el spec.

Dos opciones de ejecución:

1. **Subagent-Driven (recomendado)** — fresh subagent per task + two-stage review.
2. **Inline Execution** — yo hago las tareas en esta sesión con checkpoints para review.

El plan tiene 7 tareas. T1, T2 son backend puro. T4-T5 son frontend puro. T3 y T6 son smokes. Las 7 son pequeñas (~15 min cada una).
