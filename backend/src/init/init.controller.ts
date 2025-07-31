import { Controller, Post, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';

@Controller('init')
export class InitController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  @Post('setup')
  async setupDatabase() {
    try {
      // Crear categorías
      const categories = [
        { name: 'Trabajo', color: '#3B82F6', description: 'Tareas relacionadas con el trabajo' },
        { name: 'Personal', color: '#10B981', description: 'Tareas personales' },
        { name: 'Estudios', color: '#8B5CF6', description: 'Tareas de estudio y aprendizaje' },
        { name: 'Proyecto', color: '#F59E0B', description: 'Tareas de proyectos específicos' },
      ];

      const savedCategories: Category[] = [];
      for (const categoryData of categories) {
        let category = await this.categoryRepository.findOne({ 
          where: { name: categoryData.name } 
        });
        
        if (!category) {
          category = this.categoryRepository.create(categoryData);
          category = await this.categoryRepository.save(category);
        }
        savedCategories.push(category);
      }

      // Crear usuarios de prueba
      const users = [
        {
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
          password: 'password123', // En producción esto debería estar hasheado
        },
        {
          email: 'user1@test.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          role: UserRole.COMMON,
          password: 'password123',
        },
        {
          email: 'user2@test.com',
          firstName: 'María',
          lastName: 'García',
          role: UserRole.COMMON,
          password: 'password123',
        },
        {
          email: 'premium@test.com',
          firstName: 'Carlos',
          lastName: 'López',
          role: UserRole.PREMIUM,
          password: 'password123',
        },
      ];

      const savedUsers: User[] = [];
      for (const userData of users) {
        let user = await this.userRepository.findOne({ 
          where: { email: userData.email } 
        });
        
        if (!user) {
          user = this.userRepository.create(userData);
          user = await this.userRepository.save(user);
        }
        savedUsers.push(user);
      }

      // Crear algunas tareas de ejemplo
      const tasks = [
        {
          title: 'Revisar documentación',
          description: 'Revisar la documentación del proyecto y hacer correcciones',
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          userId: savedUsers[0].id, // Admin User como creador
          assignedToUserId: savedUsers[1].id, // Juan Pérez
          category: savedCategories[0], // Trabajo
        },
        {
          title: 'Comprar víveres',
          description: 'Hacer la compra semanal de víveres',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.LOW,
          userId: savedUsers[0].id, // Admin User como creador
          assignedToUserId: savedUsers[2].id, // María García
          category: savedCategories[1], // Personal
        },
        {
          title: 'Estudiar para examen',
          description: 'Preparar el examen de matemáticas del próximo viernes',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          userId: savedUsers[0].id, // Admin User como creador
          assignedToUserId: savedUsers[3].id, // Carlos López
          category: savedCategories[2], // Estudios
        },
      ];

      for (const taskData of tasks) {
        const existingTask = await this.taskRepository.findOne({
          where: { title: taskData.title }
        });
        
        if (!existingTask) {
          const task = this.taskRepository.create(taskData);
          await this.taskRepository.save(task);
        }
      }

      return {
        message: 'Base de datos inicializada correctamente',
        users: savedUsers.length,
        categories: savedCategories.length,
        tasks: tasks.length,
      };
    } catch (error) {
      console.error('Error inicializando la base de datos:', error);
      throw error;
    }
  }

  @Get('status')
  async getStatus() {
    const userCount = await this.userRepository.count();
    const categoryCount = await this.categoryRepository.count();
    const taskCount = await this.taskRepository.count();

    return {
      users: userCount,
      categories: categoryCount,
      tasks: taskCount,
      message: userCount > 0 ? 'Base de datos inicializada' : 'Base de datos vacía',
    };
  }
}
