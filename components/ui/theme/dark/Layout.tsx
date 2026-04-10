/**
 * Dark Layout Components — Container, Section, Divider cho Dark Mode
 */
import React from 'react';

/* ======== Dark Section ======== */
interface DarkSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glow' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const variantClasses = {
  default: 'bg-[#0B1120]',
  gradient: 'bg-gradient-to-b from-[#0f172a] to-[#0B1120]',
  glow: 'bg-[#0B1120] relative overflow-hidden',
  flat: '',
};

const paddingClasses = {
  none: '',
  sm: 'py-4 px-4',
  md: 'py-8 px-6',
  lg: 'py-12 px-8',
  xl: 'py-20 px-10',
};

export const DarkSection: React.FC<DarkSectionProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
}) => {
  return (
    <section
      className={`
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {variant === 'glow' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
};

/* ======== Dark Container ======== */
interface DarkContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[80rem]',
  full: 'max-w-full',
};

export const DarkContainer: React.FC<DarkContainerProps> = ({
  children,
  className = '',
  maxWidth = 'lg',
}) => {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  );
};

/* ======== Dark Divider ======== */
interface DarkDividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

export const DarkDivider: React.FC<DarkDividerProps> = ({
  orientation = 'horizontal',
  className = '',
  label,
}) => {
  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex-1 h-px bg-slate-800/60" />
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-slate-800/60" />
      </div>
    );
  }

  if (orientation === 'vertical') {
    return <div className={`w-px bg-slate-800/60 self-stretch ${className}`} />;
  }

  return <div className={`h-px bg-slate-800/60 ${className}`} />;
};

/* ======== Dark Stack (flex column) ======== */
interface DarkStackProps {
  children: React.ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export const DarkStack: React.FC<DarkStackProps> = ({
  children,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}>
      {children}
    </div>
  );
};

/* ======== Dark Grid ======== */
interface DarkGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const colsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

const gridGapClasses = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-5',
  lg: 'gap-8',
};

export const DarkGrid: React.FC<DarkGridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  className = '',
}) => {
  return (
    <div className={`grid ${colsClasses[cols]} ${gridGapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};
