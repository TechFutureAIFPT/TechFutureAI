import React, { useState, useEffect } from 'react';
import { analysisCacheService } from '../../../services/history-cache/analysisCache';

interface CacheStatsProps {
  isVisible: boolean;
  onToggle: () => void;
}

const CacheStats: React.FC<CacheStatsProps> = ({ isVisible, onToggle }) => {
  const [stats, setStats] = useState({
    size: 0,
    hitRate: 0,
    oldestEntry: 0,
    newestEntry: 0
  });

  useEffect(() => {
    if (isVisible) {
      const currentStats = analysisCacheService.getCacheStats();
      setStats(currentStats);
    }
  }, [isVisible]);

  const handleClearCache = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cache? Điều này sẽ làm chậm các lần phân tích tiếp theo.')) {
      analysisCacheService.clearCache();
      setStats({
        size: 0,
        hitRate: 0,
        oldestEntry: 0,
        newestEntry: 0
      });
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const getCacheSizeColor = (size: number) => {
    if (size < 20) return 'text-green-400';
    if (size < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-40"
        title="Hiện thống kê cache"
      >
        <i className="fa-solid fa-database text-sm"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-xl p-4 min-w-[300px] z-40 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-database text-blue-400"></i>
          Cache Statistics
        </h3>
        <button
          onClick={onToggle}
          className="w-6 h-6 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-times text-xs"></i>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Entries:</span>
          <span className={`font-mono ${getCacheSizeColor(stats.size)}`}>
            {stats.size}/100
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Hit Rate:</span>
          <span className="font-mono text-slate-200">
            {stats.hitRate.toFixed(1)}%
          </span>
        </div>

        {stats.oldestEntry > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Oldest:</span>
            <span className="font-mono text-slate-300 text-xs">
              {formatDate(stats.oldestEntry)}
            </span>
          </div>
        )}

        {stats.newestEntry > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Newest:</span>
            <span className="font-mono text-slate-300 text-xs">
              {formatDate(stats.newestEntry)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setStats(analysisCacheService.getCacheStats())}
          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
        >
          <i className="fa-solid fa-refresh mr-1"></i>
          Refresh
        </button>
        
        <button
          onClick={handleClearCache}
          disabled={stats.size === 0}
          className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs rounded transition-colors"
        >
          <i className="fa-solid fa-trash mr-1"></i>
          Clear
        </button>
      </div>

      {stats.size > 0 && (
        <div className="mt-2 text-xs text-slate-500">
          💡 Cache giúp tăng tốc phân tích cho cùng JD & trọng số
        </div>
      )}
    </div>
  );
};

export default CacheStats;