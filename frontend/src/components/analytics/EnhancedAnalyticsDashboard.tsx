'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from '../ui/Card';
import { 
  Activity, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Cookies from 'js-cookie';
import type { DailyActivity, CategoryStats } from '../../types/analytics';
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie
} from 'recharts';
import { ConnectedActivityCalendar } from './ConnectedActivityCalendar';
import { ConnectedCompletedTasksByMonthChart } from './ConnectedCompletedTasksByMonthChart';

// Types
type TimeFrame = 'week' | 'month' | 'quarter' | 'year';

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasksCount: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksCreatedByMonth: Array<{
    month: string;
    count: number;
  }>;
  tasksByStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  tasksByPriority: Array<{
    priority: string;
    count: number;
    color: string;
  }>;
  recentActivity: Array<{
    date: string;
    value: number;
  }>;
  userStats?: Array<{
    username: string;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  }>;
}

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: string;
}> = ({ title, value, icon, trend, description, color = 'emerald' }) => (
  <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30 hover:border-blue-600/50 transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 bg-${color}-500/10 rounded-lg`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-blue-300">{title}</p>
            <p className="text-2xl font-bold text-blue-100">{value}</p>
            {description && (
              <p className="text-xs text-blue-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend.isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Task Status Chart Component
const TaskStatusChart: React.FC<{ data: Array<{ status: string; count: number; color: string }> }> = ({ data }) => (
  <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
    <CardHeader className="p-6 pb-4">
      <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-blue-400" />
        Estado de Tareas
      </h3>
    </CardHeader>
    <CardContent className="p-6 pt-2">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
              label={({ status, percent }) => `${status} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

// Monthly Tasks Chart Component
const MonthlyTasksChart: React.FC<{ data: Array<{ month: string; count: number }> }> = ({ data }) => (
  <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
    <CardHeader className="p-6 pb-4">
      <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        Tareas Creadas por Mes
      </h3>
    </CardHeader>
    <CardContent className="p-6 pt-2">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export const EnhancedAnalyticsDashboard: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'insights'>('overview');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      return;
    }
  }, [authLoading, isAuthenticated]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching real analytics data...');
      console.log('User is admin:', isAdmin);
      console.log('Timeframe:', timeframe);

      // Usar el servicio de analytics existente
      const { analyticsService } = await import('../../services/analytics');
      
      let data;
      if (isAdmin) {
        console.log('📊 Fetching admin analytics...');
        // Llamar al endpoint de admin
        data = await analyticsService.getAdminAnalytics({
          timeframe: timeframe as 'week' | 'month' | 'quarter'
        });
      } else {
        console.log('👤 Fetching personal analytics...');
        // Llamar al endpoint personal
        data = await analyticsService.getPersonalAnalytics(timeframe as 'week' | 'month' | 'quarter');
      }
      
      console.log('✅ Raw analytics data:', data);
      
      // Transformar los datos del backend al formato esperado por el frontend
      const personalStats = data.personalStats || {};
      const categoryStats = data.categoryStats || [];
      const dailyActivity = data.dailyActivity || [];
      
      // Calcular datos de tareas por mes desde dailyActivity
      const monthlyData = dailyActivity.reduce((acc: Record<string, number>, day: DailyActivity) => {
        const date = new Date(day.date);
        const monthKey = date.toLocaleDateString('es-ES', { month: 'short' });
        if (!acc[monthKey]) {
          acc[monthKey] = 0;
        }
        acc[monthKey] += (day.created || 0);
        return acc;
      }, {});
      
      const tasksCreatedByMonth = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count: count as number
      }));
      
      const transformedData: AnalyticsData = {
        totalTasks: personalStats.total || 0,
        completedTasks: personalStats.completed || 0,
        pendingTasks: personalStats.pending || 0,
        overdueTasksCount: 0, // No disponible en UserStats actual - calcular si es necesario
        completionRate: personalStats.completionRate || 0,
        averageCompletionTime: personalStats.averageCompletionTime || 0,
        tasksCreatedByMonth: tasksCreatedByMonth,
        tasksByStatus: [
          { status: 'Completadas', count: personalStats.completed || 0, color: '#10b981' },
          { status: 'Pendientes', count: personalStats.pending || 0, color: '#f59e0b' },
          { status: 'En Progreso', count: personalStats.inProgress || 0, color: '#3b82f6' },
          { status: 'Vencidas', count: 0, color: '#ef4444' }, // Calcular si es necesario
        ].filter(item => item.count > 0), // Solo mostrar estados con datos
        tasksByPriority: categoryStats.map((cat: CategoryStats) => ({
          priority: cat.categoryName,
          count: cat.total,
          color: cat.color || '#64748b'
        })),
        recentActivity: dailyActivity.map((day: DailyActivity) => ({
          date: day.date,
          value: day.completed || 0
        })),
        userStats: isAdmin && data.selectedUserStats ? [{
          username: 'Usuario Seleccionado',
          completedTasks: data.selectedUserStats.completed || 0,
          pendingTasks: data.selectedUserStats.pending || 0,
          completionRate: data.selectedUserStats.completionRate || 0
        }] : undefined
      };
      
      console.log('🎯 Transformed data for charts:', transformedData);
      setAnalyticsData(transformedData);
      
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las analíticas');
      
      // En caso de error, usar estructura vacía pero válida en lugar de mock data
      const emptyData: AnalyticsData = {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasksCount: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        tasksCreatedByMonth: [],
        tasksByStatus: [],
        tasksByPriority: [],
        recentActivity: [],
        userStats: undefined
      };
      setAnalyticsData(emptyData);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAdmin, timeframe]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-lg">Cargando análisis...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a] flex items-center justify-center">
        <div className="text-center text-blue-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
          <p className="text-blue-400">Por favor, inicia sesión para ver el análisis.</p>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a] flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error al Cargar Datos</h2>
          <p className="text-blue-400 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-100 mb-2">
              Panel de Análisis
            </h1>
            <p className="text-blue-300">
              Vista general de tu productividad y estadísticas
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAnalyticsData}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total de Tareas"
                value={analyticsData.totalTasks}
                icon={<Target className="w-6 h-6 text-blue-400" />}
                description="Creadas hasta la fecha"
                color="blue"
              />
              <MetricCard
                title="Tareas Completadas"
                value={analyticsData.completedTasks}
                icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                trend={{ value: 12, isPositive: true }}
                color="emerald"
              />
              <MetricCard
                title="Tasa de Finalización"
                value={`${analyticsData.completionRate}%`}
                icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
                description="Eficiencia general"
                color="purple"
              />
              <MetricCard
                title="Tiempo Promedio"
                value={`${analyticsData.averageCompletionTime}d`}
                icon={<Clock className="w-6 h-6 text-orange-400" />}
                description="Para completar tareas"
                color="orange"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TaskStatusChart data={analyticsData.tasksByStatus} />
              <ConnectedCompletedTasksByMonthChart monthsToShow={3} />
            </div>

            {/* Activity Calendar */}
            <ConnectedActivityCalendar 
              timeframe="month" 
              title="Calendario de Actividad"
            />

            {/* Admin Section */}
            {isAdmin && analyticsData.userStats && (
              <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
                <CardHeader className="p-6 pb-4">
                  <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Estadísticas de Usuarios
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-blue-700/30">
                          <th className="text-left py-3 px-4 text-blue-300 font-medium">Usuario</th>
                          <th className="text-left py-3 px-4 text-blue-300 font-medium">Completadas</th>
                          <th className="text-left py-3 px-4 text-blue-300 font-medium">Pendientes</th>
                          <th className="text-left py-3 px-4 text-blue-300 font-medium">Tasa de Finalización</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.userStats.map((userStat, index) => (
                          <tr key={index} className="border-b border-blue-800/20 hover:bg-blue-800/20">
                            <td className="py-3 px-4 text-blue-100 font-medium">{userStat.username}</td>
                            <td className="py-3 px-4 text-emerald-400">{userStat.completedTasks}</td>
                            <td className="py-3 px-4 text-orange-400">{userStat.pendingTasks}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-700 rounded-full h-2">
                                  <div 
                                    className="bg-emerald-400 h-2 rounded-full" 
                                    style={{ width: `${userStat.completionRate}%` }}
                                  />
                                </div>
                                <span className="text-blue-300 text-sm">{userStat.completionRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
