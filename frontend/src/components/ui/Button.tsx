import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-medium rounded-xl
    transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden
    transform-gpu hover:scale-[1.02] active:scale-[0.98]
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 active:bg-blue-800
      text-white shadow-lg hover:shadow-xl shadow-blue-900/25
      focus:ring-blue-500/30 border border-blue-600
    `,
    secondary: `
      bg-slate-800 border-2 border-slate-600
      text-slate-300 hover:bg-slate-700 hover:text-white
      hover:border-slate-500 shadow-md hover:shadow-lg shadow-black/20
      focus:ring-slate-500/30
    `,
    success: `
      bg-green-600 hover:bg-green-700 active:bg-green-800
      text-white shadow-lg hover:shadow-xl shadow-green-900/25
      focus:ring-green-500/30 border border-green-600
    `,
    danger: `
      bg-red-600 hover:bg-red-700 active:bg-red-800
      text-white shadow-lg hover:shadow-xl shadow-red-900/25
      focus:ring-red-500/30 border border-red-600
    `,
    outline: `
      border-2 border-slate-600 bg-transparent
      text-slate-300 hover:bg-slate-800 hover:text-white
      hover:border-slate-500 shadow-sm hover:shadow-md shadow-black/10
      focus:ring-slate-500/30
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm h-9',
    md: 'px-5 py-2.5 text-base h-11',
    lg: 'px-7 py-3 text-lg h-12',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
      <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {leftIcon && (
          <span className="flex-shrink-0 w-5 h-5">
            {leftIcon}
          </span>
        )}
        <span className="font-medium">
          {children}
        </span>
        {rightIcon && (
          <span className="flex-shrink-0 w-5 h-5">
            {rightIcon}
          </span>
        )}
      </div>
    </button>
  );
}; 

