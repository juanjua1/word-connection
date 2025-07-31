'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { CheckCircle, Clock, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';

interface PieChartData {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  subtitle?: string;
  size?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  subtitle,
  size = 200 
}) => {
  const [hoveredSegment, setHoveredSegment] = React.useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Evitar división por cero
  if (total === 0) {
    return (
      <Card className="bg-[#1a2744] border-slate-700">
        <style jsx>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
        <CardHeader className="p-6">
          <div className="flex items-center gap-3">
            <PieChartIcon className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <PieChartIcon className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No hay datos para mostrar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular ángulos para cada segmento
  let currentAngle = -90; // Empezar desde arriba
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    let angle = (item.value / total) * 360;
    
    // Si es el único segmento, usar 360 grados completos
    if (data.length === 1) {
      angle = 359.99; // Usar 359.99 en lugar de 360 para evitar problemas de renderizado
    }
    
    // Asegurar que los ángulos muy pequeños sean visibles (mínimo 3 grados)
    const minAngle = data.length > 1 ? 3 : angle;
    const adjustedAngle = Math.max(angle, minAngle);
    
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + adjustedAngle,
      originalAngle: angle,
      isOnlySegment: data.length === 1,
    };
    currentAngle += adjustedAngle;
    return segment;
  });

  // Función para crear el path SVG de cada segmento
  const createPath = (startAngle: number, endAngle: number, radius: number, innerRadius: number = 0, isOnlySegment: boolean = false) => {
    // Si es el único segmento, crear un círculo completo usando dos arcos
    if (isOnlySegment) {
      return [
        `M 0 ${-radius}`, // Mover al punto superior
        `A ${radius} ${radius} 0 1 1 0 ${radius}`, // Primer semicírculo
        `A ${radius} ${radius} 0 1 1 0 ${-radius}`, // Segundo semicírculo
        `M 0 ${-innerRadius}`, // Mover al punto superior del círculo interior
        `A ${innerRadius} ${innerRadius} 0 1 0 0 ${innerRadius}`, // Primer semicírculo interior (dirección opuesta)
        `A ${innerRadius} ${innerRadius} 0 1 0 0 ${-innerRadius}`, // Segundo semicírculo interior
        'Z' // Cerrar el path
      ].join(' ');
    }

    // Convertir ángulos a radianes y normalizar
    const startAngleRad = ((startAngle % 360) * Math.PI) / 180;
    const endAngleRad = ((endAngle % 360) * Math.PI) / 180;
    
    // Calcular puntos
    const x1 = Math.cos(startAngleRad) * radius;
    const y1 = Math.sin(startAngleRad) * radius;
    const x2 = Math.cos(endAngleRad) * radius;
    const y2 = Math.sin(endAngleRad) * radius;
    
    const x3 = Math.cos(endAngleRad) * innerRadius;
    const y3 = Math.sin(endAngleRad) * innerRadius;
    const x4 = Math.cos(startAngleRad) * innerRadius;
    const y4 = Math.sin(startAngleRad) * innerRadius;

    // Determinar si es un arco grande
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    // Crear el path
    const pathData = [
      `M ${x1} ${y1}`, // Mover al punto inicial del arco exterior
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arco exterior
      `L ${x3} ${y3}`, // Línea al arco interior
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`, // Arco interior
      'Z' // Cerrar el path
    ].join(' ');

    return pathData;
  };

  const radius = size / 2 - 15; // Más margen para evitar cortes
  const innerRadius = radius * 0.55; // Ajustar proporción del donut
  const viewBoxSize = size;

  return (
    <Card className="bg-[#1a2744] border-slate-700">
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <CardHeader className="p-6">
        <div className="flex items-center gap-3">
          <PieChartIcon className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Gráfico SVG */}
          <div className="relative">
            <svg 
              width={viewBoxSize} 
              height={viewBoxSize} 
              viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              className="overflow-visible drop-shadow-lg"
              style={{ background: 'transparent' }}
            >
              <g transform={`translate(${viewBoxSize/2}, ${viewBoxSize/2})`}>
                {segments.map((segment, index) => (
                  <g key={index}>
                    <path
                      d={createPath(segment.startAngle, segment.endAngle, radius, innerRadius, segment.isOnlySegment)}
                      fill={segment.color}
                      className="transition-all duration-500 hover:brightness-110 cursor-pointer"
                      style={{
                        transformOrigin: 'center',
                        animation: `fadeInScale 0.8s ease-out ${index * 0.1}s both`,
                        opacity: hoveredSegment === null || hoveredSegment === index ? 1 : 0.7,
                        stroke: '#0a0a0a',
                        strokeWidth: '2px'
                      }}
                      onMouseEnter={() => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  </g>
                ))}
              </g>
            </svg>
            
            {/* Texto central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {hoveredSegment !== null ? (
                <>
                  <span className="text-2xl font-bold text-white">
                    {segments[hoveredSegment].value}
                  </span>
                  <span className="text-sm text-slate-400">
                    {segments[hoveredSegment].label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {segments[hoveredSegment].percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-white">{total}</span>
                  <span className="text-sm text-slate-400">Total Tareas</span>
                </>
              )}
            </div>
          </div>

          {/* Leyenda */}
          <div className="space-y-4 flex-1 min-w-0">
            {segments.map((segment, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                  hoveredSegment === index 
                    ? 'bg-slate-700/50 scale-105 shadow-lg' 
                    : 'bg-slate-800/30 hover:bg-slate-800/50'
                }`}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <segment.icon className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {segment.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {segment.percentage.toFixed(1)}% del total
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-bold text-white">
                    {segment.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {segments.map((segment, index) => (
            <div key={index} className="text-center p-3 bg-slate-800/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <segment.icon className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-medium text-slate-300">
                  {segment.label}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold text-white">
                  {segment.value}
                </span>
                <span className="text-sm text-slate-400">
                  ({segment.percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente específico para estadísticas de tareas
interface TaskStatsPieChartProps {
  completed: number;
  pending: number;
  overdue: number;
}

export const TaskStatsPieChart: React.FC<TaskStatsPieChartProps> = ({
  completed,
  pending,
  overdue
}) => {
  const data: PieChartData[] = [
    {
      label: 'Completadas',
      value: completed,
      color: '#10b981', // green-500
      icon: CheckCircle,
    },
    {
      label: 'Pendientes',
      value: pending,
      color: '#f59e0b', // amber-500
      icon: Clock,
    },
    {
      label: 'En Progreso',
      value: overdue,
      color: '#3b82f6', // blue-500
      icon: AlertTriangle,
    },
  ].filter(item => item.value > 0); // Solo mostrar segmentos con valores > 0

  return (
    <PieChart
      data={data}
      title="Distribución de Tareas"
      subtitle="Estado actual de todas tus tareas"
      size={240}
    />
  );
};
