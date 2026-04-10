/**
 * ProgressBar (Step Indicator) — Chỉ hỗ trợ Dark Mode
 */
import React from 'react';
import type { AppStep } from '../../../assets/types';

interface ProgressBarProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ activeStep, completedSteps }) => {
  const steps = [
    { key: 'jd' as AppStep, label: 'JD', icon: 'fa-clipboard-list' },
    { key: 'weights' as AppStep, label: 'Trọng số', icon: 'fa-sliders' },
    { key: 'upload' as AppStep, label: 'CV', icon: 'fa-file-arrow-up' },
    { key: 'analysis' as AppStep, label: 'AI', icon: 'fa-rocket' },
  ];

  const getStepIndex = (step: AppStep): number => steps.findIndex(s => s.key === step);
  const activeIndex = getStepIndex(activeStep);
  const progress = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="md:hidden w-full mb-4 px-2 mt-2">
      <div className="backdrop-blur-md border rounded-xl p-4 shadow-xl bg-[#0f172a]/90 border-slate-800">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 -z-10 bg-slate-700" />

          {/* Active progress line */}
          <div
            className="absolute top-4 left-0 h-0.5 transition-all duration-500 ease-out -z-10 bg-gradient-to-r from-cyan-400 to-blue-500"
            style={{ width: `${progress}%` }}
          />

          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.key);
            const isActive = activeStep === step.key;

            const circleClass = isActive
              ? 'bg-slate-900 border-2 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] scale-110'
              : isCompleted
                ? 'bg-slate-900 border-2 border-emerald-500 text-emerald-500'
                : 'bg-slate-800 border-2 border-slate-700 text-slate-500';

            const textClass = isActive
              ? 'text-cyan-400 font-bold'
              : isCompleted
                ? 'text-emerald-500 font-medium'
                : 'text-slate-500';

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10 group cursor-default">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs
                  transition-all duration-300
                  ${circleClass}
                  ${isActive ? 'animate-pulse' : ''}
                `}>
                  <i className={`fa-solid ${step.icon}`} />
                </div>
                <span className={`text-[10px] mt-1.5 transition-colors duration-300 ${textClass}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
