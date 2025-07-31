param(
    [string]$KeycloakUrl = "http://localhost:8080",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "admin123",
    [string]$RealmName = "task-management"
)

Write-Host "Configurando Keycloak..." -ForegroundColor Cyan

# Obtener token de admin
$tokenBody = "username=$AdminUser&password=$AdminPassword&grant_type=password&client_id=admin-cli"
try {
    $tokenResponse = Invoke-RestMethod -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    Write-Host "Token obtenido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "Error obteniendo token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# Crear realm
$realmData = @{
    realm = $RealmName
    enabled = $true
    displayName = "Task Management"
    registrationAllowed = $true
    loginWithEmailAllowed = $true
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms" -Method POST -Body $realmData -Headers $headers
    Write-Host "Realm creado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "Realm ya existe o error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "Configuracion completada!" -ForegroundColor Green
