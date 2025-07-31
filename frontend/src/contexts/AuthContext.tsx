'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { User, LoginCredentials, RegisterCredentials } from '../types';
import { AdminRegisterCredentials } from '../services/auth';
import { authService } from '../services/auth';
import { useUserPersistence } from '../hooks/useLocalStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  registerAdmin: (credentials: AdminRegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  checkTokenValidity: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { saveUserBackup, getUserBackup, clearUserBackup } = useUserPersistence();

  // Initialize authentication once on mount
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
          saveUserBackup(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          Cookies.remove('token');
          
          const backupUser = getUserBackup();
          if (backupUser) {
            const restoredUser: User = {
              id: backupUser.id,
              email: backupUser.email,
              firstName: backupUser.firstName,
              lastName: backupUser.lastName,
              role: backupUser.role as User['role'],
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setUser(restoredUser);
          } else {
            setUser(null);
            clearUserBackup();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      const { user: userData, token } = response;

      // Token más duradero para aplicación empresarial (7 días)
      Cookies.set('token', token, {
        expires: 7, // 7 días
        secure: process.env.NODE_ENV === 'production', // HTTPS en producción
        sameSite: 'strict' // Protección CSRF
      });

      setUser(userData);
      // Guardar backup del usuario
      saveUserBackup(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await authService.register(credentials);
      const { user: userData, token } = response;

      // Token más duradero para aplicación empresarial (7 días)
      Cookies.set('token', token, {
        expires: 7, // 7 días
        secure: process.env.NODE_ENV === 'production', // HTTPS en producción
        sameSite: 'strict' // Protección CSRF
      });

      setUser(userData);
      // Guardar backup del usuario
      saveUserBackup(userData);
    } catch (error) {
      throw error;
    }
  };

  const registerAdmin = async (credentials: AdminRegisterCredentials) => {
    try {
      const response = await authService.registerAdmin(credentials);
      const { token, user: userData } = response;

      Cookies.set('token', token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      setUser(userData);
      saveUserBackup(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    clearUserBackup(); // Limpiar backup al hacer logout
  };

  const refreshAuth = async () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const userData = await authService.getProfile();
        setUser(userData);
        return;
      } catch (error) {
        console.error('Failed to refresh auth:', error);
        Cookies.remove('token');
        setUser(null);
      }
    }
  };

  const checkTokenValidity = (): boolean => {
    const token = Cookies.get('token');
    return !!token && !!user;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    registerAdmin,
    logout,
    refreshAuth,
    checkTokenValidity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 

