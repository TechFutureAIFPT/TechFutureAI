import 'dotenv/config';
import * as path from 'path';
import * as process from 'process';
import * as util from 'util';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface EmbeddingRecord {
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

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';
const MAX_EMBEDDING_TEXT_LENGTH = 6000;
const SKIP_KEYS = new Set(['embeddingVector']);

const { values } = util.parseArgs({
  options: {
    out: { type: 'string' },
    limit: { type: 'string' },
    simulate: { type: 'boolean', default: false },
    filter: { type: 'string' },
  },
});

const DATA_ROOT = path.resolve(process.cwd(), 'data');
const OUTPUT_PATH = values.out ? path.resolve(values.out) : path.resolve(DATA_ROOT, 'embeddings.index.json');
const FILTER = values.filter ? values.filter.toLowerCase() : undefined;
const LIMIT = values.limit ? Number(values.limit) : undefined;

if (values.limit && Number.isNaN(LIMIT)) {
  console.error(`--limit phải là số hợp lệ, nhận được: ${values.limit}`);
  process.exit(1);
}

const API_KEYS = [
  process.env.VITE_GEMINI_API_KEY_1,
  process.env.VITE_GEMINI_API_KEY_2,
].filter((key): key is string => Boolean(key && key.trim().length > 0));

if (API_KEYS.length === 0 && !values.simulate) {
  console.error('Thiếu GEMINI API key. Vui lòng set VITE_GEMINI_API_KEY_1 hoặc VITE_GEMINI_API_KEY_2 trong environment.');
  process.exit(1);
}

const clients = API_KEYS.map((key) => new GoogleGenerativeAI(key));
let activeClientIndex = 0;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedText(text: string, modelName: string): Promise<number[]> {
  if (values.simulate) {
    return Array.from({ length: 10 }, () => 0);
  }

  let attempts = 0;
  let lastError: unknown = null;

  while (attempts < clients.length) {
    try {
      const model = clients[activeClientIndex].getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      const embeddingValues = result.embedding?.values;
      if (!embeddingValues || embeddingValues.length === 0) {
        throw new Error('Google API trả về embedding rỗng.');
      }
      return Array.from(embeddingValues);
    } catch (error) {
      lastError = error;
      attempts += 1;
      console.warn(`[WARN] Lỗi gọi embedding với key #${activeClientIndex + 1}: ${error instanceof Error ? error.message : error}`);
      activeClientIndex = (activeClientIndex + 1) % clients.length;
      await delay(500);
    }
  }

  throw new Error(`Tất cả API key đều thất bại khi tạo embedding. ${lastError instanceof Error ? lastError.message : lastError}`);
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const dirEntries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: string[] = []
  for (const entry of dirEntries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJsonFiles(absPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      files.push(absPath);
    }
  }

  return files;
}

function sanitizeId(rawId: string | undefined, filePath: string): string {
  if (rawId && typeof rawId === 'string' && rawId.trim().length > 0) {
    return rawId.trim();
  }
  const relative = path.relative(DATA_ROOT, filePath).replace(/\\/g, '/');
  return relative
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || path.basename(filePath, '.json');
}

function pushUnique(parts: string[], seen: Set<string>, value?: unknown) {
  if (!value) return;
  const text = String(value).trim();
  if (!text || seen.has(text)) return;
  seen.add(text);
  parts.push(text);
}

function flattenValues(value: unknown, parts: string[], seen: Set<string>) {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    pushUnique(parts, seen, value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      flattenValues(item, parts, seen);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (SKIP_KEYS.has(key)) continue;
      flattenValues(child, parts, seen);
    }
  }
}

function buildEmbeddingText(record: Record<string, unknown>): { text: string; summarySnippet?: string; role?: string; name?: string } {
  const parts: string[] = [];
  const seen = new Set<string>();
  const typedRecord = record as Record<string, unknown>;

  const name = typeof typedRecord.name === 'string' ? typedRecord.name : undefined;
  const role = typeof typedRecord.role === 'string'
    ? typedRecord.role
    : typeof typedRecord.metadata === 'object' && typedRecord.metadata && typeof (typedRecord.metadata as Record<string, unknown>).role === 'string'
      ? (typedRecord.metadata as Record<string, string>).role
      : undefined;
  const summary = typeof typedRecord.summary === 'string' ? typedRecord.summary : undefined;
  const level = typeof typedRecord.level === 'string' ? typedRecord.level : undefined;
  const yoeValue = typeof typedRecord.yoe === 'number' || typeof typedRecord.yoe === 'string'
    ? typedRecord.yoe
    : undefined;
  const experiencePeriod = typeof typedRecord.experience_period === 'string' ? typedRecord.experience_period : undefined;
  const skillsArray = Array.isArray(typedRecord.skills)
    ? typedRecord.skills
    : typeof typedRecord.metadata === 'object' && typedRecord.metadata && Array.isArray((typedRecord.metadata as Record<string, unknown>).skills)
      ? (typedRecord.metadata as { skills: unknown[] }).skills
      : undefined;

  pushUnique(parts, seen, name && `Họ tên: ${name}`);
  pushUnique(parts, seen, role && `Vị trí: ${role}`);
  pushUnique(parts, seen, level && `Cấp độ: ${level}`);
  pushUnique(parts, seen, yoeValue && `Số năm kinh nghiệm: ${yoeValue}`);
  pushUnique(parts, seen, experiencePeriod);
  pushUnique(parts, seen, summary && `Tóm tắt: ${summary}`);

  const embeddingText = typeof typedRecord.embedding_text === 'string' ? typedRecord.embedding_text : undefined;
  pushUnique(parts, seen, embeddingText);

  if (skillsArray && skillsArray.length > 0) {
    const normalizedSkills = skillsArray
      .map((skill) => typeof skill === 'string' ? skill.trim() : '')
      .filter(Boolean);
    if (normalizedSkills.length > 0) {
      pushUnique(parts, seen, `Kỹ năng: ${normalizedSkills.join(', ')}`);
    }
  }

  flattenValues(record, parts, seen);

  const joined = parts.join('\n').replace(/\s+/g, ' ').trim();
  const truncated = joined.length > MAX_EMBEDDING_TEXT_LENGTH
    ? `${joined.slice(0, MAX_EMBEDDING_TEXT_LENGTH)} …`
    : joined;

  const summarySnippet = summary ? summary.slice(0, 180) : undefined;

  return {
    text: truncated,
    summarySnippet,
    name,
    role,
  };
}

async function main() {
  const embeddingModel = process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
await fs.promises.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const jsonFiles = await collectJsonFiles(DATA_ROOT);
  const filteredFiles = FILTER
    ? jsonFiles.filter((file) => path.relative(DATA_ROOT, file).toLowerCase().includes(FILTER))
    : jsonFiles;

  const targetFiles = typeof LIMIT === 'number' ? filteredFiles.slice(0, LIMIT) : filteredFiles;

  if (targetFiles.length === 0) {
    console.warn('Không tìm thấy file JSON nào trong thư mục data.');
    return;
  }

  console.log(`Found ${targetFiles.length} JSON files. Bắt đầu tạo embeddings với model ${embeddingModel} ...`);

  const records: EmbeddingRecord[] = [];

  for (const [index, filePath] of targetFiles.entries()) {
    const relativePath = path.relative(DATA_ROOT, filePath);
    process.stdout.write(`\r[${index + 1}/${targetFiles.length}] Đang xử lý ${relativePath}     `);

    try {
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const { text, summarySnippet, name, role } = buildEmbeddingText(parsed);

      if (!text) {
        console.warn(`\n[SKIP] ${relativePath} không có dữ liệu văn bản.`);
        continue;
      }

      const vector = await embedText(text, embeddingModel);

      records.push({
        id: sanitizeId(typeof parsed.id === 'string' ? parsed.id : undefined, filePath),
        sourceFile: filePath,
        relativePath,
        name,
        role,
        summarySnippet,
        embeddingText: text,
        vector,
        metadata: typeof parsed.metadata === 'object' ? parsed.metadata as Record<string, unknown> : undefined,
      });
    } catch (error) {
      console.error(`\n[ERROR] Không thể xử lý ${relativePath}:`, error);
    }
  }

  process.stdout.write('\n');

  if (records.length === 0) {
    console.warn('Không tạo được embedding nào.');
    return;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    model: embeddingModel,
    vectorLength: records[0]?.vector.length ?? 0,
    recordCount: records.length,
    dataRoot: DATA_ROOT,
    records,
  };

  await fs.promises.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Đã lưu ${records.length} embeddings vào ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('Embedding script failed:', error);
  process.exit(1);
});
