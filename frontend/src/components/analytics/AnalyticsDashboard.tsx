'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { LoadingState } from '../ui/LoadingState';
import { analyticsService } from '../../services/analytics';
import { adminService } from '../../services/admin';
import { AnalyticsData, TimeFrame, SavedTeam } from '../../types/analytics';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle, 
  Users, 
  Award, 
  BarChart3, 
  PieChart, 
  Activity, 
  Plus, 
  User 
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}) => (
  <Card variant="elevated" className="group hover:scale-105 transition-all duration-300 bg-[#0a0a0a] border-slate-700">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-300 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400">
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-xs ${
              trend > 0 ? 'text-green-400' : 
              trend < 0 ? 'text-red-400' : 'text-slate-400'
            }`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}% vs semana anterior
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AnalyticsDashboard: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');

  // Estados específicos para admin
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>>([]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const isAdmin = user?.role === 'admin';

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
  }, [authLoading, isAuthenticated]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar que el usuario esté autenticado
      if (!user) {
        setError('No estás autenticado. Por favor, inicia sesión para ver las estadísticas.');
        return;
      }

      let data: AnalyticsData;
      if (isAdmin) {
        // Para admin, usar el endpoint admin con parámetros opcionales
        const teamUserIds = selectedTeamId 
          ? savedTeams.find(team => team.id === selectedTeamId)?.userIds 
          : undefined;
        
        data = await analyticsService.getAdminAnalytics({
          timeframe,
          targetUserId: selectedUserId || undefined,
          teamUserIds,
        });
      } else {
        // Para usuarios normales, usar endpoint personal
        data = await analyticsService.getPersonalAnalytics(timeframe);
      }

      setAnalyticsData(data);
    } catch (err: unknown) {
      console.error('Error fetching analytics data:', err);
      
      // Manejar diferentes tipos de errores
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 400) {
        setError('Error en la solicitud: ' + (error.response?.data?.message || 'Parámetros inválidos'));
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para acceder a estas estadísticas.');
      } else {
        setError('Error al cargar las estadísticas. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, timeframe, selectedUserId, selectedTeamId, isAdmin, savedTeams]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await adminService.searchUsers({ limit: 100 });
      setAvailableUsers(response.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchSavedTeams = async () => {
    try {
      const teams = await analyticsService.getSavedTeams();
      setSavedTeams(teams);
    } catch (err) {
      console.error('Error fetching saved teams:', err);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || selectedUserIds.length === 0) return;

    try {
      const newTeam = await analyticsService.saveTeam({
        teamName: newTeamName,
        userIds: selectedUserIds,
      });

      setSavedTeams([...savedTeams, newTeam]);
      setNewTeamName('');
      setSelectedUserIds([]);
      setIsCreatingTeam(false);
    } catch (err) {
      console.error('Error creating team:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAnalyticsData();
      if (isAdmin) {
        fetchAvailableUsers();
        fetchSavedTeams();
      }
    }
  }, [fetchAnalyticsData, isAuthenticated, user, isAdmin]);

  const getProductivityLevel = (score: number) => {
    if (score >= 90) return { level: 'Excelente', color: 'text-green-400', bgColor: 'bg-green-900/30' };
    if (score >= 75) return { level: 'Muy Bueno', color: 'text-blue-400', bgColor: 'bg-blue-900/30' };
    if (score >= 60) return { level: 'Bueno', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' };
    return { level: 'Mejorable', color: 'text-red-400', bgColor: 'bg-red-900/30' };
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return <LoadingState message="Verificando autenticación..." />;
  }

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return <LoadingState message="Cargando estadísticas..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Error al cargar estadísticas</h3>
        <p className="text-red-300 mb-4">{error}</p>
        <Button onClick={fetchAnalyticsData} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No hay datos disponibles</h3>
        <p className="text-slate-400 mb-4">No se pudieron cargar las estadísticas.</p>
        <Button onClick={fetchAnalyticsData} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  const { personalStats, categoryStats, dailyActivity, teamStats, selectedUserStats } = analyticsData;
  const statsToShow = selectedUserStats || personalStats;
  const productivityLevel = getProductivityLevel(statsToShow.productivityScore);

  return (
    <div className="space-y-8">
      {/* Header con controles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            📊 Dashboard de Analíticas
          </h1>
          <p className="text-slate-300">
            {selectedUserStats 
              ? `Estadísticas de usuario seleccionado` 
              : `Análisis detallado de tu productividad y rendimiento`
            }
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Selector de período */}
          <Select
            label=""
            value={timeframe}
            onChange={(value) => setTimeframe(value as TimeFrame)}
            options={[
              { value: 'week', label: 'Última semana' },
              { value: 'month', label: 'Último mes' },
              { value: 'quarter', label: 'Último trimestre' },
            ]}
            className="min-w-[150px]"
          />

          {/* Controles específicos para admin */}
          {isAdmin && (
            <>
              <Select
                label=""
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={[
                  { value: '', label: 'Mis estadísticas' },
                  ...availableUsers.map(user => ({
                    value: user.id,
                    label: `${user.firstName} ${user.lastName}`,
                  })),
                ]}
                className="min-w-[200px]"
              />

              <Select
                label=""
                value={selectedTeamId}
                onChange={setSelectedTeamId}
                options={[
                  { value: '', label: 'Sin equipo' },
                  ...savedTeams.map(team => ({
                    value: team.id,
                    label: team.name,
                  })),
                ]}
                className="min-w-[200px]"
              />

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreatingTeam(true)}
              >
                Crear Equipo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Tareas"
          value={statsToShow.total}
          subtitle={`${statsToShow.completionRate}% completadas`}
          icon={Target}
          color="bg-blue-500"
          trend={statsToShow.weeklyTrend}
        />
        <StatCard
          title="Tareas Completadas"
          value={statsToShow.completed}
          subtitle="Este período"
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Tiempo Promedio"
          value={`${statsToShow.averageCompletionTime}d`}
          subtitle="Para completar tareas"
          icon={Clock}
          color="bg-orange-500"
        />
        <StatCard
          title="Score de Productividad"
          value={`${statsToShow.productivityScore}%`}
          subtitle={productivityLevel.level}
          icon={Award}
          color="bg-purple-500"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad diaria */}
        <Card variant="elevated" className="bg-[#0a0a0a] border-slate-700">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Actividad Diaria
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Gráfico de actividad diaria</p>
                <p className="text-sm">({dailyActivity.length} días de datos)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de tareas */}
        <Card variant="elevated" className="bg-[#0a0a0a] border-slate-700">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                Distribución de Tareas
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-300">Completadas</span>
                </div>
                <span className="text-white font-semibold">{statsToShow.completed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-300">En Progreso</span>
                </div>
                <span className="text-white font-semibold">{statsToShow.inProgress}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-slate-300">Pendientes</span>
                </div>
                <span className="text-white font-semibold">{statsToShow.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productividad por categorías */}
        <Card variant="elevated" className="bg-[#0a0a0a] border-slate-700">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Rendimiento por Categorías
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-3">
              {categoryStats.slice(0, 5).map((category) => (
                <div key={category.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{category.categoryName}</span>
                    <span className="text-white font-semibold">{category.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${category.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tendencia de productividad */}
        <Card variant="elevated" className="bg-[#0a0a0a] border-slate-700">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">
                Tendencia de Productividad
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Gráfico de tendencia de productividad</p>
                <p className="text-sm">Score actual: {statsToShow.productivityScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de equipo (solo para admin cuando hay equipo seleccionado) */}
      {isAdmin && teamStats && (
        <Card variant="elevated" className="bg-[#0a0a0a] border-slate-700">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Estadísticas del Equipo: {teamStats.teamName}
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-white">
                  {teamStats.totalTasks}
                </p>
                <p className="text-sm text-slate-400">Total Tareas</p>
              </div>
              <div className="text-center p-4 bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-green-400">
                  {teamStats.completedTasks}
                </p>
                <p className="text-sm text-slate-400">Completadas</p>
              </div>
              <div className="text-center p-4 bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">
                  {teamStats.teamProductivity}%
                </p>
                <p className="text-sm text-slate-400">Productividad</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-white">
                Miembros del Equipo
              </h4>
              {teamStats.users.map((teamUser) => (
                <div 
                  key={teamUser.userId} 
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-white">
                      {teamUser.userName}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-slate-400">
                      {teamUser.stats.completed}/{teamUser.stats.total} tareas
                    </span>
                    <span className="text-blue-400 font-medium">
                      {teamUser.stats.completionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para crear equipo */}
      {isCreatingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4 bg-[#0a0a0a] border-slate-700">
            <CardHeader className="p-6">
              <h3 className="text-lg font-semibold text-white">
                Crear Nuevo Equipo
              </h3>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Ej: Equipo de Desarrollo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Seleccionar Usuarios
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {availableUsers.map((user) => (
                    <label key={user.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds([...selectedUserIds, user.id]);
                          } else {
                            setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-white">
                        {user.firstName} {user.lastName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim() || selectedUserIds.length === 0}
                  className="flex-1"
                >
                  Crear Equipo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingTeam(false);
                    setNewTeamName('');
                    setSelectedUserIds([]);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
