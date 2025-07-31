'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  contentClassName?: string;
  headerClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  headerClassName = '',
  contentClassName = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className={`relative bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] rounded-2xl shadow-2xl border border-blue-400/20 ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-blue-400/20 bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] ${headerClassName}`.trim()}>
          <h2 className="text-xl font-semibold text-blue-200 leading-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white hover:bg-blue-700/50 rounded-lg p-2 transition-all duration-200"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className={`max-h-[calc(90vh-120px)] overflow-y-auto bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] ${contentClassName}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
};
