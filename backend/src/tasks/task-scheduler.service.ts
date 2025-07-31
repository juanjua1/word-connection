import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  // Ejecuta cada hora para marcar tareas como atrasadas
  @Cron(CronExpression.EVERY_HOUR)
  async markOverdueTasks() {
    this.logger.log('Iniciando proceso de marcado de tareas atrasadas...');
    
    try {
      const now = new Date();
      
      // Marcar tareas como atrasadas si la fecha límite ya pasó
      const result = await this.taskRepository.update(
        {
          dueDate: LessThan(now),
          status: TaskStatus.PENDING,
          isOverdue: false,
        },
        {
          isOverdue: true,
        }
      );

      this.logger.log(`Marcadas ${result.affected} tareas como atrasadas`);
    } catch (error) {
      this.logger.error('Error al marcar tareas atrasadas:', error);
    }
  }

  // Ejecuta cada hora para ocultar tareas completadas después de 10 horas
  @Cron(CronExpression.EVERY_HOUR)
  async hideCompletedTasks() {
    this.logger.log('Iniciando proceso de ocultación de tareas completadas...');
    
    try {
      const now = new Date();
      
      // Encontrar tareas completadas que deben ser ocultadas
      const tasksToHide = await this.taskRepository.find({
        where: {
          status: TaskStatus.COMPLETED,
          visibleUntil: LessThan(now),
        },
      });

      if (tasksToHide.length > 0) {
        // En lugar de eliminar, marcamos como ocultas o las movemos a un estado especial
        await this.taskRepository.update(
          {
            id: In(tasksToHide.map(task => task.id)),
          },
          {
            visibleUntil: null, // Resetear para futuras consultas
            // Podríamos agregar un campo 'isHidden' si fuera necesario
          }
        );

        this.logger.log(`Ocultadas ${tasksToHide.length} tareas completadas`);
      }
    } catch (error) {
      this.logger.error('Error al ocultar tareas completadas:', error);
    }
  }

  // Ejecuta cada día a medianoche para limpiar notificaciones antiguas
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    this.logger.log('Iniciando limpieza de notificaciones antiguas...');
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Aquí podríamos limpiar notificaciones si tuviéramos el repositorio inyectado
      // Por ahora solo logeamos que el proceso se ejecutó
      this.logger.log('Proceso de limpieza de notificaciones completado');
    } catch (error) {
      this.logger.error('Error en limpieza de notificaciones:', error);
    }
  }

  // Método manual para forzar la actualización de tareas atrasadas
  async forceUpdateOverdueTasks() {
    this.logger.log('Forzando actualización de tareas atrasadas...');
    await this.markOverdueTasks();
    await this.hideCompletedTasks();
  }

  // Método para obtener estadísticas del scheduler
  async getSchedulerStats() {
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);

    const [overdueTasks, recentlyCompletedTasks, totalTasks] = await Promise.all([
      this.taskRepository.count({
        where: {
          isOverdue: true,
          status: TaskStatus.PENDING,
        },
      }),
      this.taskRepository.count({
        where: {
          status: TaskStatus.COMPLETED,
          completedAt: LessThan(tenHoursAgo),
        },
      }),
      this.taskRepository.count(),
    ]);

    return {
      overdueTasks,
      recentlyCompletedTasks,
      totalTasks,
      lastCheck: now,
    };
  }
}
