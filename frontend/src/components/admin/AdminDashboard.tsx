'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users as UsersIcon, Settings, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { adminService, User } from '../../services/admin';
import TaskAssignment from './TaskAssignment';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    commonUsers: 0,
  });

  useEffect(() => {
    loadUsers({});
    loadStats();
  }, []);

  const loadUsers = async (params: {
    search?: string;
    role?: 'common' | 'admin';
    page?: number;
  }) => {
    setLoading(true);
    try {
      const response = await adminService.searchUsers({
        search: params.search,
        role: params.role,
        page: params.page || 1,
        limit: 10,
      });
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const allUsersResponse = await adminService.searchUsers({
        page: 1,
        limit: 1000,
      });
      const allUsers = allUsersResponse.users;
      const activeUsers = allUsers.filter(user => user.isActive);
      const adminUsers = allUsers.filter(user => user.role === 'admin');
      const commonUsers = allUsers.filter(user => user.role === 'common');

      setStats({
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        adminUsers: adminUsers.length,
        commonUsers: commonUsers.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        commonUsers: 0,
      });
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowTaskAssignment(true);
  };

  const handleTaskAssigned = () => {
    loadUsers({});
    loadStats();
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string; 
  }) => (
    <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30 hover:border-blue-600/50 transition-colors duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">{title}</p>
            <p className="text-2xl font-bold text-blue-100 number-highlight">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a]">
      <div className="bg-gradient-to-r from-[#1a2744] to-[#2a3f5f] border-b border-blue-700/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-700/50">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-100 title-highlight">
                  Panel de Administración
                </h1>
                <p className="text-sm text-blue-300">
                  Gestiona usuarios y asigna tareas
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50 hover:text-blue-100">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Usuarios"
            value={stats.totalUsers}
            icon={UsersIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Usuarios Activos"
            value={stats.activeUsers}
            icon={BarChart3}
            color="bg-green-500"
          />
          <StatCard
            title="Administradores"
            value={stats.adminUsers}
            icon={Shield}
            color="bg-yellow-500"
          />
          <StatCard
            title="Usuarios Comunes"
            value={stats.commonUsers}
            icon={UsersIcon}
            color="bg-purple-500"
          />
        </div>

        {/* Búsqueda de usuarios */}
        <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
          <CardHeader>
            <h2 className="text-xl font-semibold text-blue-100 title-highlight">
              Gestión de Usuarios
            </h2>
            <p className="text-sm text-blue-300">
              Busca usuarios y asígnales tareas
            </p>
          </CardHeader>
          <CardContent>
            {/* Formulario de búsqueda simplificado */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Buscar usuarios por nombre o email..."
                  className="flex-1 bg-blue-900/40 border-blue-600/50 text-blue-100 placeholder-blue-400"
                  onChange={(e) => {
                    setTimeout(() => {
                      loadUsers({ search: e.target.value });
                    }, 300);
                  }}
                />
                <Button
                  onClick={() => loadUsers({})}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Recargar
                </Button>
              </div>

              {/* Lista de usuarios */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                  <span className="ml-2 text-blue-300">Cargando usuarios...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <div className="py-8 text-center">
                      <UsersIcon className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-400">No se encontraron usuarios</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <Card 
                        key={user.id} 
                        className="bg-gradient-to-r from-[#1a2744] to-[#243658] border-blue-700/30 hover:border-blue-600/50 transition-all duration-200"
                      >
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                {user.role === 'admin' ? (
                                  <Shield className="w-4 h-4 text-yellow-400" />
                                ) : (
                                  <UsersIcon className="w-4 h-4 text-blue-400" />
                                )}
                                {user.isActive ? (
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                ) : (
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-blue-100">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <p className="text-sm text-blue-400">{user.email}</p>
                                <div className="flex items-center space-x-4 text-xs text-blue-500 mt-1">
                                  <span>Rol: {user.role === 'admin' ? 'Administrador' : 'Usuario Común'}</span>
                                  <span>Estado: {user.isActive ? 'Activo' : 'Inactivo'}</span>
                                  {user.taskStats && (
                                    <span>
                                      {user.taskStats.total} tareas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {user.taskStats && (
                                <div className="text-right text-sm mr-4">
                                  <div className="text-green-400">✓ {user.taskStats.completed}</div>
                                  <div className="text-yellow-400">⏳ {user.taskStats.pending}</div>
                                  <div className="text-blue-400">🔄 {user.taskStats.inProgress}</div>
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserSelect(user)}
                                className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50 hover:text-blue-100 hover:border-blue-500/70"
                              >
                                Asignar Tarea
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}

                  {/* Paginación simplificada */}
                  {users.length > 0 && pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center pt-4">
                      <div className="text-sm text-blue-400">
                        Página {pagination.page} de {pagination.totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadUsers({ page: pagination.page - 1 })}
                          disabled={pagination.page === 1}
                          className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50 hover:text-blue-100 disabled:opacity-50"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadUsers({ page: pagination.page + 1 })}
                          disabled={pagination.page === pagination.totalPages}
                          className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50 hover:text-blue-100 disabled:opacity-50"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de asignación de tareas */}
      {showTaskAssignment && selectedUser && (
        <TaskAssignment
          user={selectedUser}
          onClose={() => {
            setShowTaskAssignment(false);
            setSelectedUser(null);
          }}
          onTaskAssigned={handleTaskAssigned}
        />
      )}
    </div>
  );
}

