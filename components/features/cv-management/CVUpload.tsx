import React, { useState, useCallback, memo, useMemo } from 'react';
import type { Candidate, HardFilters, WeightCriteria, AppStep } from '../../../assets/types';
import { analyzeCVs } from '../../../services/ai-ml/models/gemini/geminiService';
import { googleDriveService } from '../../../services/file-processing/googleDriveService';

interface CVUploadProps {
  cvFiles: File[];
  setCvFiles: React.Dispatch<React.SetStateAction<File[]>>;
  jdText: string;
  weights: WeightCriteria;
  hardFilters: HardFilters;
  setAnalysisResults: React.Dispatch<React.SetStateAction<Candidate[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;
  onAnalysisStart: () => void;
  completedSteps: AppStep[];
}

const MAX_CV_PER_BATCH = 20;

const CVUpload: React.FC<CVUploadProps> = memo((props) => {
  const { cvFiles, setCvFiles, jdText, weights, hardFilters, setAnalysisResults, setIsLoading, setLoadingMessage, onAnalysisStart, completedSteps } = props;
  const [error, setError] = useState('');
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  const readyForAnalysis = useMemo(() => {
    const requiredSteps: AppStep[] = ['jd', 'weights'];
    return requiredSteps.every((step) => completedSteps.includes(step));
  }, [completedSteps]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      setCvFiles((prev: File[]) => {
        const existingMap = new Map(prev.map((f: File) => [`${f.name}-${f.size}`, true]));
        const uniqueNewFiles = newFiles.filter((f: File) => !existingMap.has(`${f.name}-${f.size}`));

        if (uniqueNewFiles.length === 0) return prev;

        const totalFiles = prev.length + uniqueNewFiles.length;

        if (totalFiles > MAX_CV_PER_BATCH) {
          setError(`Chỉ được phép tải lên tối đa ${MAX_CV_PER_BATCH} CV. Bạn đang có ${prev.length} và muốn thêm ${uniqueNewFiles.length}.`);
          return prev;
        }

        setError('');
        return [...prev, ...uniqueNewFiles];
      });

      e.target.value = '';
    }
  };

  const handleGoogleDriveSelect = async () => {
    try {
      const token = await googleDriveService.authenticate();
      const driveFiles = await googleDriveService.openPicker({
        mimeTypes: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: true
      });

      if (driveFiles.length > 0) {
        setIsLoading(true);
        setLoadingMessage(`Đang tải ${driveFiles.length} file từ Drive...`);

        const newFiles: File[] = [];
        for (const dFile of driveFiles) {
            try {
                const blob = await googleDriveService.downloadFile(dFile.id, token);
                const file = new File([blob], dFile.name, { type: dFile.mimeType });
                newFiles.push(file);
            } catch (err) {
                console.error(`Failed to download ${dFile.name}`, err);
            }
        }

        if (newFiles.length > 0) {
             setCvFiles((prev: File[]) => {
                const existingMap = new Map(prev.map(f => [`${f.name}-${f.size}`, true]));
                const uniqueNewFiles = newFiles.filter(f => !existingMap.has(`${f.name}-${f.size}`));

                if (uniqueNewFiles.length === 0) return prev;

                const totalFiles = prev.length + uniqueNewFiles.length;
                if (totalFiles > MAX_CV_PER_BATCH) {
                  setError(`Chỉ được phép tải lên tối đa ${MAX_CV_PER_BATCH} CV. Bạn đang có ${prev.length} và muốn thêm ${uniqueNewFiles.length}.`);
                  return prev;
                }

                setError('');
                return [...prev, ...uniqueNewFiles];
              });
        }
      }
    } catch (err: any) {
      console.error("Google Drive Error:", err);
      if (err.message && (err.message.includes('Client ID') || err.message.includes('API Key'))) {
         setError('Chưa cấu hình Google Drive API. Vui lòng kiểm tra file .env');
      } else {
         setError('Lỗi khi kết nối Google Drive. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleAnalyzeClick = async () => {
    const requiredSteps: AppStep[] = ['jd', 'weights'];
    const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));

    if (missingSteps.length > 0) {
      const stepNames = missingSteps.map(s => {
        if (s === 'jd') return 'Mô tả công việc';
        if (s === 'weights') return 'Phân bổ trọng số';
        return s;
      }).join(', ');
      setError(`Vui lòng hoàn thành các bước trước: ${stepNames}.`);
      return;
    }

    if (cvFiles.length === 0) {
      setError('Vui lòng chọn ít nhất một tệp CV để phân tích.');
      return;
    }

    setError('');
    setIsLoading(true);
    onAnalysisStart();
    setAnalysisResults([]);

    try {
      const analysisGenerator = analyzeCVs(jdText, weights, hardFilters, cvFiles);
      for await (const result of analysisGenerator) {
        if (result.status === 'progress') {
          setLoadingMessage(result.message);
        } else {
          setAnalysisResults(prev => [...prev, result as Candidate]);
        }
      }
    } catch (err) {
      console.error("Lỗi phân tích CV:", err);
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';

      setError(message);

      setAnalysisResults(prev => {
        if (prev.some(c => c.candidateName === 'Lỗi Hệ Thống')) return prev;
        return [...prev, {
          id: `system-error-${Date.now()}`,
          status: 'FAILED',
          error: message,
          candidateName: 'Lỗi Hệ Thống',
          fileName: 'N/A',
          jobTitle: '',
          industry: '',
          department: '',
          experienceLevel: '',
          detectedLocation: '',
        }];
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('Hoàn tất phân tích!');
    }
  };

  const handleRemoveFile = useCallback((index: number) => {
    setCvFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, [setCvFiles]);

  const handleClearFiles = useCallback(() => {
    setCvFiles([]);
  }, [setCvFiles]);

  return (
    <section id="module-upload" className="module-pane active relative w-full h-[calc(100vh)] min-h-[400px] flex flex-col" style={{ background: 'linear-gradient(180deg, #0a1220 0%, #0d1628 100%)' }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(99,102,241,0.06)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(59,130,246,0.05)' }} />

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="shrink-0 border-b"
        style={{
          background: 'linear-gradient(180deg, #0c1628 0%, #0a1220 100%)',
          borderColor: 'rgba(99,102,241,0.18)',
        }}
      >
        {/* Dòng 1: Tiêu đề */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Accent bar */}
          <div
            className="h-8 w-[3px] rounded-full shrink-0"
            style={{ background: 'linear-gradient(180deg, #3b82f6, #6366f1)' }}
          />

          <div className="min-w-0">
            <h1
              className="text-base font-bold leading-tight tracking-tight"
              style={{ color: '#f1f5f9' }}
            >
              Tải lên & Phân tích CV
            </h1>
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5"
              style={{ color: 'rgba(59,130,246,0.7)' }}
            >
              CV Upload & AI Analysis
            </p>
          </div>

          {/* Mô tả phụ */}
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] font-medium" style={{ color: 'rgba(148,163,184,0.6)' }}>
              Tải CV · Kiểm tra · Phân tích bằng AI
            </span>
          </div>

          {/* Status badges */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={
                completedSteps.includes('jd')
                  ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                  : { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }
              }
            >
              JD {completedSteps.includes('jd') ? '✓' : '○'}
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={
                completedSteps.includes('weights')
                  ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                  : { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }
              }
            >
              Trọng số {completedSteps.includes('weights') ? '✓' : '○'}
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
            >
              {cvFiles.length} / {MAX_CV_PER_BATCH} CV
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10 w-full">
        <div className="w-full h-full p-4 lg:p-6 lg:px-8 overflow-y-auto custom-scrollbar">

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column: Upload & Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Upload Zone */}
              <div className="relative group">
                 <div className="relative rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                     <div
                       className="w-16 h-16 mx-auto rounded-2xl mb-4"
                       style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}
                     />
                     <h4 className="text-base font-medium mb-0.5 text-white">Kéo thả hoặc chọn file</h4>
                     <p className="text-[10px] mb-3" style={{ color: '#475569' }}>PDF, DOCX, PNG, JPG (Tối đa {MAX_CV_PER_BATCH} file)</p>

                    {/* Upload Buttons */}
                    <div className="flex flex-col gap-2">
                        {!showUploadOptions ? (
                            <button
                                onClick={() => setShowUploadOptions(true)}
                                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 4px 15px rgba(99,102,241,0.2)' }}
                            >
                                Tải CV lên
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                                <label className="cursor-pointer py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                                    Từ máy
                                    <input type="file" multiple accept=".pdf,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
                                </label>
                                <button onClick={handleGoogleDriveSelect} className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                                    Google Drive
                                </button>
                                <button onClick={() => setShowUploadOptions(false)} className="col-span-2 py-1 text-xs" style={{ color: '#475569' }}>Hủy bỏ</button>
                            </div>
                        )}
                    </div>
                 </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeClick}
                disabled={cvFiles.length === 0 || !readyForAnalysis}
                className="w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3"
                style={
                  cvFiles.length > 0 && readyForAnalysis
                    ? { background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: '1px solid rgba(99,102,241,0.35)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', cursor: 'not-allowed' }
                }
              >
                {cvFiles.length > 0 && readyForAnalysis ? 'Phân tích ngay' : 'Chưa sẵn sàng'}
                <span className="text-[10px] opacity-80">→</span>
              </button>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="h-full w-[3px] rounded-full shrink-0" style={{ background: '#ef4444' }} />
                  <p className="text-xs font-medium" style={{ color: '#fca5a5' }}>{error}</p>
                </div>
              )}

              {/* Mini Checklist */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h5 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Yêu cầu trước khi phân tích</h5>
                <ul className="space-y-2 text-xs">
                   <li className="flex items-center gap-2" style={{ color: completedSteps.includes('jd') ? '#34d399' : '#475569' }}>
                     <span className="w-4 text-center">{completedSteps.includes('jd') ? '✓' : '○'}</span> Có mô tả công việc (JD)
                   </li>
                   <li className="flex items-center gap-2" style={{ color: completedSteps.includes('weights') ? '#34d399' : '#475569' }}>
                     <span className="w-4 text-center">{completedSteps.includes('weights') ? '✓' : '○'}</span> Đã phân bổ trọng số
                   </li>
                   <li className="flex items-center gap-2" style={{ color: cvFiles.length > 0 ? '#34d399' : '#475569' }}>
                     <span className="w-4 text-center">{cvFiles.length > 0 ? '✓' : '○'}</span> Đã chọn CV ({cvFiles.length})
                   </li>
                </ul>
              </div>
            </div>

            {/* Right Column: File List (7 cols) */}
            <div className="lg:col-span-7 flex flex-col rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
               <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 className="font-medium text-sm text-white">Danh sách hồ sơ</h4>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded" style={{ color: '#818cf8' }} title="Thêm từ máy tính">
                        <input type="file" multiple accept=".pdf,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
                        Thêm file
                    </label>
                    <button onClick={handleGoogleDriveSelect} className="text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded" style={{ color: '#34d399' }} title="Thêm từ Google Drive">
                        Google Drive
                    </button>
                    {cvFiles.length > 0 && (
                        <>
                            <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                            <button onClick={handleClearFiles} className="text-xs transition-colors px-2 py-1 rounded" style={{ color: '#f87171' }}>
                            Xóa tất cả
                            </button>
                        </>
                    )}
                  </div>
               </div>

               <div className="overflow-y-auto p-3 custom-scrollbar" style={{ maxHeight: '420px', minHeight: '140px' }}>
                  {cvFiles.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center space-y-3 py-12" style={{ color: '#334155' }}>
                        <div className="w-12 h-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                        <p className="text-sm">Chưa có CV nào được chọn</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {cvFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="group flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                           <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }} />
                           <div className="flex-1 min-w-0">
                             <p className="text-sm truncate" style={{ color: '#cbd5e1' }}>{file.name}</p>
                             <p className="text-[10px]" style={{ color: '#475569' }}>{(file.size / 1024).toFixed(1)} KB</p>
                           </div>
                           <button onClick={() => handleRemoveFile(index)} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors" style={{ color: '#475569' }}
                             onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                             onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
                             ×
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* Footer Info */}
               <div className="p-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#334155', fontSize: '10px' }}>
                  Nhóm CV theo vị trí để AI phân tích chính xác nhất
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

CVUpload.displayName = 'CVUpload';

export default CVUpload;
