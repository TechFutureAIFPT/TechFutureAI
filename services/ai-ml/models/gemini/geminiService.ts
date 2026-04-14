// geminiService.ts — unified re-export from submodules
// Split into: gemini-core.ts (core utils), gemini-analyze.ts (CV analysis), gemini-hard-filters.ts (hard filter extraction), gemini-chatbot.ts (chatbot)

export {
  generateContentWithFallback,
  normalizeSchemaForOpenAI,
  extractPromptFromContents,
  isRetryableGeminiError,
  filterAndStructureJD,
  extractJobPositionFromJD,
  detailedScoreSchema,
  analysisSchema,
  buildCompactCriteria,
  createAnalysisPrompt,
  optimizeContentForAI,
  attemptPartialJsonRecovery,
  enhanceAndValidateCandidate,
  refineEducationWithAI,
  refineNameWithAI,
  getFileContentPart,
  convertLanguageLevelToCEFR,
  detectIndustry,
  getCvTextForFile,
  applyIndustryBaselineEnhancement,
} from './gemini-core';

export { analyzeCVs } from './gemini-analyze';
export { extractHardFiltersFromJD } from './gemini-hard-filters';
export { getChatbotAdvice } from './gemini-chatbot';
