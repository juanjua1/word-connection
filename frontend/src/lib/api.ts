import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors with better logic
    if (error.response?.status === 401) {
      // Clear the invalid token
      Cookies.remove('token');
      
      // Only redirect if we're not already on auth pages and not in server-side context
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/auth/') || currentPath === '/';
        
        if (!isAuthPage) {
          // Store current page for redirect after login
          sessionStorage.setItem('redirectAfterLogin', currentPath);
          window.location.href = '/auth/login';
        }
      }
    }
    
    // Handle forbidden errors (403)
    if (error.response?.status === 403) {
      console.warn('Access forbidden - insufficient permissions');
      // Don't redirect, just show error
    }
    
    // Handle server errors (5xx)
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data?.message || 'Internal server error');
    }
    
    return Promise.reject(error);
  }
);

export default api;
