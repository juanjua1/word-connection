'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { Navbar } from '../layout/Navbar';
import { taskService } from '../../services/tasks';
import { TaskStats, Task } from '../../types';
import { CheckCircle, Clock, AlertCircle, Plus, BarChart3, Target, Users, ArrowRight, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export function ModernDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Usar el mismo servicio que analytics para datos consistentes
      const { analyticsService } = await import('../../services/analytics');
      
      // Obtener datos reales de analytics y tareas recientes
      const [analyticsData, tasksData] = await Promise.all([
        user?.role === 'admin' 
          ? analyticsService.getAdminAnalytics({ timeframe: 'month' })
          : analyticsService.getPersonalAnalytics('month'),
        taskService.getTasks({ limit: 5 })
      ]);
      
      console.log('📊 Dashboard analytics data:', analyticsData);
      
      // Transformar datos de analytics al formato TaskStats
      const personalStats = analyticsData.personalStats || {};
      const transformedStats: TaskStats = {
        total: personalStats.total || 0,
        totalCreated: personalStats.total || 0,
        totalAssigned: personalStats.total || 0, // Para usuarios normales, igual al total
        completed: personalStats.completed || 0,
        pending: personalStats.pending || 0,
        inProgress: personalStats.inProgress || 0,
        overdue: 0, // Calcular después si es necesario
        completionRate: personalStats.completionRate || 0
      };
      
      console.log('🎯 Transformed stats for dashboard:', transformedStats);
      
      setStats(transformedStats);
      setRecentTasks(tasksData.tasks || tasksData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback a taskService básico si falla analytics
      try {
        const [basicStats, tasksData] = await Promise.all([
          taskService.getTaskStats(),
          taskService.getTasks({ limit: 5 })
        ]);
        setStats(basicStats);
        setRecentTasks(tasksData.tasks || tasksData);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = () => {
    setIsTaskModalOpen(true);
  };

  const handleTaskCreated = () => {
    setIsTaskModalOpen(false);
    fetchDashboardData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Dashboard - Acceso Restringido
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Para ver tu dashboard personalizado necesitas iniciar sesión.
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a]">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Bienvenido, {user?.firstName}
          </h1>
          <p className="mt-2 text-slate-300">
            Aquí tienes un resumen de tu actividad y tareas pendientes.
          </p>
        </div>

        {/* Stats Cards Container */}
        {stats && (
          <div className="bg-[#1a2744] border border-slate-700/50 rounded-lg p-6 mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Resumen de Estadísticas
              </h2>
              <p className="text-sm text-slate-400 mt-1">Visión general de tu productividad</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total de Tareas */}
              <Card className="bg-[#1a2744] border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/30">
                        <Target className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total de Tareas</p>
                        <p className="text-2xl font-bold text-white">{stats.totalCreated || stats.total}</p>
                        <p className="text-xs text-blue-300/70 mt-1">Creadas hasta la fecha</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completadas */}
              <Card className="bg-[#1a2744] border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg border border-emerald-500/30">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Completadas</p>
                        <p className="text-2xl font-bold text-white">{stats.completed}</p>
                        <p className="text-xs text-emerald-300/70 mt-1">
                          {stats.completionRate ? `${Math.round(stats.completionRate)}%` : 
                           stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'} de eficiencia
                        </p>
                      </div>
                    </div>
                    {stats.completionRate && (
                      <div className="flex items-center space-x-1 text-sm text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                        <BarChart3 className="w-4 h-4" />
                        <span>{Math.round(stats.completionRate)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* En Progreso */}
              <Card className="bg-[#1a2744] border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-500/30">
                        <Clock className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">En Progreso</p>
                        <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                        <p className="text-xs text-purple-300/70 mt-1">Actualmente trabajando</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pendientes */}
              <Card className="bg-[#1a2744] border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-500/30">
                        <AlertCircle className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Pendientes</p>
                        <p className="text-2xl font-bold text-white">{stats.pending}</p>
                        <p className="text-xs text-orange-300/70 mt-1">
                          {stats.overdue > 0 ? `${stats.overdue} vencidas` : 'Sin retrasos'}
                        </p>
                      </div>
                    </div>
                    {stats.overdue > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                        <AlertCircle className="w-4 h-4" />
                        <span>{stats.overdue}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1a2744] border-slate-700 hover:bg-[#243658] hover:border-slate-600 transition-all cursor-pointer" onClick={handleCreateTask}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
                  <Plus className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Crear Nueva Tarea</h3>
                  <p className="text-sm text-slate-400">Añade una nueva tarea a tu lista</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link href="/analytics">
            <Card className="bg-[#1a2744] border-slate-700 hover:bg-[#243658] hover:border-slate-600 transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-900/30 rounded-lg border border-green-700/50">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Ver Analisis</h3>
                    <p className="text-sm text-slate-400">Analiza tu productividad</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {user?.role === 'admin' && (
            <Link href="/admin">
              <Card className="bg-[#1a2744] border-slate-700 hover:bg-[#243658] hover:border-slate-600 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-700/50">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Administración</h3>
                      <p className="text-sm text-slate-400">Gestionar usuarios y equipos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Recent Tasks */}
        <Card className="bg-[#1a2744] border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white title-highlight">Tareas Recientes</h2>
              <Link href="/tasks">
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Ver todas <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-4 p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'completed' ? 'bg-green-400' : 
                      task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-slate-500'
                    }`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <p className="text-sm text-slate-400">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white badge-bright px-2 py-1 rounded bg-slate-800 border border-slate-600">
                        {task.priority === 'high' ? '🔴 Alta' : 
                         task.priority === 'medium' ? '🟡 Media' : '🟢 Baja'}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No hay tareas recientes</p>
                <Button onClick={handleCreateTask} className="mt-4">
                  Crear tu primera tarea
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={handleTaskCreated}
      />
    </div>
  );
}

