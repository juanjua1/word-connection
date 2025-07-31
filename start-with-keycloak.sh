#!/bin/bash

echo "🚀 Iniciando Task Management con Keycloak..."
echo ""

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "Por favor inicia Docker Desktop e intenta de nuevo"
    exit 1
fi

echo "📦 Levantando servicios con Docker Compose..."
docker-compose up -d

echo ""
echo "⏳ Esperando que los servicios estén listos..."

# Esperar a que PostgreSQL esté listo
echo "🗄️  Esperando PostgreSQL..."
until docker-compose exec -T postgres pg_isready -q; do
    printf '.'
    sleep 2
done
echo " ✅ PostgreSQL listo"

# Esperar a que Keycloak esté listo
echo "🔐 Esperando Keycloak..."
until curl -s http://localhost:8080/health/ready > /dev/null; do
    printf '.'
    sleep 5
done
echo " ✅ Keycloak listo"

# Esperar a que el backend esté listo
echo "🔙 Esperando Backend..."
until curl -s http://localhost:3001/api/health > /dev/null; do
    printf '.'
    sleep 3
done
echo " ✅ Backend listo"

# Configurar Keycloak
echo ""
echo "⚙️  Configurando Keycloak..."
if [ -f setup-keycloak.sh ]; then
    chmod +x setup-keycloak.sh
    ./setup-keycloak.sh
else
    echo "⚠️  Archivo setup-keycloak.sh no encontrado"
    echo "   Configura Keycloak manualmente desde http://localhost:8080/admin"
fi

echo ""
echo "🎉 ¡Aplicación lista!"
echo ""
echo "📋 URLs de acceso:"
echo "   Frontend:            http://localhost:3000"
echo "   Backend API:         http://localhost:3001/api"
echo "   Keycloak Admin:      http://localhost:8080/admin"
echo "   Keycloak Auth:       http://localhost:3000/auth/keycloak"
echo ""
echo "🔐 Credenciales de Keycloak:"
echo "   Admin Console:       admin / admin123"
echo "   Usuario de prueba:   user@taskmanager.com / user123"
echo "   Admin de prueba:     admin@taskmanager.com / admin123"
echo ""
echo "📚 Ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Parar servicios:"
echo "   docker-compose down"
