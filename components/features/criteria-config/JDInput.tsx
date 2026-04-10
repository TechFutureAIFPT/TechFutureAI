import React, { useState } from 'react';
import { filterAndStructureJD, extractJobPositionFromJD } from '../../../services/ai-ml/gemini/geminiService';
import type { HardFilters } from '../../../assets/types';

interface JDInputProps {
  jdText: string;
  setJdText: React.Dispatch<React.SetStateAction<string>>;
  jobPosition: string;
  setJobPosition: React.Dispatch<React.SetStateAction<string>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  onComplete: () => void;
  onBackToWelcome?: () => void;
  /** Khi true: chỉ hiển thị ô JD (toolbar nằm ở ScreenerPage phía trên header) */
  hideToolbar?: boolean;
}

const JDInput: React.FC<JDInputProps> = ({
  jdText,
  setJdText,
  jobPosition,
  setJobPosition,
  hardFilters,
  setHardFilters,
  onComplete,
  onBackToWelcome,
  hideToolbar = false,
}) => {
  const isCompleteEnabled = jdText.trim().length > 50 && jobPosition.trim().length > 3;
  const characterCount = jdText.length;

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
        setSummarizeMsg(`Đã tối ưu JD và trích xuất chức danh: ${extractedPosition}`);
      } else {
        setSummarizeMsg('Đã tối ưu JD bằng AI.');
      }
      setTimeout(() => setSummarizeMsg(''), 5000);
    } catch (error) {
      setSummarizeError('Dịch vụ AI đang gặp sự cố. Vui lòng thử lại.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (hideToolbar) {
    return (
      <section
        id="module-jd"
        className="module-pane active custom-scrollbar flex h-full min-h-0 w-full flex-1 flex-col"
        aria-labelledby="jd-title"
      >
        <textarea
          className="custom-scrollbar min-h-0 w-full flex-1 resize-none border-none p-5 text-sm leading-[1.75] text-slate-200 outline-none placeholder:text-slate-500 focus:ring-0 font-mono"
          rows={12}
          style={{ background: 'transparent' }}
          placeholder={
            'Paste the Job Description here...\n\nInclude role title, responsibilities, required skills, experience level, and any other relevant details.'
          }
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          spellCheck={false}
        />
        <div
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(100,116,139,0.4)', padding: '0 20px 20px', textAlign: 'right' }}
        >
          {characterCount > 0 ? `${characterCount} ký tự` : 'Bắt đầu nhập JD'}
        </div>
      </section>
    );
  }

  return (
    <section
      id="module-jd"
      className="module-pane active flex h-full min-h-0 w-full flex-col"
      aria-labelledby="jd-title"
    >
      {/* ── Header bar (tách rời) ───────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-2 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Job Position */}
        <div
          className="group flex min-w-[150px] flex-1 items-center rounded-lg px-3 py-2 transition-all focus-within:ring-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            '--tw-ring-color': 'rgba(99,102,241,0.5)',
          }}
        >
          <i className="fa-solid fa-briefcase text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Vị trí công việc..."
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        {/* Company */}
        <div
          className="group flex min-w-[130px] flex-1 items-center rounded-lg px-3 py-2 transition-all focus-within:ring-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            '--tw-ring-color': 'rgba(99,102,241,0.5)',
          }}
        >
          <i className="fa-regular fa-building text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Công ty..."
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        {/* Industry */}
        <div
          className="group flex min-w-[130px] flex-1 items-center rounded-lg px-3 py-2 transition-all focus-within:ring-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            '--tw-ring-color': 'rgba(99,102,241,0.5)',
          }}
        >
          <i className="fa-solid fa-layer-group text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Ngành nghề..."
            value={hardFilters.industry}
            onChange={(e) =>
              setHardFilters((prev) => ({
                ...prev,
                industry: e.target.value,
                industryManual: 'manual',
              }))
            }
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        {/* Salary */}
        <div
          className="group flex min-w-[120px] flex-1 items-center rounded-lg px-3 py-2 transition-all focus-within:ring-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            '--tw-ring-color': 'rgba(99,102,241,0.5)',
          }}
        >
          <i className="fa-solid fa-money-bill text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Mức lương..."
            value={hardFilters.salaryMin}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, salaryMin: e.target.value }))}
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1.5 pl-1">
          <button
            onClick={handleSummarizeJD}
            disabled={isSummarizing || jdText.trim().length < 200}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-white/5 hover:text-purple-400 disabled:opacity-40"
            title="Tối ưu hóa bằng AI"
          >
            {isSummarizing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-purple-400" />
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles text-sm" />
            )}
          </button>

          {onBackToWelcome && (
            <button
              onClick={onBackToWelcome}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-white/5 hover:text-indigo-400"
              title="Quay lại tải file"
            >
              <i className="fa-solid fa-file-arrow-up text-xs" />
            </button>
          )}

          <button
            onClick={onComplete}
            disabled={!isCompleteEnabled}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30"
            style={isCompleteEnabled ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8' } : {}}
            title="Kế tiếp"
          >
            <i className="fa-solid fa-arrow-right text-xs" />
          </button>
        </div>
      </div>

      {/* ── Textarea full area (không viền, không khung) ──── */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <textarea
          className="custom-scrollbar min-h-0 w-full flex-1 resize-none border-none bg-transparent p-5 text-sm leading-[1.75] text-slate-300 outline-none placeholder:text-slate-700 focus:ring-0 font-mono"
          placeholder={
            'Paste the Job Description here...\n\nInclude role title, responsibilities, required skills, experience level, and any other relevant details.'
          }
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          spellCheck={false}
        />

        {/* Character count */}
        <div className="pointer-events-none absolute right-5 top-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.5)' }}>
          {characterCount > 0 ? `${characterCount} ký tự` : ''}
        </div>

        {/* Success toast */}
        {summarizeMsg && !isSummarizing && (
          <div
            className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-6 left-6 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium shadow-2xl"
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(34,211,238,0.25)',
              color: '#22d3ee',
              backdropFilter: 'blur(12px)',
            }}
          >
            <i className="fa-solid fa-circle-check text-xs" />
            {summarizeMsg}
          </div>
        )}

        {/* Error toast */}
        {summarizeError && (
          <div
            className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-6 left-6 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium shadow-2xl"
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(248,113,113,0.25)',
              color: '#f87171',
              backdropFilter: 'blur(12px)',
            }}
          >
            <i className="fa-solid fa-circle-exclamation text-xs" />
            {summarizeError}
          </div>
        )}
      </div>
    </section>
  );
};

export default JDInput;
