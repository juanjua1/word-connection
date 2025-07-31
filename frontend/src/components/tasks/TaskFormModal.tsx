'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import { LoadingOverlay, LoadingSpinner } from '../ui/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { Task, Category, CreateTaskData, UpdateTaskData } from '../../types';
import { taskService } from '../../services/tasks';
import { categoryService } from '../../services/categories';
import { userService, User as UserType } from '../../services/users';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: Task;
}

interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  categoryId: string;
  dueDate: string;
  assignedToUserId: string;
}

interface FormErrors {
  title?: string;
  categoryId?: string;
  dueDate?: string;
  general?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task
}) => {
  const { user } = useAuth();
  const isEditing = !!task;
  const [error, setError] = useState<string>('');

  const handleError = React.useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = React.useCallback(() => {
    setError('');
  }, []);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    categoryId: '',
    dueDate: '',
    assignedToUserId: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        categoryId: task.categoryId || '',
        assignedToUserId: task.assignedToUserId || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
    } else if (isOpen && !task) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        categoryId: '',
        assignedToUserId: '',
        dueDate: ''
      });
      setErrors({});
    }
  }, [isOpen, task]);

  const loadCategories = React.useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      handleError('Error al cargar las categorías');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [handleError]);

  const loadUsers = React.useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      handleError('Error al cargar los usuarios');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [handleError]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (user?.role === 'admin') {
        loadUsers();
      }
      clearError();
    }
  }, [isOpen, user?.role, loadCategories, loadUsers, clearError]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (formData.title.length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    }

    if (formData.dueDate) {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.dueDate = 'La fecha de vencimiento no puede ser anterior a hoy';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      clearError();

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        ...(formData.categoryId && { categoryId: formData.categoryId }),
        dueDate: formData.dueDate || undefined,
        assignedToUserId: formData.assignedToUserId || undefined,
      };

      if (isEditing && task) {
        await taskService.updateTask(task.id, taskData as UpdateTaskData);
      } else {
        await taskService.createTask(taskData as CreateTaskData);
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error saving task:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null && 
        'data' in error.response && typeof error.response.data === 'object' && 
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : isEditing ? 'Error al actualizar la tarea' : 'Error al crear la tarea';
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | React.ChangeEvent<HTMLInputElement>) => {
    const stringValue = typeof value === 'string' ? value : value.target.value;
    setFormData(prev => ({ ...prev, [field]: stringValue }));

    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        categoryId: '',
        dueDate: '',
        assignedToUserId: ''
      });
      setErrors({});
      clearError();
      onClose();
    }
  };

  const priorityOptions = [
    { value: 'low', label: '🟢 Baja' },
    { value: 'medium', label: '🟡 Media' },
    { value: 'high', label: '🟠 Alta' },
    { value: 'urgent', label: '🔴 Urgente' }
  ];

  const categoryOptions = [
    { value: '', label: 'Seleccionar categoría...' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const userOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
      size="lg"
    >
      <div className="relative bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] min-h-full">
        {isLoading && (
          <LoadingOverlay 
            message={isEditing ? 'Actualizando tarea...' : 'Creando tarea...'} 
          />
        )}
        
        {error ? (
          <div className="p-6 bg-gradient-to-br from-[#1a2744] to-[#2a3f5f]">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
              <button 
                onClick={clearError}
                className="mt-2 text-xs text-red-300 hover:text-red-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gradient-to-br from-[#1a2744] to-[#2a3f5f]">
            <div>
              <Input
                label="Título de la tarea"
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                placeholder="   Ej: Completar documentación del proyecto"
                error={errors.title}
                required
                leftIcon={<FileText className="w-4 h-4 text-blue-300" />}
                maxLength={200}
              />
            </div>

            <div>
              <Textarea
                label="Descripción (opcional)"
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Describe los detalles de la tarea..."
                rows={4}
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Prioridad"
                  value={formData.priority}
                  onChange={(value) => handleInputChange('priority', value)}
                  options={priorityOptions}
                  required
                />
              </div>
              
              <div className="relative">
                <Select
                  label="Categoría"
                  value={formData.categoryId}
                  onChange={(value) => handleInputChange('categoryId', value)}
                  options={categoryOptions}
                  error={errors.categoryId}
                />
                {isLoadingCategories && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Fecha de vencimiento (opcional)"
                  type="date"
                  value={formData.dueDate}
                  onChange={(value) => handleInputChange('dueDate', value)}
                  error={errors.dueDate}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {user?.role === 'admin' && (
                <div className="relative">
                  <Select
                    label="Asignar a (opcional)"
                    value={formData.assignedToUserId}
                    onChange={(value) => handleInputChange('assignedToUserId', value)}
                    options={userOptions}
                  />
                  {isLoadingUsers && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.general && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-blue-400/20">
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save className="w-4 h-4" />}
                disabled={isLoading}
                isLoading={isLoading}
                className="sm:order-2"
              >
                {isEditing ? 'Actualizar Tarea' : 'Crear Tarea'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                leftIcon={<X className="w-4 h-4" />}
                className="sm:order-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}; 

