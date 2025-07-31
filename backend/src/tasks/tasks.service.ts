import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, LessThan, MoreThanOrEqual, Not, IsNull } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../dto/task.dto';

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(user: User, queryDto: TaskQueryDto): Promise<PaginatedTasks> {
    const { status, categoryId, search, page = '1', limit = '10' } = queryDto;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const now = new Date();

    // Usar query builder para manejar condiciones complejas
    let query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
      .leftJoinAndSelect('task.user', 'user')
      .leftJoinAndSelect('task.assignedToUser', 'assignedToUser')
      .where('(task.userId = :userId OR task.assignedToUserId = :userId)', { userId: user.id })
      .andWhere(
        '(task.status != :completedStatus OR ' +
        '(task.status = :completedStatus AND (task.visibleUntil IS NULL OR task.visibleUntil >= :now)))',
        { 
          completedStatus: TaskStatus.COMPLETED,
          now: now
        }
      );

    // Aplicar filtros adicionales
    if (status) {
      query = query.andWhere('task.status = :status', { status });
    }
    if (categoryId) {
      query = query.andWhere('task.categoryId = :categoryId', { categoryId });
    }
    if (search) {
      query = query.andWhere('task.title ILIKE :search', { search: `%${search}%` });
    }

    // Contar total antes de aplicar paginación
    const total = await query.getCount();

    // Aplicar paginación y orden
    const tasks = await query
      .orderBy('task.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum)
      .getMany();

    return {
      tasks,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: [
        { id, userId: user.id },
        { id, assignedToUserId: user.id },
      ],
      relations: ['category', 'user', 'assignedToUser'],
    });

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      userId: user.id,
      assignedToUserId: createTaskDto.assignedToUserId || user.id,
      assignedBy: `${user.firstName} ${user.lastName}`,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
    });

    const savedTask = await this.taskRepository.save(task);

    // Note: Task assignment notifications have been disabled
    // in this simplified version of the application

    return savedTask;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    if (updateTaskDto.dueDate) {
      updateTaskDto.dueDate = new Date(updateTaskDto.dueDate).toISOString();
    }

    // Manejo de completación de tareas
    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      updateTaskDto.isCompleted = true;
      const now = new Date();
      task.completedAt = now;
      // La tarea seguirá visible por 10 horas después de completada
      const visibleUntil = new Date(now.getTime() + 10 * 60 * 60 * 1000);
      task.visibleUntil = visibleUntil;
      task.isOverdue = false; // Una tarea completada no puede estar atrasada
    } else if (updateTaskDto.isCompleted === false) {
      updateTaskDto.status = TaskStatus.PENDING;
      task.completedAt = null;
      task.visibleUntil = null;
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);
    await this.taskRepository.remove(task);
  }

  async getTaskStats(user: User) {
    const now = new Date();
    
    // Contar tareas que pertenecen al usuario (creadas o asignadas)
    const totalCreated = await this.taskRepository.count({
      where: { userId: user.id },
    });
    
    const totalAssigned = await this.taskRepository.count({
      where: { assignedToUserId: user.id },
    });

    // Estadísticas para tareas asignadas al usuario
    const completedAssigned = await this.taskRepository.count({
      where: { assignedToUserId: user.id, status: TaskStatus.COMPLETED },
    });
    
    const pendingAssigned = await this.taskRepository.count({
      where: { assignedToUserId: user.id, status: TaskStatus.PENDING },
    });
    
    const inProgressAssigned = await this.taskRepository.count({
      where: { assignedToUserId: user.id, status: TaskStatus.IN_PROGRESS },
    });

    // Tareas atrasadas (asignadas al usuario, con fecha de vencimiento pasada y no completadas)
    const overdueAssigned = await this.taskRepository.count({
      where: { 
        assignedToUserId: user.id, 
        dueDate: LessThan(now),
        status: TaskStatus.PENDING,
        isOverdue: true
      },
    });

    return {
      totalCreated,
      totalAssigned,
      completed: completedAssigned,
      pending: pendingAssigned,
      inProgress: inProgressAssigned,
      overdue: overdueAssigned,
      completionRate: totalAssigned > 0 ? Math.round((completedAssigned / totalAssigned) * 100) : 0,
    };
  }

  // Método para marcar tareas atrasadas automáticamente
  async markOverdueTasks(): Promise<void> {
    const now = new Date();
    
    await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ isOverdue: true })
      .where('dueDate < :now', { now })
      .andWhere('status != :completed', { completed: TaskStatus.COMPLETED })
      .andWhere('status != :cancelled', { cancelled: TaskStatus.CANCELLED })
      .andWhere('isOverdue = :isOverdue', { isOverdue: false })
      .execute();
  }

  // Obtener estadísticas avanzadas para analytics
  async getAdvancedAnalytics(user: User, period: 'week' | 'month' | 'all') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(user.createdAt);
        break;
    }

    const baseWhere = { assignedToUserId: user.id };

    // Tareas del usuario
    const userTasks = await this.taskRepository.count({
      where: baseWhere,
    });

    // Tareas del usuario en el período específico
    const userTasksPeriod = await this.taskRepository.count({
      where: {
        ...baseWhere,
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    // Tareas completadas
    const completedTasks = await this.taskRepository.count({
      where: { ...baseWhere, status: TaskStatus.COMPLETED },
    });

    // Tareas completadas en el período
    const completedTasksPeriod = await this.taskRepository.count({
      where: {
        ...baseWhere,
        status: TaskStatus.COMPLETED,
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    // Tareas atrasadas
    const overdueTasks = await this.taskRepository.count({
      where: { 
        ...baseWhere, 
        isOverdue: true,
        status: TaskStatus.PENDING 
      },
    });

    // Días con tareas completadas en el período
    const completionDays = await this.taskRepository
      .createQueryBuilder('task')
      .select('DATE(task.completedAt)', 'completionDate')
      .addSelect('COUNT(*)', 'count')
      .where('task.assignedToUserId = :userId', { userId: user.id })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.completedAt >= :startDate', { startDate })
      .andWhere('task.completedAt IS NOT NULL')
      .groupBy('DATE(task.completedAt)')
      .orderBy('DATE(task.completedAt)', 'ASC')
      .getRawMany();

    return {
      period,
      userTasks: period === 'all' ? userTasks : userTasksPeriod,
      completedTasks: period === 'all' ? completedTasks : completedTasksPeriod,
      overdueTasks,
      completionDays: completionDays.map(day => ({
        date: day.completionDate,
        count: parseInt(day.count),
      })),
      completionRate: userTasks > 0 ? Math.round((completedTasks / userTasks) * 100) : 0,
    };
  }

  // Limpiar tareas completadas que ya no necesitan ser visibles
  async cleanupCompletedTasks(): Promise<void> {
    const now = new Date();
    
    // No eliminar, solo marcar como no visibles o mover a historial
    // En este caso, solo actualizamos para que no aparezcan en las consultas principales
    await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ visibleUntil: null })
      .where('visibleUntil < :now', { now })
      .execute();
  }
}
