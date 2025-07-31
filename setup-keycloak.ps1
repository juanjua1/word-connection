# Script para configurar Keycloak automáticamente
$keycloakUrl = "http://localhost:8080"
$adminUser = "admin"
$adminPassword = "admin123"
$realmName = "task-management"

Write-Host "🔐 Configurando Keycloak..." -ForegroundColor Cyan

# 1. Obtener token de admin
try {
    $tokenBody = @{
        username = $adminUser
        password = $adminPassword
        grant_type = "password"
        client_id = "admin-cli"
    }
    
    $tokenResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/master/protocol/openid-connect/token" -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    Write-Host "✅ Token de admin obtenido" -ForegroundColor Green
} catch {
    Write-Host "❌ Error obteniendo token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Crear realm
try {
    $realmData = @{
        realm = $realmName
        enabled = $true
        displayName = "Task Management"
        registrationAllowed = $true
        loginWithEmailAllowed = $true
        duplicateEmailsAllowed = $false
        rememberMe = $true
        verifyEmail = $false
        loginTheme = "keycloak"
        accountTheme = "keycloak"
        adminTheme = "keycloak"
        emailTheme = "keycloak"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }

    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms" -Method POST -Body $realmData -Headers $headers
    Write-Host "✅ Realm '$realmName' creado" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️ Realm '$realmName' ya existe" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error creando realm: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 3. Crear cliente backend
try {
    $backendClientData = @{
        clientId = "task-management-backend"
        enabled = $true
        clientAuthenticatorType = "client-secret"
        secret = "your-keycloak-client-secret"
        standardFlowEnabled = $true
        directAccessGrantsEnabled = $true
        serviceAccountsEnabled = $true
        publicClient = $false
        protocol = "openid-connect"
        redirectUris = @("http://localhost:3001/*")
        webOrigins = @("http://localhost:3001")
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realmName/clients" -Method POST -Body $backendClientData -Headers $headers
    Write-Host "✅ Cliente backend creado" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️ Cliente backend ya existe" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error creando cliente backend: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. Crear cliente frontend
try {
    $frontendClientData = @{
        clientId = "task-management-frontend"
        enabled = $true
        publicClient = $true
        standardFlowEnabled = $true
        directAccessGrantsEnabled = $false
        protocol = "openid-connect"
        redirectUris = @("http://localhost:3000/*")
        webOrigins = @("http://localhost:3000")
        rootUrl = "http://localhost:3000"
        baseUrl = "http://localhost:3000"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realmName/clients" -Method POST -Body $frontendClientData -Headers $headers
    Write-Host "✅ Cliente frontend creado" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️ Cliente frontend ya existe" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error creando cliente frontend: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. Crear roles
$roles = @("admin", "user", "manager")
foreach ($role in $roles) {
    try {
        $roleData = @{
            name = $role
            description = "Role for $role users"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realmName/roles" -Method POST -Body $roleData -Headers $headers
        Write-Host "✅ Rol '$role' creado" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "⚠️ Rol '$role' ya existe" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Error creando rol '$role': $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 6. Crear usuario admin de prueba
try {
    $adminUserData = @{
        username = "testadmin"
        email = "admin@test.com"
        firstName = "Test"
        lastName = "Admin"
        enabled = $true
        emailVerified = $true
        credentials = @(
            @{
                type = "password"
                value = "admin123"
                temporary = $false
            }
        )
    } | ConvertTo-Json -Depth 3

    $userResponse = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realmName/users" -Method POST -Body $adminUserData -Headers $headers
    Write-Host "✅ Usuario admin de prueba creado" -ForegroundColor Green

    # Obtener ID del usuario creado
    $users = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realmName/users?username=testadmin" -Method GET -Headers $headers
    $userId = $users[0].id

    # Asignar rol admin
    $adminRole = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realmName/roles/admin" -Method GET -Headers $headers
    $roleAssignment = @(@{
        id = $adminRole.id
        name = $adminRole.name
    }) | ConvertTo-Json

    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realmName/users/$userId/role-mappings/realm" -Method POST -Body $roleAssignment -Headers $headers -ContentType "application/json"
    Write-Host "✅ Rol admin asignado al usuario" -ForegroundColor Green

} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️ Usuario admin ya existe" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error creando usuario admin: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Configuración de Keycloak completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Información de configuración:" -ForegroundColor Cyan
Write-Host "   Realm: $realmName" -ForegroundColor White
Write-Host "   URL: $keycloakUrl" -ForegroundColor White
Write-Host "   Cliente Backend: task-management-backend" -ForegroundColor White
Write-Host "   Cliente Frontend: task-management-frontend" -ForegroundColor White
Write-Host "   Usuario de prueba: testadmin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Reinicia el backend para aplicar los cambios" -ForegroundColor Yellow
