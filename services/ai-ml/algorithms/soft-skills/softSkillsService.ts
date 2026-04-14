/**
 * softSkillsService.ts — Entry point cho Soft Skills Analysis
 */

import { analyzeActionVerbs } from './actionVerbAnalyzer';
import { analyzeSTARFormat } from './starAnalyzer';
import { analyzeTenure } from './tenureAnalyzer';

export interface SoftSkillsReport {
  criteriaScores: Record<string, { score: number; maxScore: number; reasoning: string }>;
}

export function analyzeSoftSkills(cvText: string): SoftSkillsReport {
  const action = analyzeActionVerbs(cvText);
  const star = analyzeSTARFormat(cvText);
  const tenure = analyzeTenure(cvText);

  const criteriaScores: Record<string, { score: number; maxScore: number; reasoning: string }> = {};

  const label = action.level === 'leader' ? 'Chủ động cao (Lãnh đạo)' : action.level === 'active' ? 'Chủ động' : action.level === 'passive' ? 'Thụ động' : 'Chưa rõ';
  criteriaScores['Kỹ năng hành động & chủ động'] = { score: action.score, maxScore: 10, reasoning: `${label}. ${action.reasoning}` };

  criteriaScores['Trình bày STAR & Kết quả'] = { score: Math.round((star.total / 12) * 10 * 10) / 10, maxScore: 10, reasoning: star.reasoning };

  const tenureTag = tenure.loyaltyTag === 'stable' ? 'Ổn định' : tenure.loyaltyTag === 'moderate' ? 'Khá linh hoạt' : 'Nhảy việc thường xuyên';
  criteriaScores['Sự ổn định & Trung thành'] = { score: tenure.loyaltyIndex, maxScore: 10, reasoning: `${tenureTag}. ${tenure.reasoning}` };

  return { criteriaScores };
}
