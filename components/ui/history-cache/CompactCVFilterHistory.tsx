import React, { useState, useEffect } from 'react';
import { cvFilterHistoryService } from '../../../services/history-cache/analysisHistory';

interface CompactCVFilterHistoryProps {
  className?: string;
}

const CompactCVFilterHistory: React.FC<CompactCVFilterHistoryProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [historyStats, setHistoryStats] = useState({
    totalSessions: 0,
    lastSession: null as string | null,
    thisWeekCount: 0,
    thisMonthCount: 0
  });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  // Check if CV filter history should be shown based on user preference
  const [shouldShow, setShouldShow] = useState(() => {
    const saved = localStorage.getItem('showCVFilterHistory');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('showCVFilterHistory');
      setShouldShow(saved !== null ? JSON.parse(saved) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (isVisible && shouldShow) {
      const stats = cvFilterHistoryService.getHistoryStats();
      setHistoryStats(stats);
      const recent = cvFilterHistoryService.getRecentHistory();
      setRecentHistory(recent);
    }
  }, [isVisible, shouldShow]);

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử lọc CV? Hành động này không thể hoàn tác.')) {
      cvFilterHistoryService.clearHistory();
      setHistoryStats({
        totalSessions: 0,
        lastSession: null,
        thisWeekCount: 0,
        thisMonthCount: 0
      });
      setRecentHistory([]);
    }
  };

  const refreshStats = () => {
    const stats = cvFilterHistoryService.getHistoryStats();
    setHistoryStats(stats);
    const recent = cvFilterHistoryService.getRecentHistory();
    setRecentHistory(recent);
  };

  // Don't render anything if user has disabled analysis history
  if (!shouldShow) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 left-16 w-10 h-10 bg-slate-800/80 hover:bg-slate-700 backdrop-blur border border-slate-600/50 rounded-full flex items-center justify-center text-slate-400 hover:text-green-400 transition-all shadow-lg hover:shadow-green-500/20 z-40 ${className}`}
        title="Hiện lịch sử phân tích"
      >
        <i className="fa-solid fa-clock-rotate-left text-sm"></i>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 left-16 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 min-w-[320px] z-40 shadow-2xl shadow-blue-900/20 ${className}`}>
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left text-green-400"></i>
          Lịch sử Lọc CV
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="w-6 h-6 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-times text-xs"></i>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center bg-slate-800/50 p-2 rounded border border-slate-700/30">
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Tổng lần lọc</div>
            <div className="text-lg font-mono font-bold text-blue-400">
              {historyStats.totalSessions}
            </div>
          </div>
          
          <div className="text-center bg-slate-800/50 p-2 rounded border border-slate-700/30">
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Tuần này</div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {historyStats.thisWeekCount}
            </div>
          </div>
        </div>

        {historyStats.lastSession && (
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Gần nhất:</span>
            <span className="font-mono text-slate-400 text-slate-300 text-[10px]">
              {historyStats.lastSession}
            </span>
          </div>
        )}
      </div>

      {recentHistory.length > 0 && (
        <div className="mt-3 border-t border-slate-700/50 pt-2">
          <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-semibold">Gần đây</div>
          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
            {recentHistory.slice(0, 3).map((entry, index) => (
              <div key={index} className="text-xs flex items-center gap-2 p-1.5 hover:bg-slate-800/50 rounded transition-colors">
                <div className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span className="text-slate-300 truncate block flex-1">
                  {entry.jobPosition || 'Chưa đặt tên'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={refreshStats}
          className="flex-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded border border-slate-600 hover:border-slate-500 transition-all flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-rotate"></i>
          Refresh
        </button>
        
        <button
          onClick={handleClearHistory}
          disabled={historyStats.totalSessions === 0}
          className="flex-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-slate-800 disabled:text-slate-600 text-red-400 hover:text-red-300 text-xs rounded border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-trash"></i>
          Clear
        </button>
      </div>
    </div>
  );
};

export default CompactCVFilterHistory;