import React, { useState, useEffect } from 'react';
import { analysisCacheService } from '../../../services/history-cache/analysisCache';
import { cvFilterHistoryService } from '../../../services/history-cache/analysisHistory';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    hitRate: 0,
    oldestEntry: 0,
    newestEntry: 0
  });
  
  const [historyStats, setHistoryStats] = useState({
    totalSessions: 0,
    lastSession: null as string | null,
    thisWeekCount: 0,
    thisMonthCount: 0
  });

  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const currentStats = analysisCacheService.getCacheStats();
      setCacheStats(currentStats);
      
      const currentHistoryStats = cvFilterHistoryService.getHistoryStats();
      setHistoryStats(currentHistoryStats);
      
      const recent = cvFilterHistoryService.getRecentHistory();
      setRecentHistory(recent);
    }
  }, [isOpen]);

  const handleClearCache = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cache? Điều này sẽ làm chậm các lần phân tích tiếp theo.')) {
      analysisCacheService.clearCache();
      setCacheStats({
        size: 0,
        hitRate: 0,
        oldestEntry: 0,
        newestEntry: 0
      });
    }
  };

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
    const currentStats = analysisCacheService.getCacheStats();
    setCacheStats(currentStats);
  };

  const refreshHistoryStats = () => {
    const currentHistoryStats = cvFilterHistoryService.getHistoryStats();
    setHistoryStats(currentHistoryStats);
    const recent = cvFilterHistoryService.getRecentHistory();
    setRecentHistory(recent);
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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-[#0B1120] backdrop-blur-xl border border-slate-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl shadow-blue-900/20 pointer-events-auto transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <i className="fa-solid fa-clock-rotate-left text-blue-400"></i>
              </div>
              Lịch sử & Thống kê
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Cache Statistics Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fa-solid fa-database text-blue-400"></i>
                Cache Hệ Thống
              </h3>
              
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-blue-500/30 transition-colors">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Entries</div>
                    <div className={`text-2xl font-mono font-bold ${getCacheSizeColor(cacheStats.size)}`}>
                      {cacheStats.size}<span className="text-sm text-slate-500 font-normal">/100</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Hit Rate</div>
                    <div className="text-2xl font-mono font-bold text-slate-200">
                      {cacheStats.hitRate.toFixed(1)}<span className="text-sm text-blue-400">%</span>
                    </div>
                  </div>
                </div>

                {(cacheStats.oldestEntry > 0 || cacheStats.newestEntry > 0) && (
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    {cacheStats.oldestEntry > 0 && (
                      <div className="flex justify-between text-sm group">
                        <span className="text-slate-500 group-hover:text-slate-400 transition-colors">Cũ nhất:</span>
                        <span className="text-slate-400 font-mono text-xs">
                          {formatDate(cacheStats.oldestEntry)}
                        </span>
                      </div>
                    )}

                    {cacheStats.newestEntry > 0 && (
                      <div className="flex justify-between text-sm group">
                        <span className="text-slate-500 group-hover:text-slate-400 transition-colors">Mới nhất:</span>
                        <span className="text-slate-400 font-mono text-xs">
                          {formatDate(cacheStats.newestEntry)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={refreshStats}
                    className="flex-1 px-3 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-all border border-slate-600 hover:border-slate-500 flex items-center justify-center gap-2 group"
                  >
                    <i className="fa-solid fa-rotate group-hover:rotate-180 transition-transform duration-500"></i>
                    Làm mới
                  </button>
                  
                  <button
                    onClick={handleClearCache}
                    disabled={cacheStats.size === 0}
                    className="flex-1 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-slate-800 disabled:text-slate-600 text-red-400 hover:text-red-300 text-sm rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    Xóa Cache
                  </button>
                </div>
              </div>
            </div>

            {/* CV Filter History Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-green-400"></i>
                Lịch sử Hoạt động
              </h3>
              
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-green-500/30 transition-colors">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Tổng phiên</div>
                    <div className="text-2xl font-mono font-bold text-blue-400">
                      {historyStats.totalSessions}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Tuần này</div>
                    <div className="text-2xl font-mono font-bold text-emerald-400">
                      {historyStats.thisWeekCount}
                    </div>
                  </div>
                </div>

                {recentHistory.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Gần đây</div>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {recentHistory.slice(0, 8).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors group cursor-default">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                            <span className="text-slate-300 text-sm truncate group-hover:text-blue-300 transition-colors">
                              {entry.jobPosition || 'Chưa đặt tên'}
                            </span>
                          </div>
                          <span className="text-slate-500 text-[10px] whitespace-nowrap ml-2 font-mono">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}) : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={refreshHistoryStats}
                    className="flex-1 px-3 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-all border border-slate-600 hover:border-slate-500 flex items-center justify-center gap-2 group"
                  >
                    <i className="fa-solid fa-rotate group-hover:rotate-180 transition-transform duration-500"></i>
                    Cập nhật
                  </button>
                  
                  <button
                    onClick={handleClearHistory}
                    disabled={historyStats.totalSessions === 0}
                    className="flex-1 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-slate-800 disabled:text-slate-600 text-red-400 hover:text-red-300 text-sm rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    Xóa Lịch sử
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoryModal;