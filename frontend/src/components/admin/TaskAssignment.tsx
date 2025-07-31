'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Type, FileText, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { User, Category } from '../../services/admin';
import { adminService } from '../../services/admin';

interface TaskAssignmentProps {
  user: User;
  onClose: () => void;
  onTaskAssigned: () => void;
}

export default function TaskAssignment({ user, onClose, onTaskAssigned }: TaskAssignmentProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await adminService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback a categorías hardcodeadas si hay error
      setCategories([
        { id: '1', name: 'Trabajo', color: '#3b82f6', createdAt: new Date().toISOString() },
        { id: '2', name: 'Personal', color: '#10b981', createdAt: new Date().toISOString() },
        { id: '3', name: 'Estudios', color: '#8b5cf6', createdAt: new Date().toISOString() },
        { id: '4', name: 'Proyecto', color: '#f59e0b', createdAt: new Date().toISOString() },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminService.createTaskForUser(user.id, {
        title,
        description,
        categoryId,
        priority,
        dueDate: dueDate || undefined,
      });
      onTaskAssigned();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al asignar la tarea';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] border-blue-700/30">
        <CardHeader className="bg-gradient-to-r from-[#1a2744] to-[#243658] border-b border-blue-700/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-100 title-highlight">
              Asignar Tarea
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-1 border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-3 mt-2">
            <div className="flex-shrink-0">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-blue-400">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-700/30 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Type className="w-4 h-4 inline mr-1" />
                Título *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la tarea"
                required
                maxLength={100}
                className="bg-blue-900/40 border-blue-600/50 text-blue-100 placeholder-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la tarea (opcional)"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-blue-600/50 rounded-md shadow-sm bg-blue-900/40 text-blue-100 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Categoría *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-blue-600/50 rounded-md shadow-sm bg-blue-900/40 text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="bg-blue-900 text-blue-100">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-blue-900 text-blue-100">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Prioridad *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                required
                className="w-full px-3 py-2 border border-blue-600/50 rounded-md shadow-sm bg-blue-900/40 text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low" className="bg-blue-900 text-blue-100">Baja</option>
                <option value="medium" className="bg-blue-900 text-blue-100">Media</option>
                <option value="high" className="bg-blue-900 text-blue-100">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha límite (opcional)
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-blue-900/40 border-blue-600/50 text-blue-100"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || !title.trim() || !categoryId}
              >
                {loading ? 'Asignando...' : 'Asignar Tarea'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 

