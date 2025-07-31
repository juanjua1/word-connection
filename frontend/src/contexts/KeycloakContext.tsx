'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { keycloakService } from '../services/keycloak';

interface KeycloakUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  preferredUsername: string;
}

interface KeycloakContextType {
  isAuthenticated: boolean;
  user: KeycloakUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: () => Promise<void>;
  hasRole: (role: string) => boolean;
  getToken: () => string | undefined;
}

const KeycloakContext = createContext<KeycloakContextType | undefined>(undefined);

interface KeycloakProviderProps {
  children: ReactNode;
}

export function KeycloakProvider({ children }: KeycloakProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<KeycloakUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloakService.init();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const userInfo = keycloakService.getUserInfo();
          setUser(userInfo);
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const login = async () => {
    try {
      await keycloakService.login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await keycloakService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const register = async () => {
    try {
      await keycloakService.register();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const hasRole = (role: string): boolean => {
    return keycloakService.hasRole(role);
  };

  const getToken = (): string | undefined => {
    return keycloakService.getToken();
  };

  const value: KeycloakContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    register,
    hasRole,
    getToken,
  };

  return (
    <KeycloakContext.Provider value={value}>
      {children}
    </KeycloakContext.Provider>
  );
}

export function useKeycloak(): KeycloakContextType {
  const context = useContext(KeycloakContext);
  if (context === undefined) {
    throw new Error('useKeycloak must be used within a KeycloakProvider');
  }
  return context;
} 

