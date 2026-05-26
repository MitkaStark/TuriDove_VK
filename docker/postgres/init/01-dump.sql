--
-- PostgreSQL database dump
--

\restrict QpHjpny8JKgXqHXVY8BtsBaTUJOtyQxS6BCel5BZ5L9rxLOp3W1HNVsMNcHw5NE

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: EstadoPago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoPago" AS ENUM (
    'PENDIENTE',
    'PROCESANDO',
    'COMPLETADO',
    'FALLIDO',
    'REEMBOLSADO'
);


--
-- Name: EstadoReserva; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoReserva" AS ENUM (
    'PENDIENTE',
    'CONFIRMADA',
    'CANCELADA',
    'COMPLETADA',
    'REEMBOLSADA'
);


--
-- Name: MetodoPago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetodoPago" AS ENUM (
    'TARJETA',
    'YAPPY',
    'TRANSFERENCIA',
    'EFECTIVO',
    'STRIPE'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'PROVEEDOR',
    'AGENCIA',
    'OPERADOR',
    'CLIENTE'
);


--
-- Name: Temporada; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Temporada" AS ENUM (
    'ALTA',
    'MEDIA',
    'BAJA'
);


--
-- Name: TipoActividad; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoActividad" AS ENUM (
    'AVENTURA',
    'CULTURAL',
    'GASTRONOMICA',
    'NATURALEZA',
    'EDUCATIVA',
    'DEPORTIVA'
);


--
-- Name: TipoHabitacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoHabitacion" AS ENUM (
    'INDIVIDUAL',
    'DOBLE',
    'SUITE',
    'FAMILIAR',
    'DORMITORIO'
);


--
-- Name: TipoTransfer; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoTransfer" AS ENUM (
    'AEROPUERTO',
    'HOTEL',
    'PUNTO_A_PUNTO',
    'TOUR'
);


--
-- Name: TipoVehiculo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoVehiculo" AS ENUM (
    'SEDAN',
    'SUV',
    'PICKUP',
    'VAN',
    'BUS',
    'MINIBUS'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _ActividadToPaqueteActividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_ActividadToPaqueteActividad" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: actividades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actividades (
    id text NOT NULL,
    nombre text NOT NULL,
    descripcion text NOT NULL,
    tipo public."TipoActividad" NOT NULL,
    duracion_horas double precision NOT NULL,
    ubicacion text NOT NULL,
    provincia text NOT NULL,
    distrito text NOT NULL,
    imagenes text[],
    incluye text[],
    no_incluye text[],
    requisitos text[],
    edad_minima integer DEFAULT 0 NOT NULL,
    capacidad_maxima integer NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    proveedor_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_featured boolean DEFAULT false NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    accion text NOT NULL,
    entidad text NOT NULL,
    entidad_id text NOT NULL,
    datos jsonb,
    user_id text NOT NULL,
    ip text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: calendario_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendario_actividad (
    id text NOT NULL,
    actividad_id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    hora_inicio text NOT NULL,
    hora_fin text NOT NULL,
    cupos_disponibles integer NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: comisiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comisiones (
    id text NOT NULL,
    reserva_id text NOT NULL,
    proveedor_id text NOT NULL,
    monto_total numeric(65,30) NOT NULL,
    porcentaje_comision numeric(65,30) NOT NULL,
    monto_comision numeric(65,30) NOT NULL,
    monto_proveedor numeric(65,30) NOT NULL,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    liquidado_en timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: disponibilidad_hospedaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disponibilidad_hospedaje (
    id text NOT NULL,
    habitacion_id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    disponible boolean DEFAULT true NOT NULL,
    notas text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: disponibilidad_vehiculo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disponibilidad_vehiculo (
    id text NOT NULL,
    vehiculo_id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    disponible boolean DEFAULT true NOT NULL,
    notas text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: habitaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habitaciones (
    id text NOT NULL,
    nombre text NOT NULL,
    tipo public."TipoHabitacion" NOT NULL,
    capacidad integer NOT NULL,
    descripcion text,
    amenidades text[],
    imagenes text[],
    activo boolean DEFAULT true NOT NULL,
    hospedaje_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: hospedajes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hospedajes (
    id text NOT NULL,
    nombre text NOT NULL,
    descripcion text DEFAULT ''::text NOT NULL,
    direccion text DEFAULT ''::text NOT NULL,
    provincia text DEFAULT ''::text NOT NULL,
    distrito text DEFAULT ''::text NOT NULL,
    corregimiento text DEFAULT ''::text NOT NULL,
    latitud double precision,
    longitud double precision,
    imagenes text[],
    amenidades text[],
    politicas text,
    check_in text DEFAULT '14:00'::text NOT NULL,
    check_out text DEFAULT '12:00'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    proveedor_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    imagen_principal text,
    is_featured boolean DEFAULT false NOT NULL
);


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id text NOT NULL,
    reserva_id text NOT NULL,
    monto numeric(65,30) NOT NULL,
    moneda text DEFAULT 'USD'::text NOT NULL,
    metodo public."MetodoPago" NOT NULL,
    estado public."EstadoPago" DEFAULT 'PENDIENTE'::public."EstadoPago" NOT NULL,
    referencia text,
    stripe_payment_id text,
    detalles jsonb,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    stripe_checkout_url text,
    stripe_event_log jsonb,
    stripe_session_id text
);


--
-- Name: paquetes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paquetes (
    id text NOT NULL,
    nombre text NOT NULL,
    slug text NOT NULL,
    descripcion text NOT NULL,
    hospedaje_id text NOT NULL,
    habitacion_id text NOT NULL,
    actividad_id text,
    vehiculo_id text,
    dias_duracion integer NOT NULL,
    noches integer NOT NULL,
    descuento_porcentaje numeric(5,2) DEFAULT 0 NOT NULL,
    imagen_principal text,
    is_featured boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    valido_desde timestamp(3) without time zone NOT NULL,
    valido_hasta timestamp(3) without time zone NOT NULL,
    proveedor_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: paquetes_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paquetes_actividad (
    id text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    descuento numeric(65,30) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    proveedor_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: reserva_paquetes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserva_paquetes (
    id text NOT NULL,
    reserva_id text NOT NULL,
    paquete_id text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    huespedes integer DEFAULT 1 NOT NULL,
    precio_final numeric(10,2) NOT NULL
);


--
-- Name: reservas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas (
    id text NOT NULL,
    codigo text NOT NULL,
    cliente_id text NOT NULL,
    estado public."EstadoReserva" DEFAULT 'PENDIENTE'::public."EstadoReserva" NOT NULL,
    total numeric(65,30) NOT NULL,
    moneda text DEFAULT 'USD'::text NOT NULL,
    notas text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: reservas_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_actividad (
    id text NOT NULL,
    reserva_id text NOT NULL,
    actividad_id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    adultos integer NOT NULL,
    ninos integer DEFAULT 0 NOT NULL,
    precio_total numeric(65,30) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reservas_hospedaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_hospedaje (
    id text NOT NULL,
    reserva_id text NOT NULL,
    hospedaje_id text NOT NULL,
    habitacion_id text NOT NULL,
    fecha_entrada timestamp(3) without time zone NOT NULL,
    fecha_salida timestamp(3) without time zone NOT NULL,
    huespedes integer NOT NULL,
    precio_total numeric(65,30) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reservas_transfer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_transfer (
    id text NOT NULL,
    reserva_id text NOT NULL,
    transfer_id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    pasajeros integer NOT NULL,
    precio_total numeric(65,30) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reservas_vehiculo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_vehiculo (
    id text NOT NULL,
    reserva_id text NOT NULL,
    vehiculo_id text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    precio_total numeric(65,30) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: stripe_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_events (
    id text NOT NULL,
    stripe_event_id text NOT NULL,
    type text NOT NULL,
    processed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payload jsonb NOT NULL
);


--
-- Name: tarifas_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarifas_actividad (
    id text NOT NULL,
    actividad_id text NOT NULL,
    temporada public."Temporada" NOT NULL,
    precio_adulto numeric(65,30) NOT NULL,
    precio_nino numeric(65,30) NOT NULL,
    precio_grupo numeric(65,30),
    minimo_personas integer DEFAULT 1 NOT NULL,
    moneda text DEFAULT 'USD'::text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: tarifas_hospedaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarifas_hospedaje (
    id text NOT NULL,
    hospedaje_id text NOT NULL,
    habitacion_id text,
    temporada public."Temporada" NOT NULL,
    precio_noche numeric(65,30) NOT NULL,
    precio_persona_extra numeric(65,30) DEFAULT 0 NOT NULL,
    moneda text DEFAULT 'USD'::text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: tarifas_transfer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarifas_transfer (
    id text NOT NULL,
    transfer_id text NOT NULL,
    temporada public."Temporada" NOT NULL,
    precio_por_persona numeric(65,30) NOT NULL,
    precio_vehiculo numeric(65,30),
    minimo_personas integer DEFAULT 1 NOT NULL,
    moneda text DEFAULT 'USD'::text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: tarifas_vehiculo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarifas_vehiculo (
    id text NOT NULL,
    vehiculo_id text NOT NULL,
    temporada public."Temporada" NOT NULL,
    precio_dia numeric(65,30) NOT NULL,
    precio_semana numeric(65,30),
    deposito numeric(65,30) DEFAULT 0 NOT NULL,
    moneda text DEFAULT 'USD'::text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfers (
    id text NOT NULL,
    nombre text NOT NULL,
    tipo public."TipoTransfer" NOT NULL,
    origen text NOT NULL,
    destino text NOT NULL,
    descripcion text,
    distancia_km double precision,
    duracion_estimada text,
    activo boolean DEFAULT true NOT NULL,
    proveedor_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_featured boolean DEFAULT false NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    telefono text,
    role public."Role" DEFAULT 'CLIENTE'::public."Role" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    avatar text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: vehiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos (
    id text NOT NULL,
    marca text NOT NULL,
    modelo text NOT NULL,
    anio integer NOT NULL,
    placa text NOT NULL,
    tipo public."TipoVehiculo" NOT NULL,
    capacidad_pasajeros integer NOT NULL,
    caracteristicas text[],
    imagenes text[],
    seguro_incluido boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    proveedor_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_featured boolean DEFAULT false NOT NULL
);


--
-- Name: vehiculos_transfer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos_transfer (
    id text NOT NULL,
    transfer_id text NOT NULL,
    vehiculo_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: _ActividadToPaqueteActividad; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('e190c891-ed30-484e-9d4a-e898bfcea773', '61cdf61e9fc784478ca653ffc3a0576ba037a57fe809a1fc61e02c06962c0fb0', '2026-05-26 20:19:32.422458+00', '20260404135326_init', NULL, NULL, '2026-05-26 20:19:31.984122+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c6114077-4278-4672-b48a-8337c718de4a', '9b9fb14d449876c446b80188ac3e7e0cb52e88cce8aef73829311b3058d67872', '2026-05-26 20:19:32.437524+00', '20260404160226_add_imagen_principal', NULL, NULL, '2026-05-26 20:19:32.427123+00', 1);
INSERT INTO public._prisma_migrations VALUES ('425428b0-8808-4679-bba7-48643b122f11', '8d542b52bef1108cde263aff081c5f6bd223494d86835d1a79b36212d40a32ff', '2026-05-26 20:19:32.453161+00', '20260405165243_make_hospedaje_fields_optional', NULL, NULL, '2026-05-26 20:19:32.441142+00', 1);
INSERT INTO public._prisma_migrations VALUES ('58231bb9-af50-4957-8feb-7ddca4c3fc24', '1cff26cf8c1f8b56df5d428ce65ddc9c420485a2ed18a85ee01a0e538b71d77a', '2026-05-26 20:19:32.477706+00', '20260525141442_add_is_featured', NULL, NULL, '2026-05-26 20:19:32.456868+00', 1);
INSERT INTO public._prisma_migrations VALUES ('b55ed6a3-dfe2-444a-91e6-5f14415d8674', '0a3b47f542973b092fb61adaa28e9d69de84da255309f608b21903c49c90bd86', '2026-05-26 20:19:32.549654+00', '20260526124903_add_paquetes', NULL, NULL, '2026-05-26 20:19:32.482143+00', 1);
INSERT INTO public._prisma_migrations VALUES ('ce2f4ca8-f970-4b70-ba0b-6c655bbc41d1', 'ffa9d50ac19279a62f9e5d711449e9889e9e019d3869d46e2166929ba69253ae', '2026-05-26 20:19:32.577299+00', '20260526200000_add_stripe_fields', NULL, NULL, '2026-05-26 20:19:32.554193+00', 1);


--
-- Data for Name: actividades; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.actividades VALUES ('a4d7b580-0766-4e02-8405-4eae0bd36806', 'Tour Torre Eiffel', 'Tour Torre Eiffel en Paris. Experiencia inolvidable.', 'CULTURAL', 3, 'Paris', 'Paris', 'Francia', '{/uploads/paris-activity-1.jpg}', '{"Guia profesional",Entrada}', '{Comidas,Propinas}', '{}', 0, 20, true, '44372558-af60-4f67-b3f5-060c29bf828b', '2026-05-26 20:20:20.366', '2026-05-26 20:20:20.366', true);
INSERT INTO public.actividades VALUES ('f4b5a2f0-0b90-420f-966c-1d4522eaf4a1', 'Coliseo y Foro', 'Coliseo y Foro en Roma. Experiencia inolvidable.', 'CULTURAL', 3, 'Roma', 'Roma', 'Italia', '{/uploads/roma-activity-1.jpg}', '{"Guia profesional",Entrada}', '{Comidas,Propinas}', '{}', 0, 20, true, '44372558-af60-4f67-b3f5-060c29bf828b', '2026-05-26 20:20:20.386', '2026-05-26 20:20:20.386', true);
INSERT INTO public.actividades VALUES ('eee0065c-2f1c-4e46-adf0-b5d46dadba8f', 'Templo Sensoji', 'Templo Sensoji en Tokio. Experiencia inolvidable.', 'CULTURAL', 3, 'Tokio', 'Tokio', 'Japon', '{/uploads/tokio-activity-1.jpg}', '{"Guia profesional",Entrada}', '{Comidas,Propinas}', '{}', 0, 20, true, 'c12cdaf4-29d9-4465-94cb-d57e10b5623c', '2026-05-26 20:20:20.402', '2026-05-26 20:20:20.402', true);
INSERT INTO public.actividades VALUES ('0b2791ab-55d3-474f-97e0-e09c29c1217a', 'Estatua de la Libertad', 'Estatua de la Libertad en Nueva York. Experiencia inolvidable.', 'CULTURAL', 3, 'Nueva York', 'Nueva York', 'EE.UU.', '{/uploads/newyork-activity-1.jpg}', '{"Guia profesional",Entrada}', '{Comidas,Propinas}', '{}', 0, 20, true, '4c7a6cf8-dd7a-4aa1-b09c-da6148436cb4', '2026-05-26 20:20:20.417', '2026-05-26 20:20:20.417', false);
INSERT INTO public.actividades VALUES ('98fed2cc-f2a6-41f6-bc10-52ba0f55119d', 'Atardecer en Oia', 'Atardecer en Oia en Santorini. Experiencia inolvidable.', 'NATURALEZA', 3, 'Santorini', 'Santorini', 'Grecia', '{/uploads/santorini-activity-1.jpg}', '{"Guia profesional",Entrada}', '{Comidas,Propinas}', '{}', 0, 20, true, '9adfe4a6-ce97-4da8-994c-e3732f160499', '2026-05-26 20:20:20.432', '2026-05-26 20:20:20.432', false);
INSERT INTO public.actividades VALUES ('98fe018d-d899-4b4b-a95c-cfb1a1cf3cd0', 'Medina y Zoco', 'Medina y Zoco en Marrakech. Experiencia inolvidable.', 'CULTURAL', 3, 'Marrakech', 'Marrakech', 'Marruecos', '{/uploads/marrakech-activity-1.jpg}', '{"Guia profesional",Entrada}', '{Comidas,Propinas}', '{}', 0, 20, true, '9adfe4a6-ce97-4da8-994c-e3732f160499', '2026-05-26 20:20:20.447', '2026-05-26 20:20:20.447', false);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: calendario_actividad; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: comisiones; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: disponibilidad_hospedaje; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: disponibilidad_vehiculo; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.habitaciones VALUES ('eda3bdeb-5a83-4a45-ba48-eefc24a97af7', 'Doble Estandar', 'DOBLE', 2, 'Habitacion doble comoda con cama matrimonial.', '{WiFi,TV,"Bano privado"}', '{}', true, '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', '2026-05-26 20:20:20.107', '2026-05-26 20:20:20.107');
INSERT INTO public.habitaciones VALUES ('4c9cd603-5cba-4cc8-86ae-28daf840bb03', 'Suite Premium', 'SUITE', 4, 'Suite amplia con sala de estar.', '{WiFi,TV,"Bano privado",Minibar,"Vista al exterior"}', '{}', true, '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', '2026-05-26 20:20:20.114', '2026-05-26 20:20:20.114');
INSERT INTO public.habitaciones VALUES ('24866ead-636a-4ebf-94fe-43acfdcbbec9', 'Doble Estandar', 'DOBLE', 2, 'Habitacion doble comoda con cama matrimonial.', '{WiFi,TV,"Bano privado"}', '{}', true, 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', '2026-05-26 20:20:20.156', '2026-05-26 20:20:20.156');
INSERT INTO public.habitaciones VALUES ('d956f3ec-e244-4595-9287-08f93a96bfc8', 'Suite Premium', 'SUITE', 4, 'Suite amplia con sala de estar.', '{WiFi,TV,"Bano privado",Minibar,"Vista al exterior"}', '{}', true, 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', '2026-05-26 20:20:20.161', '2026-05-26 20:20:20.161');
INSERT INTO public.habitaciones VALUES ('0c95b972-9ff0-45b1-8e7d-1c7fb33895a7', 'Doble Estandar', 'DOBLE', 2, 'Habitacion doble comoda con cama matrimonial.', '{WiFi,TV,"Bano privado"}', '{}', true, '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '2026-05-26 20:20:20.197', '2026-05-26 20:20:20.197');
INSERT INTO public.habitaciones VALUES ('25b805d6-d304-415a-8ede-0e5be969efcf', 'Suite Premium', 'SUITE', 4, 'Suite amplia con sala de estar.', '{WiFi,TV,"Bano privado",Minibar,"Vista al exterior"}', '{}', true, '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '2026-05-26 20:20:20.202', '2026-05-26 20:20:20.202');
INSERT INTO public.habitaciones VALUES ('6d9da0d7-f57e-4f0b-96ce-ae6e9cd60e9c', 'Doble Estandar', 'DOBLE', 2, 'Habitacion doble comoda con cama matrimonial.', '{WiFi,TV,"Bano privado"}', '{}', true, '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '2026-05-26 20:20:20.237', '2026-05-26 20:20:20.237');
INSERT INTO public.habitaciones VALUES ('424a5504-2501-4d1e-b417-c3a2d0ca41f8', 'Suite Premium', 'SUITE', 4, 'Suite amplia con sala de estar.', '{WiFi,TV,"Bano privado",Minibar,"Vista al exterior"}', '{}', true, '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '2026-05-26 20:20:20.242', '2026-05-26 20:20:20.242');
INSERT INTO public.habitaciones VALUES ('79c45632-8db8-45c3-b57e-0165ceb70105', 'Doble Estandar', 'DOBLE', 2, 'Habitacion doble comoda con cama matrimonial.', '{WiFi,TV,"Bano privado"}', '{}', true, 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '2026-05-26 20:20:20.276', '2026-05-26 20:20:20.276');
INSERT INTO public.habitaciones VALUES ('4dbfa837-0f39-4ad9-ab45-02b18249f86a', 'Suite Premium', 'SUITE', 4, 'Suite amplia con sala de estar.', '{WiFi,TV,"Bano privado",Minibar,"Vista al exterior"}', '{}', true, 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '2026-05-26 20:20:20.282', '2026-05-26 20:20:20.282');
INSERT INTO public.habitaciones VALUES ('1e2bd8ac-f908-4f78-8c0b-38ac3e204874', 'Doble Estandar', 'DOBLE', 2, 'Habitacion doble comoda con cama matrimonial.', '{WiFi,TV,"Bano privado"}', '{}', true, '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', '2026-05-26 20:20:20.32', '2026-05-26 20:20:20.32');
INSERT INTO public.habitaciones VALUES ('fc9d52e6-7882-4226-a7ce-9aaa7b13c11b', 'Suite Premium', 'SUITE', 4, 'Suite amplia con sala de estar.', '{WiFi,TV,"Bano privado",Minibar,"Vista al exterior"}', '{}', true, '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', '2026-05-26 20:20:20.325', '2026-05-26 20:20:20.325');


--
-- Data for Name: hospedajes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hospedajes VALUES ('9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', 'Le Marais Boutique', 'Le Marais Boutique en Paris, Francia. Hotel boutique con encanto local.', 'Paris, Francia', 'Paris', 'Francia', 'Paris', NULL, NULL, '{/uploads/paris-hotel-1.jpg}', '{WiFi,Desayuno,"Aire acondicionado"}', NULL, '14:00', '12:00', true, '44372558-af60-4f67-b3f5-060c29bf828b', '2026-05-26 20:20:20.046', '2026-05-26 20:20:20.046', '/uploads/paris-hotel-1.jpg', true);
INSERT INTO public.hospedajes VALUES ('d901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', 'Trastevere Suites', 'Trastevere Suites en Roma, Italia. Hotel boutique con encanto local.', 'Roma, Italia', 'Roma', 'Italia', 'Roma', NULL, NULL, '{/uploads/roma-hotel-1.jpg}', '{WiFi,Desayuno,"Aire acondicionado"}', NULL, '14:00', '12:00', true, '44372558-af60-4f67-b3f5-060c29bf828b', '2026-05-26 20:20:20.059', '2026-05-26 20:20:20.059', '/uploads/roma-hotel-1.jpg', true);
INSERT INTO public.hospedajes VALUES ('54ce2258-9b77-49cd-8735-2b6d0eea90ea', 'Shibuya Modern', 'Shibuya Modern en Tokio, Japon. Hotel boutique con encanto local.', 'Tokio, Japon', 'Tokio', 'Japon', 'Tokio', NULL, NULL, '{/uploads/tokio-hotel-1.jpg}', '{WiFi,Desayuno,"Aire acondicionado"}', NULL, '14:00', '12:00', true, 'c12cdaf4-29d9-4465-94cb-d57e10b5623c', '2026-05-26 20:20:20.067', '2026-05-26 20:20:20.067', '/uploads/tokio-hotel-1.jpg', true);
INSERT INTO public.hospedajes VALUES ('6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', 'Midtown Premier', 'Midtown Premier en Nueva York, EE.UU.. Hotel boutique con encanto local.', 'Nueva York, EE.UU.', 'Nueva York', 'EE.UU.', 'Nueva York', NULL, NULL, '{/uploads/newyork-hotel-1.jpg}', '{WiFi,Desayuno,"Aire acondicionado"}', NULL, '14:00', '12:00', true, '4c7a6cf8-dd7a-4aa1-b09c-da6148436cb4', '2026-05-26 20:20:20.076', '2026-05-26 20:20:20.076', '/uploads/newyork-hotel-1.jpg', true);
INSERT INTO public.hospedajes VALUES ('be0600ee-0066-4915-90bf-6bedb45ec7c9', 'Cliff View Santorini', 'Cliff View Santorini en Santorini, Grecia. Hotel boutique con encanto local.', 'Santorini, Grecia', 'Santorini', 'Grecia', 'Santorini', NULL, NULL, '{/uploads/santorini-hotel-1.jpg}', '{WiFi,Desayuno,"Aire acondicionado"}', NULL, '14:00', '12:00', true, '9adfe4a6-ce97-4da8-994c-e3732f160499', '2026-05-26 20:20:20.086', '2026-05-26 20:20:20.086', '/uploads/santorini-hotel-1.jpg', true);
INSERT INTO public.hospedajes VALUES ('12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', 'Riad Yasmine', 'Riad Yasmine en Marrakech, Marruecos. Hotel boutique con encanto local.', 'Marrakech, Marruecos', 'Marrakech', 'Marruecos', 'Marrakech', NULL, NULL, '{/uploads/marrakech-hotel-1.jpg}', '{WiFi,Desayuno,"Aire acondicionado"}', NULL, '14:00', '12:00', true, '9adfe4a6-ce97-4da8-994c-e3732f160499', '2026-05-26 20:20:20.096', '2026-05-26 20:20:20.096', '/uploads/marrakech-hotel-1.jpg', true);


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: paquetes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.paquetes VALUES ('6b74957c-21ff-4141-98d3-ec7404465adc', 'Paris Esencial', 'paris-esencial', 'Tres noches en Le Marais + tour por la Torre Eiffel. Una escapada perfecta para descubrir el corazon de Paris.', '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', 'eda3bdeb-5a83-4a45-ba48-eefc24a97af7', 'a4d7b580-0766-4e02-8405-4eae0bd36806', NULL, 3, 3, 10.00, '/uploads/paquete-paris.jpg', true, true, '2026-05-26 20:20:18.884', '2027-05-26 00:00:00', '4c7a6cf8-dd7a-4aa1-b09c-da6148436cb4', '2026-05-26 20:20:20.535', '2026-05-26 20:20:20.535');
INSERT INTO public.paquetes VALUES ('f4da8b70-5053-4e22-8349-0c303c3dae4b', 'Roma Imperial', 'roma-imperial', 'Tres noches en Trastevere + Coliseo + van. Vive Roma como un local con transporte privado.', 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', '24866ead-636a-4ebf-94fe-43acfdcbbec9', 'f4b5a2f0-0b90-420f-966c-1d4522eaf4a1', 'a20a516f-6de5-466b-a5f7-c13e0f05584a', 3, 3, 15.00, '/uploads/paquete-roma.jpg', true, true, '2026-05-26 20:20:18.884', '2027-05-26 00:00:00', '4c7a6cf8-dd7a-4aa1-b09c-da6148436cb4', '2026-05-26 20:20:20.559', '2026-05-26 20:20:20.559');
INSERT INTO public.paquetes VALUES ('24b49d08-7e61-4cbd-bb39-eab2ec667fcd', 'Santorini Relax', 'santorini-relax', 'Cinco noches en suite Cliff View con vista al mar Egeo. El retiro mas romantico de Europa.', 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '4dbfa837-0f39-4ad9-ab45-02b18249f86a', NULL, NULL, 5, 5, 5.00, '/uploads/paquete-santorini.jpg', true, true, '2026-05-26 20:20:18.884', '2027-05-26 00:00:00', '4c7a6cf8-dd7a-4aa1-b09c-da6148436cb4', '2026-05-26 20:20:20.574', '2026-05-26 20:20:20.574');


--
-- Data for Name: paquetes_actividad; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: reserva_paquetes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: reservas; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: reservas_actividad; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: reservas_hospedaje; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: reservas_transfer; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: reservas_vehiculo; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: stripe_events; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tarifas_actividad; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tarifas_actividad VALUES ('a8be8278-6f32-4063-8bf1-ac4577df1fe8', 'a4d7b580-0766-4e02-8405-4eae0bd36806', 'ALTA', 80.000000000000000000000000000000, 48.000000000000000000000000000000, NULL, 1, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.375', '2026-05-26 20:20:20.375');
INSERT INTO public.tarifas_actividad VALUES ('0317282f-7b56-4dc3-8bbd-e42c19a06c14', 'f4b5a2f0-0b90-420f-966c-1d4522eaf4a1', 'ALTA', 90.000000000000000000000000000000, 54.000000000000000000000000000000, NULL, 1, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.392', '2026-05-26 20:20:20.392');
INSERT INTO public.tarifas_actividad VALUES ('1f0ff196-66a0-4b8b-b9bd-4d6c734b07f7', 'eee0065c-2f1c-4e46-adf0-b5d46dadba8f', 'ALTA', 70.000000000000000000000000000000, 42.000000000000000000000000000000, NULL, 1, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.408', '2026-05-26 20:20:20.408');
INSERT INTO public.tarifas_actividad VALUES ('4218e47d-c0e6-4590-a95c-c5eea74f65df', '0b2791ab-55d3-474f-97e0-e09c29c1217a', 'ALTA', 95.000000000000000000000000000000, 57.000000000000000000000000000000, NULL, 1, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.423', '2026-05-26 20:20:20.423');
INSERT INTO public.tarifas_actividad VALUES ('c54d55f5-1dd0-40bb-94ef-be951603252a', '98fed2cc-f2a6-41f6-bc10-52ba0f55119d', 'ALTA', 60.000000000000000000000000000000, 36.000000000000000000000000000000, NULL, 1, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.438', '2026-05-26 20:20:20.438');
INSERT INTO public.tarifas_actividad VALUES ('25adcad2-3912-4ec6-8344-5831f0b4c6ba', '98fe018d-d899-4b4b-a95c-cfb1a1cf3cd0', 'ALTA', 55.000000000000000000000000000000, 33.000000000000000000000000000000, NULL, 1, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.453', '2026-05-26 20:20:20.453');


--
-- Data for Name: tarifas_hospedaje; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tarifas_hospedaje VALUES ('87268b82-b282-4214-a9c1-4847fa9392a8', '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', 'eda3bdeb-5a83-4a45-ba48-eefc24a97af7', 'ALTA', 220.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.119', '2026-05-26 20:20:20.119');
INSERT INTO public.tarifas_hospedaje VALUES ('b15374f3-e739-441b-a7fa-6032ada35316', '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', '4c9cd603-5cba-4cc8-86ae-28daf840bb03', 'ALTA', 360.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.127', '2026-05-26 20:20:20.127');
INSERT INTO public.tarifas_hospedaje VALUES ('e3cc371f-558b-4d0d-8257-e69405476b0b', '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', 'eda3bdeb-5a83-4a45-ba48-eefc24a97af7', 'MEDIA', 180.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.132', '2026-05-26 20:20:20.132');
INSERT INTO public.tarifas_hospedaje VALUES ('a42f56fd-0f62-4d61-b9e0-c24e949c91cb', '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', '4c9cd603-5cba-4cc8-86ae-28daf840bb03', 'MEDIA', 320.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.138', '2026-05-26 20:20:20.138');
INSERT INTO public.tarifas_hospedaje VALUES ('4f47a2de-d522-4dcf-96bd-7f231fa49105', '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', 'eda3bdeb-5a83-4a45-ba48-eefc24a97af7', 'BAJA', 140.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.143', '2026-05-26 20:20:20.143');
INSERT INTO public.tarifas_hospedaje VALUES ('4effe884-7058-4466-b7bd-ec127886732b', '9d9d39ba-1ad6-46a6-93ff-8edcf0981c1a', '4c9cd603-5cba-4cc8-86ae-28daf840bb03', 'BAJA', 280.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.148', '2026-05-26 20:20:20.148');
INSERT INTO public.tarifas_hospedaje VALUES ('9c740fef-bdfb-452a-bf8d-5956f6639b9c', 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', '24866ead-636a-4ebf-94fe-43acfdcbbec9', 'ALTA', 220.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.166', '2026-05-26 20:20:20.166');
INSERT INTO public.tarifas_hospedaje VALUES ('e91de91a-6ab9-489d-a04f-696cf5800d94', 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', 'd956f3ec-e244-4595-9287-08f93a96bfc8', 'ALTA', 360.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.171', '2026-05-26 20:20:20.171');
INSERT INTO public.tarifas_hospedaje VALUES ('fef5582d-ada6-4df8-8a1d-d330b829c993', 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', '24866ead-636a-4ebf-94fe-43acfdcbbec9', 'MEDIA', 180.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.176', '2026-05-26 20:20:20.176');
INSERT INTO public.tarifas_hospedaje VALUES ('d7fa0dbd-8264-4655-9e0f-21cbac57c108', 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', 'd956f3ec-e244-4595-9287-08f93a96bfc8', 'MEDIA', 320.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.181', '2026-05-26 20:20:20.181');
INSERT INTO public.tarifas_hospedaje VALUES ('5e737b74-e2fe-410d-b541-723532f8f019', 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', '24866ead-636a-4ebf-94fe-43acfdcbbec9', 'BAJA', 140.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.186', '2026-05-26 20:20:20.186');
INSERT INTO public.tarifas_hospedaje VALUES ('db297c27-9c2a-4c73-a4e8-4deed8dde2ee', 'd901f8d2-0ecc-4f87-94b7-f1bbdd1f4aa6', 'd956f3ec-e244-4595-9287-08f93a96bfc8', 'BAJA', 280.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.19', '2026-05-26 20:20:20.19');
INSERT INTO public.tarifas_hospedaje VALUES ('2f34a044-c239-43a4-a14a-804312e0c9ec', '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '0c95b972-9ff0-45b1-8e7d-1c7fb33895a7', 'ALTA', 220.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.207', '2026-05-26 20:20:20.207');
INSERT INTO public.tarifas_hospedaje VALUES ('c574581a-6ee9-4563-a80d-497a6c543d3e', '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '25b805d6-d304-415a-8ede-0e5be969efcf', 'ALTA', 360.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.211', '2026-05-26 20:20:20.211');
INSERT INTO public.tarifas_hospedaje VALUES ('e0abe6d5-ec85-4a79-9871-80429ca02264', '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '0c95b972-9ff0-45b1-8e7d-1c7fb33895a7', 'MEDIA', 180.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.216', '2026-05-26 20:20:20.216');
INSERT INTO public.tarifas_hospedaje VALUES ('a4d153d7-0bf6-4fb8-90fa-be9c899964b0', '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '25b805d6-d304-415a-8ede-0e5be969efcf', 'MEDIA', 320.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.22', '2026-05-26 20:20:20.22');
INSERT INTO public.tarifas_hospedaje VALUES ('546084c9-d5c9-4be6-ba88-18087a006121', '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '0c95b972-9ff0-45b1-8e7d-1c7fb33895a7', 'BAJA', 140.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.225', '2026-05-26 20:20:20.225');
INSERT INTO public.tarifas_hospedaje VALUES ('a93fc6e2-b35f-493f-bf70-b5886fb09d3f', '54ce2258-9b77-49cd-8735-2b6d0eea90ea', '25b805d6-d304-415a-8ede-0e5be969efcf', 'BAJA', 280.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.23', '2026-05-26 20:20:20.23');
INSERT INTO public.tarifas_hospedaje VALUES ('afde1ebb-6a0f-4d09-9c72-13e449d81afe', '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '6d9da0d7-f57e-4f0b-96ce-ae6e9cd60e9c', 'ALTA', 220.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.246', '2026-05-26 20:20:20.246');
INSERT INTO public.tarifas_hospedaje VALUES ('de33e319-4510-4014-af8e-ba6c53ec994d', '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '424a5504-2501-4d1e-b417-c3a2d0ca41f8', 'ALTA', 360.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.25', '2026-05-26 20:20:20.25');
INSERT INTO public.tarifas_hospedaje VALUES ('2e71f3ce-7fcb-4fc4-b546-7c23afdcfe5b', '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '6d9da0d7-f57e-4f0b-96ce-ae6e9cd60e9c', 'MEDIA', 180.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.255', '2026-05-26 20:20:20.255');
INSERT INTO public.tarifas_hospedaje VALUES ('1746e2c5-da8a-49fa-8ee8-b62c5613921a', '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '424a5504-2501-4d1e-b417-c3a2d0ca41f8', 'MEDIA', 320.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.26', '2026-05-26 20:20:20.26');
INSERT INTO public.tarifas_hospedaje VALUES ('6c80e9da-6641-4981-9bb3-fc0173b243ef', '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '6d9da0d7-f57e-4f0b-96ce-ae6e9cd60e9c', 'BAJA', 140.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.264', '2026-05-26 20:20:20.264');
INSERT INTO public.tarifas_hospedaje VALUES ('8e6ab912-c461-4b4c-8608-f5bbf2dd35aa', '6a6358b8-562a-4a61-8f8a-a1a4393eb8ec', '424a5504-2501-4d1e-b417-c3a2d0ca41f8', 'BAJA', 280.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.269', '2026-05-26 20:20:20.269');
INSERT INTO public.tarifas_hospedaje VALUES ('5f3ab029-bfea-4e6d-868c-0d493ab38ca8', 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '79c45632-8db8-45c3-b57e-0165ceb70105', 'ALTA', 220.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.287', '2026-05-26 20:20:20.287');
INSERT INTO public.tarifas_hospedaje VALUES ('d4f4d79c-a6ac-497d-be30-05cdd24df6f4', 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '4dbfa837-0f39-4ad9-ab45-02b18249f86a', 'ALTA', 360.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.292', '2026-05-26 20:20:20.292');
INSERT INTO public.tarifas_hospedaje VALUES ('2e79ab66-ad35-41cf-8950-62eea634ba84', 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '79c45632-8db8-45c3-b57e-0165ceb70105', 'MEDIA', 180.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.297', '2026-05-26 20:20:20.297');
INSERT INTO public.tarifas_hospedaje VALUES ('dc333fc2-39b1-46b9-93d1-5bbd5d38246d', 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '4dbfa837-0f39-4ad9-ab45-02b18249f86a', 'MEDIA', 320.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.301', '2026-05-26 20:20:20.301');
INSERT INTO public.tarifas_hospedaje VALUES ('3b2a2283-cb02-4aa4-95e4-1810741b7e2a', 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '79c45632-8db8-45c3-b57e-0165ceb70105', 'BAJA', 140.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.306', '2026-05-26 20:20:20.306');
INSERT INTO public.tarifas_hospedaje VALUES ('fc1a4f4f-f293-43ee-b7e0-cc7246b034d8', 'be0600ee-0066-4915-90bf-6bedb45ec7c9', '4dbfa837-0f39-4ad9-ab45-02b18249f86a', 'BAJA', 280.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.311', '2026-05-26 20:20:20.311');
INSERT INTO public.tarifas_hospedaje VALUES ('08ff98e4-34f4-463b-a753-0dfaa0917f0d', '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', '1e2bd8ac-f908-4f78-8c0b-38ac3e204874', 'ALTA', 220.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.33', '2026-05-26 20:20:20.33');
INSERT INTO public.tarifas_hospedaje VALUES ('30f61717-01e2-41a6-a0be-f54e65a960ce', '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', 'fc9d52e6-7882-4226-a7ce-9aaa7b13c11b', 'ALTA', 360.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.335', '2026-05-26 20:20:20.335');
INSERT INTO public.tarifas_hospedaje VALUES ('24264cc2-9f7a-4fc9-8df8-e86ea9aa16da', '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', '1e2bd8ac-f908-4f78-8c0b-38ac3e204874', 'MEDIA', 180.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.339', '2026-05-26 20:20:20.339');
INSERT INTO public.tarifas_hospedaje VALUES ('a346be09-9107-4f42-88fe-a1faba956639', '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', 'fc9d52e6-7882-4226-a7ce-9aaa7b13c11b', 'MEDIA', 320.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.344', '2026-05-26 20:20:20.344');
INSERT INTO public.tarifas_hospedaje VALUES ('49f7a3d9-a3f7-4db5-af52-16f86962c37b', '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', '1e2bd8ac-f908-4f78-8c0b-38ac3e204874', 'BAJA', 140.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.349', '2026-05-26 20:20:20.349');
INSERT INTO public.tarifas_hospedaje VALUES ('783db099-7097-4bca-9afb-54094cc20774', '12bab6cb-a1cc-4a74-8363-68e67b8bd7e2', 'fc9d52e6-7882-4226-a7ce-9aaa7b13c11b', 'BAJA', 280.000000000000000000000000000000, 0.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.354', '2026-05-26 20:20:20.354');


--
-- Data for Name: tarifas_transfer; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tarifas_vehiculo; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tarifas_vehiculo VALUES ('4d153522-382e-4523-a2fd-0a77d8aaf30f', 'e792f9a5-f782-4692-9afe-e9d1411669ce', 'ALTA', 60.000000000000000000000000000000, 390.000000000000000000000000000000, 120.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.472', '2026-05-26 20:20:20.472');
INSERT INTO public.tarifas_vehiculo VALUES ('871fc32c-7bd5-4f98-ab70-68bce769d9cd', 'a20a516f-6de5-466b-a5f7-c13e0f05584a', 'ALTA', 90.000000000000000000000000000000, 585.000000000000000000000000000000, 180.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.489', '2026-05-26 20:20:20.489');
INSERT INTO public.tarifas_vehiculo VALUES ('b2a97422-51c8-4ed5-9ec8-c4a96008de83', '36fc43ba-55f6-48e6-8445-2ddf6fcd8144', 'ALTA', 110.000000000000000000000000000000, 715.000000000000000000000000000000, 220.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.501', '2026-05-26 20:20:20.501');
INSERT INTO public.tarifas_vehiculo VALUES ('821dd383-4305-465c-8280-dcee6c37813c', '2cc271c5-14d3-4bc8-9b9f-12b4e091c732', 'ALTA', 180.000000000000000000000000000000, 1170.000000000000000000000000000000, 360.000000000000000000000000000000, 'USD', '2026-01-01 00:00:00', '2027-12-31 00:00:00', true, '2026-05-26 20:20:20.516', '2026-05-26 20:20:20.516');


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('4c7a6cf8-dd7a-4aa1-b09c-da6148436cb4', 'admin@turidove.com', '$2a$10$xBLtsCgZ71MQorlpTNluM.xNmOqt14tRPICreWaRI33JSvbQZcnJm', 'Admin', 'TuriDove', NULL, 'ADMIN', true, NULL, '2026-05-26 20:20:19.292', '2026-05-26 20:20:19.292');
INSERT INTO public.users VALUES ('44372558-af60-4f67-b3f5-060c29bf828b', 'paris.provider@turidove.com', '$2a$10$AcudaCel42olMFOxgBEwduuuON6TkaJo60s0CiIPx2YXgcHjVH3MS', 'Paris', 'Provider', NULL, 'PROVEEDOR', true, NULL, '2026-05-26 20:20:19.412', '2026-05-26 20:20:19.412');
INSERT INTO public.users VALUES ('c12cdaf4-29d9-4465-94cb-d57e10b5623c', 'asia.provider@turidove.com', '$2a$10$qmV7qdvVSIJGROZ3MEI6QOODJoAMpm7X19qcHTiYuxHtJmVUN8fGC', 'Asia', 'Provider', NULL, 'PROVEEDOR', true, NULL, '2026-05-26 20:20:19.537', '2026-05-26 20:20:19.537');
INSERT INTO public.users VALUES ('9adfe4a6-ce97-4da8-994c-e3732f160499', 'boutique.agency@turidove.com', '$2a$10$Z288LMl2inC3P8X73NBmee.2423yW43EBQa/.gonrnFw3JDH79y/C', 'Boutique', 'Agency', NULL, 'AGENCIA', true, NULL, '2026-05-26 20:20:19.668', '2026-05-26 20:20:19.668');
INSERT INTO public.users VALUES ('f9944e3c-0b58-46e1-9f3e-35ba00722e25', 'operator@turidove.com', '$2a$10$JfFP1Xr9KqMJL0CZeLaKy.jj.5Ga4YNJdq.yUKY5FFtMwqjAyDURu', 'Operator', 'TuriDove', NULL, 'OPERADOR', true, NULL, '2026-05-26 20:20:19.794', '2026-05-26 20:20:19.794');
INSERT INTO public.users VALUES ('0fa30174-1a13-40ac-b025-3e6cd2fd99ce', 'cliente1@example.com', '$2a$10$v8QkG0F.CiPkCxM.EIx9M.2LbgWCf7bHJAoqlEzP/nvud5jKnyw9K', 'Cliente', 'Uno', NULL, 'CLIENTE', true, NULL, '2026-05-26 20:20:19.91', '2026-05-26 20:20:19.91');
INSERT INTO public.users VALUES ('b38cff28-e1e3-4c29-8ea1-f2fc8b641692', 'cliente2@example.com', '$2a$10$yof3EO2EzH.H0QgClEUIZuJvrO2TaJbaSNXX0JZWb29Ot.7sP3hYK', 'Cliente', 'Dos', NULL, 'CLIENTE', true, NULL, '2026-05-26 20:20:20.029', '2026-05-26 20:20:20.029');


--
-- Data for Name: vehiculos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vehiculos VALUES ('e792f9a5-f782-4692-9afe-e9d1411669ce', 'Renault', 'Clio', 2023, 'TD-CLIO', 'SEDAN', 4, '{"Aire acondicionado",GPS,Bluetooth}', '{/uploads/vehicle-car.jpg}', true, true, '44372558-af60-4f67-b3f5-060c29bf828b', '2026-05-26 20:20:20.466', '2026-05-26 20:20:20.466', true);
INSERT INTO public.vehiculos VALUES ('a20a516f-6de5-466b-a5f7-c13e0f05584a', 'Fiat', 'Doblo', 2023, 'TD-DOBLO', 'VAN', 7, '{"Aire acondicionado",GPS,Bluetooth}', '{/uploads/vehicle-van.jpg}', true, true, '44372558-af60-4f67-b3f5-060c29bf828b', '2026-05-26 20:20:20.484', '2026-05-26 20:20:20.484', true);
INSERT INTO public.vehiculos VALUES ('36fc43ba-55f6-48e6-8445-2ddf6fcd8144', 'Toyota', 'RAV4', 2023, 'TD-RAV4', 'SUV', 5, '{"Aire acondicionado",GPS,Bluetooth}', '{/uploads/vehicle-suv.jpg}', true, true, '4c7a6cf8-dd7a-4aa1-b09c-da6148436cb4', '2026-05-26 20:20:20.496', '2026-05-26 20:20:20.496', true);
INSERT INTO public.vehiculos VALUES ('2cc271c5-14d3-4bc8-9b9f-12b4e091c732', 'Mercedes', 'Sprinter', 2023, 'TD-SPRT', 'BUS', 15, '{"Aire acondicionado",GPS,Bluetooth}', '{/uploads/vehicle-minibus.jpg}', true, true, '9adfe4a6-ce97-4da8-994c-e3732f160499', '2026-05-26 20:20:20.509', '2026-05-26 20:20:20.509', true);


--
-- Data for Name: vehiculos_transfer; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: calendario_actividad calendario_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_actividad
    ADD CONSTRAINT calendario_actividad_pkey PRIMARY KEY (id);


--
-- Name: comisiones comisiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_pkey PRIMARY KEY (id);


--
-- Name: disponibilidad_hospedaje disponibilidad_hospedaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_hospedaje
    ADD CONSTRAINT disponibilidad_hospedaje_pkey PRIMARY KEY (id);


--
-- Name: disponibilidad_vehiculo disponibilidad_vehiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_vehiculo
    ADD CONSTRAINT disponibilidad_vehiculo_pkey PRIMARY KEY (id);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: hospedajes hospedajes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospedajes
    ADD CONSTRAINT hospedajes_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: paquetes_actividad paquetes_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes_actividad
    ADD CONSTRAINT paquetes_actividad_pkey PRIMARY KEY (id);


--
-- Name: paquetes paquetes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes
    ADD CONSTRAINT paquetes_pkey PRIMARY KEY (id);


--
-- Name: reserva_paquetes reserva_paquetes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_paquetes
    ADD CONSTRAINT reserva_paquetes_pkey PRIMARY KEY (id);


--
-- Name: reservas_actividad reservas_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad
    ADD CONSTRAINT reservas_actividad_pkey PRIMARY KEY (id);


--
-- Name: reservas_hospedaje reservas_hospedaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_hospedaje
    ADD CONSTRAINT reservas_hospedaje_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: reservas_transfer reservas_transfer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transfer
    ADD CONSTRAINT reservas_transfer_pkey PRIMARY KEY (id);


--
-- Name: reservas_vehiculo reservas_vehiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_vehiculo
    ADD CONSTRAINT reservas_vehiculo_pkey PRIMARY KEY (id);


--
-- Name: stripe_events stripe_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events
    ADD CONSTRAINT stripe_events_pkey PRIMARY KEY (id);


--
-- Name: tarifas_actividad tarifas_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_actividad
    ADD CONSTRAINT tarifas_actividad_pkey PRIMARY KEY (id);


--
-- Name: tarifas_hospedaje tarifas_hospedaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_hospedaje
    ADD CONSTRAINT tarifas_hospedaje_pkey PRIMARY KEY (id);


--
-- Name: tarifas_transfer tarifas_transfer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_transfer
    ADD CONSTRAINT tarifas_transfer_pkey PRIMARY KEY (id);


--
-- Name: tarifas_vehiculo tarifas_vehiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_vehiculo
    ADD CONSTRAINT tarifas_vehiculo_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (id);


--
-- Name: vehiculos_transfer vehiculos_transfer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos_transfer
    ADD CONSTRAINT vehiculos_transfer_pkey PRIMARY KEY (id);


--
-- Name: _ActividadToPaqueteActividad_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_ActividadToPaqueteActividad_AB_unique" ON public."_ActividadToPaqueteActividad" USING btree ("A", "B");


--
-- Name: _ActividadToPaqueteActividad_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_ActividadToPaqueteActividad_B_index" ON public."_ActividadToPaqueteActividad" USING btree ("B");


--
-- Name: actividades_proveedor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX actividades_proveedor_id_idx ON public.actividades USING btree (proveedor_id);


--
-- Name: actividades_provincia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX actividades_provincia_idx ON public.actividades USING btree (provincia);


--
-- Name: actividades_tipo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX actividades_tipo_idx ON public.actividades USING btree (tipo);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entidad_entidad_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_entidad_entidad_id_idx ON public.audit_logs USING btree (entidad, entidad_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: calendario_actividad_actividad_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calendario_actividad_actividad_id_idx ON public.calendario_actividad USING btree (actividad_id);


--
-- Name: calendario_actividad_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calendario_actividad_fecha_idx ON public.calendario_actividad USING btree (fecha);


--
-- Name: comisiones_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comisiones_estado_idx ON public.comisiones USING btree (estado);


--
-- Name: comisiones_proveedor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comisiones_proveedor_id_idx ON public.comisiones USING btree (proveedor_id);


--
-- Name: comisiones_reserva_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comisiones_reserva_id_idx ON public.comisiones USING btree (reserva_id);


--
-- Name: disponibilidad_hospedaje_habitacion_id_fecha_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX disponibilidad_hospedaje_habitacion_id_fecha_key ON public.disponibilidad_hospedaje USING btree (habitacion_id, fecha);


--
-- Name: disponibilidad_hospedaje_habitacion_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX disponibilidad_hospedaje_habitacion_id_idx ON public.disponibilidad_hospedaje USING btree (habitacion_id);


--
-- Name: disponibilidad_vehiculo_vehiculo_id_fecha_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX disponibilidad_vehiculo_vehiculo_id_fecha_key ON public.disponibilidad_vehiculo USING btree (vehiculo_id, fecha);


--
-- Name: disponibilidad_vehiculo_vehiculo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX disponibilidad_vehiculo_vehiculo_id_idx ON public.disponibilidad_vehiculo USING btree (vehiculo_id);


--
-- Name: habitaciones_hospedaje_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX habitaciones_hospedaje_id_idx ON public.habitaciones USING btree (hospedaje_id);


--
-- Name: hospedajes_proveedor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hospedajes_proveedor_id_idx ON public.hospedajes USING btree (proveedor_id);


--
-- Name: hospedajes_provincia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hospedajes_provincia_idx ON public.hospedajes USING btree (provincia);


--
-- Name: pagos_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_estado_idx ON public.pagos USING btree (estado);


--
-- Name: pagos_reserva_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_reserva_id_idx ON public.pagos USING btree (reserva_id);


--
-- Name: pagos_stripe_session_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pagos_stripe_session_id_key ON public.pagos USING btree (stripe_session_id);


--
-- Name: pagos_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_user_id_idx ON public.pagos USING btree (user_id);


--
-- Name: paquetes_actividad_proveedor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paquetes_actividad_proveedor_id_idx ON public.paquetes_actividad USING btree (proveedor_id);


--
-- Name: paquetes_is_featured_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paquetes_is_featured_is_active_idx ON public.paquetes USING btree (is_featured, is_active);


--
-- Name: paquetes_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paquetes_slug_idx ON public.paquetes USING btree (slug);


--
-- Name: paquetes_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX paquetes_slug_key ON public.paquetes USING btree (slug);


--
-- Name: reserva_paquetes_paquete_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reserva_paquetes_paquete_id_idx ON public.reserva_paquetes USING btree (paquete_id);


--
-- Name: reserva_paquetes_reserva_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reserva_paquetes_reserva_id_idx ON public.reserva_paquetes USING btree (reserva_id);


--
-- Name: reservas_actividad_actividad_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_actividad_actividad_id_idx ON public.reservas_actividad USING btree (actividad_id);


--
-- Name: reservas_actividad_reserva_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_actividad_reserva_id_idx ON public.reservas_actividad USING btree (reserva_id);


--
-- Name: reservas_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_cliente_id_idx ON public.reservas USING btree (cliente_id);


--
-- Name: reservas_codigo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_codigo_idx ON public.reservas USING btree (codigo);


--
-- Name: reservas_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reservas_codigo_key ON public.reservas USING btree (codigo);


--
-- Name: reservas_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_estado_idx ON public.reservas USING btree (estado);


--
-- Name: reservas_hospedaje_habitacion_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_hospedaje_habitacion_id_idx ON public.reservas_hospedaje USING btree (habitacion_id);


--
-- Name: reservas_hospedaje_hospedaje_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_hospedaje_hospedaje_id_idx ON public.reservas_hospedaje USING btree (hospedaje_id);


--
-- Name: reservas_hospedaje_reserva_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_hospedaje_reserva_id_idx ON public.reservas_hospedaje USING btree (reserva_id);


--
-- Name: reservas_transfer_reserva_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_transfer_reserva_id_idx ON public.reservas_transfer USING btree (reserva_id);


--
-- Name: reservas_transfer_transfer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_transfer_transfer_id_idx ON public.reservas_transfer USING btree (transfer_id);


--
-- Name: reservas_vehiculo_reserva_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_vehiculo_reserva_id_idx ON public.reservas_vehiculo USING btree (reserva_id);


--
-- Name: reservas_vehiculo_vehiculo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reservas_vehiculo_vehiculo_id_idx ON public.reservas_vehiculo USING btree (vehiculo_id);


--
-- Name: stripe_events_stripe_event_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX stripe_events_stripe_event_id_key ON public.stripe_events USING btree (stripe_event_id);


--
-- Name: tarifas_actividad_actividad_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tarifas_actividad_actividad_id_idx ON public.tarifas_actividad USING btree (actividad_id);


--
-- Name: tarifas_hospedaje_habitacion_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tarifas_hospedaje_habitacion_id_idx ON public.tarifas_hospedaje USING btree (habitacion_id);


--
-- Name: tarifas_hospedaje_hospedaje_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tarifas_hospedaje_hospedaje_id_idx ON public.tarifas_hospedaje USING btree (hospedaje_id);


--
-- Name: tarifas_transfer_transfer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tarifas_transfer_transfer_id_idx ON public.tarifas_transfer USING btree (transfer_id);


--
-- Name: tarifas_vehiculo_vehiculo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tarifas_vehiculo_vehiculo_id_idx ON public.tarifas_vehiculo USING btree (vehiculo_id);


--
-- Name: transfers_proveedor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transfers_proveedor_id_idx ON public.transfers USING btree (proveedor_id);


--
-- Name: transfers_tipo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transfers_tipo_idx ON public.transfers USING btree (tipo);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: vehiculos_placa_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vehiculos_placa_key ON public.vehiculos USING btree (placa);


--
-- Name: vehiculos_proveedor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vehiculos_proveedor_id_idx ON public.vehiculos USING btree (proveedor_id);


--
-- Name: vehiculos_tipo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vehiculos_tipo_idx ON public.vehiculos USING btree (tipo);


--
-- Name: vehiculos_transfer_transfer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vehiculos_transfer_transfer_id_idx ON public.vehiculos_transfer USING btree (transfer_id);


--
-- Name: vehiculos_transfer_vehiculo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vehiculos_transfer_vehiculo_id_idx ON public.vehiculos_transfer USING btree (vehiculo_id);


--
-- Name: _ActividadToPaqueteActividad _ActividadToPaqueteActividad_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ActividadToPaqueteActividad"
    ADD CONSTRAINT "_ActividadToPaqueteActividad_A_fkey" FOREIGN KEY ("A") REFERENCES public.actividades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ActividadToPaqueteActividad _ActividadToPaqueteActividad_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ActividadToPaqueteActividad"
    ADD CONSTRAINT "_ActividadToPaqueteActividad_B_fkey" FOREIGN KEY ("B") REFERENCES public.paquetes_actividad(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: actividades actividades_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: calendario_actividad calendario_actividad_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_actividad
    ADD CONSTRAINT calendario_actividad_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comisiones comisiones_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comisiones comisiones_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: disponibilidad_hospedaje disponibilidad_hospedaje_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_hospedaje
    ADD CONSTRAINT disponibilidad_hospedaje_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: disponibilidad_vehiculo disponibilidad_vehiculo_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_vehiculo
    ADD CONSTRAINT disponibilidad_vehiculo_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: habitaciones habitaciones_hospedaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_hospedaje_id_fkey FOREIGN KEY (hospedaje_id) REFERENCES public.hospedajes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hospedajes hospedajes_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospedajes
    ADD CONSTRAINT hospedajes_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pagos pagos_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pagos pagos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: paquetes paquetes_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes
    ADD CONSTRAINT paquetes_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: paquetes_actividad paquetes_actividad_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes_actividad
    ADD CONSTRAINT paquetes_actividad_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: paquetes paquetes_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes
    ADD CONSTRAINT paquetes_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: paquetes paquetes_hospedaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes
    ADD CONSTRAINT paquetes_hospedaje_id_fkey FOREIGN KEY (hospedaje_id) REFERENCES public.hospedajes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: paquetes paquetes_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes
    ADD CONSTRAINT paquetes_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: paquetes paquetes_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes
    ADD CONSTRAINT paquetes_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reserva_paquetes reserva_paquetes_paquete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_paquetes
    ADD CONSTRAINT reserva_paquetes_paquete_id_fkey FOREIGN KEY (paquete_id) REFERENCES public.paquetes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reserva_paquetes reserva_paquetes_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_paquetes
    ADD CONSTRAINT reserva_paquetes_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_actividad reservas_actividad_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad
    ADD CONSTRAINT reservas_actividad_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_actividad reservas_actividad_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad
    ADD CONSTRAINT reservas_actividad_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas reservas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_hospedaje reservas_hospedaje_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_hospedaje
    ADD CONSTRAINT reservas_hospedaje_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_hospedaje reservas_hospedaje_hospedaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_hospedaje
    ADD CONSTRAINT reservas_hospedaje_hospedaje_id_fkey FOREIGN KEY (hospedaje_id) REFERENCES public.hospedajes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_hospedaje reservas_hospedaje_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_hospedaje
    ADD CONSTRAINT reservas_hospedaje_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_transfer reservas_transfer_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transfer
    ADD CONSTRAINT reservas_transfer_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_transfer reservas_transfer_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transfer
    ADD CONSTRAINT reservas_transfer_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_vehiculo reservas_vehiculo_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_vehiculo
    ADD CONSTRAINT reservas_vehiculo_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas_vehiculo reservas_vehiculo_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_vehiculo
    ADD CONSTRAINT reservas_vehiculo_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tarifas_actividad tarifas_actividad_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_actividad
    ADD CONSTRAINT tarifas_actividad_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tarifas_hospedaje tarifas_hospedaje_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_hospedaje
    ADD CONSTRAINT tarifas_hospedaje_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tarifas_hospedaje tarifas_hospedaje_hospedaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_hospedaje
    ADD CONSTRAINT tarifas_hospedaje_hospedaje_id_fkey FOREIGN KEY (hospedaje_id) REFERENCES public.hospedajes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tarifas_transfer tarifas_transfer_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_transfer
    ADD CONSTRAINT tarifas_transfer_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tarifas_vehiculo tarifas_vehiculo_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifas_vehiculo
    ADD CONSTRAINT tarifas_vehiculo_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transfers transfers_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehiculos vehiculos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehiculos_transfer vehiculos_transfer_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos_transfer
    ADD CONSTRAINT vehiculos_transfer_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehiculos_transfer vehiculos_transfer_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos_transfer
    ADD CONSTRAINT vehiculos_transfer_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict QpHjpny8JKgXqHXVY8BtsBaTUJOtyQxS6BCel5BZ5L9rxLOp3W1HNVsMNcHw5NE

