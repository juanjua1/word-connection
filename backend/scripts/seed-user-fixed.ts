import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { Task, TaskStatus, TaskPriority } from '../src/entities/task.entity';
import { Category } from '../src/entities/category.entity';
import * as bcrypt from 'bcryptjs';

interface CategoryData {
  name: string;
  description: string;
  color: string;
}

interface TaskTemplate {
  title: string;
  description: string;
  categoryName: string;
  priority: TaskPriority;
  status: TaskStatus;
  daysAgo: number;
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const taskRepository = app.get<Repository<Task>>(getRepositoryToken(Task));
    const categoryRepository = app.get<Repository<Category>>(getRepositoryToken(Category));

    // Buscar o crear usuario
    let user = await userRepository.findOne({ 
      where: { email: 'ariel@gmail.com' } 
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('clarita', 10);
      user = userRepository.create({
        email: 'ariel@gmail.com',
        password: hashedPassword,
        firstName: 'Ariel',
        lastName: 'Rodriguez',
        role: UserRole.COMMON
      });
      user = await userRepository.save(user);
      console.log('✅ Usuario creado:', user.email);
    } else {
      console.log('✅ Usuario encontrado:', user.email);
    }

    // Crear categorías
    const categoryData: CategoryData[] = [
      { name: 'Trabajo', description: 'Tareas relacionadas con el trabajo', color: '#3B82F6' },
      { name: 'Personal', description: 'Tareas personales', color: '#10B981' },
      { name: 'Estudio', description: 'Tareas de estudio y aprendizaje', color: '#8B5CF6' },
      { name: 'Salud', description: 'Tareas relacionadas con la salud', color: '#F59E0B' },
      { name: 'Hogar', description: 'Tareas del hogar', color: '#EF4444' },
      { name: 'Proyectos', description: 'Proyectos personales', color: '#06B6D4' },
      { name: 'Finanzas', description: 'Gestión financiera', color: '#84CC16' },
      { name: 'Ejercicio', description: 'Rutinas de ejercicio', color: '#F97316' }
    ];

    const categories: Category[] = [];
    for (const categoryInfo of categoryData) {
      let category = await categoryRepository.findOne({ 
        where: { name: categoryInfo.name } 
      });
      
      if (!category) {
        category = categoryRepository.create(categoryInfo);
        category = await categoryRepository.save(category);
        console.log(`✅ Categoría creada: ${category.name}`);
      }
      categories.push(category);
    }

    // Limpiar tareas existentes del usuario
    const existingTasks = await taskRepository.find({
      where: { user: { id: user.id } }
    });
    
    if (existingTasks.length > 0) {
      await taskRepository.remove(existingTasks);
      console.log(`🗑️ Eliminadas ${existingTasks.length} tareas existentes`);
    }

    // Plantillas de tareas para generar datos diversos
    const taskTemplates: TaskTemplate[] = [
      // Trabajo
      { title: 'Revisar emails matutinos', description: 'Revisar y responder emails importantes', categoryName: 'Trabajo', priority: TaskPriority.MEDIUM, status: TaskStatus.COMPLETED, daysAgo: 89 },
      { title: 'Reunión semanal de equipo', description: 'Reunión de seguimiento con el equipo', categoryName: 'Trabajo', priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED, daysAgo: 85 },
      { title: 'Actualizar documentación del proyecto', description: 'Documentar cambios recientes', categoryName: 'Trabajo', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, daysAgo: 15 },
      { title: 'Preparar presentación trimestral', description: 'Crear slides para la presentación', categoryName: 'Trabajo', priority: TaskPriority.HIGH, status: TaskStatus.PENDING, daysAgo: 5 },
      
      // Personal
      { title: 'Llamar a mamá', description: 'Ponerse al día con la familia', categoryName: 'Personal', priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, daysAgo: 87 },
      { title: 'Organizar fotos del viaje', description: 'Clasificar y editar fotos', categoryName: 'Personal', priority: TaskPriority.LOW, status: TaskStatus.PENDING, daysAgo: 30 },
      { title: 'Comprar regalo de cumpleaños', description: 'Buscar regalo para Ana', categoryName: 'Personal', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, daysAgo: 10 },
      
      // Estudio
      { title: 'Completar curso de React', description: 'Terminar los últimos módulos', categoryName: 'Estudio', priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, daysAgo: 45 },
      { title: 'Leer libro de productividad', description: 'Atomic Habits - Capítulos 5-8', categoryName: 'Estudio', priority: TaskPriority.MEDIUM, status: TaskStatus.COMPLETED, daysAgo: 60 },
      { title: 'Practicar TypeScript', description: 'Hacer ejercicios avanzados', categoryName: 'Estudio', priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING, daysAgo: 7 },
      
      // Salud
      { title: 'Cita médica anual', description: 'Chequeo general de salud', categoryName: 'Salud', priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED, daysAgo: 75 },
      { title: 'Ir al gimnasio', description: 'Rutina de cardio y pesas', categoryName: 'Salud', priority: TaskPriority.MEDIUM, status: TaskStatus.COMPLETED, daysAgo: 2 },
      { title: 'Programar cita con dentista', description: 'Limpieza dental semestral', categoryName: 'Salud', priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING, daysAgo: 14 },
      
      // Hogar
      { title: 'Limpiar garaje', description: 'Organizar herramientas y cajas', categoryName: 'Hogar', priority: TaskPriority.LOW, status: TaskStatus.PENDING, daysAgo: 21 },
      { title: 'Arreglar grifo de la cocina', description: 'Reparar fuga menor', categoryName: 'Hogar', priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED, daysAgo: 40 },
      { title: 'Plantar flores en el jardín', description: 'Preparar macetas para primavera', categoryName: 'Hogar', priority: TaskPriority.LOW, status: TaskStatus.IN_PROGRESS, daysAgo: 18 },
      
      // Proyectos
      { title: 'Crear blog personal', description: 'Configurar sitio web con Gatsby', categoryName: 'Proyectos', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, daysAgo: 35 },
      { title: 'App de seguimiento de hábitos', description: 'Desarrollar MVP en React Native', categoryName: 'Proyectos', priority: TaskPriority.HIGH, status: TaskStatus.PENDING, daysAgo: 12 },
      
      // Finanzas
      { title: 'Revisar gastos mensuales', description: 'Analizar presupuesto de abril', categoryName: 'Finanzas', priority: TaskPriority.MEDIUM, status: TaskStatus.COMPLETED, daysAgo: 55 },
      { title: 'Declaración de impuestos', description: 'Reunir documentos necesarios', categoryName: 'Finanzas', priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED, daysAgo: 70 },
      { title: 'Investigar opciones de inversión', description: 'Comparar fondos indexados', categoryName: 'Finanzas', priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING, daysAgo: 8 },
      
      // Ejercicio
      { title: 'Correr 5km', description: 'Entrenamiento cardiovascular', categoryName: 'Ejercicio', priority: TaskPriority.MEDIUM, status: TaskStatus.COMPLETED, daysAgo: 3 },
      { title: 'Clase de yoga', description: 'Sesión de yoga matutina', categoryName: 'Ejercicio', priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, daysAgo: 6 },
      { title: 'Planificar rutina de ejercicios', description: 'Crear plan semanal de entrenamiento', categoryName: 'Ejercicio', priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING, daysAgo: 4 }
    ];

    // Generar tareas adicionales para tener más variedad
    const additionalTasks: TaskTemplate[] = [];
    const baseDate = new Date();
    
    for (let i = 0; i < 90; i++) {
      const randomTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
      const randomStatus = [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS, TaskStatus.PENDING][Math.floor(Math.random() * 3)];
      const randomPriority = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH][Math.floor(Math.random() * 3)];
      
      additionalTasks.push({
        title: `${randomTemplate.title} (Día ${i + 1})`,
        description: randomTemplate.description,
        categoryName: randomTemplate.categoryName,
        priority: randomPriority,
        status: randomStatus,
        daysAgo: Math.floor(Math.random() * 90)
      });
    }

    // Combinar todas las tareas
    const allTasks = [...taskTemplates, ...additionalTasks];

    // Crear tareas
    let createdCount = 0;
    for (const taskTemplate of allTasks) {
      const category = categories.find(c => c.name === taskTemplate.categoryName);
      if (!category) continue;

      const taskDate = new Date();
      taskDate.setDate(taskDate.getDate() - taskTemplate.daysAgo);

      const taskData = taskRepository.create({
        title: taskTemplate.title,
        description: taskTemplate.description,
        status: taskTemplate.status,
        priority: taskTemplate.priority,
        dueDate: taskDate,
        user: user,
        category: category,
        createdAt: taskDate,
        updatedAt: taskDate,
        isCompleted: taskTemplate.status === TaskStatus.COMPLETED,
        completedAt: taskTemplate.status === TaskStatus.COMPLETED ? taskDate : null
      });

      await taskRepository.save(taskData);
      createdCount++;
    }

    // Estadísticas finales
    const finalTasks = await taskRepository.find({
      where: { user: { id: user.id } },
      relations: ['category']
    });

    const stats = {
      total: finalTasks.length,
      completed: finalTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgress: finalTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      pending: finalTasks.filter(t => t.status === TaskStatus.PENDING).length,
    };

    console.log('\n📊 Estadísticas de tareas creadas:');
    console.log(`Total: ${stats.total} tareas`);
    console.log(`Completadas: ${stats.completed} (${Math.round(stats.completed/stats.total*100)}%)`);
    console.log(`En progreso: ${stats.inProgress} (${Math.round(stats.inProgress/stats.total*100)}%)`);
    console.log(`Pendientes: ${stats.pending} (${Math.round(stats.pending/stats.total*100)}%)`);
    
    console.log(`\n✅ Usuario: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`✅ Datos de prueba creados exitosamente!`);

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
  } finally {
    await app.close();
  }
}

seed();
