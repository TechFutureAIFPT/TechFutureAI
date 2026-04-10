import type { Candidate, HardFilters, WeightCriteria } from '../../../assets/types';
import {
  generateContentWithFallback, createAnalysisPrompt, analysisSchema, enhanceAndValidateCandidate,
  refineEducationWithAI, refineNameWithAI, getFileContentPart, applyIndustryBaselineEnhancement,
} from './gemini-core';
import { analysisCacheService } from '../../history-cache/analysisCache';
import { processFileToText } from '../../file-processing/ocrService';
import { MODEL_NAME } from '../../../assets/constants';

// Stable hash for deterministic candidate IDs
const stableHash = (input: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
};

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
