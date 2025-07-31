import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, Between } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { User, UserRole } from '../entities/user.entity';
import { Category } from '../entities/category.entity';

export interface EnhancedUserStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  weeklyTrend: number;
  velocityTrend: number;
  consistencyScore: number;
  focusScore: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  completed: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityIndex: number;
  trend: number;
}

export interface ProductivityInsight {
  type: 'success' | 'warning' | 'info' | 'recommendation';
  title: string;
  description: string;
  actionable?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface WeeklyPattern {
  dayOfWeek: number;
  dayName: string;
  totalTasks: number;
  completedTasks: number;
  averageProductivity: number;
}

export interface TimeDistribution {
  hour: number;
  tasksCreated: number;
  tasksCompleted: number;
  productivityRatio: number;
}

export interface EnhancedAnalyticsData {
  userStats: EnhancedUserStats;
  categoryPerformance: CategoryPerformance[];
  productivityInsights: ProductivityInsight[];
  weeklyPatterns: WeeklyPattern[];
  timeDistribution: TimeDistribution[];
  heatmapData: Array<{ date: string; value: number; intensity: number }>;
  goalProgress: {
    weeklyGoal: number;
    weeklyProgress: number;
    monthlyGoal: number;
    monthlyProgress: number;
    streakDays: number;
  };
}

@Injectable()
export class EnhancedAnalyticsService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getEnhancedAnalytics(
    user: User,
    timeframe: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<EnhancedAnalyticsData> {
    const dateRange = this.getDateRange(timeframe);
    
    const [
      userStats,
      categoryPerformance,
      weeklyPatterns,
      timeDistribution,
      heatmapData,
      goalProgress
    ] = await Promise.all([
      this.getEnhancedUserStats(user.id, dateRange),
      this.getCategoryPerformance(user.id, dateRange),
      this.getWeeklyPatterns(user.id, dateRange),
      this.getTimeDistribution(user.id, dateRange),
      this.getHeatmapData(user.id, dateRange),
      this.getGoalProgress(user.id)
    ]);

    const productivityInsights = this.generateProductivityInsights(
      userStats,
      categoryPerformance,
      weeklyPatterns,
      timeDistribution
    );

    return {
      userStats,
      categoryPerformance,
      productivityInsights,
      weeklyPatterns,
      timeDistribution,
      heatmapData,
      goalProgress
    };
  }

  private async getEnhancedUserStats(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<EnhancedUserStats> {
    // Obtener todas las tareas del período
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .getMany();

    const total = tasks.length;
    const completed = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const pending = tasks.filter(task => task.status === TaskStatus.PENDING).length;
    const inProgress = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    
    // Calcular tareas vencidas
    const now = new Date();
    const overdue = tasks.filter(task => 
      task.status !== TaskStatus.COMPLETED && 
      task.dueDate && 
      new Date(task.dueDate) < now
    ).length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    // Tiempo promedio de completado
    const completedTasks = tasks.filter(task => 
      task.status === TaskStatus.COMPLETED && task.updatedAt
    );
    const averageCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((acc, task) => {
          const timeDiff = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
          return acc + (timeDiff / (1000 * 60 * 60 * 24));
        }, 0) / completedTasks.length
      : 0;

    // Score de productividad mejorado
    const productivityScore = this.calculateEnhancedProductivityScore({
      completionRate,
      averageCompletionTime,
      total,
      completed,
      overdue,
      consistency: await this.calculateConsistencyScore(userId, dateRange),
      focus: await this.calculateFocusScore(userId, dateRange)
    });

    // Tendencias
    const weeklyTrend = await this.calculateWeeklyTrend(userId);
    const velocityTrend = await this.calculateVelocityTrend(userId, dateRange);
    const consistencyScore = await this.calculateConsistencyScore(userId, dateRange);
    const focusScore = await this.calculateFocusScore(userId, dateRange);

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate: Math.round(completionRate),
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      productivityScore: Math.round(productivityScore),
      weeklyTrend: Math.round(weeklyTrend),
      velocityTrend: Math.round(velocityTrend),
      consistencyScore: Math.round(consistencyScore),
      focusScore: Math.round(focusScore)
    };
  }

  private async getCategoryPerformance(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<CategoryPerformance[]> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .getMany();

    const categoryMap = new Map<string, CategoryPerformance>();

    tasks.forEach(task => {
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
          averageCompletionTime: 0,
          productivityIndex: 0,
          trend: 0
        });
      }

      const categoryStat = categoryMap.get(categoryId)!;
      categoryStat.total++;
      if (task.status === TaskStatus.COMPLETED) {
        categoryStat.completed++;
      }
    });

    // Calcular métricas adicionales para cada categoría
    for (const [categoryId, stats] of categoryMap) {
      stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      
      // Calcular tiempo promedio para esta categoría
      const categoryCompletedTasks = tasks.filter(task => 
        task.category?.id === categoryId && 
        task.status === TaskStatus.COMPLETED && 
        task.updatedAt
      );
      
      stats.averageCompletionTime = categoryCompletedTasks.length > 0
        ? categoryCompletedTasks.reduce((acc, task) => {
            const timeDiff = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
            return acc + (timeDiff / (1000 * 60 * 60 * 24));
          }, 0) / categoryCompletedTasks.length
        : 0;

      // Índice de productividad = (completionRate * volume weight) / time weight
      stats.productivityIndex = this.calculateProductivityIndex(
        stats.completionRate,
        stats.total,
        stats.averageCompletionTime
      );

      // Tendencia (simulada por ahora)
      stats.trend = Math.floor(Math.random() * 40) - 20; // -20 a +20
    }

    return Array.from(categoryMap.values())
      .sort((a, b) => b.productivityIndex - a.productivityIndex);
  }

  private async getWeeklyPatterns(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<WeeklyPattern[]> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .getMany();

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const weeklyData = Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index,
      dayName: dayNames[index],
      totalTasks: 0,
      completedTasks: 0,
      averageProductivity: 0
    }));

    tasks.forEach(task => {
      const dayOfWeek = new Date(task.createdAt).getDay();
      weeklyData[dayOfWeek].totalTasks++;
      if (task.status === TaskStatus.COMPLETED) {
        weeklyData[dayOfWeek].completedTasks++;
      }
    });

    weeklyData.forEach(day => {
      day.averageProductivity = day.totalTasks > 0 
        ? (day.completedTasks / day.totalTasks) * 100 
        : 0;
    });

    return weeklyData;
  }

  private async getTimeDistribution(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<TimeDistribution[]> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .getMany();

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      tasksCreated: 0,
      tasksCompleted: 0,
      productivityRatio: 0
    }));

    tasks.forEach(task => {
      const createdHour = new Date(task.createdAt).getHours();
      hourlyData[createdHour].tasksCreated++;
      
      if (task.status === TaskStatus.COMPLETED && task.updatedAt) {
        const completedHour = new Date(task.updatedAt).getHours();
        hourlyData[completedHour].tasksCompleted++;
      }
    });

    hourlyData.forEach(hour => {
      hour.productivityRatio = hour.tasksCreated > 0 
        ? (hour.tasksCompleted / hour.tasksCreated) * 100 
        : 0;
    });

    return hourlyData;
  }

  private async getHeatmapData(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{ date: string; value: number; intensity: number }>> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt BETWEEN :start AND :end', dateRange)
      .getMany();

    const dailyCompletion = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.updatedAt) {
        const date = new Date(task.updatedAt).toISOString().split('T')[0];
        dailyCompletion.set(date, (dailyCompletion.get(date) || 0) + 1);
      }
    });

    const maxValue = Math.max(...Array.from(dailyCompletion.values()), 1);
    
    return Array.from(dailyCompletion.entries()).map(([date, value]) => ({
      date,
      value,
      intensity: (value / maxValue) * 100
    }));
  }

  private async getGoalProgress(userId: string) {
    const now = new Date();
    const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [weeklyCompleted, monthlyCompleted] = await Promise.all([
      this.taskRepository.count({
        where: {
          userId,
          status: TaskStatus.COMPLETED,
          updatedAt: MoreThanOrEqual(weekStart)
        }
      }),
      this.taskRepository.count({
        where: {
          userId,
          status: TaskStatus.COMPLETED,
          updatedAt: MoreThanOrEqual(monthStart)
        }
      })
    ]);

    // Calcular racha de días consecutivos
    const streakDays = await this.calculateStreakDays(userId);

    return {
      weeklyGoal: 10, // Configurable
      weeklyProgress: weeklyCompleted,
      monthlyGoal: 30, // Configurable
      monthlyProgress: monthlyCompleted,
      streakDays
    };
  }

  private generateProductivityInsights(
    userStats: EnhancedUserStats,
    categoryPerformance: CategoryPerformance[],
    weeklyPatterns: WeeklyPattern[],
    timeDistribution: TimeDistribution[]
  ): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    // Insight sobre tasa de completación
    if (userStats.completionRate >= 90) {
      insights.push({
        type: 'success',
        title: '🎯 ¡Excelente eficiencia!',
        description: `Tienes una tasa de completación del ${userStats.completionRate}%, lo que indica una gestión excepcional de tareas.`,
        impact: 'high'
      });
    } else if (userStats.completionRate < 60) {
      insights.push({
        type: 'recommendation',
        title: '⚡ Oportunidad de mejora',
        description: `Tu tasa de completación es del ${userStats.completionRate}%. Considera dividir las tareas grandes en subtareas más manejables.`,
        actionable: 'Prueba la técnica Pomodoro o establece metas diarias más pequeñas.',
        impact: 'high'
      });
    }

    // Insight sobre consistencia
    if (userStats.consistencyScore >= 80) {
      insights.push({
        type: 'success',
        title: '📅 Excelente consistencia',
        description: `Mantienes un ritmo de trabajo muy consistente con un score de ${userStats.consistencyScore}%.`,
        impact: 'medium'
      });
    } else if (userStats.consistencyScore < 50) {
      insights.push({
        type: 'warning',
        title: '📊 Mejora tu consistencia',
        description: `Tu consistencia podría mejorar (${userStats.consistencyScore}%). Establecer rutinas diarias puede ayudar.`,
        actionable: 'Intenta trabajar en tareas a la misma hora cada día.',
        impact: 'medium'
      });
    }

    // Insight sobre categorías más productivas
    const topCategory = categoryPerformance[0];
    if (topCategory && topCategory.completionRate > 80) {
      insights.push({
        type: 'info',
        title: '🏆 Categoría estrella',
        description: `Tu categoría más productiva es "${topCategory.categoryName}" con ${topCategory.completionRate}% de completación.`,
        actionable: 'Considera aplicar las mismas estrategias a otras categorías.',
        impact: 'medium'
      });
    }

    // Insight sobre patrones semanales
    const mostProductiveDay = weeklyPatterns.reduce((prev, current) => 
      prev.averageProductivity > current.averageProductivity ? prev : current
    );
    
    if (mostProductiveDay.averageProductivity > 70) {
      insights.push({
        type: 'info',
        title: '📅 Día más productivo',
        description: `Los ${mostProductiveDay.dayName}s son tu día más productivo con ${Math.round(mostProductiveDay.averageProductivity)}% de eficiencia.`,
        actionable: 'Programa tus tareas más importantes para este día.',
        impact: 'medium'
      });
    }

    // Insight sobre tareas vencidas
    if (userStats.overdue > 0) {
      insights.push({
        type: 'warning',
        title: '⏰ Atención a tareas vencidas',
        description: `Tienes ${userStats.overdue} tarea${userStats.overdue > 1 ? 's' : ''} vencida${userStats.overdue > 1 ? 's' : ''}.`,
        actionable: 'Revisa tus fechas límite y prioriza estas tareas.',
        impact: 'high'
      });
    }

    // Insight sobre tiempo de completación
    if (userStats.averageCompletionTime < 2) {
      insights.push({
        type: 'success',
        title: '⚡ Velocidad impresionante',
        description: `Completas tareas en promedio en ${userStats.averageCompletionTime} días. ¡Excelente velocidad!`,
        impact: 'medium'
      });
    } else if (userStats.averageCompletionTime > 7) {
      insights.push({
        type: 'recommendation',
        title: '🎯 Optimiza tu tiempo',
        description: `Las tareas toman en promedio ${userStats.averageCompletionTime} días para completarse.`,
        actionable: 'Considera establecer fechas límite más cercanas o dividir tareas complejas.',
        impact: 'medium'
      });
    }

    return insights;
  }

  // Métodos auxiliares mejorados
  private calculateEnhancedProductivityScore(params: {
    completionRate: number;
    averageCompletionTime: number;
    total: number;
    completed: number;
    overdue: number;
    consistency: number;
    focus: number;
  }): number {
    const {
      completionRate,
      averageCompletionTime,
      total,
      completed,
      overdue,
      consistency,
      focus
    } = params;

    // Pesos para diferentes factores
    const completionWeight = 0.4;
    const speedWeight = 0.2;
    const volumeWeight = 0.15;
    const overdueWeight = 0.1;
    const consistencyWeight = 0.1;
    const focusWeight = 0.05;

    // Normalizar métricas
    const completionScore = Math.min(completionRate, 100);
    const speedScore = Math.max(0, 100 - (averageCompletionTime * 10));
    const volumeScore = Math.min(total * 2, 100);
    const overdueScore = Math.max(0, 100 - (overdue * 10));

    const score = (
      completionScore * completionWeight +
      speedScore * speedWeight +
      volumeScore * volumeWeight +
      overdueScore * overdueWeight +
      consistency * consistencyWeight +
      focus * focusWeight
    );

    return Math.min(Math.max(score, 0), 100);
  }

  private async calculateConsistencyScore(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<number> {
    // Obtener actividad diaria
    const dailyActivity = await this.taskRepository
      .createQueryBuilder('task')
      .select([
        'DATE(task.createdAt) as date',
        'COUNT(*) as count'
      ])
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .groupBy('DATE(task.createdAt)')
      .getRawMany();

    if (dailyActivity.length === 0) return 0;

    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const activeDays = dailyActivity.length;
    
    return (activeDays / totalDays) * 100;
  }

  private async calculateFocusScore(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<number> {
    // Medir cuántas categorías diferentes se trabajan
    const categoryDistribution = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('task.userId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', dateRange)
      .groupBy('task.categoryId')
      .getRawMany();

    if (categoryDistribution.length === 0) return 100;

    // Menos categorías = más foco
    const focusScore = Math.max(0, 100 - (categoryDistribution.length * 10));
    return Math.min(focusScore, 100);
  }

  private calculateProductivityIndex(
    completionRate: number,
    volume: number,
    avgTime: number
  ): number {
    const volumeNormalized = Math.min(volume / 10, 1) * 100;
    const timeScore = avgTime > 0 ? Math.max(0, 100 - (avgTime * 10)) : 100;
    
    return (completionRate * 0.5) + (volumeNormalized * 0.3) + (timeScore * 0.2);
  }

  private async calculateWeeklyTrend(userId: string): Promise<number> {
    const now = new Date();
    const currentWeekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const previousWeekStart = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

    const [currentWeekCompleted, previousWeekCompleted] = await Promise.all([
      this.taskRepository.count({
        where: {
          userId,
          status: TaskStatus.COMPLETED,
          updatedAt: MoreThanOrEqual(currentWeekStart),
        }
      }),
      this.taskRepository.count({
        where: {
          userId,
          status: TaskStatus.COMPLETED,
          updatedAt: Between(previousWeekStart, currentWeekStart),
        }
      })
    ]);

    if (previousWeekCompleted === 0) {
      return currentWeekCompleted > 0 ? 100 : 0;
    }

    return ((currentWeekCompleted - previousWeekCompleted) / previousWeekCompleted) * 100;
  }

  private async calculateVelocityTrend(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<number> {
    const midPoint = new Date((dateRange.start.getTime() + dateRange.end.getTime()) / 2);
    
    const [firstHalf, secondHalf] = await Promise.all([
      this.taskRepository.count({
        where: {
          userId,
          status: TaskStatus.COMPLETED,
          updatedAt: Between(dateRange.start, midPoint)
        }
      }),
      this.taskRepository.count({
        where: {
          userId,
          status: TaskStatus.COMPLETED,
          updatedAt: Between(midPoint, dateRange.end)
        }
      })
    ]);

    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return ((secondHalf - firstHalf) / firstHalf) * 100;
  }

  private async calculateStreakDays(userId: string): Promise<number> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .orderBy('task.updatedAt', 'DESC')
      .getMany();

    if (tasks.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const completionDates = new Set(
      tasks
        .filter(task => task.updatedAt)
        .map(task => {
          const date = new Date(task.updatedAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
    );

    while (completionDates.has(currentDate.getTime())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  private getDateRange(timeframe: 'week' | 'month' | 'quarter'): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    let start: Date;

    switch (timeframe) {
      case 'week':
        start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      default:
        start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    }

    return { start, end };
  }
}
