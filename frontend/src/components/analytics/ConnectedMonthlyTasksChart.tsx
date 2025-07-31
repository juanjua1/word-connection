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
import { analyticsService } from '../../services/analytics';
import { useAuth } from '../../contexts/AuthContext';
import { TimeFrame } from '../../types/analytics';

interface MonthlyData {
  month: string;
  count: number;
}

export const ConnectedMonthlyTasksChart: React.FC<{ timeframe?: TimeFrame }> = ({ timeframe = 'month' }) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await analyticsService.getPersonalAnalytics(timeframe);
        // Agrupar dailyActivity.created por mes-año
        const map = new Map<string, number>();
        result.dailyActivity.forEach(({ date, created }) => {
          const d = new Date(date);
          const label = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
          map.set(label, (map.get(label) || 0) + created);
        });
        // Convertir y ordenar
        const grouped = Array.from(map.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => {
            const [mA, yA] = a.month.split(' ');
            const [mB, yB] = b.month.split(' ');
            return new Date(`${mA} 1, ${yA}`).getTime() - new Date(`${mB} 1, ${yB}`).getTime();
          });
        setData(grouped);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Error al cargar tareas creadas por mes');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, timeframe]);

  if (isLoading) {
    return (
      <Card className="bg-[#1a2744] border-slate-700/50">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#1a2744] border border-red-500/30 rounded-lg p-6">
        <p className="text-red-400">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a2744] border-slate-700/50">
      <CardHeader className="p-6 pb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Tareas Creadas por Mes
        </h3>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
