'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { BarChart3, TrendingUp } from 'lucide-react';

interface CategoryBarData {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  completed: number;
  completionRate: number;
}

interface CategoryBarChartProps {
  data: CategoryBarData[];
  title?: string;
  subtitle?: string;
  maxHeight?: number;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data,
  title = "Tareas por Categoría",
  subtitle = "Distribución y progreso por categoría",
  maxHeight = 200
}) => {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
        <CardHeader className="p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-blue-100">{title}</h3>
              {subtitle && <p className="text-sm text-blue-300">{subtitle}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No hay datos de categorías para mostrar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...data.map(item => item.total), 1);

  return (
    <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: var(--target-width);
            opacity: 1;
          }
        }
        @keyframes slideInFromRight {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: var(--target-width);
            opacity: 1;
          }
        }
      `}</style>
      
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-blue-100">{title}</h3>
              {subtitle && <p className="text-sm text-blue-300">{subtitle}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Total de categorías</p>
            <p className="text-lg font-bold text-white">{data.length}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="space-y-6">
          {data.map((category, index) => {
            const totalWidthPercentage = (category.total / maxTotal) * 100;
            const completedWidthPercentage = (category.completed / maxTotal) * 100;
            const pendingCount = category.total - category.completed;

            return (
              <div key={category.categoryId} className="space-y-3">
                {/* Header de la categoría */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <h4 className="font-medium text-white truncate">
                      {category.categoryName}
                    </h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {category.total}
                    </span>
                    <span className="text-sm text-slate-400 ml-1">tareas</span>
                  </div>
                </div>

                {/* Barra de progreso doble */}
                <div className="relative">
                  {/* Barra de fondo (total) */}
                  <div className="w-full h-8 bg-slate-800 rounded-lg overflow-hidden relative">
                    {/* Barra total */}
                    <div
                      className="h-full bg-slate-700 rounded-lg transition-all duration-1000 ease-out"
                      style={{
                        width: `${totalWidthPercentage}%`,
                        animation: `slideInFromLeft 1s ease-out ${index * 0.1}s both`,
                        '--target-width': `${totalWidthPercentage}%`
                      } as React.CSSProperties}
                    />
                    
                    {/* Barra completadas (encima) */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-lg transition-all duration-1000 ease-out"
                      style={{
                        backgroundColor: category.color,
                        width: `${completedWidthPercentage}%`,
                        animation: `slideInFromLeft 1.2s ease-out ${index * 0.1 + 0.2}s both`,
                        '--target-width': `${completedWidthPercentage}%`
                      } as React.CSSProperties}
                    />

                    {/* Texto dentro de la barra */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {category.completionRate}% completado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estadísticas detalladas */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-800/30 rounded-lg">
                    <p className="text-xs text-slate-400">Completadas</p>
                    <p className="text-sm font-bold text-green-400">
                      {category.completed}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-800/30 rounded-lg">
                    <p className="text-xs text-slate-400">Pendientes</p>
                    <p className="text-sm font-bold text-yellow-400">
                      {pendingCount}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-800/30 rounded-lg">
                    <p className="text-xs text-slate-400">Eficiencia</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className={`text-sm font-bold ${
                        category.completionRate >= 80 ? 'text-green-400' :
                        category.completionRate >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {category.completionRate}%
                      </p>
                      {category.completionRate >= 80 && (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen final */}
        {data.length > 1 && (
          <div className="mt-8 p-4 bg-slate-800/20 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Resumen General
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-400">Total Tareas</p>
                <p className="text-lg font-bold text-white">
                  {data.reduce((sum, cat) => sum + cat.total, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Completadas</p>
                <p className="text-lg font-bold text-green-400">
                  {data.reduce((sum, cat) => sum + cat.completed, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Promedio Eficiencia</p>
                <p className="text-lg font-bold text-blue-400">
                  {Math.round(
                    data.reduce((sum, cat) => sum + cat.completionRate, 0) / data.length
                  )}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Mejor Categoría</p>
                <p className="text-sm font-bold text-purple-400 truncate">
                  {data.reduce((best, cat) => 
                    cat.completionRate > best.completionRate ? cat : best
                  ).categoryName}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de prueba
export const CategoryBarChartTest: React.FC = () => {
  const testData: CategoryBarData[] = [
    {
      categoryId: '1',
      categoryName: 'Trabajo',
      color: '#3b82f6',
      total: 25,
      completed: 20,
      completionRate: 80
    },
    {
      categoryId: '2',
      categoryName: 'Personal',
      color: '#10b981',
      total: 15,
      completed: 12,
      completionRate: 80
    },
    {
      categoryId: '3',
      categoryName: 'Estudios',
      color: '#8b5cf6',
      total: 10,
      completed: 6,
      completionRate: 60
    },
    {
      categoryId: '4',
      categoryName: 'Proyecto',
      color: '#f59e0b',
      total: 8,
      completed: 2,
      completionRate: 25
    }
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-[#0f1629] to-[#1e2a4a] min-h-screen">
      <h1 className="text-blue-100 text-2xl mb-8">Prueba del Gráfico de Barras</h1>
      <CategoryBarChart data={testData} />
    </div>
  );
};
