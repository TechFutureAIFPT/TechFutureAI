/**
 * industryService.ts — Entry point cho Industry services
 */

export { applyCompanyTierMultiplier } from './companyTiering';
export type { CompanyTier, TieringResult } from './companyTiering';

export { scoreSkillMatch, SKILL_KEYWORDS, SKILL_CLUSTERS } from './skillGraph';
export type { SkillMatchResult } from './skillGraph';

export { detectIndustry } from './industryDetector';
export { getIndustryBaseline, applyIndustryBaselineEnhancement } from './embedding-vector/similarity/industryEmbeddingService';
