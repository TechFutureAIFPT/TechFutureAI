import React, { useMemo } from 'react';
import type { Candidate, DetailedScore } from '../../../assets/types';
import { analyzeExperience } from '../../../services/ai-ml/matching/experienceMatch';
import { extractJDRequirements, compareEvidence } from '../../../services/ai-ml/extraction/requirementsExtractor';

const CARD_CRITERIA_ORDER = [
  'Phù hợp JD (Job Fit)', 'Kinh nghiệm', 'Kỹ năng', 'Thành tựu/KPI', 'Học vấn',
  'Ngôn ngữ', 'Chuyên nghiệp', 'Gắn bó & Lịch sử CV', 'Phù hợp văn hoá',
];

const CARD_CRITERIA_META: { [key: string]: { icon: string; color: string } } = {
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

interface CriterionAccordionProps {
  item: DetailedScore;
  isExpanded: boolean;
  onToggle: () => void;
  jdText: string;
}

const CriterionAccordion: React.FC<CriterionAccordionProps> = ({ item, isExpanded, onToggle, jdText }) => {
  const [copied, setCopied] = React.useState(false);
  const parsedData = useMemo(() => {
    const scoreMatch = item['Điểm'].match(/([\d.]+)\/([\d.]+)/);
    const score = parseFloat(scoreMatch?.[1] || '0');
    const maxScore = parseFloat(scoreMatch?.[2] || '0');

    // Try new format first: "subscore X/Y% = X points"
    let formulaMatch = item['Công thức'].match(/subscore ([\d.]+)\/([\d.]+)% = ([\d.]+) points/);
    let subscore = parseFloat(formulaMatch?.[1] || '0');
    let weight = parseFloat(formulaMatch?.[2] || '0');
    let formulaResult = formulaMatch?.[3] || '0';

    // If new format doesn't match, try old format: "subscore X × trọng số Y% = Z"
    if (!formulaMatch) {
      formulaMatch = item['Công thức'].match(/subscore ([\d.]+) × trọng số ([\d]+)% = (.*)$/);
      subscore = parseFloat(formulaMatch?.[1] || '0');
      weight = parseFloat(formulaMatch?.[2] || '0');
      formulaResult = formulaMatch?.[3]?.trim() || '0';
    }

    // If still no match, try to extract numbers from any format
    if (!formulaMatch) {
      const numbers = item['Công thức'].match(/[\d.]+/g);
      if (numbers && numbers.length >= 2) {
        subscore = parseFloat(numbers[0]);
        weight = maxScore; // Assume weight equals maxScore for new format
        formulaResult = subscore.toString();
      }
    }

    return { score, maxScore, subscore, weight, formulaResult };
  }, [item]);

  const handleCopy = () => {
    navigator.clipboard.writeText(item['Dẫn chứng']);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const meta = CARD_CRITERIA_META[item['Tiêu chí']] || { icon: 'fa-solid fa-question-circle', color: 'text-slate-400' };
  const scorePercentage = parsedData.maxScore > 0 ? (parsedData.score / parsedData.maxScore) * 100 : 0;
  const scoreBadgeClass =
    scorePercentage >= 85
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
      : scorePercentage >= 65
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
        : 'bg-red-500/15 text-red-300 border-red-500/35';

  // Derive proficiency band
  const proficiency = scorePercentage >= 90 ? 'Expert' :
                      scorePercentage >= 75 ? 'Advanced' :
                      scorePercentage >= 55 ? 'Intermediate' :
                      'Beginner';

  // Generate suggestion if low
  const suggestions: string[] = [];
  if (scorePercentage < 55) {
    if (/Kỹ năng/i.test(item['Tiêu chí'])) suggestions.push('Bổ sung chứng chỉ hoặc dự án thực tế thể hiện mức độ làm chủ công nghệ cốt lõi.');
    if (/Kinh nghiệm/i.test(item['Tiêu chí'])) suggestions.push('Làm rõ số năm, phạm vi trách nhiệm và kết quả định lượng trong từng vai trò.');
    if (/Thành tựu|KPI/i.test(item['Tiêu chí'])) suggestions.push('Thêm KPI cụ thể (ví dụ: % cải thiện, số người dùng, tốc độ, doanh thu).');
    if (/Học vấn/i.test(item['Tiêu chí'])) suggestions.push('Bổ sung chuyên ngành, đề tài hoặc môn học liên quan JD.');
    if (/Ngôn ngữ/i.test(item['Tiêu chí'])) suggestions.push('Ghi rõ cấp độ (IELTS/TOEIC/CEFR) hoặc kinh nghiệm sử dụng trong môi trường quốc tế.');
    if (/Chuyên nghiệp/i.test(item['Tiêu chí'])) suggestions.push('Chuẩn hóa format bullet, thống nhất thì hiện tại/quá khứ và kiểm tra lỗi chính tả.');
    if (/Gắn bó/i.test(item['Tiêu chí'])) suggestions.push('Làm rõ lý do chuyển việc hoặc nhấn mạnh các giai đoạn ổn định dài hạn.');
    if (/văn hoá/i.test(item['Tiêu chí'])) suggestions.push('Thêm minh chứng về teamwork, ownership hoặc growth mindset.');
  }

  const matchPercent = scorePercentage; // alias for UI clarity

  // Highlighting logic for evidence
  const highlightEvidence = (text: string) => {
    if (!text || text === 'Không tìm thấy thông tin trong CV') return text;
    const patterns = [
      /\b(aws|azure|gcp|docker|kubernetes|react|node|python|java|typescript|sql|mongodb|redis|kafka)\b/gi,
      /\b(\d+\s*(?:%|users|người|MAU|DAU|triệu|tỷ|kpi|doanh thu|revenue))\b/gi,
      /\b(leader|leadership|teamwork|ownership|growth|agile|scrum)\b/gi
    ];
    let html = text;
    patterns.forEach((re, idx) => {
      html = html.replace(re, (m) => `<span class="evidence-hl hl-${idx}">${m}</span>`);
    });
    return html;
  };

  // Specialized logic for "Kinh nghiệm" criterion: reorder sections & add quick analysis
  const isExperience = /Kinh nghiệm/i.test(item['Tiêu chí']);
  const jdRequirements = useMemo(() => extractJDRequirements(jdText), [jdText]);
  const thisRequirement = useMemo(() => jdRequirements.find(r => r.display === item['Tiêu chí']), [jdRequirements, item['Tiêu chí']]);
  const requirementComparison = useMemo(() => {
    if (isExperience) return null; // handled separately
    if (!thisRequirement) return null;
    return compareEvidence(item['Tiêu chí'], thisRequirement.keywords, item['Dẫn chứng']);
  }, [thisRequirement, item['Dẫn chứng'], isExperience, item['Tiêu chí']]);
  let experienceBlock: React.ReactNode = null;
  let matchMeta: ReturnType<typeof analyzeExperience> | null = null;
  if (isExperience) {
    matchMeta = analyzeExperience(jdText, item['Dẫn chứng'] || '');
    experienceBlock = (
      <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
        <h5 className="mb-1 text-base font-bold text-slate-100">Phân tích nhanh</h5>
        {matchMeta.matchPercent === 'N/A' ? (
          <p className="text-xs text-slate-500 italic">JD chưa có mục yêu cầu kinh nghiệm rõ ràng</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mức độ phù hợp JD</span>
                <span className="font-semibold text-cyan-400">{matchMeta.matchPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className={`h-full ${typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 80 ? 'bg-emerald-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 65 ? 'bg-yellow-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${typeof matchMeta.matchPercent === 'number' ? Math.min(100, Math.max(0, matchMeta.matchPercent)) : 0}%` }}
                />
              </div>
              <div className="text-xs text-slate-400">Nhận định: <span className="font-medium text-slate-300">{matchMeta.fitLabel}</span></div>
            </div>
            <div className="pt-2 border-t border-slate-700/50 space-y-2">
              <div className="text-[11px] text-slate-400 font-medium">Keyword JD</div>
              <div className="flex flex-wrap gap-1">
                {matchMeta.jdKeywords.slice(0,8).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-slate-700/60 text-[10px] text-slate-200 border border-slate-600">{k}</span>)}
              </div>
            </div>
            <div className="pt-1 space-y-2">
              <div className="text-[11px] text-slate-400 font-medium">Khớp</div>
              <div className="flex flex-wrap gap-1">
                {matchMeta.matched.slice(0,5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 text-[10px] border border-emerald-500/40">{k}</span>)}
                {matchMeta.matched.length === 0 && <span className="text-[11px] text-slate-500">(Không)</span>}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Thiếu</div>
              <div className="flex flex-wrap gap-1">
                {matchMeta.missing.slice(0,5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-yellow-600/30 text-yellow-300 text-[10px] border border-yellow-500/40">{k}</span>)}
                {matchMeta.missing.length === 0 && <span className="text-[11px] text-slate-500">(Không)</span>}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Chưa rõ</div>
              <div className="flex flex-wrap gap-1">
                {matchMeta.uncertain.slice(0,5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-slate-600/40 text-slate-300 text-[10px] border border-slate-500/40">{k}</span>)}
                {matchMeta.uncertain.length === 0 && <span className="text-[11px] text-slate-500">(Không)</span>}
              </div>
            </div>
            {typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent < 70 && (
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1"><i className="fa-solid fa-lightbulb text-yellow-400"></i>Gợi ý cải thiện:</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Làm rõ thêm thời lượng, vai trò cụ thể và công nghệ chính trong các dự án gần nhất để tăng mức phù hợp.</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0f1729] shadow-sm transition-all duration-200 hover:border-cyan-500/25 hover:shadow-md hover:shadow-cyan-500/5">
      <button className="flex min-h-[56px] w-full items-center justify-between p-3.5 text-left" onClick={onToggle} aria-expanded={isExpanded}>
        <div className="flex min-w-0 items-center gap-3">
          <i className={`${meta.icon} ${meta.color} w-5 text-center text-lg`}></i>
          <span className="truncate font-semibold text-slate-100">{item['Tiêu chí']}</span>
          <span className="ml-1 rounded border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400">{proficiency}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${scoreBadgeClass}`}>
            {parsedData.score}<span className="ml-0.5 text-xs opacity-80">/{parsedData.maxScore}</span>
          </span>
          <i className={`fa-solid fa-chevron-down text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-800/60 px-4 pb-4 pt-3">
          <div className={`grid grid-cols-1 ${isExperience ? 'xl:grid-cols-3' : 'xl:grid-cols-3'} gap-4`}>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <div className="mb-2 flex items-center justify-between">
                <h5 className="text-base font-bold text-slate-200">Dẫn chứng (trích từ CV)</h5>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-cyan-400">
                  <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  {copied ? 'Đã chép' : 'Chép'}
                </button>
              </div>
              <blockquote className="evidence-block border-l-4 border-cyan-500/60 pl-4 text-base italic leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                __html: item['Dẫn chứng'] === 'Không tìm thấy thông tin trong CV'
                  ? '<span class="not-italic rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">Chưa tìm thấy trong CV</span>'
                  : highlightEvidence(item['Dẫn chứng'])
              }} />
            </div>
            {/* If experience: insert Quick Analysis as second column */}
            {isExperience && experienceBlock}
            {!isExperience && requirementComparison && (
              <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
                <h5 className="mb-1 text-base font-bold text-slate-100">Phân tích nhanh</h5>
                <div className="text-[11px] text-slate-400">Từ khóa JD ({requirementComparison.jdKeywords.length})</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {requirementComparison.jdKeywords.slice(0,12).map(k => <span key={k} className="pill pill--uncertain">{k}</span>)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Khớp</div>
                <div className="flex flex-wrap gap-1">
                  {requirementComparison.matched.length>0 ? requirementComparison.matched.slice(0,10).map(k => <span key={k} className="pill pill--match">{k}</span>) : <span className="text-[11px] text-slate-500">(Không)</span>}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-2">Thiếu</div>
                <div className="flex flex-wrap gap-1">
                  {requirementComparison.missing.length>0 ? requirementComparison.missing.slice(0,10).map(k => <span key={k} className="pill pill--missing">{k}</span>) : <span className="text-[11px] text-slate-500">(Không)</span>}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <h5 className="mb-4 text-base font-bold text-slate-100">Giải thích & Công thức</h5>
              {!isExperience && requirementComparison && (
                <div className="mb-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] leading-relaxed text-slate-300">
                  <span className="font-medium text-cyan-300">So khớp JD:</span> {requirementComparison.matched.length}/{requirementComparison.jdKeywords.length} từ khóa xuất hiện.
                  {requirementComparison.missing.length > 0 && (
                    <>
                      {' '}Thiếu <span className="font-medium text-amber-400">{requirementComparison.missing.length}</span> từ: {requirementComparison.missing.slice(0, 3).join(', ')}{requirementComparison.missing.length > 3 ? '…' : ''}
                    </>
                  )}
                </div>
              )}
              {isExperience && matchMeta && (
                <div className="mb-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] leading-relaxed text-slate-300">
                  <span className="font-medium text-cyan-300">Tổng quan kinh nghiệm:</span>{' '}
                  {matchMeta.matchPercent === 'N/A' ? 'Không xác định' : `${matchMeta.matchPercent}% (${matchMeta.fitLabel})`}.
                  {matchMeta.missing.length > 0 && (
                    <>
                      {' '}
                      Thiếu: <span className="font-medium text-amber-400">{matchMeta.missing.slice(0, 3).join(', ')}{matchMeta.missing.length > 3 ? '…' : ''}</span>
                    </>
                  )}
                </div>
              )}

              <div className="mb-4">
                <p className="text-base leading-relaxed text-slate-300">{item['Giải thích']}</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">Công thức tính điểm</div>

                <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Đánh giá thực tế</span>
                    <span className="font-mono font-semibold text-cyan-400">{parsedData.score}/{parsedData.maxScore}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                  <div className="mb-1 text-xs text-slate-500">Công thức subscore</div>
                  <div className="font-mono text-xs">
                    {parsedData.weight > 0 && parsedData.maxScore === parsedData.weight ? (
                      <span>
                        <span className="text-sky-400">{parsedData.score}</span> / <span className="text-violet-400">{parsedData.weight}%</span> ={' '}
                        <span className="font-bold text-amber-400">{parsedData.formulaResult} điểm</span>
                      </span>
                    ) : parsedData.weight > 0 ? (
                      <span>
                        <span className="text-sky-400">{parsedData.subscore}</span> × <span className="text-violet-400">trọng số {parsedData.weight}%</span> ={' '}
                        <span className="font-bold text-amber-400">{parsedData.formulaResult}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">{item['Công thức'] || 'Không có công thức'}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                  <div className="mb-1 text-xs text-slate-500">Đóng góp vào điểm tổng</div>
                  <div className="text-xs text-slate-300">
                    {parsedData.formulaResult && parsedData.formulaResult !== '0' ? (
                      <span>
                        Tiêu chí này đóng góp <span className="font-bold text-amber-400">{parsedData.formulaResult}</span> điểm
                        {parsedData.weight > 0 && parsedData.maxScore === parsedData.weight
                          ? ` (điểm đánh giá trực tiếp trên thang ${parsedData.weight}%)`
                          : parsedData.weight > 0
                            ? ` (từ đánh giá ${parsedData.subscore}/100 × ${parsedData.weight}%)`
                            : ''}
                      </span>
                    ) : (
                      <span className="text-slate-500">Đang tính toán...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Fallback original quick analysis (non-experience criteria) */}
            {!isExperience && !requirementComparison && (
              <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
                <h5 className="mb-1 text-base font-bold text-slate-100">Phân tích nhanh</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Mức độ phù hợp JD</span>
                    <span className="font-semibold text-cyan-400">{matchPercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700/60 rounded overflow-hidden">
                    <div className={`h-full ${matchPercent>=85?'bg-emerald-500':matchPercent>=65?'bg-yellow-500':'bg-red-500'}`} style={{width: `${Math.min(100, Math.max(0, matchPercent))}%`}}></div>
                  </div>
                  <div className="text-xs text-slate-400">Đánh giá tổng quan: <span className="font-medium text-slate-300">{proficiency}</span></div>
                </div>
                {suggestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1"><i className="fa-solid fa-lightbulb text-yellow-400"></i>Gợi ý cải thiện</p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                      {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ExpandedContentProps {
  candidate: Candidate;
  expandedCriteria: Record<string, Record<string, boolean>>;
  onToggleCriterion: (candidateId: string, criterion: string) => void;
  jdText: string;
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({ candidate, expandedCriteria, onToggleCriterion, jdText }) => {
  const sortedDetails = useMemo(() =>
    candidate.analysis?.['Chi tiết'] ?
      [...candidate.analysis['Chi tiết']].sort((a, b) =>
        CARD_CRITERIA_ORDER.indexOf(a['Tiêu chí']) - CARD_CRITERIA_ORDER.indexOf(b['Tiêu chí'])
      ) : [],
    [candidate.analysis]
  );

  const totalScore = candidate.analysis?.['Tổng điểm'] || 0;
  const maxTheoretical = 80; // standardized view
  const matchPercent = Math.min(100, Math.round((totalScore / maxTheoretical) * 100));
  const recommendation = totalScore >= 60
    ? 'Ứng viên có nền tảng tốt, nên xem xét mời phỏng vấn.'
    : totalScore >= 40
      ? 'Ứng viên có tiềm năng, cân nhắc nếu thiếu nguồn.'
      : 'Nên ưu tiên ứng viên khác có mức phù hợp cao hơn.';
  const stability = '±0.0'; // placeholder (extend with history later)

  return (
    <div className="space-y-5 p-2 md:p-4">
      <div className="rounded-xl border border-slate-800/60 bg-[#0f1729] p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <i className="fa-solid fa-chart-pie text-cyan-400" />
            Tổng hợp đánh giá
          </h4>
          <div className="grid w-full grid-cols-3 gap-2 md:w-auto">
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs">
              <div className="text-slate-500">Điểm</div>
              <div className="font-semibold text-slate-100">{totalScore}/{maxTheoretical}</div>
            </div>
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs">
              <div className="text-slate-500">Phù hợp JD</div>
              <div className="font-semibold text-cyan-400">{matchPercent}%</div>
            </div>
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs">
              <div className="text-slate-500">Ổn định</div>
              <div className="font-semibold text-slate-300">{stability}</div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Ứng viên đạt <span className="font-semibold text-slate-100">{totalScore}/{maxTheoretical}</span> điểm.
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full ${matchPercent >= 75 ? 'bg-emerald-500' : matchPercent >= 55 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, matchPercent)}%` }} />
        </div>
        <div className="mt-3 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-200">Nhận định:</span>{' '}
          <span className="text-slate-400">{recommendation}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidate.analysis?.['Điểm mạnh CV'] && (
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/25 rounded-xl">
            <p className="font-semibold text-green-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-wand-magic-sparkles"></i>Điểm mạnh CV
            </p>
            <ul className="list-disc list-inside text-sm text-green-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Điểm mạnh CV'].map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {candidate.analysis?.['Điểm yếu CV'] && (
          <div className="p-4 bg-rose-900/20 border border-rose-500/25 rounded-xl">
            <p className="font-semibold text-red-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-flag"></i>Điểm yếu CV
            </p>
            <ul className="list-disc list-inside text-sm text-red-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Điểm yếu CV'].map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Education Validation Section */}
      {candidate.analysis?.educationValidation && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0f1729] p-4 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
            <i className="fa-solid fa-graduation-cap text-indigo-400"></i>
            Xác thực thông tin học vấn
          </h4>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h5 className="text-sm font-semibold text-slate-400">Thông tin học vấn chuẩn hóa</h5>
                <span
                  className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${
                    candidate.analysis.educationValidation.validationNote === 'Hợp lệ'
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/35 bg-red-500/10 text-red-300'
                  }`}
                >
                  {candidate.analysis.educationValidation.validationNote}
                </span>
              </div>
              <p className="rounded border border-slate-800/50 bg-slate-950/50 p-2.5 font-mono text-sm text-slate-300">
                {candidate.analysis.educationValidation.standardizedEducation || 'Không có thông tin'}
              </p>
            </div>

            {/* Validation Warnings */}
            {candidate.analysis.educationValidation.warnings && candidate.analysis.educationValidation.warnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/25 p-3 rounded-lg">
                <h5 className="text-sm font-semibold text-yellow-300 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  Cảnh báo xác thực
                </h5>
                <ul className="list-disc list-inside text-sm text-yellow-400/90 space-y-1 pl-2">
                  {candidate.analysis.educationValidation.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="space-y-3">
          {sortedDetails.map((item) => (
            <CriterionAccordion
              key={item['Tiêu chí']}
              item={item}
              isExpanded={!!expandedCriteria[candidate.id]?.[item['Tiêu chí']]}
              onToggle={() => onToggleCriterion(candidate.id, item['Tiêu chí'])}
              jdText={jdText}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpandedContent;