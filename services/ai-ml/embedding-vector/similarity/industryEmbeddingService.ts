/**
 * Industry Embedding Similarity Service — Browser Runtime
 *
 * Nhiệm vụ:
 *  1. Load index file embedding theo ngành từ public/data/<industry>-embeddings.json
 *  2. Tạo vector cho CV text bằng Gemini API (browser)
 *  3. Tính cosine similarity giữa CV vector và các sample trong index
 *  4. Trả về top-K matches + điểm bonus cho scoring pipeline
 *
 * Import từ:
 *  - services/ai-ml/industryService.ts (re-export)
 *  - services/ai-ml/models/gemini/gemini-core.ts
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  SampleEmbeddingIndex,
  IndustryEmbeddingMatch,
  IndustryEmbeddingInsight,
  SupportedIndustry,
} from '../types/embeddingTypes';
import {
  INDUSTRY_EMBEDDING_URLS,
  EMBEDDING_MODEL_DEFAULT,
  MAX_EMBEDDING_TEXT_LENGTH,
  DEFAULT_TOP_K,
} from '../types/embeddingTypes';

// ── Gemini client management ──────────────────────────────────────────────────
const embeddingKeys = [
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_1,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_2,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_3,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_4,
].filter((key): key is string => Boolean(key));

let embeddingClients: Array<GoogleGenerativeAI | null> = [];
let embeddingModels:  Array<ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null> = [];
let activeClientIndex = 0;
let missingKeyWarned  = false;

const indexCache = new Map<string, Promise<SampleEmbeddingIndex | null>>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getEmbeddingModel(): ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null {
  if (!embeddingKeys.length) {
    if (!missingKeyWarned) {
      console.warn('[EmbeddingBaseline] Không tìm thấy VITE_GEMINI_API_KEY_x để tạo embedding.');
      missingKeyWarned = true;
    }
    return null;
  }

  if (!embeddingClients[activeClientIndex]) {
    embeddingClients[activeClientIndex] = new GoogleGenerativeAI(embeddingKeys[activeClientIndex]);
    embeddingModels[activeClientIndex]  = embeddingClients[activeClientIndex]!
      .getGenerativeModel({ model: EMBEDDING_MODEL_DEFAULT });
  }

  return embeddingModels[activeClientIndex];
}

// ── Core embedding + similarity ───────────────────────────────────────────────
async function embedText(text: string): Promise<number[]> {
  const normalized = text.replace(/\s+/g, ' ').trim().slice(0, MAX_EMBEDDING_TEXT_LENGTH);
  if (!normalized) return [];

  for (let attempt = 0; attempt < Math.max(1, embeddingKeys.length); attempt++) {
    try {
      const model = getEmbeddingModel();
      if (!model) return [];
      const result = await model.embedContent(normalized);
      const vector = result.embedding?.values;
      if (vector?.length) return Array.from(vector);
      throw new Error('Embedding API trả về vector rỗng');
    } catch (error) {
      console.warn('[EmbeddingBaseline] Lỗi embedContent, thử key khác:', error);
      if (embeddingKeys.length === 0) break;
      activeClientIndex = (activeClientIndex + 1) % embeddingKeys.length;
      embeddingClients[activeClientIndex] = null;
      embeddingModels[activeClientIndex]  = null;
      await sleep(250);
    }
  }

  return [];
}

function cosineSimilarity(a: number[], b: number[]): number | null {
  if (!a.length || !b.length || a.length !== b.length) return null;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return null;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Index loader (with cache) ─────────────────────────────────────────────────
async function loadEmbeddingIndex(industry: SupportedIndustry): Promise<SampleEmbeddingIndex | null> {
  if (!indexCache.has(industry)) {
    const url = INDUSTRY_EMBEDDING_URLS[industry];
    const promise = fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          console.warn(`[EmbeddingBaseline] Không load được thư viện ${industry}:`, res.statusText);
          return null;
        }
        return res.json();
      })
      .catch((error) => {
        console.warn(`[EmbeddingBaseline] Lỗi fetch thư viện ${industry}:`, error);
        return null;
      });
    indexCache.set(industry, promise);
  }
  return indexCache.get(industry)!;
}

// ── Bonus calculator ──────────────────────────────────────────────────────────
function similarityToBonus(avg: number): number {
  if (avg >= 0.88) return 5;
  if (avg >= 0.83) return 3.5;
  if (avg >= 0.78) return 2;
  if (avg >= 0.72) return 1;
  return 0;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Tính similarity giữa CV text và industry sample pool */
export async function computeIndustrySimilarity(
  industry: SupportedIndustry,
  cvText: string,
  topK: number = DEFAULT_TOP_K
): Promise<IndustryEmbeddingInsight | null> {
  if (!cvText?.trim()) return null;
  const index = await loadEmbeddingIndex(industry);
  if (!index?.records?.length) return null;

  const vector = await embedText(cvText);
  if (!vector.length) return null;

  const matches = index.records
    .map((record): IndustryEmbeddingMatch | null => {
      const similarity = cosineSimilarity(vector, record.vector);
      if (similarity == null) return null;
      return { id: record.id, name: record.name, role: record.role, similarity, relativePath: record.relativePath };
    })
    .filter((item): item is IndustryEmbeddingMatch => Boolean(item))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.max(topK, DEFAULT_TOP_K));

  if (!matches.length) return null;

  const averageSimilarity = matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length;

  return {
    industry,
    averageSimilarity,
    topMatches: matches,
    bonusPoints: similarityToBonus(averageSimilarity),
  };
}

/** Shortcut cho IT industry */
export async function computeItIndustrySimilarity(
  cvText: string,
  topK: number = DEFAULT_TOP_K
): Promise<IndustryEmbeddingInsight | null> {
  return computeIndustrySimilarity('it', cvText, topK);
}

/** Alias dùng bởi industryService.ts */
export async function getIndustryBaseline(
  industry: SupportedIndustry,
  cvText: string,
  topK: number = DEFAULT_TOP_K
): Promise<IndustryEmbeddingInsight | null> {
  return computeIndustrySimilarity(industry, cvText, topK);
}

/**
 * Áp dụng kết quả embedding similarity vào candidate object
 * (thêm bonus điểm và ghi detail vào analysis)
 */
export async function applyIndustryBaselineEnhancement(
  candidate: any,
  fileName: string,
  fileLookup: Map<string, File>,
  fileTextMap: Map<string, string>,
  hardFilters: any
): Promise<void> {
  if (!fileTextMap.has(fileName)) return;
  const cvText = fileTextMap.get(fileName);
  if (!cvText) return;

  const industry = (hardFilters as any)?.industry as SupportedIndustry | undefined;
  if (!industry || !(industry in INDUSTRY_EMBEDDING_URLS)) return;

  const insight = await computeIndustrySimilarity(industry, cvText);
  if (!insight) return;

  if (!candidate.analysis) candidate.analysis = {};
  if (!Array.isArray(candidate.analysis['Chi tiết'])) candidate.analysis['Chi tiết'] = [];

  candidate.analysis['Chi tiết'].push({
    'Tiêu chí': 'Industry Baseline Enhancement',
    'Điểm':     `+${insight.bonusPoints.toFixed(1)}`,
    'Công thức': `avg similarity: ${(insight.averageSimilarity * 100).toFixed(1)}%`,
    'Dẫn chứng': `Top match: ${insight.topMatches[0]?.name || 'N/A'} (${(insight.topMatches[0]?.similarity * 100).toFixed(1)}%)`,
    'Giải thích': `Industry: ${industry}`,
  });

  if (typeof candidate.analysis['Tổng điểm'] === 'number') {
    candidate.analysis['Tổng điểm'] = Math.min(100, candidate.analysis['Tổng điểm'] + insight.bonusPoints);
  }
}

// Re-export types for consumers
export type { IndustryEmbeddingMatch, IndustryEmbeddingInsight, SupportedIndustry };
