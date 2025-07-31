'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { analyticsService } from '../../services/analytics';
import { taskService } from '../../services/tasks';
import { useAuth } from '../../contexts/AuthContext';
import { DailyActivity as DailyActivityType, CategoryStats as CategoryStatsType } from '../../types/analytics';

// Contenedor base para gráficos con ResponsiveContainer
interface ChartContainerProps {
  children: React.ReactElement;
  height?: number;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  children, 
  height = 300, 
  className = '' 
}) => (
  <div className={`w-full ${className}`}>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);

// Gráfico de líneas conectado con datos reales
interface ConnectedActivityLineChartProps {
  timeframe?: 'week' | 'month' | 'quarter';
  height?: number;
  title?: string;
}

export const ConnectedActivityLineChart: React.FC<ConnectedActivityLineChartProps> = ({ 
  timeframe = 'week',
  height = 300,
  title = "Actividad Diaria"
}) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DailyActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Fetching activity line chart data...');

        const analyticsData = await analyticsService.getPersonalAnalytics(timeframe);
        
        const activityData: DailyActivityType[] = analyticsData.dailyActivity.map((day: DailyActivityType) => ({
          ...day,
          date: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        }));

        console.log('✅ Activity line chart data:', activityData);
        setData(activityData);

      } catch (err) {
        console.error('❌ Error fetching activity data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos de actividad');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, [isAuthenticated, timeframe]);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-center" style={{ height: height }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Cargando datos de actividad...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white shadow-lg border-red-200">
        <CardHeader className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-center" style={{ height: height }}>
            <div className="text-center">
              <p className="text-red-500 text-sm font-medium">Error al cargar datos</p>
              <p className="text-gray-400 text-xs mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Tareas creadas y completadas por día</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <ChartContainer height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Tareas Completadas"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Tareas Creadas"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// Gráfico de barras conectado con datos reales
interface ConnectedCategoryBarChartProps {
  timeframe?: 'week' | 'month' | 'quarter';
  height?: number;
  title?: string;
}

export const ConnectedCategoryBarChart: React.FC<ConnectedCategoryBarChartProps> = ({ 
  timeframe = 'month',
  height = 300,
  title = "Tareas por Categoría"
}) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<CategoryStatsType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        console.log('🔍 Fetching category bar chart data...');

        const analyticsData = await analyticsService.getPersonalAnalytics(timeframe);
        // Map directly to CategoryStatsType
        const categoryData: CategoryStatsType[] = analyticsData.categoryStats;

        console.log('✅ Category bar chart data:', categoryData);
        setData(categoryData);

      } catch (err) {
        console.error('❌ Error fetching category data:', err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [isAuthenticated, timeframe]);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-center" style={{ height: height }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Cargando datos de categorías...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Distribución y progreso por categoría</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <ChartContainer height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="categoryName" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="total" 
              fill="#3b82f6" 
              name="Total Tareas"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="completed" 
              fill="#10b981" 
              name="Completadas"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// Componente de estadísticas conectado
interface ConnectedStatCardProps {
  title: string;
  type: 'total' | 'completed' | 'pending' | 'inProgress' | 'overdue';
  icon?: React.ReactNode;
  className?: string;
}

export const ConnectedStatCard: React.FC<ConnectedStatCardProps> = ({ 
  title, 
  type, 
  icon, 
  className = '' 
}) => {
  const { isAuthenticated } = useAuth();
  const [value, setValue] = useState<number>(0);
  // Cambio no implementado
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const stats = await taskService.getTaskStats();
        
        let statValue = 0;
        switch (type) {
          case 'total':
            statValue = stats.totalAssigned || 0;
            break;
          case 'completed':
            statValue = stats.completed || 0;
            break;
          case 'pending':
            statValue = stats.pending || 0;
            break;
          case 'inProgress':
            statValue = stats.inProgress || 0;
            break;
          case 'overdue':
            statValue = stats.overdue || 0;
            break;
        }

        setValue(statValue);

        // TODO: Calcular el cambio respecto al período anterior si es necesario
        
      } catch (err) {
        console.error(`❌ Error fetching ${type} stat:`, err);
        setValue(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatData();
  }, [isAuthenticated, type]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="w-16 h-8 bg-gray-200 animate-pulse rounded mt-1"></div>
          </div>
          {icon && (
            <div className="text-3xl text-gray-300">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        {icon && (
          <div className="text-3xl text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// Exportar todos los componentes
export {
  ConnectedActivityLineChart as ActivityLineChart,
  ConnectedCategoryBarChart as CategoryBarChart,
  ConnectedStatCard as StatCard
};

// También mantener el componente original de ChartContainer para compatibilidad
export default ChartContainer;
