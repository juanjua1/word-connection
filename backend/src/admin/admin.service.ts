import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { Category } from '../entities/category.entity';

export interface SearchUsersQuery {
  search?: string;
  page?: number;
  limit?: number;
  role?: UserRole;
}

export interface CreateTaskForUserDto {
  title: string;
  description?: string;
  priority: TaskPriority;
  categoryId: string;
  dueDate?: Date;
  assignedToUserId: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async searchUsers(query: SearchUsersQuery, requestingUser: User) {
    // Verificar que el usuario que hace la petición sea admin
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden buscar usuarios');
    }

    const { search, page = 1, limit = 10, role } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.isActive',
        'user.createdAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Filtrar por búsqueda de texto
    if (search) {
      queryBuilder.where(
        '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    // Filtrar por rol
    if (role) {
      if (search) {
        queryBuilder.andWhere('user.role = :role', { role });
      } else {
        queryBuilder.where('user.role = :role', { role });
      }
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    // Obtener estadísticas de tareas para cada usuario
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const taskStats = await this.taskRepository
          .createQueryBuilder('task')
          .select([
            'COUNT(*) as total',
            'COUNT(CASE WHEN task.status = \'completed\' THEN 1 END) as completed',
            'COUNT(CASE WHEN task.status = \'pending\' THEN 1 END) as pending',
            'COUNT(CASE WHEN task.status = \'in_progress\' THEN 1 END) as inProgress',
          ])
          .where('task.userId = :userId', { userId: user.id })
          .getRawOne();

        return {
          ...user,
          taskStats: {
            total: parseInt(taskStats.total) || 0,
            completed: parseInt(taskStats.completed) || 0,
            pending: parseInt(taskStats.pending) || 0,
            inProgress: parseInt(taskStats.inProgress) || 0,
          },
        };
      })
    );

    return {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string, requestingUser: User) {
    // Verificar que el usuario que hace la petición sea admin
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden ver detalles de usuarios');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener tareas del usuario
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
      .where('task.userId = :userId', { userId })
      .orderBy('task.createdAt', 'DESC')
      .getMany();

    // Estadísticas de tareas
    const taskStats = await this.taskRepository
      .createQueryBuilder('task')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN task.status = \'completed\' THEN 1 END) as completed',
        'COUNT(CASE WHEN task.status = \'pending\' THEN 1 END) as pending',
        'COUNT(CASE WHEN task.status = \'in_progress\' THEN 1 END) as inProgress',
        'COUNT(CASE WHEN task.priority = \'urgent\' THEN 1 END) as urgent',
        'COUNT(CASE WHEN task.priority = \'high\' THEN 1 END) as high',
      ])
      .where('task.userId = :userId', { userId })
      .getRawOne();

    return {
      user,
      tasks,
      taskStats: {
        total: parseInt(taskStats.total) || 0,
        completed: parseInt(taskStats.completed) || 0,
        pending: parseInt(taskStats.pending) || 0,
        inProgress: parseInt(taskStats.inProgress) || 0,
        urgent: parseInt(taskStats.urgent) || 0,
        high: parseInt(taskStats.high) || 0,
      },
    };
  }

  async createTaskForUser(createTaskDto: CreateTaskForUserDto, requestingUser: User) {
    // Verificar que el usuario que hace la petición sea admin
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden crear tareas para otros usuarios');
    }

    const { assignedToUserId, categoryId, ...taskData } = createTaskDto;

    // Verificar que el usuario al que se asigna la tarea existe
    const assignedUser = await this.userRepository.findOne({
      where: { id: assignedToUserId },
    });

    if (!assignedUser) {
      throw new NotFoundException('Usuario a asignar no encontrado');
    }

    // Verificar que la categoría existe
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Crear la tarea
    const task = this.taskRepository.create({
      ...taskData,
      userId: requestingUser.id, // El admin que crea la tarea
      assignedToUserId: assignedUser.id, // El usuario al que se le asigna
      categoryId: category.id,
      status: TaskStatus.PENDING,
      isCompleted: false,
      assignedAt: new Date(),
      assignedBy: `${requestingUser.firstName} ${requestingUser.lastName}`,
    });

    const savedTask = await this.taskRepository.save(task);

    // Retornar la tarea con relaciones cargadas
    return this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['user', 'assignedToUser', 'category'],
      select: {
        user: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
        assignedToUser: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
        category: {
          id: true,
          name: true,
          color: true,
        },
      },
    });
  }

  async updateUserRole(userId: string, newRole: UserRole, requestingUser: User) {
    // Verificar que el usuario que hace la petición sea admin
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden cambiar roles');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // No permitir que se quite el rol de admin si es el último admin
    if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await this.userRepository.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('No se puede quitar el rol de administrador al último admin del sistema');
      }
    }

    user.role = newRole;
    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async toggleUserStatus(userId: string, requestingUser: User) {
    // Verificar que el usuario que hace la petición sea admin
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden activar/desactivar usuarios');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // No permitir desactivar el último admin
    if (user.role === UserRole.ADMIN && user.isActive) {
      const activeAdminCount = await this.userRepository.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });

      if (activeAdminCount <= 1) {
        throw new ForbiddenException('No se puede desactivar al último administrador del sistema');
      }
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async getCategories() {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }
}
