/**
 * feedbackLoopService.ts — Feedback Loop & Weight Self-Adjustment
 *
 * Thu thập kết quả phỏng vấn (Pass/Fail) → tự động điều chỉnh trọng số.
 */

export interface Feedback {
  candidateId: string;
  criterion: string;
  predictedScore: number;
  actualResult: 'pass' | 'fail' | 'hold';
  interviewDate: string;
}

const STORAGE_KEY = 'cv_screener_feedback';

export function recordFeedback(feedback: Feedback): void {
  const existing = getAllFeedbacks();
  existing.push({ ...feedback, interviewDate: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getAllFeedbacks(): Feedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAppliedWeightAdjustment(criterion: string): number {
  const feedbacks = getAllFeedbacks();
  const relevant = feedbacks.filter(f => f.criterion === criterion);
  if (relevant.length < 3) return 0;

  let totalAdjustment = 0;
  let count = 0;

  for (const f of relevant.slice(-10)) {
    if (f.actualResult === 'fail' && f.predictedScore >= 50) {
      totalAdjustment -= 0.5; // AI overestimated
    } else if (f.actualResult === 'pass' && f.predictedScore < 50) {
      totalAdjustment += 0.5; // AI underestimated
    }
    count++;
  }

  return count > 0 ? totalAdjustment / count : 0;
}

export function clearFeedbackHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
