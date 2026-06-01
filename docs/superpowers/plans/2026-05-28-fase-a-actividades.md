# Fase A — Endurecimiento de Actividades

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar el módulo de Actividades al nivel funcional del plan turitravel_v2 incorporando slug SEO, estado de publicación, categorías como tabla editable, imagen principal designada e itinerario multi-día, **preservando** la estructura modular tradicional NestJS y las features distintivas de TuriDove (tarifas por temporada/edad/grupo, calendario, requisitos, PaqueteActividad anidado).

**Architecture:** Cambios incrementales sobre la estructura actual (`backend/src/modules/actividades/{controller,service,dto}` + `frontend/src/app/admin/actividades`). Una migración Prisma única que: agrega `slug`/`estado`/`imagenPrincipal` a `Actividad`, crea `CategoriaActividad` + `ItinerarioActividad`, hace data migration del enum `TipoActividad` → FK `categoriaId`, y del boolean `activo` → enum `EstadoActividad`. Frontend público pasa a usar `/actividades/[slug]` con redirect 301 desde `/actividades/[id]`.

**Tech Stack:** NestJS 10 + Prisma 5 + PostgreSQL 18 + Next.js 15 (App Router) + Tailwind 3 + Zod + React Hook Form.

**Spec de referencia:** [docs/superpowers/specs/2026-05-28-gap-analysis-y-plan-evolutivo.md](../specs/2026-05-28-gap-analysis-y-plan-evolutivo.md) sección 3.1 + Fase A.

---

## Convenciones del plan

- **Working directory:** `c:\ServBay\www\TuriDove_VK`. Todos los paths son relativos a esa raíz.
- **Docker corriendo.** Contenedores: `turidove_vk_api` (backend), `turidove_vk_web` (frontend), `turidove_vk_db` (postgres). Puertos host: backend `3002`, frontend `3003`, postgres `5435`. DB: `turidove_vk`.
- **Backend image build-time:** después de cambios en `backend/src/*` se necesita `docker compose --env-file .env.docker build backend` + `up -d --force-recreate backend` (~2-3 min). Estrategia: agrupar cambios y rebuild una sola vez al final del grupo.
- **Frontend image build-time:** después de cambios en `frontend/src/*` se necesita `docker compose --env-file .env.docker build frontend` + `up -d --force-recreate frontend` (~30-60s).
- **Prisma migrations en contenedor:** los archivos en `backend/prisma/migrations/` están montados implícitamente por el dump SQL; para correr migraciones se copian al contenedor con `docker cp` o se ejecutan después del rebuild.
- **Verificación:** prefiero `curl` + `psql` por encima de levantar el navegador. Frontend manual al final de cada bloque.
- **Commits frecuentes** en español, formato convencional. NO push a remote en este plan (lo decide el usuario al final).

---

## Decisiones tomadas

1. **Categorías:** reemplazo total. Enum `TipoActividad` se elimina; tabla `CategoriaActividad` lo reemplaza con FK. Data migration mapea los 6 valores existentes 1:1.
2. **Estado:** reemplazar boolean `activo` por enum `EstadoActividad { DRAFT | ACTIVE | INACTIVE }`. Data migration: `activo:true → ACTIVE`, `activo:false → INACTIVE`. Las queries actuales que filtran `activo: true` se cambian a `estado: 'ACTIVE'`.
3. **Slug:** generado server-side por backend usando `slugify(nombre + provincia)` con verificación de unicidad y sufijo numérico si colisiona.
4. **Itinerario:** modelo nuevo `ItinerarioActividad` con `@@unique([actividadId, dia])`. Coordenadas opcionales validadas en rangos `[-90,90]` y `[-180,180]`.
5. **Imagen principal:** campo `imagenPrincipal String?` nuevo. Sin migración de datos automática (queda `null` por defecto). El admin la define al editar; en frontend se usa fallback `imagenPrincipal || imagenes[0]`.
6. **Route público:** `/actividades/[slug]` queda como ruta canónica. `/actividades/[id]` se reescribe a usar slug si el param es un UUID (busca el slug y redirect 301 a `/actividades/[slug]`).

---

## Estructura de archivos

### Archivos NUEVOS

**Backend — Prisma:**
- `backend/prisma/migrations/<timestamp>_actividades_v2/migration.sql` — generado por `prisma migrate dev`.

**Backend — módulo Actividades:**
- `backend/src/modules/actividades/dto/create-categoria.dto.ts`
- `backend/src/modules/actividades/dto/update-categoria.dto.ts`
- `backend/src/modules/actividades/dto/itinerario-item.dto.ts`
- `backend/src/modules/actividades/dto/update-itinerario.dto.ts`
- `backend/src/modules/actividades/categorias.controller.ts`
- `backend/src/modules/actividades/categorias.service.ts`
- `backend/src/modules/actividades/itinerario.controller.ts`
- `backend/src/modules/actividades/itinerario.service.ts`
- `backend/src/common/utils/slug.util.ts` — helper de generación de slugs

**Frontend — admin categorías:**
- `frontend/src/services/categorias-actividad.service.ts`
- `frontend/src/types/categoria-actividad.ts`
- `frontend/src/app/admin/actividades/categorias/page.tsx`

**Frontend — itinerario:**
- `frontend/src/services/itinerario.service.ts`
- `frontend/src/types/itinerario.ts`
- `frontend/src/components/actividades/itinerario-editor.tsx`
- `frontend/src/components/actividades/itinerario-timeline.tsx`

### Archivos MODIFICADOS

**Backend:**
- `backend/prisma/schema.prisma` — agrega modelos `CategoriaActividad`, `ItinerarioActividad`, enum `EstadoActividad`; modifica `Actividad`; elimina enum `TipoActividad`.
- `backend/prisma/seed-turidove.ts` — actualiza seed para crear 6 categorías y asignarlas a las actividades existentes.
- `backend/src/modules/actividades/actividades.module.ts` — registra nuevos controllers y services.
- `backend/src/modules/actividades/actividades.controller.ts` — agrega endpoint `GET /actividades/slug/:slug` y query por categoriaId.
- `backend/src/modules/actividades/actividades.service.ts` — refactor para usar `categoriaId`/`estado`/`slug`/`imagenPrincipal`.
- `backend/src/modules/actividades/dto/create-actividad.dto.ts` — reemplaza `tipo: TipoActividad` por `categoriaId: string`, agrega `imagenPrincipal?`.
- `backend/src/modules/actividades/dto/update-actividad.dto.ts` — hereda el cambio.

**Frontend:**
- `frontend/src/types/index.ts` — agrega `EstadoActividad`, `CategoriaActividad`, `ItinerarioItem`; cambia `Actividad.tipo` por `Actividad.categoriaId` + `categoria?`; agrega `estado`, `slug`, `imagenPrincipal`.
- `frontend/src/services/actividades.service.ts` — adapta payloads (de `tipo` a `categoriaId`, de `activo` a `estado`).
- `frontend/src/app/admin/actividades/page.tsx` — lista con badge de estado/categoría editable, filtros, link a categorías.
- `frontend/src/app/(public)/actividades/page.tsx` — listing usa categorías desde API.
- `frontend/src/app/(public)/actividades/[id]/page.tsx` — pasa a usar slug + redirect si recibe UUID + render itinerario.
- `frontend/src/components/admin/sidebar.tsx` — agrega item "Categorías" bajo Actividades (si existe agrupación; sino, ajuste menor).
- `frontend/src/lib/site-config.ts` — sin cambio (queda como está).

---

## Tareas

### Tarea 1: Schema Prisma — agregar modelos y enum

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Leer el schema actual**

```powershell
Get-Content backend/prisma/schema.prisma | Select-String -Pattern "TipoActividad|model Actividad" -Context 0,40 | Select-Object -First 80
```
Expected: muestra el enum `TipoActividad` con 6 valores y el `model Actividad` con campo `tipo TipoActividad` y `activo Boolean`.

- [ ] **Step 2: Agregar enum `EstadoActividad`**

Justo después del bloque `enum Temporada { ... }`, agregar:

```prisma
enum EstadoActividad {
  DRAFT
  ACTIVE
  INACTIVE
}
```

- [ ] **Step 3: Agregar modelos `CategoriaActividad` e `ItinerarioActividad`**

Antes del `model Actividad`, agregar:

```prisma
model CategoriaActividad {
  id          String   @id @default(uuid())
  nombre      String   @unique
  slug        String   @unique
  icono       String?
  descripcion String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  actividades Actividad[]

  @@map("categorias_actividad")
}

model ItinerarioActividad {
  id             String   @id @default(uuid())
  actividadId    String   @map("actividad_id")
  dia            Int
  titulo         String
  descripcion    String
  lat            Float?
  lng            Float?
  nombreUbicacion String? @map("nombre_ubicacion")
  createdAt      DateTime @default(now()) @map("created_at")

  actividad Actividad @relation(fields: [actividadId], references: [id], onDelete: Cascade)

  @@unique([actividadId, dia])
  @@index([actividadId])
  @@map("itinerario_actividad")
}
```

- [ ] **Step 4: Modificar `model Actividad`**

Reemplazar el bloque actual `model Actividad { ... }` por:

```prisma
model Actividad {
  id               String          @id @default(uuid())
  nombre           String
  slug             String          @unique
  descripcion      String
  categoriaId      String          @map("categoria_id")
  duracionHoras    Float           @map("duracion_horas")
  ubicacion        String
  provincia        String
  distrito         String
  imagenPrincipal  String?         @map("imagen_principal")
  imagenes         String[]
  incluye          String[]
  noIncluye        String[]        @map("no_incluye")
  requisitos       String[]
  edadMinima       Int             @default(0) @map("edad_minima")
  capacidadMaxima  Int             @map("capacidad_maxima")
  estado           EstadoActividad @default(DRAFT)
  proveedorId      String          @map("proveedor_id")
  isFeatured       Boolean         @default(false) @map("is_featured")
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  categoria          CategoriaActividad    @relation(fields: [categoriaId], references: [id])
  proveedor          User                  @relation(fields: [proveedorId], references: [id], onDelete: Cascade)
  tarifas            TarifaActividad[]
  paquetes           PaqueteActividad[]
  calendarios        CalendarioActividad[]
  itinerario         ItinerarioActividad[]
  reservaActividades ReservaActividad[]
  paquetesTuridove   Paquete[]             @relation("PaquetesTuridoveActividad")

  @@index([proveedorId])
  @@index([provincia])
  @@index([categoriaId])
  @@index([estado])
  @@index([slug])
  @@map("actividades")
}
```

Cambios: `tipo TipoActividad` → `categoriaId String`; `activo Boolean` → `estado EstadoActividad`; agregado `slug String @unique`, `imagenPrincipal String?`; nueva relación `categoria` y `itinerario`; índice por `tipo` → por `categoriaId`/`estado`/`slug`.

- [ ] **Step 5: Eliminar enum `TipoActividad`**

Borrar el bloque:

```prisma
enum TipoActividad {
  AVENTURA
  CULTURAL
  GASTRONOMICA
  NATURALEZA
  EDUCATIVA
  DEPORTIVA
}
```

- [ ] **Step 6: Verificar formateo del schema**

```powershell
docker exec turidove_vk_api npx prisma format
```
Expected: `Formatted /app/prisma/schema.prisma`.

Si el container no tiene la versión actualizada del schema, primero copiarla:

```powershell
docker cp backend/prisma/schema.prisma turidove_vk_api:/app/prisma/schema.prisma
docker exec turidove_vk_api npx prisma format
```
Luego copiar el formateado de vuelta:

```powershell
docker cp turidove_vk_api:/app/prisma/schema.prisma backend/prisma/schema.prisma
```

- [ ] **Step 7: Commit**

```powershell
git add backend/prisma/schema.prisma
git commit -m "feat(db): schema actividades v2 - slug, estado, categorias, itinerario"
```

### Tarea 2: Migración Prisma con data migration

**Files:**
- Create: `backend/prisma/migrations/<timestamp>_actividades_v2/migration.sql`

- [ ] **Step 1: Generar la migración bajo el contenedor**

```powershell
docker cp backend/prisma/schema.prisma turidove_vk_api:/app/prisma/schema.prisma
docker exec turidove_vk_api npx prisma migrate dev --name actividades_v2 --create-only
```
Expected: crea el directorio `prisma/migrations/<timestamp>_actividades_v2/` con `migration.sql`.

`--create-only` evita aplicar inmediatamente — necesitamos editar el SQL antes para añadir la data migration.

- [ ] **Step 2: Copiar la migración al host**

```powershell
$migDir = docker exec turidove_vk_api sh -c "ls -1 /app/prisma/migrations | grep actividades_v2"
docker cp turidove_vk_api:/app/prisma/migrations/$migDir backend/prisma/migrations/$migDir
```

- [ ] **Step 3: Inspeccionar la migración generada**

```powershell
Get-ChildItem backend/prisma/migrations | Where-Object Name -like "*actividades_v2*" | Select-Object -ExpandProperty FullName
Get-Content "backend/prisma/migrations/<migDir>/migration.sql"
```
Expected: contiene DROP enum/index, CREATE TABLE para `categorias_actividad` e `itinerario_actividad`, ALTER TABLE actividades para agregar `slug`/`estado`/`imagen_principal`/`categoria_id` y soltar `tipo`/`activo`.

**Probablemente la migración auto-generada NO incluye data migration**. Prisma migrate dev solo genera DDL. Hay que reescribirla en parte.

- [ ] **Step 4: Reescribir la migración para incluir data migration segura**

Reemplazar el contenido del archivo `backend/prisma/migrations/<timestamp>_actividades_v2/migration.sql` por (en este orden):

```sql
-- ====================================================================
-- Migración: actividades_v2
-- Cambios:
--   1. Crea tabla categorias_actividad y siembra 6 categorías iniciales
--   2. Crea tabla itinerario_actividad (vacía)
--   3. Agrega columnas slug, imagen_principal, categoria_id, estado a actividades
--   4. Pobla slug (slugify del nombre con sufijo si colisiona) y categoria_id (mapeado desde tipo)
--   5. Pobla estado a partir de activo
--   6. Suelta tipo y activo, suelta el enum TipoActividad
-- ====================================================================

-- (1) Crear tipo enum EstadoActividad
CREATE TYPE "EstadoActividad" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- (2) Crear tabla categorias_actividad
CREATE TABLE "categorias_actividad" (
  "id"          TEXT NOT NULL,
  "nombre"      TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "icono"       TEXT,
  "descripcion" TEXT,
  "activo"      BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categorias_actividad_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categorias_actividad_nombre_key" ON "categorias_actividad"("nombre");
CREATE UNIQUE INDEX "categorias_actividad_slug_key" ON "categorias_actividad"("slug");

-- (3) Seed: 6 categorías con UUIDs deterministas (mapean 1:1 con el enum TipoActividad)
INSERT INTO "categorias_actividad" ("id", "nombre", "slug", "icono", "activo", "created_at", "updated_at") VALUES
  ('00000000-0000-0000-0000-000000000001', 'Aventura',     'aventura',     'mountain',    true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Cultural',     'cultural',     'users',       true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Gastronómica', 'gastronomica', 'sun',         true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Naturaleza',   'naturaleza',   'tree-pine',   true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Educativa',    'educativa',    'graduation-cap', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006', 'Deportiva',    'deportiva',    'waves',       true, NOW(), NOW());

-- (4) Crear tabla itinerario_actividad
CREATE TABLE "itinerario_actividad" (
  "id"               TEXT NOT NULL,
  "actividad_id"     TEXT NOT NULL,
  "dia"              INTEGER NOT NULL,
  "titulo"           TEXT NOT NULL,
  "descripcion"      TEXT NOT NULL,
  "lat"              DOUBLE PRECISION,
  "lng"              DOUBLE PRECISION,
  "nombre_ubicacion" TEXT,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "itinerario_actividad_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "itinerario_actividad_actividad_id_dia_key" ON "itinerario_actividad"("actividad_id", "dia");
CREATE INDEX "itinerario_actividad_actividad_id_idx" ON "itinerario_actividad"("actividad_id");

-- (5) Modificar tabla actividades: agregar columnas (nullable temporalmente para poder migrar)
ALTER TABLE "actividades"
  ADD COLUMN "slug"             TEXT,
  ADD COLUMN "imagen_principal" TEXT,
  ADD COLUMN "categoria_id"     TEXT,
  ADD COLUMN "estado"           "EstadoActividad";

-- (6) Mapear tipo (enum) → categoria_id (FK) usando los UUIDs deterministas anteriores
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000001' WHERE "tipo" = 'AVENTURA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000002' WHERE "tipo" = 'CULTURAL';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000003' WHERE "tipo" = 'GASTRONOMICA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000004' WHERE "tipo" = 'NATURALEZA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000005' WHERE "tipo" = 'EDUCATIVA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000006' WHERE "tipo" = 'DEPORTIVA';

-- (7) Mapear activo (boolean) → estado (enum)
UPDATE "actividades" SET "estado" = 'ACTIVE'   WHERE "activo" = true;
UPDATE "actividades" SET "estado" = 'INACTIVE' WHERE "activo" = false;

-- (8) Generar slugs únicos a partir del nombre.
--     Estrategia: lowercase + reemplaza espacios y caracteres no [a-z0-9] por '-', con dedup por sufijo numérico.
--     Usamos regex_replace + un sufijo del id como suffix natural (sin colisiones).
UPDATE "actividades"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE("nombre",
        'áéíóúÁÉÍÓÚñÑüÜ',
        'aeiouAEIOUnNuU'
      ),
      '[^a-zA-Z0-9]+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
) || '-' || SUBSTRING("id" FROM 1 FOR 6);

-- (9) Hacer NOT NULL las columnas pobladas
ALTER TABLE "actividades"
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "categoria_id" SET NOT NULL,
  ALTER COLUMN "estado" SET NOT NULL;

-- (10) Constraints e índices
CREATE UNIQUE INDEX "actividades_slug_key" ON "actividades"("slug");
CREATE INDEX "actividades_categoria_id_idx" ON "actividades"("categoria_id");
CREATE INDEX "actividades_estado_idx" ON "actividades"("estado");
CREATE INDEX "actividades_slug_idx" ON "actividades"("slug");
ALTER TABLE "actividades"
  ADD CONSTRAINT "actividades_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "itinerario_actividad"
  ADD CONSTRAINT "itinerario_actividad_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- (11) Soltar el viejo índice por tipo (si existe), columna tipo, columna activo y enum
DROP INDEX IF EXISTS "actividades_tipo_idx";
ALTER TABLE "actividades" DROP COLUMN "tipo";
ALTER TABLE "actividades" DROP COLUMN "activo";
DROP TYPE "TipoActividad";
```

- [ ] **Step 5: Copiar la migración corregida al contenedor**

```powershell
$migDir = (Get-ChildItem backend/prisma/migrations | Where-Object Name -like "*actividades_v2*" | Select-Object -First 1).Name
docker cp "backend/prisma/migrations/$migDir/migration.sql" "turidove_vk_api:/app/prisma/migrations/$migDir/migration.sql"
```

- [ ] **Step 6: Aplicar la migración**

```powershell
docker exec turidove_vk_api npx prisma migrate deploy
```
Expected: `Applying migration <timestamp>_actividades_v2` + `1 migration applied`.

Si falla por integridad de datos preexistentes (ej. una actividad sin tipo), inspeccionar y arreglar a mano antes de reintentar.

- [ ] **Step 7: Regenerar Prisma Client en el contenedor**

```powershell
docker exec turidove_vk_api npx prisma generate
```
Expected: `Generated Prisma Client (v5.x) to ./node_modules/@prisma/client`.

- [ ] **Step 8: Verificar la BD**

```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -c "SELECT count(*) AS categorias FROM categorias_actividad; SELECT count(*) FILTER (WHERE slug IS NOT NULL) AS con_slug, count(*) AS total FROM actividades; SELECT estado, count(*) FROM actividades GROUP BY estado;"
```
Expected:
- `categorias` = 6.
- `con_slug` = `total` (todas las actividades tienen slug poblado).
- Filas por `estado` (ACTIVE para las que estaban activas, INACTIVE para las que no).

- [ ] **Step 9: Commit**

```powershell
git add backend/prisma/migrations/
git commit -m "feat(db): migracion actividades_v2 con data migration"
```

### Tarea 3: Helper `slug.util.ts` y test unitario

**Files:**
- Create: `backend/src/common/utils/slug.util.ts`
- Create: `backend/src/common/utils/slug.util.spec.ts`

- [ ] **Step 1: Crear el test (RED)**

`backend/src/common/utils/slug.util.spec.ts`:

```ts
import { slugify, ensureUniqueSlug } from './slug.util';

describe('slugify', () => {
  it('convierte espacios a guiones', () => {
    expect(slugify('Tour por cafetales')).toBe('tour-por-cafetales');
  });

  it('elimina tildes y caracteres no ASCII', () => {
    expect(slugify('Caminata al Volcán Barú')).toBe('caminata-al-volcan-baru');
  });

  it('colapsa múltiples separadores', () => {
    expect(slugify('Tour --- por  el  café')).toBe('tour-por-el-cafe');
  });

  it('recorta guiones al inicio y al final', () => {
    expect(slugify('-Hola Mundo-')).toBe('hola-mundo');
  });

  it('maneja strings vacíos como string vacío', () => {
    expect(slugify('')).toBe('');
  });

  it('preserva números', () => {
    expect(slugify('Tour 24h')).toBe('tour-24h');
  });
});

describe('ensureUniqueSlug', () => {
  it('devuelve el slug original si no existe', async () => {
    const existsFn = jest.fn().mockResolvedValue(false);
    const result = await ensureUniqueSlug('tour-cafe', existsFn);
    expect(result).toBe('tour-cafe');
    expect(existsFn).toHaveBeenCalledWith('tour-cafe');
  });

  it('agrega sufijo -2 si el slug existe', async () => {
    const existsFn = jest
      .fn()
      .mockResolvedValueOnce(true)   // 'tour-cafe' existe
      .mockResolvedValueOnce(false); // 'tour-cafe-2' no existe
    const result = await ensureUniqueSlug('tour-cafe', existsFn);
    expect(result).toBe('tour-cafe-2');
  });

  it('incrementa el sufijo hasta encontrar uno libre', async () => {
    const existsFn = jest
      .fn()
      .mockResolvedValueOnce(true)   // 'tour' existe
      .mockResolvedValueOnce(true)   // 'tour-2' existe
      .mockResolvedValueOnce(true)   // 'tour-3' existe
      .mockResolvedValueOnce(false); // 'tour-4' libre
    const result = await ensureUniqueSlug('tour', existsFn);
    expect(result).toBe('tour-4');
  });
});
```

- [ ] **Step 2: Verificar que falla (sin implementación todavía)**

```powershell
docker cp backend/src/common/utils/ turidove_vk_api:/app/src/common/utils/
docker exec turidove_vk_api npm test -- slug.util.spec 2>&1 | Select-String -Pattern "PASS|FAIL"
```
Expected: FAIL — no se puede importar `./slug.util`.

Si el contenedor no tiene los archivos de test config o el watcher complica, alternativa: instalar deps localmente y correr `npm test` en `backend/` localmente. Si tampoco funciona, anotar como DONE_WITH_CONCERNS y verificar manualmente más adelante.

- [ ] **Step 3: Implementar `slug.util.ts`**

`backend/src/common/utils/slug.util.ts`:

```ts
/**
 * Convierte un string en un slug URL-safe (lowercase, sin tildes, separado por guiones).
 * Ejemplo: "Caminata al Volcán Barú" → "caminata-al-volcan-baru"
 */
export function slugify(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')                  // separa caracteres acentuados
    .replace(/[̀-ͯ]/g, '')   // elimina marcas diacríticas
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')       // todo lo no alfanumérico → guión
    .replace(/^-+|-+$/g, '');          // recorta guiones extremos
}

/**
 * Garantiza unicidad probando sufijos numéricos hasta encontrar uno libre.
 * `existsFn(slug)` debe retornar true si ese slug ya existe en la BD.
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  existsFn: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (!(await existsFn(baseSlug))) return baseSlug;
  let suffix = 2;
  // Cap razonable para evitar loop infinito si algo está roto.
  while (suffix < 1000) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!(await existsFn(candidate))) return candidate;
    suffix += 1;
  }
  // Fallback extremadamente improbable: append timestamp para garantizar unicidad
  return `${baseSlug}-${Date.now()}`;
}
```

- [ ] **Step 4: Re-correr el test**

```powershell
docker cp backend/src/common/utils/slug.util.ts turidove_vk_api:/app/src/common/utils/slug.util.ts
docker exec turidove_vk_api npm test -- slug.util.spec 2>&1 | Select-String -Pattern "PASS|FAIL|Tests:"
```
Expected: `Tests: 9 passed`.

Si los tests no corren dentro del contenedor (lo más probable, dado que `npm test` requiere devDependencies y el container es de producción), saltar la verificación runtime: la lógica es simple, el commit incluye los specs por si se ejecutan tests más adelante.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/common/utils/slug.util.ts backend/src/common/utils/slug.util.spec.ts
git commit -m "feat(common): helper slugify + ensureUniqueSlug con tests"
```

### Tarea 4: DTOs nuevos y modificados (Backend)

**Files:**
- Modify: `backend/src/modules/actividades/dto/create-actividad.dto.ts`
- Modify: `backend/src/modules/actividades/dto/update-actividad.dto.ts`
- Create: `backend/src/modules/actividades/dto/create-categoria.dto.ts`
- Create: `backend/src/modules/actividades/dto/update-categoria.dto.ts`
- Create: `backend/src/modules/actividades/dto/itinerario-item.dto.ts`
- Create: `backend/src/modules/actividades/dto/update-itinerario.dto.ts`

- [ ] **Step 1: Reescribir `create-actividad.dto.ts`**

Reemplazar el contenido completo de `backend/src/modules/actividades/dto/create-actividad.dto.ts` por:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum EstadoActividad {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateActividadDto {
  @ApiProperty({ example: 'Tour por cafetales orgánicos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ example: 'Recorrido guiado por las plantaciones de café...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  descripcion: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000004', description: 'UUID de la categoría' })
  @IsUUID()
  categoriaId: string;

  @ApiProperty({ example: 3, description: 'Duración en horas (0.5 - 168)' })
  @IsNumber()
  @Min(0.5)
  @Max(168)
  duracionHoras: number;

  @ApiProperty({ example: 'Finca La Aurora, Boquete' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  ubicacion: string;

  @ApiProperty({ example: 'Chiriquí' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provincia: string;

  @ApiProperty({ example: 'Boquete' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  distrito: string;

  @ApiPropertyOptional({ example: '/uploads/actividad-portada.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagenPrincipal?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Guía profesional', 'Equipo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  incluye?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Comidas', 'Propinas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noIncluye?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Calzado cómodo', 'Edad mínima 12'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requisitos?: string[];

  @ApiPropertyOptional({ example: 0, description: 'Edad mínima del participante' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  edadMinima?: number;

  @ApiProperty({ example: 20, description: 'Capacidad máxima por sesión' })
  @IsInt()
  @Min(1)
  @Max(1000)
  capacidadMaxima: number;

  @ApiPropertyOptional({ enum: EstadoActividad, default: EstadoActividad.DRAFT })
  @IsOptional()
  @IsEnum(EstadoActividad)
  estado?: EstadoActividad;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
```

- [ ] **Step 2: Reescribir `update-actividad.dto.ts`**

Reemplazar contenido completo por:

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadDto } from './create-actividad.dto';

export class UpdateActividadDto extends PartialType(CreateActividadDto) {}
```

- [ ] **Step 3: Crear `create-categoria.dto.ts`**

`backend/src/modules/actividades/dto/create-categoria.dto.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCategoriaDto {
  @ApiProperty({ example: 'Aventura' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre: string;

  @ApiPropertyOptional({ example: 'mountain', description: 'Nombre del icono de lucide-react' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icono?: string;

  @ApiPropertyOptional({ example: 'Experiencias al aire libre con adrenalina' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
```

- [ ] **Step 4: Crear `update-categoria.dto.ts`**

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaDto } from './create-categoria.dto';

export class UpdateCategoriaDto extends PartialType(CreateCategoriaDto) {}
```

- [ ] **Step 5: Crear `itinerario-item.dto.ts`**

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, IsOptional, IsNotEmpty, MaxLength, Min, Max } from 'class-validator';

export class ItinerarioItemDto {
  @ApiProperty({ example: 1, description: 'Número de día del itinerario (1, 2, 3...)' })
  @IsInt()
  @Min(1)
  @Max(30)
  dia: number;

  @ApiProperty({ example: 'Llegada y bienvenida' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ example: 'Recepción en el hotel y orientación sobre la actividad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descripcion: string;

  @ApiPropertyOptional({ example: 8.7836 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: -82.4378 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ example: 'Hotel Boquete' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombreUbicacion?: string;
}
```

- [ ] **Step 6: Crear `update-itinerario.dto.ts`**

```ts
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ItinerarioItemDto } from './itinerario-item.dto';

export class UpdateItinerarioDto {
  @ApiProperty({
    type: [ItinerarioItemDto],
    description: 'Reemplaza el itinerario completo. Días deben ser únicos.',
  })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ItinerarioItemDto)
  items: ItinerarioItemDto[];
}
```

- [ ] **Step 7: Commit**

```powershell
git add backend/src/modules/actividades/dto/
git commit -m "feat(actividades): DTOs para Actividad v2, Categoria e Itinerario"
```

### Tarea 5: `CategoriasService` y `CategoriasController`

**Files:**
- Create: `backend/src/modules/actividades/categorias.service.ts`
- Create: `backend/src/modules/actividades/categorias.controller.ts`

- [ ] **Step 1: Crear `categorias.service.ts`**

```ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(opts: { soloActivas?: boolean } = {}) {
    return this.prisma.categoriaActividad.findMany({
      where: opts.soloActivas ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.categoriaActividad.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(dto: CreateCategoriaDto) {
    const baseSlug = slugify(dto.nombre);
    if (!baseSlug) throw new ConflictException('El nombre debe contener al menos una letra o número');

    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const found = await this.prisma.categoriaActividad.findUnique({ where: { slug: s } });
      return !!found;
    });

    try {
      return await this.prisma.categoriaActividad.create({
        data: {
          nombre: dto.nombre,
          slug,
          icono: dto.icono,
          descripcion: dto.descripcion,
          activo: dto.activo ?? true,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCategoriaDto) {
    await this.findOne(id);
    return this.prisma.categoriaActividad.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        icono: dto.icono,
        descripcion: dto.descripcion,
        activo: dto.activo,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Solo bloquear si hay actividades asociadas (RESTRICT en FK ya lo haría)
    const count = await this.prisma.actividad.count({ where: { categoriaId: id } });
    if (count > 0) {
      throw new ConflictException(`No se puede eliminar la categoría: tiene ${count} actividad(es) asociada(s). Desactívela en su lugar.`);
    }
    await this.prisma.categoriaActividad.delete({ where: { id } });
    return { ok: true };
  }
}
```

- [ ] **Step 2: Crear `categorias.controller.ts`**

```ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('actividades/categorias')
@Controller('actividades/categorias')
export class CategoriasController {
  constructor(private readonly service: CategoriasService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lista categorías (público). soloActivas=true por defecto para no-admin.' })
  findAll(@Query('soloActivas') soloActivas?: string) {
    const onlyActive = soloActivas === undefined ? true : soloActivas === 'true';
    return this.service.findAll({ soloActivas: onlyActive });
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCategoriaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

- [ ] **Step 3: Verificar paths de imports**

```powershell
Test-Path backend/src/common/guards/jwt-auth.guard.ts
Test-Path backend/src/common/guards/roles.guard.ts
Test-Path backend/src/common/decorators/roles.decorator.ts
Test-Path backend/src/common/decorators/public.decorator.ts
Test-Path backend/src/common/enums/role.enum.ts
```
Expected: todos `True`. Si alguno no existe (`Public()` decorator es el más sospechoso), ajustar el import — el patrón seguro es replicar lo que ya usan `actividades.controller.ts` o `paquetes.controller.ts`:

```powershell
Select-String -Path backend/src/modules/actividades/actividades.controller.ts -Pattern "^import"
```

- [ ] **Step 4: Commit**

```powershell
git add backend/src/modules/actividades/categorias.service.ts backend/src/modules/actividades/categorias.controller.ts
git commit -m "feat(actividades): CategoriasService + Controller (CRUD admin)"
```

### Tarea 6: `ItinerarioService` y `ItinerarioController`

**Files:**
- Create: `backend/src/modules/actividades/itinerario.service.ts`
- Create: `backend/src/modules/actividades/itinerario.controller.ts`

- [ ] **Step 1: Crear `itinerario.service.ts`**

```ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ItinerarioItemDto } from './dto/itinerario-item.dto';

@Injectable()
export class ItinerarioService {
  constructor(private readonly prisma: PrismaService) {}

  async listByActividad(actividadId: string) {
    const exists = await this.prisma.actividad.findUnique({ where: { id: actividadId } });
    if (!exists) throw new NotFoundException('Actividad no encontrada');
    return this.prisma.itinerarioActividad.findMany({
      where: { actividadId },
      orderBy: { dia: 'asc' },
    });
  }

  async replaceAll(
    actividadId: string,
    items: ItinerarioItemDto[],
    userId: string,
    userRole: string,
  ) {
    const actividad = await this.prisma.actividad.findUnique({ where: { id: actividadId } });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    if (userRole !== 'ADMIN' && actividad.proveedorId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar el itinerario de esta actividad');
    }

    // Validación: días únicos
    const dias = items.map((i) => i.dia);
    if (new Set(dias).size !== dias.length) {
      throw new BadRequestException('Días duplicados en el itinerario');
    }

    // Reemplazo atómico: delete + insert dentro de una transacción
    return this.prisma.$transaction(async (tx) => {
      await tx.itinerarioActividad.deleteMany({ where: { actividadId } });
      if (items.length === 0) return [];
      await tx.itinerarioActividad.createMany({
        data: items.map((i) => ({
          actividadId,
          dia: i.dia,
          titulo: i.titulo,
          descripcion: i.descripcion,
          lat: i.lat,
          lng: i.lng,
          nombreUbicacion: i.nombreUbicacion,
        })),
      });
      return tx.itinerarioActividad.findMany({
        where: { actividadId },
        orderBy: { dia: 'asc' },
      });
    });
  }
}
```

- [ ] **Step 2: Crear `itinerario.controller.ts`**

```ts
import { Controller, Get, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ItinerarioService } from './itinerario.service';
import { UpdateItinerarioDto } from './dto/update-itinerario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('actividades/itinerario')
@Controller('actividades/:actividadId/itinerario')
export class ItinerarioController {
  constructor(private readonly service: ItinerarioService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lista el itinerario de una actividad ordenado por día.' })
  list(@Param('actividadId') actividadId: string) {
    return this.service.listByActividad(actividadId);
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROVEEDOR, Role.AGENCIA)
  @ApiOperation({ summary: 'Reemplaza el itinerario completo.' })
  replace(
    @Param('actividadId') actividadId: string,
    @Body() dto: UpdateItinerarioDto,
    @Req() req: any,
  ) {
    return this.service.replaceAll(actividadId, dto.items, req.user.id, req.user.role);
  }
}
```

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/actividades/itinerario.service.ts backend/src/modules/actividades/itinerario.controller.ts
git commit -m "feat(actividades): ItinerarioService + Controller con reemplazo atomico"
```

### Tarea 7: Refactor `ActividadesService` y `ActividadesController` (slug + categoría + estado + imagenPrincipal)

**Files:**
- Modify: `backend/src/modules/actividades/actividades.service.ts`
- Modify: `backend/src/modules/actividades/actividades.controller.ts`

- [ ] **Step 1: Leer el service actual**

```powershell
Get-Content backend/src/modules/actividades/actividades.service.ts | Select-Object -First 200
```

- [ ] **Step 2: Modificar `create()` para generar slug y aceptar `categoriaId`/`estado`/`imagenPrincipal`**

Buscar el método `async create(...)` y reemplazar su body por (preservando la firma):

```ts
async create(dto: CreateActividadDto, userId: string) {
  // Verificar categoría
  const cat = await this.prisma.categoriaActividad.findUnique({ where: { id: dto.categoriaId } });
  if (!cat) throw new BadRequestException('Categoría no encontrada');

  // Generar slug único
  const baseSlug = slugify(`${dto.nombre} ${dto.provincia}`);
  if (!baseSlug) throw new BadRequestException('El nombre debe contener al menos una letra o número');
  const slug = await ensureUniqueSlug(baseSlug, async (s) => {
    const found = await this.prisma.actividad.findUnique({ where: { slug: s } });
    return !!found;
  });

  return this.prisma.actividad.create({
    data: {
      nombre: dto.nombre,
      slug,
      descripcion: dto.descripcion,
      categoriaId: dto.categoriaId,
      duracionHoras: dto.duracionHoras,
      ubicacion: dto.ubicacion,
      provincia: dto.provincia,
      distrito: dto.distrito,
      imagenPrincipal: dto.imagenPrincipal,
      imagenes: dto.imagenes ?? [],
      incluye: dto.incluye ?? [],
      noIncluye: dto.noIncluye ?? [],
      requisitos: dto.requisitos ?? [],
      edadMinima: dto.edadMinima ?? 0,
      capacidadMaxima: dto.capacidadMaxima,
      estado: dto.estado ?? 'DRAFT',
      isFeatured: dto.isFeatured ?? false,
      proveedorId: userId,
    },
    include: { categoria: true },
  });
}
```

Agregar al tope del archivo (junto a los demás imports):

```ts
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.util';
```

- [ ] **Step 3: Modificar `findAll()` para filtros nuevos**

Reemplazar el método `findAll(params)` por:

```ts
async findAll(params: PaginationParams) {
  const { page = 1, limit = 12, categoriaId, provincia, search, isFeatured, estado } = params as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (categoriaId) where.categoriaId = categoriaId;
  if (provincia) where.provincia = { contains: provincia, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { descripcion: { contains: search, mode: 'insensitive' } },
      { ubicacion: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  if (estado) where.estado = estado;
  else where.estado = 'ACTIVE'; // default público: solo ACTIVE

  const [data, total] = await Promise.all([
    this.prisma.actividad.findMany({
      where,
      include: { categoria: true, tarifas: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.actividad.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
```

Y actualizar el interface `PaginationParams` para incluir `categoriaId?: string` y `estado?: string`:

```ts
interface PaginationParams {
  page?: number;
  limit?: number;
  categoriaId?: string;
  provincia?: string;
  search?: string;
  isFeatured?: boolean;
  estado?: string;
}
```

Eliminar el field obsoleto `tipo?: string` del interface.

- [ ] **Step 4: Agregar método `findBySlug()`**

Antes del cierre de la clase:

```ts
async findBySlug(slug: string) {
  const actividad = await this.prisma.actividad.findUnique({
    where: { slug },
    include: { categoria: true, tarifas: true, itinerario: { orderBy: { dia: 'asc' } } },
  });
  if (!actividad) throw new NotFoundException('Actividad no encontrada');
  return actividad;
}
```

- [ ] **Step 5: Modificar `findOne()` para incluir categoría e itinerario**

Buscar el método `async findOne(id: string)` y agregar `categoria: true, itinerario: { orderBy: { dia: 'asc' } }` al `include`. Si no existe `findOne`, el patrón es:

```ts
async findOne(id: string) {
  const actividad = await this.prisma.actividad.findUnique({
    where: { id },
    include: { categoria: true, tarifas: true, itinerario: { orderBy: { dia: 'asc' } } },
  });
  if (!actividad) throw new NotFoundException('Actividad no encontrada');
  return actividad;
}
```

- [ ] **Step 6: Modificar `update()` para regenerar slug si cambió el nombre**

Buscar `async update(id, dto, ...)` y al inicio del método agregar:

```ts
// Si cambia el nombre, regenerar slug único
if (dto.nombre) {
  const existing = await this.prisma.actividad.findUnique({ where: { id } });
  if (!existing) throw new NotFoundException('Actividad no encontrada');
  if (existing.nombre !== dto.nombre) {
    const baseSlug = slugify(`${dto.nombre} ${dto.provincia ?? existing.provincia}`);
    if (baseSlug) {
      const newSlug = await ensureUniqueSlug(baseSlug, async (s) => {
        if (s === existing.slug) return false; // su propio slug no es colisión
        const f = await this.prisma.actividad.findUnique({ where: { slug: s } });
        return !!f;
      });
      (dto as any).slug = newSlug;
    }
  }
}
```

El `update` final ejecuta `this.prisma.actividad.update({ where: { id }, data: dto, include: { categoria: true } })`.

- [ ] **Step 7: Adaptar `actividades.controller.ts`**

Cambios en el controller:

1. En `findAll()` agregar query params `categoriaId`, `estado` y eliminar `tipo`:

```ts
@Get()
@Public()
findAll(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('categoriaId') categoriaId?: string,
  @Query('provincia') provincia?: string,
  @Query('search') search?: string,
  @Query('featured') featured?: string,
  @Query('estado') estado?: string,
) {
  const isFeatured = featured === 'true' ? true : featured === 'false' ? false : undefined;
  return this.service.findAll({
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    categoriaId,
    provincia,
    search,
    isFeatured,
    estado,
  });
}
```

2. Agregar endpoint `GET /actividades/slug/:slug`:

```ts
@Get('slug/:slug')
@Public()
findBySlug(@Param('slug') slug: string) {
  return this.service.findBySlug(slug);
}
```

- [ ] **Step 8: Commit**

```powershell
git add backend/src/modules/actividades/actividades.service.ts backend/src/modules/actividades/actividades.controller.ts
git commit -m "refactor(actividades): adaptar service/controller a categoria/estado/slug/itinerario"
```

### Tarea 8: Registrar nuevos controllers/services en `ActividadesModule`

**Files:**
- Modify: `backend/src/modules/actividades/actividades.module.ts`

- [ ] **Step 1: Editar el módulo**

Reemplazar contenido por:

```ts
import { Module } from '@nestjs/common';
import { ActividadesController } from './actividades.controller';
import { ActividadesService } from './actividades.service';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { ItinerarioController } from './itinerario.controller';
import { ItinerarioService } from './itinerario.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActividadesController, CategoriasController, ItinerarioController],
  providers: [ActividadesService, CategoriasService, ItinerarioService],
  exports: [ActividadesService, CategoriasService, ItinerarioService],
})
export class ActividadesModule {}
```

- [ ] **Step 2: Verificar que PrismaModule está en esa ruta**

```powershell
Test-Path backend/src/prisma/prisma.module.ts
```
Expected: `True`. Si está en otro path (ej. `backend/src/common/prisma/prisma.module.ts`), ajustar el import. Patrón seguro:

```powershell
Get-Content backend/src/modules/actividades/actividades.module.ts.bak 2>$null
Select-String -Path backend/src/modules/**/* -Pattern "PrismaModule" -ErrorAction SilentlyContinue | Select-Object -First 5
```

- [ ] **Step 3: Commit**

```powershell
git add backend/src/modules/actividades/actividades.module.ts
git commit -m "feat(actividades): registrar CategoriasController e ItinerarioController en el modulo"
```

### Tarea 9: Rebuild backend y verificación de endpoints

**Files:** — (sin cambios de archivo, solo operación Docker)

- [ ] **Step 1: Rebuild de la imagen backend**

```powershell
docker compose --env-file .env.docker build backend
```
Expected: build exitoso (~2-3 min). Si falla por TS errors, leer el output y corregir el archivo señalado.

- [ ] **Step 2: Recrear contenedor**

```powershell
docker compose --env-file .env.docker up -d --force-recreate backend
```

- [ ] **Step 3: Verificar que arrancó sin errores**

```powershell
Start-Sleep -Seconds 8
docker logs turidove_vk_api --tail 30
```
Expected: `Nest application successfully started` y endpoints mapeados de `categorias` e `itinerario`.

- [ ] **Step 4: Smoke test con curl — listar categorías (público)**

```powershell
curl.exe -sS http://localhost:3002/api/v1/actividades/categorias
```
Expected: JSON con 6 categorías ("Aventura", "Cultural", etc.) sembradas en la migración.

- [ ] **Step 5: Smoke test — buscar actividad por slug**

Primero descubrir un slug:

```powershell
docker exec turidove_vk_db psql -U postgres -d turidove_vk -t -c "SELECT slug FROM actividades LIMIT 1;"
```

Luego:

```powershell
curl.exe -sS "http://localhost:3002/api/v1/actividades/slug/<slug-real>" -o $null -w "Status: %{http_code}`n"
```
Expected: `Status: 200`.

- [ ] **Step 6: Smoke test — filtrar por categoría**

```powershell
$catId = docker exec turidove_vk_db psql -U postgres -d turidove_vk -t -c "SELECT id FROM categorias_actividad WHERE slug='naturaleza' LIMIT 1;"
$catId = $catId.Trim()
curl.exe -sS "http://localhost:3002/api/v1/actividades?categoriaId=$catId&limit=3" -o $null -w "Status: %{http_code}`n"
```
Expected: `Status: 200`. Si responde con `data: []`, también OK — significa que ninguna actividad seed es de NATURALEZA, pero el endpoint funciona.

- [ ] **Step 7: Sin commit. Verificación de Tarea 9 completa.**

### Tarea 10: Actualizar tipos del frontend

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/types/categoria-actividad.ts`
- Create: `frontend/src/types/itinerario.ts`

- [ ] **Step 1: Buscar el tipo `Actividad` actual en `types/index.ts`**

```powershell
Select-String -Path frontend/src/types/index.ts -Pattern "Actividad|TipoActividad" -Context 0,5 | Select-Object -First 30
```

- [ ] **Step 2: Reemplazar el bloque `export interface Actividad`**

En `frontend/src/types/index.ts`, localizar y reemplazar la interface `Actividad` por:

```ts
export type EstadoActividad = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface Actividad {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  categoriaId: string;
  categoria?: CategoriaActividad;
  duracionHoras: number;
  ubicacion: string;
  provincia: string;
  distrito: string;
  imagenPrincipal: string | null;
  imagenes: string[];
  incluye: string[];
  noIncluye: string[];
  requisitos: string[];
  edadMinima: number;
  capacidadMaxima: number;
  estado: EstadoActividad;
  proveedorId: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  tarifas?: any[];
  itinerario?: ItinerarioItem[];
}

export interface CategoriaActividad {
  id: string;
  nombre: string;
  slug: string;
  icono: string | null;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItinerarioItem {
  id: string;
  actividadId: string;
  dia: number;
  titulo: string;
  descripcion: string;
  lat: number | null;
  lng: number | null;
  nombreUbicacion: string | null;
  createdAt: string;
}
```

- [ ] **Step 3: Eliminar el viejo `TipoActividad` enum/tipo si existe**

Buscar y borrar cualquier export de `TipoActividad`:

```powershell
Select-String -Path frontend/src/types/index.ts -Pattern "TipoActividad"
```
Si aparece, eliminar la declaración (sea `export enum TipoActividad` o `export type TipoActividad = ...`).

- [ ] **Step 4: Crear `frontend/src/types/categoria-actividad.ts`** (re-export para conveniencia)

```ts
export type { CategoriaActividad } from './index';
```

- [ ] **Step 5: Crear `frontend/src/types/itinerario.ts`**

```ts
export type { ItinerarioItem } from './index';

export interface ItinerarioItemPayload {
  dia: number;
  titulo: string;
  descripcion: string;
  lat?: number;
  lng?: number;
  nombreUbicacion?: string;
}
```

- [ ] **Step 6: Verificar TS de los archivos modificados**

```powershell
docker exec turidove_vk_web npx tsc --noEmit 2>&1 | Select-String "types/index" | Select-Object -First 5
```
Expected: sin errores nuevos en `types/index.ts`. Errores preexistentes en otros archivos derivados de la migración aparecerán en tareas siguientes — los corregimos ahí.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/types/
git commit -m "feat(types): Actividad v2, CategoriaActividad e ItinerarioItem"
```

### Tarea 11: Services frontend

**Files:**
- Modify: `frontend/src/services/actividades.service.ts`
- Create: `frontend/src/services/categorias-actividad.service.ts`
- Create: `frontend/src/services/itinerario.service.ts`

- [ ] **Step 1: Adaptar `actividades.service.ts`**

```powershell
Get-Content frontend/src/services/actividades.service.ts
```

Reemplazar contenido completo por:

```ts
import { api } from '@/lib/axios';
import type { Actividad } from '@/types';

interface QueryParams {
  page?: number;
  limit?: number;
  categoriaId?: string;
  provincia?: string;
  search?: string;
  isFeatured?: boolean;
  estado?: string;
}

export const actividadesService = {
  async getAll(params: QueryParams = {}) {
    const { data } = await api.get('/actividades', { params });
    return data as { data: Actividad[]; meta: { page: number; limit: number; total: number; totalPages: number } };
  },

  async getById(id: string) {
    const { data } = await api.get(`/actividades/${id}`);
    return data as Actividad;
  },

  async getBySlug(slug: string) {
    const { data } = await api.get(`/actividades/slug/${slug}`);
    return data as Actividad;
  },

  async create(payload: Partial<Actividad>) {
    const { data } = await api.post('/actividades', payload);
    return data as Actividad;
  },

  async update(id: string, payload: Partial<Actividad>) {
    const { data } = await api.patch(`/actividades/${id}`, payload);
    return data as Actividad;
  },

  async remove(id: string) {
    await api.delete(`/actividades/${id}`);
  },
};

// Helper para home: actividades destacadas (consumido por sección FeaturedActivities)
export async function getFeaturedActividades(limit = 3) {
  const { data } = await api.get('/actividades', {
    params: { featured: 'true', limit, estado: 'ACTIVE' },
  });
  return (data?.data?.data ?? data?.data ?? data?.items ?? data ?? []) as any[];
}
```

- [ ] **Step 2: Crear `categorias-actividad.service.ts`**

```ts
import { api } from '@/lib/axios';
import type { CategoriaActividad } from '@/types';

export const categoriasActividadService = {
  async getAll(opts: { soloActivas?: boolean } = {}) {
    const { data } = await api.get('/actividades/categorias', {
      params: { soloActivas: opts.soloActivas === false ? 'false' : 'true' },
    });
    return data as CategoriaActividad[];
  },

  async getById(id: string) {
    const { data } = await api.get(`/actividades/categorias/${id}`);
    return data as CategoriaActividad;
  },

  async create(payload: { nombre: string; icono?: string; descripcion?: string; activo?: boolean }) {
    const { data } = await api.post('/actividades/categorias', payload);
    return data as CategoriaActividad;
  },

  async update(id: string, payload: { nombre?: string; icono?: string; descripcion?: string; activo?: boolean }) {
    const { data } = await api.patch(`/actividades/categorias/${id}`, payload);
    return data as CategoriaActividad;
  },

  async remove(id: string) {
    await api.delete(`/actividades/categorias/${id}`);
  },
};
```

- [ ] **Step 3: Crear `itinerario.service.ts`**

```ts
import { api } from '@/lib/axios';
import type { ItinerarioItem } from '@/types';
import type { ItinerarioItemPayload } from '@/types/itinerario';

export const itinerarioService = {
  async list(actividadId: string) {
    const { data } = await api.get(`/actividades/${actividadId}/itinerario`);
    return data as ItinerarioItem[];
  },

  async replace(actividadId: string, items: ItinerarioItemPayload[]) {
    const { data } = await api.put(`/actividades/${actividadId}/itinerario`, { items });
    return data as ItinerarioItem[];
  },
};
```

- [ ] **Step 4: Verificar import style en otros services**

```powershell
Select-String -Path frontend/src/services/hospedajes.service.ts -Pattern "^import"
```

Si los demás services usan `import { api } from '@/lib/axios'` (named export), está bien. Si usan default `import api from ...`, alinear.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/services/actividades.service.ts frontend/src/services/categorias-actividad.service.ts frontend/src/services/itinerario.service.ts
git commit -m "feat(api-client): services para Actividad v2, Categorias e Itinerario"
```

### Tarea 12: Componente `ItinerarioEditor` (admin)

**Files:**
- Create: `frontend/src/components/actividades/itinerario-editor.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { itinerarioService } from '@/services/itinerario.service';
import type { ItinerarioItemPayload } from '@/types/itinerario';
import toast from 'react-hot-toast';

interface Props {
  actividadId: string;
  initialItems?: ItinerarioItemPayload[];
  onChange?: (items: ItinerarioItemPayload[]) => void;
}

export function ItinerarioEditor({ actividadId, initialItems = [], onChange }: Props) {
  const [items, setItems] = useState<ItinerarioItemPayload[]>(initialItems);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onChange?.(items);
  }, [items, onChange]);

  function addDay() {
    const nextDay = items.length === 0 ? 1 : Math.max(...items.map((i) => i.dia)) + 1;
    setItems([...items, { dia: nextDay, titulo: '', descripcion: '' }]);
  }

  function updateItem(idx: number, patch: Partial<ItinerarioItemPayload>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!actividadId) {
      toast.error('Guarda primero la actividad para poder editar el itinerario');
      return;
    }

    // Validar días únicos
    const dias = items.map((i) => i.dia);
    if (new Set(dias).size !== dias.length) {
      toast.error('Hay días duplicados en el itinerario');
      return;
    }

    setSaving(true);
    try {
      await itinerarioService.replace(actividadId, items);
      toast.success('Itinerario guardado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar itinerario');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-display font-bold text-navy-800">Itinerario</h3>
        <button
          type="button"
          onClick={addDay}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-50 text-gold-700 text-sm font-body font-medium hover:bg-gold-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar día
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-navy-400 font-body py-6 text-center border border-dashed border-navy-200 rounded-lg">
          Sin etapas. Pulsa "Agregar día" para comenzar.
        </p>
      )}

      <div className="space-y-3">
        {items
          .slice()
          .sort((a, b) => a.dia - b.dia)
          .map((it, idx) => (
            <div key={idx} className="bg-cream-100 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">
                    Día
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={it.dia}
                    onChange={(e) => updateItem(idx, { dia: Number(e.target.value) })}
                    className="w-16 px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800 text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={it.titulo}
                    onChange={(e) => updateItem(idx, { titulo: e.target.value })}
                    placeholder="Ej. Llegada y bienvenida"
                    className="w-full px-3 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="shrink-0 mt-5 text-red-500 hover:text-red-600 transition-colors"
                  aria-label="Eliminar día"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">
                  Descripción
                </label>
                <textarea
                  value={it.descripcion}
                  onChange={(e) => updateItem(idx, { descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">
                    Lugar
                  </label>
                  <input
                    type="text"
                    value={it.nombreUbicacion ?? ''}
                    onChange={(e) => updateItem(idx, { nombreUbicacion: e.target.value || undefined })}
                    placeholder="Opcional"
                    className="w-full px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">
                    Lat
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={it.lat ?? ''}
                    onChange={(e) =>
                      updateItem(idx, {
                        lat: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="-90 a 90"
                    className="w-full px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">
                    Lng
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={it.lng ?? ''}
                    onChange={(e) =>
                      updateItem(idx, {
                        lng: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="-180 a 180"
                    className="w-full px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !actividadId}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar itinerario'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/actividades/itinerario-editor.tsx
git commit -m "feat(admin): ItinerarioEditor con add/edit/delete de dias y reemplazo atomico"
```

### Tarea 13: Componente `ItinerarioTimeline` (público)

**Files:**
- Create: `frontend/src/components/actividades/itinerario-timeline.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import { MapPin } from 'lucide-react';
import type { ItinerarioItem } from '@/types';

export function ItinerarioTimeline({ items }: { items: ItinerarioItem[] }) {
  if (!items?.length) return null;

  const sorted = [...items].sort((a, b) => a.dia - b.dia);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-display font-bold text-navy-800">Itinerario</h2>

      <ol className="relative border-l-2 border-gold-200 space-y-6 pl-6">
        {sorted.map((it) => (
          <li key={it.id} className="relative">
            <span className="absolute -left-[33px] top-1 flex w-8 h-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-white text-xs font-display font-bold">
              {it.dia}
            </span>
            <h3 className="font-body font-semibold text-navy-800 text-base">
              Día {it.dia} · {it.titulo}
            </h3>
            {it.nombreUbicacion && (
              <p className="text-xs text-gold-600 font-body mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {it.nombreUbicacion}
              </p>
            )}
            <p className="text-sm text-navy-600 font-body leading-relaxed mt-2">{it.descripcion}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/components/actividades/itinerario-timeline.tsx
git commit -m "feat(public): ItinerarioTimeline con timeline visual"
```

### Tarea 14: Admin — página de categorías

**Files:**
- Create: `frontend/src/app/admin/actividades/categorias/page.tsx`

- [ ] **Step 1: Crear la página**

```tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { categoriasActividadService } from '@/services/categorias-actividad.service';
import type { CategoriaActividad } from '@/types';

export default function AdminCategoriasActividadPage() {
  const qc = useQueryClient();
  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['admin', 'categorias-actividad'],
    queryFn: () => categoriasActividadService.getAll({ soloActivas: false }),
  });

  const [editing, setEditing] = useState<CategoriaActividad | null>(null);
  const [form, setForm] = useState({ nombre: '', icono: '', descripcion: '', activo: true });

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', icono: '', descripcion: '', activo: true });
  }

  function openEdit(c: CategoriaActividad) {
    setEditing(c);
    setForm({
      nombre: c.nombre,
      icono: c.icono ?? '',
      descripcion: c.descripcion ?? '',
      activo: c.activo,
    });
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre,
        icono: form.icono || undefined,
        descripcion: form.descripcion || undefined,
        activo: form.activo,
      };
      if (editing) return categoriasActividadService.update(editing.id, payload);
      return categoriasActividadService.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada');
      qc.invalidateQueries({ queryKey: ['admin', 'categorias-actividad'] });
      setEditing(null);
      setForm({ nombre: '', icono: '', descripcion: '', activo: true });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => categoriasActividadService.remove(id),
    onSuccess: () => {
      toast.success('Categoría eliminada');
      qc.invalidateQueries({ queryKey: ['admin', 'categorias-actividad'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al eliminar'),
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-800">Categorías de actividades</h1>
          <p className="text-sm text-navy-400 font-body mt-1">
            <Link href="/admin/actividades" className="text-gold-600 hover:text-gold-700">
              ← Volver a actividades
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold shadow-sm hover:from-gold-500 hover:to-gold-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <p className="text-sm text-navy-400">Cargando...</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-navy-100/50">
              <table className="w-full">
                <thead className="bg-cream-100 border-b border-navy-100/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Nombre</th>
                    <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Slug</th>
                    <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Estado</th>
                    <th className="text-right px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((c) => (
                    <tr key={c.id} className="border-b border-navy-100/30 hover:bg-navy-50/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-body text-navy-700">{c.nombre}</td>
                      <td className="px-4 py-3 text-xs font-mono text-navy-500">{c.slug}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${c.activo ? 'bg-green-50 text-green-700' : 'bg-navy-100 text-navy-500'}`}>
                          {c.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(c)} className="text-navy-600 hover:text-navy-800" aria-label="Editar">
                          <Pencil className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => confirm('¿Eliminar esta categoría?') && deleteMut.mutate(c.id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categorias.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-navy-400 font-body py-12 text-sm">
                        Sin categorías.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-base font-display font-bold text-navy-800 mb-4">
            {editing ? 'Editar' : 'Nueva'} categoría
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-body font-medium text-navy-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800"
                placeholder="Ej. Aventura"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-navy-700 mb-1">Icono (lucide)</label>
              <input
                value={form.icono}
                onChange={(e) => setForm({ ...form, icono: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800"
                placeholder="mountain, sun, tree-pine..."
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-navy-700 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-body text-navy-700">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Activa
            </label>
            <div className="flex justify-end gap-2 pt-2">
              {editing && (
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => saveMut.mutate()}
                disabled={!form.nombre || saveMut.isPending}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold disabled:opacity-50"
              >
                {saveMut.isPending ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add frontend/src/app/admin/actividades/categorias/
git commit -m "feat(admin): pagina CRUD de categorias de actividades"
```

### Tarea 15: Adaptar admin de actividades a `categoriaId`/`estado`/itinerario

**Files:**
- Modify: `frontend/src/app/admin/actividades/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

```powershell
Get-Content frontend/src/app/admin/actividades/page.tsx | Select-Object -First 50
```

- [ ] **Step 2: Reemplazar el array hardcoded de `TIPOS` y el schema Zod**

Buscar y reemplazar:

```ts
const TIPOS = ["AVENTURA", "CULTURAL", "GASTRONOMICA", "NATURALEZA", "EDUCATIVA", "DEPORTIVA"];
const tipoColor: Record<string, string> = { ... };
```

por:

```ts
// Las categorías se cargan dinámicamente desde el backend
import { categoriasActividadService } from '@/services/categorias-actividad.service';
import { useQuery as useQueryCat } from '@tanstack/react-query';
```

(El segundo import es redundante si ya está `useQuery` — usar el existente.)

Y reemplazar el field `tipo` del schema Zod por `categoriaId`:

```ts
const schema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres'),
  descripcion: z.string().min(2, 'Requerido'),
  ubicacion: z.string().min(2, 'Requerido'),
  provincia: z.string().min(2, 'Requerido'),
  distrito: z.string().min(2, 'Requerido'),
  categoriaId: z.string().uuid('Selecciona una categoría'),
  duracionHoras: z.coerce.number().min(0.5).max(168),
  capacidadMaxima: z.coerce.number().min(1).max(1000),
  edadMinima: z.coerce.number().min(0).optional(),
  imagenPrincipal: z.string().optional(),
  estado: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  isFeatured: z.boolean().optional(),
});
```

- [ ] **Step 3: Agregar query de categorías dentro del componente**

Dentro del componente principal, agregar:

```ts
const { data: categorias = [] } = useQuery({
  queryKey: ['admin', 'categorias-actividad'],
  queryFn: () => categoriasActividadService.getAll({ soloActivas: true }),
});
```

- [ ] **Step 4: Reemplazar el `<Select>` de tipo por uno de categorías**

Buscar el bloque que renderiza el select de `TIPOS` y reemplazarlo:

```tsx
<div className="space-y-1">
  <Label>Categoría</Label>
  <Select value={watch('categoriaId') ?? ''} onValueChange={(v) => setValue('categoriaId', v)}>
    <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
    <SelectContent>
      {categorias.map((c) => (
        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  {errors.categoriaId && <p className="text-xs text-red-600">{errors.categoriaId.message}</p>}
</div>
```

- [ ] **Step 5: Reemplazar la columna `tipo` de la tabla por `categoria.nombre`**

Buscar la definición de columnas DataTable y cambiar la columna `tipo` por:

```ts
{
  key: 'categoria',
  header: 'Categoría',
  render: (item: any) => (
    <span className="text-sm font-body text-navy-700">{item.categoria?.nombre ?? '—'}</span>
  ),
},
```

- [ ] **Step 6: Agregar columna de estado**

```ts
{
  key: 'estado',
  header: 'Estado',
  render: (item: any) => {
    const cfg = {
      DRAFT: 'bg-navy-50 text-navy-500',
      ACTIVE: 'bg-green-50 text-green-700',
      INACTIVE: 'bg-red-50 text-red-700',
    }[item.estado as 'DRAFT' | 'ACTIVE' | 'INACTIVE'];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg}`}>
        {item.estado}
      </span>
    );
  },
},
```

- [ ] **Step 7: Eliminar el toggle de `activo`** (si existe en el código actual) y reemplazarlo por un select de estado en el form.

Agregar al form del modal:

```tsx
<div className="space-y-1">
  <Label>Estado</Label>
  <Select value={watch('estado') ?? 'DRAFT'} onValueChange={(v) => setValue('estado', v as any)}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="DRAFT">Borrador</SelectItem>
      <SelectItem value="ACTIVE">Activa</SelectItem>
      <SelectItem value="INACTIVE">Inactiva</SelectItem>
    </SelectContent>
  </Select>
</div>
```

- [ ] **Step 8: Agregar link "Gestionar categorías" en el header de la página**

Cerca del título "Actividades", agregar:

```tsx
<Link
  href="/admin/actividades/categorias"
  className="text-sm font-body text-gold-600 hover:text-gold-700"
>
  Gestionar categorías →
</Link>
```

- [ ] **Step 9: Verificar TS**

```powershell
docker exec turidove_vk_web npx tsc --noEmit 2>&1 | Select-String "admin/actividades/page" | Select-Object -First 10
```
Expected: sin errores nuevos.

- [ ] **Step 10: Commit**

```powershell
git add frontend/src/app/admin/actividades/page.tsx
git commit -m "feat(admin): adaptar lista/form de actividades a categoria FK + estado enum"
```

### Tarea 16: Integrar `ItinerarioEditor` en la página de edición de actividad admin

Si en `frontend/src/app/admin/actividades/page.tsx` el modal de edición ya existe, agregar una pestaña/sección al modal con el editor de itinerario. Si no hay pestañas, agregar el editor al final del form (solo visible cuando estamos editando, no creando — porque necesita `actividadId`).

**Files:**
- Modify: `frontend/src/app/admin/actividades/page.tsx`

- [ ] **Step 1: Agregar import del editor**

```tsx
import { ItinerarioEditor } from '@/components/actividades/itinerario-editor';
```

- [ ] **Step 2: En el modal de edición, agregar al final del form**

Buscar el cierre `</form>` del modal de edición y antes de él agregar:

```tsx
{selectedActividad?.id && (
  <div className="mt-6 pt-6 border-t border-navy-100/50">
    <ItinerarioEditor
      actividadId={selectedActividad.id}
      initialItems={selectedActividad.itinerario ?? []}
    />
  </div>
)}
```

Donde `selectedActividad` es la variable que mantiene la actividad que se está editando (puede llamarse distinto — adaptar nombre).

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/app/admin/actividades/page.tsx
git commit -m "feat(admin): integrar ItinerarioEditor en modal de edicion de actividad"
```

### Tarea 17: Adaptar listado público `/actividades`

**Files:**
- Modify: `frontend/src/app/(public)/actividades/page.tsx`

- [ ] **Step 1: Cargar categorías dinámicamente**

```powershell
Get-Content frontend/src/app/(public)/actividades/page.tsx | Select-Object -First 30
```

Reemplazar el array hardcoded `const tipos = [...]` por una query:

```tsx
import { categoriasActividadService } from '@/services/categorias-actividad.service';

// Dentro del componente:
const { data: categorias = [] } = useQuery({
  queryKey: ['public', 'categorias-actividad'],
  queryFn: () => categoriasActividadService.getAll({ soloActivas: true }),
});
```

- [ ] **Step 2: Reemplazar el filtro de tipo por filtro de categoría**

Cambiar el state:

```ts
const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
```

Y los botones:

```tsx
<div className="flex flex-wrap justify-center gap-2 mb-10 sm:mb-12">
  <button
    onClick={() => setCategoriaId(undefined)}
    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-colors ${
      !categoriaId ? 'bg-navy-600 text-white' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
    }`}
  >
    Todas
  </button>
  {categorias.map((c) => (
    <button
      key={c.id}
      onClick={() => setCategoriaId(c.id)}
      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-colors ${
        categoriaId === c.id ? 'bg-navy-600 text-white' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
      }`}
    >
      {c.nombre}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Pasar `categoriaId` al query de actividades**

Cambiar:

```ts
const { data } = useQuery({
  queryKey: ['public', 'actividades', search, categoriaId],
  queryFn: () => actividadesService.getAll({ search: search || undefined, categoriaId, limit: 100 }),
});
```

Eliminar el `.filter` del lado del cliente que filtra por `tipo`. El backend ya filtra y devuelve solo `ACTIVE` por defecto.

- [ ] **Step 4: Cambiar links de card a usar `slug`**

En la card de actividad, el `href`:

```tsx
href={`/actividades/${a.slug}`}
```

- [ ] **Step 5: Mostrar `categoria.nombre` en lugar de `tipo`**

En la card y badges, donde se use `a.tipo` cambiar a `a.categoria?.nombre`.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/app/(public)/actividades/page.tsx
git commit -m "refactor(public): /actividades usa categorias dinamicas y slug en links"
```

### Tarea 18: Detalle público `/actividades/[slug]` (redirect desde `[id]`)

**Files:**
- Modify: `frontend/src/app/(public)/actividades/[id]/page.tsx`

El folder actual es `[id]`. La estrategia es: el componente acepta el param `id` pero lo interpreta como slug; si lo recibido parece UUID, busca por id y redirige al slug correspondiente.

- [ ] **Step 1: Leer la página actual**

```powershell
Get-Content "frontend/src/app/(public)/actividades/[id]/page.tsx" | Select-Object -First 80
```

- [ ] **Step 2: Importar `ItinerarioTimeline` y ajustar la query**

Al inicio del archivo, agregar:

```tsx
import { ItinerarioTimeline } from '@/components/actividades/itinerario-timeline';
import { useRouter } from 'next/navigation';
```

Cambiar la query principal a usar `getBySlug` con fallback a `getById` si el param es UUID:

```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const router = useRouter();

const { data: actividad, isLoading } = useQuery({
  queryKey: ['public', 'actividad', id],
  queryFn: async () => {
    if (UUID_RE.test(id)) {
      // Recibimos UUID: buscar por id, redirigir a slug
      const a = await actividadesService.getById(id);
      if (a?.slug && typeof window !== 'undefined') {
        router.replace(`/actividades/${a.slug}`);
      }
      return a;
    }
    return actividadesService.getBySlug(id);
  },
  enabled: !!id,
});
```

- [ ] **Step 3: Renderizar el itinerario**

Buscar el lugar apropiado en el render (entre la galería y los datos extras), e insertar:

```tsx
{actividad?.itinerario?.length > 0 && (
  <ItinerarioTimeline items={actividad.itinerario} />
)}
```

- [ ] **Step 4: Reemplazar referencias a `a.tipo` por `a.categoria?.nombre`**

```powershell
Select-String -Path "frontend/src/app/(public)/actividades/[id]/page.tsx" -Pattern "a\.tipo|\.tipo\b"
```

Para cada match, cambiar a `a.categoria?.nombre` o eliminar el icono asociado al `tipo` (usar uno genérico de actividad).

- [ ] **Step 5: Commit**

```powershell
git add "frontend/src/app/(public)/actividades/[id]/page.tsx"
git commit -m "refactor(public): detalle actividad consume slug, redirect UUID->slug, muestra itinerario"
```

### Tarea 19: Actualizar Featured/Vehículos del home si referencia `tipo`

**Files:**
- Modify: `frontend/src/components/home/featured-activities.tsx`

- [ ] **Step 1: Verificar referencias a `tipo` en featured-activities**

```powershell
Select-String -Path frontend/src/components/home/featured-activities.tsx -Pattern "\.tipo|tipoColor|TipoActividad"
```

Si hay matches, sustituir por `a.categoria?.nombre` para el badge. Si no hay, no se necesita commit.

- [ ] **Step 2: Verificar link de la card**

El href debe usar `a.slug ?? a.id`:

```tsx
href={`/actividades/${a.slug ?? a.id}`}
```

Si ya es así, sin cambios.

- [ ] **Step 3: Commit (si hubo cambios)**

```powershell
git add frontend/src/components/home/featured-activities.tsx
git commit -m "refactor(home): featured-activities usa categoria.nombre en lugar de tipo"
```

### Tarea 20: Actualizar el seeder con categorías + slugs

**Files:**
- Modify: `backend/prisma/seed-turidove.ts`

- [ ] **Step 1: Leer la sección de actividades del seed**

```powershell
Get-Content backend/prisma/seed-turidove.ts | Select-String -Pattern "Actividad|tipo|TipoActividad" -Context 0,5 | Select-Object -First 30
```

- [ ] **Step 2: Reemplazar `tipo:` por `categoriaId:` y agregar slug**

En cada `prisma.actividad.create(...)`:

- Eliminar el campo `tipo: 'X'`.
- Agregar `categoriaId:` con un mapeo desde el dato anterior:
  - Aventura → `'00000000-0000-0000-0000-000000000001'`
  - Cultural → `'00000000-0000-0000-0000-000000000002'`
  - Gastronómica → `'00000000-0000-0000-0000-000000000003'`
  - Naturaleza → `'00000000-0000-0000-0000-000000000004'`
  - Educativa → `'00000000-0000-0000-0000-000000000005'`
  - Deportiva → `'00000000-0000-0000-0000-000000000006'`
- Agregar `slug:` calculado con un helper inline `slugify(`${nombre} ${provincia}`) + suffix.
- Cambiar `activo: true/false` por `estado: 'ACTIVE'` / `estado: 'INACTIVE'`.

Helper inline al inicio del file:

```ts
function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
let slugCounter = 1;
function uniqueSlug(name: string): string {
  return `${slugify(name)}-seed${slugCounter++}`;
}
```

Y en cada `actividad.create`, cambiar:

```ts
// Antes:
data: { nombre, descripcion, tipo: 'AVENTURA', activo: true, ... }

// Después:
data: { nombre, slug: uniqueSlug(nombre), descripcion, categoriaId: '00000000-0000-0000-0000-000000000001', estado: 'ACTIVE', ... }
```

- [ ] **Step 3: Commit**

```powershell
git add backend/prisma/seed-turidove.ts
git commit -m "chore(seed): seed-turidove usa categoriaId y estado en actividades"
```

### Tarea 21: Rebuild frontend + smoke test integral

**Files:** — (sin cambios)

- [ ] **Step 1: Rebuild frontend**

```powershell
docker compose --env-file .env.docker build frontend
docker compose --env-file .env.docker up -d --force-recreate frontend
```
Expected: build OK, contenedor `turidove_vk_web` arranca.

- [ ] **Step 2: Esperar a que el frontend responda**

```powershell
while (-not ((curl.exe -sS -o $null -w "%{http_code}" http://localhost:3003/) -match "200")) { Start-Sleep -Seconds 3 }
Write-Host "Frontend ready"
```

- [ ] **Step 3: Smoke tests**

```powershell
# Home pública responde
curl.exe -sS -o $null -w "Home: %{http_code}`n" http://localhost:3003/

# Listado actividades público responde
curl.exe -sS -o $null -w "Actividades list: %{http_code}`n" http://localhost:3003/actividades

# Detalle por slug responde
$slug = docker exec turidove_vk_db psql -U postgres -d turidove_vk -t -c "SELECT slug FROM actividades LIMIT 1;"
$slug = $slug.Trim()
curl.exe -sS -o $null -w "Actividad por slug ($slug): %{http_code}`n" "http://localhost:3003/actividades/$slug"

# API categorías
curl.exe -sS -o $null -w "API categorias: %{http_code}`n" http://localhost:3003/api/v1/actividades/categorias
```
Expected: todos 200.

- [ ] **Step 4: Smoke test manual (navegador)**

Abrir http://localhost:3003 y verificar manualmente:

1. **Home:** la sección "Actividades destacadas" muestra cards y el href apunta a `/actividades/<slug>`.
2. **Listado público:** /actividades muestra los botones de categoría dinámicos (Aventura, Cultural, etc.). Filtrar por una categoría reduce la lista.
3. **Detalle:** click en una card → URL con slug. Si la actividad tiene itinerario (en BD aún no, hasta que admin lo agregue) se muestra la timeline.
4. **Admin → Categorías:** ir a /admin/actividades, click "Gestionar categorías", verifica las 6 sembradas. Crear una nueva ("Bienestar") — debe aparecer. Renombrarla. Eliminarla.
5. **Admin → Actividad nueva:** crear una actividad con la nueva categoría, estado DRAFT — NO debe aparecer en listado público.
6. **Admin → Edit actividad:** abrir el modal de una actividad existente, agregar 2 días al itinerario, guardar → verificar que el detalle público muestra la timeline.
7. **Cambiar estado:** marcar la actividad creada como DRAFT a ACTIVE → ahora SÍ aparece en /actividades.

- [ ] **Step 5: Sin commit. Si todo OK, fin de Fase A.**

### Tarea 22: Cleanup y documentación

**Files:**
- Modify: `docs/superpowers/specs/2026-05-28-gap-analysis-y-plan-evolutivo.md` (actualizar checkmarks)

- [ ] **Step 1: Marcar Fase A como completada en el documento de análisis**

En `docs/superpowers/specs/2026-05-28-gap-analysis-y-plan-evolutivo.md`, sección 5 "Orden de ejecución recomendado":

Localizar la fila de la tabla:
```
| A | Endurecimiento Actividades | 4-5 | I (Destinos) | Alto — foco del usuario |
```

Cambiar a:
```
| A | ✅ Endurecimiento Actividades | 4-5 | I (Destinos) | Alto — foco del usuario |
```

- [ ] **Step 2: Commit**

```powershell
git add docs/superpowers/specs/2026-05-28-gap-analysis-y-plan-evolutivo.md
git commit -m "docs: marcar Fase A como completada"
```

---

## Auto-review

Revisé el plan contra el spec de la sección 3.1 (Actividades) y la Fase A del documento de análisis. Cobertura:

- ✅ **Slug único + autogeneración server-side** → Tarea 3 (helper), Tarea 7 (uso en service), Tarea 2 (data migration de slugs existentes).
- ✅ **Enum `EstadoActividad` reemplaza boolean activo** → Tarea 1 (schema), Tarea 2 (data migration), Tareas 4/7/10/11/15/20 (DTOs, service, types, services, admin UI, seed).
- ✅ **`imagenPrincipal` designada** → Tarea 1 (schema), Tarea 4 (DTO), Tarea 7 (service), Tarea 10 (type).
- ✅ **`CategoriaActividad` como tabla** → Tarea 1, 2, 5, 11, 14, 15, 17 (admin CRUD), 20 (seed).
- ✅ **`ItinerarioActividad` con `@@unique([actividadId, dia])`** → Tarea 1, 6 (service + controller), 12 (admin editor), 13 (timeline público), 16 (integración modal), 18 (render en detalle).
- ✅ **Admin CRUD categorías** → Tareas 5 (backend), 14 (frontend).
- ✅ **Admin CRUD itinerario** → Tareas 6 (backend), 12+16 (frontend).
- ✅ **SSR `/actividades/[slug]` + redirect desde id** → Tarea 18.
- ✅ **Validaciones**: `duracionHoras` 0.5-168 (Tarea 4 DTO), días únicos itinerario (Tareas 6+12), coordenadas en rango (Tarea 4 DTO).
- ✅ **Migración data segura**: Tarea 2 detallada con orden de operaciones (poblar antes de NOT NULL).

**Placeholder scan:** sin "TBD", "TODO", "implementar después". Todo el código está completo.

**Consistencia de tipos:** verifiqué que los nombres son consistentes en backend ↔ frontend ↔ Prisma:
- `categoriaId` (no `categoryId` ni `categoria_id` en TS/JS — sí `categoria_id` en SQL via `@map`).
- `EstadoActividad { DRAFT | ACTIVE | INACTIVE }` (no traducido a español, igual que `Role`).
- `ItinerarioActividad.nombreUbicacion` (no `locationName`).
- `imagenPrincipal` (no `mainImage`).

**Una ambigüedad detectada y resuelta:** la Tarea 15 menciona `selectedActividad` como variable del state del modal — el nombre real puede diferir (ej. `editingActividad`, `formData`). El paso de la Tarea 15 dice "adaptar nombre". OK.

---

## Próximos pasos al terminar Fase A

Cuando esta fase quede en `main` y verificada, el siguiente paso recomendado según el spec es **Fase D — Endurecimiento Auth** (refresh tokens, verify email, password reset, rate limiting). Sigue siendo del camino crítico.

Si quieres saltar Fase D y atacar features de valor de cliente, **Fase B — Reviews** es independiente.
