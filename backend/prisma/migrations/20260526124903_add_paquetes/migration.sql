-- CreateTable
CREATE TABLE "paquetes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "hospedaje_id" TEXT NOT NULL,
    "habitacion_id" TEXT NOT NULL,
    "actividad_id" TEXT,
    "vehiculo_id" TEXT,
    "dias_duracion" INTEGER NOT NULL,
    "noches" INTEGER NOT NULL,
    "descuento_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "imagen_principal" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valido_desde" TIMESTAMP(3) NOT NULL,
    "valido_hasta" TIMESTAMP(3) NOT NULL,
    "proveedor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paquetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_paquetes" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "paquete_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "huespedes" INTEGER NOT NULL DEFAULT 1,
    "precio_final" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "reserva_paquetes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paquetes_slug_key" ON "paquetes"("slug");

-- CreateIndex
CREATE INDEX "paquetes_slug_idx" ON "paquetes"("slug");

-- CreateIndex
CREATE INDEX "paquetes_is_featured_is_active_idx" ON "paquetes"("is_featured", "is_active");

-- CreateIndex
CREATE INDEX "reserva_paquetes_reserva_id_idx" ON "reserva_paquetes"("reserva_id");

-- CreateIndex
CREATE INDEX "reserva_paquetes_paquete_id_idx" ON "reserva_paquetes"("paquete_id");

-- AddForeignKey
ALTER TABLE "paquetes" ADD CONSTRAINT "paquetes_hospedaje_id_fkey" FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paquetes" ADD CONSTRAINT "paquetes_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paquetes" ADD CONSTRAINT "paquetes_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paquetes" ADD CONSTRAINT "paquetes_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paquetes" ADD CONSTRAINT "paquetes_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_paquetes" ADD CONSTRAINT "reserva_paquetes_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_paquetes" ADD CONSTRAINT "reserva_paquetes_paquete_id_fkey" FOREIGN KEY ("paquete_id") REFERENCES "paquetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
