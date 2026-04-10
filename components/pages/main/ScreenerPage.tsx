import React, { Suspense, lazy, useState, useCallback } from 'react';
import type { AppStep, Candidate, HardFilters, WeightCriteria } from '../../../assets/types';
import JDInput from '../../features/criteria-config/JDInput';
import JDMetaToolbar from '../../features/criteria-config/JDMetaToolbar';
import CVScreenerWelcome from './CVScreenerWelcome';

const WeightsConfig = lazy(() => import('../../features/criteria-config/WeightsConfig'));
const CVUpload = lazy(() => import('../../features/cv-management/CVUpload'));
const AnalysisResults = lazy(() => import('../../features/cv-management/AnalysisResults'));

const STEPS = [
  { key: 'jd', label: 'Nhập JD', icon: 'fa-wand-magic-sparkles', sub: 'JOB DESCRIPTION ANALYTICS' },
  { key: 'weights', label: 'Trọng số', icon: 'fa-sliders', sub: 'BƯỚC 2: TRỌNG SỐ & BỘ LỌC' },
  { key: 'upload', label: 'Tải CV', icon: 'fa-cloud-arrow-up', sub: 'BƯỚC 3: DỮ LIỆU ĐẦU VÀO' },
  { key: 'analysis', label: 'Kết quả', icon: 'fa-chart-line', sub: 'BƯỚC 4: KẾT QUẢ PHÂN TÍCH' },
  { key: 'chatbot', label: 'AI Chat', icon: 'fa-robot', sub: 'AI CHATBOT ADVISOR' },
] as const;

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center h-40 gap-4">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan-400 border-r-cyan-400/40 animate-spin"
        style={{ animationDuration: '0.8s' }} />
      <div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-b-indigo-400 border-l-indigo-400/40 animate-spin"
        style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
    </div>
    <span className="text-[10px] uppercase tracking-[0.3em] font-semibold animate-pulse text-slate-600">
      Đang tải...</span>
  </div>
);

interface ScreenerPageProps {
  jdText: string;
  setJdText: React.Dispatch<React.SetStateAction<string>>;
  jobPosition: string;
  setJobPosition: React.Dispatch<React.SetStateAction<string>>;
  weights: WeightCriteria;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  cvFiles: File[];
  setCvFiles: React.Dispatch<React.SetStateAction<File[]>>;
  analysisResults: Candidate[];
  setAnalysisResults: React.Dispatch<React.SetStateAction<Candidate[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMessage: string;
  setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;
  activeStep: AppStep;
  setActiveStep: (step: AppStep) => void;
  completedSteps: AppStep[];
  markStepAsCompleted: (step: AppStep) => void;
  onWelcomeChange?: (visible: boolean) => void;
}

const ScreenerPage: React.FC<ScreenerPageProps> = (props) => {
  const { activeStep } = props;
  const [showWelcome, setShowWelcome] = useState<boolean>(() => props.jdText.trim().length === 0);

  const hideWelcome = useCallback(() => {
    setShowWelcome(false);
    props.onWelcomeChange?.(false);
  }, [props.onWelcomeChange]);

  const handleFileProcessed = useCallback((data: {
    jdText: string;
    jobPosition: string;
    hardFilters: Partial<HardFilters>;
  }) => {
    props.setJdText(data.jdText);
    if (data.jobPosition) props.setJobPosition(data.jobPosition);
    if (data.hardFilters && Object.keys(data.hardFilters).length > 0) {
      props.setHardFilters((prev) => ({ ...prev, ...data.hardFilters }));
    }
    hideWelcome();
  }, [props.setJdText, props.setJobPosition, props.setHardFilters, hideWelcome]);

  if (activeStep === 'jd' && showWelcome) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <CVScreenerWelcome
          onGetStarted={hideWelcome}
          onFileProcessed={handleFileProcessed}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#040814]">
      {activeStep === 'jd' && (
        <JDMetaToolbar
          jdText={props.jdText}
          setJdText={props.setJdText}
          jobPosition={props.jobPosition}
          setJobPosition={props.setJobPosition}
          hardFilters={props.hardFilters}
          setHardFilters={props.setHardFilters}
          onComplete={() => {
            props.markStepAsCompleted('jd');
            props.setActiveStep('weights');
          }}
          onBackToWelcome={() => setShowWelcome(true)}
        />
      )}

      {/* Tiêu đề (khi không phải JD — đã gộp vào toolbar) + stepper gọn */}
      <div className={`shrink-0 border-b border-slate-800/60 bg-[#040814] px-3 py-2 md:px-5 ${activeStep === 'jd' ? 'hidden' : ''}`}>
        <div
          className={`flex flex-col gap-2 md:flex-row md:items-center md:gap-3 ${
            activeStep === 'jd' ? '' : 'md:justify-between'
          }`}
        >
          {activeStep !== 'jd' && (
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/15">
                <i className="fa-solid fa-users-viewfinder text-sm text-cyan-400" aria-hidden />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight text-white">Sàng lọc ứng viên</h1>
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">Recruitment Intelligence</p>
              </div>
            </div>
          )}

          <div
            className={`flex min-w-0 flex-1 items-center gap-0 overflow-x-auto [-webkit-overflow-scrolling:touch] pb-0.5 md:pb-0 ${
              activeStep === 'jd' ? 'md:justify-start' : 'md:justify-end'
            }`}
          >
            {STEPS.map((step, idx) => {
              const isActive = activeStep === step.key;
              const isCompleted = props.completedSteps.includes(step.key as AppStep);
              const isClickable = !['chatbot'].includes(step.key) || isActive;

              return (
                <React.Fragment key={step.key}>
                  <button
                    onClick={() => isClickable && !isActive && props.setActiveStep(step.key as AppStep)}
                    disabled={!isClickable}
                    className={`
                      flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all duration-200
                      ${isActive
                        ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : isCompleted
                          ? 'cursor-pointer border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                          : 'border border-slate-700/50 bg-slate-800/40 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                      }
                      ${!isClickable ? 'cursor-default' : 'cursor-pointer'}
                    `}
                  >
                    {isCompleted ? (
                      <i className="fa-solid fa-check-circle text-[9px]" />
                    ) : (
                      <i className={`${step.icon} text-[9px] ${isActive ? 'text-cyan-300' : ''}`} />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`mx-1 h-px min-w-[0.75rem] flex-1 sm:mx-1.5 ${
                        isCompleted ? 'bg-emerald-500/40' : 'bg-slate-800/60'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Nội dung module ────────────────────────────────────── */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          activeStep === 'jd' || activeStep === 'analysis'
            ? 'overflow-hidden'
            : 'custom-scrollbar overflow-y-auto'
        }`}
      >
        <div className={activeStep === 'jd' ? 'flex h-full min-h-0 flex-1 flex-col' : 'hidden'}>
          <JDInput
            hideToolbar
            jdText={props.jdText}
            setJdText={props.setJdText}
            jobPosition={props.jobPosition}
            setJobPosition={props.setJobPosition}
            hardFilters={props.hardFilters}
            setHardFilters={props.setHardFilters}
            onComplete={() => {
              props.markStepAsCompleted('jd');
              props.setActiveStep('weights');
            }}
            onBackToWelcome={() => setShowWelcome(true)}
          />
        </div>

        <div className={activeStep === 'weights' ? 'block h-full' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <WeightsConfig
              weights={props.weights}
              setWeights={props.setWeights}
              hardFilters={props.hardFilters}
              setHardFilters={props.setHardFilters}
              onComplete={() => {
                props.markStepAsCompleted('weights');
                props.setActiveStep('upload');
              }}
            />
          </Suspense>
        </div>

        <div className={activeStep === 'upload' ? 'block h-full' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <CVUpload
              cvFiles={props.cvFiles}
              setCvFiles={props.setCvFiles}
              jdText={props.jdText}
              weights={props.weights}
              hardFilters={props.hardFilters}
              setAnalysisResults={props.setAnalysisResults}
              setIsLoading={props.setIsLoading}
              setLoadingMessage={props.setLoadingMessage}
              onAnalysisStart={() => {
                props.markStepAsCompleted('upload');
                props.setActiveStep('analysis');
              }}
              completedSteps={props.completedSteps}
            />
          </Suspense>
        </div>

        <div className={activeStep === 'analysis' ? 'flex h-full min-h-0 flex-1 flex-col' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <AnalysisResults
              isLoading={props.isLoading}
              loadingMessage={props.loadingMessage}
              results={props.analysisResults}
              jobPosition={props.jobPosition}
              locationRequirement={props.hardFilters.location}
              jdText={props.jdText}
              setActiveStep={props.setActiveStep}
              markStepAsCompleted={props.markStepAsCompleted}
            />
          </Suspense>
        </div>

        <div className={activeStep === 'chatbot' ? 'block h-full' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <div className="p-4"><ModuleLoader /></div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ScreenerPage;
