// Script simple para verificar los datos del usuario ariel@gmail.com
const fetch = require('node-fetch');

async function verifyData() {
  try {
    console.log('🔐 Haciendo login con ariel@gmail.com...');
    
    // Verificar si podemos hacer login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ariel@gmail.com',
        password: 'clarita'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso para ariel@gmail.com');
      console.log('📊 Token recibido:', loginData.access_token ? 'Sí' : 'No');

      // Obtener estadísticas de tareas
      const statsResponse = await fetch('http://localhost:3001/api/tasks/stats', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('\n📈 Estadísticas de tareas:');
        console.log(`- Total: ${stats.total}`);
        console.log(`- Completadas: ${stats.completed}`);
        console.log(`- En progreso: ${stats.inProgress}`);
        console.log(`- Pendientes: ${stats.pending}`);
      }

      // Obtener datos de analytics
      const analyticsResponse = await fetch('http://localhost:3001/api/analytics/enhanced', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        console.log('\n📊 Analytics disponibles:');
        console.log(`- Datos de categorías: ${analytics.categoryStats ? 'Sí' : 'No'}`);
        console.log(`- Tendencias temporales: ${analytics.timeTrends ? 'Sí' : 'No'}`);
        console.log(`- Métricas de productividad: ${analytics.productivityMetrics ? 'Sí' : 'No'}`);
      }

    } else {
      console.log('❌ Error en login:', loginResponse.status, loginResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyData();
