import api from '../lib/api';
import { LoginCredentials, RegisterCredentials, User } from '../types';

export interface AdminRegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  adminSecretCode: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials) {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  async registerAdmin(credentials: AdminRegisterCredentials) {
    const response = await api.post('/auth/register-admin', credentials);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};
