# Docker - TuriDove

Dockerización del proyecto para despliegue en producción.

## Arquitectura

Tres servicios orquestados con `docker-compose`:

- **postgres** (puerto `5433`) — PostgreSQL 18 Alpine con dump inicial
- **backend** (puerto `3001`) — NestJS compilado, migraciones automáticas
- **frontend** (puerto `3000`) — Next.js 15 en modo standalone

Volúmenes persistentes:
- `turidove_postgres_data` — Datos de PostgreSQL
- `./backend/uploads` — Imágenes subidas por usuarios (bind mount)

## Requisitos

- Docker 24+
- Docker Compose v2+

## Primera ejecución

### Opción rápida: scripts automáticos

**Linux / macOS / WSL:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows PowerShell:**
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

Los scripts verifican Docker, copian `.env.docker.example` → `.env.docker`,
construyen imágenes, levantan servicios y esperan a que el backend responda.

### Opción manual

```bash
# 1. Copiar variables de entorno
cp .env.docker.example .env.docker

# 2. Editar .env.docker y cambiar al menos JWT_SECRET
#    (el valor por defecto NO es seguro para producción)

# 3. Construir imágenes (puede tardar 5-10 min la primera vez)
docker compose --env-file .env.docker build

# 4. Levantar servicios
docker compose --env-file .env.docker up -d

# 5. Verificar que todo esté corriendo
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend
```

Después del primer arranque, PostgreSQL restaura automáticamente el dump
`docker/postgres/init/01-dump.sql` con los datos actuales (hospedajes,
habitaciones, actividades, transfers, vehículos, usuarios, reservas).

## Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/api/docs
- **PostgreSQL**: `localhost:5433` (externo para no chocar con ServBay)

## Comandos útiles

```bash
# Ver logs de un servicio
docker compose logs -f backend

# Reiniciar un servicio
docker compose restart backend

# Detener todo (preserva datos)
docker compose down

# Detener y BORRAR DATOS (reset completo → re-aplica dump)
docker compose down -v

# Entrar al contenedor
docker compose exec backend sh
docker compose exec postgres psql -U postgres -d turidove

# Rebuild sin caché (tras cambios en Dockerfile)
docker compose build --no-cache
```

## Despliegue en servidor (producción)

### Paso a paso para el equipo de DevOps

1. **Clonar el repositorio en el servidor:**
   ```bash
   git clone https://github.com/MitkaStark/TuriDove.git
   cd TuriDove
   ```

2. **Configurar variables de entorno de producción:**
   ```bash
   cp .env.docker.example .env.docker
   nano .env.docker
   ```

   Cambiar estas variables:
   ```env
   # Generar secreto fuerte: openssl rand -base64 48
   JWT_SECRET=<string aleatorio de 48+ caracteres>

   # Cambiar por los dominios reales
   NEXT_PUBLIC_API_URL=https://api.turidove.com/api/v1
   CORS_ORIGIN=https://turidove.com

   # Cambiar la contraseña de Postgres
   POSTGRES_PASSWORD=<contraseña fuerte>
   ```

3. **Levantar el stack:**
   ```bash
   ./setup.sh
   # o manualmente:
   docker compose --env-file .env.docker up -d --build
   ```

4. **Configurar reverse proxy (nginx/caddy/traefik)** para:
   - `https://tudominio.com` → `http://localhost:3000` (frontend)
   - `https://api.tudominio.com` → `http://localhost:3001` (backend)
   - Terminación TLS con Let's Encrypt

5. **Verificar:**
   ```bash
   docker compose --env-file .env.docker ps
   curl https://api.turidove.com/api/v1/hospedajes
   ```

### ¿Qué incluye el repositorio?

- ✅ Código fuente (backend + frontend)
- ✅ Dockerfiles y docker-compose.yml
- ✅ Dump inicial de PostgreSQL con 16 hospedajes, actividades, transfers,
     vehículos, usuarios seed y reservas de ejemplo
- ✅ Imágenes de los hospedajes (en `backend/uploads/`) ~21 MB
- ✅ Scripts `setup.sh` / `setup.ps1` para arranque automático

No se requiere configuración manual de base de datos, migraciones ni seed.

## Regenerar el dump de base de datos

Si agregas datos importantes en desarrollo y quieres que queden en la imagen:

```bash
PGPASSWORD="ServBay.dev" pg_dump -U postgres -h localhost -p 5432 \
  --no-owner --no-acl --clean --if-exists turidove \
  > docker/postgres/init/01-dump.sql
```

Luego `docker compose down -v && docker compose up -d` para re-inicializar.

## Troubleshooting

**El frontend muestra error de conexión al API**
- Verificar `NEXT_PUBLIC_API_URL` en `.env.docker`
- Recordar: esta URL es llamada por el navegador, no por otro contenedor.
  En local debe ser `http://localhost:3001/api/v1`.

**PostgreSQL no arranca**
- Puerto 5433 ocupado → cambia `POSTGRES_PORT` en `.env.docker`

**Las migraciones fallan**
- Borra volumen y reinicia: `docker compose down -v && docker compose up -d`
