const fetch = require('node-fetch');

async function testAnalyticsAPI() {
  try {
    // Primero hacer login para obtener el token
    console.log('🔐 Haciendo login...');
    
    const loginResponse = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ariel@gmail.com',
        password: 'clarita'
      }),
    });

    if (!loginResponse.ok) {
      console.error('❌ Error en login:', loginResponse.status, loginResponse.statusText);
      const loginError = await loginResponse.text();
      console.error('Response:', loginError);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');
    console.log('Respuesta completa:', JSON.stringify(loginData, null, 2));
    console.log('Token:', loginData.access_token ? 'Obtenido' : 'No encontrado');
    console.log('User role:', loginData.user?.role);

    const token = loginData.access_token || loginData.token;

    // Ahora probar el endpoint de analytics personal
    console.log('\n📊 Probando analytics personal...');
    
    const personalResponse = await fetch('http://127.0.0.1:3001/api/analytics/personal?timeframe=week', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', personalResponse.status);
    console.log('Status Text:', personalResponse.statusText);

    if (!personalResponse.ok) {
      console.error('❌ Error en analytics personal');
      const errorText = await personalResponse.text();
      console.error('Error response:', errorText);
    } else {
      const personalData = await personalResponse.json();
      console.log('✅ Analytics personal exitoso');
      console.log('Personal Stats:', JSON.stringify(personalData.personalStats, null, 2));
    }

    // Probar analytics admin si es admin
    if (loginData.user?.role === 'admin') {
      console.log('\n👑 Probando analytics admin...');
      
      const adminResponse = await fetch('http://127.0.0.1:3001/api/analytics/admin?timeframe=week', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Admin Status:', adminResponse.status);
      console.log('Admin Status Text:', adminResponse.statusText);

      if (!adminResponse.ok) {
        console.error('❌ Error en analytics admin');
        const errorText = await adminResponse.text();
        console.error('Admin Error response:', errorText);
      } else {
        const adminData = await adminResponse.json();
        console.log('✅ Analytics admin exitoso');
        console.log('Admin Stats:', JSON.stringify(adminData.personalStats, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testAnalyticsAPI();
