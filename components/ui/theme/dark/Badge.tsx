/**
 * Dark Badge — Component cho Dark Mode
 * Màu sắc đồng bộ từ tokens.ts
 */
import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
type BadgeSize = 'sm' | 'md';

interface DarkBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-700/40 text-slate-300 border-slate-600/30',
  primary: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  accent: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  primary: 'bg-blue-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-cyan-400',
  accent: 'bg-indigo-400',
};

export const DarkBadge: React.FC<DarkBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
