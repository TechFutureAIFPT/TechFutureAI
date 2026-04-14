import PQueue from 'p-queue';
import { processFileToText } from '../../../file-processing/ocrService';
import type { Candidate, HardFilters, WeightCriteria, MainCriterion } from '../../../../assets/types';

const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
const OPENAI_MODEL = (import.meta as any).env?.VITE_OPENAI_MODEL || 'gpt-4o-mini';

const apiQueue = new PQueue({ concurrency: 2 });

function getOpenAIChatUrl(): string {
  if (typeof window !== 'undefined') return '/api/openai-chat';
  return 'https://api.openai.com/v1/chat/completions';
}
const IT_KEYWORDS = ['it','software','developer','engineer','backend','frontend','fullstack','full-stack','devops','data engineer','data scientist','kỹ sư','lập trình','qa','tester','product manager'];
const SALES_KEYWORDS = ['sales','kinh doanh','bán hàng','thị trường','business development','account manager','tư vấn','sale'];
const MARKETING_KEYWORDS = ['marketing','truyền thông','content','seo','social media','brand','quảng cáo','pr','digital'];
const DESIGN_KEYWORDS = ['design','thiết kế','đồ họa','ui/ux','art','creative','sáng tạo','artist','designer'];
type SupportedIndustry = 'it' | 'sales' | 'marketing' | 'design';
type IndustryEmbeddingInsight = { averageSimilarity: number; bonusPoints: number; topMatches: Array<{ id: string; name: string; similarity: number; role?: string }> };

export function resetClient() {
  /* reserved — trước đây dùng SDK; giờ fetch qua proxy */
}

export const isRetryableOpenAIError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate_limit') ||
    msg.includes('too many requests') ||
    msg.includes('quota') ||
    msg.includes('overloaded')
  );
};

export const normalizeSchemaForOpenAI = (schema: any): any => {
  if (schema == null) return schema;
  if (Array.isArray(schema)) return schema.map(normalizeSchemaForOpenAI);
  if (typeof schema !== 'object') return schema;
  const typeMap: Record<string, string> = {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    NUMBER: 'number',
    INTEGER: 'integer',
    BOOLEAN: 'boolean',
    NULL: 'null',
  };
  const normalized: any = {};
  for (const [key, value] of Object.entries(schema)) {
    normalized[key] =
      key === 'type' && typeof value === 'string'
        ? typeMap[value] || value.toLowerCase()
        : normalizeSchemaForOpenAI(value);
  }
  return normalized;
};

export const extractPromptFromContents = (contents: any): string => {
  if (typeof contents === 'string') return contents;
  if (Array.isArray(contents))
    return contents
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return String(item.text);
        if (item?.parts && Array.isArray(item.parts))
          return item.parts.map((part: any) => part?.text || '').join('\n');
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  if (contents?.parts && Array.isArray(contents.parts))
    return contents.parts.map((part: any) => part?.text || '').join('\n\n');
  if (contents?.text) return String(contents.text);
  return JSON.stringify(contents ?? '');
};

/**
 * Call OpenAI chat completion with optional JSON schema.
 * Mimics the Gemini generateContentWithFallback interface.
 */
export async function callOpenAI(
  prompt: string,
  config?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    responseSchema?: any;
    responseMimeType?: string;
    thinkingConfig?: { thinkingBudget: number };
    maxTokens?: number;
  }
): Promise<{ text: string }> {
  const run = async (): Promise<{ text: string }> => {
    const messages = [{ role: 'user' as const, content: prompt }];

    const body: Record<string, unknown> = {
      model: OPENAI_MODEL,
      messages,
      temperature: config?.temperature ?? 0,
    };

    if (config?.topP !== undefined) body.top_p = config.topP;
    if (config?.maxTokens) body.max_tokens = config.maxTokens;

    if (config?.responseSchema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'ai_response_schema',
          strict: true,
          schema: normalizeSchemaForOpenAI(config.responseSchema),
        },
      };
    }

    const url = getOpenAIChatUrl();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window === 'undefined' && OPENAI_API_KEY) {
      headers.Authorization = `Bearer ${OPENAI_API_KEY}`;
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error (${response.status}): ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string') {
      throw new Error('OpenAI returned empty content.');
    }
    return { text };
  };
  return apiQueue.add(run) as Promise<{ text: string }>;
}

// ── Utility functions used by openai-analyze ────────────────────────────────

export const buildCompactCriteria = (weights: WeightCriteria): string => {
  return Object.values(weights).map((c: MainCriterion) => {
    const totalWeight = c.children?.reduce((sum, child) => sum + child.weight, 0) || c.weight || 0;
    return `${c.name}: ${totalWeight}%`;
  }).join('\n');
};

export const enhanceAndValidateCandidate = (candidate: any): any => {
  const enhanced = {
    ...candidate,
    candidateName: candidate.candidateName || 'Không xác định',
    phone: candidate.phone || '',
    email: candidate.email || '',
    fileName: candidate.fileName || 'Unknown',
    jobTitle: candidate.jobTitle || '',
    industry: candidate.industry || '',
    department: candidate.department || '',
    experienceLevel: candidate.experienceLevel || '',
    detectedLocation: candidate.detectedLocation || '',
  };
  if (enhanced.analysis) {
    if (typeof enhanced.analysis['Tổng điểm'] === 'number') enhanced.analysis['Tổng điểm'] = Math.max(0, Math.min(100, enhanced.analysis['Tổng điểm']));
    else enhanced.analysis['Tổng điểm'] = 0;
    if (!['A','B','C'].includes(enhanced.analysis['Hạng'])) {
      const score = enhanced.analysis['Tổng điểm'];
      enhanced.analysis['Hạng'] = score >= 75 ? 'A' : score >= 50 ? 'B' : 'C';
    }
    if (!Array.isArray(enhanced.analysis['Chi tiết'])) enhanced.analysis['Chi tiết'] = [];
    if (!Array.isArray(enhanced.analysis['Điểm mạnh CV'])) enhanced.analysis['Điểm mạnh CV'] = [];
    if (!Array.isArray(enhanced.analysis['Điểm yếu CV'])) enhanced.analysis['Điểm yếu CV'] = [];
    if (enhanced.analysis.educationValidation) {
      const eduInfo = enhanced.analysis.educationValidation.standardizedEducation || '';
      const eduParts = eduInfo.split(' - ');
      const schoolName = eduParts[0] || '';
      const degree = eduParts[1] || '';
      const forbiddenKeywords = ['TopCV', 'VietnamWorks', 'JobStreet', 'TimViecNhanh', 'CareerBuilder', 'Vieclam24h', 'MyWork', 'JobsGO'];
      const foundForbidden = forbiddenKeywords.find(k => schoolName.toLowerCase().includes(k.toLowerCase()));
      if (foundForbidden) {
        enhanced.analysis.educationValidation.validationNote = 'Không hợp lệ – cần HR kiểm tra lại';
        if (!Array.isArray(enhanced.analysis.educationValidation.warnings)) enhanced.analysis.educationValidation.warnings = [];
        const msgs = [
          `Tên trường '${foundForbidden}' không phải là một trường đại học hợp lệ.`,
          `Phát hiện nền tảng tuyển dụng "${foundForbidden}" trong mục học vấn.`,
        ];
        msgs.forEach(m => { if (!enhanced.analysis.educationValidation.warnings.includes(m)) enhanced.analysis.educationValidation.warnings.push(m); });
      }
      if (degree.toLowerCase().match(/khóa học|short course|chứng chỉ|certificate|training|đào tạo nghề/)) {
        if (!Array.isArray(enhanced.analysis.educationValidation.warnings)) enhanced.analysis.educationValidation.warnings = [];
        const w = `Thông tin học vấn là một khóa học/chứng chỉ từ ${schoolName}, không phải bằng cấp đại học chính quy.`;
        if (!enhanced.analysis.educationValidation.warnings.includes(w)) enhanced.analysis.educationValidation.warnings.push(w);
      }
    }
  }
  return enhanced;
};

export const refineEducationWithAI = async (cvText: string, currentEdu: string | undefined): Promise<{standardizedEducation: string, validationNote: string, warnings: string[]} | null> => {
  const prompt = `Bạn là chuyên gia thẩm định hồ sơ học vấn. Nhiệm vụ: Phân tích văn bản CV và xác thực/trích xuất lại thông tin học vấn.
QUY TẮC:
1. PHÁT HIỆN LỖI TEMPLATE: "TopCV", "VietnamWorks", "JobStreet" trong tên trường → là lỗi template.
2. Tìm tên trường thực sự trong phần Education.
3. ĐỊNH DẠNG CHUẨN: "Tên trường - Bậc học - Chuyên ngành - Thời gian".
4. Validation: "Hợp lệ", "Cần kiểm tra", "Khóa học/Chứng chỉ", "Không hợp lệ".
OUTPUT JSON: { "standardizedEducation": "string", "validationNote": "string", "warnings": ["string"] }
CV: ${cvText.slice(0, 4000)}
Đang kiểm tra: "${currentEdu || 'Chưa có'}"`;
  try {
    const response = await callOpenAI(prompt, { temperature: 0, responseSchema: {
      type: 'object', properties: {
        standardizedEducation: { type: 'string' },
        validationNote: { type: 'string' },
        warnings: { type: 'array', items: { type: 'string' } },
      }, required: ['standardizedEducation', 'validationNote'],
    }});
    return JSON.parse(response.text);
  } catch (error) { console.warn('Lỗi refine education:', error); return null; }
};

export const refineNameWithAI = async (cvText: string, currentName: string | undefined): Promise<string | null> => {
  const prompt = `Bạn là chuyên gia xử lý văn bản CV (đặc biệt ảnh bị lỗi OCR nặng). Nhiệm vụ: Khôi phục TÊN ỨNG VIÊN.
CHIẾN LƯỢC:
1. Sửa lỗi OCR tiếng Việt: "Vũ Tù ng Dươn g" → "Vũ Tùng Dương", "N g u y ễ n" → "Nguyễn".
2. Loại bỏ ký tự rác (|, -, *, ...).
3. Viết hoa Title Case.
Chỉ trả về TÊN ĐẦY ĐỦ đã sửa. Nếu không tìm thấy, trả về "null".
CV: ${cvText.slice(0, 2000)}
Tên hiện tại: "${currentName || ''}"
Kết quả:`;
  try {
    const response = await callOpenAI(prompt, { temperature: 0.1 });
    let name = response.text.trim().replace(/^["']|["']$/g, '');
    if (name.length < 2 || name.toLowerCase() === 'null' || name.toLowerCase() === 'không tìm thấy') return null;
    return name;
  } catch { return null; }
};

export const convertLanguageLevelToCEFR = (text: string): string | null => {
  const upperText = text.toUpperCase();
  if (upperText.includes('IELTS')) {
    const match = upperText.match(/IELTS\s*(\d+\.?\d*)/);
    if (match) { const s = parseFloat(match[1]); if (s >= 8.0) return 'C2'; if (s >= 7.0) return 'C1'; if (s >= 5.5) return 'B2'; if (s >= 4.0) return 'B1'; }
  }
  if (upperText.includes('TOEIC')) {
    const match = upperText.match(/TOEIC\s*(\d+)/);
    if (match) { const s = parseInt(match[1]); if (s >= 945) return 'C2'; if (s >= 785) return 'C1'; if (s >= 550) return 'B2'; if (s >= 225) return 'B1'; }
  }
  if (upperText.includes('TOEFL')) {
    const match = upperText.match(/TOEFL\s*(\d+)/);
    if (match) { const s = parseInt(match[1]); if (s >= 110) return 'C2'; if (s >= 87) return 'C1'; if (s >= 57) return 'B2'; if (s >= 42) return 'B1'; }
  }
  if (upperText.includes('CPE') || upperText.includes('PROFICIENCY')) return 'C2';
  if (upperText.includes('CAE') || upperText.includes('ADVANCED')) return 'C1';
  if (upperText.includes('FCE') || upperText.includes('FIRST')) return 'B2';
  if (upperText.includes('PET') || upperText.includes('PRELIMINARY')) return 'B1';
  if (upperText.includes('THÀNH THẠO') || upperText.includes('XUẤT SẮC')) return 'C1';
  if (upperText.includes('GIAO TIẾP TỐT') || upperText.includes('KHÁ')) return 'B2';
  if (upperText.includes('CƠ BẢN') || upperText.includes('TRUNG BÌNH')) return 'B1';
  return null;
};

const containsKeyword = (value: string | undefined, keywords: string[]): boolean => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return keywords.some(keyword => normalized.includes(keyword));
};

export const detectIndustry = (candidate: Candidate, hardFilters: HardFilters): SupportedIndustry | null => {
  const check = (keywords: string[]) =>
    containsKeyword(candidate.industry, keywords) || containsKeyword(candidate.department, keywords) ||
    containsKeyword(candidate.jobTitle, keywords) || containsKeyword(hardFilters.industry, keywords);
  if (check(IT_KEYWORDS)) return 'it';
  if (check(SALES_KEYWORDS)) return 'sales';
  if (check(MARKETING_KEYWORDS)) return 'marketing';
  if (check(DESIGN_KEYWORDS)) return 'design';
  return null;
};

export const getFileContentPart = async (file: File, onProgress?: (message: string) => void): Promise<{text: string} | null> => {
  try {
    const progressCallback = (message: string) => { if (onProgress) onProgress(`${file.name}: ${message}`); };
    const textContent = await processFileToText(file, progressCallback);
    const MAX_CHARS = 10000;
    const optimizedContent = textContent.length <= MAX_CHARS ? textContent :
      textContent.substring(0, MAX_CHARS) + '...';
    return { text: `--- CV: ${file.name} ---\n${optimizedContent}` };
  } catch(e) { console.error(`Could not process file ${file.name}`, e); return null; }
};

export const applyIndustryBaselineEnhancement = async (
  candidate: Candidate, fileName: string, fileLookup: Map<string, File>, fileTextMap: Map<string, string>, hardFilters: HardFilters
): Promise<void> => {
  // Industry embedding similarity is a stub for OpenAI path (Gemini has full embedding service)
  if (!candidate || candidate.embeddingInsights) return;
};
