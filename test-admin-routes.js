// Script de prueba para verificar las rutas administrativas
// Ejecutar en la consola del navegador en http://localhost:3000

async function testAdminRoutes() {
  const API_URL = 'http://localhost:3001/api';
  
  console.log('🔍 Probando rutas administrativas...');
  
  try {
    // 1. Probar búsqueda de usuarios
    console.log('\n1. Probando búsqueda de usuarios...');
    const usersResponse = await fetch(`${API_URL}/admin/users/search`, {
      headers: {
        'Content-Type': 'application/json',
        // En producción, aquí iría el token JWT
        // 'Authorization': 'Bearer your-jwt-token'
      }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Búsqueda de usuarios:', usersData);
    } else {
      console.log('❌ Error en búsqueda de usuarios:', usersResponse.status, usersResponse.statusText);
    }
    
    // 2. Probar listado de usuarios simple
    console.log('\n2. Probando listado de usuarios...');
    const allUsersResponse = await fetch(`${API_URL}/users`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (allUsersResponse.ok) {
      const allUsersData = await allUsersResponse.json();
      console.log('✅ Listado de usuarios:', allUsersData);
    } else {
      console.log('❌ Error en listado de usuarios:', allUsersResponse.status, allUsersResponse.statusText);
    }
    
    // 3. Probar categorías
    console.log('\n3. Probando categorías...');
    const categoriesResponse = await fetch(`${API_URL}/categories`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categorías:', categoriesData);
    } else {
      console.log('❌ Error en categorías:', categoriesResponse.status, categoriesResponse.statusText);
    }
    
  } catch (error) {
    console.error('🚨 Error general:', error);
  }
}

// Información de uso
console.log(`
🚀 Script de prueba para rutas administrativas

Para probar las rutas administrativas:
1. Abre http://localhost:3000 en tu navegador
2. Abre las herramientas de desarrollador (F12)
3. Ve a la consola
4. Ejecuta: testAdminRoutes()

También puedes navegar directamente a:
- Panel de administración: http://localhost:3000/admin
- API Backend: http://localhost:3001/api
`);

// Auto-ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  testAdminRoutes();
}
