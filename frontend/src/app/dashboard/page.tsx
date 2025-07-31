'use client';

import React from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { LoadingState } from '../../components/ui/LoadingState';
import AuthRequired from '../../components/ui/AuthRequired';
import { ModernDashboard } from '../../components/dashboard/ModernDashboard';

export default function DashboardPage() {
  const { isLoading, shouldShowProtectedContent, needsLogin } = useAuthGuard();

  if (isLoading) {
    return <LoadingState message="Cargando dashboard..." />;
  }

  if (needsLogin) {
    return <AuthRequired />;
  }

  if (!shouldShowProtectedContent) {
    return <AuthRequired title="Acceso Denegado" message="No tienes permisos para acceder a esta página." />;
  }

  return <ModernDashboard />;
} 

