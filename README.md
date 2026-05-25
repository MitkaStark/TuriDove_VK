# TuriDove

Agencia de viajes boutique internacional. Reserva hoteles, actividades,
vehículos, transfers y paquetes turísticos en destinos curados alrededor
del mundo. Pago real con Stripe.

**Proyecto dockerizado y listo para despliegue en producción.**

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| UI | TailwindCSS + Shadcn/UI + Radix UI |
| Estado | Zustand (con persistencia) + React Query |
| Backend | NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| Base de Datos | PostgreSQL 18 |
| Auth | JWT + bcrypt + expiración de sesión por inactividad |
| API Docs | Swagger / OpenAPI |
| i18n | ES / EN |
| Despliegue | Docker + Docker Compose (3 servicios) |

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15 standalone)              │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ │
│  │  Sitio   │ │  Admin   │ │Proveedor │ │Agencia │ │ Cliente │ │
│  │ Público  │ │  Panel   │ │  Panel   │ │ Panel  │ │  Panel  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ └────┬────┘ │
│       └─────────────┴────────────┴────────────┴───────────┘     │
│                    Axios + React Query + Zustand                 │
└─────────────────────────────┬────────────────────────────────────┘
                              │ REST API (JWT)
┌─────────────────────────────┼────────────────────────────────────┐
│                    BACKEND (NestJS)                              │
│                                                                  │
│  ┌─────────┐ ┌──────┐ ┌──────────┐ ┌───────────────────────┐    │
│  │  Auth   │ │ RBAC │ │  Audit   │ │  Error Handler        │    │
│  │  Guard  │ │Guard │ │Interceptor│ │  Filter + Transform  │    │
│  └─────────┘ └──────┘ └──────────┘ └───────────────────────┘    │
│                                                                  │
│  Módulos: Auth · Users · Hospedajes · Actividades · Transfers   │
│           Vehiculos · Reservas · Pagos · Financiero · Auditoria │
│           Uploads                                                │
│                                                                  │
│                         Prisma ORM                               │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │   PostgreSQL 18     │
                   │   (Docker volume)   │
                   └─────────────────────┘
```

Todo orquestado con `docker-compose`:
- **postgres** (puerto `5433`/`5434`) — PostgreSQL 18 con dump seed inicial
- **backend** (puerto `3001`) — NestJS compilado, migraciones automáticas
- **frontend** (puerto `3000`) — Next.js en modo `standalone`

---

## 🚀 Inicio Rápido

### Opción A: Docker (recomendado)

**Requisito único:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

**Linux / macOS / WSL:**
```bash
git clone https://github.com/MitkaStark/TuriDove.git
cd TuriDove
chmod +x setup.sh
./setup.sh
```

**Windows PowerShell:**
```powershell
git clone https://github.com/MitkaStark/TuriDove.git
cd TuriDove
powershell -ExecutionPolicy Bypass -File setup.ps1
```

**O manualmente (cualquier SO):**
```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

El script construye las imágenes (~5-10 min la primera vez), levanta los 3
contenedores y **restaura automáticamente** la base de datos con todos los
datos iniciales (16 hospedajes, habitaciones, actividades, transfers,
vehículos, usuarios y sus imágenes).

📘 Guía técnica: [DOCKER.md](./DOCKER.md)
📘 Despliegue a servidor: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Opción B: Desarrollo local (sin Docker)

**Requisitos:**
- Node.js 18+
- PostgreSQL 18 (ServBay, Postgres.app o instalación propia)
- npm

**Backend:**
```bash
cd backend
npm install --legacy-peer-deps
cp .env.example .env
# Editar DATABASE_URL, JWT_SECRET...
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

**Frontend** (en otra terminal):
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

### Acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api/v1 |
| Swagger Docs | http://localhost:3001/api/docs |

### Credenciales iniciales (Docker)

Después del primer `setup.sh`, los usuarios seed tienen estas contraseñas.
**En producción, cambiarlas tras el primer login.**

| Rol | Email | Contraseña |
|-----|-------|-----------|
| ADMIN | `admin@turidove.com` | `Admin123!` |
| PROVEEDOR | `finca.loma@agroturismo.pa` | `Proveedor123!` |
| PROVEEDOR | `aventura.chiriqui@agroturismo.pa` | `Proveedor123!` |
| AGENCIA | `agencia.panama@agroturismo.pa` | `Agencia123!` |
| OPERADOR | `operador@agroturismo.pa` | `Operador123!` |
| CLIENTE | `juan.perez@gmail.com` | `Cliente123!` |
| CLIENTE | `ana.rodriguez@gmail.com` | `Cliente123!` |

---

## Estructura del Proyecto

```
TuriDove/
├── backend/                      # API NestJS
│   ├── Dockerfile                # Multi-stage: builder + runtime
│   ├── prisma/
│   │   ├── schema.prisma         # 20 tablas, 8 enums
│   │   └── migrations/
│   ├── src/
│   │   ├── modules/              # 11 módulos (auth, hospedajes, ...)
│   │   ├── common/               # Guards, interceptors, filters, dto
│   │   └── config/
│   └── uploads/                  # ~167 imágenes seed
│
├── frontend/                     # Next.js 15
│   ├── Dockerfile                # Multi-stage standalone
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/           # Login, register
│   │   │   ├── (public)/         # Catálogo público
│   │   │   ├── admin/            # Panel administrador
│   │   │   ├── proveedor/        # Panel proveedor
│   │   │   ├── agencia/          # Panel agencia
│   │   │   ├── operador/         # Panel operador
│   │   │   └── cliente/          # Panel cliente
│   │   ├── components/
│   │   │   ├── shared/           # DataTable, PageHeader, PaymentModal, ...
│   │   │   └── ui/               # Shadcn components
│   │   ├── hooks/                # useAuth, useTranslation
│   │   ├── lib/                  # axios, validators, margins, translations
│   │   ├── services/             # API clients
│   │   ├── store/                # Zustand (auth con expiración)
│   │   └── types/
│   └── public/
│
├── docker/
│   └── postgres/
│       └── init/
│           └── 01-dump.sql       # Dump seed (auto-restaurado al arrancar)
│
├── docs/                         # Documentación del MVP
├── docker-compose.yml            # Orquestación 3 servicios
├── .env.docker.example           # Plantilla de variables
├── setup.sh / setup.ps1          # Scripts de arranque automático
├── DOCKER.md                     # Referencia técnica Docker
├── DEPLOYMENT.md                 # Guía paso a paso para producción
└── README.md                     # Este archivo
```

---

## Roles del Sistema

| Rol | Acceso | Registro |
|-----|--------|----------|
| **ADMIN** | Todo el sistema | Solo por seed/admin |
| **PROVEEDOR** | Solo sus recursos | Auto-registro |
| **AGENCIA** | Solo sus recursos | Solo por admin |
| **OPERADOR** | Gestión operativa (reservas, transfers) | Solo por admin |
| **CLIENTE** | Reservas, pagos, perfil propios | Auto-registro |

---

## Funcionalidades

### Frontend Público
- 🏠 Catálogo de hoteles, actividades, transfers y vehículos
- 🔍 Búsqueda por texto en todos los catálogos
- 📋 Páginas de detalle con galería de imágenes
- 🛏️ Modal de detalles de habitaciones con carrusel y tarifas por temporada
- 🛒 Flujo de reserva completo (hospedajes, actividades, transfers, vehículos)
- 💳 Pago simulado (Tarjeta, Yappy, Transferencia, Efectivo)
- 🌐 Bilingüe (Español / English)
- 👤 Menú de usuario adaptativo por rol
- 🔒 Expiración de sesión por inactividad (2 horas)

### Panel Admin
- 📊 Dashboard con KPIs
- 👥 Gestión de usuarios (CRUD + roles + activar/desactivar)
- 🏨 Hoteles + habitaciones + tarifas + amenidades configurables
- 🎭 Actividades
- 🚌 Transfers
- 🚙 Vehículos con validación de placa única
- 📅 Reservas con cambio de estado
- 💰 Pagos con reembolsos
- 📈 Finanzas (márgenes, ingresos, pago a proveedores, ocupación)
- 🔍 Auditoría (registro automático de acciones)
- ⚙️ Configuración (idioma, márgenes, notificaciones)

### Panel Proveedor / Agencia
- Gestión completa de sus propios recursos
- Habitaciones con tarifas por temporada (Alta, Media, Baja)
- Upload de imágenes (hospedaje, habitaciones, vehículos)
- Reservas de sus recursos
- Finanzas propias

### Panel Operador
- Gestión de reservas
- Gestión de transfers programados
- Reportes operativos

### Panel Cliente
- Mis Reservas con historial
- Mis Pagos
- Perfil con avatar personalizable
- Carrito de reservas

---

## Modelo de Negocio

La plataforma aplica un margen comercial configurable sobre el precio del
proveedor. Los usuarios ven el precio final; los proveedores reciben el
precio base. La diferencia es el ingreso de la plataforma.

| Servicio | Margen por defecto |
|----------|-------------------|
| Hospedajes | 15% |
| Actividades | 12% |
| Transfers | 10% |
| Vehículos | 10% |

Configurable en: **Admin > Configuración > Margen de Ganancias**

---

## API Endpoints

| Módulo | Base | Métodos |
|--------|------|---------|
| Auth | `/api/v1/auth` | `POST /login`, `POST /register`, `GET /profile` |
| Users | `/api/v1/users` | CRUD + cambio de rol + activar/desactivar |
| Hospedajes | `/api/v1/hospedajes` | CRUD + habitaciones + tarifas + disponibilidad + búsqueda |
| Actividades | `/api/v1/actividades` | CRUD + tarifas + calendario + paquetes + búsqueda |
| Transfers | `/api/v1/transfers` | CRUD + tarifas + vehículos + búsqueda |
| Vehículos | `/api/v1/vehiculos` | CRUD + tarifas + disponibilidad + búsqueda |
| Reservas | `/api/v1/reservas` | CRUD + `mis-reservas` + cambio de estado |
| Pagos | `/api/v1/pagos` | CRUD + reembolso |
| Financiero | `/api/v1/financiero` | Resumen, ingresos, proveedores, ocupación |
| Auditoría | `/api/v1/auditoria` | Logs filtrados por entidad/usuario |
| Uploads | `/api/v1/uploads` | Upload multipart de imágenes |

Documentación interactiva: **http://localhost:3001/api/docs**

---

## Seguridad

- **JWT** con expiración configurable (`JWT_EXPIRATION`, por defecto 7d)
- **Expiración de sesión** por inactividad del cliente (2 horas)
- **bcrypt** para hash de contraseñas (10 salt rounds)
- **RBAC** con decoradores `@Roles()` en cada endpoint
- **Ownership validation** — proveedores solo acceden a sus recursos
- **Audit interceptor** automático en operaciones de escritura (POST/PATCH/PUT/DELETE)
- **Usuario ADMIN protegido** — no se puede desactivar ni eliminar
- **Contraseñas excluidas** de respuestas y logs de auditoría
- **CORS configurable** por variable de entorno (`CORS_ORIGIN` acepta múltiples dominios)
- **Validación global** con class-validator (`ValidationPipe` con whitelist)

---

## Variables de Entorno

### Docker (`.env.docker`)

Ver `.env.docker.example` para la lista completa con comentarios.

```env
# PostgreSQL
POSTGRES_DB=turidove
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ServBay.dev        # !!! cambiar en producción
POSTGRES_PORT=5433

# Backend
JWT_SECRET=change-this-in-production  # !!! generar con openssl rand -base64 48
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000     # !!! dominio del frontend en producción

# Frontend (embebido en el build)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1  # !!! URL pública del backend
```

### Desarrollo local

- **Backend (`backend/.env`):** `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`
- **Frontend (`frontend/.env.local`):** `NEXT_PUBLIC_API_URL`

---

## Despliegue en Producción

Guía completa paso a paso en **[DEPLOYMENT.md](./DEPLOYMENT.md)**, incluye:

- Requisitos del servidor
- Configuración de `.env.docker` para producción
- Reverse proxy con **Caddy** (TLS automático con Let's Encrypt)
- Alternativa con **Nginx** + certbot
- Script de backups automáticos diarios
- Restauración desde backup
- Monitoreo, troubleshooting y checklist de seguridad

---

## Comandos útiles (Docker)

```bash
# Ver estado de los contenedores
docker compose --env-file .env.docker ps

# Ver logs en tiempo real
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker logs -f

# Reiniciar un servicio
docker compose --env-file .env.docker restart backend

# Detener todo (mantiene los datos)
docker compose --env-file .env.docker down

# Reset completo (⚠️ borra la base de datos y recarga el dump seed)
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d

# Entrar al contenedor
docker compose --env-file .env.docker exec backend sh
docker compose --env-file .env.docker exec postgres psql -U postgres -d turidove

# Rebuild tras cambios en código
docker compose --env-file .env.docker up -d --build
```

---

## Datos incluidos en el seed

Al hacer `setup.sh` por primera vez, la base de datos se inicializa con:

| Entidad | Cantidad |
|---------|----------|
| Usuarios | 9 (todos los roles) |
| Hospedajes | 16 |
| Habitaciones | 33+ con 2 tipos por hospedaje |
| Tarifas de hospedaje | 67+ (por temporada) |
| Actividades | 14+ |
| Transfers | 15+ |
| Vehículos | 12+ |
| Imágenes | 167 en `backend/uploads/` |
| Reservas | Ejemplos de muestra |

---

## Documentación adicional

- 📘 [DOCKER.md](./DOCKER.md) — Referencia técnica de la dockerización
- 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md) — Guía de despliegue en servidor
- 📄 [docs/PLATAFORMA_AGROTURISMO_MVP.md](docs/PLATAFORMA_AGROTURISMO_MVP.md) — Documento MVP para stakeholders (histórico)
- 💰 [docs/FINANZAS_RECOMENDACIONES.md](docs/FINANZAS_RECOMENDACIONES.md) — Recomendaciones módulo Finanzas

---

## Licencia y créditos

**TuriDove** — Agencia de viajes boutique internacional

Desarrollado con Claude Code como asistente de desarrollo.
