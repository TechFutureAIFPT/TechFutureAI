/**
 * ScreenerHeader — Chỉ hỗ trợ Dark Mode
 */
import React from 'react';

interface ScreenerHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
  className?: string;
}

const ScreenerHeader: React.FC<ScreenerHeaderProps> = ({
  title = "Screener",
  subtitle = "JOB DESCRIPTION ANALYTICS",
  icon = "fa-wand-magic-sparkles",
  children,
  className = ""
}) => {
  return (
    <div className={`
      w-full flex flex-col md:flex-row md:items-center justify-between gap-4
      py-2.5 px-6 border-b sticky top-0 z-30
      bg-[#0B1120] border-slate-800/60
      ${className}
    `}>
      <div className="flex items-center gap-3 min-w-max">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg bg-purple-500/10 border-purple-500/20 shadow-purple-500/10">
          <i className={`fa-solid ${icon} text-xl text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-transform group-hover:scale-110`} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-wide leading-tight text-white">
            {title}
          </h2>
          <p className="text-[9px] tracking-[0.2em] font-medium uppercase mt-0.5 text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-3 ml-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default ScreenerHeader;
