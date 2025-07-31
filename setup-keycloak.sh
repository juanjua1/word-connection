#!/bin/bash

# Keycloak Setup Script for Task Management Application
# This script configures Keycloak with the necessary realm, clients, and roles

KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_ADMIN_USER="admin"
KEYCLOAK_ADMIN_PASSWORD="admin123"
REALM_NAME="task-management"

echo "Starting Keycloak configuration for Task Management..."

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
until $(curl --output /dev/null --silent --head --fail ${KEYCLOAK_URL}/health/ready); do
    printf '.'
    sleep 5
done
echo "Keycloak is ready!"

# Get admin access token
echo "Getting admin access token..."
ADMIN_TOKEN=$(curl -s -X POST \
  "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN_USER}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo "Failed to get admin access token. Please check Keycloak credentials."
    exit 1
fi

echo "Admin token obtained successfully!"

# Create realm
echo "Creating realm: ${REALM_NAME}..."
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'${REALM_NAME}'",
    "displayName": "Task Management",
    "enabled": true,
    "sslRequired": "external",
    "registrationAllowed": true,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "editUsernameAllowed": false,
    "bruteForceProtected": true
  }'

# Create frontend client
echo "Creating frontend client..."
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "task-management-frontend",
    "name": "Task Management Frontend",
    "description": "Frontend application for task management",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "redirectUris": ["http://localhost:3000/*"],
    "webOrigins": ["http://localhost:3000"],
    "publicClient": true,
    "protocol": "openid-connect",
    "attributes": {
      "pkce.code.challenge.method": "S256"
    }
  }'

# Create backend client
echo "Creating backend client..."
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "task-management-backend",
    "name": "Task Management Backend",
    "description": "Backend API for task management",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "publicClient": false,
    "serviceAccountsEnabled": true,
    "protocol": "openid-connect",
    "attributes": {
      "access.token.lifespan": "300"
    }
  }'

# Create roles
echo "Creating realm roles..."

# Create user role
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user",
    "description": "Standard user role for task management"
  }'

# Create premium role
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "premium",
    "description": "Premium user role with extended capabilities"
  }'

# Create admin role
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin",
    "description": "Administrator role with full access"
  }'

# Create default user for testing
echo "Creating test users..."

# Create admin user
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@taskmanager.com",
    "email": "admin@taskmanager.com",
    "firstName": "Admin",
    "lastName": "User",
    "enabled": true,
    "credentials": [{
      "type": "password",
      "value": "admin123",
      "temporary": false
    }]
  }'

# Create regular user
curl -s -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@taskmanager.com",
    "email": "user@taskmanager.com",
    "firstName": "Regular",
    "lastName": "User",
    "enabled": true,
    "credentials": [{
      "type": "password",
      "value": "user123",
      "temporary": false
    }]
  }'

echo "Keycloak configuration completed successfully!"
echo ""
echo "=== Configuration Summary ==="
echo "Realm: ${REALM_NAME}"
echo "Frontend Client: task-management-frontend"
echo "Backend Client: task-management-backend"
echo "Roles: user, premium, admin"
echo ""
echo "=== Test Users ==="
echo "Admin: admin@taskmanager.com / admin123"
echo "User: user@taskmanager.com / user123"
echo ""
echo "Access Keycloak Admin Console at: ${KEYCLOAK_URL}/admin"
echo "Admin credentials: ${KEYCLOAK_ADMIN_USER} / ${KEYCLOAK_ADMIN_PASSWORD}"
