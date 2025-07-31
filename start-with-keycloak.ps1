# PowerShell script para iniciar Task Management con Keycloak

Write-Host "🚀 Iniciando Task Management con Keycloak..." -ForegroundColor Green
Write-Host ""

# Verificar si Docker está corriendo
try {
    docker info | Out-Null
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker no está corriendo" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop e intenta de nuevo" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Levantando servicios con Docker Compose..." -ForegroundColor Blue
docker-compose up -d

Write-Host ""
Write-Host "⏳ Esperando que los servicios estén listos..." -ForegroundColor Yellow

# Esperar a que PostgreSQL esté listo
Write-Host "🗄️  Esperando PostgreSQL..." -NoNewline -ForegroundColor Cyan
do {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $pgReady = docker-compose exec -T postgres pg_isready -q
} while ($LASTEXITCODE -ne 0)
Write-Host " ✅ PostgreSQL listo" -ForegroundColor Green

# Esperar a que Keycloak esté listo
Write-Host "🔐 Esperando Keycloak..." -NoNewline -ForegroundColor Cyan
do {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health/ready" -UseBasicParsing -TimeoutSec 5
        $keycloakReady = $response.StatusCode -eq 200
    } catch {
        $keycloakReady = $false
    }
} while (-not $keycloakReady)
Write-Host " ✅ Keycloak listo" -ForegroundColor Green

# Esperar a que el backend esté listo
Write-Host "🔙 Esperando Backend..." -NoNewline -ForegroundColor Cyan
do {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
        $backendReady = $response.StatusCode -eq 200
    } catch {
        $backendReady = $false
    }
} while (-not $backendReady)
Write-Host " ✅ Backend listo" -ForegroundColor Green

Write-Host ""
Write-Host "⚙️  Configuración de Keycloak disponible en setup-keycloak.sh" -ForegroundColor Blue
Write-Host "   Ejecuta el script en Git Bash o WSL para configurar automáticamente" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 ¡Aplicación lista!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs de acceso:" -ForegroundColor Blue
Write-Host "   Frontend:            http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API:         http://localhost:3001/api" -ForegroundColor White
Write-Host "   Keycloak Admin:      http://localhost:8080/admin" -ForegroundColor White
Write-Host "   Keycloak Auth:       http://localhost:3000/auth/keycloak" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Credenciales de Keycloak:" -ForegroundColor Blue
Write-Host "   Admin Console:       admin / admin123" -ForegroundColor White
Write-Host "   Usuario de prueba:   user@taskmanager.com / user123" -ForegroundColor White
Write-Host "   Admin de prueba:     admin@taskmanager.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "📚 Ver logs:" -ForegroundColor Blue
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Parar servicios:" -ForegroundColor Blue
Write-Host "   docker-compose down" -ForegroundColor White
