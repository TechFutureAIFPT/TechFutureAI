import React, { useMemo, useState } from 'react';
import type { Candidate, DetailedScore } from '../../../assets/types';
import { analyzeExperience } from '../../../services/ai-ml/algorithms/matching/experienceMatch';
import { extractJDRequirements, compareEvidence } from '../../../services/ai-ml/algorithms/extraction/requirementsExtractor';

// ── Phân loại tiêu chí ──────────────────────────────────────────────────────

const BASIC_CRITERIA = [
  'Phù hợp JD (Job Fit)', 'Kinh nghiệm', 'Kỹ năng', 'Thành tựu/KPI',
  'Học vấn', 'Ngôn ngữ', 'Chuyên nghiệp', 'Gắn bó & Lịch sử CV', 'Phù hợp văn hoá',
  'Hệ số uy tín công ty', // chuyển về cơ bản
];

const ADVANCED_CRITERIA = [
  'Kỹ năng hành động & chủ động',
  'Trình bày STAR & Kết quả',
  'Sự ổn định & Trung thành',
  'Kỹ năng chuyển đổi (Skill Graph)',
  'Tiềm năng phát triển (Career Velocity)',
];

// Thang điểm chuẩn
const BASIC_TOTAL_MAX = 80;    // 10 tiêu chí cơ bản cộng lại tối đa 80
const ADVANCED_MAX_PER = 4;   // mỗi tiêu chí nâng cao tối đa 4 điểm
const ADVANCED_TOTAL_MAX = ADVANCED_CRITERIA.length * ADVANCED_MAX_PER; // 5 × 4 = 20

const ADVANCED_DESCRIPTIONS: Record<string, { what: string; why: string; signals: string[] }> = {
  'Kỹ năng hành động & chủ động': {
    what: 'Đo lường mức độ chủ động, sáng tạo và tự giác trong công việc qua ngôn từ hành động trong CV.',
    why: 'Ứng viên chủ động thường tạo ra giá trị vượt kỳ vọng — đây là tín hiệu soft skill quan trọng.',
    signals: ['Động từ mạnh: dẫn dắt, xây dựng, tối ưu, triển khai', 'Sáng kiến cá nhân ngoài KPI', 'Cải tiến quy trình tự nguyện'],
  },
  'Trình bày STAR & Kết quả': {
    what: 'Đánh giá cấu trúc trình bày theo khúng STAR (Situation-Task-Action-Result) với kết quả số liệu cụ thể.',
    why: 'CV có STAR rõ ràng phản ánh tư duy có hệ thống và khả năng trình bày có kết quả đo lường được.',
    signals: ['Bối cảnh + nhiệm vụ được mô tả', 'Hành động cụ thể, có thể verify', 'Kết quả định lượng (%, số người dùng, doanh thu)'],
  },
  'Sự ổn định & Trung thành': {
    what: 'Phân tích lịch sử làm việc: thời gian ở mỗi công ty, tần suất chuyển việc và xu hướng phát triển.',
    why: 'Ổn định tại công ty giúp giảm chi phí tuyển dụng và đào tạo; trung thành là tín hiệu văn hóa quan trọng.',
    signals: ['≥ 2 năm/công ty được coi là ổn định', 'Nhảy việc liên tục (< 1 năm) cần giải thích', 'Xu hướng tăng cấp qua các lần chuyển'],
  },
  'Kỹ năng chuyển đổi (Skill Graph)': {
    what: 'Đánh giá khả năng áp dụng kỹ năng từ lĩnh vực này sang lĩnh vực khác — tư duy linh hoạt và adaptability.',
    why: 'Trong môi trường công nghệ thay đổi nhanh, ứng viên có transferable skills thích nghi tốt hơn.',
    signals: ['React ↔ Vue (cùng hệ sinh thái frontend)', 'Node ↔ Python backend', 'Từ product sang startup hoặc ngược lại'],
  },
  'Tiềm năng phát triển (Career Velocity)': {
    what: 'Đo tốc độ thăng tiến — thời gian để đạt mỗi cấp bậc cao hơn so với trung bình ngành.',
    why: 'Ứng viên có career velocity cao thường là A-player, mang lại ROI tốt hơn trong dài hạn.',
    signals: ['Senior trước 5 năm', 'Lead/Manager trước 8 năm', 'Tăng scope/responsibility qua mỗi lần chuyển'],
  },
  'Hệ số uy tín công ty': {
    what: 'Điều chỉnh trọng số điểm dựa trên uy tín của các công ty từng làm — tier 1, tier 2, hay startup unknown.',
    why: 'Kinh nghiệm tại công ty uy tín (Big Tech, Top Consulting) thường đảm bảo chất lượng đào tạo và quy trình.',
    signals: ['Tier 1: FAANG, McKinsey, Goldman Sachs', 'Tier 2: Top regional tech, Fortune 500 VN', 'Bonus nếu lead/senior tại startup tăng trưởng nhanh'],
  },
};

const BASIC_DESCRIPTIONS: Record<string, { what: string; why: string; signals: string[] }> = {
  'Phù hợp JD (Job Fit)': {
    what: 'So sánh từ khóa JD với nội dung CV: kỹ năng, công nghệ, ngành nghề, yêu cầu vai trò.',
    why: 'Tiêu chí này trực tiếp phản ánh ứng viên có đáp ứng đúng vị trí tuyển dụng hay không — trọng số cao nhất.',
    signals: ['Trùng đồng kỹ năng bắt buộc trong JD', 'Tên ngành/lĩnh vực giống nhau', 'Trình độ yêu cầu khớp (mà không quá cao/thấp)'],
  },
  'Kinh nghiệm': {
    what: 'Tổng số năm kinh nghiệm thực tế có liên quan đến vị trí hiện tại.',
    why: 'Kinh nghiệm là chỉ báo nằng nề nhất cho khả năng thực chiến — giảm thời gian onboard.',
    signals: ['Số năm kinh nghiệm khớp yêu cầu JD', 'Vai trò tương đương ở công ty trước', 'Đã làm việc với công nghệ/stack tương tự'],
  },
  'Kỹ năng': {
    what: 'Kỹ năng cứng (technical) và mềm (soft) được liệt kê có khớp với yêu cầu không.',
    why: 'Kỹ năng đúng giúp ứng viên làm việc hiệu quả ngay từ ngày đầu, giảm chi phí đào tạo.',
    signals: ['Công cụ/framework được dùng tích cực trong JD', 'Không chỉ liệt kê mà có dẫn chứng sử dụng', 'Kỹ năng được xác nhận qua dự án cụ thể'],
  },
  'Thành tựu/KPI': {
    what: 'Kết quả định lượng đạt được: tăng trưởng, tiết kiệm, tối ưu, tạo ra giá trị đo được.',
    why: 'Thành tựu số liệu cụ thể là bằng chứng mạnh nhất cho năng lực thực của ứng viên.',
    signals: ['Tăng doanh thu/hiệu quả bằng con số cụ thể', 'Tiết kiệm chi phí hoặc thời gian (%)', 'Đạt hoặc vượt KPI được giao'],
  },
  'Học vấn': {
    what: 'Bằng cấp, trường học, chuyên ngành và chứng chỉ chuyên môn có đáp ứng yêu cầu không.',
    why: 'Học vấn phù hợp đảm bảo nền tảng lý thuyết cho công việc — đặc biệt quan trọng với ngành kỹ thuật.',
    signals: ['Chuyên ngành đúng ngành nghề', 'Trường đào tạo uy tín (cộng điểm)', 'Chứng chỉ chuyên nghiệp: AWS, CFA, PMP...'],
  },
  'Ngôn ngữ': {
    what: 'Trình độ ngoại ngữ được kê khai so với yêu cầu ngôn ngữ của JD.',
    why: 'Vị trí quốc tế hoặc có đối tác nước ngoài cần ngôn ngữ đủ mạnh để giao tiếp hiệu quả.',
    signals: ['Tiếng Anh B2+ / IELTS 6.5+ nếu JD yêu cầu', 'Ngoại ngữ hiếm (Nhật, Hàn) là lợi thế', 'Có chứng chỉ ngôn ngữ uy tín'],
  },
  'Chuyên nghiệp': {
    what: 'Đánh giá chất lượng trình bày CV: cấu trúc rõ ràng, không lỗi chính tả, format nhất quán.',
    why: 'CV chuyên nghiệp phản ánh tác phong làm việc — ứng viên đầu tư vào chi tiết sẽ chăm chỉ hơn trong công việc.',
    signals: ['Không có lỗi chính tả, ngữ pháp', 'Layout gọn gàng, có phân mục rõ ràng', 'Không insert thông tin không liên quan'],
  },
  'Gắn bó & Lịch sử CV': {
    what: 'Phân tích xu hướng thay đổi công việc: số lần chuyển, tần suất và lý do có hợp lý.',
    why: 'Lịch sử CV cho thấy ứng viên có cam kết dài hạn hay không — tránh tuyển dụng rồi nghỉ sớm.',
    signals: ['Không chuyển việc liên tục (< 1 năm/công ty)', 'Khoảng trống giữa các công việc có giải thích hợp lý', 'Xu hướng tăng trưởng rõ ràng qua các công ty'],
  },
  'Phù hợp văn hoá': {
    what: 'Dấu hiệu văn hóa phù hợp với công ty: teamwork, innovation, agile, leadership...',
    why: 'Phù hợp văn hóa ảnh hưởng gần 50% quyết định gữ chân — thiếu sự fit này đồng nghĩa turnover cao.',
    signals: ['Hoạt động ngoại khóa, tình nguyện, community', 'Phong cách viết CV reflect văn hóa', 'Vị trí cũ có văn hóa tương đồng'],
  },
  'Hệ số uy tín công ty': {
    what: 'AI phân loại từng công ty đã làm thành Tier 1/2/3 và áp hệ số nhân tương ứng vào điểm kinh nghiệm.',
    why: 'Cùng bạn năm kinh nghiệm: người làm Google và công ty vô danh chất lượng đào tạo khác rất lớn.',
    signals: ['Tier 1 (x1.5): FAANG, Top Consulting (McKinsey, BCG), Goldman Sachs', 'Tier 2 (x1.2): Các công ty Fortune 500, Big 4, công ty tech hàng đầu Việt Nam', 'Tier 3 (x1.0): Công ty thông thường | Startup chưa nổi tiếng (không trừ điểm)'],
  },
};


const CARD_CRITERIA_META: { [key: string]: { icon: string; color: string; accent: string } } = {
  'Phù hợp JD (Job Fit)': { icon: 'fa-solid fa-bullseye', color: 'text-sky-400', accent: 'border-sky-500/30 bg-sky-500/5' },
  'Kinh nghiệm': { icon: 'fa-solid fa-briefcase', color: 'text-green-400', accent: 'border-green-500/30 bg-green-500/5' },
  'Kỹ năng': { icon: 'fa-solid fa-gears', color: 'text-purple-400', accent: 'border-purple-500/30 bg-purple-500/5' },
  'Thành tựu/KPI': { icon: 'fa-solid fa-trophy', color: 'text-yellow-400', accent: 'border-yellow-500/30 bg-yellow-500/5' },
  'Học vấn': { icon: 'fa-solid fa-graduation-cap', color: 'text-indigo-400', accent: 'border-indigo-500/30 bg-indigo-500/5' },
  'Ngôn ngữ': { icon: 'fa-solid fa-language', color: 'text-orange-400', accent: 'border-orange-500/30 bg-orange-500/5' },
  'Chuyên nghiệp': { icon: 'fa-solid fa-file-invoice', color: 'text-cyan-400', accent: 'border-cyan-500/30 bg-cyan-500/5' },
  'Gắn bó & Lịch sử CV': { icon: 'fa-solid fa-hourglass-half', color: 'text-lime-400', accent: 'border-lime-500/30 bg-lime-500/5' },
  'Phù hợp văn hoá': { icon: 'fa-solid fa-users-gear', color: 'text-pink-400', accent: 'border-pink-500/30 bg-pink-500/5' },
  'Kỹ năng hành động & chủ động': { icon: 'fa-solid fa-hand-fist', color: 'text-rose-400', accent: 'border-rose-500/30 bg-rose-500/5' },
  'Trình bày STAR & Kết quả': { icon: 'fa-solid fa-chart-line', color: 'text-teal-400', accent: 'border-teal-500/30 bg-teal-500/5' },
  'Sự ổn định & Trung thành': { icon: 'fa-solid fa-shield-halved', color: 'text-amber-400', accent: 'border-amber-500/30 bg-amber-500/5' },
  'Kỹ năng chuyển đổi (Skill Graph)': { icon: 'fa-solid fa-diagram-project', color: 'text-fuchsia-400', accent: 'border-fuchsia-500/30 bg-fuchsia-500/5' },
  'Tiềm năng phát triển (Career Velocity)': { icon: 'fa-solid fa-rocket', color: 'text-violet-400', accent: 'border-violet-500/30 bg-violet-500/5' },
  'Hệ số uy tín công ty': { icon: 'fa-solid fa-building-columns', color: 'text-emerald-400', accent: 'border-emerald-500/30 bg-emerald-500/5' },
};

// ── Accordion dùng chung ─────────────────────────────────────────────────────

interface CriterionAccordionProps {
  item: DetailedScore;
  isExpanded: boolean;
  onToggle: () => void;
  jdText: string;
  isAdvanced?: boolean;
}

const CriterionAccordion: React.FC<CriterionAccordionProps> = ({ item, isExpanded, onToggle, jdText, isAdvanced = false }) => {
  const [copied, setCopied] = React.useState(false);

  const parsedData = useMemo(() => {
    const scoreMatch = item['Điểm'].match(/([\d.]+)\/([\d.]+)/);
    const rawScore = parseFloat(scoreMatch?.[1] || '0');
    const rawMax = parseFloat(scoreMatch?.[2] || '0');

    // Normalize về đúng thang:
    // - Nâng cao: mỗi tiêu chí /4 điểm (normalize từ scale AI gốc)
    // - Cơ bản: giữ nguyên scale AI (tổng 80)
    const displayMax = isAdvanced ? ADVANCED_MAX_PER : rawMax;
    const displayScore = isAdvanced && rawMax > 0
      ? parseFloat(((rawScore / rawMax) * ADVANCED_MAX_PER).toFixed(2))
      : rawScore;

    const achievedPct = rawMax > 0 ? Math.round((rawScore / rawMax) * 100) : 0;

    let formulaMatch = item['Công thức'].match(/subscore ([\d.]+)\/([\d.]+)% = ([\d.]+) points/);
    let weight = parseFloat(formulaMatch?.[2] || '0');

    if (!formulaMatch) {
      formulaMatch = item['Công thức'].match(/subscore ([\d.]+) × trọng số ([\d]+)% = (.*)$/);
      weight = parseFloat(formulaMatch?.[2] || '0');
    }

    const contributionPct = parseFloat((achievedPct).toFixed(1));
    return { score: displayScore, maxScore: displayMax, rawScore, rawMax, weight, achievedPct, contributionPct };
  }, [item, isAdvanced]);

  const handleCopy = () => {
    navigator.clipboard.writeText(item['Dẫn chứng']);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const meta = CARD_CRITERIA_META[item['Tiêu chí']] || { icon: 'fa-solid fa-question-circle', color: 'text-slate-400', accent: 'border-slate-700 bg-slate-900/20' };
  const advDesc = ADVANCED_DESCRIPTIONS[item['Tiêu chí']];

  const scorePercentage = parsedData.achievedPct;
  const scoreBadgeClass = scorePercentage >= 85
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
    : scorePercentage >= 65
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
      : 'bg-red-500/15 text-red-300 border-red-500/35';

  const proficiency = scorePercentage >= 90 ? 'Expert'
    : scorePercentage >= 75 ? 'Advanced'
    : scorePercentage >= 55 ? 'Intermediate'
    : 'Beginner';

  const isExperience = /Kinh nghiệm/i.test(item['Tiêu chí']);
  const jdRequirements = useMemo(() => extractJDRequirements(jdText), [jdText]);
  const thisRequirement = useMemo(() => jdRequirements.find(r => r.display === item['Tiêu chí']), [jdRequirements, item]);
  const requirementComparison = useMemo(() => {
    if (isExperience || !thisRequirement) return null;
    return compareEvidence(item['Tiêu chí'], thisRequirement.keywords, item['Dẫn chứng']);
  }, [thisRequirement, item, isExperience]);

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
                <div className={`h-full ${typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 80 ? 'bg-emerald-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 65 ? 'bg-yellow-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${typeof matchMeta.matchPercent === 'number' ? Math.min(100, Math.max(0, matchMeta.matchPercent)) : 0}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {matchMeta.matched.slice(0, 5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 text-[10px] border border-emerald-500/40">{k}</span>)}
              {matchMeta.missing.slice(0, 5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-yellow-600/30 text-yellow-300 text-[10px] border border-yellow-500/40">{k}</span>)}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border transition-all duration-200 hover:shadow-md ${isAdvanced ? `${meta.accent} hover:shadow-fuchsia-500/5` : 'border-slate-800/60 bg-[#0f1729] hover:border-cyan-500/25 hover:shadow-cyan-500/5'}`}>
      <button className="flex min-h-[56px] w-full items-center justify-between p-3.5 text-left" onClick={onToggle} aria-expanded={isExpanded}>
        <div className="flex min-w-0 items-center gap-3">
          <i className={`${meta.icon} ${meta.color} w-5 text-center text-lg`}></i>
          <span className="truncate font-semibold text-slate-100">{item['Tiêu chí']}</span>
          <span className="ml-1 rounded border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400">{proficiency}</span>
          {isAdvanced && <span className="ml-1 rounded border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-violet-400 uppercase">AI+</span>}
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

          {/* Nâng cao: Thẻ giải thích đặc biệt */}
          {isAdvanced && advDesc && (
            <div className={`mb-4 rounded-xl border p-4 ${meta.accent}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.accent}`}>
                  <i className={`${meta.icon} ${meta.color} text-sm`}></i>
                </div>
                <div className="flex-1 space-y-2.5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tiêu chí đo gì</p>
                    <p className="text-sm text-slate-200 leading-relaxed">{advDesc.what}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tại sao quan trọng</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{advDesc.why}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tín hiệu nhận diện</p>
                    <div className="flex flex-wrap gap-1.5">
                      {advDesc.signals.map((s, i) => (
                        <span key={i} className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${meta.accent} ${meta.color}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 ${isExperience || requirementComparison ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-4`}>
            {/* Dẫn chứng */}
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <div className="mb-2 flex items-center justify-between">
                <h5 className="text-base font-bold text-slate-200">Dẫn chứng (trích từ CV)</h5>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-cyan-400">
                  <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  {copied ? 'Đã chép' : 'Chép'}
                </button>
              </div>
              <blockquote className="border-l-4 border-cyan-500/60 pl-4 text-base italic leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                __html: item['Dẫn chứng'] === 'Không tìm thấy thông tin trong CV'
                  ? '<span class="not-italic rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">Chưa tìm thấy trong CV</span>'
                  : item['Dẫn chứng']
              }} />

              {/* Nâng cao: badge lý do dẫn chứng */}
              {isAdvanced && item['Dẫn chứng'] && item['Dẫn chứng'] !== 'Không tìm thấy thông tin trong CV' && (
                <div className="mt-3 pt-3 border-t border-slate-800/50">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lý do chấm điểm</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item['Giải thích']}</p>
                </div>
              )}
            </div>

            {isExperience && experienceBlock}
            {!isExperience && requirementComparison && (
              <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
                <h5 className="mb-1 text-base font-bold text-slate-100">Phân tích nhanh</h5>
                <div className="text-[11px] text-slate-400">Từ khóa JD ({requirementComparison.jdKeywords.length})</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {requirementComparison.jdKeywords.slice(0, 12).map(k => <span key={k} className="pill pill--uncertain">{k}</span>)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Khớp</div>
                <div className="flex flex-wrap gap-1">
                  {requirementComparison.matched.length > 0 ? requirementComparison.matched.slice(0, 10).map(k => <span key={k} className="pill pill--match">{k}</span>) : <span className="text-[11px] text-slate-500">(Không)</span>}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-2">Thiếu</div>
                <div className="flex flex-wrap gap-1">
                  {requirementComparison.missing.length > 0 ? requirementComparison.missing.slice(0, 10).map(k => <span key={k} className="pill pill--missing">{k}</span>) : <span className="text-[11px] text-slate-500">(Không)</span>}
                </div>
              </div>
            )}

            {/* Giải thích & Công thức */}
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <h5 className="mb-4 text-base font-bold text-slate-100">Giải thích & Công thức</h5>

            {/* Giải thích đa chỉ — hiển thị cả basic lẫn advanced */}
            {(BASIC_DESCRIPTIONS[item['Tiêu chí']] || ADVANCED_DESCRIPTIONS[item['Tiêu chí']]) ? (() => {
              const desc = BASIC_DESCRIPTIONS[item['Tiêu chí']] || ADVANCED_DESCRIPTIONS[item['Tiêu chí']];
              const isAdv = !!ADVANCED_DESCRIPTIONS[item['Tiêu chí']];
              return (
                <div className={`mb-4 rounded-xl border p-4 space-y-3 ${
                  isAdv
                    ? 'border-violet-500/20 bg-violet-500/5'
                    : 'border-cyan-500/20 bg-cyan-500/5'
                }`}>
                  {/* What */}
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      isAdv ? 'text-violet-400/70' : 'text-cyan-400/70'
                    }`}>Ðây là gì?</p>
                    <p className="text-sm leading-relaxed text-slate-300">{desc.what}</p>
                  </div>
                  {/* Why */}
                  <div className="pt-2 border-t border-slate-800/50">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      isAdv ? 'text-violet-400/70' : 'text-cyan-400/70'
                    }`}>Tại sao quan trọng?</p>
                    <p className="text-sm leading-relaxed text-slate-400">{desc.why}</p>
                  </div>
                  {/* Signals */}
                  <div className="pt-2 border-t border-slate-800/50">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                      isAdv ? 'text-violet-400/70' : 'text-cyan-400/70'
                    }`}>Dấu hiệu nhận biết</p>
                    <ul className="space-y-1.5">
                      {desc.signals.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                          <i className={`fa-solid fa-circle-check mt-0.5 shrink-0 text-[10px] ${
                            isAdv ? 'text-violet-400' : 'text-cyan-400'
                          }`} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* AI result */}
                  {item['Giải thích'] && item['Giải thích'] !== '...' && (
                    <div className="pt-2 border-t border-slate-800/50">
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                        isAdv ? 'text-violet-400/70' : 'text-cyan-400/70'
                      }`}>Nhận xét của AI với CV này</p>
                      <p className="text-xs leading-relaxed text-slate-300 italic">"{item['Giải thích']}"</p>
                    </div>
                  )}
                </div>
              );
            })() : (
              // Fallback: chỉ hiển thị text thô nếu không có mô tả
              item['Giải thích'] && (
                <div className="mb-4">
                  <p className="text-sm leading-relaxed text-slate-300">{item['Giải thích']}</p>
                </div>
              )
            )}

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
                    {parsedData.weight > 0 ? (
                      <span>
                        <span className="text-sky-400">{parsedData.score.toFixed(1)}</span>
                        {' / '}
                        <span className="text-violet-400">{parsedData.maxScore}</span>
                        {' = '}
                        <span className="font-bold text-amber-400">{parsedData.contributionPct}%</span>
                        <span className="text-slate-500"> ({parsedData.weight}% trọng số)</span>
                      </span>
                    ) : (
                      <span>
                        <span className="text-sky-400">{parsedData.score.toFixed(1)}</span>
                        {' / '}
                        <span className="text-violet-400">{parsedData.maxScore}</span>
                        {' = '}
                        <span className="font-bold text-amber-400">{parsedData.achievedPct}%</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                  <div className="mb-1 text-xs text-slate-500">Đóng góp vào điểm tổng</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${parsedData.achievedPct >= 80 ? 'bg-emerald-500' : parsedData.achievedPct >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, parsedData.achievedPct)}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold tabular-nums ${parsedData.achievedPct >= 80 ? 'text-emerald-400' : parsedData.achievedPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{parsedData.achievedPct}%</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Tiêu chí này đóng góp{' '}
                      <span className="font-bold text-amber-400 font-mono">{parsedData.score.toFixed(2)}</span>
                      {' / '}
                      <span className="text-slate-400 font-mono">{parsedData.maxScore}</span> điểm
                      {isAdvanced && (
                        <span className="text-violet-400/70 ml-1 text-[10px]">(thang chuẩn nâng cao)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ExpandedContent chính ───────────────────────────────────────────────────

interface ExpandedContentProps {
  candidate: Candidate;
  expandedCriteria: Record<string, Record<string, boolean>>;
  onToggleCriterion: (candidateId: string, criterion: string) => void;
  jdText: string;
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({ candidate, expandedCriteria, onToggleCriterion, jdText }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const allDetails = candidate.analysis?.['Chi tiết'] || [];

  const basicDetails = useMemo(() =>
    allDetails
      .filter(item => BASIC_CRITERIA.includes(item['Tiêu chí']))
      .sort((a, b) => BASIC_CRITERIA.indexOf(a['Tiêu chí']) - BASIC_CRITERIA.indexOf(b['Tiêu chí'])),
    [allDetails]
  );

  const advancedDetails = useMemo(() =>
    allDetails
      .filter(item => ADVANCED_CRITERIA.includes(item['Tiêu chí']))
      .sort((a, b) => ADVANCED_CRITERIA.indexOf(a['Tiêu chí']) - ADVANCED_CRITERIA.indexOf(b['Tiêu chí'])),
    [allDetails]
  );

  // Tổng điểm phân loại — normalize vào đúng thang
  const basicScore = useMemo(() =>
    basicDetails.reduce((sum, item) => {
      const m = item['Điểm'].match(/([\d.]+)\//);
      return sum + parseFloat(m?.[1] || '0');
    }, 0),
    [basicDetails]
  );

  // Normalize tất cả tiêu chí nâng cao về thang /4 rồi cộng lại (≤ 20)
  const advancedScore = useMemo(() =>
    advancedDetails.reduce((sum, item) => {
      const m = item['Điểm'].match(/([\d.]+)\/([\d.]+)/);
      const raw = parseFloat(m?.[1] || '0');
      const max = parseFloat(m?.[2] || '0');
      const normalized = max > 0 ? (raw / max) * ADVANCED_MAX_PER : 0;
      return sum + normalized;
    }, 0),
    [advancedDetails]
  );

  // Tổng điểm đúng = cơ bản (max 80) + nâng cao đã normalize (max 20) = tối đa 100
  const totalScore = parseFloat((basicScore + Math.min(advancedScore, ADVANCED_TOTAL_MAX)).toFixed(1));
  const matchPercent = Math.min(100, Math.round((totalScore / 100) * 100));
  const recommendation = totalScore >= 75
    ? 'Ứng viên xuất sắc, nên ưu tiên mời phỏng vấn sớm.'
    : totalScore >= 60
      ? 'Ứng viên có nền tảng tốt, nên xem xét mời phỏng vấn.'
      : totalScore >= 40
        ? 'Ứng viên có tiềm năng, cân nhắc nếu thiếu nguồn.'
        : 'Nên ưu tiên ứng viên khác có mức phù hợp cao hơn.';

  return (
    <div className="space-y-4 p-2 md:p-4">

      {/* ── Tổng hợp đánh giá ─────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/60 bg-[#0f1729] p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <i className="fa-solid fa-chart-pie text-cyan-400" />
            Tổng hợp đánh giá
          </h4>
          <div className="grid w-full grid-cols-4 gap-2 md:w-auto">
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs">
              <div className="text-slate-500">Tổng điểm</div>
              <div className="font-semibold text-slate-100">{totalScore}<span className="text-slate-500">/100</span></div>
            </div>
            <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs">
              <div className="text-cyan-500/70">Cơ bản</div>
              <div className="font-semibold text-cyan-300">{basicScore.toFixed(1)}<span className="text-slate-500">/{BASIC_TOTAL_MAX}</span></div>
            </div>
            <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-xs">
              <div className="text-violet-400/70">Nâng cao</div>
              <div className="font-semibold text-violet-300">{advancedScore.toFixed(1)}<span className="text-slate-500">/{ADVANCED_TOTAL_MAX}</span></div>
            </div>
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs">
              <div className="text-slate-500">Phù hợp JD</div>
              <div className="font-semibold text-emerald-400">{matchPercent}%</div>
            </div>
          </div>
        </div>

        {/* Progress bar kép */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-16 text-cyan-500/80">Cơ bản</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (basicScore / BASIC_TOTAL_MAX) * 100)}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-cyan-400">{Math.round((basicScore / BASIC_TOTAL_MAX) * 100)}%</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-16 text-violet-400/80">Nâng cao</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (advancedScore / ADVANCED_TOTAL_MAX) * 100)}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-violet-400">{Math.round((advancedScore / ADVANCED_TOTAL_MAX) * 100)}%</span>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-200">Nhận định:</span>{' '}
          <span className="text-slate-400">{recommendation}</span>
        </div>
      </div>

      {/* ── Điểm mạnh / yếu ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidate.analysis?.['Điểm mạnh CV'] && (
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/25 rounded-xl">
            <p className="font-semibold text-green-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-wand-magic-sparkles"></i>Điểm mạnh CV
            </p>
            <ul className="list-disc list-inside text-sm text-green-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Điểm mạnh CV'].map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>
          </div>
        )}
        {candidate.analysis?.['Điểm yếu CV'] && (
          <div className="p-4 bg-rose-900/20 border border-rose-500/25 rounded-xl">
            <p className="font-semibold text-red-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-flag"></i>Điểm yếu CV
            </p>
            <ul className="list-disc list-inside text-sm text-red-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Điểm yếu CV'].map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* ── Cảnh báo AI Debiasing ────────────────────────────── */}
      {candidate.debiasingWarnings && candidate.debiasingWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/15 p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-300">
            <i className="fa-solid fa-scale-balanced"></i> Cảnh báo Đạo đức AI
          </h4>
          <ul className="space-y-2">
            {candidate.debiasingWarnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-950/30 p-2.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
                <span className="text-sm text-amber-200/80 leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Education Validation ─────────────────────────────── */}
      {candidate.analysis?.educationValidation && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0f1729] p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-100">
            <i className="fa-solid fa-graduation-cap text-indigo-400"></i> Xác thực học vấn
          </h4>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
            <p className="font-mono text-sm text-slate-300">{candidate.analysis.educationValidation.standardizedEducation || 'Không có thông tin'}</p>
            <span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${candidate.analysis.educationValidation.validationNote === 'Hợp lệ' ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' : 'border-red-500/35 bg-red-500/10 text-red-300'}`}>
              {candidate.analysis.educationValidation.validationNote}
            </span>
          </div>
        </div>
      )}

      {/* ── Tab chuyển đổi Cơ bản / Nâng cao ───────────────── */}
      <div className="rounded-xl border border-slate-800/60 bg-[#0a0f1e] overflow-hidden">

        {/* Tab header */}
        <div className="flex border-b border-slate-800/60">
          <button
            onClick={() => setActiveTab('basic')}
            className={`relative flex-1 flex items-center justify-center gap-2.5 px-4 py-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'basic'
                ? 'text-cyan-300 bg-cyan-500/8'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            {activeTab === 'basic' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            )}
            <i className="fa-solid fa-layer-group text-base"></i>
            <span>Tiêu chí cơ bản</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
              activeTab === 'basic'
                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}>{BASIC_TOTAL_MAX} điểm</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              basicScore / BASIC_TOTAL_MAX >= 0.8 ? 'text-emerald-400' : basicScore / BASIC_TOTAL_MAX >= 0.6 ? 'text-amber-400' : 'text-red-400'
            }`}>{basicScore.toFixed(1)}/{BASIC_TOTAL_MAX}</span>
          </button>

          <div className="w-px bg-slate-800/60 my-2" />

          <button
            onClick={() => setActiveTab('advanced')}
            className={`relative flex-1 flex items-center justify-center gap-2.5 px-4 py-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'advanced'
                ? 'text-violet-300 bg-violet-500/8'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            {activeTab === 'advanced' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
            )}
            <i className="fa-solid fa-rocket text-base"></i>
            <span>Tiêu chí nâng cao</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
              activeTab === 'advanced'
                ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}>{ADVANCED_TOTAL_MAX} điểm</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              advancedScore / ADVANCED_TOTAL_MAX >= 0.8 ? 'text-emerald-400' : advancedScore / ADVANCED_TOTAL_MAX >= 0.6 ? 'text-amber-400' : 'text-red-400'
            }`}>{advancedScore.toFixed(1)}/{ADVANCED_TOTAL_MAX}</span>
            <span className="rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-400 uppercase tracking-wider">AI+</span>
          </button>
        </div>

        {/* Tab body */}
        <div className="p-4">
          {activeTab === 'basic' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/40">
                <i className="fa-solid fa-circle-info text-cyan-500/60 text-xs"></i>
                <p className="text-[11px] text-slate-500">10 tiêu chí cốt lõi · Tổng phổ điểm <span className="text-cyan-400 font-bold">{BASIC_TOTAL_MAX}</span> điểm · Đánh giá nền tảng ứng viên</p>
              </div>
              {basicDetails.length > 0 ? (
                basicDetails.map(item => (
                  <CriterionAccordion
                    key={item['Tiêu chí']}
                    item={item}
                    isExpanded={!!expandedCriteria[candidate.id]?.[item['Tiêu chí']]}
                    onToggle={() => onToggleCriterion(candidate.id, item['Tiêu chí'])}
                    jdText={jdText}
                    isAdvanced={false}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <i className="fa-solid fa-layer-group text-3xl mb-3 opacity-30"></i>
                  <p className="text-sm">Chưa có dữ liệu tiêu chí cơ bản</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/40">
                <i className="fa-solid fa-circle-info text-violet-500/60 text-xs"></i>
                <p className="text-[11px] text-slate-500">5 tiêu chí AI nâng cao · Mỗi tiêu chí tối đa <span className="text-violet-400 font-bold">{ADVANCED_MAX_PER}</span> điểm · Tổng <span className="text-violet-400 font-bold">{ADVANCED_TOTAL_MAX}</span> điểm · Phân tích hành vi & tiềm năng</p>
              </div>
              {advancedDetails.length > 0 ? (
                advancedDetails.map(item => (
                  <CriterionAccordion
                    key={item['Tiêu chí']}
                    item={item}
                    isExpanded={!!expandedCriteria[candidate.id]?.[item['Tiêu chí']]}
                    onToggle={() => onToggleCriterion(candidate.id, item['Tiêu chí'])}
                    jdText={jdText}
                    isAdvanced={true}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <i className="fa-solid fa-rocket text-3xl mb-3 opacity-30"></i>
                  <p className="text-sm">Chưa có dữ liệu tiêu chí nâng cao</p>
                  <p className="text-xs mt-1 text-slate-600">Cần phân tích CV với model hỗ trợ tiêu chí nâng cao</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandedContent;