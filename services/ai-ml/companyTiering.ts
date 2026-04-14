/**
 * companyTiering.ts — Company & Institution Tiering
 *
 * Gán hệ số nhân cho kinh nghiệm từ công ty uy tín.
 * Ứng viên từ công ty top-tier được cộng điểm uy tín.
 */

export interface CompanyTier {
  name: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'unknown';
  multiplier: number;
  region: 'global' | 'vietnam' | 'unknown';
}

export interface TieringResult {
  adjustedScore: number;
  multipliers: Record<string, number>;
  reasoning: string;
  recognizedCompanies: string[];
}

const TIER1_GLOBAL = ['google', 'meta', 'facebook', 'apple', 'amazon', 'microsoft', 'netflix', 'nvidia', 'tesla', 'uber', 'airbnb', 'stripe', 'salesforce', 'adobe', 'oracle', 'ibm', 'intel', 'cisco', 'sap', 'siemens', 'bosch', 'philips', 'jpmorgan', 'goldman sachs', 'morgan stanley', 'bloomberg', 'blackrock', 'mckinsey', 'bain', 'bcg', 'pwc', 'deloitte', 'kpmg', 'ey', 'accenture', 'nike', 'cocacola'];
const TIER2_GLOBAL = ['shopee', 'lazada', 'grab', 'vng', 'garena', 'sea group', 'vccorp', 'misa', 'haravan', 'bkav', 'mobifone', 'cmc', 'tencent', 'alibaba', 'bytedance', 'ant group', 'mastercard', 'visa', 'paypal', 'stripe', 'atlassian', 'slack', 'zoom', 'dropbox', 'twilio'];
const TIER1_VN = ['fpt', 'viettel', 'vnpt', 'vingroup', 'vinfast', 'vietinbank', 'vietcombank', 'bidv', 'agribank', 'mb bank', 'tp bank', 'acb', 'sacombank', ' Petrovietnam', 'EVN', 'VNRE', 'sao đỏ', 'mobifone', 'vietnammobile'];
const TIER2_VN = ['vietnampost', 'cuc buu chinh', ' CMC', 'bkav', 'viettel solutions', 'vnpt technology', 'fpt software', 'fpt telecom', 'vng', 'vccorp', 'sendo', 'tiki', 'haravan', 'Base', '1975', 'Gtv', 'Việc làm 24h', 'JobStreet', 'MyWork', 'Workbvietnam'];

function detectTier(companyName: string): CompanyTier {
  const lower = companyName.toLowerCase();
  if (TIER1_GLOBAL.some(t => lower.includes(t))) return { name: companyName, tier: 'tier1', multiplier: 1.15, region: 'global' };
  if (TIER2_GLOBAL.some(t => lower.includes(t))) return { name: companyName, tier: 'tier2', multiplier: 1.10, region: 'global' };
  if (TIER1_VN.some(t => lower.includes(t))) return { name: companyName, tier: 'tier1', multiplier: 1.15, region: 'vietnam' };
  if (TIER2_VN.some(t => lower.includes(t))) return { name: companyName, tier: 'tier2', multiplier: 1.10, region: 'vietnam' };
  return { name: companyName, tier: 'unknown', multiplier: 1.0, region: 'unknown' };
}

export function applyCompanyTierMultiplier(baseScore: number, companies: string[]): TieringResult {
  if (!companies || companies.length === 0) {
    return { adjustedScore: baseScore, multipliers: {}, reasoning: 'Không nhận diện được công ty nào trong CV.', recognizedCompanies: [] };
  }

  const multipliers: Record<string, number> = {};
  const recognized: string[] = [];
  let avgMultiplier = 1.0;

  for (const company of companies) {
    const tier = detectTier(company);
    multipliers[company] = tier.multiplier;
    if (tier.tier !== 'unknown') recognized.push(company);
    avgMultiplier += tier.multiplier - 1;
  }

  avgMultiplier = avgMultiplier / companies.length + 1;
  const adjustedScore = Math.min(100, baseScore * avgMultiplier);
  const totalBonus = adjustedScore - baseScore;

  const tierLabels: Record<string, string> = { tier1: 'Tier 1', tier2: 'Tier 2', tier3: 'Tier 3', tier4: 'Tier 4', unknown: 'Chưa rõ' };
  const tiers = [...new Set(recognized.map(c => tierLabels[detectTier(c).tier]))];

  return {
    adjustedScore: Math.round(adjustedScore * 10) / 10,
    multipliers,
    reasoning: `Nhận diện ${recognized.length} công ty uy tín: ${tiers.join(', ')}. Hệ số x${avgMultiplier.toFixed(2)} → +${totalBonus.toFixed(1)} điểm.`,
    recognizedCompanies: recognized,
  };
}
