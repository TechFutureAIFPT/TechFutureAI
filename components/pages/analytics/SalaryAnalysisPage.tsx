import React, { useState } from 'react';
import SalaryAnalysisPanel from '../../../components/features/analysis/SalaryAnalysisPanel';
import type { Candidate } from '../../../assets/types';

interface SalaryAnalysisPageProps {
  candidates?: Candidate[];
  jdText?: string;
}

const SalaryAnalysisPage: React.FC<SalaryAnalysisPageProps> = ({ candidates, jdText }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | undefined>(
    candidates && candidates.length > 0 ? candidates[0] : undefined
  );
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  const handleAnalysisComplete = (result: any) => {
    console.log('✅ Salary analysis completed:', result);
    setAnalysisResults(prev => [...prev, result]);
  };

  return (
    <div className="space-y-5">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-emerald-400 text-sm"></i>
            </div>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase font-medium">Salary Insights</span>
          </div>
          <h1 className="text-2xl font-black text-white">Phân tích mức lương</h1>
          <p className="text-xs text-slate-500 mt-0.5">So sánh mức lương ứng viên với thị trường Việt Nam</p>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Candidate Selection ─────────────────────────────── */}
        {candidates && candidates.length > 0 && (
          <div className="lg:col-span-1 bg-[#0B1628] rounded-2xl border border-slate-800/60 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-800/60 bg-slate-900/50">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-users text-cyan-400 text-xs"></i>
                Chọn ứng viên
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">{candidates.length} ứng viên có sẵn</p>
            </div>
            <div className="p-3 space-y-2 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {candidates.map((candidate) => {
                const isSelected = selectedCandidate?.id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-cyan-500/10 border border-cyan-500/35 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/40 border border-slate-800/40 hover:bg-slate-800/40 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{candidate.candidateName}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{candidate.jobTitle || 'Chưa rõ chức danh'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            candidate.analysis?.['Hạng'] === 'A' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                            candidate.analysis?.['Hạng'] === 'B' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
                            'bg-red-500/15 text-red-400 border border-red-500/25'
                          }`}>
                            {candidate.analysis?.['Hạng'] || '—'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Điểm: <span className="font-bold text-slate-300">{candidate.analysis?.['Tổng điểm'] || 0}</span>
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-check text-[9px] text-cyan-400"></i>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Salary Analysis Panel ───────────────────────────── */}
        <div className={candidates && candidates.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <SalaryAnalysisPanel
            candidate={selectedCandidate}
            jdText={jdText}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>

      {/* ── Analysis History ────────────────────────────────────── */}
      {analysisResults.length > 0 && (
        <div className="bg-[#0B1628] rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-800/60 bg-slate-900/50">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-amber-400 text-xs"></i>
              Lịch sử phân tích
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {analysisResults.map((result, index) => (
              <div key={index} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{result.summary}</p>
                  {result.marketSalary && (
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-slate-500">
                        Median: <span className="font-bold text-slate-300">{(result.marketSalary.median / 1_000_000).toFixed(1)} tr VNĐ</span>
                      </span>
                      {result.comparison && (
                        <span className={`text-xs font-semibold ${
                          result.comparison.marketPosition === 'below' ? 'text-amber-400' :
                          result.comparison.marketPosition === 'reasonable' ? 'text-emerald-400' :
                          'text-blue-400'
                        }`}>
                          {result.comparison.marketPosition === 'below' ? '↓ Dưới thị trường' :
                           result.comparison.marketPosition === 'reasonable' ? '✓ Hợp lý' :
                           '↑ Trên thị trường'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-600 flex-shrink-0 mt-1">
                  {new Date().toLocaleTimeString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Usage Guide ─────────────────────────────────────────── */}
      <div className="bg-[#0B1628] rounded-2xl border border-slate-800/60 p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-cyan-400 text-xs"></i>
          Hướng dẫn sử dụng
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: 'fa-mouse-pointer', label: 'Tự động', desc: 'Chọn ứng viên từ danh sách bên trái' },
            { icon: 'fa-keyboard', label: 'Thủ công', desc: 'Nhập thông tin trực tiếp vào form' },
            { icon: 'fa-cloud', label: 'API', desc: 'Dữ liệu từ job-salary-data API' },
            { icon: 'fa-brain', label: 'Fallback', desc: 'Ước tính thông minh khi API không khả dụng' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${item.icon} text-cyan-400 text-xs`}></i>
              </div>
              <div>
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalaryAnalysisPage;
