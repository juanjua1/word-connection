'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark'; // Solo dark theme

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Solo carga el tema ultra-dark al inicializar
  useEffect(() => {
    setMounted(true);
  }, []);

  // Aplicar siempre tema ultra-dark al documento
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.add('dark'); // Siempre agregar clase dark
    }
  }, [mounted]);

  const toggleTheme = () => {
    // No hace nada, mantenemos siempre el tema oscuro
  };

  const setTheme = () => {
    // No cambia nada, mantenemos siempre el tema oscuro
  };

  // Evitar hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 

