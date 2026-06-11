# Opción C — Parte 4: Refresh tokens + Rate limit endpoint-level

> Continuación. Numeración sigue desde Parte 3.

---

## Fase D.3 — Refresh token con rotación familiar

> Objetivo: refresh tokens persistidos con familyId. Reuso de un token revocado invalida toda la familia (detección de robo). Logout revoca el refresh actual.

### Tarea 34: Schema RefreshToken

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Agregar inverse en User**

```prisma
refreshTokens RefreshToken[]
```

- [ ] **Step 2: Agregar modelo**

```prisma
model RefreshToken {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash")
  family    String
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([family])
  @@index([userId])
  @@map("refresh_tokens")
}
```

- [ ] **Step 3: Migration**

```powershell
$ts = Get-Date -Format "yyyyMMddHHmmss"
$migDir = "backend/prisma/migrations/${ts}_refresh_tokens"
New-Item -ItemType Directory -Path $migDir -Force | Out-Null
```

```sql
CREATE TABLE "refresh_tokens" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "family"     TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 4: Aplicar + commit**

```powershell
$migName = Split-Path $migDir -Leaf
docker cp backend/prisma/schema.prisma turidove_vk_api:/app/prisma/schema.prisma
docker exec turidove_vk_api sh -c "mkdir -p /app/prisma/migrations/$migName"
docker cp "$migDir/migration.sql" "turidove_vk_api:/app/prisma/migrations/$migName/migration.sql"
docker exec turidove_vk_api npx prisma migrate deploy
docker exec turidove_vk_api npx prisma generate
git add backend/prisma/
git commit -m "feat(db): tabla refresh_tokens con familyId para detección de reuso"
```

### Tarea 35: RefreshTokenService

**Files:**
- Create: `backend/src/modules/auth/services/refresh-token.service.ts`

- [ ] **Step 1: Crear el service**

```ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private hashToken(t: string): string {
    return createHash('sha256').update(t).digest('hex');
  }

  /**
   * Genera un nuevo par de tokens. Si `family` se omite, inicia una familia nueva (login).
   * Si se pasa, rota dentro de la misma familia (refresh).
   */
  async issuePair(userId: string, role: string, family?: string): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: userId, role },
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION ?? '15m' },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const familyId = family ?? randomUUID();
    const refreshDays = parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS ?? '7', 10);
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 3600_000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, family: familyId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Valida un refresh token y rota. Si el token YA fue revocado, invalida toda la familia.
   */
  async rotate(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) throw new UnauthorizedException('Refresh token inválido');

    if (stored.revokedAt) {
      // REUSO detectado — invalida toda la familia
      this.logger.warn(`Reuso de refresh token detectado para user ${stored.userId}; revocando familia ${stored.family}`);
      await this.prisma.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token revocado por reuso');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Revocar el token actual y emitir uno nuevo dentro de la misma familia
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issuePair(stored.userId, stored.user.role, stored.family);
  }

  async revoke(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
```

- [ ] **Step 2: Commit**

```powershell
git add backend/src/modules/auth/services/refresh-token.service.ts
git commit -m "feat(auth): RefreshTokenService con rotación familiar y detección de reuso"
```

### Tarea 36: Integrar RefreshTokenService en AuthService y controller

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`
- Create: `backend/src/modules/auth/dto/refresh.dto.ts`

- [ ] **Step 1: DTO**

```ts
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @IsString()
  @MinLength(64)
  refreshToken!: string;
}
```

- [ ] **Step 2: AuthService — usar issuePair en login**

Inyectar `RefreshTokenService` en el constructor.

Localizar `async login(...)`. Reemplazar la generación de token actual por:

```ts
const pair = await this.refreshTokens.issuePair(user.id, user.role);
return {
  user: { id: user.id, email: user.email, role: user.role, nombre: user.nombre, apellido: user.apellido },
  ...pair,
};
```

(Eliminar el `this.jwt.sign(...)` directo si existe — ahora va por issuePair.)

- [ ] **Step 3: Endpoints refresh y logout en controller**

```ts
import { RefreshTokenService } from './services/refresh-token.service';
import { RefreshDto } from './dto/refresh.dto';

// constructor: private readonly refreshTokens: RefreshTokenService,

@Post('refresh')
async refresh(@Body() dto: RefreshDto) {
  return this.refreshTokens.rotate(dto.refreshToken);
}

@UseGuards(JwtAuthGuard)
@Post('logout')
async logout(@Body() dto: RefreshDto) {
  await this.refreshTokens.revoke(dto.refreshToken);
  return { ok: true };
}
```

(El endpoint `refresh` viejo basado en JWT debe ser reemplazado completamente.)

- [ ] **Step 4: Registrar en AuthModule**

```ts
RefreshTokenService,
```

- [ ] **Step 5: Frontend — usar refresh token en cookie/storage y rotar automáticamente**

En `frontend/src/services/auth.service.ts` agregar:

```ts
async refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await api.post('/auth/refresh', { refreshToken });
  return data;
}

async logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}
```

En el axios interceptor (`frontend/src/lib/axios.ts`), localizar el interceptor de response y manejar 401 rotando el refresh:

```ts
import axios from 'axios';

let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const rt = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (!rt) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1') + '/auth/refresh',
          { refreshToken: rt },
        );
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        pendingQueue.forEach((cb) => cb(data.accessToken));
        pendingQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
```

(Adaptar nombres de keys al que ya usa el proyecto. Inspeccionar `frontend/src/services/auth.service.ts` actual primero.)

En el handler de login del frontend, además de guardar `access_token` guardar también `refresh_token`. En logout, llamar a `authService.logout(rt)` antes de borrar localStorage.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/modules/auth/ frontend/src/lib/axios.ts frontend/src/services/auth.service.ts
git commit -m "feat(auth): refresh token rotation familiar — issuePair + endpoint /refresh con auto-refresh en frontend"
```

### Tarea 37: Rebuild + smoke test D.3

- [ ] **Step 1: Rebuild backend + frontend**

```powershell
docker compose --env-file .env.docker build backend frontend
docker compose --env-file .env.docker up -d --force-recreate backend frontend
```

- [ ] **Step 2: Login → guardar refresh token → rotar**

```powershell
$body = '{"email":"admin@turidove.com","password":"Admin123!"}'
$r = Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/login -Method Post -ContentType 'application/json' -Body $body
$rt = $r.data.refreshToken
$rt
```
Expected: string hexa de 96 chars.

Rotar:
```powershell
$r2 = Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/refresh -Method Post -ContentType 'application/json' -Body "{`"refreshToken`":`"$rt`"}"
$rt2 = $r2.refreshToken
$rt2
```
Expected: refresh token nuevo distinto.

- [ ] **Step 3: Reuso del viejo → debe fallar**

```powershell
try { Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/refresh -Method Post -ContentType 'application/json' -Body "{`"refreshToken`":`"$rt`"}" } catch { $_.Exception.Response.StatusCode }
```
Expected: 401 Unauthorized.

Verificar en BD que toda la familia quedó revocada:
```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT family, COUNT(*) FILTER (WHERE revoked_at IS NULL) AS activos FROM refresh_tokens GROUP BY family;"
```
Expected: la familia del attack tiene 0 activos.

- [ ] **Step 4: Sin commit. Fin de D.3.**

---

## Fase D.4 — Rate limiting por endpoint + CSP polish

> Objetivo: aplicar throttling específico a endpoints sensibles que aún no lo tienen, y revisar CSP.

### Tarea 38: Throttle decorators en endpoints sensibles

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Verificar que los endpoints críticos tienen throttle**

Endpoints que DEBEN tener `@Throttle`:

| Endpoint | Límite |
|---|---|
| `POST /auth/register` | 5 / min / IP |
| `POST /auth/login` | 5 / min / IP |
| `POST /auth/verify-email` | 10 / min / IP (ya puesto en D.1) |
| `POST /auth/resend-verification` | 3 / min / IP (ya puesto en D.1) |
| `POST /auth/password-reset/request` | 3 / 15min / IP (ya puesto en D.2) |
| `POST /auth/password-reset/confirm` | 10 / min / IP |
| `POST /auth/refresh` | 30 / min / IP |

Agregar a register y login que aún no tienen:

```ts
@Post('register')
@Throttle({ default: { limit: 5, ttl: 60_000 } })
async register(@Body() registerDto: RegisterDto) { ... }

@Post('login')
@Throttle({ default: { limit: 5, ttl: 60_000 } })
async login(@Body() loginDto: LoginDto, @Request() req: any) { ... }

@Post('refresh')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
async refresh(@Body() dto: RefreshDto) { ... }

@Post('password-reset/confirm')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
async pwResetConfirm(@Body() dto: PasswordResetConfirmDto) { ... }
```

- [ ] **Step 2: Throttle en webhook de Stripe (estricto)**

En `backend/src/modules/pagos/pagos.controller.ts`, el endpoint del webhook NO debe rate limitarse demasiado porque Stripe envía bursts. Pero tampoco abrirlo del todo. Aplicar:

```ts
@Post('webhook')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
async webhook(...) { ... }
```

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/auth/auth.controller.ts backend/src/modules/pagos/pagos.controller.ts
git commit -m "feat(security): rate limit por endpoint — register/login 5/min, refresh 30/min, password-reset 10/min"
```

### Tarea 39: Validar CSP + sanity checks

**Files:**
- Modify: `backend/src/main.ts` (si es necesario)

- [ ] **Step 1: Probar el frontend en navegador y revisar console**

Abrir http://localhost:3003 y verificar la pestaña Network/Console. Si Stripe Checkout no carga porque la CSP bloquea algo, agregar el origen faltante.

CSP actual debe permitir:
- `https://js.stripe.com` (script + frame)
- `https://api.stripe.com` (connect)
- `https://hooks.stripe.com` (frame)
- `https://checkout.stripe.com` (frame, agregar si falta)

Agregar `https://checkout.stripe.com` a `frameSrc` si falta:

```ts
frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com', 'https://checkout.stripe.com'],
```

- [ ] **Step 2: Verificar que /admin sigue funcionando**

Login admin, navegar a /admin/configuracion, /admin/configuracion/pasarela, /admin/pagos. Todo debe cargar sin errores de CSP en console.

- [ ] **Step 3: Commit (si hubo ajustes)**

```powershell
git add backend/src/main.ts
git commit -m "fix(security): agregar checkout.stripe.com a CSP frameSrc"
```

### Tarea 40: Rebuild + smoke test D.4

- [ ] **Step 1: Rebuild**

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d --force-recreate backend
```

- [ ] **Step 2: Test rate limit login**

```powershell
1..7 | ForEach-Object { try { Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"admin@turidove.com","password":"WRONG"}' } catch { Write-Host "Attempt $_ : $($_.Exception.Response.StatusCode)" } }
```
Expected: las primeras 5 retornan 401 (credenciales inválidas), la 6ª y 7ª retornan 429 Too Many Requests.

- [ ] **Step 3: Sin commit. Fin de D.4 y fin del bloque D.**

---

**Siguiente:** [Parte 5 — Observabilidad K.1](2026-06-04-opcion-c-robustez-produccion-part5.md)
