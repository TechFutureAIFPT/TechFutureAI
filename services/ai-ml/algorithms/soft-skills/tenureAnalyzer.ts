/**
 * tenureAnalyzer.ts — Tenure & Loyalty Analyzer
 */

export interface TenureAnalysis {
  totalJobs: number;
  totalMonths: number;
  avgTenurePerJob: number;
  jobHopRate: number;
  loyaltyIndex: number;
  loyaltyTag: 'stable' | 'moderate' | 'frequent';
  promotionsWithJobChanges: number;
  flatJobHops: number;
  reasoning: string;
}

const LOYALTY_KEYWORDS = ['thăng tiến', 'thăng chức', 'promotion', 'promoted', 'advance', 'lên cấp', 'tăng chức'];

function parseJobEntries(cvText: string) {
  const entries: { title: string; company: string; months: number; promotion?: boolean }[] = [];
  const lines = cvText.split(/\n|\r/).filter(l => l.trim().length > 5);
  let currentTitle = '', currentCompany = '', isPromotion = false;

  for (const line of lines) {
    const titleMatch = line.match(/(?:chức danh|vị trí|position|role)[:\s]*(.+)/i);
    const companyMatch = line.match(/(?:công ty|company|doanh nghiệp)[:\s]*(.+)/i);
    const yearMatch = line.match(/(?:20\d{2}|19\d{2})/g);
    if (titleMatch) { currentTitle = titleMatch[1].trim(); isPromotion = LOYALTY_KEYWORDS.some(k => line.toLowerCase().includes(k)); }
    if (companyMatch) currentCompany = companyMatch[1].trim();
    if (yearMatch && yearMatch.length >= 2) {
      const from = parseInt(yearMatch[0]), to = parseInt(yearMatch[1]);
      entries.push({ title: currentTitle, company: currentCompany, months: Math.max(1, (to - from) * 12), promotion: isPromotion });
      currentTitle = ''; currentCompany = ''; isPromotion = false;
    }
  }
  return entries;
}

export function analyzeTenure(cvText: string): TenureAnalysis {
  const jobs = parseJobEntries(cvText);

  if (jobs.length === 0) {
    return { totalJobs: 0, totalMonths: 0, avgTenurePerJob: 0, jobHopRate: 0, loyaltyIndex: 10, loyaltyTag: 'stable', promotionsWithJobChanges: 0, flatJobHops: 0, reasoning: 'Không đủ dữ liệu để phân tích sự ổn định.' };
  }

  const totalJobs = jobs.length;
  const totalMonths = jobs.reduce((s, j) => s + j.months, 0);
  const avgTenurePerJob = Math.round(totalMonths / totalJobs);
  const jobHopRate = totalMonths > 0 ? ((totalJobs - 1) / (totalMonths / 12)) : 0;
  const promotionsWithJobChanges = jobs.filter(j => j.promotion).length;
  const flatJobHops = Math.max(0, totalJobs - 1 - promotionsWithJobChanges);

  let loyaltyIndex = avgTenurePerJob >= 36 ? 10 : avgTenurePerJob >= 24 ? 8 : avgTenurePerJob >= 18 ? 6 : avgTenurePerJob >= 12 ? 4 : avgTenurePerJob >= 6 ? 2 : 0;
  if (promotionsWithJobChanges > 0) loyaltyIndex = Math.min(10, loyaltyIndex + promotionsWithJobChanges);
  if (flatJobHops >= 3) loyaltyIndex = Math.max(0, loyaltyIndex - flatJobHops);
  loyaltyIndex = Math.max(0, Math.min(10, loyaltyIndex));

  const loyaltyTag: 'stable' | 'moderate' | 'frequent' = loyaltyIndex >= 7 ? 'stable' : loyaltyIndex >= 4 ? 'moderate' : 'frequent';

  const reasoningParts: string[] = [`Trung bình ${avgTenurePerJob} tháng/vị trí.`];
  if (promotionsWithJobChanges > 0) reasoningParts.push(`${promotionsWithJobChanges} lần nhảy kèm thăng chức (tích cực).`);
  if (flatJobHops > 0) reasoningParts.push(`${flatJobHops} lần nhảy không kèm thăng chức (cần lưu ý).`);

  return { totalJobs, totalMonths, avgTenurePerJob, jobHopRate: Math.round(jobHopRate * 100) / 100, loyaltyIndex: Math.round(loyaltyIndex * 10) / 10, loyaltyTag, promotionsWithJobChanges, flatJobHops, reasoning: reasoningParts.join(' ') };
}
