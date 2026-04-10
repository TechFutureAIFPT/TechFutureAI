import React, { useEffect, useState, useCallback } from 'react';
import { fetchRecentHistory, fetchManualHistory } from '../../../services/history-cache/historyService';
import type { HistoryEntry } from '../../../assets/types';

interface HistoryPageProps { userEmail?: string; onRestore?: (payload: any) => void; }

const TIME_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: '24h', label: '24 giờ' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
] as const;

const HistoryPage: React.FC<HistoryPageProps> = ({ userEmail, onRestore }) => {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const [autoHistory, manualHistory] = await Promise.all([
        fetchRecentHistory(50, userEmail),
        fetchManualHistory(userEmail)
      ]);
      const merged = [...manualHistory.map(h => ({ ...h, id: `manual-${h.id}` })), ...autoHistory]
        .sort((a, b) => b.timestamp - a.timestamp);
      setItems(merged);
    } catch {
      setError('Không tải được lịch sử. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleRefresh = async () => { setRefreshing(true); await loadHistory(); };

  const filtered = items.filter(it => {
    if (timeFilter === 'all') return true;
    const diff = Date.now() - it.timestamp;
    if (timeFilter === '24h') return diff <= 86400000;
    if (timeFilter === '7d') return diff <= 604800000;
    if (timeFilter === '30d') return diff <= 2592000000;
    return true;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-4"></div>
      <p className="text-slate-500 text-sm">Đang tải lịch sử...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
        <i className="fa-solid fa-circle-exclamation text-2xl text-red-400"></i>
      </div>
      <p className="text-red-400 font-medium mb-4">{error}</p>
      <button onClick={handleRefresh} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all">
        Thử lại
      </button>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <i className="fa-solid fa-clock-rotate-left text-cyan-400 text-sm"></i>
            </div>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase font-medium">Lịch sử</span>
          </div>
          <h1 className="text-2xl font-black text-white">Lịch sử phân tích</h1>
          <p className="text-xs text-slate-500 mt-0.5">Xem lại và quản lý các phiên phân tích CV trước đây</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time filter tabs */}
          <div className="flex bg-[#0B1628] p-1 rounded-xl border border-slate-800/60">
            {TIME_FILTERS.map(tf => (
              <button
                key={tf.key}
                onClick={() => setTimeFilter(tf.key as typeof timeFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeFilter === tf.key
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl border border-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center"
          >
            <i className={`fa-solid fa-rotate ${refreshing ? 'animate-spin' : ''} text-sm`}></i>
          </button>
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500">
          Hiển thị <span className="font-bold text-slate-300">{filtered.length}</span> phiên phân tích
        </p>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-24 bg-[#0B1628]/40 rounded-2xl border border-slate-800/60 border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-box-open text-2xl text-slate-600"></i>
          </div>
          <p className="text-slate-400 font-medium mb-3">Không có phiên phân tích nào</p>
          <button onClick={() => setTimeFilter('all')} className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
            Xem tất cả
          </button>
        </div>
      )}

      {/* ── History Grid ─────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className="group bg-[#0B1628] border border-slate-800/60 hover:border-cyan-500/30 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-cyan-900/10"
            onClick={() => setSelected(item)}
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="font-bold text-slate-200 text-base truncate group-hover:text-cyan-300 transition-colors">
                  {item.jobPosition || 'Chức danh chưa đặt'}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-full">
                    <i className="fa-regular fa-clock text-[9px]"></i>
                    {new Date(item.timestamp).toLocaleString('vi-VN')}
                  </span>
                  {item.id.startsWith('manual-') && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                      Thủ công
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-all flex-shrink-0">
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </div>
            </div>

            {/* JD snippet */}
            <div className="mb-4 bg-slate-900/60 rounded-xl p-3 border border-slate-800/40">
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                {item.jdTextSnippet || 'Không có nội dung JD'}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-slate-800/40">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Tổng</div>
                <div className="font-black text-white text-sm">{item.totalCandidates}</div>
              </div>
              <div className="bg-emerald-500/8 rounded-lg p-2 text-center border border-emerald-500/15">
                <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-0.5">Hạng A</div>
                <div className="font-black text-emerald-400 text-sm">{item.grades.A}</div>
              </div>
              <div className="bg-blue-500/8 rounded-lg p-2 text-center border border-blue-500/15">
                <div className="text-[10px] text-blue-400/70 uppercase tracking-wider mb-0.5">Hạng B</div>
                <div className="font-black text-blue-400 text-sm">{item.grades.B}</div>
              </div>
              <div className="bg-red-500/8 rounded-lg p-2 text-center border border-red-500/15">
                <div className="text-[10px] text-red-400/70 uppercase tracking-wider mb-0.5">Hạng C</div>
                <div className="font-black text-red-400 text-sm">{item.grades.C}</div>
              </div>
            </div>

            {/* Top candidates */}
            {item.topCandidates?.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Top ứng viên</div>
                <div className="space-y-1.5">
                  {item.topCandidates.slice(0, 2).map(c => (
                    <div key={c.id} className="flex justify-between items-center text-xs bg-slate-800/30 p-2 rounded-lg border border-slate-800/40">
                      <span className="truncate max-w-[60%] text-slate-300 font-medium" title={c.name}>{c.name}</span>
                      <span className="text-cyan-400 font-bold">{c.score}đ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              {!item.id.startsWith('manual-') && (
                <button
                  onClick={() => onRestore && item.fullPayload && onRestore(item.fullPayload)}
                  disabled={!item.fullPayload}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    item.fullPayload
                      ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      : 'border-slate-800/60 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <i className="fa-solid fa-rotate-left text-[10px]"></i> Khôi phục
                </button>
              )}
              <button className="flex-1 px-3 py-2 rounded-xl text-xs font-bold border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-1.5">
                <i className="fa-solid fa-circle-info text-[10px]"></i> Chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Detail Modal ────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-5xl bg-[#0B1628] border border-slate-800/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-800/60 bg-slate-900/50">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  {selected.jobPosition || 'Chức danh chưa đặt'}
                  {selected.id.startsWith('manual-') && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">Thủ công</span>
                  )}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><i className="fa-regular fa-calendar text-[10px]"></i> {new Date(selected.timestamp).toLocaleString('vi-VN')}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><i className="fa-solid fa-users text-[10px]"></i> {selected.totalCandidates} ứng viên</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selected.id.startsWith('manual-') && selected.fullPayload && (
                  <button
                    onClick={() => onRestore && selected.fullPayload && onRestore(selected.fullPayload)}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    <i className="fa-solid fa-rotate-left text-xs"></i> Khôi phục
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl border border-slate-800/60 text-slate-500 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center">
                  <i className="fa-solid fa-times text-sm"></i>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#040814]/50">
              <div className="grid lg:grid-cols-3 gap-5">
                {/* JD section */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-slate-900/60 rounded-xl border border-slate-800/60 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/80 flex items-center gap-2">
                      <i className="fa-solid fa-file-lines text-blue-400 text-xs"></i>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Mô tả công việc (JD)</h4>
                    </div>
                    <div className="p-4">
                      <div className="max-h-56 overflow-y-auto rounded-lg bg-slate-900/80 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-400 border border-slate-800/40 custom-scrollbar">
                        {selected.fullPayload?.jdText || selected.jdTextSnippet}
                      </div>
                    </div>
                  </div>

                  {/* Hard filters & weights */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {selected.fullPayload?.hardFilters && (
                      <div className="bg-slate-900/60 rounded-xl border border-slate-800/60 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/80 flex items-center gap-2">
                          <i className="fa-solid fa-filter text-purple-400 text-xs"></i>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Hard Filters</h4>
                        </div>
                        <div className="p-4">
                          <pre className="text-[11px] text-slate-500 font-mono overflow-auto max-h-40 custom-scrollbar bg-slate-900/80 rounded-lg p-3 border border-slate-800/40">
                            {JSON.stringify(selected.fullPayload.hardFilters, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {selected.fullPayload?.weights && (
                      <div className="bg-slate-900/60 rounded-xl border border-slate-800/60 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/80 flex items-center gap-2">
                          <i className="fa-solid fa-scale-balanced text-amber-400 text-xs"></i>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Trọng số</h4>
                        </div>
                        <div className="p-4">
                          <pre className="text-[11px] text-slate-500 font-mono overflow-auto max-h-40 custom-scrollbar bg-slate-900/80 rounded-lg p-3 border border-slate-800/40">
                            {JSON.stringify(selected.fullPayload.weights, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: stats & candidates */}
                <div className="space-y-4">
                  {/* Grade distribution */}
                  <div className="bg-slate-900/60 rounded-xl border border-slate-800/60 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/80 flex items-center gap-2">
                      <i className="fa-solid fa-chart-pie text-emerald-400 text-xs"></i>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Phân bố hạng</h4>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-end gap-3">
                        {[
                          { label: 'Hạng A', value: selected.grades.A, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
                          { label: 'Hạng B', value: selected.grades.B, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/25' },
                          { label: 'Hạng C', value: selected.grades.C, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/25' },
                        ].map(g => (
                          <div key={g.label} className="flex-1 text-center">
                            <div className={`text-2xl font-black ${g.color} mb-1`}>{g.value}</div>
                            <div className={`h-1.5 w-full rounded-full overflow-hidden mb-2 ${g.bg} border ${g.border}`}>
                              <div className={`h-full ${g.color.replace('text-', 'bg-')}`} style={{ width: `${Math.max(selected.totalCandidates > 0 ? (g.value / selected.totalCandidates) * 100 : 0, 4)}%` }}></div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{g.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top candidates */}
                  {selected.topCandidates?.length > 0 && (
                    <div className="bg-slate-900/60 rounded-xl border border-slate-800/60 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/80 flex items-center gap-2">
                        <i className="fa-solid fa-trophy text-amber-400 text-xs"></i>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top ứng viên</h4>
                      </div>
                      <div className="p-3">
                        <ul className="space-y-2">
                          {selected.topCandidates.map((c, idx) => (
                            <li key={c.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-800/40">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                  idx === 0 ? 'bg-amber-500 text-amber-900' : idx === 1 ? 'bg-slate-400 text-slate-900' : 'bg-orange-700 text-orange-200'
                                }`}>{idx + 1}</div>
                                <span className="truncate text-xs text-slate-200 font-medium" title={c.name}>{c.name}</span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-black text-cyan-400">{c.score}đ</div>
                                <div className="text-[9px] text-slate-600">{c.jdFit}% JD</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Full candidate list */}
                  {selected.fullPayload?.candidates && (
                    <div className="bg-slate-900/60 rounded-xl border border-slate-800/60 overflow-hidden flex flex-col max-h-72">
                      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/80 flex items-center gap-2">
                        <i className="fa-solid fa-list-ul text-slate-400 text-xs"></i>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Danh sách chi tiết</h4>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar">
                        <table className="w-full text-[11px]">
                          <thead className="text-slate-500 bg-slate-900/50 sticky top-0 z-10">
                            <tr>
                              <th className="py-2 px-3 text-left font-medium">Tên</th>
                              <th className="py-2 px-3 text-center font-medium">Hạng</th>
                              <th className="py-2 px-3 text-right font-medium">Điểm</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-300 divide-y divide-slate-800/30">
                            {selected.fullPayload.candidates.map(c => (
                              <tr key={c.id || c.fileName} className="hover:bg-slate-800/20 transition-colors">
                                <td className="py-2 px-3 truncate max-w-[120px]" title={c.candidateName}>{c.candidateName}</td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    c.analysis?.['Hạng'] === 'A' ? 'bg-emerald-500/15 text-emerald-400' :
                                    c.analysis?.['Hạng'] === 'B' ? 'bg-blue-500/15 text-blue-400' :
                                    'bg-red-500/15 text-red-400'
                                  }`}>{c.analysis?.['Hạng'] || '—'}</span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-400">{c.analysis?.['Tổng điểm'] ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!selected.fullPayload && !selected.id.startsWith('manual-') && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-400 text-xs">
                  <i className="fa-solid fa-triangle-exclamation flex-shrink-0"></i>
                  Dữ liệu cũ không lưu đầy đủ chi tiết nên chỉ hiển thị thông tin tóm tắt.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
