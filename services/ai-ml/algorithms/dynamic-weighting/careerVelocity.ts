/**
 * careerVelocity.ts — Career Velocity Analyzer
 *
 * Đánh giá tốc độ phát triển sự nghiệp dựa trên thời gian thăng tiến.
 * Một ứng viên thăng tiến nhanh được đánh giá "Tiềm năng" cao hơn.
 */

export interface CareerMilestone {
  title: string;
  level: number;
  company?: string;
  durationMonths: number;
  isPromotion: boolean;
}

export interface CareerVelocityResult {
  peakLevel: number;
  peakTitle: string;
  totalMonths: number;
  promotionMonths: number;
  promotionCount: number;
  avgMonthsPerLevel: number;
  potentialScore: number;
  velocityTag: 'fast' | 'normal' | 'slow';
  milestones: CareerMilestone[];
}

function inferLevel(title: string): number {
  const lower = title.toLowerCase();
  if (/director|vp|vice president|cto|ceo|cfo/i.test(lower)) return 6;
  if (/manager|giám đốc|trưởng phòng|head/i.test(lower)) return 5;
  if (/lead|team lead|trưởng nhóm/i.test(lower)) return 4;
  if (/senior|sr\.|chuyên gia|expert|cao cấp/i.test(lower)) return 3;
  if (/intern|fresher|thực tập/i.test(lower)) return 0;
  return 2;
}

export function parseExperienceToMilestones(experienceText: string): CareerMilestone[] {
  const milestones: CareerMilestone[] = [];
  const lines = experienceText.split(/\n|\r/).filter(l => l.trim().length > 5);
  let currentTitle = '';
  let currentLevel = 2;
  let currentCompany = '';
  const currentYear = new Date().getFullYear();

  for (const line of lines) {
    const titleMatch = line.match(/(?:chức danh|vị trí|position|role|title)[:\s]*(.+)/i);
    const companyMatch = line.match(/(?:công ty|company|doanh nghiệp|tại)[:\s]*(.+)/i);
    const yearMatch = line.match(/(?:20\d{2}|19\d{2})(?:\s*[-–]\s*(?:20\d{2}|19\d{2}|nay|hiện tại|present))?/gi);

    if (titleMatch) {
      currentTitle = titleMatch[1].trim();
      currentLevel = inferLevel(currentTitle);
    }
    if (companyMatch) currentCompany = companyMatch[1].trim();
    if (yearMatch) {
      const years = yearMatch.join(' ').match(/\d{4}/g);
      if (years && years.length >= 1) {
        const from = parseInt(years[0]);
        const to = years[1] ? parseInt(years[1]) : currentYear;
        const months = Math.max(0, (to - from) * 12);
        const isPromotion = milestones.length > 0 && currentLevel > (milestones[milestones.length - 1]?.level ?? 0);
        milestones.push({ title: currentTitle || 'Không rõ chức danh', level: currentLevel, company: currentCompany, durationMonths: months, isPromotion });
        currentTitle = '';
        currentCompany = '';
      }
    }
  }

  return milestones;
}

export function analyzeCareerVelocity(experienceText: string): CareerVelocityResult {
  const milestones = parseExperienceToMilestones(experienceText);

  if (milestones.length === 0) {
    return { peakLevel: 0, peakTitle: 'Không rõ', totalMonths: 0, promotionMonths: 0, promotionCount: 0, avgMonthsPerLevel: 0, potentialScore: 0, velocityTag: 'normal', milestones: [] };
  }

  const peakIdx = milestones.reduce((max, m, i) => m.level > milestones[max].level ? i : max, 0);
  const peak = milestones[peakIdx];
  const totalMonths = milestones.reduce((sum, m) => sum + m.durationMonths, 0);
  const promotionMonths = milestones.filter(m => m.isPromotion).reduce((sum, m) => sum + m.durationMonths, 0);
  const promotionCount = milestones.filter(m => m.isPromotion).length;
  const avgMonthsPerLevel = promotionCount > 0 ? promotionMonths / promotionCount : totalMonths;

  let potentialScore = 0;
  let velocityTag: 'fast' | 'normal' | 'slow' = 'normal';

  if (avgMonthsPerLevel <= 18) { potentialScore = 18; velocityTag = 'fast'; }
  else if (avgMonthsPerLevel <= 36) { potentialScore = 12; velocityTag = 'normal'; }
  else { potentialScore = 6; velocityTag = 'slow'; }

  if (peak.level >= 4) potentialScore = Math.min(20, potentialScore + 2);
  if (promotionCount >= 3) potentialScore = Math.min(20, potentialScore + 2);

  return { peakLevel: peak.level, peakTitle: peak.title, totalMonths, promotionMonths, promotionCount, avgMonthsPerLevel: Math.round(avgMonthsPerLevel), potentialScore, velocityTag, milestones };
}
