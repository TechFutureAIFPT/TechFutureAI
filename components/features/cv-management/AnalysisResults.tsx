
import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import type { Candidate, AppStep } from '../../../assets/types';
import ExpandedContent from './ExpandedContent';

interface AnalysisResultsProps {
  isLoading: boolean;
  loadingMessage: string;
  results: Candidate[];
  jobPosition: string;
  locationRequirement: string;
  jdText: string;
  setActiveStep?: (step: AppStep) => void;
  markStepAsCompleted?: (step: AppStep) => void;
}

// --- Loader ---
const Loader: React.FC<{ message: string }> = ({ message }) => {
  const [dots, setDots] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { icon: 'fa-file-lines', label: 'Đọc hồ sơ', color: 'text-cyan-400' },
    { icon: 'fa-brain', label: 'Phân tích AI', color: 'text-violet-400' },
    { icon: 'fa-chart-bar', label: 'Tính điểm', color: 'text-emerald-400' },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center min-h-[min(60vh,100%)]">
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ animationDuration: '1.8s' }} />
        <div className="absolute -inset-4 rounded-full opacity-10 bg-gradient-to-r from-cyan-500 to-indigo-500 blur-lg" />
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50 animate-spin" style={{ animationDuration: '0.9s' }} />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-indigo-400 border-l-indigo-400/50 animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-robot text-xl text-indigo-400 animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      </div>
      <div className="max-w-sm">
        <h3 className="text-lg font-bold mb-1 text-slate-100">
          {message || 'Đang phân tích CV với AI...'}
          <span className="inline-block w-8 text-left">{'.'.repeat(dots)}</span>
        </h3>
        <p className="text-sm text-slate-400">Vui lòng chờ trong giây lát.</p>
      </div>
      <div className="flex items-center gap-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 px-6 py-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
              <i className={`fa-solid ${step.icon} text-sm ${step.color} ${dots % 3 === i ? 'animate-bounce' : ''}`} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

type RankedCandidate = Candidate & { rank: number; jdFitScore: number; gradeValue: number };

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ isLoading, loadingMessage, results, jobPosition, locationRequirement, jdText, setActiveStep, markStepAsCompleted }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'jdFit'>('score');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, Record<string, boolean>>>({});

  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => setDebouncedSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSetSearchTerm(value);
  };

  const handleExpandCandidate = (candidateId: string) => {
    setExpandedCandidate(expandedCandidate === candidateId ? null : candidateId);
  };

  const handleToggleCriterion = (candidateId: string, criterion: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [candidateId]: { ...prev[candidateId], [criterion]: !prev[candidateId]?.[criterion] }
    }));
  };

  const summaryData = useMemo(() => {
    if (!results || results.length === 0) return { total: 0, countA: 0, countB: 0, countC: 0 };
    const successful = results.filter(c => c.status === 'SUCCESS' && c.analysis);
    const countA = successful.filter(c => c.analysis?.['Hạng'] === 'A').length;
    const countB = successful.filter(c => c.analysis?.['Hạng'] === 'B').length;
    return { total: successful.length, countA, countB, countC: results.length - countA - countB };
  }, [results]);

  const analysisData = useMemo(() => {
    if (!results || results.length === 0) return null;
    return {
      timestamp: Date.now(),
      job: { position: jobPosition, locationRequirement: locationRequirement || 'Không có' },
      candidates: results.map((c, i) => ({
        ...c,
        id: c.id || `candidate-${i}-${c.fileName}-${c.candidateName}`.replace(/[^a-zA-Z0-9]/g, '-')
      })),
    };
  }, [results, jobPosition, locationRequirement]);

  const rankedAndSortedResults = useMemo((): RankedCandidate[] => {
    if (!results || results.length === 0) return [];
    const gradeValues: Record<string, number> = { 'A': 3, 'B': 2, 'C': 1, 'FAILED': 0 };
    const enriched = results.map(c => ({
      ...c,
      jdFitScore: parseInt(c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10),
      gradeValue: gradeValues[c.status === 'FAILED' ? 'FAILED' : (c.analysis?.['Hạng'] || 'C')]
    }));
    enriched.sort((a, b) => {
      const pd = sortBy === 'score'
        ? (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0)
        : b.jdFitScore - a.jdFitScore;
      if (pd !== 0) return pd;
      const sd = sortBy === 'score'
        ? b.jdFitScore - a.jdFitScore
        : (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0);
      if (sd !== 0) return sd;
      return b.gradeValue - a.gradeValue;
    });
    return enriched.map((c, i) => ({ ...c, rank: i + 1 }));
  }, [results, sortBy]);

  const filteredResults = useMemo(() => {
    let r = rankedAndSortedResults;
    if (debouncedSearchTerm) r = r.filter(c =>
      c.candidateName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      c.jobTitle?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    if (filter !== 'all') r = r.filter(c =>
      c.status === 'FAILED' ? filter === 'C' : c.analysis?.['Hạng'] === filter
    );
    return r.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  }, [rankedAndSortedResults, filter, debouncedSearchTerm]);

  if (isLoading) {
    return (
      <section id="module-analysis" className="module-pane active flex h-full min-h-0 w-full flex-1 flex-col">
        <Loader message={loadingMessage} />
      </section>
    );
  }

  if (results.length === 0) {
    return (
      <section id="module-analysis" className="module-pane active flex h-full min-h-0 w-full flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:py-20">
          <div className="relative mb-6 inline-block">
            <i className="fa-solid fa-chart-line text-5xl text-slate-600 md:text-6xl"></i>
            <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500"></div>
          </div>
          <h3 className="mb-3 text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Sẵn Sàng Phân Tích</h3>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-slate-400">Kết quả AI sẽ xuất hiện ở đây sau khi bạn cung cấp mô tả công việc và các tệp CV.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="module-analysis" className="module-pane active relative flex h-full min-h-0 w-full flex-1 flex-col" style={{ background: 'linear-gradient(180deg, #0a1220 0%, #0d1628 100%)' }}>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-4 lg:p-5">

        {/* ── Campaign header ─────────────────────────── */}
        <div
          className="mb-3 flex w-full shrink-0 flex-col justify-between gap-4 rounded-2xl p-4 lg:flex-row lg:items-center"
          style={{ background: 'linear-gradient(180deg, rgba(12,22,40,0.9) 0%, rgba(10,18,32,0.9) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(99,102,241,0.6)' }}>Chiến dịch tuyển dụng hiện tại</p>
            <h2 className="mt-1 line-clamp-1 font-bold tracking-tight lg:text-2xl" style={{ color: '#f1f5f9', fontSize: '18px' }} title={analysisData?.job.position || jobPosition}>
              {analysisData?.job.position || jobPosition}
            </h2>
            <p className="mt-1 text-xs" style={{ color: '#475569' }}>
              Phân tích lúc <span className="font-semibold" style={{ color: '#94a3b8' }}>{analysisData ? new Date(analysisData.timestamp).toLocaleString('vi-VN') : 'Không rõ'}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 lg:flex-row lg:items-center">
            {/* Grade badges */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                Tổng: {summaryData.total}
              </div>
              <div className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                A: {summaryData.countA}
              </div>
              <div className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                B: {summaryData.countB}
              </div>
              <div className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                C/Lỗi: {summaryData.countC}
              </div>
            </div>
            <div className="flex w-full items-center gap-2 lg:w-auto">
              <button
                onClick={() => { if (setActiveStep) setActiveStep('dashboard'); if (markStepAsCompleted) markStepAsCompleted('analysis'); navigate('/detailed-analytics'); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all lg:flex-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
              >
                Thống Kê
              </button>
              <button
                onClick={() => { if (setActiveStep) setActiveStep('chatbot'); if (markStepAsCompleted) markStepAsCompleted('analysis'); navigate('/chatbot'); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all lg:flex-none"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: '1px solid rgba(99,102,241,0.35)', color: '#fff', boxShadow: '0 4px 15px rgba(99,102,241,0.2)' }}
              >
                Gợi Ý Ứng Viên
                <span className="text-[10px] opacity-80">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI cards ──────────────────────────────── */}
        <div className="mb-3 grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng CV Phân Tích', value: summaryData.total, accent: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', text: '#f1f5f9' },
            { label: 'Hạng A', value: summaryData.countA, accent: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)', text: '#34d399' },
            { label: 'Hạng B', value: summaryData.countB, accent: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
            { label: 'Hạng C/Lỗi', value: summaryData.countC, accent: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)', text: '#f87171' }
          ].map(card => (
            <div key={card.label} className="rounded-2xl p-4" style={{ background: card.accent, border: `1px solid ${card.border}` }}>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: '#475569' }}>{card.label}</p>
              <p className="text-4xl font-black mt-2" style={{ color: card.text }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filter bar ─────────────────────────────── */}
        <div
          className="mb-3 shrink-0 rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#475569' }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm theo tên, chức danh..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Tất cả', value: 'all', active: { bg: '#6366f1', color: '#fff' }, inactive: { bg: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'rgba(255,255,255,0.08)' } },
                { label: 'Hạng A', value: 'A', active: { bg: '#059669', color: '#fff' }, inactive: { bg: 'rgba(16,185,129,0.08)', color: '#34d399', border: 'rgba(16,185,129,0.2)' } },
                { label: 'Hạng B', value: 'B', active: { bg: '#2563eb', color: '#fff' }, inactive: { bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' } },
                { label: 'Hạng C', value: 'C', active: { bg: '#d97706', color: '#fff' }, inactive: { bg: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' } },
                { label: 'Lỗi', value: 'FAILED', active: { bg: '#dc2626', color: '#fff' }, inactive: { bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)' } }
              ].map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setFilter(chip.value)}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition"
                  style={filter === chip.value ? { background: chip.active.bg, color: chip.active.color, border: '1px solid transparent' } : { background: chip.inactive.bg, color: chip.inactive.color, border: `1px solid ${(chip.inactive as any).border || 'rgba(255,255,255,0.08)'}` }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
              <span>Sắp xếp</span>
              <div className="relative">
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'score' | 'jdFit')}
                  className="cursor-pointer appearance-none rounded-full py-2 pl-4 pr-10 font-semibold outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
                >
                  <option value="score">Điểm Tổng</option>
                  <option value="jdFit">Phù hợp JD</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: '#475569' }}>▾</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Results table ───────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Desktop */}
          <div className="custom-scrollbar hidden min-h-0 flex-1 overflow-y-auto md:block">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,18,32,0.9)' }}>
                <tr style={{ color: '#475569' }}>
                  <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">STT</th>
                  <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Họ tên</th>
                  <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Hạng</th>
                  <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Điểm</th>
                  <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Phù hợp JD</th>
                  <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">File</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((candidate, index) => {
                  const isSelected = selectedCandidates.has(candidate.id);
                  const grade = candidate.status === 'FAILED' ? 'FAILED' : (candidate.analysis?.['Hạng'] || 'C');
                  const overallScore = candidate.status === 'FAILED' ? 0 : (candidate.analysis?.['Tổng điểm'] || 0);
                  const jdFitScore = candidate.status === 'FAILED' ? 0 : parseInt(candidate.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10);
                  return (
                    <React.Fragment key={candidate.id}>
                      <tr
                        className="cursor-pointer transition-colors duration-150"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(99,102,241,0.06)' : undefined }}
                        onClick={e => { if ((e.target as HTMLElement).tagName !== 'INPUT') handleExpandCandidate(candidate.id); }}
                      >
                        <td className="px-5 py-3 font-medium" style={{ color: '#475569' }}>#{index + 1}</td>
                        <td className="px-5 py-3 font-medium" style={{ color: '#cbd5e1' }}>{candidate.candidateName || 'Chưa xác định'}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={
                            candidate.status === 'FAILED'
                              ? { background: 'rgba(255,255,255,0.05)', color: '#475569' }
                              : grade === 'A'
                                ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                                : grade === 'B'
                                  ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }
                                  : { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
                          }>{grade}</span>
                        </td>
                        <td className="px-5 py-3 font-medium" style={{ color: '#cbd5e1' }}>{overallScore}</td>
                        <td className="px-5 py-3 font-medium" style={{ color: '#cbd5e1' }}>{jdFitScore}%</td>
                        <td className="flex items-center justify-between gap-3 px-5 py-3" style={{ color: '#475569' }}>
                          <span className="truncate text-sm">{candidate.fileName || ''}</span>
                          <button style={{ color: 'rgba(99,102,241,0.5)' }} onClick={e => { e.stopPropagation(); handleExpandCandidate(candidate.id); }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#818cf8'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(99,102,241,0.5)'; }}>
                            ▾
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-sm" style={{ color: '#334155' }}>Không có ứng viên nào khớp với bộ lọc của bạn.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4 md:hidden">
            {filteredResults.map((candidate, index) => {
              const isSelected = selectedCandidates.has(candidate.id);
              const grade = candidate.status === 'FAILED' ? 'FAILED' : (candidate.analysis?.['Hạng'] || 'C');
              const overallScore = candidate.status === 'FAILED' ? 0 : (candidate.analysis?.['Tổng điểm'] || 0);
              const jdFitScore = candidate.status === 'FAILED' ? 0 : parseInt(candidate.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10);
              return (
                <div key={candidate.id} className="rounded-xl p-4 transition-all" style={{ background: isSelected ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium" style={{ color: '#475569' }}>#{index + 1}</span>
                      <div className="min-w-0">
                        <h4 className="max-w-[180px] truncate text-base font-semibold" style={{ color: '#cbd5e1' }}>{candidate.candidateName || 'Chưa xác định'}</h4>
                        <p className="mt-0.5 max-w-[180px] truncate text-xs" style={{ color: '#475569' }}>{candidate.jobTitle || 'Chưa có chức danh'}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={
                      candidate.status === 'FAILED'
                        ? { background: 'rgba(255,255,255,0.05)', color: '#475569' }
                        : grade === 'A'
                          ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                          : grade === 'B'
                            ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }
                            : { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
                    }>{grade}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="mb-1 text-xs" style={{ color: '#475569' }}>Điểm tổng</p><p className="text-lg font-semibold" style={{ color: '#cbd5e1' }}>{overallScore}</p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="mb-1 text-xs" style={{ color: '#475569' }}>Phù hợp JD</p><p className="text-lg font-semibold" style={{ color: '#cbd5e1' }}>{jdFitScore}%</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <span className="max-w-[150px] truncate text-xs" style={{ color: '#475569' }}>{candidate.fileName}</span>
                    <button onClick={() => handleExpandCandidate(candidate.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition" style={{ color: 'rgba(99,102,241,0.6)' }}>
                      {expandedCandidate === candidate.id ? 'Thu gọn' : 'Chi tiết'} ▾
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredResults.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: '#334155' }}>Không có ứng viên nào khớp với bộ lọc.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Expand modal ──────────────────────────────── */}
      {expandedCandidate && results.find(c => c.id === expandedCandidate) && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" style={{ background: 'rgba(0,0,0,0.65)', zIndex: 99999 }}>
          <div className="flex h-full max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(180deg, #0d1420 0%, #0a1220 100%)', border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 0 60px rgba(99,102,241,0.1)' }}>
            <div className="flex shrink-0 items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                <h3 className="text-xl font-bold lg:text-2xl" style={{ color: '#f1f5f9' }}>
                  Kết quả chi tiết: {results.find(c => c.id === expandedCandidate)?.candidateName}
                </h3>
              </div>
              <button onClick={() => setExpandedCandidate(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition" style={{ color: '#475569' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
                ×
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5" style={{ background: 'rgba(10,18,32,0.5)' }}>
              <ExpandedContent
                candidate={results.find(c => c.id === expandedCandidate)!}
                expandedCriteria={expandedCriteria}
                onToggleCriterion={handleToggleCriterion}
                jdText={jdText}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default AnalysisResults;
