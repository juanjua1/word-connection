 'use client';
 import React from 'react';
 import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'underlined';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputClasses = `
    block w-full text-base font-medium transition-all duration-300
    placeholder:text-blue-300 placeholder:font-normal
    focus:outline-none
  `;

  const variantClasses = {
    default: `
      px-4 py-3 
      bg-blue-900/40 
      border-2 border-blue-400/30 
      rounded-xl shadow-sm 
      text-white 
      hover:border-blue-400/50
      focus:border-blue-400
      focus:ring-4 focus:ring-blue-500/10
    `,
    filled: `
      px-4 py-3 
      bg-blue-900/60 
      border-2 border-transparent 
      rounded-xl 
      text-white 
      hover:bg-blue-900/80
      focus:border-blue-400
      focus:ring-4 focus:ring-blue-500/10
    `,
    underlined: `
      px-0 py-3 
      bg-transparent 
      border-0 border-b-2 border-blue-400/30 
      rounded-none 
      text-white 
      hover:border-blue-400/50
      focus:border-blue-400
    `
  };

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : '';

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-blue-200">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-blue-300">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          id={inputId}
          className={clsx(
            baseInputClasses,
            variantClasses[variant],
            errorClasses,
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-slate-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-slate-400">{helpText}</p>
      )}
    </div>
  );
};

export { Input };
export default Input;
