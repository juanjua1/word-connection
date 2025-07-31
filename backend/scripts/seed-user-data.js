const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'task_management',
  synchronize: false,
  logging: false,
  entities: [
    __dirname + '/../src/entities/*.entity{.ts,.js}',
  ],
});

async function seedUserData() {
  let dataSource;
  
  try {
    console.log('🌱 Iniciando seed de datos para usuario ariel@gmail.com...');
    
    // Inicializar conexión a la base de datos
    dataSource = await AppDataSource.initialize();
    console.log('🔌 Conexión a PostgreSQL establecida');

    // Buscar o crear el usuario ariel@gmail.com
    const userRepository = dataSource.getRepository('User');
    let user = await userRepository.findOne({
      where: { email: 'ariel@gmail.com' }
    });

    if (!user) {
      console.log('👤 Creando usuario ariel@gmail.com...');
      const hashedPassword = await bcrypt.hash('clarita', 10);
      user = await userRepository.save({
        email: 'ariel@gmail.com',
        firstName: 'Ariel',
        lastName: 'García',
        password: hashedPassword,
        role: 'common',
        isActive: true
      });
      console.log('✅ Usuario creado exitosamente');
    } else {
      console.log('👤 Usuario encontrado:', user.firstName, user.lastName);
    }

    // Crear categorías si no existen
    const categoryRepository = dataSource.getRepository('Category');
    const categories = [];
    const categoryNames = [
      { name: 'Trabajo', color: '#3B82F6', description: 'Tareas relacionadas con el trabajo' },
      { name: 'Personal', color: '#10B981', description: 'Tareas personales y vida privada' },
      { name: 'Estudio', color: '#F59E0B', description: 'Aprendizaje y desarrollo profesional' },
      { name: 'Salud', color: '#EF4444', description: 'Bienestar físico y mental' },
      { name: 'Hogar', color: '#8B5CF6', description: 'Tareas domésticas y mantenimiento' },
      { name: 'Proyectos', color: '#06B6D4', description: 'Proyectos personales y profesionales' },
      { name: 'Finanzas', color: '#84CC16', description: 'Gestión financiera y pagos' },
      { name: 'Ejercicio', color: '#F97316', description: 'Actividad física y deportes' }
    ];

    for (const categoryData of categoryNames) {
      let category = await categoryRepository.findOne({
        where: { name: categoryData.name }
      });

      if (!category) {
        category = await categoryRepository.save(categoryData);
      }
      categories.push(category);
    }

    console.log('📂 Categorías preparadas:', categories.length);

    // Eliminar tareas existentes del usuario para empezar limpio
    const taskRepository = dataSource.getRepository('Task');
    await taskRepository.delete({ userId: user.id });
    console.log('🗑️ Tareas anteriores eliminadas');

    // Generar tareas para los últimos 3 meses
    const tasks = [];
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // Configuración de patrones realistas
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
        const task = {
          title: `${taskTemplate.title} ${taskCounter % 10 === 0 ? '(Semanal)' : ''}`,
          description: taskTemplate.description,
          status: status,
          priority: taskTemplate.priority,
          dueDate: dueDate,
          userId: user.id,
          categoryId: category.id,
          createdAt: currentDate,
          updatedAt: currentDate
        };

        // Si la tarea está completada, agregar fecha de completado
        if (task.status === 'completed') {
          const completedDate = new Date(currentDate);
          completedDate.setHours(completedDate.getHours() + Math.floor(Math.random() * 16) + 8); // Entre 8am y 11pm
          task.completedAt = completedDate;
        }

        tasks.push(task);
        taskCounter++;
      }
    }

    // Insertar tareas en la base de datos
    console.log(`📝 Creando ${tasks.length} tareas...`);
    
    await taskRepository.save(tasks);

    // Estadísticas finales
    const stats = await getTaskStats(taskRepository, user.id);
    
    console.log('\n✅ Datos de prueba creados exitosamente!');
    console.log('📊 Estadísticas del usuario:');
    console.log(`   👤 Usuario: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   📝 Total de tareas: ${stats.total}`);
    console.log(`   ✅ Completadas: ${stats.completed} (${Math.round((stats.completed/stats.total)*100)}%)`);
    console.log(`   🔄 En progreso: ${stats.inProgress} (${Math.round((stats.inProgress/stats.total)*100)}%)`);
    console.log(`   ⏳ Pendientes: ${stats.pending} (${Math.round((stats.pending/stats.total)*100)}%)`);
    console.log(`   📂 Categorías: ${categories.length}`);
    console.log(`   📅 Período: ${threeMonthsAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`);

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    console.error('Detalles del error:', error.message);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexión a base de datos cerrada');
    }
  }
}

// Funciones auxiliares
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

async function getTaskStats(taskRepository, userId) {
  const total = await taskRepository.count({ where: { userId } });
  const completed = await taskRepository.count({ where: { userId, status: 'completed' } });
  const inProgress = await taskRepository.count({ where: { userId, status: 'in_progress' } });
  const pending = await taskRepository.count({ where: { userId, status: 'pending' } });
  
  return { total, completed, inProgress, pending };
}

// Ejecutar el script
seedUserData();
