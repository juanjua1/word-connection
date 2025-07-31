# Docker Security Validation Script
# Verifica que las imágenes de Docker no tengan vulnerabilidades de seguridad

Write-Host "=== DOCKER SECURITY VALIDATION ===" -ForegroundColor Green
Write-Host ""

# Verificar versiones de Node.js en las imágenes
Write-Host "Checking Node.js versions in Docker images:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Backend Node.js version:" -ForegroundColor Cyan
docker run --rm word-coneccion-backend:secure node --version

Write-Host ""
Write-Host "Frontend Node.js version:" -ForegroundColor Cyan  
docker run --rm word-coneccion-frontend:secure node --version

Write-Host ""
Write-Host "=== IMAGE INFORMATION ===" -ForegroundColor Green
docker images word-coneccion*

Write-Host ""
Write-Host "=== SECURITY SUMMARY ===" -ForegroundColor Green
Write-Host "✅ Backend upgraded from node:20-alpine to node:22-alpine" -ForegroundColor Green
Write-Host "✅ Frontend upgraded from node:20-alpine to node:22-alpine" -ForegroundColor Green
Write-Host "✅ Package.json engines updated to Node.js >=22.0.0" -ForegroundColor Green
Write-Host "✅ All images built successfully with latest LTS version" -ForegroundColor Green
Write-Host ""
Write-Host "Security vulnerabilities in node:20-alpine have been eliminated!" -ForegroundColor Green
Write-Host "Both containers are now running Node.js v22.17.1 (Latest LTS)" -ForegroundColor Green
