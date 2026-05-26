#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
#  TuriDove — Docker Setup Script (Linux / macOS / WSL)
#
#  Uso:
#    chmod +x setup.sh
#    ./setup.sh
#
#  Qué hace:
#    1. Verifica Docker
#    2. Copia .env.docker.example → .env.docker si no existe
#    3. Construye las imágenes
#    4. Levanta los servicios
#    5. Muestra la URL de acceso
# ──────────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}▶ TuriDove — Setup Docker${NC}"
echo ""

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker no está instalado${NC}"
    echo "   Instálalo desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker no está corriendo${NC}"
    echo "   Inicia Docker Desktop y vuelve a ejecutar este script"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker detectado"

# 2. .env.docker
if [ ! -f ".env.docker" ]; then
    echo -e "${YELLOW}→${NC} Creando .env.docker desde plantilla"
    cp .env.docker.example .env.docker
    echo -e "${YELLOW}⚠${NC}  Revisa .env.docker y cambia JWT_SECRET antes de usar en producción"
fi
echo -e "${GREEN}✓${NC} Variables de entorno listas"

# 3. Build
echo ""
echo -e "${GREEN}▶ Construyendo imágenes (primera vez tarda 5-10 min)...${NC}"
docker compose --env-file .env.docker build

# 4. Up
echo ""
echo -e "${GREEN}▶ Levantando servicios...${NC}"
docker compose --env-file .env.docker up -d

# 5. Wait for backend
echo ""
echo -e "${GREEN}▶ Esperando a que el backend esté listo...${NC}"
for i in {1..60}; do
    if curl -sf http://localhost:3001/api/v1/hospedajes?limit=1 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend respondiendo"
        break
    fi
    sleep 2
    echo -n "."
done
echo ""

# 6. Resumen
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ TuriDove está corriendo${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Frontend   : http://localhost:3000"
echo "  Backend API: http://localhost:3001/api/v1"
echo "  API Docs   : http://localhost:3001/api/docs"
echo ""
echo "  Credenciales iniciales:"
echo "    Admin    : admin@turidove.com         / Admin123!"
echo "    Proveedor: paris.provider@turidove.com / Provider123!"
echo "    Cliente  : cliente1@example.com        / Client123!"
echo ""
echo "  Comandos útiles:"
echo "    docker compose --env-file .env.docker ps       # Ver estado"
echo "    docker compose --env-file .env.docker logs -f  # Ver logs"
echo "    docker compose --env-file .env.docker down     # Detener"
echo ""
