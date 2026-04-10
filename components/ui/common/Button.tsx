/**
 * Button — Chỉ hỗ trợ Dark Mode
 */
import React, { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  const sizeConfig = {
    sm: { padding: 'px-3 py-2', text: 'text-sm', height: 'h-9', iconSize: 'text-sm' },
    md: { padding: 'px-4 py-2.5', text: 'text-base', height: 'h-11', iconSize: 'text-base' },
    lg: { padding: 'px-6 py-3', text: 'text-lg', height: 'h-13', iconSize: 'text-lg' }
  };

  const variantStyles = {
    primary: {
      base: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-500/30',
      focus: 'focus:ring-blue-500/50 focus:ring-offset-slate-900',
    },
    secondary: {
      base: 'bg-gray-700 hover:bg-gray-600 text-white shadow-md',
      focus: 'focus:ring-gray-400/50 focus:ring-offset-slate-900',
    },
    outline: {
      base: 'bg-transparent border-2 border-blue-600 hover:bg-blue-600/10 hover:border-blue-500 text-blue-600 hover:text-blue-500',
      focus: 'focus:ring-blue-500/50 focus:ring-offset-slate-900',
    },
    ghost: {
      base: 'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white border border-transparent',
      focus: 'focus:ring-slate-400/50 focus:ring-offset-slate-900',
    },
    danger: {
      base: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-900/20 hover:shadow-red-500/30',
      focus: 'focus:ring-red-500/50 focus:ring-offset-slate-900',
    },
  };

  const config = sizeConfig[size];
  const v = variantStyles[variant];

  const LoadingSpinner = () => (
    <div className={`
      animate-spin rounded-full border-2 border-white/30 border-t-white
      ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}
    `} />
  );

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`
        ${config.padding} ${config.text} ${config.height}
        ${v.base}
        ${fullWidth ? 'w-full' : ''}
        flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 ${v.focus}
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-[1.02] active:scale-[0.98]
        ${className}
      `}
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className={config.iconSize}>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className={config.iconSize}>{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
