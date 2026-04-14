/**
 * debiasingService.ts — AI Debiasing & Anti-Bias Service
 *
 * Mù hóa dữ liệu CV trước khi chấm điểm.
 * Cảnh báo khi HR đặt bộ lọc nhạy cảm.
 */

export interface DebiasResult {
  overallSafe: boolean;
  warnings: string[];
  blindedFields: string[];
  removedPatterns: string[];
}

// Local type — mirrors HardFilters bias fields from assets/types
export interface BiasSensitiveFilters {
  age?: { min?: number; max?: number };
  gender?: string[];
  ethnicity?: string[];
  religion?: string[];
  maritalStatus?: string[];
  [key: string]: unknown;
}

const BIAS_PATTERNS = [
  { pattern: /\b(nam|nữ|nam giới|nữ giới|giới tính|gender)\b/gi, label: 'giới tính' },
  { pattern: /\b(\d{2})\s*(tuổi|years?\s*old)\b/gi, label: 'tuổi' },
  { pattern: /\b(tôn giáo|religion|faith)\b/gi, label: 'tôn giáo' },
  { pattern: /\b(dân tộc|ethnicity|ethnic)\b/gi, label: 'dân tộc' },
  { pattern: /\b(hôn nhân|married|marital)\b/gi, label: 'hôn nhân' },
  { pattern: /\b(quê|quên|hometown|birthplace)\b/gi, label: 'quê quán' },
  { pattern: /\b(hình ảnh|photo|avatar|image)\b/gi, label: 'hình ảnh' },
];

const VIETNAM_BIAS_LAWS = [
  'Điều 8 BLLĐ 2019 — Nghiêm cấm phân biệt đối xử trên cơ sở giới tính, tuổi tác, tôn giáo, dân tộc.',
  'Điều 36 BLLĐ 2019 — Không được yêu cầu xác nhận tình trạng hôn nhân khi tuyển dụng.',
  'Nghị định 39/2021/NĐ-CP — Quy định về bình đẳng giới trong lao động.',
];

function checkBiasRisk(filters: BiasSensitiveFilters): string[] {
  const warnings: string[] = [];

  if (filters.age && (filters.age.min !== undefined || filters.age.max !== undefined)) {
    warnings.push(`Cảnh báo: Bộ lọc tuổi (${filters.age.min ?? '?'}–${filters.age.max ?? '?'}) có thể vi phạm Điều 8 BLLĐ 2019.`);
  }
  if (filters.gender && filters.gender.length > 0) {
    warnings.push(`Cảnh báo: Bộ lọc giới tính "${filters.gender.join(', ')}" có thể vi phạm luật Bình đẳng lao động Việt Nam.`);
  }
  if (filters.ethnicity && filters.ethnicity.length > 0) {
    warnings.push(`Cảnh báo: Bộ lọc dân tộc có thể vi phạm Điều 8 BLLĐ 2019.`);
  }
  if (filters.religion && filters.religion.length > 0) {
    warnings.push(`Cảnh báo: Bộ lọc tôn giáo có thể vi phạm quyền tự do tín ngưỡng.`);
  }
  if (filters.maritalStatus && filters.maritalStatus.length > 0) {
    warnings.push(`Cảnh báo: Bộ lọc tình trạng hôn nhân vi phạm Điều 36 BLLĐ 2019.`);
  }

  if (warnings.length > 0) {
    warnings.push(...VIETNAM_BIAS_LAWS);
  }

  return warnings;
}

export function runDebiasingPipeline(cvText: string, filters: BiasSensitiveFilters): DebiasResult {
  const warnings: string[] = [];
  const blindedFields: string[] = [];
  const removedPatterns: string[] = [];

  // Check hard filter bias risk
  const filterWarnings = checkBiasRisk(filters);
  warnings.push(...filterWarnings);

  // Blind CV text
  let blinded = cvText;
  for (const { pattern, label } of BIAS_PATTERNS) {
    const matches = cvText.match(pattern);
    if (matches && matches.length > 0) {
      removedPatterns.push(...matches);
      blindedFields.push(label);
    }
    blinded = blinded.replace(pattern, `[${label} đã ẩn]`);
  }

  return {
    overallSafe: warnings.length === 0,
    warnings,
    blindedFields: [...new Set(blindedFields)],
    removedPatterns,
  };
}
