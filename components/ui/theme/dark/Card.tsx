/**
 * Dark Card — Component cho Dark Mode
 * Màu sắc đồng bộ từ tokens.ts (bgPrimary: #0B1120, primary: #60a5fa)
 */
import React from 'react';

interface DarkCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hover?: boolean;
}

export const DarkCard: React.FC<DarkCardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hover = false,
}) => {
  const variantClasses = {
    default: 'bg-[#0B1120] border border-[rgba(96,165,250,0.08)] shadow-md',
    elevated: 'bg-[#0f172a] border border-[rgba(255,255,255,0.06)] shadow-lg',
    glass: 'bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-[rgba(255,255,255,0.05)]',
    bordered: 'bg-transparent border border-[rgba(96,165,250,0.12)]',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        rounded-xl transition-all duration-200
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hover ? 'hover:border-[rgba(96,165,250,0.15)] hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const DarkCardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-slate-800/50 rounded-md w-full" />
    ))}
  </div>
);
