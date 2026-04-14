/**
 * Shared types cho hệ thống Embedding Vector
 * Dùng chung bởi indexer (embedData) và similarity search (industryEmbeddingService)
 */

// ── Record lưu trong index file (output của indexer) ──────────────────────
export interface EmbeddingRecord {
  id: string;
  sourceFile: string;
  relativePath: string;
  name?: string;
  role?: string;
  summarySnippet?: string;
  embeddingText: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

// ── Record rút gọn dùng khi load lên browser (không cần embeddingText) ────
export interface SampleEmbeddingRecord {
  id: string;
  relativePath: string;
  name?: string;
  role?: string;
  summarySnippet?: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

// ── File index tổng hợp (cấu trúc JSON output) ────────────────────────────
export interface SampleEmbeddingIndex {
  generatedAt: string;
  model: string;
  vectorLength: number;
  recordCount: number;
  dataRoot: string;
  records: SampleEmbeddingRecord[];
}

// ── Kết quả match từ similarity search ─────────────────────────────────────
export interface IndustryEmbeddingMatch {
  id: string;
  name?: string;
  role?: string;
  similarity: number;
  relativePath: string;
}

// ── Các industry được hỗ trợ ────────────────────────────────────────────────
export const INDUSTRY_EMBEDDING_URLS = {
  it:        '/data/it-embeddings.json',
  sales:     '/data/sales-embeddings.json',
  marketing: '/data/marketing-embeddings.json',
  design:    '/data/design-embeddings.json',
} as const;

export type SupportedIndustry = keyof typeof INDUSTRY_EMBEDDING_URLS;

// ── Kết quả phân tích industry embedding ────────────────────────────────────
export interface IndustryEmbeddingInsight {
  industry: SupportedIndustry;
  averageSimilarity: number;
  topMatches: IndustryEmbeddingMatch[];
  bonusPoints: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
export const EMBEDDING_MODEL_DEFAULT = 'text-embedding-004';
export const MAX_EMBEDDING_TEXT_LENGTH = 6000;
export const DEFAULT_TOP_K = 3;
