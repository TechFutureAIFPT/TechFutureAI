// openaiService.ts — unified re-export from submodules
// Split into: openai-core.ts (core utils), openai-analyze.ts (CV analysis),
//             openai-hard-filters.ts (hard filter extraction), openai-chatbot.ts (chatbot)

export {
  callOpenAI,
  normalizeSchemaForOpenAI,
  extractPromptFromContents,
  isRetryableOpenAIError,
  resetClient,
} from './openai-core';

export { analyzeCVs } from './openai-analyze';
export { extractHardFiltersFromJD } from './openai-hard-filters';
export { getChatbotAdvice } from './openai-chatbot';
