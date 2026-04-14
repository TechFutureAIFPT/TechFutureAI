import type { Candidate, HardFilters, WeightCriteria } from '../../../../assets/types';
import {
  generateContentWithFallback, createAnalysisPrompt, analysisSchema, enhanceAndValidateCandidate,
  refineEducationWithAI, refineNameWithAI, getFileContentPart, applyIndustryBaselineEnhancement,
} from './gemini-core';
import { analysisCacheService } from '../../../history-cache/analysisCache';
import { processFileToText } from '../../../file-processing/ocrService';
import { MODEL_NAME } from '../../../../assets/constants';

// ── 5 Nâng cấp tích hợp ──────────────────────────────────────────────────────
import { runDebiasingPipeline } from '../../algorithms/ai-debiasing/debiasingService';
import { analyzeSoftSkills } from '../../algorithms/soft-skills/softSkillsService';
import { scoreSkillMatch } from '../../skillGraph';
import { applyCompanyTierMultiplier } from '../../companyTiering';
import { analyzeCareerVelocity } from '../../algorithms/dynamic-weighting/careerVelocity';
import { applyDynamicBoost } from '../../algorithms/dynamic-weighting/dynamicBoost';

// Stable hash for deterministic candidate IDs
const stableHash = (input: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const SKILL_KEYWORDS = [
  'react', 'vue', 'angular', 'node', 'python', 'java', 'javascript', 'typescript',
  'sql', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'ci/cd', 'machine learning',
  'html', 'css', 'sass', 'redux', 'graphql', 'mongodb', 'postgresql', 'mysql', 'redis',
  'nextjs', 'nuxt', 'django', 'flask', 'spring', 'springboot', 'golang', 'rust', 'c++',
  'flutter', 'react native', 'swift', 'kotlin', 'figma', 'photoshop', 'tableau', 'power bi',
  'scrum', 'agile', 'kanban', 'jira', 'leadership', 'project management',
  'communication', 'teamwork', 'problem solving', 'critical thinking',
  'nlp', 'computer vision', 'deep learning', 'tensorflow', 'pytorch',
  'data analysis', 'data science', 'statistics', 'excel', 'r programming',
];

const COMPANY_NAME_WORDS = [
  'fpt', 'viettel', 'vnpt', 'vingroup', 'vinfast', 'vietinbank', 'vietcombank',
  'bidv', 'shopee', 'lazada', 'tiki', 'grab', 'vng', 'garena', 'sea group',
  'vccorp', 'misa', 'haravan', 'bkav', 'mobifone', 'cmc', 'vietnampost',
  'google', 'meta', 'facebook', 'apple', 'amazon', 'microsoft', 'netflix',
  'nvidia', 'tesla', 'uber', 'airbnb', 'stripe', 'salesforce', 'adobe',
  'oracle', 'ibm', 'intel', 'cisco', 'sap', 'siemens', 'bosch', 'philips',
  'jpmorgan', 'goldman sachs', 'morgan stanley', 'bloomberg', 'blackrock',
  'mckinsey', 'bain', 'bcg', 'pwc', 'deloitte', 'kpmg', 'ey',
];

function extractSkillsFromJD(jdText: string): string[] {
  const lower = jdText.toLowerCase();
  return SKILL_KEYWORDS.filter(skill => lower.includes(skill.toLowerCase()));
}

function extractSkillsFromAnalysis(candidate: any): string[] {
  const texts = [
    candidate.jobTitle,
    candidate.industry,
    candidate.department,
    ...(candidate.analysis?.['Chi tiết'] || []).map((c: any) => c['Dẫn chứng'] || ''),
    ...(candidate.analysis?.['Điểm mạnh CV'] || []),
  ];
  const combined = texts.join(' ').toLowerCase();
  return SKILL_KEYWORDS.filter(skill => combined.includes(skill.toLowerCase()));
}

function extractCompaniesFromAnalysis(candidate: any): string[] {
  const evidenceTexts = [
    candidate.jobTitle,
    candidate.industry,
    candidate.department,
    ...(candidate.analysis?.['Chi tiết'] || []).map((c: any) => c['Dẫn chứng'] || ''),
    ...(candidate.analysis?.['Điểm mạnh CV'] || []),
  ].join(' ');
  return COMPANY_NAME_WORDS.filter(company => evidenceTexts.toLowerCase().includes(company.toLowerCase()));
}

export async function* analyzeCVs(
  jdText: string,
  weights: WeightCriteria,
  hardFilters: HardFilters,
  cvFiles: File[]
): AsyncGenerator<Candidate | { status: 'progress'; message: string }> {
  const fileTextMap = new Map<string, string>();

  const { jdHash, weightsHash, filtersHash } = analysisCacheService.generateAnalysisHashes(jdText, weights, hardFilters);
  const { cached, uncached } = await analysisCacheService.batchCheckCache(cvFiles, jdHash, weightsHash, filtersHash);

  const fileLookup = new Map<string, File>();
  cached.forEach(({ file }) => fileLookup.set(file.name, file));
  uncached.forEach((file) => fileLookup.set(file.name, file));

  if (cached.length > 0) {
    yield { status: 'progress', message: `Tìm thấy ${cached.length} kết quả đã cache, đang load...` };
    for (const { file, result } of cached) {
      await applyIndustryBaselineEnhancement(result, file.name, fileLookup, fileTextMap, hardFilters);
      yield { status: 'progress', message: `Đã load từ cache: ${file.name}` };
      yield result;
    }
  }

  if (uncached.length === 0) {
    yield { status: 'progress', message: 'Tất cả CV đã có trong cache. Hoàn thành!' };
    return;
  }

  const mainPrompt = createAnalysisPrompt(jdText, weights, hardFilters);
  const contents: any[] = [{ text: mainPrompt }];
  let processedCount = 0;
  const totalFiles = uncached.length;
  const BATCH_SIZE = 3;

  yield { status: 'progress', message: `Cần phân tích ${totalFiles} CV mới. Bắt đầu xử lý...` };

  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, Math.min(i + BATCH_SIZE, uncached.length));
    yield { status: 'progress', message: `Đang xử lý batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(totalFiles / BATCH_SIZE)} (${batch.length} files)` };

    const batchPromises = batch.map(async (file) => {
      try {
        const contentPart = await getFileContentPart(file, () => {});
        return { file, contentPart, error: null };
      } catch (error) { return { file, contentPart: null, error }; }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    for (const result of batchResults) {
      processedCount++;
      if (result.status === 'fulfilled') {
        const { file, contentPart, error } = result.value;
        yield { status: 'progress', message: `Đã xử lý ${processedCount}/${totalFiles}: ${file.name}` };
        if (contentPart) {
          contents.push(contentPart);
          if (contentPart.text) fileTextMap.set(file.name, contentPart.text);
        } else {
          yield { id: `${file.name}-error-${Date.now()}`, status: 'FAILED' as const, error: `Lỗi: ${error instanceof Error ? error.message : 'Unknown'}`, candidateName: 'Lỗi Xử Lý Tệp', fileName: file.name, jobTitle: '', industry: '', department: '', experienceLevel: '', detectedLocation: '', phone: '', email: '' };
        }
      } else {
        const fileName = batch[batchResults.indexOf(result)]?.name || 'Unknown file';
        yield { id: `${fileName}-error-${Date.now()}`, status: 'FAILED' as const, error: `Lỗi xử lý file: ${result.reason}`, candidateName: 'Lỗi Xử Lý Tệp', fileName: fileName, jobTitle: '', industry: '', department: '', experienceLevel: '', detectedLocation: '', phone: '', email: '' };
      }
    }
    if (i + BATCH_SIZE < uncached.length) await new Promise(resolve => setTimeout(resolve, 100));
  }

  yield { status: 'progress', message: `Hoàn tất xử lý ${totalFiles} files. Đang gửi đến AI...` };

  try {
    const aiConfig = { responseMimeType: 'application/json', responseSchema: analysisSchema, temperature: 0.1, topP: 0.8, topK: 40, thinkingConfig: { thinkingBudget: 0 } };
    yield { status: 'progress', message: 'Gửi yêu cầu phân tích đến AI...' };
    const response = await generateContentWithFallback(MODEL_NAME, { parts: contents }, aiConfig);
    yield { status: 'progress', message: 'AI đã phản hồi. Đang xử lý kết quả...' };

    const resultText = response.text.trim();
    let candidates: Omit<Candidate, 'id' | 'status'>[] = [];

    try {
      candidates = JSON.parse(resultText);
      candidates = candidates.map(c => enhanceAndValidateCandidate(c));
      yield { status: 'progress', message: `Đã validate ${candidates.length} kết quả phân tích.` };
    } catch (e) {
      console.error("Lỗi phân tích JSON từ AI:", e);
      try {
        const { attemptPartialJsonRecovery } = await import('./gemini-core');
        const partialResults = attemptPartialJsonRecovery(resultText);
        if (partialResults && partialResults.length > 0) {
          candidates = partialResults;
          yield { status: 'progress', message: `Khôi phục được ${candidates.length} kết quả.` };
        } else { throw new Error("Không thể khôi phục dữ liệu."); }
      } catch { throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại."); }
    }

    const finalCandidates = candidates.map(c => {
      const basis = `${c.fileName || ''}|${c.candidateName || ''}|${c.jobTitle || ''}|${c.experienceLevel || ''}`;
      return { ...c, id: `cand_${stableHash(basis)}`, status: 'SUCCESS' as const };
    });

    finalCandidates.sort((a, b) => {
      const sa = typeof a.analysis?.['Tổng điểm'] === 'number' ? a.analysis['Tổng điểm'] : -1;
      const sb = typeof b.analysis?.['Tổng điểm'] === 'number' ? b.analysis['Tổng điểm'] : -1;
      if (sb !== sa) return sb - sa;
      return (a.fileName || '').localeCompare(b.fileName || '');
    });

    yield { status: 'progress', message: 'Đang dùng AI thẩm định lại bằng cấp và tên ứng viên...' };
    await Promise.all(finalCandidates.map(async (candidate) => {
      const cvText = fileTextMap.get(candidate.fileName);
      const file = fileLookup.get(candidate.fileName);
      if (cvText) {
        const currentEdu = candidate.analysis?.educationValidation?.standardizedEducation;
        let [refinedEdu, refinedName] = await Promise.all([refineEducationWithAI(cvText, currentEdu), refineNameWithAI(cvText, candidate.candidateName)]);

        const isEduInvalid = !refinedEdu || !refinedEdu.standardizedEducation || refinedEdu.standardizedEducation === 'Không có thông tin' || refinedEdu.validationNote === 'Không hợp lệ';
        if (isEduInvalid && file) {
          try {
            const highQualityText = await processFileToText(file, () => {}, { forceOcr: true });
            const retryEdu = await refineEducationWithAI(highQualityText, currentEdu);
            if (retryEdu && retryEdu.standardizedEducation && retryEdu.standardizedEducation !== 'Không có thông tin') {
              refinedEdu = retryEdu;
              const retryName = await refineNameWithAI(highQualityText, candidate.candidateName);
              if (retryName) refinedName = retryName;
            }
          } catch { /* ignore */ }
        }

        if (refinedEdu) {
          const analysis = candidate.analysis ?? (candidate.analysis = {} as NonNullable<Candidate['analysis']>);
          const eduVal = analysis.educationValidation ?? (analysis.educationValidation = {} as NonNullable<NonNullable<Candidate['analysis']>['educationValidation']>);
          eduVal.standardizedEducation = refinedEdu.standardizedEducation;
          eduVal.validationNote = refinedEdu.validationNote;
          if (refinedEdu.warnings && refinedEdu.warnings.length > 0) {
            const existing = eduVal.warnings ?? (eduVal.warnings = []);
            refinedEdu.warnings.forEach(w => { if (!existing.includes(w)) existing.push(w); });
          }
        }
        if (refinedName) candidate.candidateName = refinedName;
      }
      return candidate;
    }));

    yield { status: 'progress', message: 'Đã hoàn tất thẩm định dữ liệu.' };

    // ── 5 Nâng cấp: Post-processing mỗi ứng viên ──────────────────────
    yield { status: 'progress', message: 'Đang phân tích kỹ năng mềm, động lực & đạo đức AI...' };

    const jdSkills = extractSkillsFromJD(jdText);

    for (const candidate of finalCandidates) {
      const cvText = fileTextMap.get(candidate.fileName);
      const analysis = candidate.analysis ?? (candidate.analysis = {} as NonNullable<Candidate['analysis']>);
      if (!Array.isArray(analysis['Chi tiết'])) analysis['Chi tiết'] = [];

      // ① DEBIASING
      if (cvText) {
        const debiasResult = runDebiasingPipeline(cvText, hardFilters as any);
        if (debiasResult.overallSafe) {
          if (debiasResult.warnings.length > 0) {
            candidate.debiasingWarnings = debiasResult.warnings;
          }
        }

        // ② SOFT SKILLS
        const softReport = analyzeSoftSkills(cvText);
        for (const [key, val] of Object.entries(softReport.criteriaScores)) {
          analysis['Chi tiết'].push({
            'Tiêu chí': key,
            'Điểm': `${val.score}/${val.maxScore}`,
            'Công thức': '',
            'Dẫn chứng': val.reasoning.slice(0, 200),
            'Giải thích': val.reasoning,
          });
        }

        // ④ CAREER VELOCITY
        const velocity = analyzeCareerVelocity(cvText);
        if (velocity.totalMonths > 0) {
          analysis['Chi tiết'].push({
            'Tiêu chí': 'Tiềm năng phát triển (Career Velocity)',
            'Điểm': `${velocity.potentialScore}/20`,
            'Công thức': `Bậc cao nhất: ${velocity.peakTitle} (cấp ${velocity.peakLevel}) | ${velocity.promotionCount} lần thăng tiến`,
            'Dẫn chứng': `${velocity.avgMonthsPerLevel} tháng/bậc — ${velocity.velocityTag}`,
            'Giải thích': `Tốc độ thăng tiến ${velocity.velocityTag === 'fast' ? 'nhanh' : velocity.velocityTag === 'slow' ? 'chậm' : 'bình thường'}.`,
          });
        }
      }

      // ③ SKILL GRAPH
      const candidateSkills = extractSkillsFromAnalysis(candidate);
      const skillMatch = scoreSkillMatch(jdSkills, candidateSkills);
      if (skillMatch.matchRate > 0) {
        analysis['Chi tiết'].push({
          'Tiêu chí': 'Kỹ năng chuyển đổi (Skill Graph)',
          'Điểm': `${skillMatch.matchRate}/100`,
          'Công thức': `${skillMatch.matchedSkills.length}/${jdSkills.length} skills khớp`,
          'Dẫn chứng': `Clusters: ${skillMatch.familyClusters.slice(0, 3).join(', ') || 'Không rõ'}`,
          'Giải thích': `Tỷ lệ khớp kỹ năng: ${skillMatch.matchRate}%. Unmatched: ${skillMatch.unmatchedSkills.slice(0, 3).join(', ') || 'Không'}.`,
        });
      }

      // ⑤ COMPANY TIERING
      const companies = extractCompaniesFromAnalysis(candidate);
      if (companies.length > 0) {
        const baseScore = typeof analysis['Tổng điểm'] === 'number' ? analysis['Tổng điểm'] : 50;
        const tiered = applyCompanyTierMultiplier(baseScore, companies);
        if (tiered.adjustedScore !== baseScore) {
          analysis['Tổng điểm'] = Math.min(100, tiered.adjustedScore);
          analysis['Chi tiết'].push({
            'Tiêu chí': 'Hệ số uy tín công ty',
            'Điểm': `${tiered.adjustedScore - baseScore > 0 ? '+' : ''}${(tiered.adjustedScore - baseScore).toFixed(1)}`,
            'Công thức': tiered.reasoning,
            'Dẫn chứng': Object.entries(tiered.multipliers).filter(([, m]) => m > 1).map(([c, m]) => `${c} (x${m})`).join(', '),
            'Giải thích': tiered.reasoning,
          });
        }
      }

      // ⑥ DYNAMIC BOOST
      if (Array.isArray(analysis['Chi tiết']) && analysis['Chi tiết'].length > 0) {
        const criteriaEvidence: Record<string, string> = {};
        const criteriaScores: Record<string, number> = {};
        for (const item of analysis['Chi tiết']) {
          const scoreStr = item['Điểm']?.split('/')[0] ?? '0';
          criteriaScores[item['Tiêu chí']] = parseFloat(scoreStr) || 0;
          criteriaEvidence[item['Tiêu chí']] = item['Dẫn chứng'] || '';
        }
        const { boostSignals } = applyDynamicBoost(criteriaScores, criteriaEvidence);
        if (boostSignals.length > 0) {
          let totalBoost = 0;
          for (const signal of boostSignals) {
            totalBoost += signal.boostAmount;
            analysis['Chi tiết'].push({
              'Tiêu chí': `Dynamic Boost: ${signal.sourceCriterion}`,
              'Điểm': `+${signal.boostAmount.toFixed(1)}`,
              'Công thức': signal.reason,
              'Dẫn chứng': signal.reason,
              'Giải thích': signal.reason,
            });
          }
          if (typeof analysis['Tổng điểm'] === 'number') {
            analysis['Tổng điểm'] = Math.min(100, analysis['Tổng điểm'] + totalBoost);
          }
        }
      }

      // ⑦ FEEDBACK LOOP
      try {
        const { getAppliedWeightAdjustment } = await import('../../algorithms/feedback-loop/feedbackLoopService');
        let totalAdj = 0;
        const criteriaScores = analysis['Chi tiết'].reduce((acc: Record<string, number>, item: any) => {
          acc[item['Tiêu chí']] = parseFloat(item['Điểm']?.split('/')[0] ?? '0');
          return acc;
        }, {} as Record<string, number>);
        for (const [criterion] of Object.entries(criteriaScores)) {
          totalAdj += getAppliedWeightAdjustment(criterion);
        }
        if (totalAdj !== 0) {
          if (typeof analysis['Tổng điểm'] === 'number') {
            analysis['Tổng điểm'] = Math.min(100, Math.max(0, analysis['Tổng điểm'] + totalAdj));
          }
          analysis.feedbackAdjusted = totalAdj;
        }
      } catch { /* feedback loop optional */ }
    }

    // Recalculate rank
    for (const candidate of finalCandidates) {
      if (candidate.analysis) {
        const score = candidate.analysis['Tổng điểm'];
        if (typeof score === 'number') {
          candidate.analysis['Hạng'] = score >= 75 ? 'A' : score >= 50 ? 'B' : 'C';
        }
      }
    }

    finalCandidates.sort((a, b) => {
      const sa = typeof a.analysis?.['Tổng điểm'] === 'number' ? a.analysis['Tổng điểm'] : -1;
      const sb = typeof b.analysis?.['Tổng điểm'] === 'number' ? b.analysis['Tổng điểm'] : -1;
      if (sb !== sa) return sb - sa;
      return (a.fileName || '').localeCompare(b.fileName || '');
    });

    yield { status: 'progress', message: 'Đã tích hợp 5 nâng cấp: Soft Skills, Skill Graph, Career Velocity, Company Tiering, Dynamic Boost, Debiasing, Feedback Loop.' };

    for (const candidate of finalCandidates) {
      await applyIndustryBaselineEnhancement(candidate, candidate.fileName, fileLookup, fileTextMap, hardFilters);
    }

    const uncachedByName = new Map(uncached.map((f) => [f.name, f]));
    for (const candidate of finalCandidates) {
      const correspondingFile = candidate.fileName ? uncachedByName.get(candidate.fileName) : undefined;
      if (correspondingFile) {
        await analysisCacheService.cacheAnalysis(correspondingFile, candidate, jdHash, weightsHash, filtersHash);
      }
      yield candidate;
    }

    const cacheStats = analysisCacheService.getCacheStats();
    yield { status: 'progress', message: `Hoàn tất! Cache hiện có ${cacheStats.size} entries.` };
  } catch (error) {
    console.error("Lỗi phân tích từ AI:", error);
    throw new Error("AI không thể hoàn tất phân tích. Vui lòng thử lại sau.");
  }
}
