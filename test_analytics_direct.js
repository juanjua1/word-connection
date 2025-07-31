const axios = require('axios');

async function testAnalyticsDirectly() {
    console.log('🔍 Probando endpoint de analytics directamente...\n');
    
    try {
        // 1. Login
        console.log('1. 🔐 Haciendo login...');
        const loginResponse = await axios.post('http://127.0.0.1:3001/api/auth/login', {
            email: 'ariel@gmail.com',
            password: 'clarita'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login exitoso\n');
        
        // 2. Probar analytics personal
        console.log('2. 📊 Probando analytics personal...');
        const personalResponse = await axios.get('http://127.0.0.1:3001/api/analytics/personal?timeframe=month', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Analytics personal funcionando');
        console.log('📄 Estructura personal:');
        console.log(JSON.stringify(personalResponse.data, null, 2));
        
        // 3. Probar analytics admin
        console.log('\n3. 📊 Probando analytics admin...');
        const adminResponse = await axios.get('http://127.0.0.1:3001/api/analytics/admin?timeframe=month', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Analytics admin funcionando');
        console.log('📄 Estructura admin:');
        console.log(JSON.stringify(adminResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error encontrado:');
        console.error(`Status: ${error.response?.status || 'N/A'}`);
        console.error(`Message: ${error.response?.data?.message || error.message}`);
        console.error(`URL: ${error.config?.url || 'N/A'}`);
        
        if (error.response?.data) {
            console.error('📄 Response data completa:');
            console.error(JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAnalyticsDirectly();
