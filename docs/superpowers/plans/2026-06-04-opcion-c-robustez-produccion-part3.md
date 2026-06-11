# Opción C — Parte 3: Verify email + Password reset

> Continuación. Numeración sigue desde la Parte 2.

---

## Fase D.1 — Verify email obligatorio

> Objetivo: tras registro, el usuario recibe email con link de verificación. Login bloqueado si `emailVerifiedAt` es null. Usuarios pre-existentes quedan auto-verificados.

### Tarea 26: Schema — User.emailVerifiedAt + EmailVerification

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Modificar `model User`**

Agregar campo después de los demás campos:

```prisma
  emailVerifiedAt DateTime? @map("email_verified_at")
  emailVerifications EmailVerification[]
```

- [ ] **Step 2: Agregar modelo `EmailVerification`**

Al final del schema (cerca de los demás models):

```prisma
model EmailVerification {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash")
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("email_verifications")
}
```

- [ ] **Step 3: Crear migration**

```powershell
$ts = Get-Date -Format "yyyyMMddHHmmss"
$migDir = "backend/prisma/migrations/${ts}_email_verification"
New-Item -ItemType Directory -Path $migDir -Force | Out-Null
```

Crear `$migDir/migration.sql`:

```sql
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);

-- Auto-verificar usuarios pre-existentes (sus emails ya fueron confirmados manualmente)
UPDATE "users" SET "email_verified_at" = "updated_at" WHERE "email_verified_at" IS NULL;

CREATE TABLE "email_verifications" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verifications_token_hash_key" ON "email_verifications"("token_hash");
CREATE INDEX "email_verifications_user_id_idx" ON "email_verifications"("user_id");

ALTER TABLE "email_verifications"
  ADD CONSTRAINT "email_verifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
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
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL;"
```
Expected: igual al COUNT total de users (todos auto-verificados).

- [ ] **Step 5: Commit**

```powershell
git add backend/prisma/
git commit -m "feat(db): User.emailVerifiedAt + tabla email_verifications (users existentes auto-verificados)"
```

### Tarea 27: EmailVerificationService

**Files:**
- Create: `backend/src/modules/auth/services/email-verification.service.ts`

- [ ] **Step 1: Crear el service**

```ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { verifyEmailTemplate } from '../../mail/templates/verify-email';
import { welcomeTemplate } from '../../mail/templates/welcome';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Crea un token, lo persiste hasheado, y envía el email de verificación al usuario.
   */
  async sendVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no existe');

    // Invalidar tokens previos no usados
    await this.prisma.emailVerification.deleteMany({
      where: { userId, usedAt: null },
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlHours = parseInt(process.env.VERIFY_EMAIL_TOKEN_EXPIRATION_HOURS ?? '24', 10);
    const expiresAt = new Date(Date.now() + ttlHours * 3600_000);

    await this.prisma.emailVerification.create({
      data: { userId, tokenHash, expiresAt },
    });

    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3003';
    const url = `${baseUrl}/verify-email/${token}`;
    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';

    const email = verifyEmailTemplate({ nombre, url });
    await this.mail.send(user.email, email, 'verify-email');
  }

  /**
   * Verifica el token y marca emailVerifiedAt. Devuelve el user actualizado.
   */
  async verifyToken(token: string): Promise<{ userId: string }> {
    const tokenHash = this.hashToken(token);
    const verif = await this.prisma.emailVerification.findUnique({
      where: { tokenHash },
    });
    if (!verif) throw new BadRequestException('Token inválido');
    if (verif.usedAt) throw new BadRequestException('Token ya usado');
    if (verif.expiresAt < new Date()) throw new BadRequestException('Token expirado');

    const user = await this.prisma.user.update({
      where: { id: verif.userId },
      data: { emailVerifiedAt: new Date() },
    });

    await this.prisma.emailVerification.update({
      where: { id: verif.id },
      data: { usedAt: new Date() },
    });

    // Welcome email
    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    await this.mail.send(user.email, welcomeTemplate({ nombre }), 'welcome');

    return { userId: user.id };
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // silencioso (no leak)
    if (user.emailVerifiedAt) return; // ya verificado
    await this.sendVerification(user.id);
  }
}
```

- [ ] **Step 2: Commit**

```powershell
git add backend/src/modules/auth/services/email-verification.service.ts
git commit -m "feat(auth): EmailVerificationService con tokens hasheados, TTL y reenvío silencioso"
```

### Tarea 28: DTOs nuevos + endpoints auth verify

**Files:**
- Create: `backend/src/modules/auth/dto/verify-email.dto.ts`
- Create: `backend/src/modules/auth/dto/resend-verification.dto.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Crear DTOs**

`backend/src/modules/auth/dto/verify-email.dto.ts`:

```ts
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(32)
  token!: string;
}
```

`backend/src/modules/auth/dto/resend-verification.dto.ts`:

```ts
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  email!: string;
}
```

- [ ] **Step 2: Modificar `AuthService.register` para disparar verificación**

Localizar `async register(registerDto)` y al final, después de crear el user pero antes del return:

```ts
await this.emailVerification.sendVerification(newUser.id);
```

Inyectar `EmailVerificationService` en el constructor.

- [ ] **Step 3: Modificar `AuthService.login` para bloquear sin verificar**

En el método `login`, después de validar credenciales y antes de generar el token:

```ts
if (!user.emailVerifiedAt) {
  throw new ForbiddenException({
    message: 'Debes verificar tu email antes de iniciar sesión',
    code: 'EMAIL_NOT_VERIFIED',
    email: user.email,
  });
}
```

Importar `ForbiddenException` de `@nestjs/common`.

- [ ] **Step 4: Agregar endpoints al controller**

En `auth.controller.ts`:

```ts
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { EmailVerificationService } from './services/email-verification.service';
import { Throttle } from '@nestjs/throttler';

// inyectar en constructor:
// private readonly emailVerif: EmailVerificationService,

@Post('verify-email')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
async verifyEmail(@Body() dto: VerifyEmailDto) {
  return this.emailVerif.verifyToken(dto.token);
}

@Post('resend-verification')
@Throttle({ default: { limit: 3, ttl: 60_000 } })
async resendVerification(@Body() dto: ResendVerificationDto) {
  await this.emailVerif.resendVerification(dto.email);
  return { ok: true }; // siempre OK (no leak de existencia)
}
```

- [ ] **Step 5: Registrar servicio en AuthModule**

```ts
import { EmailVerificationService } from './services/email-verification.service';

// providers:
EmailVerificationService,
```

(MailModule ya es @Global, no requiere import explícito).

- [ ] **Step 6: Commit**

```powershell
git add backend/src/modules/auth/
git commit -m "feat(auth): verify email obligatorio — register dispara, login bloquea sin verificar, endpoints + resend"
```

### Tarea 29: Frontend — manejar EMAIL_NOT_VERIFIED en login

**Files:**
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Create: `frontend/src/app/(auth)/verify-email/[token]/page.tsx`
- Create: `frontend/src/app/(auth)/verify-email/page.tsx`
- Modify: `frontend/src/services/auth.service.ts`

- [ ] **Step 1: Auth service**

Agregar a `frontend/src/services/auth.service.ts`:

```ts
async verifyEmail(token: string): Promise<{ userId: string }> {
  const { data } = await api.post('/auth/verify-email', { token });
  return data;
}

async resendVerification(email: string): Promise<{ ok: boolean }> {
  const { data } = await api.post('/auth/resend-verification', { email });
  return data;
}
```

- [ ] **Step 2: Crear pagina `/verify-email/[token]` (auto-verifica al abrir)**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function VerifyEmailTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    authService
      .verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch((e: any) => {
        setStatus('fail');
        setError(e?.response?.data?.message ?? 'Token inválido o expirado');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-gold-500 mx-auto animate-spin" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800">Verificando tu email...</h1>
          </>
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800">¡Email verificado!</h1>
            <p className="mt-2 text-sm text-navy-400 font-body">Tu cuenta está lista. Ya puedes iniciar sesión.</p>
            <button onClick={() => router.push('/login')} className="mt-5 inline-flex px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold">
              Ir al login
            </button>
          </>
        )}
        {status === 'fail' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800">No se pudo verificar</h1>
            <p className="mt-2 text-sm text-navy-400 font-body">{error}</p>
            <button onClick={() => router.push('/verify-email')} className="mt-5 inline-flex px-5 py-2 rounded-full border border-navy-200 text-sm text-navy-700">
              Solicitar nuevo link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear pagina `/verify-email` (reenviar link)**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';

export default function ResendVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resendVerification(email);
      toast.success('Si el email existe, te enviamos un link de verificación.');
      router.push('/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white rounded-2xl shadow-card p-8">
        <Mail className="w-10 h-10 text-gold-500 mx-auto" />
        <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">Reenviar verificación</h1>
        <p className="mt-2 text-sm text-navy-400 font-body text-center">
          Te enviaremos un nuevo link de verificación si la cuenta existe.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
          className="mt-5 w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Reenviar'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: En login page, capturar 403 EMAIL_NOT_VERIFIED**

Localizar el handler del submit en `frontend/src/app/(auth)/login/page.tsx`. En el catch:

```tsx
} catch (e: any) {
  const status = e?.response?.status;
  const code = e?.response?.data?.code;
  const email = e?.response?.data?.email;
  if (status === 403 && code === 'EMAIL_NOT_VERIFIED') {
    toast((t) => (
      <div className="text-sm">
        Debes verificar tu email antes de iniciar sesión.{' '}
        <button
          onClick={() => {
            authService.resendVerification(email);
            toast.dismiss(t.id);
            toast.success('Te reenviamos el link');
          }}
          className="underline text-gold-600"
        >
          Reenviar link
        </button>
      </div>
    ), { duration: 8000 });
  } else {
    toast.error(e?.response?.data?.message ?? 'Error al iniciar sesión');
  }
}
```

(Asegurar que `authService` esté importado.)

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/services/auth.service.ts frontend/src/app/'(auth)'/verify-email frontend/src/app/'(auth)'/login
git commit -m "feat(frontend): paginas verify-email + manejo 403 EMAIL_NOT_VERIFIED en login con resend"
```

### Tarea 30: Rebuild + smoke test D.1

- [ ] **Step 1: Rebuild backend + frontend**

```powershell
docker compose --env-file .env.docker build backend frontend
docker compose --env-file .env.docker up -d --force-recreate backend frontend
```

- [ ] **Step 2: Test registro → debe disparar email**

(Sin Resend configurado, el envío falla pero queda en email_logs.)

```powershell
Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/register -Method Post -ContentType 'application/json' -Body '{"email":"testverif@example.com","password":"Test1234!","nombre":"Test","apellido":"Verif"}'
```
Expected: respuesta exitosa.

Verificar email_logs:
```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT to_email, template, status, error_msg FROM email_logs ORDER BY created_at DESC LIMIT 5;"
```
Expected: row con `template=verify-email`, status probablemente `failed` (sin provider) o `sent` si ya configuraste Resend.

- [ ] **Step 3: Test login bloqueado**

```powershell
try { Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"testverif@example.com","password":"Test1234!"}' } catch { $_.Exception.Response.StatusCode; $_.ErrorDetails.Message }
```
Expected: 403 Forbidden con código EMAIL_NOT_VERIFIED.

- [ ] **Step 4: Verificar manualmente vía SQL**

```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "UPDATE users SET email_verified_at = NOW() WHERE email = 'testverif@example.com';"
```

Reintentar login: ahora debe retornar 200 con token.

- [ ] **Step 5: Sin commit. Fin de D.1.**

---

## Fase D.2 — Password reset

### Tarea 31: Schema PasswordReset

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Agregar al User el inverse relation**

Dentro de `model User`:
```prisma
passwordResets PasswordReset[]
```

- [ ] **Step 2: Agregar modelo**

```prisma
model PasswordReset {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash")
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("password_resets")
}
```

- [ ] **Step 3: Migration**

```powershell
$ts = Get-Date -Format "yyyyMMddHHmmss"
$migDir = "backend/prisma/migrations/${ts}_password_reset"
New-Item -ItemType Directory -Path $migDir -Force | Out-Null
```

```sql
CREATE TABLE "password_resets" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_resets_token_hash_key" ON "password_resets"("token_hash");
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

ALTER TABLE "password_resets"
  ADD CONSTRAINT "password_resets_user_id_fkey"
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
git commit -m "feat(db): tabla password_resets con token hash y TTL"
```

### Tarea 32: PasswordResetService + endpoints + UI

**Files:**
- Create: `backend/src/modules/auth/services/password-reset.service.ts`
- Create: `backend/src/modules/auth/dto/password-reset-request.dto.ts`
- Create: `backend/src/modules/auth/dto/password-reset-confirm.dto.ts`
- Create: `backend/src/modules/auth/dto/change-password.dto.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`
- Create: `frontend/src/app/(auth)/password-reset/page.tsx`
- Create: `frontend/src/app/(auth)/password-reset/[token]/page.tsx`

- [ ] **Step 1: PasswordResetService**

```ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { passwordResetTemplate } from '../../mail/templates/password-reset';
import { passwordChangedTemplate } from '../../mail/templates/password-changed';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private hashToken(t: string): string {
    return createHash('sha256').update(t).digest('hex');
  }

  async request(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // silencioso

    await this.prisma.passwordReset.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const token = randomBytes(32).toString('hex');
    const ttlHours = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRATION_HOURS ?? '1', 10);
    const expiresAt = new Date(Date.now() + ttlHours * 3600_000);

    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash: this.hashToken(token), expiresAt },
    });

    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3003';
    const url = `${baseUrl}/password-reset/${token}`;
    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    const email_ = passwordResetTemplate({ nombre, url });
    await this.mail.send(user.email, email_, 'password-reset');
  }

  async confirm(token: string, newPassword: string): Promise<void> {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!reset) throw new BadRequestException('Token inválido');
    if (reset.usedAt) throw new BadRequestException('Token ya usado');
    if (reset.expiresAt < new Date()) throw new BadRequestException('Token expirado');

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await this.prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashed },
    });

    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    await this.mail.send(user.email, passwordChangedTemplate({ nombre }), 'password-changed');
  }

  async changeOwnPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no existe');
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new BadRequestException('La contraseña actual no es correcta');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    await this.mail.send(user.email, passwordChangedTemplate({ nombre }), 'password-changed');
  }
}
```

- [ ] **Step 2: DTOs**

`password-reset-request.dto.ts`:
```ts
import { IsEmail } from 'class-validator';
export class PasswordResetRequestDto {
  @IsEmail() email!: string;
}
```

`password-reset-confirm.dto.ts`:
```ts
import { IsString, MinLength, Matches } from 'class-validator';
export class PasswordResetConfirmDto {
  @IsString() @MinLength(32) token!: string;
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'La contraseña debe tener mayúscula, minúscula y número' })
  newPassword!: string;
}
```

`change-password.dto.ts`:
```ts
import { IsString, MinLength, Matches } from 'class-validator';
export class ChangePasswordDto {
  @IsString() @MinLength(1) currentPassword!: string;
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'La contraseña debe tener mayúscula, minúscula y número' })
  newPassword!: string;
}
```

- [ ] **Step 3: Endpoints en auth.controller.ts**

```ts
import { PasswordResetService } from './services/password-reset.service';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Throttle } from '@nestjs/throttler';

// Inyectar en constructor: private readonly passwordReset: PasswordResetService,

@Post('password-reset/request')
@Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
async pwResetRequest(@Body() dto: PasswordResetRequestDto) {
  await this.passwordReset.request(dto.email);
  return { ok: true };
}

@Post('password-reset/confirm')
async pwResetConfirm(@Body() dto: PasswordResetConfirmDto) {
  await this.passwordReset.confirm(dto.token, dto.newPassword);
  return { ok: true };
}

@UseGuards(JwtAuthGuard)
@Post('change-password')
async changePassword(@Body() dto: ChangePasswordDto, @Request() req: any) {
  await this.passwordReset.changeOwnPassword(req.user.id, dto.currentPassword, dto.newPassword);
  return { ok: true };
}
```

- [ ] **Step 4: Registrar en AuthModule providers**

```ts
PasswordResetService,
```

- [ ] **Step 5: Frontend page `/password-reset` (solicitar)**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';

export default function PasswordResetRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', { email });
      toast.success('Si el email existe, te enviamos un link de recuperación.');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <form onSubmit={submit} className="max-w-md w-full bg-white rounded-2xl shadow-card p-8">
        <KeyRound className="w-10 h-10 text-gold-500 mx-auto" />
        <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-navy-400 font-body text-center">
          Ingresa tu email y te enviaremos un link para crear una nueva contraseña.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
          className="mt-5 w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Frontend page `/password-reset/[token]` (nueva contraseña)**

```tsx
'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';

export default function PasswordResetConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, newPassword: pw });
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      router.push('/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <form onSubmit={submit} className="max-w-md w-full bg-white rounded-2xl shadow-card p-8">
        <KeyRound className="w-10 h-10 text-gold-500 mx-auto" />
        <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">Nueva contraseña</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          minLength={8}
          placeholder="Nueva contraseña (mín 8, May/min/núm)"
          className="mt-5 w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
        />
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          required
          placeholder="Confirmar"
          className="mt-3 w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 7: Agregar link "Olvidé mi contraseña" en login**

En `frontend/src/app/(auth)/login/page.tsx`, debajo del input de password agregar:

```tsx
<div className="mt-2 text-right">
  <a href="/password-reset" className="text-xs text-gold-600 hover:underline">¿Olvidaste tu contraseña?</a>
</div>
```

- [ ] **Step 8: Commit**

```powershell
git add backend/src/modules/auth/ frontend/src/app/'(auth)'/password-reset frontend/src/app/'(auth)'/login
git commit -m "feat(auth): password reset flow — request + confirm + change-password + UI"
```

### Tarea 33: Rebuild + smoke test D.2

- [ ] **Step 1: Rebuild + recreate**

```powershell
docker compose --env-file .env.docker build backend frontend
docker compose --env-file .env.docker up -d --force-recreate backend frontend
```

- [ ] **Step 2: Test request**

```powershell
Invoke-RestMethod -Uri http://localhost:3002/api/v1/auth/password-reset/request -Method Post -ContentType 'application/json' -Body '{"email":"admin@turidove.com"}'
```
Expected: `{ ok: true }`. Verificar en email_logs row con `template=password-reset`.

- [ ] **Step 3: Obtener el token desde la BD (testing local)**

```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT id, token_hash, expires_at FROM password_resets ORDER BY created_at DESC LIMIT 1;"
```
(No podemos invertir el hash; para testing usar la UI con el link real que llegue cuando Resend esté configurado, o forzar manual.)

- [ ] **Step 4: Sin commit. Fin de D.2.**

---

**Siguiente:** [Parte 4 — Refresh tokens + Rate limiting endpoint-level](2026-06-04-opcion-c-robustez-produccion-part4.md)
