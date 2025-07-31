import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'common' | 'admin' | 'premium';
  isActive: boolean;
  createdAt: string;
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
}

export interface UserDetails extends User {
  updatedAt: string;
  tasks: Task[];
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    urgent: number;
    high: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface SearchUsersParams {
  search?: string;
  page?: number;
  limit?: number;
  role?: 'common' | 'admin' | 'premium';
  isActive?: boolean;
}

export interface SearchUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTaskForUserData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  categoryId: string;
  dueDate?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export const adminService = {
  async searchUsers(params: SearchUsersParams): Promise<SearchUsersResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.role) searchParams.append('role', params.role);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const response = await api.get(`/admin/users/search?${searchParams.toString()}`);
    return response.data;
  },

  async getUserDetails(userId: string): Promise<UserDetails> {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  async createTaskForUser(userId: string, taskData: CreateTaskForUserData): Promise<Task> {
    const response = await api.post(`/admin/users/${userId}/tasks`, taskData);
    return response.data;
  },

  async updateUserRole(userId: string, role: 'common' | 'admin' | 'premium'): Promise<User> {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  async toggleUserStatus(userId: string): Promise<User> {
    const response = await api.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  },
};
