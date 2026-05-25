# Guía de Despliegue en Producción

Esta guía está dirigida al **equipo de DevOps/desarrollador** que va a poner
el sitio en un servidor público.

## 🎯 Checklist rápido

Antes de ejecutar `setup.sh` en el servidor, **debes cambiar en `.env.docker`:**

- [ ] `JWT_SECRET` — Generar con `openssl rand -base64 48`
- [ ] `POSTGRES_PASSWORD` — Contraseña fuerte única
- [ ] `NEXT_PUBLIC_API_URL` — URL pública HTTPS del backend
- [ ] `CORS_ORIGIN` — Dominio(s) del frontend (coma-separados)

Y además en el servidor:

- [ ] Configurar reverse proxy (nginx/caddy/traefik) con TLS
- [ ] Abrir firewall (puertos 80, 443)
- [ ] Configurar DNS apuntando al servidor
- [ ] (Opcional pero recomendado) Cambiar contraseñas de usuarios seed

## 📋 Requisitos del servidor

- Linux (Ubuntu 22.04+ / Debian 12+ / similar)
- Docker Engine 24+ y Docker Compose v2+
- Mínimo 2 GB RAM, 10 GB disco libre
- Acceso SSH como sudoer o con Docker configurado para tu usuario
- Dominio (o subdominio) con DNS configurado

## 🚀 Despliegue paso a paso

### 1. Clonar el repositorio

```bash
ssh user@servidor
git clone https://github.com/MitkaStark/Agroturismo.git
cd Agroturismo
```

### 2. Configurar variables de entorno

```bash
cp .env.docker.example .env.docker
nano .env.docker  # o vim
```

Ejemplo de `.env.docker` para producción con dominio `agroturismo.pa`:

```env
# PostgreSQL
POSTGRES_DB=agroturismo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ZxA9fKt2PqLm8Nv5BcYeW3jHsRdE  # contraseña fuerte
POSTGRES_PORT=5432  # o cualquier puerto libre

# Backend
JWT_SECRET=kYs9zQ7bVcD4fRh2pL6mXn8jWgTvUeAaBsC3dF5GhI6jKlMnOpQrStUvWxYz
JWT_EXPIRATION=7d
CORS_ORIGIN=https://agroturismo.pa,https://www.agroturismo.pa

# Frontend
NEXT_PUBLIC_API_URL=https://api.agroturismo.pa/api/v1
```

### 3. Levantar la aplicación

```bash
chmod +x setup.sh
./setup.sh
```

Esto construye imágenes y levanta los 3 contenedores. Tarda ~5-10 minutos.

### 4. Configurar reverse proxy con TLS

Recomendado: **Caddy** (más simple, TLS automático con Let's Encrypt).

Instalar Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

Configurar `/etc/caddy/Caddyfile`:
```caddyfile
agroturismo.pa, www.agroturismo.pa {
    reverse_proxy localhost:3000
}

api.agroturismo.pa {
    reverse_proxy localhost:3001
}
```

Reiniciar Caddy:
```bash
sudo systemctl reload caddy
```

Caddy genera automáticamente certificados TLS con Let's Encrypt.

### Alternativa con Nginx

Si prefieres Nginx, ejemplo de configuración en `/etc/nginx/sites-available/agroturismo`:

```nginx
server {
    server_name agroturismo.pa www.agroturismo.pa;
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name api.agroturismo.pa;
    listen 80;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;  # para uploads de imágenes
    }
}
```

Luego configurar TLS con certbot:
```bash
sudo certbot --nginx -d agroturismo.pa -d www.agroturismo.pa -d api.agroturismo.pa
```

### 5. Verificar

```bash
# Servicios Docker
docker compose --env-file .env.docker ps

# API responde
curl https://api.agroturismo.pa/api/v1/hospedajes?limit=1

# Frontend carga
curl -I https://agroturismo.pa
```

### 6. Cambiar contraseñas de usuarios seed

Los usuarios seed tienen contraseñas predecibles. Después del primer login,
cambia al menos la del admin:

```bash
docker compose --env-file .env.docker exec backend node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  (async () => {
    const p = new PrismaClient();
    const hash = await bcrypt.hash('NUEVA_CONTRASEÑA_SEGURA', 10);
    await p.user.update({
      where: { email: 'admin@agroturismo.pa' },
      data: { password: hash }
    });
    console.log('OK');
    await p.\$disconnect();
  })();
"
```

## 🔄 Actualizar el sitio (después de cambios en el repo)

```bash
cd Agroturismo
git pull
docker compose --env-file .env.docker up -d --build
```

Los datos de la BD se preservan en el volumen. Las migraciones nuevas de
Prisma se aplican automáticamente al reiniciar el backend.

## 💾 Backup de base de datos

Programar un cron diario:

```bash
# Crear script /opt/backups/agroturismo-backup.sh
mkdir -p /opt/backups/agroturismo
cat > /opt/backups/agroturismo-backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
docker exec agroturismo_db pg_dump -U postgres -d agroturismo --no-owner --clean --if-exists \
  | gzip > /opt/backups/agroturismo/backup-${DATE}.sql.gz
# Mantener solo los últimos 30 backups
ls -t /opt/backups/agroturismo/*.sql.gz | tail -n +31 | xargs -r rm
EOF

chmod +x /opt/backups/agroturismo-backup.sh

# Cron diario a las 3am
echo "0 3 * * * /opt/backups/agroturismo-backup.sh" | sudo crontab -
```

**Backup de imágenes** (ya están en `backend/uploads/`, bind-mount persistente):
```bash
rsync -av /ruta/Agroturismo/backend/uploads/ /opt/backups/agroturismo-uploads/
```

## 🔄 Restaurar desde backup

```bash
# Descomprimir y restaurar
gunzip -c /opt/backups/agroturismo/backup-YYYYMMDD.sql.gz \
  | docker exec -i agroturismo_db psql -U postgres -d agroturismo
```

## 📊 Monitoreo

**Ver logs en tiempo real:**
```bash
docker compose --env-file .env.docker logs -f --tail=100
docker compose --env-file .env.docker logs -f backend    # solo backend
```

**Uso de recursos:**
```bash
docker stats agroturismo_api agroturismo_web agroturismo_db
```

## 🔧 Troubleshooting

### El frontend carga pero las llamadas API fallan con CORS
- Verifica que `CORS_ORIGIN` en `.env.docker` coincida exactamente con el
  dominio público del frontend (incluyendo `https://`, sin slash final)
- Reinicia el backend: `docker compose --env-file .env.docker restart backend`

### "Network error" al hacer login desde el navegador
- Verifica que `NEXT_PUBLIC_API_URL` apunta a la URL pública HTTPS correcta
- Esta URL se embebe en el build, así que tras cambiarla necesitas rebuild:
  ```bash
  docker compose --env-file .env.docker up -d --build frontend
  ```

### Las imágenes de los hospedajes no cargan (404)
- Verifica que `backend/uploads/` tiene las imágenes
- El backend sirve `/uploads/*` directamente; tu reverse proxy no debe
  bloquear esta ruta

### Migración de Prisma falla al arrancar
- Revisa logs: `docker compose --env-file .env.docker logs backend | tail -50`
- Si es incompatibilidad con el dump inicial, borra volumen y recrea:
  ```bash
  docker compose --env-file .env.docker down -v
  docker compose --env-file .env.docker up -d
  ```
  (⚠️ Esto borra TODOS los datos)

## 🔐 Seguridad (checklist adicional)

- [ ] Cambiar contraseña de todos los usuarios seed
- [ ] Deshabilitar Swagger (`/api/docs`) en producción si no es necesario
- [ ] Configurar rate limiting en el reverse proxy
- [ ] Configurar fail2ban para SSH
- [ ] Habilitar firewall (ufw / firewalld)
- [ ] Auditar headers de seguridad con https://securityheaders.com
- [ ] Considerar CDN (Cloudflare) para estáticos
