/**
 * Dark ThemeToggle — Chỉ hiển thị biểu tượng Dark Mode
 * Không còn chức năng chuyển đổi vì chỉ hỗ trợ Dark Mode
 */
import React from 'react';

interface DarkThemeToggleProps {
  variant?: 'button' | 'switch' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const DarkThemeToggle: React.FC<DarkThemeToggleProps> = ({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  // ===== Icon only (mặc định) =====
  if (variant === 'icon') {
    const sizeClasses = {
      sm: 'w-7 h-7',
      md: 'w-9 h-9',
      lg: 'w-11 h-11',
    };

    return (
      <div
        className={`
          ${sizeClasses[size]}
          rounded-xl bg-amber-500/10 border border-amber-500/20
          flex items-center justify-center
          text-amber-400
          ${className}
        `}
        title="Dark Mode"
      >
        <i className="fa-solid fa-moon text-sm" />
      </div>
    );
  }

  // ===== Button =====
  if (variant === 'button') {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2',
    };

    return (
      <div
        className={`
          inline-flex items-center font-medium rounded-xl
          bg-amber-500/10 text-amber-400 border border-amber-500/20
          ${sizeClasses[size]}
          ${className}
        `}
      >
        <i className="fa-solid fa-moon text-xs" />
        {showLabel && <span>Dark Mode</span>}
      </div>
    );
  }

  // ===== Switch =====
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      title="Dark Mode"
    >
      <div className="w-7 h-7 rounded-md border bg-amber-500/10 border-amber-500/20 flex items-center justify-center text-amber-400">
        <i className="fa-solid fa-moon text-xs" />
      </div>

      <div className="w-9 h-5 rounded-full bg-blue-500/60 relative">
        <div className="absolute top-0.5 left-[22px] w-4 h-4 rounded-full bg-white shadow" />
      </div>

      {showLabel && (
        <span className="text-sm font-medium text-slate-300">
          Dark
        </span>
      )}
    </div>
  );
};
