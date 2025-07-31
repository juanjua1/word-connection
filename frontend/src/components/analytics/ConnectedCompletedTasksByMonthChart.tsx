'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar
} from 'recharts';
import { taskService } from '../../services/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskFilters } from '../../types';

interface MonthlyTaskData {
  month: string;
  count: number;
  monthYear: string; // Para ordenamiento
}

interface ConnectedCompletedTasksByMonthChartProps {
  monthsToShow?: number;
}

export const ConnectedCompletedTasksByMonthChart: React.FC<ConnectedCompletedTasksByMonthChartProps> = ({ 
  monthsToShow = 3 
}) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<MonthlyTaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener los últimos N meses
  const getLastNMonths = (n: number): string[] => {
    const months = [];
    const now = new Date();
    
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
    }
    
    return months;
  };

  // Función para formatear el mes para mostrar
  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchCompletedTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Fetching completed tasks for monthly chart...');

        // Obtener todas las tareas completadas del usuario
        // Usamos un límite alto para obtener todas las tareas del período
        const filters: TaskFilters = {
          status: 'completed',
          limit: 1000, // Límite alto para obtener todas las tareas completadas
          page: 1
        };

        const response = await taskService.getTasks(filters);
        const completedTasks = response.tasks;

        console.log('📊 Completed tasks received:', completedTasks.length);

        // Obtener los últimos N meses
        const targetMonths = getLastNMonths(monthsToShow);
        
        // Crear mapa para contar tareas por mes
        const monthlyCount = new Map<string, number>();
        
        // Inicializar todos los meses con 0
        targetMonths.forEach(month => {
          monthlyCount.set(month, 0);
        });

        // Contar tareas completadas por mes
        completedTasks.forEach((task: Task) => {
          if (task.completedAt) {
            const completedDate = new Date(task.completedAt);
            const monthKey = completedDate.toISOString().slice(0, 7); // YYYY-MM
            
            // Solo contar si está en los meses objetivo
            if (monthlyCount.has(monthKey)) {
              monthlyCount.set(monthKey, (monthlyCount.get(monthKey) || 0) + 1);
            }
          }
        });

        // Convertir a array y formatear para el gráfico
        const chartData: MonthlyTaskData[] = targetMonths.map(monthKey => ({
          month: formatMonth(monthKey),
          count: monthlyCount.get(monthKey) || 0,
          monthYear: monthKey
        }));

        console.log('📈 Monthly chart data:', chartData);
        setData(chartData);

      } catch (err) {
        console.error('❌ Error fetching completed tasks by month:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos de tareas completadas');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedTasks();
  }, [isAuthenticated, monthsToShow]);

  if (isLoading) {
    return (
      <Card className="bg-[#1a2744] border-slate-700/50">
        <CardHeader className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Tareas Completadas por Mes
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-blue-300 text-sm">Cargando datos de los últimos {monthsToShow} meses...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#1a2744] border border-red-500/30 rounded-lg">
        <CardHeader className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Tareas Completadas por Mes
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
            <p className="text-blue-400 text-sm mt-2">
              Por favor, intenta recargar la página
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCompleted = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="bg-[#1a2744] border-slate-700/50">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Tareas Completadas por Mes
          </h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-400">{totalCompleted}</p>
            <p className="text-xs text-blue-300">Últimos {monthsToShow} meses</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155', 
                  borderRadius: '8px', 
                  color: '#fff',
                  fontSize: '14px'
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => [
                  `${value} tarea${value !== 1 ? 's' : ''}`, 
                  'Completadas'
                ]}
              />
              <Bar 
                dataKey="count" 
                fill="#8b5cf6" 
                radius={[4, 4, 0, 0]}
                strokeWidth={1}
                stroke="#9333ea"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {totalCompleted === 0 && (
          <div className="text-center mt-4">
            <p className="text-blue-400 text-sm">
              No hay tareas completadas en los últimos {monthsToShow} meses
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
