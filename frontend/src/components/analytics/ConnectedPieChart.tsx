'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, TaskStatsPieChart } from './PieChart';
import { taskService } from '../../services/tasks';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, Clock, Activity } from 'lucide-react';

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ConnectedTaskStatusPieChartProps {
  title?: string;
  subtitle?: string;
  size?: number;
}

export const ConnectedTaskStatusPieChart: React.FC<ConnectedTaskStatusPieChartProps> = ({
  title = "Estado de Tareas",
  subtitle = "Distribución actual de tareas (datos reales)",
  size = 240
}) => {
  const { isAuthenticated } = useAuth();
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Fetching task stats for pie chart...');

        // Obtener estadísticas básicas de tareas
        const stats = await taskService.getTaskStats();
        
        console.log('📊 Task stats received:', stats);

        setTaskStats({
          completed: stats.completed || 0,
          pending: stats.pending || 0,
          inProgress: stats.inProgress || 0,
          overdue: stats.totalAssigned - stats.completed - stats.pending - stats.inProgress || 0
        });

      } catch (err) {
        console.error('❌ Error fetching task stats:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas de tareas');
        
        // En caso de error, usar valores vacíos
        setTaskStats({ completed: 0, pending: 0, inProgress: 0, overdue: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskStats();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="bg-[#1a2744] border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a2744] border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <p className="text-red-400 text-sm font-medium">Error al cargar estadísticas</p>
            <p className="text-slate-500 text-xs mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Usar el componente TaskStatsPieChart existente con datos reales
  return (
    <TaskStatsPieChart
      completed={taskStats.completed}
      pending={taskStats.pending}
      overdue={taskStats.inProgress} // Usando inProgress como "overdue" por ahora
    />
  );
};

// También crear un componente más genérico
export const ConnectedPieChart: React.FC<{
  dataType: 'taskStatus' | 'priority' | 'categories';
  title?: string;
  subtitle?: string;
  size?: number;
}> = ({ dataType }) => {
  const { isAuthenticated } = useAuth();
  const [pieData, setPieData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPieData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        console.log(`🔍 Fetching pie chart data for: ${dataType}`);

        let data: ChartDataItem[] = [];

        switch (dataType) {
          case 'taskStatus':
            const stats = await taskService.getTaskStats();
            data = [
              {
                label: 'Completadas',
                value: stats.completed || 0,
                color: '#10b981',
                icon: CheckCircle,
              },
              {
                label: 'Pendientes',
                value: stats.pending || 0,
                color: '#f59e0b',
                icon: Clock,
              },
              {
                label: 'En Progreso',
                value: stats.inProgress || 0,
                color: '#3b82f6',
                icon: Activity,
              },
            ].filter(item => item.value > 0);
            break;

          case 'priority':
            // Aquí podrías obtener datos de prioridad si tienes un endpoint
            data = [];
            break;

          case 'categories':
            // Aquí podrías obtener datos de categorías
            data = [];
            break;
        }

        console.log(`✅ Pie chart data for ${dataType}:`, data);
        setPieData(data);

      } catch (err) {
        console.error(`❌ Error fetching ${dataType} data:`, err);
        setPieData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPieData();
  }, [isAuthenticated, dataType]);

  if (isLoading) {
    return (
      <div className="bg-[#1a2744] border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Cargando gráfico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PieChart 
      data={pieData}
      title={`Distribución por ${dataType}`}
      subtitle="Datos en tiempo real"
      size={200}
    />
  );
};export default ConnectedTaskStatusPieChart;
