import api from '../lib/api';

export interface EnhancedAnalyticsData {
  productivity: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    insights: string[];
  };
  consistency: {
    score: number;
    streak: number;
    weeklyPattern: Record<string, number>;
  };
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    completionRate: number;
    averageTime: number;
    taskCount: number;
  }>;
  weeklyStats: Array<{
    date: string;
    completed: number;
    created: number;
    productivity: number;
  }>;
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface AnalyticsParams {
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

class EnhancedAnalyticsService {
  async getEnhancedAnalytics(params: AnalyticsParams = {}): Promise<EnhancedAnalyticsData> {
    const queryParams = new URLSearchParams();
    
    if (params.timeframe) {
      queryParams.append('timeframe', params.timeframe);
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    
    const response = await api.get(`/analytics/enhanced?${queryParams.toString()}`);
    return response.data;
  }

  async getProductivityInsights(): Promise<Array<{
    type: 'tip' | 'warning' | 'achievement';
    message: string;
    data?: Record<string, unknown>;
  }>> {
    const response = await api.get('/analytics/insights');
    return response.data;
  }

  async getTimeAnalytics(timeframe: string = 'week'): Promise<{
    dailyActivity: Array<{ date: string; count: number; }>;
    hourlyDistribution: Array<{ hour: number; count: number; }>;
    peakHours: number[];
  }> {
    const response = await api.get(`/analytics/time?timeframe=${timeframe}`);
    return response.data;
  }

  async getCategoryTrends(): Promise<Array<{
    categoryId: string;
    categoryName: string;
    trend: 'up' | 'down' | 'stable';
    completionRate: number;
    avgTasksPerWeek: number;
  }>> {
    const response = await api.get('/analytics/categories/trends');
    return response.data;
  }
}

export const enhancedAnalyticsService = new EnhancedAnalyticsService();
