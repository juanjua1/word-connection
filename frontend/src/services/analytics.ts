import api from '../lib/api';
import { 
  AnalyticsData, 
  SavedTeam, 
  TimeFrame 
} from '../types/analytics';

export interface GetAnalyticsParams {
  timeframe?: TimeFrame;
  targetUserId?: string;
  teamUserIds?: string[];
}

export interface SaveTeamData {
  teamName: string;
  userIds: string[];
}

export const analyticsService = {
  // Obtener estadísticas personales
  async getPersonalAnalytics(timeframe: TimeFrame = 'week'): Promise<AnalyticsData> {
    const response = await api.get('/analytics/personal', {
      params: { timeframe }
    });
    return response.data;
  },

  // Obtener estadísticas de admin (incluye estadísticas personales + opcionales de usuarios/equipos)
  async getAdminAnalytics(params: GetAnalyticsParams): Promise<AnalyticsData> {
    // Preparar los parámetros de manera que sean compatibles con el backend
    const queryParams: Record<string, string | string[]> = {
      timeframe: params.timeframe || 'week',
    };

    if (params.targetUserId) {
      queryParams.targetUserId = params.targetUserId;
    }

    if (params.teamUserIds && params.teamUserIds.length > 0) {
      queryParams.teamUserIds = params.teamUserIds;
    }

    const response = await api.get('/analytics/admin', {
      params: queryParams,
      paramsSerializer: (params) => {
        // Serializar manualmente para evitar el problema de teamUserIds[]
        const searchParams = new URLSearchParams();
        
        Object.keys(params).forEach(key => {
          const value = params[key];
          if (Array.isArray(value)) {
            // Para arrays, agregar cada elemento por separado sin []
            value.forEach(item => {
              searchParams.append(key, item);
            });
          } else if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        
        return searchParams.toString();
      }
    });
    return response.data;
  },

  // Guardar un equipo (solo admin)
  async saveTeam(teamData: SaveTeamData): Promise<SavedTeam> {
    const response = await api.post('/analytics/admin/teams', teamData);
    return response.data;
  },

  // Obtener equipos guardados (solo admin)
  async getSavedTeams(): Promise<SavedTeam[]> {
    const response = await api.get('/analytics/admin/teams');
    return response.data;
  },
};
