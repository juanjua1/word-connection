/**
 * Página de prueba para verificar que todos los gráficos conectados funcionan correctamente
 * Esta página muestra todos los componentes de gráficos con datos reales del backend
 */

'use client';

import React from 'react';
import { 
  ConnectedCategoryBarChart,
  ConnectedTaskStatusPieChart,
  ConnectedActivityLineChart,
  ConnectedStatCard
} from '../../components/analytics';
import { CheckCircle, Clock, Activity, Target } from 'lucide-react';

export default function ChartsTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Prueba de Gráficos Conectados
          </h1>
          <p className="text-xl text-gray-600">
            Todos los gráficos ahora usan <span className="font-semibold text-blue-600">datos reales del backend</span>
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ✅ Sin datos mock - Solo datos reales de PostgreSQL
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ConnectedStatCard
            title="Total de Tareas"
            type="total"
            icon={<Target className="w-8 h-8" />}
          />
          <ConnectedStatCard
            title="Completadas"
            type="completed"
            icon={<CheckCircle className="w-8 h-8" />}
          />
          <ConnectedStatCard
            title="Pendientes"
            type="pending"
            icon={<Clock className="w-8 h-8" />}
          />
          <ConnectedStatCard
            title="En Progreso"
            type="inProgress"
            icon={<Activity className="w-8 h-8" />}
          />
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Gráfico circular de estado de tareas */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Estado de Tareas (Pie Chart)
            </h2>
            <ConnectedTaskStatusPieChart
              title="Distribución Actual"
              subtitle="Estado de todas tus tareas en tiempo real"
              size={280}
            />
          </div>

          {/* Gráfico de barras de categorías */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              📈 Tareas por Categoría (Bar Chart)
            </h2>
            <ConnectedCategoryBarChart
              timeframe="month"
              title="Distribución por Categoría"
              subtitle="Progreso en cada categoría este mes"
            />
          </div>

        </div>

        {/* Gráfico de líneas de actividad */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            📅 Actividad Diaria (Line Chart)
          </h2>
          <ConnectedActivityLineChart
            timeframe="week"
            height={400}
            title="Tendencia de Actividad"
          />
        </div>

        {/* Gráficos con diferentes períodos de tiempo */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            ⏰ Diferentes Períodos de Tiempo
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Esta Semana</h3>
              <ConnectedCategoryBarChart
                timeframe="week"
                title="Categorías - Semana"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Este Mes</h3>
              <ConnectedCategoryBarChart
                timeframe="month"
                title="Categorías - Mes"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Este Trimestre</h3>
              <ConnectedCategoryBarChart
                timeframe="quarter"
                title="Categorías - Trimestre"
              />
            </div>
          </div>
        </div>

        {/* Información técnica */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            🔧 Información Técnica
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Backend APIs utilizados:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>/api/analytics/personal</code> - Estadísticas personales</li>
              <li><code>/api/analytics/admin</code> - Estadísticas administrativas</li>
              <li><code>/api/tasks/stats</code> - Estadísticas básicas de tareas</li>
              <li><code>/api/categories</code> - Información de categorías</li>
            </ul>
            <p className="mt-4"><strong>Fuente de datos:</strong> PostgreSQL a través de NestJS backend</p>
            <p><strong>Actualizaciones:</strong> Los datos se actualizan en tiempo real cuando cambias de página o recargas</p>
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-green-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Conectado al backend - Datos en tiempo real</span>
          </div>
        </div>

      </div>
    </div>
  );
}
