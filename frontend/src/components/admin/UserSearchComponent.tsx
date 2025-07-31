'use client';

import React, { useState } from 'react';
import { Search, Filter, Users, Crown, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { User } from '../../services/admin';

interface UserSearchProps {
  users: User[];
  onUserSelect: (user: User) => void;
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

interface SearchFilters {
  search?: string;
  role?: 'common' | 'admin';
  isActive?: boolean;
  page?: number;
  limit?: number;
}

function UserSearch({
  users,
  onUserSelect,
  onSearch,
  loading,
  pagination,
  onPageChange
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSearch = () => {
    const filters: SearchFilters = {
      search: searchTerm || undefined,
      role: (roleFilter || undefined) as 'common' | 'admin' | undefined,
      isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      page: 1,
      limit: pagination.limit
    };
    onSearch(filters);
  };

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircle className="w-4 h-4 text-green-400" /> : 
      <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? 
      <Crown className="w-4 h-4 text-yellow-400" /> : 
      <Users className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Filtros de búsqueda */}
      <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Buscar usuario
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                <Input
                  placeholder="Nombre, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-blue-900/40 border-blue-600/50 text-blue-100 placeholder-blue-400 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Rol
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-blue-900/40 border border-blue-600/50 rounded-md text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="bg-blue-900 text-blue-100">Todos los roles</option>
                <option value="common" className="bg-blue-900 text-blue-100">Usuario Común</option>
                <option value="admin" className="bg-blue-900 text-blue-100">Administrador</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-blue-900/40 border border-blue-600/50 rounded-md text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="bg-blue-900 text-blue-100">Todos</option>
                <option value="active" className="bg-blue-900 text-blue-100">Activos</option>
                <option value="inactive" className="bg-blue-900 text-blue-100">Inactivos</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-slate-300">Cargando usuarios...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {users.length === 0 ? (
            <Card className="bg-[#1a2744] border-slate-700">
              <CardContent className="py-8 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400">No se encontraron usuarios</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card 
                key={user.id} 
                className="bg-[#1a2744] border-slate-700 hover:bg-[#243658] hover:border-slate-600 transition-all duration-200 cursor-pointer"
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        {getStatusIcon(user.isActive)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                          <span>Rol: {user.role === 'admin' ? 'Administrador' : 'Usuario Común'}</span>
                          <span>Registrado: {formatDate(user.createdAt)}</span>
                          {user.taskStats && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
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
                        onClick={() => onUserSelect(user)}
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

          {/* Paginación */}
          {users.length > 0 && (
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-blue-400">
                Mostrando {users.length} de {pagination.total} usuarios
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 py-1 text-sm text-blue-400 bg-blue-900/40 rounded-md border border-blue-600/50">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserSearch;
export { UserSearch };
