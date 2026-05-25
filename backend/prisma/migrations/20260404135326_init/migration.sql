-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROVEEDOR', 'AGENCIA', 'OPERADOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA', 'REEMBOLSADA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "TipoHabitacion" AS ENUM ('INDIVIDUAL', 'DOBLE', 'SUITE', 'FAMILIAR', 'DORMITORIO');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('AVENTURA', 'CULTURAL', 'GASTRONOMICA', 'NATURALEZA', 'EDUCATIVA', 'DEPORTIVA');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('SEDAN', 'SUV', 'PICKUP', 'VAN', 'BUS', 'MINIBUS');

-- CreateEnum
CREATE TYPE "TipoTransfer" AS ENUM ('AEROPUERTO', 'HOTEL', 'PUNTO_A_PUNTO', 'TOUR');

-- CreateEnum
CREATE TYPE "Temporada" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TARJETA', 'YAPPY', 'TRANSFERENCIA', 'EFECTIVO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospedajes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "corregimiento" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "imagenes" TEXT[],
    "amenidades" TEXT[],
    "politicas" TEXT,
    "check_in" TEXT NOT NULL DEFAULT '14:00',
    "check_out" TEXT NOT NULL DEFAULT '12:00',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "proveedor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospedajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habitaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoHabitacion" NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "descripcion" TEXT,
    "amenidades" TEXT[],
    "imagenes" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "hospedaje_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_hospedaje" (
    "id" TEXT NOT NULL,
    "hospedaje_id" TEXT NOT NULL,
    "habitacion_id" TEXT,
    "temporada" "Temporada" NOT NULL,
    "precio_noche" DECIMAL(65,30) NOT NULL,
    "precio_persona_extra" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_hospedaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad_hospedaje" (
    "id" TEXT NOT NULL,
    "habitacion_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilidad_hospedaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoActividad" NOT NULL,
    "duracion_horas" DOUBLE PRECISION NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "imagenes" TEXT[],
    "incluye" TEXT[],
    "no_incluye" TEXT[],
    "requisitos" TEXT[],
    "edad_minima" INTEGER NOT NULL DEFAULT 0,
    "capacidad_maxima" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "proveedor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_actividad" (
    "id" TEXT NOT NULL,
    "actividad_id" TEXT NOT NULL,
    "temporada" "Temporada" NOT NULL,
    "precio_adulto" DECIMAL(65,30) NOT NULL,
    "precio_nino" DECIMAL(65,30) NOT NULL,
    "precio_grupo" DECIMAL(65,30),
    "minimo_personas" INTEGER NOT NULL DEFAULT 1,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paquetes_actividad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "proveedor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paquetes_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendario_actividad" (
    "id" TEXT NOT NULL,
    "actividad_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "cupos_disponibles" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendario_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoTransfer" NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "descripcion" TEXT,
    "distancia_km" DOUBLE PRECISION,
    "duracion_estimada" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "proveedor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_transfer" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "temporada" "Temporada" NOT NULL,
    "precio_por_persona" DECIMAL(65,30) NOT NULL,
    "precio_vehiculo" DECIMAL(65,30),
    "minimo_personas" INTEGER NOT NULL DEFAULT 1,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos_transfer" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoVehiculo" NOT NULL,
    "capacidad_pasajeros" INTEGER NOT NULL,
    "caracteristicas" TEXT[],
    "imagenes" TEXT[],
    "seguro_incluido" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "proveedor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_vehiculo" (
    "id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "temporada" "Temporada" NOT NULL,
    "precio_dia" DECIMAL(65,30) NOT NULL,
    "precio_semana" DECIMAL(65,30),
    "deposito" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad_vehiculo" (
    "id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilidad_vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "total" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_hospedaje" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "hospedaje_id" TEXT NOT NULL,
    "habitacion_id" TEXT NOT NULL,
    "fecha_entrada" TIMESTAMP(3) NOT NULL,
    "fecha_salida" TIMESTAMP(3) NOT NULL,
    "huespedes" INTEGER NOT NULL,
    "precio_total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_hospedaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_actividad" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "actividad_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "adultos" INTEGER NOT NULL,
    "ninos" INTEGER NOT NULL DEFAULT 0,
    "precio_total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_transfer" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "pasajeros" INTEGER NOT NULL,
    "precio_total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_vehiculo" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "precio_total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "referencia" TEXT,
    "stripe_payment_id" TEXT,
    "detalles" JSONB,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comisiones" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "monto_total" DECIMAL(65,30) NOT NULL,
    "porcentaje_comision" DECIMAL(65,30) NOT NULL,
    "monto_comision" DECIMAL(65,30) NOT NULL,
    "monto_proveedor" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "liquidado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "datos" JSONB,
    "user_id" TEXT NOT NULL,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActividadToPaqueteActividad" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "hospedajes_proveedor_id_idx" ON "hospedajes"("proveedor_id");

-- CreateIndex
CREATE INDEX "hospedajes_provincia_idx" ON "hospedajes"("provincia");

-- CreateIndex
CREATE INDEX "habitaciones_hospedaje_id_idx" ON "habitaciones"("hospedaje_id");

-- CreateIndex
CREATE INDEX "tarifas_hospedaje_hospedaje_id_idx" ON "tarifas_hospedaje"("hospedaje_id");

-- CreateIndex
CREATE INDEX "tarifas_hospedaje_habitacion_id_idx" ON "tarifas_hospedaje"("habitacion_id");

-- CreateIndex
CREATE INDEX "disponibilidad_hospedaje_habitacion_id_idx" ON "disponibilidad_hospedaje"("habitacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "disponibilidad_hospedaje_habitacion_id_fecha_key" ON "disponibilidad_hospedaje"("habitacion_id", "fecha");

-- CreateIndex
CREATE INDEX "actividades_proveedor_id_idx" ON "actividades"("proveedor_id");

-- CreateIndex
CREATE INDEX "actividades_provincia_idx" ON "actividades"("provincia");

-- CreateIndex
CREATE INDEX "actividades_tipo_idx" ON "actividades"("tipo");

-- CreateIndex
CREATE INDEX "tarifas_actividad_actividad_id_idx" ON "tarifas_actividad"("actividad_id");

-- CreateIndex
CREATE INDEX "paquetes_actividad_proveedor_id_idx" ON "paquetes_actividad"("proveedor_id");

-- CreateIndex
CREATE INDEX "calendario_actividad_actividad_id_idx" ON "calendario_actividad"("actividad_id");

-- CreateIndex
CREATE INDEX "calendario_actividad_fecha_idx" ON "calendario_actividad"("fecha");

-- CreateIndex
CREATE INDEX "transfers_proveedor_id_idx" ON "transfers"("proveedor_id");

-- CreateIndex
CREATE INDEX "transfers_tipo_idx" ON "transfers"("tipo");

-- CreateIndex
CREATE INDEX "tarifas_transfer_transfer_id_idx" ON "tarifas_transfer"("transfer_id");

-- CreateIndex
CREATE INDEX "vehiculos_transfer_transfer_id_idx" ON "vehiculos_transfer"("transfer_id");

-- CreateIndex
CREATE INDEX "vehiculos_transfer_vehiculo_id_idx" ON "vehiculos_transfer"("vehiculo_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "vehiculos_proveedor_id_idx" ON "vehiculos"("proveedor_id");

-- CreateIndex
CREATE INDEX "vehiculos_tipo_idx" ON "vehiculos"("tipo");

-- CreateIndex
CREATE INDEX "tarifas_vehiculo_vehiculo_id_idx" ON "tarifas_vehiculo"("vehiculo_id");

-- CreateIndex
CREATE INDEX "disponibilidad_vehiculo_vehiculo_id_idx" ON "disponibilidad_vehiculo"("vehiculo_id");

-- CreateIndex
CREATE UNIQUE INDEX "disponibilidad_vehiculo_vehiculo_id_fecha_key" ON "disponibilidad_vehiculo"("vehiculo_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_codigo_key" ON "reservas"("codigo");

-- CreateIndex
CREATE INDEX "reservas_cliente_id_idx" ON "reservas"("cliente_id");

-- CreateIndex
CREATE INDEX "reservas_estado_idx" ON "reservas"("estado");

-- CreateIndex
CREATE INDEX "reservas_codigo_idx" ON "reservas"("codigo");

-- CreateIndex
CREATE INDEX "reservas_hospedaje_reserva_id_idx" ON "reservas_hospedaje"("reserva_id");

-- CreateIndex
CREATE INDEX "reservas_hospedaje_hospedaje_id_idx" ON "reservas_hospedaje"("hospedaje_id");

-- CreateIndex
CREATE INDEX "reservas_hospedaje_habitacion_id_idx" ON "reservas_hospedaje"("habitacion_id");

-- CreateIndex
CREATE INDEX "reservas_actividad_reserva_id_idx" ON "reservas_actividad"("reserva_id");

-- CreateIndex
CREATE INDEX "reservas_actividad_actividad_id_idx" ON "reservas_actividad"("actividad_id");

-- CreateIndex
CREATE INDEX "reservas_transfer_reserva_id_idx" ON "reservas_transfer"("reserva_id");

-- CreateIndex
CREATE INDEX "reservas_transfer_transfer_id_idx" ON "reservas_transfer"("transfer_id");

-- CreateIndex
CREATE INDEX "reservas_vehiculo_reserva_id_idx" ON "reservas_vehiculo"("reserva_id");

-- CreateIndex
CREATE INDEX "reservas_vehiculo_vehiculo_id_idx" ON "reservas_vehiculo"("vehiculo_id");

-- CreateIndex
CREATE INDEX "pagos_reserva_id_idx" ON "pagos"("reserva_id");

-- CreateIndex
CREATE INDEX "pagos_user_id_idx" ON "pagos"("user_id");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE INDEX "comisiones_reserva_id_idx" ON "comisiones"("reserva_id");

-- CreateIndex
CREATE INDEX "comisiones_proveedor_id_idx" ON "comisiones"("proveedor_id");

-- CreateIndex
CREATE INDEX "comisiones_estado_idx" ON "comisiones"("estado");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entidad_entidad_id_idx" ON "audit_logs"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "_ActividadToPaqueteActividad_AB_unique" ON "_ActividadToPaqueteActividad"("A", "B");

-- CreateIndex
CREATE INDEX "_ActividadToPaqueteActividad_B_index" ON "_ActividadToPaqueteActividad"("B");

-- AddForeignKey
ALTER TABLE "hospedajes" ADD CONSTRAINT "hospedajes_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habitaciones" ADD CONSTRAINT "habitaciones_hospedaje_id_fkey" FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_hospedaje" ADD CONSTRAINT "tarifas_hospedaje_hospedaje_id_fkey" FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_hospedaje" ADD CONSTRAINT "tarifas_hospedaje_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_hospedaje" ADD CONSTRAINT "disponibilidad_hospedaje_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_actividad" ADD CONSTRAINT "tarifas_actividad_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paquetes_actividad" ADD CONSTRAINT "paquetes_actividad_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_actividad" ADD CONSTRAINT "calendario_actividad_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_transfer" ADD CONSTRAINT "tarifas_transfer_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos_transfer" ADD CONSTRAINT "vehiculos_transfer_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos_transfer" ADD CONSTRAINT "vehiculos_transfer_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_vehiculo" ADD CONSTRAINT "tarifas_vehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_vehiculo" ADD CONSTRAINT "disponibilidad_vehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_hospedaje" ADD CONSTRAINT "reservas_hospedaje_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_hospedaje" ADD CONSTRAINT "reservas_hospedaje_hospedaje_id_fkey" FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_hospedaje" ADD CONSTRAINT "reservas_hospedaje_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_actividad" ADD CONSTRAINT "reservas_actividad_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_actividad" ADD CONSTRAINT "reservas_actividad_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_transfer" ADD CONSTRAINT "reservas_transfer_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_transfer" ADD CONSTRAINT "reservas_transfer_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_vehiculo" ADD CONSTRAINT "reservas_vehiculo_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_vehiculo" ADD CONSTRAINT "reservas_vehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActividadToPaqueteActividad" ADD CONSTRAINT "_ActividadToPaqueteActividad_A_fkey" FOREIGN KEY ("A") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActividadToPaqueteActividad" ADD CONSTRAINT "_ActividadToPaqueteActividad_B_fkey" FOREIGN KEY ("B") REFERENCES "paquetes_actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
