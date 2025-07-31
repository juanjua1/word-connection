'use client';

import AdminDashboard from '../../components/admin/AdminDashboard';
import { Navbar } from '../../components/layout/Navbar';
import useAuthGuard from '../../hooks/useAuthGuard';
import AuthRequired from '../../components/ui/AuthRequired';
import { LoadingState } from '../../components/ui/LoadingState';

export default function AdminPage() {
  // Authentication guard
  const { user, isLoading: authLoading, needsLogin, shouldShowProtectedContent } = useAuthGuard();

  if (authLoading) {
    return <LoadingState fullScreen message="Verificando sesión..." />;
  }

  if (needsLogin) {
    return <AuthRequired />;
  }

  if (!shouldShowProtectedContent) {
    return null;
  }

  // Only admins allowed
  if (user?.role !== 'admin') {
    return (
      <AuthRequired 
        title="Acceso denegado" 
        message="No tienes permiso de administrador." 
        showLoginButton={false} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-100 mb-2">
            Panel de Administración ⚙️
          </h1>
          <p className="text-blue-300">
            Gestiona usuarios, configuraciones y supervisa el sistema
          </p>
        </div>

        {/* Componente de administración */}
        <AdminDashboard />
      </div>
    </div>
  );
}