import { GoogleGenerativeAI } from '@google/generative-ai';

const INDUSTRY_EMBEDDING_URLS = {
  it: '/data/it-embeddings.json',
  sales: '/data/sales-embeddings.json',
  marketing: '/data/marketing-embeddings.json',
  design: '/data/design-embeddings.json',
};

const EMBEDDING_MODEL = 'text-embedding-004';
const MAX_TEXT_LENGTH = 6000;
const DEFAULT_TOP_K = 3;

interface SampleEmbeddingRecord {
  id: string;
  relativePath: string;
  name?: string;
  role?: string;
  summarySnippet?: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

interface SampleEmbeddingIndex {
  generatedAt: string;
  model: string;
  vectorLength: number;
  recordCount: number;
  dataRoot: string;
  records: SampleEmbeddingRecord[];
}

export interface IndustryEmbeddingMatch {
  id: string;
  name?: string;
  role?: string;
  similarity: number;
  relativePath: string;
}

export type SupportedIndustry = keyof typeof INDUSTRY_EMBEDDING_URLS;

export interface IndustryEmbeddingInsight {
  industry: SupportedIndustry;
  averageSimilarity: number;
  topMatches: IndustryEmbeddingMatch[];
  bonusPoints: number;
}

const embeddingKeys = [
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_1,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_2,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_3,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_4,
].filter((key): key is string => Boolean(key));

let embeddingClients: Array<GoogleGenerativeAI | null> = [];
let embeddingModels: Array<ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null> = [];
let activeClientIndex = 0;
let missingKeyWarned = false;

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
    embeddingModels[activeClientIndex] = embeddingClients[activeClientIndex]!.getGenerativeModel({ model: EMBEDDING_MODEL });
  }

  return embeddingModels[activeClientIndex];
}

async function embedText(text: string): Promise<number[]> {
  const normalized = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
  if (!normalized) return [];

  for (let attempt = 0; attempt < Math.max(1, embeddingKeys.length); attempt++) {
    try {
      const model = getEmbeddingModel();
      if (!model) return [];
      const result = await model.embedContent(normalized);
      const vector = result.embedding?.values;
      if (vector?.length) {
        return Array.from(vector);
      }
      throw new Error('Embedding API trả về vector rỗng');
    } catch (error) {
      console.warn('[EmbeddingBaseline] Lỗi embedContent, thử key khác:', error);
      if (embeddingKeys.length === 0) break;
      activeClientIndex = (activeClientIndex + 1) % embeddingKeys.length;
      embeddingClients[activeClientIndex] = null;
      embeddingModels[activeClientIndex] = null;
      await sleep(250);
    }
  }

  return [];
}

function cosineSimilarity(a: number[], b: number[]): number | null {
  if (!a.length || !b.length || a.length !== b.length) return null;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return null;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

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

function similarityToBonus(avg: number): number {
  if (avg >= 0.88) return 5;
  if (avg >= 0.83) return 3.5;
  if (avg >= 0.78) return 2;
  if (avg >= 0.72) return 1;
  return 0;
}

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
      return {
        id: record.id,
        name: record.name,
        role: record.role,
        similarity,
        relativePath: record.relativePath,
      };
    })
    .filter((item): item is IndustryEmbeddingMatch => Boolean(item))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.max(topK, DEFAULT_TOP_K));

  if (!matches.length) return null;

  const averageSimilarity = matches.reduce((sum, match) => sum + match.similarity, 0) / matches.length;
  const bonusPoints = similarityToBonus(averageSimilarity);

  return {
    industry,
    averageSimilarity,
    topMatches: matches,
    bonusPoints,
  };
}

// Backward compatibility wrapper if needed, or just remove it if I update all calls
export async function computeItIndustrySimilarity(cvText: string, topK: number = DEFAULT_TOP_K): Promise<IndustryEmbeddingInsight | null> {
  return computeIndustrySimilarity('it', cvText, topK);
}
