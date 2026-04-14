/**
 * dynamicBoost.ts — Dynamic Boost Engine
 *
 * Cơ chế "Dynamic Boost" tự động tăng trọng số cho các thành tựu nổi bật
 * để bù đắp thiếu sót nhỏ thay vì trừ điểm máy móc.
 */

export interface BoostSignal {
  type: 'outstanding' | 'exceptional' | 'breakthrough';
  sourceCriterion: string;
  sourceScore: number;
  boostedCriteria: string[];
  boostAmount: number;
  reason: string;
}

export interface DynamicBoostConfig {
  maxBoostableScore: number;
  boostThreshold: number;
  boostMultipliers: {
    outstanding: number;
    exceptional: number;
    breakthrough: number;
  };
  maxAffectedCriteria: number;
}

const DEFAULT_CONFIG: DynamicBoostConfig = {
  maxBoostableScore: 90,
  boostThreshold: 75,
  boostMultipliers: { outstanding: 1.5, exceptional: 2.0, breakthrough: 2.5 },
  maxAffectedCriteria: 3,
};

const OUTSTANDING_ACHIEVEMENT_KEYWORDS = [
  'tăng trưởng', 'doanh thu', 'lợi nhuận', 'thành công', 'hoàn thành',
  'dẫn dắt', 'thiết kế', 'xây dựng', 'triển khai', 'giải quyết',
  'đạt giải', 'top', 'best', 'winner', 'achievement', 'exceeded',
  'performance', 'impact', 'revenue', 'growth', 'delivered',
];

const BREAKTHROUGH_KEYWORDS = [
  'đột phá', 'breakthrough', 'record', 'kỷ lục', 'revenue boost',
  '10x', '10 lần', '100%', 'thành lập', 'sáng lập', 'found',
  'startup', 'khởi nghiệp', 'patent', 'bằng sáng chế', 'innovation award',
  'most valuable', 'best performer', 'champion', 'vô địch',
];

export function detectBoostLevel(score: number, evidenceText?: string): BoostSignal['type'] | null {
  if (!evidenceText) return null;
  const lower = evidenceText.toLowerCase();
  const hasBreakthrough = BREAKTHROUGH_KEYWORDS.some(k => lower.includes(k));
  const hasOutperforming = OUTSTANDING_ACHIEVEMENT_KEYWORDS.some(k => lower.includes(k));
  if (score >= 85 || hasBreakthrough) return 'breakthrough';
  if (score >= 75 || hasOutperforming) return 'outstanding';
  return null;
}

export function calculateBoost(
  sourceScore: number,
  targetDeficit: number,
  boostLevel: BoostSignal['type'],
  config: Partial<DynamicBoostConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  if (sourceScore < cfg.boostThreshold || targetDeficit <= 0) return 0;
  const multiplier = cfg.boostMultipliers[boostLevel];
  const rawBoost = Math.min(sourceScore - cfg.boostThreshold, targetDeficit) * (multiplier - 1) * 0.1;
  return Math.max(0, Math.min(rawBoost, cfg.maxBoostableScore - sourceScore));
}

export function applyDynamicBoost(
  criteriaScores: Record<string, number>,
  criteriaEvidence: Record<string, string>,
  config: Partial<DynamicBoostConfig> = {}
): { adjustedScores: Record<string, number>; boostSignals: BoostSignal[] } {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const adjustedScores: Record<string, number> = { ...criteriaScores };
  const boostSignals: BoostSignal[] = [];

  const entries = Object.entries(criteriaScores);

  for (const [criterion, score] of entries) {
    const boostType = detectBoostLevel(score, criteriaEvidence[criterion]);
    if (!boostType) continue;

    const deficitCandidates = entries
      .filter(([key]) => key !== criterion && adjustedScores[key] < cfg.maxBoostableScore)
      .sort((a, b) => a[1] - b[1])
      .slice(0, cfg.maxAffectedCriteria);

    for (const [targetCriterion] of deficitCandidates) {
      const deficit = cfg.maxBoostableScore - adjustedScores[targetCriterion];
      if (deficit <= 0) continue;
      const boost = calculateBoost(score, deficit, boostType, cfg);
      if (boost <= 0) continue;
      adjustedScores[targetCriterion] = Math.min(cfg.maxBoostableScore, adjustedScores[targetCriterion] + boost);
      boostSignals.push({
        type: boostType,
        sourceCriterion: criterion,
        sourceScore: score,
        boostedCriteria: [targetCriterion],
        boostAmount: boost,
        reason: `Thành tựu nổi bật tại "${criterion}" (${score}đ) bù đắp thiếu sót tại "${targetCriterion}"`,
      });
    }
  }

  return { adjustedScores, boostSignals };
}
