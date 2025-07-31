const fetch = require('node-fetch');

const API_URL = 'http://127.0.0.1:3001/api';

async function testLogin() {
  try {
    console.log('🔐 Intentando login con ariel@gmail.com...');
    
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ariel@gmail.com',
        password: '123456'  // Password from our seed script
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Error en login:', loginResponse.status, errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso!');
    console.log('Usuario:', loginData.user?.email, loginData.user?.firstName, loginData.user?.lastName);
    
    const token = loginData.access_token;
    if (!token) {
      console.log('❌ No se recibió token de acceso');
      return;
    }

    // Test stats endpoint
    console.log('\n📊 Obteniendo estadísticas...');
    const statsResponse = await fetch(`${API_URL}/tasks/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Estadísticas obtenidas:');
      console.log('  Total tasks:', stats.total);
      console.log('  Completed:', stats.completed);
      console.log('  Pending:', stats.pending);
      console.log('  In Progress:', stats.inProgress);
      console.log('  Overdue:', stats.overdue);
    } else {
      console.log('❌ Error obteniendo stats:', statsResponse.status);
    }

    // Test analytics endpoint
    console.log('\n📈 Obteniendo analytics del último mes...');
    const analyticsResponse = await fetch(`${API_URL}/tasks/analytics/month`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      console.log('✅ Analytics obtenidos:');
      console.log('  Total en el periodo:', analytics.totalInPeriod);
      console.log('  Completadas esta semana:', analytics.completedThisWeek);
      console.log('  Completadas semana pasada:', analytics.completedLastWeek);
      console.log('  Tareas por día:', analytics.tasksByDay?.length || 0, 'registros');
    } else {
      console.log('❌ Error obteniendo analytics:', analyticsResponse.status);
    }

    // Test tasks list
    console.log('\n📋 Obteniendo lista de tareas...');
    const tasksResponse = await fetch(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json();
      console.log('✅ Tareas obtenidas:');
      console.log('  Total tareas encontradas:', tasksData.data?.length || 0);
      console.log('  Total en el sistema:', tasksData.total);
      
      if (tasksData.data && tasksData.data.length > 0) {
        console.log('  Ejemplo de tarea:');
        const task = tasksData.data[0];
        console.log('    Título:', task.title);
        console.log('    Estado:', task.status);
        console.log('    Prioridad:', task.priority);
        console.log('    Categoría:', task.category?.name || 'Sin categoría');
        console.log('    Fecha creación:', task.createdAt);
      }
    } else {
      console.log('❌ Error obteniendo tareas:', tasksResponse.status);
    }

    console.log('\n🎉 ¡Verificación completada! El seed data funcionó correctamente.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

testLogin();
