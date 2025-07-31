'use client';

import React, { useState, useEffect } from 'react';
import { CategoryBarChart } from './CategoryBarChart';
import { analyticsService } from '../../services/analytics';
import { categoryService } from '../../services/categories';
import { useAuth } from '../../contexts/AuthContext';
import type { Category } from '../../types';
import type { CategoryStats } from '../../types/analytics';

interface CategoryBarData {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  completed: number;
  completionRate: number;
}

interface ConnectedCategoryBarChartProps {
  timeframe?: 'week' | 'month' | 'quarter';
  title?: string;
  subtitle?: string;
}

export const ConnectedCategoryBarChart: React.FC<ConnectedCategoryBarChartProps> = ({
  timeframe = 'month',
  title = "Tareas por Categoría",
  subtitle = "Distribución y progreso por categoría (datos reales)"
}) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<CategoryBarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Fetching category analytics data...');

        // Obtener analytics personales
        const analyticsData = await analyticsService.getPersonalAnalytics(timeframe);
        
        // Obtener todas las categorías para obtener los colores
        const categoriesData = await categoryService.getCategories();
        
        console.log('📊 Analytics data:', analyticsData);
        console.log('🎨 Categories data:', categoriesData);

        // Crear un mapa de colores por categoría
        const categoryColorMap = new Map();
        categoriesData.forEach((cat: Category) => {
          categoryColorMap.set(cat.id, cat.color || '#64748b');
        });

        // Transformar categoryStats del analytics a CategoryBarData
        const transformedData: CategoryBarData[] = (analyticsData.categoryStats || []).map((stat: CategoryStats) => ({
          categoryId: stat.categoryId,
          categoryName: stat.categoryName,
          color: categoryColorMap.get(stat.categoryId) || stat.color || '#64748b',
          total: stat.total,
          completed: stat.completed,
          completionRate: stat.completionRate
        }));

        console.log('✅ Transformed category data:', transformedData);
        setData(transformedData);

      } catch (err) {
        console.error('❌ Error fetching category data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos de categorías');
        
        // En caso de error, mostrar array vacío
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [isAuthenticated, timeframe]);

  if (isLoading) {
    return (
      <div className="bg-[#1a2744] border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Cargando datos de categorías...</p>
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
            <p className="text-red-400 text-sm font-medium">Error al cargar datos</p>
            <p className="text-slate-500 text-xs mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CategoryBarChart 
      data={data} 
      title={title}
      subtitle={subtitle}
    />
  );
};

export default ConnectedCategoryBarChart;
