/**
 * Dark ProgressBar — Component cho Dark Mode
 * Màu sắc đồng bộ từ tokens.ts
 */
import React from 'react';

interface DarkProgressBarProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorClasses = {
  blue: 'bg-gradient-to-r from-blue-500 to-blue-400',
  green: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
  red: 'bg-gradient-to-r from-red-500 to-red-400',
  purple: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
  cyan: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
};

export const DarkProgressBar: React.FC<DarkProgressBarProps> = ({
  value,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  animated = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{label}</span>
          <span className="text-slate-300 font-semibold">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/60 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`
            h-full rounded-full transition-all duration-700 ease-out
            ${colorClasses[color]}
            ${animated ? 'relative overflow-hidden' : ''}
          `}
          style={{ width: `${clampedValue}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
};

/* ======== Dark Circle Progress ======== */
interface DarkCircleProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
  showValue?: boolean;
  className?: string;
}

const circleColors = {
  blue: '#60a5fa',   // tokens.dark.primary
  green: '#10b981',  // tokens.dark.success
  amber: '#f59e0b',  // tokens.dark.warning
  red: '#ef4444',    // tokens.dark.error
  purple: '#818cf8', // tokens.dark.accent
  cyan: '#06b6d4',   // tokens.dark.info
};

export const DarkCircleProgress: React.FC<DarkCircleProgressProps> = ({
  value,
  size = 80,
  strokeWidth = 6,
  color = 'blue',
  showValue = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(30,41,59,0.8)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circleColors[color]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-bold text-slate-200">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
};
