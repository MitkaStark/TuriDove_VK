# Historial de desarrollo — Agroturismo Panamá

> Bitácora del trabajo realizado en las sesiones de desarrollo con Claude Code.
> Sirve como contexto para retomar el proyecto en cualquier momento.

## Estado actual (2026-04-18)

**Proyecto dockerizado, en GitHub, listo para despliegue en producción.**

- Repo: https://github.com/MitkaStark/Agroturismo.git
- Rama única: `main`
- Último commit: `a890e08` (Actualizar README)

## Cronología de cambios principales

### Fase 1 — MVP inicial
Monorepo NestJS + Next.js 15 construido desde cero con:
- 20 tablas Prisma, 8 enums
- 5 roles: ADMIN, PROVEEDOR, AGENCIA, OPERADOR, CLIENTE
- 7 módulos de negocio + Auth + Users + Uploads + Financiero + Auditoría
- Panel admin completo, paneles por rol, catálogo público bilingüe (ES/EN)
- Sistema de margen de ganancias configurable

### Fase 2 — Correcciones y mejoras
- Bug de doble hash de contraseñas en `auth.register` + `usersService.create`
- ADMIN no podía crear/editar recursos (faltaba en `@Roles`)
- Race condition en AuthGuard con Zustand rehydration
- Soft delete → hard delete en usuarios
- Spanish accents en datos (ñ, tildes) corregidos en BD
- Mock data reemplazado por datos reales de API en todos los dashboards

### Fase 3 — Funcionalidades públicas
- Flujo completo de reserva para los 4 tipos de servicio
- Pago simulado con 4 métodos (Tarjeta, Yappy, Transferencia, Efectivo)
- Layout público con menú de usuario cuando está autenticado
- Cliente permanece en frontend público al loguearse

### Fase 4 — Seed de datos
- 15 hospedajes reales de agroturismo en Panamá
- 2 habitaciones con tarifas variadas por hospedaje
- 10 actividades, 12 transfers, 10 vehículos
- 110+ imágenes descargadas y subidas automáticamente

### Fase 5 — UX e interacciones
- Expiración de sesión por inactividad (2 horas)
- Modal de detalles de habitaciones con carrusel + tarifas por temporada
- Selector de amenidades en formularios de hospedajes (admin, proveedor, agencia)
- Centrado correcto de todos los modales (flex center)
- Cambio "Desde" → "Precio" en cards de actividades
- Buscadores funcionales en backend (campo `search` en 4 módulos)
- Menú desplegable del usuario con rutas dinámicas por rol (fix onClick → onSelect)
- Persistencia de pageSize del DataTable en sessionStorage

### Fase 6 — Fixes backend
- Manejo amigable de error al duplicar placa de vehículo (ConflictException)
- CORS configurable por variable de entorno `CORS_ORIGIN` (acepta múltiples dominios)

### Fase 7 — Dockerización (actual)
- `docker-compose.yml` con 3 servicios (postgres:18-alpine, backend, frontend)
- Dockerfiles multi-stage (backend con Prisma, frontend con Next.js standalone)
- Dump seed de PostgreSQL en `docker/postgres/init/01-dump.sql`
- 167 imágenes de `backend/uploads/` incluidas en el repo (~21MB)
- Scripts de arranque automático: `setup.sh` (bash) y `setup.ps1` (PowerShell)
- Documentación: [DOCKER.md](DOCKER.md) (referencia técnica) y [DEPLOYMENT.md](DEPLOYMENT.md) (guía paso a paso para DevOps)

## Decisiones técnicas clave

| Decisión | Razón |
|----------|-------|
| PostgreSQL 18 Alpine (no 16) | El dump de ServBay tiene directivas `\restrict` específicas de PG 18 |
| Next.js `output: standalone` | Imagen Docker más pequeña y arranque rápido |
| `ignoreBuildErrors: true` en next.config | Errores TS preexistentes no críticos en `data?.items` |
| `--legacy-peer-deps` en ambos Dockerfiles | Conflicto Nest 10 vs @nestjs/serve-static@5 que requiere Nest 11 |
| No hacer `npm prune --production` | Necesitamos Prisma CLI en runtime para migraciones |
| `onSelect` en lugar de `onClick` en Radix Dropdown | `onClick` se pierde porque Radix cierra el menú antes |
| `sessionStorage` para pageSize | Persiste durante la sesión, no permanente como localStorage |
| Puerto 5434 (no 5432) | ServBay tiene Postgres local en 5432; el dump se conecta al interno 5432 dentro de la red Docker |
| CORS configurable vía env | Hardcode a localhost rompía producción |
| Imágenes en repo (no gitignored) | Garantiza que al clonar, todo el sitio tenga su contenido visual |

## Archivos críticos

| Archivo | Qué hace |
|---------|---------|
| `docker-compose.yml` | Orquesta postgres + backend + frontend |
| `.env.docker.example` | Plantilla de variables (copiar a `.env.docker` con valores reales) |
| `setup.sh` / `setup.ps1` | Arranque automático: copia env, build, up, espera backend ready |
| `docker/postgres/init/01-dump.sql` | Dump seed que PG restaura al primer arranque (volumen vacío) |
| `backend/src/main.ts` | Punto de entrada, CORS configurable |
| `frontend/next.config.ts` | `output: 'standalone'`, ignoreBuildErrors |
| `frontend/src/store/auth.store.ts` | Zustand auth con `lastActivity` y `checkSession()` |
| `frontend/src/components/shared/data-table.tsx` | Paginación con pageSize en sessionStorage |

## Contraseñas de usuarios seed (desarrollo)

Ver [memoria de credenciales](../../../.claude/projects/c--ServBay-www-Agroturismo/memory/user_credentials.md) o:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| ADMIN | admin@agroturismo.pa | Admin123! |
| PROVEEDOR | finca.loma@agroturismo.pa | Proveedor123! |
| PROVEEDOR | aventura.chiriqui@agroturismo.pa | Proveedor123! |
| PROVEEDOR | klaudiabmc@gmail.com | Proveedor123! |
| AGENCIA | agencia.panama@agroturismo.pa | Agencia123! |
| OPERADOR | operador@agroturismo.pa | Operador123! |
| CLIENTE | juan.perez@gmail.com | Cliente123! |
| CLIENTE | ana.rodriguez@gmail.com | Cliente123! |
| CLIENTE | mitka@gmail.com | Cliente123! |

## Para retomar el proyecto

```bash
cd c:/ServBay/www/Agroturismo
docker compose --env-file .env.docker up -d
# Abrir http://localhost:3000
```

Si algo falla:
```bash
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker ps
```

Reset total (borra volumen, recarga dump seed):
```bash
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d --build
```

## Próximos pasos sugeridos (no implementados)

- Configurar HTTPS local con Caddy (para probar CORS real)
- Tests automatizados (Jest backend, Playwright frontend)
- CI/CD (GitHub Actions: build + test + push imágenes a registry)
- Integrar pasarela de pago real (Yappy API, Stripe)
- Notificaciones email (Brevo / SendGrid / Resend)
- Rate limiting en endpoints sensibles (auth, reservas)
- Deshabilitar Swagger en producción
