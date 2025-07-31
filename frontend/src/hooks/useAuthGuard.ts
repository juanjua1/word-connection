import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para proteger rutas que requieren autenticación
 * Solo redirige a login si el usuario accede directamente a una ruta protegida
 * No interfiere con la navegación normal
 */
export const useAuthGuard = (redirectTo: string = '/auth/login') => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si termina de cargar y no está autenticado
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      // Evitar loop en rutas de auth o landing
      if (!currentPath.startsWith('/auth') && currentPath !== '/') {
        // Guardar ruta deseada para redireccionar después del login
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        router.push(redirectTo);
      }
    }
  }, [user, isLoading, isAuthenticated, router, redirectTo]);

  return {
    user,
    isLoading,
    isAuthenticated,
    // Indica si debería mostrar contenido protegido
    shouldShowProtectedContent: isAuthenticated,
    // Indica si debería mostrar un mensaje de login requerido
    needsLogin: !isLoading && !isAuthenticated
  };
};

/**
 * Hook para proteger rutas que requieren roles específicos
 */
export const useRoleGuard = (requiredRoles: string[], redirectTo: string = '/dashboard') => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const hasRequiredRole = user && requiredRoles.includes(user.role);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRequiredRole) {
      router.push(redirectTo);
    }
  }, [user, isLoading, isAuthenticated, hasRequiredRole, router, redirectTo]);

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRequiredRole,
    shouldShowContent: isAuthenticated && hasRequiredRole,
    needsPermission: isAuthenticated && !hasRequiredRole
  };
};

export default useAuthGuard;
