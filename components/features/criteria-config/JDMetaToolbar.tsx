import React, { useState } from 'react';
import { filterAndStructureJD, extractJobPositionFromJD } from '../../../services/ai-ml/models/gemini/gemini-core';
import type { HardFilters } from '../../../assets/types';

export interface JDMetaToolbarProps {
  jdText: string;
  setJdText: React.Dispatch<React.SetStateAction<string>>;
  jobPosition: string;
  setJobPosition: React.Dispatch<React.SetStateAction<string>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  onComplete: () => void;
  onBackToWelcome?: () => void;
  /** Tiêu đề trang */
  leading?: React.ReactNode;
}

const JDMetaToolbar: React.FC<JDMetaToolbarProps> = ({
  jdText,
  setJdText,
  jobPosition,
  setJobPosition,
  hardFilters,
  setHardFilters,
  onComplete,
  onBackToWelcome,
  leading,
}) => {
  const isCompleteEnabled = jdText.trim().length > 50 && jobPosition.trim().length > 3;
  const [company, setCompany] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeMsg, setSummarizeMsg] = useState('');
  const [summarizeError, setSummarizeError] = useState('');

  const handleSummarizeJD = async () => {
    if (jdText.trim().length < 200) {
      setSummarizeError('Nội dung JD quá ngắn để tối ưu.');
      return;
    }
    setIsSummarizing(true);
    setSummarizeError('');
    setSummarizeMsg('');
    try {
      const structuredJd = await filterAndStructureJD(jdText);
      setJdText(structuredJd);
      const extractedPosition = await extractJobPositionFromJD(structuredJd);
      if (extractedPosition) {
        setJobPosition(extractedPosition);
        setSummarizeMsg(`Đã tối ưu JD — chức danh: ${extractedPosition}`);
      } else {
        setSummarizeMsg('Đã tối ưu JD bằng AI.');
      }
      setTimeout(() => setSummarizeMsg(''), 5000);
    } catch {
      setSummarizeError('Dịch vụ AI đang gặp sự cố. Vui lòng thử lại.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div
      className="shrink-0 border-b"
      style={{
        background: 'linear-gradient(180deg, #0c1628 0%, #0a1220 100%)',
        borderColor: 'rgba(99,102,241,0.18)',
      }}
      role="region"
      aria-label="Thông tin JD nhanh"
    >
      {/* ── Dòng 1: Logo + Tiêu đề ─────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Accent bar */}
        <div
          className="h-8 w-[3px] rounded-full shrink-0"
          style={{ background: 'linear-gradient(180deg, #6366f1, #3b82f6)' }}
        />

        {leading ? (
          <div className="flex items-center gap-3 min-w-0">{leading}</div>
        ) : (
          <div className="min-w-0">
            <h1
              className="text-base font-bold leading-tight tracking-tight"
              style={{ color: '#f1f5f9' }}
            >
              Sàng lọc ứng viên
            </h1>
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5"
              style={{ color: 'rgba(99,102,241,0.7)' }}
            >
              Recruitment Intelligence
            </p>
          </div>
        )}

        {/* Dòng mô tả phụ */}
        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[10px] font-medium" style={{ color: 'rgba(148,163,184,0.6)' }}>
            JD mẫu · Bộ lọc · Phân tích CV
          </span>
        </div>

        {/* Action buttons — bên phải */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {onBackToWelcome && (
            <button
              type="button"
              onClick={onBackToWelcome}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all hover:brightness-110"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
              }}
            >
              <i className="fa-solid fa-file-import text-[9px]" />
              Tải file JD
            </button>
          )}
          <button
            type="button"
            onClick={handleSummarizeJD}
            disabled={isSummarizing || jdText.trim().length < 200}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all hover:brightness-110 disabled:opacity-40"
            style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa',
            }}
          >
            {isSummarizing ? (
              <span className="h-3 w-3 rounded-full border-2 border-purple-800 border-t-purple-400 animate-spin" />
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles text-[9px]" />
            )}
            AI tối ưu
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={!isCompleteEnabled}
            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[10px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
            style={
              isCompleteEnabled
                ? {
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#fff',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                }
                : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#475569',
                }
            }
          >
            Tiếp theo
            <i className="fa-solid fa-arrow-right text-[9px]" />
          </button>
        </div>
      </div>

      {/* ── Dòng 2: Các trường nhập liệu ───────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        {/* Vị trí */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '160px',
            flex: '1 1 140px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Vị trí
          </span>
          <input
            type="text"
            placeholder="VD: Senior Frontend Developer"
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Công ty */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '130px',
            flex: '1 1 110px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Công ty
          </span>
          <input
            type="text"
            placeholder="VD: TechCorp Vietnam"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Ngành */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '120px',
            flex: '1 1 100px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Ngành
          </span>
          <input
            type="text"
            placeholder="VD: Công nghệ thông tin"
            value={hardFilters.industry}
            onChange={(e) =>
              setHardFilters((prev) => ({
                ...prev,
                industry: e.target.value,
                industryManual: 'manual',
              }))
            }
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Lương */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '130px',
            flex: '1 1 110px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Lương
          </span>
          <input
            type="text"
            placeholder="VD: 15–25 triệu"
            value={hardFilters.salaryMin}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, salaryMin: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Kinh nghiệm */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '140px',
            flex: '1 1 120px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Kinh nghiệm
          </span>
          <input
            type="text"
            placeholder="VD: 3+ năm"
            value={hardFilters.minExp}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, minExp: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* ── Toast messages ──────────────────────────────────── */}
      {(summarizeMsg || summarizeError) && (
        <div className="px-4 pb-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium"
            style={
              summarizeMsg
                ? { background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }
                : { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
            }
          >
            <i className={`fa-solid ${summarizeMsg ? 'fa-circle-check text-[10px]' : 'fa-circle-exclamation text-[10px]'}`} />
            {summarizeMsg || summarizeError}
          </div>
        </div>
      )}
    </div>
  );
};

export default JDMetaToolbar;
