'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { taskService } from '../../services/tasks';
import { ActivityCalendar } from './ActivityCalendar';
import { Task, TaskFilters } from '../../types';

export interface ConnectedActivityCalendarProps {
  timeframe?: 'week' | 'month' | 'quarter';
  title?: string;
}

export const ConnectedActivityCalendar: React.FC<ConnectedActivityCalendarProps> = ({ 
  timeframe = 'month', 
  title = 'Calendario de Actividad' 
}) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<Array<{ date: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el rango de fechas según el timeframe
  const getDateRange = (timeframe: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return { startDate, endDate: now };
  };

  // Función para generar todos los días en un rango
  const generateDateRange = (startDate: Date, endDate: Date): string[] => {
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchActivityData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Fetching activity calendar data...');

        // Obtener el rango de fechas
        const { startDate, endDate } = getDateRange(timeframe);
        
        // Obtener todas las tareas completadas del usuario en el período
        const filters: TaskFilters = {
          status: 'completed',
          limit: 1000, // Límite alto para obtener todas las tareas
          page: 1
        };

        const response = await taskService.getTasks(filters);
        const completedTasks = response.tasks;

        console.log('📊 Completed tasks for calendar:', completedTasks.length);

        // Generar todos los días en el rango
        const allDates = generateDateRange(startDate, endDate);
        
        // Crear mapa para contar tareas por día
        const dailyCount = new Map<string, number>();
        
        // Inicializar todos los días con 0
        allDates.forEach(date => {
          dailyCount.set(date, 0);
        });

        // Contar tareas completadas por día
        completedTasks.forEach((task: Task) => {
          if (task.completedAt) {
            const completedDate = new Date(task.completedAt);
            const dateKey = completedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Solo contar si está en el rango de fechas
            if (dailyCount.has(dateKey)) {
              dailyCount.set(dateKey, (dailyCount.get(dateKey) || 0) + 1);
            }
          }
        });

        // Convertir a formato esperado por el calendario
        const calendarData = allDates.map(date => ({
          date,
          value: dailyCount.get(date) || 0
        }));

        console.log('📈 Calendar data prepared:', {
          totalDays: calendarData.length,
          activeDays: calendarData.filter(d => d.value > 0).length,
          totalTasks: calendarData.reduce((sum, d) => sum + d.value, 0)
        });

        setData(calendarData);

      } catch (err) {
        console.error('❌ Error fetching activity calendar data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos del calendario');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, [isAuthenticated, timeframe]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-blue-300 text-sm">Cargando calendario de actividad...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border border-red-500/30 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-blue-400 text-sm">Por favor, intenta recargar la página</p>
        </div>
      </Card>
    );
  }

  return (
    <ActivityCalendar data={data} title={title} />
  );
};
