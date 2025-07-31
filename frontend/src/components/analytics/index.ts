// Componentes de gráficos conectados con datos reales del backend
// Estos componentes reemplazan a los componentes con datos mock

// Gráficos principales
export { ConnectedCategoryBarChart } from './ConnectedCategoryBarChart';
export { ConnectedTaskStatusPieChart, ConnectedPieChart } from './ConnectedPieChart';

// Componentes de Recharts conectados
export { 
  ActivityLineChart as ConnectedActivityLineChart,
  CategoryBarChart as ConnectedCategoryBarChart2,
  StatCard as ConnectedStatCard,
  ChartContainer
} from './ConnectedChartComponents';

// Dashboard principal (ya conectado)
export { EnhancedAnalyticsDashboard } from './EnhancedAnalyticsDashboard';

// Componentes originales (para compatibilidad)
export { CategoryBarChart } from './CategoryBarChart';
export { PieChart, TaskStatsPieChart } from './PieChart';

/**
 * GUÍA DE USO:
 * 
 * En lugar de usar componentes con datos mock, usa estos componentes conectados:
 * 
 * ❌ ANTES (datos mock):
 * import { CategoryBarChart } from './CategoryBarChart';
 * <CategoryBarChart data={mockData} />
 * 
 * ✅ AHORA (datos reales):
 * import { ConnectedCategoryBarChart } from './analytics';
 * <ConnectedCategoryBarChart timeframe="month" />
 * 
 * Ejemplos:
 * 
 * // Gráfico de barras de categorías
 * <ConnectedCategoryBarChart 
 *   timeframe="month" 
 *   title="Mis Categorías"
 * />
 * 
 * // Gráfico circular de estado de tareas
 * <ConnectedTaskStatusPieChart 
 *   title="Estado Actual"
 *   size={300}
 * />
 * 
 * // Gráfico de líneas de actividad
 * <ConnectedActivityLineChart 
 *   timeframe="week"
 *   height={400}
 * />
 * 
 * // Tarjeta de estadística
 * <ConnectedStatCard 
 *   title="Tareas Completadas"
 *   type="completed"
 *   icon={<CheckCircle />}
 * />
 */
