import React, { useEffect, useState, useCallback, useRef } from 'react';
import { extractTextFromJdFile } from '../../../services/file-processing/ocrService';
import { extractJobPositionFromJD, filterAndStructureJD, extractHardFiltersFromJD } from '../../../services/ai-ml/models/gemini/geminiService';
import { googleDriveService } from '../../../services/file-processing/googleDriveService';
import type { HardFilters } from '../../../assets/types';

interface CVScreenerWelcomeProps {
  onGetStarted: () => void;
  onFileProcessed: (data: {
    jdText: string;
    jobPosition: string;
    hardFilters: Partial<HardFilters>;
  }) => void;
}

const PROCESSING_STEPS = [
  'Đang đọc file...',
  'Đang cấu trúc JD bằng AI...',
  'Đang trích xuất chức danh...',
  'Đang phân tích tiêu chí lọc...',
];

const CVScreenerWelcome: React.FC<CVScreenerWelcomeProps> = ({ onGetStarted, onFileProcessed }) => {
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      setProcessingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setProcessingStep((s) => (s + 1) % PROCESSING_STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setErrorMsg('');
      setProcessingStep(0);
      try {
        const rawText = await extractTextFromJdFile(file, (msg) => {
          if (msg.includes('PDF') || msg.includes('docx')) setProcessingStep(0);
        });
        if (!rawText || rawText.trim().length < 50) {
          throw new Error('Không trích xuất được nội dung. Hãy thử file khác trên Drive hoặc nhập tay.');
        }
        setProcessingStep(1);
        const structuredJd = await filterAndStructureJD(rawText);
        setProcessingStep(2);
        const jobPos = await extractJobPositionFromJD(structuredJd);
        setProcessingStep(3);
        const extracted = await extractHardFiltersFromJD(structuredJd);

        const mandatoryUpdates: Partial<HardFilters> = {};
        if (extracted?.location) (mandatoryUpdates as any).locationMandatory = true;
        if (extracted?.minExp) (mandatoryUpdates as any).minExpMandatory = true;
        if (extracted?.seniority) (mandatoryUpdates as any).seniorityMandatory = true;
        if (extracted?.education) (mandatoryUpdates as any).educationMandatory = true;
        if (extracted?.language) (mandatoryUpdates as any).languageMandatory = true;
        if (extracted?.certificates) (mandatoryUpdates as any).certificatesMandatory = true;
        if (extracted?.workFormat) (mandatoryUpdates as any).workFormatMandatory = true;
        if (extracted?.contractType) (mandatoryUpdates as any).contractTypeMandatory = true;

        onFileProcessed({
          jdText: structuredJd,
          jobPosition: jobPos || '',
          hardFilters: { ...(extracted || {}), ...mandatoryUpdates },
        });
      } catch (err: any) {
        const msg = err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
        setErrorMsg(
          msg.includes('network') || msg.includes('fetch') ? 'Lỗi kết nối. Vui lòng kiểm tra mạng.' : msg
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleGoogleDrive = async () => {
    try {
      const token = await googleDriveService.authenticate();
      const driveFiles = await googleDriveService.openPicker({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: false,
      });
      if (driveFiles.length > 0) {
        setIsProcessing(true);
        setProcessingStep(0);
        const blob = await googleDriveService.downloadFile(driveFiles[0].id, token);
        const file = new File([blob], driveFiles[0].name, { type: driveFiles[0].mimeType });
        await processFile(file);
      }
    } catch {
      setErrorMsg('Không kết nối được Google Drive.');
    }
  };

  return (
    <div
      className={`
        relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[#040814]
        transition-all duration-700
        ${mounted ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1px),transparent 1px),linear-gradient(90deg,rgba(255,255,255,1px),transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at 50% 35%, black 8%, transparent 65%)',
        }}
      />
      <div className="pointer-events-none absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-cyan-700/[0.07] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[380px] w-[380px] rounded-full bg-violet-700/[0.06] blur-[100px]" />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center px-4 py-2 sm:max-w-lg sm:px-5">
        <div
          className={`flex flex-col items-center gap-1.5 transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
              <img src="/images/logos/logo.jpg" alt="SupportHR" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold leading-none text-white sm:text-sm">SupportHR</p>
              <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-400/90 sm:text-[9px]">
                Recruitment Intelligence
              </p>
            </div>
          </div>

          <h1 className="text-center text-lg font-black tracking-tight text-white sm:text-xl">
            Bắt đầu sàng lọc ứng viên
          </h1>
          <p className="mx-auto max-w-[19rem] text-center text-[11px] leading-snug text-slate-400 sm:max-w-sm sm:text-xs">
            <span className="font-medium text-violet-400">Tải file</span>,{' '}
            <span className="font-medium text-cyan-400">nhập tay</span> hoặc{' '}
            <span className="font-medium text-emerald-400/90">Google Drive</span> — AI sẽ phân tích JD.
          </p>

          <div
            className={`mt-2 w-full transition-all duration-700 delay-100 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/35 px-1.5 py-2 text-center transition-all hover:border-violet-400/40 hover:bg-violet-500/5 active:scale-[0.99] sm:rounded-xl sm:px-2 sm:py-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 shadow-sm shadow-violet-900/30 sm:h-9 sm:w-9 sm:rounded-xl">
                <i className="fa-solid fa-folder-open text-xs text-white sm:text-sm" />
              </div>
              <div>
                <p className="text-[10px] font-bold leading-tight text-slate-100 sm:text-[11px]">Tải file</p>
                <p className="mt-px text-[8px] leading-tight text-slate-500 sm:text-[9px]">PDF, DOCX, ảnh</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onGetStarted}
              className="flex flex-col items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/35 px-1.5 py-2 text-center transition-all hover:border-cyan-400/40 hover:bg-cyan-500/5 active:scale-[0.99] sm:rounded-xl sm:px-2 sm:py-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 shadow-sm shadow-cyan-900/30 sm:h-9 sm:w-9 sm:rounded-xl">
                <i className="fa-solid fa-keyboard text-xs text-white sm:text-sm" />
              </div>
              <div>
                <p className="text-[10px] font-bold leading-tight text-slate-100 sm:text-[11px]">Nhập tay</p>
                <p className="mt-px text-[8px] leading-tight text-slate-500 sm:text-[9px]">Dán nội dung JD</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleGoogleDrive}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/35 px-1.5 py-2 text-center transition-all hover:border-emerald-400/40 hover:bg-emerald-500/5 active:scale-[0.99] disabled:opacity-50 sm:rounded-xl sm:px-2 sm:py-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 shadow-sm shadow-emerald-900/30 sm:h-9 sm:w-9 sm:rounded-xl">
                <i className="fa-brands fa-google-drive text-xs text-white sm:text-sm" />
              </div>
              <div>
                <p className="text-[10px] font-bold leading-tight text-slate-100 sm:text-[11px]">Google Drive</p>
                <p className="mt-px text-[8px] leading-tight text-slate-500 sm:text-[9px]">Mở file trên Drive</p>
              </div>
            </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
        </div>

        {errorMsg && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-left text-xs text-red-300">
            <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0 text-[10px]" />
            <span className="min-w-0 flex-1 leading-snug">{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Đóng"
            >
              <i className="fa-solid fa-xmark text-[10px]" />
            </button>
          </div>
        )}

        <p className="mt-1.5 text-center text-[9px] leading-tight text-slate-600 sm:text-[10px]">
          JD có mục rõ ràng (vị trí, yêu cầu, kinh nghiệm) giúp AI chính xác hơn.
        </p>
      </div>

      {isProcessing && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ${
            isProcessing ? 'bg-[#040814]/70 opacity-100 backdrop-blur-sm' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-700/60 bg-[#0B1628] p-8 text-center shadow-2xl shadow-black/60">
            <div className="relative mx-auto mb-5 h-16 w-16">
              <div
                className="absolute inset-0 animate-ping rounded-full border-2 border-cyan-500/20"
                style={{ animationDuration: '2s' }}
              />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-slate-600/40 bg-gradient-to-br from-indigo-600/30 to-cyan-600/30">
                <i className="fa-solid fa-brain animate-pulse text-xl text-cyan-300" />
              </div>
            </div>
            <h3 className="mb-1 text-lg font-black text-white">AI đang xử lý</h3>
            <p className="mb-4 text-[11px] text-slate-400">Vui lòng chờ trong giây lát...</p>
            <div className="mb-4 space-y-1.5">
              {PROCESSING_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 text-[11px] transition-all duration-300 ${
                    processingStep === idx ? 'text-cyan-400 opacity-100' : 'text-slate-600 opacity-45'
                  }`}
                >
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all ${
                      processingStep === idx
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : processingStep > idx
                          ? 'border-emerald-400 bg-emerald-400/20'
                          : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {processingStep > idx ? (
                      <i className="fa-solid fa-check text-[7px] text-emerald-400" />
                    ) : processingStep === idx ? (
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                    ) : (
                      <div className="h-1 w-1 rounded-full bg-slate-600" />
                    )}
                  </div>
                  {step}
                </div>
              ))}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-[width] duration-500 ease-out"
                style={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVScreenerWelcome;
