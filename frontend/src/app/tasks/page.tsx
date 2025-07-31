'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { Navbar } from '../../components/layout/Navbar';
import { taskService } from '../../services/tasks';
import { categoryService } from '../../services/categories';
import { Task, Category, PaginatedTasks } from '../../types';
import { Plus, Search, Filter, Calendar, Clock, Tag, Edit, Trash2, CheckCircle, Circle, Play, X as XIcon } from 'lucide-react';
import useAuthGuard from '../../hooks/useAuthGuard';
import AuthRequired from '../../components/ui/AuthRequired';
import { LoadingState } from '../../components/ui/LoadingState';

export default function TasksPage() {
  // Authentication guard for TasksPage
  const { needsLogin, isLoading: authLoading, shouldShowProtectedContent } = useAuthGuard();
  
  // UI and data state hooks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    categoryId: '',
    page: 1
  });
  
  // Estado para UI
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    task: null as Task | null 
  });

  const loadInitialData = async () => {
    try {
      const [categoriesData] = await Promise.all([
        categoryService.getCategories()
      ]);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response: PaginatedTasks = await taskService.getTasks({
        search: filters.search || undefined,
        status: (filters.status as 'pending' | 'in_progress' | 'completed' | 'cancelled') || undefined,
        categoryId: filters.categoryId || undefined,
        page: filters.page,
        limit: pagination.limit
      });
      setTasks(response.tasks);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit]);

  // Cargar tareas cuando cambien los filtros
  useEffect(() => {
    loadTasks();
  }, [filters, loadTasks]);

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handleCategoryFilter = (categoryId: string) => {
    setFilters({ ...filters, categoryId, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeleteModal({ isOpen: true, task });
  };

  const confirmDeleteTask = async () => {
    if (!deleteModal.task) return;
    
    try {
      await taskService.deleteTask(deleteModal.task.id);
      loadTasks(); // Recargar lista
      setDeleteModal({ isOpen: false, task: null });
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea');
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await taskService.updateTask(task.id, {
        status: newStatus,
        isCompleted: newStatus === 'completed'
      });
      loadTasks(); // Recargar lista
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskModalSuccess = () => {
    loadTasks(); // Recargar lista después de crear/editar
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-900/20';
      case 'high':
        return 'text-orange-400 bg-orange-900/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'low':
        return 'text-green-400 bg-green-900/20';
      default:
        return 'text-gray-400 bg-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XIcon className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' }
  ];

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  // Conditional rendering after hooks
  if (authLoading) return <LoadingState fullScreen={true} message="Verificando sesión..." />;
  if (needsLogin) return <AuthRequired />;
  if (!shouldShowProtectedContent) return null;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white title-highlight mb-2">
              Mis Tareas 📋
            </h1>
            <p className="text-slate-300">
              Gestiona y organiza todas tus tareas de manera eficiente
            </p>
          </div>
          <Button
            onClick={handleCreateTask}
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
            className="mt-4 sm:mt-0 shadow-lg"
          >
            Nueva Tarea
          </Button>
        </div>

        {/* Filtros y Búsqueda mejorados */}
        <Card variant="elevated" className="mb-8 bg-[#1a2744] border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Barra de búsqueda y toggle de filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="    Buscar tareas por título o descripción..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    variant="filled"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <Button
                  variant={showFilters ? "primary" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<Filter className="w-4 h-4" />}
                  className={showFilters ? "" : "border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"}
                >
                  Filtros {showFilters && "(activos)"}
                </Button>
              </div>

              {/* Filtros expandibles */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-700">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Estado de la tarea
                    </label>
                    <Select
                      value={filters.status}
                      onChange={handleStatusFilter}
                      options={statusOptions}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Categoría
                    </label>
                    <Select
                      value={filters.categoryId}
                      onChange={handleCategoryFilter}
                      options={categoryOptions}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Tareas */}
        {tasks.length === 0 ? (
          <Card variant="elevated" className="text-center">
            <CardContent className="p-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground title-highlight mb-3">
                  {filters.search || filters.status || filters.categoryId
                    ? 'No se encontraron tareas'
                    : 'No tienes tareas aún'}
                </h3>
                <p className="text-muted mb-6">
                  {filters.search || filters.status || filters.categoryId
                    ? 'Prueba ajustando los filtros de búsqueda para encontrar lo que necesitas.'
                    : 'Comienza creando tu primera tarea para organizar tu trabajo de manera eficiente.'}
                </p>
                <Button
                  onClick={handleCreateTask}
                  variant="primary"
                  size="lg"
                  leftIcon={<Plus className="w-5 h-5" />}
                >
                  {filters.search || filters.status || filters.categoryId
                    ? 'Crear nueva tarea'
                    : 'Crear primera tarea'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card
                key={task.id}
                variant="elevated"
                className="group hover:scale-[1.01] transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Título y estado */}
                      <div className="flex items-center gap-4 mb-3">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className="flex-shrink-0 hover:scale-110 transition-transform duration-200 p-1 rounded-full hover:bg-surface"
                        >
                          {getStatusIcon(task.status)}
                        </button>
                        <h3
                          className={`text-lg font-semibold flex-1 ${
                            task.isCompleted
                              ? 'line-through text-muted'
                              : 'text-foreground text-bright'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold badge-bright ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>

                      {/* Descripción */}
                      {task.description && (
                        <p className="text-muted mb-4 text-sm leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Metadatos mejorados */}
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Categoría */}
                        {task.category ? (
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted" />
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium border"
                              style={{
                                backgroundColor: task.category.color + '15',
                                borderColor: task.category.color + '30',
                                color: task.category.color,
                              }}
                            >
                              {task.category.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted" />
                            <span className="px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-500 bg-gray-50">
                              Sin categoría
                            </span>
                          </div>
                        )}

                        {/* Estado */}
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getStatusLabel(task.status)}</span>
                        </div>

                        {/* Fecha de vencimiento */}
                        {task.dueDate && (
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Calendar className="w-4 h-4" />
                            <span>Vence: {formatDate(task.dueDate)}</span>
                          </div>
                        )}

                        {/* Información de asignación */}
                        <div className="text-xs">
                          {task.assignedBy ? (
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                              Asignada por: {task.assignedBy}
                            </span>
                          ) : task.assignedToUser && task.assignedToUser.id !== task.user.id ? (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                              Asignada a: {task.assignedToUser.firstName} {task.assignedToUser.lastName}
                            </span>
                          ) : (
                            <span className="bg-surface text-foreground px-3 py-1 rounded-full font-medium">
                              Creada por: {task.user.firstName} {task.user.lastName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fecha de creación */}
                      <div className="mt-3 text-xs text-muted">
                        Creada el {formatDate(task.createdAt)}
                      </div>
                    </div>

                    {/* Acciones mejoradas */}
                    <div className="flex items-center gap-2 ml-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                        leftIcon={<Edit className="w-4 h-4" />}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task)}
                        className="text-danger hover:text-danger hover:border-danger"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación mejorada */}
        {pagination.totalPages > 1 && (
          <Card variant="elevated" className="mt-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted order-2 sm:order-1">
                  Mostrando <span className="font-semibold number-highlight">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                  <span className="font-semibold number-highlight">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                  <span className="font-semibold number-highlight">{pagination.total}</span> tareas
                </p>
                <div className="flex items-center gap-3 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Página <span className="number-highlight">{pagination.page}</span> de <span className="number-highlight">{pagination.totalPages}</span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Tarea */}
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={handleTaskModalSuccess}
          task={selectedTask}
        />

        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, task: null })}
          onConfirm={confirmDeleteTask}
          taskTitle={deleteModal.task?.title || ''}
        />
      </div>
    </div>
  );
} 

