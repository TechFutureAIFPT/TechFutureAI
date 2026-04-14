import React from "react";
import type { AppStep } from "../../../../assets/types";

interface MobileBottomNavProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
  onNavigate: (step: AppStep) => void;
}

type NavItem = {
  step: AppStep;
  label: string;
  iconClass: string;
};

const items: NavItem[] = [
  { step: "jd", label: "JD", iconClass: "fa-solid fa-file-lines" },
  { step: "weights", label: "Trọng số", iconClass: "fa-solid fa-sliders" },
  { step: "upload", label: "Tải CV", iconClass: "fa-solid fa-cloud-arrow-up" },
  { step: "analysis", label: "Phân tích", iconClass: "fa-solid fa-chart-line" },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeStep,
  completedSteps,
  onNavigate,
}) => {
  const isEnabled = (step: AppStep) => {
    if (step === "jd") return true;
    if (step === "weights") return completedSteps.includes("jd");
    if (step === "upload") return completedSteps.includes("jd") && completedSteps.includes("weights");
    if (step === "analysis")
      return (
        completedSteps.includes("jd") &&
        completedSteps.includes("weights") &&
        completedSteps.includes("upload")
      );
    return true;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-35 opacity-100">
      <div
        className="mx-2 mb-2 rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-between h-16 px-2">
          {items.map((item) => {
            const enabled = isEnabled(item.step);
            const isActive = activeStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => enabled && onNavigate(item.step)}
                disabled={!enabled}
                className={`flex flex-col items-center justify-center flex-1 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/12 text-cyan-300 border border-cyan-400/25 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                } ${!enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={item.label}
              >
                <i className={`${item.iconClass} text-lg`} />
                <span className="text-[10px] font-semibold mt-1 leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;

