/**
 * Badge — Chỉ hỗ trợ Dark Mode
 */
import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  icon,
  className = '',
  dot = false
}) => {
  const sizeConfig = {
    sm: { text: 'text-xs', padding: 'py-0.5 px-2', dotSize: 'w-1.5 h-1.5', gap: 'gap-1' },
    md: { text: 'text-sm', padding: 'py-1 px-2.5', dotSize: 'w-2 h-2', gap: 'gap-1.5' }
  };

  const variantStyles = {
    success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
    error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
    neutral: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600/30', dot: 'bg-slate-400' },
    primary: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-400' },
  };

  const config = sizeConfig[size];
  const styles = variantStyles[variant];

  if (dot) {
    return (
      <span
        className={`${config.dotSize} ${styles.dot} rounded-full inline-block ${className}`}
        role="status"
        aria-label={typeof children === 'string' ? children : variant}
      />
    );
  }

  return (
    <span
      className={`
        ${config.text} ${config.padding} ${styles.bg} ${styles.text} ${styles.border}
        inline-flex items-center ${config.gap}
        font-medium rounded-full border
        ${className}
      `}
      role="status"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
