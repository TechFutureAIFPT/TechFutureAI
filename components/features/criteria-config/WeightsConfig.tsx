import React, { useMemo, useState, useCallback, memo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { HardFilters, WeightCriteria, MainCriterion } from '../../../assets/types';
import HardFilterPanel from '../../ui/config/HardFilterPanel';
import WeightTile from '../../ui/config/WeightTile';
import TotalWeightDisplay from '../../ui/config/TotalWeightDisplay';

interface WeightsConfigProps {
  weights: WeightCriteria;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  onComplete: () => void;
}

const WeightsConfig: React.FC<WeightsConfigProps> = memo(({ weights, setWeights, hardFilters, setHardFilters, onComplete }) => {
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);
  const [validationErrorFilters, setValidationErrorFilters] = useState<string | null>(null);
  const [validationErrorWeights, setValidationErrorWeights] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const totalWeight = useMemo(() => {
    return Object.values(weights).reduce((total: number, criterion: MainCriterion) => {
      if (criterion.children) {
        return total + criterion.children.reduce((subTotal, child) => subTotal + child.weight, 0);
      }
      return total + (criterion.weight || 0);
    }, 0);
  }, [weights]);

  const remainingWeight = 100 - totalWeight;

  const weightStatus = useMemo(() => {
    if (totalWeight === 100) {
      return {
        label: 'Đạt chuẩn',
        desc: 'Tổng trọng số đạt 100%',
        tone: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: CheckCircle2,
        color: '#10b981',
        glow: 'shadow-emerald-500/20',
      };
    }
    if (totalWeight > 100) {
      return {
        label: 'Vượt ngưỡng',
        desc: `Thừa ${Math.abs(remainingWeight)}%`,
        tone: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/30',
        icon: AlertTriangle,
        color: '#ef4444',
        glow: 'shadow-red-500/20',
      };
    }
    return {
      label: 'Chưa đủ',
      desc: `Thiếu ${Math.abs(remainingWeight)}%`,
      tone: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: AlertTriangle,
      color: '#f59e0b',
      glow: 'shadow-amber-500/20',
    };
  }, [remainingWeight, totalWeight]);

  const primaryCriteria = useMemo(() => {
    return Object.values(weights).filter((c: MainCriterion) => c.children) as MainCriterion[];
  }, [weights]);

  const validateFilters = useCallback((): boolean => {
    setValidationErrorFilters(null);
    const mandatoryFieldsForValidation = [
      { key: 'location', label: 'Địa điểm làm việc' },
      { key: 'minExp', label: 'Kinh nghiệm tối thiểu' },
      { key: 'seniority', label: 'Cấp độ' },
      { key: 'education', label: 'Học vấn' },
      { key: 'industry', label: 'Ngành nghề' },
      { key: 'language', label: 'Ngôn ngữ' },
      { key: 'certificates', label: 'Chứng chỉ' },
      { key: 'salary', label: 'Lương' },
      { key: 'workFormat', label: 'Hình thức làm việc' },
      { key: 'contractType', label: 'Hợp đồng' },
    ];
    const invalidField = mandatoryFieldsForValidation.find(field => {
      const mandatoryKey = `${field.key}Mandatory` as keyof HardFilters;
      if (!hardFilters[mandatoryKey]) return false;
      if (field.key === 'salary') return !hardFilters.salaryMin && !hardFilters.salaryMax;
      const valueKey = field.key as keyof HardFilters;
      return !hardFilters[valueKey];
    });
    if (invalidField) {
      setValidationErrorFilters(`Vui lòng điền giá trị cho tiêu chí bắt buộc: ${invalidField.label}.`);
      return false;
    }
    return true;
  }, [hardFilters]);

  const handleFiltersComplete = useCallback(() => {
    if (!validateFilters()) return;
    setStep(2);
  }, [validateFilters]);

  const handleWeightsComplete = useCallback(() => {
    setValidationErrorWeights(null);
    if (totalWeight !== 100) {
      setValidationErrorWeights('Tổng trọng số phải bằng 100% trước khi tiếp tục.');
      return;
    }
    onComplete();
  }, [totalWeight, onComplete]);

  const mandatoryProgress = useMemo(() => {
    const keys = Object.keys(hardFilters).filter(k => k.endsWith('Mandatory')) as Array<keyof HardFilters>;
    const active = keys.filter(k => hardFilters[k]).length;
    const fulfilled = keys.filter(k => {
      if (!hardFilters[k]) return false;
      const valKey = k.replace('Mandatory', '') as keyof HardFilters;
      const val = hardFilters[valKey];
      return typeof val === 'string' ? val.trim().length > 0 : Boolean(val);
    }).length;
    return { active, fulfilled, percent: active ? Math.round((fulfilled / active) * 100) : 0 };
  }, [hardFilters]);

  const STEPS = [
    { num: 1, label: 'Bộ lọc cứng', color: '#6366f1', bg: 'from-indigo-500/15 to-indigo-600/10' },
    { num: 2, label: 'Phân bổ trọng số', color: '#8b5cf6', bg: 'from-violet-500/15 to-violet-600/10' },
  ];

  return (
    <section id="module-weights" className={`module-pane active relative w-full h-[calc(100vh)] min-h-[400px] flex flex-col bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a]`}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-violet-500/3 blur-3xl pointer-events-none" />

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="shrink-0 border-b"
        style={{
          background: 'linear-gradient(180deg, #0c1628 0%, #0a1220 100%)',
          borderColor: 'rgba(99,102,241,0.18)',
        }}
      >
        {/* Dòng 1: Logo + Tiêu đề */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Accent bar */}
          <div
            className="h-8 w-[3px] rounded-full shrink-0"
            style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
          />

          <div className="min-w-0">
            <h1
              className="text-base font-bold leading-tight tracking-tight"
              style={{ color: '#f1f5f9' }}
            >
              Phân bổ trọng số & Bộ lọc
            </h1>
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5"
              style={{ color: 'rgba(99,102,241,0.7)' }}
            >
              Weight Configuration & Hard Filters
            </p>
          </div>

          {/* Mô tả phụ */}
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] font-medium" style={{ color: 'rgba(148,163,184,0.6)' }}>
              Thiết lập mức độ quan trọng · Bộ lọc bắt buộc
            </span>
          </div>
        </div>

        {/* Dòng 2: Step indicator */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => { if (validateFilters() || s.num === 2) setStep(s.num as 1 | 2); }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300"
                  style={
                    isActive
                      ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', color: '#e2e8f0', boxShadow: '0 4px 20px -5px rgba(99,102,241,0.25)' }
                      : isDone
                        ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }
                  }
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                    style={
                      isActive
                        ? { background: 'rgba(99,102,241,0.25)', color: '#818cf8' }
                        : isDone
                          ? { background: 'rgba(16,185,129,0.2)', color: '#34d399' }
                          : { background: 'rgba(255,255,255,0.05)', color: '#475569' }
                    }
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-px min-w-[2rem] flex-1"
                    style={{ background: step > s.num ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)' }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10 w-full">
        {/* Left Column: Scrolling Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full h-full p-5 lg:p-8">
            {step === 1 ? (
              <HardFilterPanel hardFilters={hardFilters} setHardFilters={setHardFilters} />
            ) : (
              <div className="space-y-3">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-8 w-[3px] rounded-full shrink-0"
                    style={{ background: 'linear-gradient(180deg, #8b5cf6, #6366f1)' }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">Phân bổ trọng số cho từng tiêu chí</h3>
                    <p className="text-[11px] text-slate-500">Kéo thanh trượt hoặc nhập số để điều chỉnh mức độ quan trọng</p>
                  </div>
                </div>
                {primaryCriteria.map((criterion) => (
                  <WeightTile
                    key={criterion.key}
                    criterion={criterion}
                    setWeights={setWeights}
                    isExpanded={expandedCriterion === criterion.key}
                    onToggle={() =>
                      setExpandedCriterion((prev) => (prev === criterion.key ? null : criterion.key))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fixed Controls & Info */}
        <div className={`w-[340px] lg:w-[400px] shrink-0 border-l flex flex-col h-full relative z-10 border-slate-800/60 bg-gradient-to-b from-[#0d1420]/95 to-[#0a0e1a]/95 backdrop-blur-xl shadow-[-10px_0_40px_-20px_rgba(0,0,0,0.3)]`}>
          <div className="flex flex-col flex-1 h-full overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <>
                <div className="p-5 lg:p-6">
                  {/* Progress card */}
                  <div className="rounded-2xl border mb-5 p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1420 0%, #0a1020 100%)', borderColor: 'rgba(99,102,241,0.15)' }}>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />

                    <h4 className="flex items-center gap-3 text-[11px] font-bold mb-6 uppercase tracking-[0.2em] text-white relative z-10">
                      <div
                        className="h-8 w-[3px] rounded-full shrink-0"
                        style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                      />
                      Tiến trình bộ lọc
                    </h4>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-3xl font-black text-white mb-1 tracking-tighter">{mandatoryProgress.active}</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400">Đã bật</span>
                      </div>
                      <div className="rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <span className="text-3xl font-black mb-1 tracking-tighter" style={{ color: '#34d399', textShadow: '0 0 20px rgba(52,211,153,0.4)' }}>{mandatoryProgress.fulfilled}</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: '#34d399' }}>Hợp lệ</span>
                      </div>
                    </div>

                    <div className="space-y-2 p-3 rounded-xl relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex justify-between text-[11px] font-bold tracking-[0.15em]">
                        <span className="uppercase text-slate-400">Hoàn tất</span>
                        <span style={{ color: '#818cf8', textShadow: '0 0 10px rgba(99,102,241,0.4)' }}>{mandatoryProgress.percent}%</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="h-full transition-all duration-700 ease-out flex justify-end relative" style={{ width: `${mandatoryProgress.percent}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)', boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}>
                          <div className="absolute top-0 right-0 w-6 h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))', filter: 'blur(2px)' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info card */}
                  <div className="flex items-start gap-3 p-4 rounded-xl relative overflow-hidden" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div className="h-full w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                    <div>
                      <p className="text-[12px] leading-relaxed font-medium text-slate-300">
                        Tiêu chí được bật <strong className="text-white font-bold">"Bắt buộc"</strong> nhưng chưa điền giá trị sẽ bị <strong className="text-white font-bold">bỏ qua</strong> khi AI phân tích CV.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="mt-auto p-5 lg:p-6 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={handleFiltersComplete}
                    className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      border: '1px solid rgba(99,102,241,0.35)',
                      boxShadow: '0 4px 20px -5px rgba(99,102,241,0.3)',
                    }}
                  >
                    Tiếp tục phân bổ trọng số
                    <span className="text-[10px] opacity-80">→</span>
                  </button>

                  {validationErrorFilters && (
                    <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div className="h-full w-[3px] rounded-full shrink-0" style={{ background: '#ef4444' }} />
                      <p className="text-xs font-medium leading-relaxed text-red-300">{validationErrorFilters}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-5 lg:p-6">
                  {/* Weight display */}
                  <div className="rounded-2xl border mb-5 p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1420 0%, #0a1020 100%)', borderColor: 'rgba(99,102,241,0.15)' }}>
                    <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 transition-colors duration-700 pointer-events-none ${totalWeight === 100 ? 'bg-emerald-500/10' : totalWeight > 100 ? 'bg-red-500/10' : 'bg-amber-500/10'}`} />

                    <h4 className="flex items-center gap-3 text-[11px] font-bold mb-6 uppercase tracking-[0.2em] text-white relative z-10">
                      <div
                        className="h-8 w-[3px] rounded-full shrink-0"
                        style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                      />
                      Tổng trọng số
                    </h4>

                    {/* Big number display */}
                    <div className="rounded-2xl p-6 flex flex-col justify-center items-center relative overflow-hidden mb-5" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-baseline gap-1 relative z-10 transition-transform duration-500">
                        <span className="text-6xl font-black tracking-tighter transition-all duration-500" style={{
                          color: '#f1f5f9',
                          textShadow: totalWeight === 100 ? '0 0 40px rgba(16,185,129,0.4)' : totalWeight > 100 ? '0 0 40px rgba(244,63,94,0.4)' : '0 0 40px rgba(245,158,11,0.4)'
                        }}>
                          {totalWeight}
                        </span>
                        <span className="text-2xl font-bold transition-colors duration-500" style={{
                          color: totalWeight === 100 ? '#6ee7b7' : totalWeight > 100 ? '#fda4af' : '#fcd34d'
                        }}>%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs font-bold uppercase tracking-[0.2em] relative z-10 px-4 py-1.5 rounded-full transition-all duration-500" style={
                        totalWeight === 100
                          ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }
                          : totalWeight > 100
                            ? { background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af' }
                            : { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }
                      }>
                        {weightStatus.label} · {weightStatus.desc}
                      </div>
                    </div>

                    <TotalWeightDisplay totalWeight={totalWeight} />
                  </div>

                  {/* Mini criteria summary */}
                  <div className="space-y-2">
                    {primaryCriteria.slice(0, 4).map(c => {
                      const subTotal = c.children?.reduce((s, ch) => s + ch.weight, 0) || 0;
                      const pct = Math.round(subTotal);
                      return (
                        <div key={c.key} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="h-6 w-[3px] rounded-full overflow-hidden flex-shrink-0" style={{ background: pct >= 30 ? '#10b981' : pct >= 15 ? '#3b82f6' : '#f59e0b' }} />
                          <span className="text-[11px] font-medium flex-1 truncate" style={{ color: '#cbd5e1' }}>{c.name}</span>
                          <span className="text-[11px] font-bold" style={{ color: '#94a3b8' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="mt-auto p-5 lg:p-6 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={handleWeightsComplete}
                    disabled={totalWeight !== 100}
                    className="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3"
                    style={
                      totalWeight === 100
                        ? { background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid rgba(16,185,129,0.35)', color: '#fff', boxShadow: '0 4px 20px -5px rgba(16,185,129,0.3)' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', cursor: 'not-allowed' }
                    }
                  >
                    Hoàn tất cấu hình & Tiếp tục
                    <span className="text-[10px] opacity-80">→</span>
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-3 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-all rounded-xl"
                    style={{ color: '#475569', border: '1px solid transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span className="text-[10px]">←</span>
                    Quay lại bộ lọc cứng
                  </button>

                  {validationErrorWeights && (
                    <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div className="h-full w-[3px] rounded-full shrink-0" style={{ background: '#ef4444' }} />
                      <p className="text-xs font-medium leading-relaxed text-red-300">{validationErrorWeights}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

WeightsConfig.displayName = 'WeightsConfig';

export default WeightsConfig;
