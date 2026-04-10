/**
 * Card — Chỉ hỗ trợ Dark Mode
 */
import React, { ReactNode } from 'react';

interface CardProps {
  variant?: 'default' | 'elevated' | 'bordered' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
  title?: string;
  headerActions?: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  title,
  headerActions,
  className = '',
  onClick,
  hoverable = false
}) => {
  const paddingConfig = {
    none: '', sm: 'p-3', md: 'p-5', lg: 'p-8'
  };

  const variantStyles = {
    default: {
      base: 'bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-md',
      hover: 'hover:shadow-xl hover:-translate-y-1 hover:border-blue-600/50 hover:bg-slate-900/70',
    },
    elevated: {
      base: 'bg-slate-900/70 backdrop-blur-md border border-slate-800/60 shadow-xl shadow-black/20',
      hover: 'hover:shadow-2xl hover:-translate-y-1 hover:border-blue-600/50',
    },
    bordered: {
      base: 'bg-slate-950/80 backdrop-blur-sm border-2 border-blue-600/30 shadow-lg shadow-blue-900/10',
      hover: 'hover:border-blue-500/50 hover:shadow-xl',
    },
    ghost: {
      base: 'bg-transparent border border-transparent',
      hover: '',
    }
  };

  const v = variantStyles[variant];
  const hoverClass = (hoverable || onClick) ? v.hover : '';

  return (
    <div
      className={`
        ${v.base} ${hoverClass}
        rounded-xl transition-all duration-300
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {(title || headerActions) && (
        <div className={`
          flex items-center justify-between
          ${paddingConfig[padding]} ${padding !== 'none' && children ? 'pb-0' : ''}
          border-b border-slate-800/60
        `}>
          {title && (
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
          )}
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      )}

      <div className={`
        ${paddingConfig[padding]}
        ${(title || headerActions) && padding !== 'none' ? 'pt-5' : ''}
      `}>
        {children}
      </div>
    </div>
  );
};

export default Card;
