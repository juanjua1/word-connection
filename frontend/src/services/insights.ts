// Servicio para generar insights inteligentes basados en datos del usuario
import { Task, TaskStats, User } from '../types';

export interface ProductivityInsight {
  type: 'success' | 'warning' | 'info' | 'suggestion';
  title: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export interface ProductivityAnalysis {
  score: number;
  level: string;
  insights: ProductivityInsight[];
  trends: {
    weekly: number;
    monthly: number;
    completion: number;
  };
  recommendations: string[];
}

export class InsightEngine {
  static generateProductivityAnalysis(
    stats: TaskStats,
    recentTasks: Task[],
    user: User
  ): ProductivityAnalysis {
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    const insights: ProductivityInsight[] = [];
    const recommendations: string[] = [];

    // Calcular score de productividad
    const score = this.calculateProductivityScore(stats, recentTasks);
    const level = this.getProductivityLevel(score);

    // Generar insights basados en completion rate
    if (completionRate >= 80) {
      insights.push({
        type: 'success',
        title: '¡Excelente rendimiento!',
        message: `Tienes una tasa de completado del ${Math.round(completionRate)}%. ¡Sigue así!`,
        action: {
          label: 'Ver logros',
          href: '/tasks?filter=completed'
        }
      });
    } else if (completionRate >= 60) {
      insights.push({
        type: 'info',
        title: 'Buen progreso',
        message: `Completaste ${Math.round(completionRate)}% de tus tareas. Hay margen de mejora.`,
        action: {
          label: 'Analizar pendientes',
          href: '/tasks?filter=pending'
        }
      });
      recommendations.push('Considera priorizar las tareas más importantes primero');
    } else {
      insights.push({
        type: 'warning',
        title: 'Oportunidad de mejora',
        message: `Solo ${Math.round(completionRate)}% de tareas completadas. ¿Necesitas ayuda organizándote?`,
        action: {
          label: 'Ver guía de productividad',
          href: '/help/productivity'
        }
      });
      recommendations.push('Divide las tareas grandes en subtareas más pequeñas');
      recommendations.push('Establece metas diarias más realistas');
    }

    // Analizar tareas urgentes
    const urgentTasks = recentTasks.filter(task => task.priority === 'urgent' && task.status !== 'completed');
    if (urgentTasks.length > 0) {
      insights.push({
        type: 'warning',
        title: `${urgentTasks.length} tarea${urgentTasks.length > 1 ? 's' : ''} urgente${urgentTasks.length > 1 ? 's' : ''}`,
        message: `Tienes tareas urgentes que requieren atención inmediata.`,
        action: {
          label: 'Ver urgentes',
          href: '/tasks?filter=urgent'
        }
      });
      recommendations.push('Dedica tiempo específico cada día para tareas urgentes');
    }

    // Analizar tareas vencidas
    const overdueTasks = recentTasks.filter(task => task.isOverdue);
    if (overdueTasks.length > 0) {
      insights.push({
        type: 'warning',
        title: `${overdueTasks.length} tarea${overdueTasks.length > 1 ? 's' : ''} vencida${overdueTasks.length > 1 ? 's' : ''}`,
        message: 'Tienes tareas que han pasado su fecha límite.',
        action: {
          label: 'Revisar vencidas',
          href: '/tasks?filter=overdue'
        }
      });
      recommendations.push('Revisa y actualiza las fechas límite de las tareas vencidas');
    }

    // Analizar distribución de prioridades
    const highPriorityTasks = recentTasks.filter(task => 
      (task.priority === 'high' || task.priority === 'urgent') && 
      task.status !== 'completed'
    );
    
    if (highPriorityTasks.length > stats.total * 0.6) {
      insights.push({
        type: 'suggestion',
        title: 'Demasiadas tareas de alta prioridad',
        message: 'Considera reevaluar las prioridades para enfocarte mejor.',
        action: {
          label: 'Organizar prioridades',
          href: '/tasks'
        }
      });
      recommendations.push('No todas las tareas pueden ser urgentes. Reevalúa las prioridades');
    }

    // Insight sobre progreso reciente
    const tasksInProgress = stats.inProgress;
    if (tasksInProgress > 5) {
      insights.push({
        type: 'info',
        title: 'Muchas tareas en progreso',
        message: `Tienes ${tasksInProgress} tareas iniciadas. Considera completar algunas antes de empezar nuevas.`,
        action: {
          label: 'Ver en progreso',
          href: '/tasks?filter=in_progress'
        }
      });
      recommendations.push('Enfócate en completar tareas en lugar de empezar nuevas');
    }

    // Insight sobre consistencia
    if (stats.completed > 0 && stats.pending === 0) {
      insights.push({
        type: 'success',
        title: '¡Todo al día!',
        message: 'No tienes tareas pendientes. ¡Perfecto momento para planificar nuevos objetivos!',
        action: {
          label: 'Crear nueva tarea',
          href: '/tasks?action=create'
        }
      });
    }

    return {
      score,
      level,
      insights: insights.slice(0, 4), // Máximo 4 insights
      trends: {
        weekly: this.calculateWeeklyTrend(recentTasks),
        monthly: this.calculateMonthlyTrend(recentTasks),
        completion: completionRate
      },
      recommendations: recommendations.slice(0, 3) // Máximo 3 recomendaciones
    };
  }

  private static calculateProductivityScore(stats: TaskStats, tasks: Task[]): number {
    let score = 0;

    // Factor de completado (40% del score)
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) : 0;
    score += completionRate * 40;

    // Factor de balance (20% del score) - penaliza muchas tareas urgentes
    const urgentCount = tasks.filter(t => t.priority === 'urgent').length;
    const balanceScore = Math.max(0, 20 - (urgentCount * 2));
    score += balanceScore;

    // Factor de consistencia (20% del score) - premia tener pocas tareas vencidas
    const overdueCount = tasks.filter(t => t.isOverdue).length;
    const consistencyScore = Math.max(0, 20 - (overdueCount * 5));
    score += consistencyScore;

    // Factor de actividad (20% del score) - premia tener tareas en progreso pero no demasiadas
    const inProgressOptimal = Math.min(stats.inProgress / 3, 1); // Óptimo: 3 tareas en progreso
    score += inProgressOptimal * 20;

    return Math.min(Math.round(score), 100);
  }

  private static getProductivityLevel(score: number): string {
    if (score >= 90) return 'Maestro de la Productividad';
    if (score >= 80) return 'Muy Productivo';
    if (score >= 70) return 'Productivo';
    if (score >= 60) return 'En Desarrollo';
    if (score >= 40) return 'Necesita Enfoque';
    return 'Requiere Atención';
  }

  private static calculateWeeklyTrend(tasks: Task[]): number {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekCompleted = tasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt &&
      new Date(task.completedAt) >= weekAgo
    ).length;

    const lastWeekCompleted = tasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt &&
      new Date(task.completedAt) >= twoWeeksAgo &&
      new Date(task.completedAt) < weekAgo
    ).length;

    if (lastWeekCompleted === 0) return thisWeekCompleted > 0 ? 100 : 0;
    return Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100);
  }

  private static calculateMonthlyTrend(tasks: Task[]): number {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const thisMonthCompleted = tasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt &&
      new Date(task.completedAt) >= monthAgo
    ).length;

    const lastMonthCompleted = tasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt &&
      new Date(task.completedAt) >= twoMonthsAgo &&
      new Date(task.completedAt) < monthAgo
    ).length;

    if (lastMonthCompleted === 0) return thisMonthCompleted > 0 ? 100 : 0;
    return Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100);
  }

  // Generar recomendaciones personalizadas basadas en el rol del usuario
  static generatePersonalizedRecommendations(user: User, analysis: ProductivityAnalysis): string[] {
    const recommendations = [...analysis.recommendations];

    // Recomendaciones basadas en el rol
    if (user.role === 'admin') {
      recommendations.push('Como admin, considera delegar algunas tareas a otros miembros del equipo');
      recommendations.push('Utiliza las analíticas del equipo para identificar cuellos de botella');
    } else if (user.role === 'premium') {
      recommendations.push('Aprovecha las funciones premium como grupos de tareas y listas de seguimiento');
    }

    // Recomendaciones basadas en el score
    if (analysis.score < 50) {
      recommendations.push('Considera usar técnicas como Pomodoro para mejorar el enfoque');
      recommendations.push('Establece bloques de tiempo específicos para diferentes tipos de tareas');
    } else if (analysis.score > 80) {
      recommendations.push('¡Excelente trabajo! Considera compartir tus técnicas con otros');
      recommendations.push('Podrías ser mentor de otros usuarios con menor productividad');
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendaciones
  }
}

export default InsightEngine;
