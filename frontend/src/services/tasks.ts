import api from '../lib/api';
import { Task, PaginatedTasks, TaskStats, CreateTaskData, UpdateTaskData, TaskFilters, AdvancedAnalytics } from '../types';

export const taskService = {
  async getTasks(filters: TaskFilters = {}): Promise<PaginatedTasks> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getTaskStats(): Promise<TaskStats> {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  async getAdvancedAnalytics(period: 'week' | 'month' | 'all'): Promise<AdvancedAnalytics> {
    const response = await api.get(`/tasks/analytics/${period}`);
    return response.data;
  },

  async markOverdueTasks(): Promise<void> {
    await api.post('/tasks/mark-overdue');
  },
};
