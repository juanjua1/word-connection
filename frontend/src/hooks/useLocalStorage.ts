'use client';

import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Obtener del localStorage por key
      const item = window.localStorage.getItem(key);
      // Parsear JSON almacenado o devolver initialValue si no existe
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para establecer valor
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Guardar el estado
      setStoredValue(valueToStore);
      // Guardar en localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Tipo para backup de usuario
interface UserBackup {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  timestamp: number;
}

// Hook para mantener datos de usuario en localStorage como backup
export function useUserPersistence() {
  const [persistedUser, setPersistedUser] = useLocalStorage<UserBackup | null>('user_backup', null);

  const saveUserBackup = (user: Partial<UserBackup>) => {
    if (user && user.id) {
      setPersistedUser({
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || '',
        timestamp: Date.now()
      });
    }
  };

  const getUserBackup = (): UserBackup | null => {
    if (persistedUser && persistedUser.timestamp) {
      // Solo usar backup si es de menos de 7 días
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (persistedUser.timestamp > sevenDaysAgo) {
        return persistedUser;
      }
    }
    return null;
  };

  const clearUserBackup = () => {
    setPersistedUser(null);
  };

  return {
    saveUserBackup,
    getUserBackup,
    clearUserBackup
  };
}
