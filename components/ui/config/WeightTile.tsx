import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { MainCriterion, WeightCriteria } from '../../../assets/types';

interface WeightTileProps {
  criterion: MainCriterion;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  isExpanded: boolean;
  onToggle: () => void;
}

const clampWeight = (value: number) => Math.max(0, Math.min(100, Number.isNaN(value) ? 0 : value));

const WeightTile: React.FC<WeightTileProps> = ({ criterion, setWeights, isExpanded, onToggle }) => {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const total = useMemo(() => {
    return criterion.children?.reduce((sum, child) => sum + child.weight, 0) || 0;
  }, [criterion.children]);

  useEffect(() => {
    if (contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight);
    }
  }, [criterion.children]);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);

  const handleSubChange = (childKey: string, newValue: number) => {
    const safeValue = clampWeight(newValue);
    setWeights((prev) => {
      const newCriterion = { ...prev[criterion.key] };
      if (newCriterion.children) {
        newCriterion.children = newCriterion.children.map((child) =>
          child.key === childKey ? { ...child, weight: safeValue } : child
        );
      }
      return { ...prev, [criterion.key]: newCriterion };
    });
  };

  const getProgressColor = () => {
    if (total >= 35) return 'from-emerald-400 via-emerald-300 to-cyan-300';
    if (total >= 15) return 'from-blue-400 via-cyan-300 to-sky-300';
    return 'from-amber-400 via-orange-300 to-yellow-300';
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-300 hover:border-indigo-500/40 ${
        isExpanded
          ? 'border-indigo-500/50 bg-[#0F172A] shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]'
          : 'border-slate-800/80 bg-slate-900/30'
      }`}
    >
      <button
        type="button"
        className="w-full text-left p-4 flex items-center justify-between gap-3"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isExpanded ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'bg-slate-800/70 text-slate-400'}`}>
              <i className={`${criterion.icon}`}></i>
            </div>
            <div>
              <p className={`text-[13px] font-bold tracking-wide ${isExpanded ? 'text-white' : 'text-slate-300'}`}>{criterion.name}</p>
              <div className="flex items-center gap-2 mt-1">
                 <div className={`h-1.5 w-24 rounded-full overflow-hidden bg-slate-800`}>
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()}`}
                        style={{ width: `${Math.min(total, 100)}%` }}
                    ></div>
                 </div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tổng {total}%</span>
              </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className={`text-xl font-bold tracking-tighter ${total > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{total}</span>
              <span className="text-[10px] text-slate-500 ml-0.5">%</span>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-800/50 text-slate-500'}`}>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
            </div>
        </div>
      </button>

      <div
        className="overflow-hidden transition-[height,opacity] duration-300 ease-in-out"
        style={{ height: isExpanded ? measuredHeight : 0, opacity: isExpanded ? 1 : 0 }}
      >
        <div ref={contentRef} className={`border-t p-4 space-y-4 rounded-b-xl relative border-slate-800/60 bg-slate-900/20`}>
            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>

          {criterion.children?.map((child) => {
            const sliderMax = Math.max(60, child.weight);
            const sliderPercent = (child.weight / sliderMax) * 100;
            return (
              <div key={child.key} className="flex items-center gap-4 p-2.5 rounded-lg border border-transparent hover:border-slate-700/50 hover:bg-slate-800/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                        <p className={`text-[11px] font-bold truncate tracking-wide text-slate-300`}>{child.name}</p>
                        <span className="text-[10px] text-indigo-400 font-medium">{child.weight}%</span>
                    </div>
                    <div className="relative group">
                        <input
                            type="range"
                            min={0}
                            max={sliderMax}
                            value={child.weight}
                            onChange={(e) => handleSubChange(child.key, parseInt(e.target.value, 10))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all z-10 relative"
                            style={{
                            background: `linear-gradient(90deg, rgba(99,102,241,1) ${sliderPercent}%, rgba(30,41,59,1) ${sliderPercent}%)`,
                            }}
                        />
                    </div>
                  </div>
                  <div className="relative">
                      <input
                          type="number"
                          min={0}
                          max={100}
                          value={child.weight}
                          onChange={(e) => handleSubChange(child.key, parseInt(e.target.value, 10))}
                          className={`w-14 rounded-lg border pl-2 pr-4 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none border-slate-700/60 bg-slate-900/60 text-white focus:border-indigo-500/50 focus:bg-[#0B1221]`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none font-bold">%</span>
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeightTile;
