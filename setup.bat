@echo off
echo 🚀 Iniciando configuración del Sistema de Gestión de Tareas...

:: Verificar que Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 18+ antes de continuar.
    pause
    exit /b 1
)

echo ✅ Node.js detectado: 
node --version

:: Verificar que npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado.
    pause
    exit /b 1
)

echo ✅ npm detectado:
npm --version

:: Instalar dependencias del backend
echo 📦 Instalando dependencias del backend...
cd backend
if not exist ".env" (
    echo 📝 Creando archivo .env para el backend...
    copy .env.example .env
    echo ⚠️  Por favor, revisa y ajusta las variables en backend\.env
)
call npm install --legacy-peer-deps
cd ..

:: Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
cd frontend
if not exist ".env.local" (
    echo 📝 Creando archivo .env.local para el frontend...
    copy .env.local.example .env.local
)
call npm install --legacy-peer-deps
cd ..

echo ✅ ¡Configuración completada!
echo.
echo 📋 Próximos pasos:
echo 1. Asegúrate de tener PostgreSQL ejecutándose en puerto 5432
echo    - Con Docker: docker-compose up postgres -d
echo    - O instala PostgreSQL localmente
echo.
echo 2. Ajusta las variables de entorno:
echo    - backend\.env
echo    - frontend\.env.local
echo.
echo 3. Inicia la aplicación:
echo    - Backend: cd backend ^&^& npm run start:dev
echo    - Frontend: cd frontend ^&^& npm run dev
echo    - O con Docker: docker-compose up -d
echo.
echo 4. Accede a la aplicación:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:3001/api
echo.
echo 🎉 ¡Listo para comenzar!
pause
