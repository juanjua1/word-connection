'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1e2a4a] to-[#0f1629] rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Confirmar eliminación
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-slate-300 mb-2">
              ¿Estás seguro de que quieres eliminar la tarea?
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-white font-medium">&quot;{taskTitle}&quot;</p>
            </div>
            <p className="text-sm text-slate-400 mt-3">
              Esta acción no se puede deshacer.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar tarea
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
