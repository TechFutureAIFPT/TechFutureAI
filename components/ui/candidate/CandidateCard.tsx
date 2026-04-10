  
import React, { useState, useMemo } from 'react';
import type { Candidate, DetailedScore } from '../../../assets/types';

// --- Constants for the new UI ---
const CRITERIA_ORDER = [
  'Phù hợp JD (Job Fit)',
  'Kinh nghiệm',
  'Kỹ năng',
  'Thành tựu/KPI',
  'Học vấn',
  'Ngôn ngữ',
  'Chuyên nghiệp',
  'Gắn bó & Lịch sử CV',
  'Phù hợp văn hoá',
];

const CRITERIA_META: { [key: string]: { icon: string; color: string } } = {
  'Phù hợp JD (Job Fit)': { icon: 'fa-solid fa-bullseye', color: 'text-sky-400' },
  'Kinh nghiệm': { icon: 'fa-solid fa-briefcase', color: 'text-green-400' },
  'Kỹ năng': { icon: 'fa-solid fa-gears', color: 'text-purple-400' },
  'Thành tựu/KPI': { icon: 'fa-solid fa-trophy', color: 'text-yellow-400' },
  'Học vấn': { icon: 'fa-solid fa-graduation-cap', color: 'text-indigo-400' },
  'Ngôn ngữ': { icon: 'fa-solid fa-language', color: 'text-orange-400' },
  'Chuyên nghiệp': { icon: 'fa-solid fa-file-invoice', color: 'text-cyan-400' },
  'Gắn bó & Lịch sử CV': { icon: 'fa-solid fa-hourglass-half', color: 'text-lime-400' },
  'Phù hợp văn hoá': { icon: 'fa-solid fa-users-gear', color: 'text-pink-400' },
};

// --- New Accordion Component ---
interface CriterionAccordionProps {
  item: DetailedScore;
  isExpanded: boolean;
  onToggle: () => void;
}

const CriterionAccordion: React.FC<CriterionAccordionProps> = ({ item, isExpanded, onToggle }) => {
  const [copied, setCopied] = useState(false);

  const meta = CRITERIA_META[item['Tiêu chí']] || { icon: 'fa-solid fa-circle-question', color: 'text-slate-400' };
  
  // Parse score details
  const parsedData = useMemo(() => {
    const scoreStr = item['Điểm']; // e.g. "85/100"
    const score = parseInt(scoreStr.split('/')[0], 10);
    
    // Try to extract subscore and weight from explanation if available
    // This is a heuristic based on typical explanation format
    const subscoreMatch = item['Giải thích'].match(/subscore\s*(\d+)/i);
    const weightMatch = item['Giải thích'].match(/trọng số\s*(\d+)%/i);
    
    return {
      score,
      subscore: subscoreMatch ? subscoreMatch[1] : null,
      weight: weightMatch ? weightMatch[1] : null,
      formulaResult: (subscoreMatch && weightMatch) 
        ? Math.round(parseInt(subscoreMatch[1]) * parseInt(weightMatch[1]) / 100) 
        : score
    };
  }, [item]);

  const getScoreColorClasses = (score: number) => {
    if (score >= 80) return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
    if (score >= 60) return 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10';
    return 'border-red-500/50 text-red-400 bg-red-500/10';
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item['Dẫn chứng']);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic styles based on criteria color
  const activeBorderColor = meta.color.replace('text-', 'border-').replace('400', '500/30');
  const activeBgGradient = meta.color.replace('text-', 'from-').replace('400', '500/5');

  return (
    <div className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? `${activeBorderColor} bg-slate-900/40` : 'border-slate-800/60 bg-slate-950/30 hover:border-slate-700'}`}>
      
      {/* Header */}
      <button 
        className="w-full flex items-center justify-between px-3 py-3 md:px-5 md:py-4 text-left relative z-10"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-base md:text-lg shadow-lg ${isExpanded ? 'shadow-cyan-500/20' : ''} transition-all duration-300`}>
            <i className={`${meta.icon} ${meta.color} ${isExpanded ? 'scale-110' : ''} transition-transform`}></i>
          </div>
          <div>
            <span className={`font-bold text-sm md:text-base block mb-0.5 ${isExpanded ? 'text-slate-100' : 'text-slate-300'}`}>{item['Tiêu chí']}</span>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
               {parsedData.weight && <span>Trọng số: <span className="text-slate-400">{parsedData.weight}%</span></span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className={`flex flex-col items-end`}>
             <span className={`text-base md:text-lg font-black ${getScoreColorClasses(parsedData.score).split(' ')[1]}`}>
                {parsedData.score}
             </span>
             <span className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-wider">Điểm số</span>
          </div>
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-800 text-cyan-400' : 'text-slate-500'}`}>
            <i className="fa-solid fa-chevron-down text-[10px] md:text-xs"></i>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-2 md:px-5 md:pb-5 border-t border-slate-800/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              
              {/* Left: Evidence (Dẫn chứng) */}
              <div className="lg:col-span-7 flex flex-col gap-2 md:gap-3">
                <div className="flex justify-between items-end">
                  <h5 className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <i className="fa-solid fa-quote-left text-slate-600"></i> 
                    Dẫn chứng từ CV
                  </h5>
                  <button onClick={handleCopy} className="text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1.5">
                    <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                
                <div className="relative flex-1 bg-slate-900/50 rounded-xl border border-slate-800/80 p-3 md:p-4 group/evidence hover:border-slate-700 transition-colors">
                   {item['Dẫn chứng'] === "Không tìm thấy thông tin trong CV" ? (
                      <div className="flex flex-col items-center justify-center h-full py-4 text-slate-500 gap-2">
                        <i className="fa-regular fa-file-excel text-xl md:text-2xl opacity-50"></i>
                        <span className="text-xs md:text-sm italic">Không tìm thấy thông tin phù hợp trong CV</span>
                      </div>
                   ) : (
                      <blockquote className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                        "{item['Dẫn chứng']}"
                      </blockquote>
                   )}
                   {/* Decorative quote mark */}
                   <i className="fa-solid fa-quote-right absolute bottom-3 right-3 text-2xl md:text-4xl text-slate-800/50 -z-10"></i>
                </div>
              </div>

              {/* Right: Analysis (Giải thích) */}
              <div className="lg:col-span-5 flex flex-col gap-2 md:gap-3">
                <h5 className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <i className="fa-solid fa-magnifying-glass-chart text-slate-600"></i>
                  Phân tích & Đánh giá
                </h5>
                
                <div className="flex-1 bg-slate-900/80 rounded-xl border border-slate-800/80 p-3 md:p-4 flex flex-col justify-between gap-3 md:gap-4">
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                    {item['Giải thích']}
                  </p>
                  
                  {/* Formula Visualization */}
                  <div className="bg-slate-950 rounded-lg p-2 md:p-3 border border-slate-800/50">
                    <div className="flex items-center justify-between text-[10px] md:text-xs text-slate-500 mb-1">
                      <span>Công thức tính:</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs md:text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-cyan-400 font-bold">{parsedData.subscore ?? '?'}</span>
                        <span className="text-[8px] md:text-[9px] text-slate-600 uppercase">Subscore</span>
                      </div>
                      <span className="text-slate-600">×</span>
                      <div className="flex flex-col items-center">
                        <span className="text-purple-400 font-bold">{parsedData.weight ?? '?'}%</span>
                        <span className="text-[8px] md:text-[9px] text-slate-600 uppercase">Trọng số</span>
                      </div>
                      <span className="text-slate-600">=</span>
                      <div className="flex flex-col items-center">
                        <span className="text-yellow-400 font-bold">{parsedData.formulaResult ?? '?'}</span>
                        <span className="text-[8px] md:text-[9px] text-slate-600 uppercase">Kết quả</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Candidate Card Component (Modified) ---
interface CandidateCardProps {
  candidate: Candidate;
  rank: number;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, rank }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

  const { candidateName, phone, email, fileName, jobTitle, status, error, experienceLevel, hardFilterFailureReason, softFilterWarnings, analysis } = candidate;

  const failed = status === 'FAILED';
  const grade = analysis?.["Hạng"] || 'C';
  const overallScore = analysis?.["Tổng điểm"] || 0;
  const strengths = analysis?.['Điểm mạnh CV'];
  const weaknesses = analysis?.['Điểm yếu CV'];

  // Enhanced Grade Colors
  const gradeColor = failed ? 'from-slate-600 to-slate-700' : (grade === 'A' ? 'from-emerald-500 to-teal-600' : grade === 'B' ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-rose-600');
  const gradeShadow = failed ? 'shadow-slate-500/20' : (grade === 'A' ? 'shadow-emerald-500/40' : grade === 'B' ? 'shadow-blue-500/40' : 'shadow-red-500/40');
  
  const jdFitScoreItem = useMemo(() => analysis?.['Chi tiết']?.find(item => item['Tiêu chí'].startsWith('Phù hợp JD')), [analysis]);
  const jdFitScore = jdFitScoreItem ? parseInt(jdFitScoreItem['Điểm'].split('/')[0], 10) : 0;
  
  const getHeaderScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };
  
  const overallScoreColor = failed ? 'text-slate-400 bg-slate-800/50 border-slate-700' : getHeaderScoreColor(overallScore);
  const jdFitScoreColor = failed ? 'text-slate-400 bg-slate-800/50 border-slate-700' : getHeaderScoreColor(jdFitScore);
  
  const sortedDetails = useMemo(() => {
    if (!analysis) return [];
    return [...analysis['Chi tiết']].sort((a, b) => {
      return CRITERIA_ORDER.indexOf(a['Tiêu chí']) - CRITERIA_ORDER.indexOf(b['Tiêu chí']);
    });
  }, [analysis]);

  const toggleAccordion = (criterion: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [criterion]: !prev[criterion]
    }));
  };

  const toggleExpandAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const areAllExpanded = sortedDetails.every(item => expandedAccordions[item['Tiêu chí']]);
    const newExpandedState: Record<string, boolean> = {};
    sortedDetails.forEach(item => {
      newExpandedState[item['Tiêu chí']] = !areAllExpanded;
    });
    setExpandedAccordions(newExpandedState);
  };
  
  return (
    <div className="group relative w-full transition-all duration-500 hover:-translate-y-1">
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${failed ? 'from-slate-700/50 to-slate-800/50' : 'from-cyan-500/30 via-blue-500/30 to-purple-500/30'} rounded-[2rem] opacity-0 group-hover:opacity-100 blur-xl transition duration-700`}></div>
      
      <div className="relative rounded-[1.5rem] md:rounded-[1.8rem] border border-slate-800 bg-slate-950/90 backdrop-blur-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
        <button
          type="button"
          className="w-full text-left p-4 md:p-7 flex flex-col gap-4 md:gap-6 focus:outline-none"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          {/* Header Top Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 w-full">
            
            {/* Left: Rank & Info */}
            <div className="flex items-start md:items-center gap-3 md:gap-5 min-w-0 flex-1">
              {/* Rank Badge */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradeColor} flex items-center justify-center text-lg md:text-2xl font-black text-white shadow-lg ${gradeShadow} ring-2 ring-white/10`}>
                  #{rank}
                </div>
                {!failed && (
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full bg-slate-950 border border-slate-800 text-white shadow-sm`}>
                      Hạng {grade}
                    </span>
                  </div>
                )}
              </div>

              {/* Candidate Info */}
              <div className="min-w-0 flex-1 space-y-0.5 md:space-y-1">
                <h3 className="text-lg md:text-2xl font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {candidateName || 'Chưa xác định'}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-xs md:text-sm text-slate-400">
                  {jobTitle && <span className="font-medium text-slate-300 flex items-center gap-1 md:gap-1.5"><i className="fa-solid fa-briefcase text-slate-500"></i>{jobTitle}</span>}
                  {experienceLevel && <span className="flex items-center gap-1 md:gap-1.5"><i className="fa-solid fa-layer-group text-slate-500"></i>{experienceLevel}</span>}
                </div>
              </div>
            </div>

            {/* Right: Scores */}
            <div className="flex items-center gap-2 md:gap-3 self-end md:self-center mt-2 md:mt-0">
              <div className={`flex flex-col items-center justify-center w-14 h-12 md:w-20 md:h-16 rounded-xl md:rounded-2xl border ${jdFitScoreColor}`}>
                <span className="text-base md:text-lg font-bold">{failed ? '--' : `${jdFitScore}%`}</span>
                <span className="text-[8px] md:text-[9px] uppercase font-bold opacity-70">Job Fit</span>
              </div>
              <div className={`flex flex-col items-center justify-center w-14 h-12 md:w-20 md:h-16 rounded-xl md:rounded-2xl border ${overallScoreColor}`}>
                <span className="text-base md:text-lg font-bold">{failed ? '--' : overallScore}</span>
                <span className="text-[8px] md:text-[9px] uppercase font-bold opacity-70">Tổng</span>
              </div>
              <div className={`w-8 h-12 md:w-10 md:h-16 flex items-center justify-center rounded-lg md:rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all duration-300`}>
                <i className={`fa-solid fa-chevron-down transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}></i>
              </div>
            </div>
          </div>

          {/* Header Bottom Row: Contact & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 pt-2 border-t border-slate-800/50 w-full">
             
             {failed ? (
                <span className="text-[10px] md:text-xs font-bold text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full">
                  <i className="fa-solid fa-circle-exclamation"></i> {error || 'Lỗi phân tích'}
                </span>
             ) : (
                <span className="text-[10px] md:text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <i className="fa-regular fa-file-lines"></i> {fileName}
                </span>
             )}
          </div>
        </button>
      
      {/* Expanded Details */}
      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {!failed && analysis && (
            <div className="p-4 md:p-7 pt-0 space-y-6 md:space-y-8">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                {strengths && strengths.length > 0 && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 p-5">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <i className="fa-solid fa-wand-magic-sparkles text-6xl text-emerald-400"></i>
                    </div>
                    <h4 className="relative text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-check-circle"></i> Điểm mạnh nổi bật
                    </h4>
                    <ul className="relative space-y-2">
                      {strengths.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0"></span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {weaknesses && weaknesses.length > 0 && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/20 to-rose-900/20 border border-red-500/20 p-5">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <i className="fa-solid fa-shield-halved text-6xl text-red-400"></i>
                    </div>
                    <h4 className="relative text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-triangle-exclamation"></i> Điểm cần cải thiện
                    </h4>
                    <ul className="relative space-y-2">
                      {weaknesses.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 flex-shrink-0"></span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Warnings & Hard Filters */}
              {(softFilterWarnings?.length > 0 || hardFilterFailureReason) && (
                <div className="space-y-3">
                  {softFilterWarnings && softFilterWarnings.length > 0 && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                      <i className="fa-solid fa-circle-info text-yellow-500 mt-0.5"></i>
                      <div>
                        <h5 className="text-sm font-bold text-yellow-500 mb-1">Lưu ý thêm</h5>
                        <ul className="list-disc list-inside text-sm text-slate-400">
                          {softFilterWarnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                  {hardFilterFailureReason && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <i className="fa-solid fa-ban text-red-500 mt-0.5"></i>
                      <div>
                        <h5 className="text-sm font-bold text-red-500 mb-1">Vi phạm tiêu chí bắt buộc</h5>
                        <p className="text-sm text-slate-400">{hardFilterFailureReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Detailed Scoring Section */}
              <div>
                <div className="flex justify-between items-end mb-5 border-b border-slate-800 pb-2">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-cyan-400"></i>
                    Chi tiết đánh giá
                  </h4>
                  <button 
                    onClick={toggleExpandAll} 
                    className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800"
                  >
                    <i className={`fa-solid ${sortedDetails.every(item => expandedAccordions[item['Tiêu chí']]) ? 'fa-compress' : 'fa-expand'}`}></i>
                    {sortedDetails.every(item => expandedAccordions[item['Tiêu chí']]) ? 'Thu gọn' : 'Mở rộng'}
                  </button>
                </div>
                <div className="space-y-4">
                  {sortedDetails.map((item) => (
                    <CriterionAccordion 
                      key={item['Tiêu chí']} 
                      item={item} 
                      isExpanded={!!expandedAccordions[item['Tiêu chí']]}
                      onToggle={() => toggleAccordion(item['Tiêu chí'])}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CandidateCard;