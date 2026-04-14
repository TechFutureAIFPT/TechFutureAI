import React, { useState, useEffect } from 'react';
import { Users, FileText, X, Star, Mail, Phone, Briefcase, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react';
import type { Candidate } from '../../../assets/types';

interface SelectedCandidatesPageProps {
  candidates: Candidate[];
  jobPosition: string;
}

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';

const GradeBadge = ({ grade }: { grade?: string }) => {
  if (!grade) return null;
  const colorMap: Record<string, string> = {
    A: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    B: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    C: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${colorMap[grade] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      Hạng {grade}
    </span>
  );
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    : name.charAt(0).toUpperCase();
};

const getGradeGradient = (grade?: string) => {
  if (grade === 'A') return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20';
  if (grade === 'B') return 'from-blue-500/20 to-indigo-500/10 border-blue-500/20';
  return 'from-amber-500/15 to-orange-500/5 border-amber-500/15';
};

const getInitialsBg = (grade?: string) => {
  if (grade === 'A') return 'bg-emerald-500/20 text-emerald-400';
  if (grade === 'B') return 'bg-blue-500/20 text-blue-400';
  return 'bg-amber-500/20 text-amber-400';
};

const SelectedCandidatesPage: React.FC<SelectedCandidatesPageProps> = ({ candidates, jobPosition }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'grade'>('score');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [exportMsg, setExportMsg] = useState(false);

  // Load selectedIds from localStorage (shared with chatbot)
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(SELECTED_IDS_KEY);
        if (raw) setSelectedIds(new Set(JSON.parse(raw)));
        else setSelectedIds(new Set());
      } catch {
        setSelectedIds(new Set());
      }
    };
    load();

    // Listen for changes from chatbot page
    const handler = (e: StorageEvent) => {
      if (e.key === SELECTED_IDS_KEY) load();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const removeCandidate = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      try {
        localStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(Array.from(next)));
      } catch { }
      return next;
    });
  };

  const clearAll = () => {
    setSelectedIds(new Set());
    try {
      localStorage.removeItem(SELECTED_IDS_KEY);
    } catch { }
  };

  const selectedCandidates = candidates
    .filter(c => selectedIds.has(c.id!) && c.status === 'SUCCESS')
    .sort((a, b) => {
      if (sortBy === 'score') {
        const diff = (b.analysis?.['Tổng điểm'] ?? 0) - (a.analysis?.['Tổng điểm'] ?? 0);
        return sortDir === 'desc' ? diff : -diff;
      }
      if (sortBy === 'grade') {
        const gradeOrder = { A: 0, B: 1, C: 2 };
        const ga = gradeOrder[(a.analysis?.['Hạng'] ?? 'C') as 'A' | 'B' | 'C'] ?? 2;
        const gb = gradeOrder[(b.analysis?.['Hạng'] ?? 'C') as 'A' | 'B' | 'C'] ?? 2;
        return sortDir === 'desc' ? ga - gb : gb - ga;
      }
      // name
      const diff = (a.candidateName ?? '').localeCompare(b.candidateName ?? '', 'vi');
      return sortDir === 'desc' ? diff : -diff;
    });

  const exportToCSV = () => {
    if (selectedCandidates.length === 0) return;
    const headers = ['STT', 'Họ tên', 'Hạng', 'Điểm tổng', 'Chức danh', 'Cấp độ', 'Email', 'SĐT'];
    const csvData = [
      headers.join(','),
      ...selectedCandidates.map((c, i) => [
        i + 1,
        c.candidateName || '',
        c.analysis?.['Hạng'] || 'C',
        c.analysis?.['Tổng điểm'] ?? 0,
        c.jobTitle || '',
        c.experienceLevel || '',
        c.email || '',
        c.phone || '',
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ung_vien_duoc_chon_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setExportMsg(true);
    setTimeout(() => setExportMsg(false), 2500);
  };

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) =>
    sortBy === field
      ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />)
      : null;

  // Summary stats
  const gradeA = selectedCandidates.filter(c => c.analysis?.['Hạng'] === 'A').length;
  const gradeB = selectedCandidates.filter(c => c.analysis?.['Hạng'] === 'B').length;
  const gradeC = selectedCandidates.filter(c => c.analysis?.['Hạng'] === 'C').length;
  const avgScore = selectedCandidates.length > 0
    ? Math.round(selectedCandidates.reduce((s, c) => s + (c.analysis?.['Tổng điểm'] ?? 0), 0) / selectedCandidates.length * 10) / 10
    : 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a]">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-800/50 bg-[#0a0e1a]/90 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Ứng viên đã chọn</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                <span className="text-[10px] text-emerald-400 font-medium">{selectedCandidates.length} ứng viên</span>
                {jobPosition && (
                  <>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">{jobPosition}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCandidates.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                title="Xóa tất cả"
              >
                <X className="w-3 h-3" /> Xóa tất cả
              </button>
            )}
            <button
              onClick={exportToCSV}
              disabled={selectedCandidates.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-400/20"
            >
              {exportMsg ? <CheckCheck className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {exportMsg ? 'Đã xuất!' : `Xuất CSV (${selectedCandidates.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ──────────────────────────────── */}
      {selectedCandidates.length > 0 && (
        <div className="shrink-0 border-b border-slate-800/40 bg-[#0a0e1a]/60 px-6 py-3">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Điểm TB</span>
              <span className="text-sm font-black text-white">{avgScore}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-3">
              {gradeA > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />Hạng A: {gradeA}
                </span>
              )}
              {gradeB > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400">
                  <span className="w-2 h-2 rounded-sm bg-blue-500" />Hạng B: {gradeB}
                </span>
              )}
              {gradeC > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                  <span className="w-2 h-2 rounded-sm bg-amber-500" />Hạng C: {gradeC}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────── */}
      {selectedCandidates.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-[#0B1628] border border-slate-800/60 flex items-center justify-center mb-6 shadow-2xl shadow-black/30">
            <Users className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Chưa có ứng viên nào được chọn</h2>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
            Hãy vào trang <span className="text-blue-400 font-semibold">Gợi ý ứng viên AI</span>, trò chuyện với chatbot và nhấn{' '}
            <span className="text-white font-semibold">Chọn</span> để thêm ứng viên vào danh sách này.
          </p>
        </div>
      ) : (
        <>
          {/* ── Sort bar ─────────────────────────────── */}
          <div className="shrink-0 bg-[#0a0e1a]/70 border-b border-slate-800/40 px-6 py-2 flex items-center gap-2">
            <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mr-1">Sắp xếp:</span>
            {(['score', 'grade', 'name'] as const).map(f => (
              <button
                key={f}
                onClick={() => toggleSort(f)}
                className={`px-2.5 py-1 text-[10px] font-bold transition-all border ${sortBy === f ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-transparent border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}
              >
                {f === 'score' ? 'Điểm' : f === 'grade' ? 'Hạng' : 'Tên'}
                <SortIcon field={f} />
              </button>
            ))}
            <span className="ml-auto text-[10px] text-slate-600">{selectedCandidates.length} kết quả</span>
          </div>

          {/* ── Candidate Cards ───────────────────────── */}
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {selectedCandidates.map((c, idx) => (
                <div
                  key={c.id}
                  className={`relative group bg-gradient-to-br ${getGradeGradient(c.analysis?.['Hạng'])} border rounded-none p-4 shadow-xl shadow-black/20 hover:shadow-black/30 transition-all duration-200 hover:-translate-y-0.5`}
                >
                  {/* Rank badge */}
                  <div className="absolute top-3 left-3 w-6 h-6 bg-slate-900/60 border border-slate-700/40 flex items-center justify-center text-[9px] font-black text-slate-400">
                    #{idx + 1}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeCandidate(c.id!)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-slate-800/80 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all border border-slate-700/40 hover:border-red-500/30 opacity-0 group-hover:opacity-100"
                    title="Bỏ chọn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mt-2 mb-3">
                    <div className={`w-11 h-11 flex items-center justify-center text-sm font-black flex-shrink-0 ${getInitialsBg(c.analysis?.['Hạng'])}`}>
                      {getInitials(c.candidateName || '?')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate pr-6">{c.candidateName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.jobTitle || '—'}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <GradeBadge grade={c.analysis?.['Hạng']} />
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700/40">
                      <Star className="w-2.5 h-2.5 inline mr-0.5 text-amber-400" />
                      {c.analysis?.['Tổng điểm'] ?? '—'} điểm
                    </span>
                    {c.experienceLevel && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/30">
                        {c.experienceLevel}
                      </span>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 border-t border-slate-700/30 pt-2.5">
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <a href={`mailto:${c.email}`} className="text-[11px] text-blue-400 hover:text-blue-300 truncate transition-colors">
                          {c.email}
                        </a>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <a href={`tel:${c.phone}`} className="text-[11px] text-slate-300 hover:text-white truncate transition-colors">
                          {c.phone}
                        </a>
                      </div>
                    )}
                    {c.detectedLocation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="text-[11px] text-slate-400 truncate">{c.detectedLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Strengths preview */}
                  {c.analysis?.['Điểm mạnh CV'] && c.analysis['Điểm mạnh CV'].length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/20">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Điểm mạnh</p>
                      <ul className="space-y-0.5">
                        {c.analysis['Điểm mạnh CV'].slice(0, 2).map((s, i) => (
                          <li key={i} className="text-[10px] text-slate-300 flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="leading-snug">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectedCandidatesPage;
