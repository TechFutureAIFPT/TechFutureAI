import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Award, Star, AlertTriangle, Search, Filter, Download, CircleHelp, TrendingUp, Calendar, ChevronDown, X, Crown, CheckSquare, Square, Briefcase } from 'lucide-react';
import type { AnalysisRunData, Candidate } from '../../../assets/types';
import CandidateCard from '../../../components/ui/candidate/CandidateCard';
import InterviewQuestionGenerator from '../../../components/features/analysis/InterviewQuestionGenerator';

const FILTER_TABS = [
  { key: 'all' as const, label: 'Tất cả', color: 'text-white', bg: 'bg-slate-700/60', border: 'border-slate-600/40' },
  { key: 'A' as const, label: 'Hạng A', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { key: 'B' as const, label: 'Hạng B', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { key: 'C' as const, label: 'Hạng C', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  { key: 'FAILED' as const, label: 'Lỗi', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
] as const;

const DashboardPage: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisRunData | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C' | 'FAILED'>('all');
  const [showInterviewQuestions, setShowInterviewQuestions] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    const latestRun = localStorage.getItem('cvAnalysis.latest');
    if (latestRun) {
      try {
        const parsedData: AnalysisRunData = JSON.parse(latestRun);
        const sortedCandidates = parsedData.candidates.sort(
          (a, b) => (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0)
        );
        setAnalysisData({ ...parsedData, candidates: sortedCandidates });
      } catch {
        setAnalysisData(null);
      }
    }
  }, []);

  const handleSelectCandidate = useCallback((candidateId: string) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      newSet.has(candidateId) ? newSet.delete(candidateId) : newSet.add(candidateId);
      return newSet;
    });
  }, []);

  const summaryData = useMemo(() => {
    if (!analysisData) return { total: 0, countA: 0, countB: 0, countC: 0, failed: 0 };
    const candidates = analysisData.candidates;
    return {
      total: candidates.length,
      countA: candidates.filter(c => c.analysis?.['Hạng'] === 'A').length,
      countB: candidates.filter(c => c.analysis?.['Hạng'] === 'B').length,
      countC: candidates.filter(c => c.analysis?.['Hạng'] === 'C').length,
      failed: candidates.filter(c => c.status === 'FAILED').length,
      avgScore: Math.round(candidates.filter(c => c.status === 'SUCCESS').reduce((s, c) => s + (c.analysis?.['Tổng điểm'] || 0), 0) / Math.max(1, candidates.filter(c => c.status === 'SUCCESS').length)),
    };
  }, [analysisData]);

  const filteredCandidates = useMemo(() => {
    if (!analysisData) return [];
    let candidates = analysisData.candidates;
    if (filter !== 'all') {
      candidates = filter === 'FAILED'
        ? candidates.filter(c => c.status === 'FAILED')
        : candidates.filter(c => c.analysis?.['Hạng'] === filter && c.status === 'SUCCESS');
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      candidates = candidates.filter(c =>
        c.candidateName?.toLowerCase().includes(term) ||
        c.jobTitle?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }
    return candidates;
  }, [analysisData, searchTerm, filter]);

  const handleSelectAll = useCallback(() => {
    if (!analysisData) return;
    let list = analysisData.candidates;
    if (filter !== 'all') {
      list = filter === 'FAILED'
        ? list.filter(c => c.status === 'FAILED')
        : list.filter(c => c.analysis?.['Hạng'] === filter && c.status === 'SUCCESS');
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.candidateName?.toLowerCase().includes(term) ||
        c.jobTitle?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }
    if (selectedCandidates.size === list.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(list.map(c => c.id)));
    }
  }, [analysisData, filter, searchTerm, selectedCandidates]);

  const exportToCSV = useCallback(() => {
    if (!analysisData) return;
    const candidatesToExport = selectedCandidates.size > 0
      ? analysisData.candidates.filter(c => selectedCandidates.has(c.id))
      : analysisData.candidates;
    if (candidatesToExport.length === 0) return;
    const headers = ['STT', 'Họ tên', 'Hạng', 'Điểm tổng', 'Phù hợp JD (%)', 'Điện thoại', 'Email', 'Điểm mạnh', 'Điểm yếu'];
    const rows = candidatesToExport.map((c, index) => [
      index + 1,
      c.candidateName || '',
      c.analysis?.['Hạng'] || 'N/A',
      c.analysis?.['Tổng điểm'] || 'N/A',
      c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm']?.split('/')[0] || 'N/A',
      c.phone || 'N/A',
      c.email || 'N/A',
      `"${c.analysis?.['Điểm mạnh CV']?.join(', ') || 'N/A'}"`,
      `"${c.analysis?.['Điểm yếu CV']?.join(', ') || 'N/A'}"`,
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cv_export_${analysisData.job.position.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [analysisData, selectedCandidates]);

  if (!analysisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="mb-6 w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 flex items-center justify-center shadow-2xl shadow-black/30">
          <Briefcase className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Chưa có dữ liệu phân tích</h2>
        <p className="text-slate-400 max-w-sm text-sm leading-relaxed mb-6">Vui lòng chạy một lượt phân tích CV để xem kết quả tại đây.</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm text-slate-500">Bắt đầu từ bước nhập JD</span>
        </div>
      </div>
    );
  }

  const avgScoreData = useMemo(() => {
    const successful = analysisData.candidates.filter(c => c.status === 'SUCCESS');
    if (successful.length === 0) return null;
    const avg = Math.round(successful.reduce((s, c) => s + (c.analysis?.['Tổng điểm'] || 0), 0) / successful.length);
    const max = Math.max(...successful.map(c => c.analysis?.['Tổng điểm'] || 0));
    const min = Math.min(...successful.map(c => c.analysis?.['Tổng điểm'] || 0));
    return { avg, max, min };
  }, [analysisData]);

  return (
    <div className="space-y-5">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <TrendingUp className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Dashboard</span>
              </div>
              <span className="text-[10px] text-slate-600 font-medium">/</span>
              <span className="text-[10px] text-slate-500 tracking-wider font-medium">Kết quả phân tích</span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              {analysisData.job.position}
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10">
                {analysisData.candidates.length} CV
              </span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3 h-3" />
                <span className="text-[11px] font-medium">{new Date(analysisData.timestamp).toLocaleString('vi-VN')}</span>
              </div>
              {analysisData.job.locationRequirement && analysisData.job.locationRequirement !== 'Không có' && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="text-[11px] font-medium">{analysisData.job.locationRequirement}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectMode(!selectMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                selectMode
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              Chọn nhiều
            </button>
            <button
              onClick={() => setShowInterviewQuestions(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            >
              <CircleHelp className="w-4 h-4 text-purple-400" />
              Gợi ý câu hỏi PV
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/20"
            >
              <Download className="w-4 h-4" />
              Xuất CSV {selectedCandidates.size > 0 ? `(${selectedCandidates.size})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 p-4 hover:border-indigo-500/30 transition-all duration-300 shadow-xl shadow-black/10">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 transition-all group-hover:bg-indigo-500/10" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tổng CV</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tighter">{summaryData.total}</p>
          {avgScoreData && (
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] text-indigo-400 font-semibold">TB: {avgScoreData.avg}đ</span>
            </div>
          )}
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-emerald-500/20 p-4 hover:border-emerald-500/40 transition-all duration-300 shadow-xl shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 transition-all group-hover:bg-emerald-500/10" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-bold">Hạng A</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm">
              <Crown className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-emerald-400 tracking-tighter">{summaryData.countA}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-semibold">ứng viên xuất sắc</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-blue-500/20 p-4 hover:border-blue-500/40 transition-all duration-300 shadow-xl shadow-blue-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 transition-all group-hover:bg-blue-500/10" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-blue-400/80 uppercase tracking-wider font-bold">Hạng B</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-sm">
              <Star className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-blue-400 tracking-tighter">{summaryData.countB}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[10px] text-blue-400 font-semibold">ứng viên khá</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-amber-500/20 p-4 hover:border-amber-500/40 transition-all duration-300 shadow-xl shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 transition-all group-hover:bg-amber-500/10" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-bold">Hạng C</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-amber-400 tracking-tighter">{summaryData.countC}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[10px] text-amber-400 font-semibold">cần đánh giá thêm</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-red-500/20 p-4 hover:border-red-500/40 transition-all duration-300 shadow-xl shadow-red-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 transition-all group-hover:bg-red-500/10" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-red-400/80 uppercase tracking-wider font-bold">Lỗi / Không đạt</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-red-400 tracking-tighter">{summaryData.failed}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[10px] text-red-400 font-semibold">không xử lý được</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search className="text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" />
          <input
            type="text"
            placeholder="Tìm theo tên, chức danh, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-9 pr-4 py-2.5 bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/80 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all shadow-lg shadow-black/20"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#0d1420]/80 backdrop-blur-sm p-1 rounded-xl border border-slate-800/60 overflow-x-auto shadow-lg shadow-black/10">
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? summaryData.total
              : tab.key === 'A' ? summaryData.countA
              : tab.key === 'B' ? summaryData.countB
              : tab.key === 'C' ? summaryData.countC
              : summaryData.failed;

            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border
                  ${filter === tab.key
                    ? `${tab.bg} ${tab.border} ${tab.color} shadow-sm`
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border-transparent'
                  }
                `}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === tab.key ? 'bg-black/20' : 'bg-slate-800 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result count & select all */}
        <div className="sm:ml-auto flex items-center gap-3">
          {selectMode && filteredCandidates.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {selectedCandidates.size === filteredCandidates.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectedCandidates.size === filteredCandidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          )}
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {filteredCandidates.length} kết quả
          </span>
        </div>
      </div>

      {/* ── Candidate List ─────────────────────────────────────── */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-[#0d1420]/40 to-[#0a1020]/40 rounded-2xl border border-slate-800/60">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">Không có ứng viên nào khớp bộ lọc</p>
          <p className="text-[11px] text-slate-600 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate, index) => (
            <div key={candidate.id} className="relative group">
              {selectMode && (
                <div className="absolute top-5 left-4 z-10">
                  <button
                    onClick={() => handleSelectCandidate(candidate.id)}
                    className="flex items-center justify-center"
                  >
                    {selectedCandidates.has(candidate.id) ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                    )}
                  </button>
                </div>
              )}
              <CandidateCard candidate={candidate} rank={index + 1} />
            </div>
          ))}
        </div>
      )}

      {/* ── Interview Questions Modal ────────────────────────────── */}
      {showInterviewQuestions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <InterviewQuestionGenerator
              analysisData={analysisData}
              selectedCandidates={selectedCandidates.size > 0
                ? Array.from(selectedCandidates).map(id => analysisData.candidates.find(c => c.id === id)).filter(Boolean) as Candidate[]
                : analysisData.candidates.slice(0, 5)
              }
              onClose={() => setShowInterviewQuestions(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
