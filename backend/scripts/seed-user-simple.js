const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'task_management',
};

async function seedUserData() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🌱 Conectando a PostgreSQL...');
    await client.connect();
    console.log('🔌 Conexión establecida');

    // Buscar o crear el usuario ariel@gmail.com
    let userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['ariel@gmail.com']
    );

    let user;
    if (userResult.rows.length === 0) {
      console.log('👤 Creando usuario ariel@gmail.com...');
      const hashedPassword = await bcrypt.hash('clarita', 10);
      const insertUser = await client.query(
        `INSERT INTO users (email, "firstName", "lastName", password, role, "isActive") 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        ['ariel@gmail.com', 'Ariel', 'García', hashedPassword, 'common', true]
      );
      user = insertUser.rows[0];
      console.log('✅ Usuario creado exitosamente');
    } else {
      user = userResult.rows[0];
      console.log('👤 Usuario encontrado:', user.firstName, user.lastName);
    }

    // Crear categorías si no existen
    const categoryData = [
      { name: 'Trabajo', color: '#3B82F6', description: 'Tareas relacionadas con el trabajo' },
      { name: 'Personal', color: '#10B981', description: 'Tareas personales y vida privada' },
      { name: 'Estudio', color: '#F59E0B', description: 'Aprendizaje y desarrollo profesional' },
      { name: 'Salud', color: '#EF4444', description: 'Bienestar físico y mental' },
      { name: 'Hogar', color: '#8B5CF6', description: 'Tareas domésticas y mantenimiento' },
      { name: 'Proyectos', color: '#06B6D4', description: 'Proyectos personales y profesionales' },
      { name: 'Finanzas', color: '#84CC16', description: 'Gestión financiera y pagos' },
      { name: 'Ejercicio', color: '#F97316', description: 'Actividad física y deportes' }
    ];

    const categories = [];
    for (const catData of categoryData) {
      let catResult = await client.query(
        'SELECT * FROM categories WHERE name = $1',
        [catData.name]
      );

      let category;
      if (catResult.rows.length === 0) {
        const insertCat = await client.query(
          `INSERT INTO categories (name, description, color) 
           VALUES ($1, $2, $3) RETURNING *`,
          [catData.name, catData.description, catData.color]
        );
        category = insertCat.rows[0];
      } else {
        category = catResult.rows[0];
      }
      categories.push(category);
    }

    console.log('📂 Categorías preparadas:', categories.length);

    // Verificar tareas existentes del usuario
    const existingTasksResult = await client.query(
      'SELECT COUNT(*) as count FROM tasks WHERE "userId" = $1', 
      [user.id]
    );
    const existingTasksCount = parseInt(existingTasksResult.rows[0].count);
    
    if (existingTasksCount > 0) {
      console.log(`� Usuario ya tiene ${existingTasksCount} tareas existentes, agregando más...`);
    }

    // Generar tareas para los últimos 3 meses
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const taskTypes = [
      { title: 'Revisar emails', categoryName: 'Trabajo', priority: 'medium', description: 'Revisar y responder emails importantes' },
      { title: 'Reunión con equipo', categoryName: 'Trabajo', priority: 'high', description: 'Reunión semanal de seguimiento del proyecto' },
      { title: 'Completar informe mensual', categoryName: 'Trabajo', priority: 'high', description: 'Preparar informe de progreso mensual' },
      { title: 'Llamar al médico', categoryName: 'Salud', priority: 'medium', description: 'Agendar cita médica de rutina' },
      { title: 'Ejercicio matutino', categoryName: 'Ejercicio', priority: 'low', description: '30 minutos de ejercicio cardiovascular' },
      { title: 'Estudiar Node.js', categoryName: 'Estudio', priority: 'medium', description: 'Continuar curso de desarrollo backend' },
      { title: 'Pagar facturas', categoryName: 'Finanzas', priority: 'high', description: 'Pagar servicios del mes' },
      { title: 'Limpiar casa', categoryName: 'Hogar', priority: 'low', description: 'Limpieza general de la casa' },
      { title: 'Proyecto personal', categoryName: 'Proyectos', priority: 'medium', description: 'Trabajar en aplicación personal' },
      { title: 'Comprar groceries', categoryName: 'Personal', priority: 'medium', description: 'Compras semanales del supermercado' },
      { title: 'Leer libro técnico', categoryName: 'Estudio', priority: 'low', description: 'Leer capítulo de libro de programación' },
      { title: 'Backup de archivos', categoryName: 'Trabajo', priority: 'medium', description: 'Realizar respaldo de archivos importantes' },
      { title: 'Yoga/Meditación', categoryName: 'Salud', priority: 'low', description: 'Sesión de relajación y mindfulness' },
      { title: 'Planificar viaje', categoryName: 'Personal', priority: 'low', description: 'Investigar destinos para próximas vacaciones' },
      { title: 'Actualizar CV', categoryName: 'Trabajo', priority: 'medium', description: 'Actualizar información profesional' }
    ];

    let taskCounter = 0;
    let totalTasks = 0;

    console.log('📝 Generando tareas...');

    // Generar tareas día por día
    for (let date = new Date(threeMonthsAgo); date <= today; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      
      // Más tareas entre lunes y viernes
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const tasksPerDay = isWeekend ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 5) + 2;

      for (let i = 0; i < tasksPerDay; i++) {
        const taskTemplate = taskTypes[Math.floor(Math.random() * taskTypes.length)];
        const category = categories.find(c => c.name === taskTemplate.categoryName);
        
        if (!category) continue;

        const dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7)); // Vence en 0-7 días

        const status = getRandomStatus(currentDate, today);
        const title = `${taskTemplate.title} ${taskCounter % 10 === 0 ? '(Semanal)' : ''}`;

        let completedAt = null;
        if (status === 'completed') {
          completedAt = new Date(currentDate);
          completedAt.setHours(completedAt.getHours() + Math.floor(Math.random() * 16) + 8);
        }

        try {
          await client.query(
            `INSERT INTO tasks (title, description, status, priority, "dueDate", "userId", "categoryId", "createdAt", "updatedAt", "completedAt") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              title,
              taskTemplate.description,
              status,
              taskTemplate.priority,
              dueDate,
              user.id,
              category.id,
              currentDate,
              currentDate,
              completedAt
            ]
          );
          totalTasks++;
        } catch (error) {
          console.error('Error creando tarea:', error.message);
        }

        taskCounter++;
      }
    }

    // Estadísticas finales
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM tasks 
      WHERE "userId" = $1
    `, [user.id]);

    const stats = statsResult.rows[0];
    
    console.log('\n✅ Datos de prueba creados exitosamente!');
    console.log('📊 Estadísticas del usuario:');
    console.log(`   👤 Usuario: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   📝 Total de tareas: ${stats.total}`);
    console.log(`   ✅ Completadas: ${stats.completed} (${Math.round((stats.completed/stats.total)*100)}%)`);
    console.log(`   🔄 En progreso: ${stats.in_progress} (${Math.round((stats.in_progress/stats.total)*100)}%)`);
    console.log(`   ⏳ Pendientes: ${stats.pending} (${Math.round((stats.pending/stats.total)*100)}%)`);
    console.log(`   📂 Categorías: ${categories.length}`);
    console.log(`   📅 Período: ${threeMonthsAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`);

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    console.error('Detalles:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Función auxiliar
function getRandomStatus(taskDate, today) {
  const daysDiff = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24));
  
  // Las tareas más antiguas tienen más probabilidad de estar completadas
  if (daysDiff > 30) {
    const rand = Math.random();
    if (rand < 0.7) return 'completed';
    if (rand < 0.85) return 'in_progress';
    return 'pending';
  } else if (daysDiff > 7) {
    const rand = Math.random();
    if (rand < 0.5) return 'completed';
    if (rand < 0.75) return 'in_progress';
    return 'pending';
  } else {
    const rand = Math.random();
    if (rand < 0.3) return 'completed';
    if (rand < 0.6) return 'in_progress';
    return 'pending';
  }
}

// Ejecutar el script
seedUserData();
