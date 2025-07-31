'use client';

import React from 'react';

interface TextareaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  className = '',
  rows = 4,
  maxLength,
  required = false,
  label,
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-blue-200 mb-2">
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 text-base font-medium leading-relaxed
          bg-blue-900/40 text-white
          border-2 border-blue-400/30
          rounded-xl resize-vertical
          placeholder:text-blue-300 placeholder:font-normal
          focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10
          focus:outline-none transition-all duration-200 ease-in-out
          shadow-sm hover:border-blue-400/50
          disabled:bg-blue-900/20 disabled:text-blue-300 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
            : ''
          }
        `}
      />
      
      {maxLength && (
        <div className="mt-1 text-right">
          <span className={`text-sm font-medium ${
            value.length > maxLength * 0.9 
              ? 'text-orange-400' 
              : 'text-blue-300'
          }`}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm font-medium text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}; 

