'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Activity } from 'lucide-react';

interface HeatmapData {
  date: string;
  value: number;
}

interface ActivityCalendarProps {
  data: HeatmapData[];
  title: string;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ data, title }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [hoveredDay, setHoveredDay] = React.useState<{
    date: string;
    value: number;
    dayName: string;
    isWeekend: boolean;
  } | null>(null);

  // Obtener el primer y último día del mes actual
  const getMonthBounds = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };

  // Generar días del mes actual (solo laborables)
  const generateMonthWorkDays = () => {
    const { firstDay, lastDay } = getMonthBounds(currentDate);
    const workDays = [];
    
    const currentDay = new Date(firstDay);
    
    while (currentDay <= lastDay) {
      const dayOfWeek = currentDay.getDay();
      // Solo días laborables (1=Lunes a 5=Viernes)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateString = currentDay.toISOString().split('T')[0];
        const dayData = data.find(d => d.date === dateString);
        
        workDays.push({
          date: dateString,
          value: dayData ? dayData.value : 0,
          dayOfWeek,
          dayNumber: currentDay.getDate(),
          dayName: currentDay.toLocaleDateString('es-ES', { weekday: 'short' }),
          fullDate: currentDay.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          isToday: currentDay.toDateString() === new Date().toDateString()
        });
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return workDays;
  };

  const monthWorkDays = generateMonthWorkDays();
  const maxValue = Math.max(...monthWorkDays.map(d => d.value), 1);
  const totalTasks = monthWorkDays.reduce((sum, d) => sum + d.value, 0);
  const activeDays = monthWorkDays.filter(d => d.value > 0).length;
  const averageDaily = monthWorkDays.length > 0 ? totalTasks / monthWorkDays.length : 0;

  // Navegación de meses
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (nextMonth <= today) {
      setCurrentDate(nextMonth);
    }
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Organizar días en semanas (5 días laborables cada una)
  const organizeIntoWeeks = () => {
    const weeks = [];
    for (let i = 0; i < monthWorkDays.length; i += 5) {
      weeks.push(monthWorkDays.slice(i, i + 5));
    }
    return weeks;
  };

  const weeks = organizeIntoWeeks();

  // Verificar si es el mes actual
  const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && 
                        currentDate.getFullYear() === new Date().getFullYear();

  // Verificar si podemos ir al siguiente mes
  const canGoNext = currentDate.getMonth() < new Date().getMonth() || 
                   currentDate.getFullYear() < new Date().getFullYear();

  // Colores profesionales para oficina
  const getActivityLevel = (value: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return {
      bg: 'bg-slate-100/5',
      border: 'border-slate-700/30',
      label: 'Sin actividad',
      intensity: 0
    };
    if (intensity <= 0.25) return {
      bg: 'bg-emerald-900/40',
      border: 'border-emerald-700/60',
      label: 'Actividad baja',
      intensity: 1
    };
    if (intensity <= 0.5) return {
      bg: 'bg-emerald-700/60',
      border: 'border-emerald-600/80',
      label: 'Actividad moderada',
      intensity: 2
    };
    if (intensity <= 0.75) return {
      bg: 'bg-emerald-500/80',
      border: 'border-emerald-500/90',
      label: 'Actividad alta',
      intensity: 3
    };
    return {
      bg: 'bg-emerald-400',
      border: 'border-emerald-400',
      label: 'Actividad muy alta',
      intensity: 4
    };
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30 relative overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              {title}
            </h3>
            <p className="text-sm text-blue-300 mt-1">
              Calendario de productividad - Días laborables
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Tareas del mes</p>
            <p className="text-2xl font-bold text-emerald-400">{totalTasks}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-2">
        {/* Navegación del calendario */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm text-slate-400">Anterior</span>
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold text-white capitalize">
              {monthName}
            </h2>
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
              >
                Ir al mes actual
              </button>
            )}
          </div>

          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className={`flex items-center gap-2 px-3 py-2 border border-slate-700/50 rounded-lg transition-colors ${
              canGoNext 
                ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400' 
                : 'bg-slate-900/30 text-slate-600 cursor-not-allowed'
            }`}
          >
            <span className="text-sm">Siguiente</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Métricas del mes */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-gradient-to-br from-slate-800/20 to-slate-700/20 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Días Productivos</p>
            <p className="text-lg font-bold text-emerald-400">{activeDays}</p>
            <p className="text-xs text-slate-500">de {monthWorkDays.length}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-slate-800/20 to-slate-700/20 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Promedio Diario</p>
            <p className="text-lg font-bold text-blue-400">{averageDaily.toFixed(1)}</p>
            <p className="text-xs text-slate-500">tareas/día</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-slate-800/20 to-slate-700/20 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Mejor Día</p>
            <p className="text-lg font-bold text-purple-400">{maxValue}</p>
            <p className="text-xs text-slate-500">tareas</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-slate-800/20 to-slate-700/20 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Eficiencia</p>
            <p className="text-lg font-bold text-orange-400">
              {monthWorkDays.length > 0 ? ((activeDays / monthWorkDays.length) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-slate-500">consistencia</p>
          </div>
        </div>

        {/* Calendario centrado */}
        <div className="flex flex-col items-center space-y-4">
          {/* Header de días laborables */}
          <div className="flex gap-2">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, index) => (
              <div key={index} className="w-12 h-8 flex items-center justify-center text-xs text-slate-400 font-medium">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Grid del calendario */}
          <div className="space-y-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-2 justify-center">
                {Array.from({ length: 5 }, (_, dayIndex) => {
                  const day = week[dayIndex];
                  if (!day) {
                    return (
                      <div
                        key={dayIndex}
                        className="w-12 h-12 bg-transparent"
                      />
                    );
                  }
                  
                  const activityLevel = getActivityLevel(day.value);
                  
                  return (
                    <div
                      key={day.date}
                      className={`w-12 h-12 rounded-lg transition-all duration-300 cursor-pointer 
                        ${activityLevel.bg} ${activityLevel.border} border-2
                        flex items-center justify-center relative group
                        ${day.isToday ? 'ring-2 ring-yellow-400/50' : ''}
                        ${hoveredDay?.date === day.date ? 'scale-110 shadow-lg shadow-emerald-500/20' : 'hover:scale-105'}
                      `}
                      onMouseEnter={() => setHoveredDay({
                        date: day.date,
                        value: day.value,
                        dayName: day.fullDate,
                        isWeekend: false
                      })}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <span className={`text-sm font-medium ${
                        day.value > 0 ? 'text-white' : 'text-slate-500'
                      }`}>
                        {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mensaje si no hay días */}
          {monthWorkDays.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No hay días laborables en este mes</p>
            </div>
          )}
        </div>

        {/* Tooltip mejorado */}
        {hoveredDay && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 shadow-2xl z-30 min-w-[220px]">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">
                {hoveredDay.dayName}
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-sm ${getActivityLevel(hoveredDay.value).bg} ${getActivityLevel(hoveredDay.value).border} border`} />
                <p className="text-lg font-bold text-white">
                  {hoveredDay.value} tarea{hoveredDay.value !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-xs text-emerald-400">
                {getActivityLevel(hoveredDay.value).label}
              </p>
              {hoveredDay.value > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {((hoveredDay.value / maxValue) * 100).toFixed(0)}% del máximo del mes
                </p>
              )}
            </div>
          </div>
        )}

        {/* Leyenda elegante */}
        <div className="flex items-center justify-center mt-6 pt-4 border-t border-slate-700/30">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">Menos</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-100/5 border border-slate-700/30 rounded-sm" />
              <div className="w-3 h-3 bg-emerald-900/40 border border-emerald-700/60 rounded-sm" />
              <div className="w-3 h-3 bg-emerald-700/60 border border-emerald-600/80 rounded-sm" />
              <div className="w-3 h-3 bg-emerald-500/80 border border-emerald-500/90 rounded-sm" />
              <div className="w-3 h-3 bg-emerald-400 border border-emerald-400 rounded-sm" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Más</span>
          </div>
        </div>

        {/* Resumen del mes */}
        {totalTasks > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-900/20 to-slate-800/20 rounded-lg border border-emerald-700/30">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              📈 Resumen de {monthName}
            </h4>
            <div className="text-sm text-slate-300">
              <p>
                <span className="font-medium">Productividad:</span> {' '}
                {((activeDays / monthWorkDays.length) * 100) >= 80 ? 
                  '🟢 Excelente mes' : 
                  ((activeDays / monthWorkDays.length) * 100) >= 60 ? 
                  '🟡 Buen mes' : 
                  '🔴 Mes con poco rendimiento'
                } ({activeDays} de {monthWorkDays.length} días activos)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
