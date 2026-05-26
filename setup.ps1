# ──────────────────────────────────────────────────────────────────
#  TuriDove - Docker Setup Script (Windows PowerShell)
#
#  Uso:
#    powershell -ExecutionPolicy Bypass -File setup.ps1
#
#  Que hace:
#    1. Verifica Docker
#    2. Copia .env.docker.example -> .env.docker si no existe
#    3. Construye las imagenes
#    4. Levanta los servicios
#    5. Muestra la URL de acceso
# ──────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

Write-Host "* TuriDove - Setup Docker" -ForegroundColor Green
Write-Host ""

# 1. Verificar Docker
try {
    docker --version | Out-Null
} catch {
    Write-Host "X Docker no esta instalado" -ForegroundColor Red
    Write-Host "   Instalalo desde: https://www.docker.com/products/docker-desktop"
    exit 1
}

try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker daemon not running" }
} catch {
    Write-Host "X Docker no esta corriendo" -ForegroundColor Red
    Write-Host "   Inicia Docker Desktop y vuelve a ejecutar este script"
    exit 1
}

Write-Host "OK Docker detectado" -ForegroundColor Green

# 2. .env.docker
if (-Not (Test-Path ".env.docker")) {
    Write-Host "-> Creando .env.docker desde plantilla" -ForegroundColor Yellow
    Copy-Item ".env.docker.example" ".env.docker"
    Write-Host "!  Revisa .env.docker y cambia JWT_SECRET antes de usar en produccion" -ForegroundColor Yellow
}
Write-Host "OK Variables de entorno listas" -ForegroundColor Green

# 3. Build
Write-Host ""
Write-Host "* Construyendo imagenes (primera vez tarda 5-10 min)..." -ForegroundColor Green
docker compose --env-file .env.docker build
if ($LASTEXITCODE -ne 0) { Write-Host "X Error en build" -ForegroundColor Red; exit 1 }

# 4. Up
Write-Host ""
Write-Host "* Levantando servicios..." -ForegroundColor Green
docker compose --env-file .env.docker up -d
if ($LASTEXITCODE -ne 0) { Write-Host "X Error al levantar" -ForegroundColor Red; exit 1 }

# 5. Wait for backend
Write-Host ""
Write-Host "* Esperando a que el backend este listo..." -ForegroundColor Green
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/hospedajes?limit=1" -UseBasicParsing -TimeoutSec 2 2>$null
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Start-Sleep -Seconds 2
    Write-Host -NoNewline "."
}
Write-Host ""

if ($ready) {
    Write-Host "OK Backend respondiendo" -ForegroundColor Green
} else {
    Write-Host "!  Backend no respondio despues de 2 min. Revisa logs con: docker compose logs backend" -ForegroundColor Yellow
}

# 6. Resumen
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "OK TuriDove esta corriendo" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend   : http://localhost:3000"
Write-Host "  Backend API: http://localhost:3001/api/v1"
Write-Host "  API Docs   : http://localhost:3001/api/docs"
Write-Host ""
Write-Host "  Credenciales iniciales:"
Write-Host "    Admin    : admin@turidove.com         / Admin123!"
Write-Host "    Proveedor: paris.provider@turidove.com / Provider123!"
Write-Host "    Cliente  : cliente1@example.com        / Client123!"
Write-Host ""
Write-Host "  Comandos utiles:"
Write-Host "    docker compose --env-file .env.docker ps       # Ver estado"
Write-Host "    docker compose --env-file .env.docker logs -f  # Ver logs"
Write-Host "    docker compose --env-file .env.docker down     # Detener"
Write-Host ""
