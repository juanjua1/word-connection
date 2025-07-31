import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { User, UserRole } from '../entities/user.entity';
import { Category } from '../entities/category.entity';

export interface UserStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  weeklyTrend: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface DailyActivity {
  date: string;
  created: number;
  completed: number;
  productivity: number;
}

export interface AnalyticsData {
  personalStats: UserStats;
  categoryStats: CategoryStats[];
  dailyActivity: DailyActivity[];
  selectedUserStats?: UserStats; // Solo para admin
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getPersonalAnalytics(
    user: User,
    timeframe: 'week' | 'month' | 'quarter' = 'week',
  ): Promise<AnalyticsData> {
    const dateRange = this.getDateRange(timeframe);
    
    const personalStats = await this.getUserStats(user.id, dateRange);
    const categoryStats = await this.getCategoryStats(user.id, dateRange);
    const dailyActivity = await this.getDailyActivity(user.id, dateRange);

    return {
      personalStats,
      categoryStats,
      dailyActivity,
    };
  }

  async getAdminAnalytics(
    user: User,
    targetUserId?: string,
    teamUserIds?: string[],
    timeframe: 'week' | 'month' | 'quarter' = 'week',
  ): Promise<AnalyticsData> {
    if (user.role !== UserRole.ADMIN) {
      throw new Error('Only admin users can access admin analytics');
    }

    const dateRange = this.getDateRange(timeframe);
    
    // Estadísticas personales del admin
    const personalStats = await this.getUserStats(user.id, dateRange);
    const categoryStats = await this.getCategoryStats(user.id, dateRange);
    const dailyActivity = await this.getDailyActivity(user.id, dateRange);

    const result: AnalyticsData = {
      personalStats,
      categoryStats,
      dailyActivity,
    };

    // Si se especifica un usuario específico
    if (targetUserId && targetUserId.trim().length > 0) {
      // Verificar que el usuario existe
      const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
      if (targetUser) {
        result.selectedUserStats = await this.getUserStats(targetUserId, dateRange);
      }
    }

    // Si se especifica un equipo
    if (teamUserIds && teamUserIds.length > 0) {
      // Filtrar IDs válidos y verificar que los usuarios existen
      const validUserIds = teamUserIds.filter(id => id && id.trim().length > 0);
      if (validUserIds.length > 0) {
        const existingUsers = await this.userRepository
          .createQueryBuilder('user')
          .where('user.id IN (:...userIds)', { userIds: validUserIds })
          .getMany();
        
        // Note: Team analytics have been simplified in this version
      }
    }

    return result;
  }

  private async getUserStats(userId: string, dateRange: { start: Date; end: Date }): Promise<UserStats> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .getMany();

    const total = tasks.length;
    const completed = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const pending = tasks.filter(task => task.status === TaskStatus.PENDING).length;
    const inProgress = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    // Calcular tiempo promedio de completado (días)
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED && task.updatedAt);
    const averageCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((acc, task) => {
          const timeDiff = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
          return acc + (timeDiff / (1000 * 60 * 60 * 24)); // Convertir a días
        }, 0) / completedTasks.length
      : 0;

    // Calcular score de productividad basado en varios factores
    const productivityScore = this.calculateProductivityScore(
      completionRate,
      averageCompletionTime,
      total,
      completed
    );

    // Calcular tendencia semanal
    const weeklyTrend = await this.calculateWeeklyTrend(userId);

    return {
      total,
      completed,
      pending,
      inProgress,
      completionRate: Math.round(completionRate),
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      productivityScore: Math.round(productivityScore),
      weeklyTrend: Math.round(weeklyTrend),
    };
  }

  private async getCategoryStats(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<CategoryStats[]> {
    const stats = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .getMany();

    const categoryMap = new Map<string, CategoryStats>();

    stats.forEach(task => {
      if (!task.category) return;

      const categoryId = task.category.id;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: task.category.name,
          color: task.category.color,
          total: 0,
          completed: 0,
          completionRate: 0,
        });
      }

      const categoryStat = categoryMap.get(categoryId)!;
      categoryStat.total++;
      if (task.status === TaskStatus.COMPLETED) {
        categoryStat.completed++;
      }
    });

    // Calcular tasas de completado
    const result = Array.from(categoryMap.values()).map(stat => ({
      ...stat,
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    }));

    return result.sort((a, b) => b.total - a.total);
  }

  private async getDailyActivity(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<DailyActivity[]> {
    const dailyData = await this.taskRepository
      .createQueryBuilder('task')
      .select([
        'DATE(task.createdAt) as date',
        'COUNT(*) as created',
        'COUNT(CASE WHEN task.status = \'completed\' AND DATE(task.updatedAt) = DATE(task.createdAt) THEN 1 END) as completed'
      ])
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .groupBy('DATE(task.createdAt)')
      .orderBy('DATE(task.createdAt)', 'ASC')
      .getRawMany();

    return dailyData.map(day => ({
      date: day.date,
      created: parseInt(day.created) || 0,
      completed: parseInt(day.completed) || 0,
      productivity: day.created > 0 ? Math.round((day.completed / day.created) * 100) : 0,
    }));
  }

  private calculateProductivityScore(
    completionRate: number,
    averageCompletionTime: number,
    totalTasks: number,
    completedTasks: number
  ): number {
    let score = 0;

    // Factor de tasa de completado (40% del score)
    score += (completionRate / 100) * 40;

    // Factor de velocidad (30% del score) - mejor score para menor tiempo
    const timeScore = averageCompletionTime > 0 ? Math.max(0, 30 - (averageCompletionTime * 3)) : 30;
    score += Math.min(timeScore, 30);

    // Factor de volumen (20% del score)
    const volumeScore = Math.min((totalTasks / 10) * 20, 20);
    score += volumeScore;

    // Factor de consistencia (10% del score)
    const consistencyScore = completedTasks > 0 ? 10 : 0;
    score += consistencyScore;

    return Math.min(score, 100);
  }

  private async calculateWeeklyTrend(userId: string): Promise<number> {
    const now = new Date();
    const currentWeekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const previousWeekStart = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

    const currentWeekCompleted = await this.taskRepository.count({
      where: {
        userId,
        status: TaskStatus.COMPLETED,
        updatedAt: MoreThanOrEqual(currentWeekStart),
      },
    });

    const previousWeekCompleted = await this.taskRepository.count({
      where: {
        userId,
        status: TaskStatus.COMPLETED,
        updatedAt: MoreThanOrEqual(previousWeekStart),
        createdAt: LessThan(currentWeekStart),
      },
    });

    if (previousWeekCompleted === 0) {
      return currentWeekCompleted > 0 ? 100 : 0;
    }

    return ((currentWeekCompleted - previousWeekCompleted) / previousWeekCompleted) * 100;
  }

  private getDateRange(timeframe: 'week' | 'month' | 'quarter'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
    }

    return { start, end };
  }
}
