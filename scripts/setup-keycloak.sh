#!/bin/bash

# Script para configurar Keycloak automáticamente
# Requiere que Keycloak esté corriendo en http://localhost:8080

echo "🔐 Configurando Keycloak para Task Management..."

# Variables de configuración
KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin123"
REALM_NAME="task-management"
CLIENT_ID="task-management-app"

# Verificar si Keycloak está disponible
echo "📡 Verificando conectividad con Keycloak..."
if ! curl -s "$KEYCLOAK_URL/health" > /dev/null; then
    echo "❌ Keycloak no está disponible en $KEYCLOAK_URL"
    echo "💡 Asegúrate de ejecutar: docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin123 quay.io/keycloak/keycloak:latest start-dev"
    exit 1
fi

echo "✅ Keycloak está disponible"

# Obtener token de acceso
echo "🔑 Obteniendo token de acceso..."
ACCESS_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" = "null" ]; then
    echo "❌ No se pudo obtener token de acceso"
    exit 1
fi

echo "✅ Token obtenido"

# Crear realm
echo "🏰 Creando realm '$REALM_NAME'..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"realm\": \"$REALM_NAME\",
    \"enabled\": true,
    \"displayName\": \"Task Management System\",
    \"registrationAllowed\": true,
    \"loginWithEmailAllowed\": true,
    \"duplicateEmailsAllowed\": false
  }"

echo "✅ Realm creado"

# Crear cliente
echo "🖥️ Creando cliente '$CLIENT_ID'..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"enabled\": true,
    \"publicClient\": false,
    \"serviceAccountsEnabled\": true,
    \"redirectUris\": [\"http://localhost:3000/*\"],
    \"webOrigins\": [\"http://localhost:3000\"],
    \"protocol\": \"openid-connect\",
    \"attributes\": {
      \"access.token.lifespan\": \"86400\"
    }
  }"

echo "✅ Cliente creado"

# Crear roles
echo "👥 Creando roles..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "admin", "description": "Administrator role"}'

curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "premium", "description": "Premium user role"}'

curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "common", "description": "Common user role"}'

echo "✅ Roles creados"

echo ""
echo "🎉 ¡Configuración de Keycloak completada!"
echo ""
echo "📋 Información de configuración:"
echo "   • Realm: $REALM_NAME"
echo "   • Cliente: $CLIENT_ID"
echo "   • URL Admin: $KEYCLOAK_URL/admin"
echo "   • Credenciales: $ADMIN_USER / $ADMIN_PASSWORD"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Obtener el Client Secret del cliente en la consola de administración"
echo "   2. Actualizar la variable KEYCLOAK_CLIENT_SECRET en el .env"
echo "   3. Reiniciar la aplicación backend"
echo ""
