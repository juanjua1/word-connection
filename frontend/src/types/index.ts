export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'common' | 'premium' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  isCompleted: boolean;
  isOverdue: boolean;
  completedAt?: string;
  visibleUntil?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categoryId?: string | null;
  assignedToUserId?: string;
  assignedBy?: string; // Nombre completo de quien asignó la tarea
  assignedAt?: string; // Fecha de asignación
  user: User;
  category: Category | null;
  assignedToUser?: User;
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'common' | 'premium' | 'admin' | 'super_admin';
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  categoryId?: string;
  assignedToUserId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  isCompleted?: boolean;
  categoryId?: string;
  assignedToUserId?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Nuevos tipos para Teams
export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  memberIds: string[];
  creator: User;
  members?: User[];
}

export interface CreateTeamData {
  name: string;
  description?: string;
  color?: string;
  memberIds?: string[];
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  color?: string;
  memberIds?: string[];
}

// Tipos para Notificaciones
export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_overdue';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  taskId?: string;
  task?: Task;
  metadata?: Record<string, unknown>;
}

// Tipos para Analytics Avanzadas
export interface AdvancedAnalytics {
  period: 'week' | 'month' | 'all';
  userTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionDays: CompletionDay[];
  completionRate: number;
}

export interface CompletionDay {
  date: string;
  count: number;
}

// Tipos actualizados para TaskStats
export interface TaskStats {
  totalCreated: number;
  totalAssigned: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}
