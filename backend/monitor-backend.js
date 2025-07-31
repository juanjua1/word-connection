const axios = require('axios');

// Monitor para ver todas las peticiones al backend en tiempo real
async function monitorBackend() {
    console.log('🔍 Monitoreando backend en tiempo real...');
    console.log('🌐 Backend URL: http://localhost:3001/api');
    console.log('📊 Verificando endpoints cada 2 segundos...\n');
    
    setInterval(async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/health');
            console.log(`✅ ${new Date().toLocaleTimeString()} - Backend funcionando`);
        } catch (error) {
            console.log(`❌ ${new Date().toLocaleTimeString()} - Backend no disponible`);
        }
    }, 2000);
}

// También vamos a hacer una petición de prueba cada vez que ejecutes esto
async function testAdminEndpoint() {
    try {
        console.log('🧪 Probando endpoint de admin...');
        
        // Login
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'juanjua@gmail.com',
            password: 'clarita'
        });
        
        const token = loginResponse.data.token;
        
        // Test del endpoint problemático
        const testResponse = await axios.post(
            'http://localhost:3001/api/admin/users/faea0bc4-5f57-4473-9949-27f50decd14e/tasks',
            {
                title: 'Test desde monitor',
                description: 'Prueba automática',
                priority: 'medium',
                categoryId: 'cf398d98-c0cc-4c4c-81e3-9a911241afa5'
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Endpoint funcionando correctamente desde el monitor');
        console.log(`📝 Tarea creada: ${testResponse.data.title}`);
        
    } catch (error) {
        console.log('❌ Error en el monitor:');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
}

console.log('🚀 Iniciando monitor...\n');
testAdminEndpoint();
monitorBackend();
