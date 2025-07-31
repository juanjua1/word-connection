'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import { Plus, Users, Edit, Trash2, UserPlus, UserMinus, Palette } from 'lucide-react';
import { teamsService } from '../../services/teams';
import { adminService } from '../../services/admin';
import { Team, CreateTeamData } from '../../types';

interface TeamManagementProps {
  onTeamSelect?: (teamId: string) => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
  '#ec4899', '#6366f1', '#14b8a6', '#eab308'
];

export const TeamManagement: React.FC<TeamManagementProps> = ({ onTeamSelect }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  }[]>([]);
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    description: '',
    color: PRESET_COLORS[0],
    memberIds: [],
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchAvailableUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const teamsData = await teamsService.getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Error al cargar los equipos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await adminService.searchUsers({ limit: 100 });
      setAvailableUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTeam = () => {
    setIsEditMode(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      color: PRESET_COLORS[0],
      memberIds: [],
    });
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setIsEditMode(true);
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      color: team.color,
      memberIds: team.memberIds || [],
    });
    setIsModalOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isEditMode && editingTeam) {
        await teamsService.updateTeam(editingTeam.id, formData);
      } else {
        await teamsService.createTeam(formData);
      }
      setIsModalOpen(false);
      fetchTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      setError('Error al guardar el equipo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    try {
      await teamsService.deleteTeam(teamToDelete.id);
      setIsDeleteModalOpen(false);
      setTeamToDelete(null);
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Error al eliminar el equipo');
    }
  };

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds?.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...(prev.memberIds || []), userId]
    }));
  };

  const getMemberNames = (memberIds: string[]): string => {
    if (!memberIds || memberIds.length === 0) return 'Sin miembros';
    
    const memberNames = memberIds
      .map(id => {
        const user = availableUsers.find(u => u.id === id);
        return user ? `${user.firstName} ${user.lastName}` : 'Usuario desconocido';
      })
      .slice(0, 3);
    
    if (memberIds.length > 3) {
      memberNames.push(`+${memberIds.length - 3} más`);
    }
    
    return memberNames.join(', ');
  };

  // Solo admins pueden ver este componente
  if (user?.role !== 'admin') {
    return (
      <Card className="bg-[#1a2744] border-slate-700">
        <CardContent className="py-8 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Gestión de Equipos
          </h3>
          <p className="text-slate-400">
            Solo los administradores pueden gestionar equipos.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1a2744] border-slate-700">
        <CardContent className="py-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando equipos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Equipos</h2>
          <p className="text-slate-300">Administra los equipos y sus miembros</p>
        </div>
        <Button onClick={handleCreateTeam} leftIcon={<Plus className="w-4 h-4" />}>
          Crear Equipo
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="bg-[#1a2744] border-slate-700">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No tienes equipos creados
            </h3>
            <p className="text-slate-400 mb-6">
              Crea tu primer equipo para organizar mejor las tareas
            </p>
            <Button onClick={handleCreateTeam} leftIcon={<Plus className="w-4 h-4" />}>
              Crear Primer Equipo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="bg-[#1a2744] border-slate-700 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: team.color }} 
                    />
                    <h3 className="font-semibold text-white">{team.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditTeam(team)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteTeam(team)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-slate-300 mt-2">{team.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-sm text-slate-400 mb-2">
                      <Users className="w-4 h-4 mr-1" />
                      Miembros ({team.memberIds?.length || 0})
                    </div>
                    <p className="text-sm text-slate-200">
                      {getMemberNames(team.memberIds || [])}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-700">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => onTeamSelect?.(team.id)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Team Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? 'Editar Equipo' : 'Crear Nuevo Equipo'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del equipo *
            </label>
            <Input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Equipo de Desarrollo"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción
            </label>
            <Textarea 
              value={formData.description || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Descripción del equipo..."
              rows={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color del equipo
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? 'border-blue-400 scale-110'
                      : 'border-slate-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <UserPlus className="w-4 h-4 inline mr-1" />
              Miembros del equipo
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-600 rounded-md bg-[#1a2744]">
              {availableUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 border-b border-slate-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-400">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMember(user.id)}
                    className={`p-1 rounded transition-colors ${
                      formData.memberIds?.includes(user.id)
                        ? 'text-green-400 hover:text-green-300'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {formData.memberIds?.includes(user.id) ? (
                      <UserMinus className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Seleccionados: {formData.memberIds?.length || 0} miembros
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Equipo')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Estás seguro de que quieres eliminar el equipo &ldquo;<strong>{teamToDelete?.name}</strong>&rdquo;?
          </p>
          <p className="text-sm text-slate-400">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Eliminar Equipo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 

