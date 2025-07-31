import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { TaskSchedulerService } from './task-scheduler.service';
import { Task, TaskStatus } from '../entities/task.entity';

describe('TaskSchedulerService', () => {
  let service: TaskSchedulerService;
  let taskRepository: jest.Mocked<Repository<Task>>;

  // Mock Logger
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskSchedulerService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            update: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskSchedulerService>(TaskSchedulerService);
    taskRepository = module.get(getRepositoryToken(Task));

    // Replace the logger instance
    (service as any).logger = mockLogger;

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('markOverdueTasks', () => {
    it('should mark overdue tasks successfully', async () => {
      const updateResult = { affected: 3 };
      taskRepository.update.mockResolvedValue(updateResult as any);

      await service.markOverdueTasks();

      expect(taskRepository.update).toHaveBeenCalledWith(
        {
          dueDate: expect.any(Object), // LessThan operator
          status: TaskStatus.PENDING,
          isOverdue: false,
        },
        { isOverdue: true }
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Iniciando proceso de marcado de tareas atrasadas...');
      expect(mockLogger.log).toHaveBeenCalledWith('Marcadas 3 tareas como atrasadas');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      taskRepository.update.mockRejectedValue(error);

      await expect(service.markOverdueTasks()).resolves.not.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Error al marcar tareas atrasadas:', error);
    });
  });

  describe('hideCompletedTasks', () => {
    it('should hide completed tasks successfully', async () => {
      const mockTasks = [
        { id: 'task-1' },
        { id: 'task-2' },
      ];
      const updateResult = { affected: 2 };

      taskRepository.find.mockResolvedValue(mockTasks as Task[]);
      taskRepository.update.mockResolvedValue(updateResult as any);

      await service.hideCompletedTasks();

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: {
          status: TaskStatus.COMPLETED,
          visibleUntil: expect.any(Object), // LessThan operator
        },
      });
      expect(taskRepository.update).toHaveBeenCalledWith(
        {
          id: expect.any(Object), // In operator
        },
        { visibleUntil: null }
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Ocultadas 2 tareas completadas');
    });

    it('should handle no tasks to hide', async () => {
      taskRepository.find.mockResolvedValue([]);

      await service.hideCompletedTasks();

      expect(taskRepository.find).toHaveBeenCalled();
      expect(taskRepository.update).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      taskRepository.find.mockRejectedValue(error);

      await expect(service.hideCompletedTasks()).resolves.not.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Error al ocultar tareas completadas:', error);
    });
  });

  describe('getSchedulerStats', () => {
    it('should return correct scheduler statistics', async () => {
      const mockOverdueTasks = 10;
      const mockRecentlyCompletedTasks = 25;
      const mockTotalTasks = 150;

      taskRepository.count
        .mockResolvedValueOnce(mockOverdueTasks)
        .mockResolvedValueOnce(mockRecentlyCompletedTasks)
        .mockResolvedValueOnce(mockTotalTasks);

      const stats = await service.getSchedulerStats();

      expect(stats).toEqual({
        overdueTasks: mockOverdueTasks,
        recentlyCompletedTasks: mockRecentlyCompletedTasks,
        totalTasks: mockTotalTasks,
        lastCheck: expect.any(Date),
      });

      expect(taskRepository.count).toHaveBeenCalledTimes(3);
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should log cleanup process', async () => {
      await service.cleanupOldNotifications();

      expect(mockLogger.log).toHaveBeenCalledWith('Iniciando limpieza de notificaciones antiguas...');
      expect(mockLogger.log).toHaveBeenCalledWith('Proceso de limpieza de notificaciones completado');
    });
  });

  describe('forceUpdateOverdueTasks', () => {
    it('should force update overdue tasks', async () => {
      taskRepository.update.mockResolvedValue({ affected: 2 } as any);
      taskRepository.find.mockResolvedValue([]);

      await service.forceUpdateOverdueTasks();

      expect(mockLogger.log).toHaveBeenCalledWith('Forzando actualización de tareas atrasadas...');
      expect(mockLogger.log).toHaveBeenCalledWith('Iniciando proceso de marcado de tareas atrasadas...');
      expect(mockLogger.log).toHaveBeenCalledWith('Iniciando proceso de ocultación de tareas completadas...');
    });
  });
});
