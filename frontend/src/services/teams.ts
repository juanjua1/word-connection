import api from '../lib/api';
import { Team, CreateTeamData, UpdateTeamData, User } from '../types';

export const teamsService = {
  async getTeams(): Promise<Team[]> {
    const response = await api.get('/teams');
    return response.data;
  },

  async getTeam(id: string): Promise<Team> {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  async createTeam(data: CreateTeamData): Promise<Team> {
    const response = await api.post('/teams', data);
    return response.data;
  },

  async updateTeam(id: string, data: UpdateTeamData): Promise<Team> {
    const response = await api.patch(`/teams/${id}`, data);
    return response.data;
  },

  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  },

  async getTeamMembers(id: string): Promise<User[]> {
    const response = await api.get(`/teams/${id}/members`);
    return response.data;
  },

  async addMemberToTeam(teamId: string, userId: string): Promise<Team> {
    const response = await api.post(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },

  async removeMemberFromTeam(teamId: string, userId: string): Promise<Team> {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },
};
