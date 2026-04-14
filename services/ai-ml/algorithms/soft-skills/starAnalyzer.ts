/**
 * starAnalyzer.ts — STAR (Situation, Task, Action, Result) Analyzer
 */

export interface STARScore {
  situation: number;
  task: number;
  action: number;
  result: number;
  total: number;
  hasNumbers: boolean;
  hasMetrics: boolean;
  starFormatted: boolean;
  reasoning: string;
}

const METRIC_PATTERNS = [/\d+[%]/, /\$\d+/, /\d+[\.,]\d+[\.,]\d+/, /x\d+/, /\d+[trKMB](?:\/|\s)/, /tăng\s+\d+/, /giảm\s+\d+/, /đạt\s+\d+/, /\d+\s*lần/];

function hasMetrics(text: string): boolean {
  return METRIC_PATTERNS.some(p => p.test(text));
}

function countIndicators(text: string, indicators: string[]): number {
  const lower = text.toLowerCase();
  return indicators.filter(ind => lower.includes(ind)).length;
}

export function analyzeSTARFormat(cvText: string): STARScore {
  const paragraphs = cvText.split(/\n\n|\n(?=[A-Z])/).filter(p => p.trim().length > 20);
  let s = 0, t = 0, a = 0, r = 0;

  const S_IND = ['trước đó', 'trong bối cảnh', 'khi đó', 'thời điểm đó', 'situated', 'facing', 'challenge', 'thách thức', 'vấn đề', 'bối cảnh'];
  const T_IND = ['nhiệm vụ', 'trách nhiệm', 'task', 'mission', 'goal', 'mục tiêu', 'objective', 'need to', 'required to'];
  const A_IND = ['đã', 'implemented', 'developed', 'designed', 'created', 'managed', 'led', 'coordinated', 'analyzed', 'triển khai', 'xây dựng', 'thiết kế', 'quản lý', 'lãnh đạo', 'thực hiện'];
  const R_IND = ['kết quả', 'result', 'outcome', 'achieved', 'delivered', 'improved', 'increased', 'reduced', 'thành công', 'đạt được', 'tăng', 'hiệu quả'];

  let hasNumbers = false;
  let hasMetricsFlag = false;

  for (const para of paragraphs) {
    if (countIndicators(para, S_IND) > 0) s += 1;
    if (countIndicators(para, T_IND) > 0) t += 1;
    if (countIndicators(para, A_IND) > 0) a += 1;
    if (countIndicators(para, R_IND) > 0) r += 1;
    if (/\d+/.test(para)) hasNumbers = true;
    if (hasMetrics(para)) hasMetricsFlag = true;
  }

  s = Math.min(3, s); t = Math.min(3, t); a = Math.min(3, a); r = Math.min(3, r);
  const total = s + t + a + r;
  const starFormatted = total >= 8 && hasNumbers;

  let reasoning = total >= 8 ? 'CV có cấu trúc STAR rõ ràng, kèm số liệu chứng minh.' : total >= 5 ? 'CV có một số yếu tố STAR, cần cải thiện kết quả và số liệu.' : total >= 3 ? 'CV thiên về liệt kê trách nhiệm, thiếu kết quả cụ thể.' : 'CV rất sơ lược, khó đánh giá năng lực thực tế.';
  if (hasMetricsFlag) reasoning += ' Phát hiện số liệu định lượng.';

  return { situation: s, task: t, action: a, result: r, total, hasNumbers, hasMetrics: hasMetricsFlag, starFormatted, reasoning };
}
