import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  variant = 'default',
  hover = true,
  onClick
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: `
      bg-[#1a2744] 
      border border-slate-700 
      shadow-lg shadow-black/20
    `,
    elevated: `
      bg-[#1a2744] 
      shadow-xl shadow-black/30
      border border-slate-700
    `,
    outlined: `
      bg-[#1a2744] 
      border-2 border-slate-600 
      shadow-md shadow-black/10
    `,
    ghost: `
      bg-slate-900/50 
      border border-slate-800 
      shadow-sm shadow-black/5
    `
  };

  const hoverClasses = hover ? `
    transition-all duration-300 transform-gpu 
    hover:shadow-2xl hover:shadow-black/40 
    hover:-translate-y-1 hover:scale-[1.02] 
    hover:border-slate-600
    cursor-pointer
  ` : 'transition-all duration-200';

  return (
    <div
      className={clsx(
        'rounded-xl overflow-hidden',
        variantClasses[variant],
        hoverClasses,
        paddingClasses[padding],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'px-6 py-4 border-b border-slate-700',
        'bg-slate-900/50',
        'text-white font-semibold',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'p-6 text-slate-300',
        'leading-relaxed space-y-4',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'px-6 py-4 border-t border-slate-700',
        'bg-slate-900/30',
        'flex items-center justify-between gap-3',
        className
      )}
    >
      {children}
    </div>
  );
};
