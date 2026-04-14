/**
 * actionVerbAnalyzer.ts — Phân tích động từ hành động trong CV
 */

export type ActionVerbLevel = 'leader' | 'active' | 'passive' | 'unknown';

export interface ActionVerbResult {
  level: ActionVerbLevel;
  score: number;
  activeVerbs: string[];
  passiveVerbs: string[];
  leaderVerbs: string[];
  reasoning: string;
}

const LEADER_VERBS = ['dẫn dắt', 'lãnh đạo', 'sáng lập', 'found', 'established', 'built', 'created', 'founded', 'pioneered', 'spearheaded', 'orchestrated', 'championed', 'mentored', 'coached', 'transformed', 'điều phối', 'phối hợp', 'mentor', 'huấn luyện'];
const ACTIVE_VERBS = ['phát triển', 'develop', 'implemented', 'improved', 'increased', 'reduced', 'optimized', 'streamlined', 'designed', 'built', 'delivered', 'achieved', 'launched', 'managed', 'coordinated', 'conducted', 'analyzed', 'created', 'giải quyết', 'đạt được', 'hoàn thành', 'triển khai', 'thiết kế', 'xây dựng', 'quản lý', 'thực hiện', 'tối ưu', 'tăng trưởng'];
const PASSIVE_VERBS = ['được giao', 'được phân công', 'assigned', 'participated', 'was responsible', 'thamo gia', 'tham gia', 'joined', 'worked with', 'assisted', 'helped', 'cùng với', 'support', 'supporting', 'aided', 'collaborated'];

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\s-]/gu, ' ').split(/\s+/).filter(t => t.length > 2);
}

function containsAny(text: string, words: string[]): string[] {
  const tokens = tokenize(text);
  return words.filter(w => tokens.some(t => t.includes(w.toLowerCase())));
}

export function analyzeActionVerbs(cvText: string): ActionVerbResult {
  const lower = cvText.toLowerCase();
  const leaderFound = containsAny(lower, LEADER_VERBS);
  const activeFound = containsAny(lower, ACTIVE_VERBS);
  const passiveFound = containsAny(lower, PASSIVE_VERBS);

  let score = 5;
  if (leaderFound.length > 0) score += leaderFound.length * 1.5;
  if (activeFound.length > 0) score += activeFound.length * 0.8;
  if (passiveFound.length > 0) score -= passiveFound.length * 1.0;
  score = Math.max(0, Math.min(10, score));

  let level: ActionVerbLevel = 'unknown';
  if (leaderFound.length > 0 || score >= 8) level = 'leader';
  else if (passiveFound.length > activeFound.length) level = 'passive';
  else if (activeFound.length > 0) level = 'active';

  const reasoning = [
    leaderFound.length > 0 ? `Động từ lãnh đạo: ${leaderFound.slice(0, 3).join(', ')}` : null,
    activeFound.length > 0 ? `Động từ chủ động: ${activeFound.slice(0, 5).join(', ')}` : null,
    passiveFound.length > 0 ? `Động từ thụ động: ${passiveFound.slice(0, 3).join(', ')}` : null,
  ].filter(Boolean).join('. ');

  return { level, score: Math.round(score * 10) / 10, activeVerbs: activeFound, passiveVerbs: passiveFound, leaderVerbs: leaderFound, reasoning: reasoning || 'Không phát hiện mẫu hành vi rõ ràng.' };
}
