import type { CandidateView, SalaryHint } from "../types";

function parseYears(level: string): number | undefined {
  const match = level.match(/(\d+)/);
  if (match) return Number(match[1]);

  const normalized = level.toLowerCase();
  if (normalized.includes("intern") || normalized.includes("fresher")) return 0;
  if (normalized.includes("junior")) return 1;
  if (normalized.includes("mid")) return 3;
  if (normalized.includes("senior")) return 5;
  if (normalized.includes("lead")) return 8;
  return undefined;
}

function formatVnd(amount: number): string {
  if (amount >= 1_000_000) {
    return `${Math.round(amount / 1_000_000)}tr`;
  }
  return amount.toLocaleString("vi-VN");
}

export function buildSalaryHint(candidate: CandidateView): SalaryHint {
  const title = `${candidate.jobTitle} ${candidate.experienceLevel}`.toLowerCase();
  const years = parseYears(candidate.experienceLevel) ?? 2;

  let min = 9;
  let median = 16;
  let max = 26;

  if (title.includes("senior") || title.includes("lead") || years >= 5) {
    min = 25;
    median = 40;
    max = 62;
  } else if (title.includes("manager") || title.includes("director")) {
    min = 32;
    median = 52;
    max = 82;
  } else if (title.includes("junior") || title.includes("fresher") || years <= 1) {
    min = 7;
    median = 11;
    max = 16;
  } else if (years >= 2 && years <= 4) {
    min = 13;
    median = 22;
    max = 34;
  }

  if (/(ai|ml|machine learning|cloud|devops|data|security|architect)/i.test(title)) {
    min *= 1.25;
    median *= 1.25;
    max *= 1.25;
  }

  if (/(hồ chí minh|ho chi minh|hà nội|hanoi)/i.test(candidate.detectedLocation)) {
    min *= 1.08;
    median *= 1.08;
    max *= 1.08;
  }

  const minVnd = Math.round(min) * 1_000_000;
  const medianVnd = Math.round(median) * 1_000_000;
  const maxVnd = Math.round(max) * 1_000_000;

  return {
    rangeLabel: `${formatVnd(minVnd)} - ${formatVnd(maxVnd)} VND/tháng`,
    recommendation: `Mốc đàm phán an toàn: khoảng ${formatVnd(medianVnd)} VND/tháng, điều chỉnh theo điểm mạnh và rủi ro trong CV.`,
    source: "Ước tính nội bộ trong ứng dụng khi chưa có nguồn lương riêng."
  };
}
