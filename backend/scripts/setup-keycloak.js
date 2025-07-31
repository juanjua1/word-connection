const { default: KcAdminClient } = require('@keycloak/keycloak-admin-client');

async function setupKeycloak() {
  console.log('🔐 Configurando Keycloak...');
  
  const kcAdminClient = new KcAdminClient({
    baseUrl: 'http://localhost:8080',
    realmName: 'master'
  });

  try {
    // Autenticar con credenciales de admin
    await kcAdminClient.auth({
      username: 'admin',
      password: 'admin',
      grantType: 'password',
      clientId: 'admin-cli'
    });

    console.log('✅ Autenticado con Keycloak');

    // Usar el realm master por simplicidad
    const realmName = 'master';
    console.log(`✅ Usando realm '${realmName}'`);

    // Crear cliente para la aplicación
    const clientId = 'task-management-app';
    const clients = await kcAdminClient.clients.find({ clientId });
    
    let clientUuid;
    if (clients.length === 0) {
      const client = await kcAdminClient.clients.create({
        clientId: clientId,
        enabled: true,
        protocol: 'openid-connect',
        publicClient: false,
        bearerOnly: false,
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true,
        serviceAccountsEnabled: true,
        authorizationServicesEnabled: true,
        redirectUris: ['http://localhost:3000/*'],
        webOrigins: ['http://localhost:3000'],
        attributes: {
          'access.token.lifespan': '1800',
          'client.secret.creation.time': '1640995200'
        }
      });
      clientUuid = client.id;
      console.log(`✅ Cliente '${clientId}' creado`);
    } else {
      clientUuid = clients[0].id;
      console.log(`✅ Cliente '${clientId}' ya existe`);
    }

    // Obtener el secreto del cliente
    const clientSecret = await kcAdminClient.clients.getClientSecret({ id: clientUuid });
    console.log(`🔑 Client Secret: ${clientSecret.value}`);

    // Crear roles básicos
    const roles = ['admin', 'premium', 'common'];
    for (const roleName of roles) {
      try {
        await kcAdminClient.roles.create({
          name: roleName,
          description: `Role for ${roleName} users`
        });
        console.log(`✅ Rol '${roleName}' creado`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`✅ Rol '${roleName}' ya existe`);
        } else {
          console.error(`❌ Error creando rol '${roleName}':`, error.message);
        }
      }
    }

    // Crear usuario administrador de prueba
    const adminUser = {
      username: 'admin@taskmanager.com',
      email: 'admin@taskmanager.com',
      firstName: 'Admin',
      lastName: 'User',
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: 'admin123',
        temporary: false
      }]
    };

    try {
      const createdUser = await kcAdminClient.users.create(adminUser);
      console.log('✅ Usuario admin creado');
      
      // Asignar rol admin
      const adminRole = await kcAdminClient.roles.findOneByName({ name: 'admin' });
      await kcAdminClient.users.addRealmRoleMappings({
        id: createdUser.id,
        roles: [adminRole]
      });
      console.log('✅ Rol admin asignado al usuario');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Usuario admin ya existe');
      } else {
        console.error('❌ Error creando usuario admin:', error.message);
      }
    }

    console.log('\n🎉 Configuración de Keycloak completada!');
    console.log('\n📋 Configuración para el .env:');
    console.log(`KEYCLOAK_REALM=${realmName}`);
    console.log(`KEYCLOAK_CLIENT_ID=${clientId}`);
    console.log(`KEYCLOAK_CLIENT_SECRET=${clientSecret.value}`);
    console.log('\n🔗 URLs importantes:');
    console.log(`Keycloak Admin: http://localhost:8080/admin`);
    console.log(`Realm: http://localhost:8080/admin/master/console/#/${realmName}`);

  } catch (error) {
    console.error('❌ Error configurando Keycloak:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

setupKeycloak().catch(console.error);
