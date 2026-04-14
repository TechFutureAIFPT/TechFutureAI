/**
 * weightingEngine.ts — Dynamic Contextual Weighting Engine
 */

export interface WeightedContext {
  jdIndustry?: string;
  jobLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'manager';
  isTech?: boolean;
}

export interface ContextualCriteria {
  name: string;
  baseWeight: number;
  adjustedWeight: number;
  adjustmentReason: string;
}

export function adjustWeightsByContext(
  weights: Record<string, { name: string; weight: number }>,
  context: WeightedContext
): ContextualCriteria[] {
  const result: ContextualCriteria[] = [];
  for (const [, criterion] of Object.entries(weights)) {
    let adjustedWeight = criterion.weight || 0;
    const reasons: string[] = [];

    if (context.isTech) {
      if (criterion.name.includes('Kỹ năng')) {
        adjustedWeight = Math.min(100, adjustedWeight * 1.15);
        reasons.push('Ngành Tech: tăng 15% cho Kỹ năng');
      }
    }
    if (context.jobLevel === 'junior' && criterion.name.includes('Kinh nghiệm')) {
      adjustedWeight = Math.max(0, adjustedWeight * 0.8);
      reasons.push('Junior: giảm 20% cho Kinh nghiệm');
    }
    result.push({ name: criterion.name, baseWeight: criterion.weight || 0, adjustedWeight: Math.round(adjustedWeight), adjustmentReason: reasons.join('; ') || 'Giữ nguyên' });
  }
  return result;
}
