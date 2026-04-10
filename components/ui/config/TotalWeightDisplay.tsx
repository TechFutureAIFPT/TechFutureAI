import React, { useMemo } from 'react';

interface TotalWeightDisplayProps {
  totalWeight: number;
}

const TotalWeightDisplay: React.FC<TotalWeightDisplayProps> = ({ totalWeight }) => {
  const clamped = Math.max(0, Math.min(100, totalWeight));

  const status = useMemo(() => {
    if (totalWeight === 100) {
      return { label: 'Chuẩn', color: 'text-emerald-400', stroke: '#34d399' };
    }
    if (totalWeight > 100) {
      return { label: 'Dư', color: 'text-red-400', stroke: '#f87171' };
    }
    return { label: 'Thiếu', color: 'text-amber-400', stroke: '#fbbf24' };
  }, [totalWeight]);

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border bg-slate-900/40 border-slate-800`}>
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-800"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={status.stroke}
            strokeWidth="3"
            strokeDasharray={`${clamped}, 100`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-white">{totalWeight}%</span>
        </div>
      </div>

      <div className="flex-1">
        <p className={`text-sm font-medium ${status.color} mb-1`}>{status.label}</p>
        <div className={`h-1.5 w-full rounded-full overflow-hidden bg-slate-800`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
                width: `${Math.min(totalWeight, 100)}%`,
                backgroundColor: status.stroke
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TotalWeightDisplay;
