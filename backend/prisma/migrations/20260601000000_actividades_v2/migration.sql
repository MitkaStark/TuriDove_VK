-- ====================================================================
-- Migración: actividades_v2
-- Crea tipos/tablas nuevos, migra datos del enum/boolean, y elimina lo viejo.
-- ====================================================================

-- (1) Crear enum EstadoActividad
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

-- (3) Seed: 6 categorías con UUIDs deterministas
INSERT INTO "categorias_actividad" ("id", "nombre", "slug", "icono", "activo", "created_at", "updated_at") VALUES
  ('00000000-0000-0000-0000-000000000001', 'Aventura',     'aventura',     'mountain',       true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Cultural',     'cultural',     'users',          true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Gastronómica', 'gastronomica', 'sun',            true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Naturaleza',   'naturaleza',   'tree-pine',      true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Educativa',    'educativa',    'graduation-cap', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006', 'Deportiva',    'deportiva',    'waves',          true, NOW(), NOW());

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

-- (5) Modificar tabla actividades: agregar columnas nuevas (nullable temporalmente para data migration)
ALTER TABLE "actividades"
  ADD COLUMN "slug"             TEXT,
  ADD COLUMN "imagen_principal" TEXT,
  ADD COLUMN "categoria_id"     TEXT,
  ADD COLUMN "estado"           "EstadoActividad";

-- (6) Mapear tipo (enum) → categoria_id usando los UUIDs deterministas
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000001' WHERE "tipo" = 'AVENTURA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000002' WHERE "tipo" = 'CULTURAL';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000003' WHERE "tipo" = 'GASTRONOMICA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000004' WHERE "tipo" = 'NATURALEZA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000005' WHERE "tipo" = 'EDUCATIVA';
UPDATE "actividades" SET "categoria_id" = '00000000-0000-0000-0000-000000000006' WHERE "tipo" = 'DEPORTIVA';

-- (7) Mapear activo → estado
UPDATE "actividades" SET "estado" = 'ACTIVE'   WHERE "activo" = true;
UPDATE "actividades" SET "estado" = 'INACTIVE' WHERE "activo" = false;

-- (8) Generar slugs únicos: lowercase + reemplaza no-alfanuméricos por guión + sufijo del id
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
  ADD CONSTRAINT "actividades_categoria_id_fkey"
    FOREIGN KEY ("categoria_id") REFERENCES "categorias_actividad"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "itinerario_actividad"
  ADD CONSTRAINT "itinerario_actividad_actividad_id_fkey"
    FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- (11) Soltar lo viejo
DROP INDEX IF EXISTS "actividades_tipo_idx";
ALTER TABLE "actividades" DROP COLUMN "tipo";
ALTER TABLE "actividades" DROP COLUMN "activo";
DROP TYPE "TipoActividad";
