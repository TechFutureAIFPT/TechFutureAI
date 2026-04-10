import React, { useState, useEffect } from 'react';
import { analysisCacheService } from '../../../services/history-cache/analysisCache';

interface CompactCacheStatsProps {
  className?: string;
}

const CompactCacheStats: React.FC<CompactCacheStatsProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    size: 0,
    hitRate: 0,
    oldestEntry: 0,
    newestEntry: 0
  });

  // Check if cache stats should be shown based on user preference
  const [shouldShow, setShouldShow] = useState(() => {
    const saved = localStorage.getItem('showCacheStats');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('showCacheStats');
      setShouldShow(saved !== null ? JSON.parse(saved) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case it's changed in same tab
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isVisible && shouldShow) {
      loadStats();
    }
  }, [isVisible, shouldShow]);

  const loadStats = () => {
    const currentStats = analysisCacheService.getCacheStats();
    setStats(currentStats);
  };

  const handleClearCache = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cache? Điều này sẽ làm chậm các lần phân tích tiếp theo.')) {
      analysisCacheService.clearCache();
      loadStats();
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

  // Don't render anything if user has disabled cache stats
  if (!shouldShow) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-16 left-4 w-10 h-10 bg-slate-800/80 hover:bg-slate-700 backdrop-blur border border-slate-600/50 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all shadow-lg hover:shadow-blue-500/20 z-40 ${className}`}
        title="Hiện thống kê cache"
      >
        <i className="fa-solid fa-database text-sm"></i>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-16 left-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 min-w-[300px] z-40 shadow-2xl shadow-blue-900/20 ${className}`}>
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-database text-blue-400"></i>
          Cache Statistics
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="w-6 h-6 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-times text-xs"></i>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/30">
          <span className="text-slate-400">Entries:</span>
          <span className={`font-mono font-bold ${getCacheSizeColor(stats.size)}`}>
            {stats.size}/100
          </span>
        </div>
        
        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/30">
          <span className="text-slate-400">Hit Rate:</span>
          <span className="font-mono font-bold text-blue-400">
            {stats.hitRate.toFixed(1)}%
          </span>
        </div>

        {stats.oldestEntry > 0 && (
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Oldest:</span>
            <span className="font-mono text-slate-400 text-[10px]">
              {formatDate(stats.oldestEntry)}
            </span>
          </div>
        )}

        {stats.newestEntry > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-500">Newest:</span>
            <span className="font-mono text-slate-400 text-[10px]">
              {formatDate(stats.newestEntry)}
            </span>
          </div>
        )}


      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={loadStats}
          className="flex-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded border border-slate-600 hover:border-slate-500 transition-all flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-rotate"></i>
          Refresh
        </button>
        
        <button
          onClick={handleClearCache}
          disabled={stats.size === 0}
          className="flex-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-slate-800 disabled:text-slate-600 text-red-400 hover:text-red-300 text-xs rounded border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-trash"></i>
          Clear
        </button>
      </div>
    </div>
  );
};

export default CompactCacheStats;