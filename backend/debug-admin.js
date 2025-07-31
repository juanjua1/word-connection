const axios = require('axios');

async function debugAdminEndpoints() {
    console.log('🔍 Debuggeando endpoints de admin...\n');
    
    try {
        // 1. Login
        console.log('1. 🔐 Login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'juanjua@gmail.com',
            password: 'clarita'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login exitoso');
        
        // 2. Verificar respuesta del endpoint de búsqueda
        console.log('\n2. 🔍 Probando endpoint de búsqueda...');
        const searchResponse = await axios.get('http://localhost:3001/api/admin/users/search', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Endpoint de búsqueda respondió');
        console.log('📄 Estructura de la respuesta:');
        console.log(JSON.stringify(searchResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error encontrado:');
        console.error(`   Status: ${error.response?.status || 'N/A'}`);
        console.error(`   Message: ${error.response?.data?.message || error.message}`);
        console.error(`   URL: ${error.config?.url || 'N/A'}`);
        
        if (error.response?.data) {
            console.error('📄 Response data completa:');
            console.error(JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugAdminEndpoints();
