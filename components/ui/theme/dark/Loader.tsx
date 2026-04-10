/**
 * Dark Loader — Component cho Dark Mode
 */
import React from 'react';

interface DarkLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-[2px]',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export const DarkLoader: React.FC<DarkLoaderProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-slate-700/50 border-t-blue-400 rounded-full
          animate-spin
        `}
      />
      {text && (
        <p className="text-sm text-slate-400 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B1120]/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/* ======== Dark Skeleton ======== */
interface DarkSkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const roundedClasses = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

export const DarkSkeleton: React.FC<DarkSkeletonProps> = ({
  width,
  height = '1rem',
  rounded = 'md',
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-800/50 animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
};

/* ======== Dark Dots Loader ======== */
interface DarkDotsLoaderProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const DarkDotsLoader: React.FC<DarkDotsLoaderProps> = ({
  count = 3,
  size = 'md',
  color = 'bg-blue-400',
  className = '',
}) => {
  const dotSizes = { sm: 'w-1 h-1', md: 'w-2 h-2', lg: 'w-3 h-3' };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${dotSizes[size]} ${color} rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};
