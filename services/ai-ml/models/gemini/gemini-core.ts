import { GoogleGenAI, Type } from '@google/genai';
import PQueue from 'p-queue';
import { MODEL_NAME } from '../../../../assets/constants';
import { analysisCacheService } from '../../../history-cache/analysisCache';
import { processFileToText } from '../../../file-processing/ocrService';
import { computeIndustrySimilarity, type IndustryEmbeddingInsight, type SupportedIndustry } from '../../embedding-vector/similarity/industryEmbeddingService';
import type { Candidate, HardFilters, WeightCriteria, MainCriterion, AnalysisRunData, ChatMessage } from '../../../../assets/types';

// API key rotation
let ai: GoogleGenAI | null = null;
let currentKeyIndex = 0;

const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = (import.meta as any).env?.VITE_OPENAI_MODEL || 'gpt-4o-mini';

/** Gom key Gemini từ .env, trim, bỏ trùng */
function collectGeminiApiKeys(): string[] {
  const e = (import.meta as any).env || {};
  const raw = [
    e.VITE_GEMINI_API_KEY_1,
    e.VITE_GEMINI_API_KEY_2,
  ];
  const out: string[] = [];
  for (const k of raw) {
    if (typeof k !== 'string') continue;
    const t = k.trim();
    if (t.length >= 12) out.push(t);
  }
  return [...new Set(out)];
}

const apiKeys = collectGeminiApiKeys();

function isGeminiApiKeyInvalidError(error: unknown): boolean {
  const s = error instanceof Error ? error.message : String(error);
  return (
    s.includes('API_KEY_INVALID') ||
    s.includes('API key not valid') ||
    (s.includes('400') && s.includes('INVALID_ARGUMENT'))
  );
}

const apiQueue = new PQueue({ concurrency: 2 });

const IT_KEYWORDS = ['it','software','developer','engineer','backend','frontend','fullstack','full-stack','devops','data engineer','data scientist','kỹ sư','lập trình','qa','tester','product manager'];
const SALES_KEYWORDS = ['sales','kinh doanh','bán hàng','thị trường','business development','account manager','tư vấn','sale'];
const MARKETING_KEYWORDS = ['marketing','truyền thông','content','seo','social media','brand','quảng cáo','pr','digital'];
const DESIGN_KEYWORDS = ['design','thiết kế','đồ họa','ui/ux','art','creative','sáng tạo','artist','designer'];

function getAi(): GoogleGenAI {
  if (!ai) {
    const key = apiKeys[currentKeyIndex];
    if (!key) throw new Error("GEMINI_API_KEY environment variable not set.");
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

function switchToNextKey() {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  ai = null;
}

export const normalizeSchemaForOpenAI = (schema: any): any => {
  if (schema == null) return schema;
  if (Array.isArray(schema)) return schema.map(normalizeSchemaForOpenAI);
  if (typeof schema !== 'object') return schema;
  const typeMap: Record<string, string> = { OBJECT: 'object', ARRAY: 'array', STRING: 'string', NUMBER: 'number', INTEGER: 'integer', BOOLEAN: 'boolean', NULL: 'null' };
  const normalized: any = {};
  for (const [key, value] of Object.entries(schema)) {
    normalized[key] = key === 'type' && typeof value === 'string' ? (typeMap[value] || value.toLowerCase()) : normalizeSchemaForOpenAI(value);
  }
  return normalized;
};

export const extractPromptFromContents = (contents: any): string => {
  if (typeof contents === 'string') return contents;
  if (Array.isArray(contents)) return contents.map(item => {
    if (typeof item === 'string') return item;
    if (item?.text) return String(item.text);
    if (item?.parts && Array.isArray(item.parts)) return item.parts.map((part: any) => part?.text || '').join('\n');
    return '';
  }).filter(Boolean).join('\n\n');
  if (contents?.parts && Array.isArray(contents.parts)) return contents.parts.map((part: any) => part?.text || '').join('\n\n');
  if (contents?.text) return String(contents.text);
  return JSON.stringify(contents ?? '');
};

export const isRetryableGeminiError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource exhausted') || msg.includes('too many requests') || msg.includes('overload') || msg.includes('unavailable');
};

/** Trình duyệt: gọi proxy same-origin (Vite / Vercel) — không gửi key ra client. SSR/Node: gọi trực tiếp nếu có key. */
function getOpenAIChatUrl(): string {
  if (typeof window !== 'undefined') return '/api/openai-chat';
  return 'https://api.openai.com/v1/chat/completions';
}

async function generateContentWithOpenAI(contents: any, config: any): Promise<{ text: string }> {
  const prompt = extractPromptFromContents(contents);
  const body: any = { model: OPENAI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: typeof config?.temperature === 'number' ? config.temperature : 0 };
  if (config?.responseSchema) {
    body.response_format = { type: 'json_schema', json_schema: { name: 'gemini_fallback_schema', strict: true, schema: normalizeSchemaForOpenAI(config.responseSchema) } };
  }
  const url = getOpenAIChatUrl();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window === 'undefined' && OPENAI_API_KEY) {
    headers.Authorization = `Bearer ${OPENAI_API_KEY}`;
  }
  if (typeof window !== 'undefined' && !OPENAI_API_KEY) {
    console.warn('VITE_OPENAI_API_KEY: proxy sẽ thêm key phía server (dev). Production: cấu hình env trên Vercel cho /api/openai-chat.');
  }
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`OpenAI fallback failed (${response.status})`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') throw new Error('OpenAI fallback returned empty content.');
  return { text };
}

export async function generateContentWithFallback(model: string, contents: any, config: any): Promise<any> {
  const startTime = Date.now();
  const params = { model, contents: typeof contents === 'string' ? contents.substring(0, 100) + '...' : 'complex', config };
  try {
    const result = await apiQueue.add(async () => {
      if (apiKeys.length === 0) {
        if (OPENAI_API_KEY || typeof window !== 'undefined') {
          console.warn('No Gemini API keys found. Using OpenAI fallback directly.');
          return generateContentWithOpenAI(contents, config);
        }
        throw new Error("No GEMINI_API_KEY environment variables set.");
      }
      let lastError: unknown = null;
      for (let attempt = 0; attempt < apiKeys.length; attempt++) {
        try {
          const aiInstance = getAi();
          return await aiInstance.models.generateContent({ model, contents, config });
        } catch (error) {
          lastError = error;
          const idx = currentKeyIndex + 1;
          if (isGeminiApiKeyInvalidError(error)) {
            console.warn(
              `[Gemini] Key ${idx}/${apiKeys.length} không hợp lệ hoặc đã thu hồi. Tạo key mới: https://aistudio.google.com/apikey — bật API "Generative Language API" cho project.`,
            );
          } else {
            console.warn(`API key ${idx} failed:`, error);
          }
          switchToNextKey();
        }
      }
      if (lastError && (OPENAI_API_KEY || typeof window !== 'undefined')) {
        console.warn('All Gemini keys failed. Switching to OpenAI fallback.', isRetryableGeminiError(lastError) ? '(quota/overload)' : '');
        return generateContentWithOpenAI(contents, config);
      }
      throw new Error("All Gemini API keys failed and OpenAI fallback is unavailable (set VITE_OPENAI_API_KEY or use dev proxy).");
    });
    console.log('generateContent success:', Date.now() - startTime);
    return result;
  } catch (error) {
    console.error('generateContent error:', params, null, Date.now() - startTime, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// ── JD Processing ────────────────────────────────────────────────────────────────

const jdSchema = {
  type: Type.OBJECT,
  properties: {
    "MucDichCongViec": { type: Type.STRING, description: "Nội dung mục đích công việc, hoặc chuỗi rỗng nếu không tìm thấy." },
    "MoTaCongViec": { type: Type.STRING, description: "Nội dung mô tả công việc, hoặc chuỗi rỗng nếu không tìm thấy." },
    "YeuCauCongViec": { type: Type.STRING, description: "Nội dung yêu cầu công việc, hoặc chuỗi rỗng nếu không tìm thấy." },
  },
  required: ["MucDichCongViec", "MoTaCongViec", "YeuCauCongViec"]
};

export const filterAndStructureJD = async (rawJdText: string, file?: File): Promise<string> => {
  const prompt = `Bạn là một AI chuyên gia xử lý văn bản JD. Nhiệm vụ của bạn là phân tích văn bản JD thô (có thể chứa lỗi OCR) và trích xuất, làm sạch, và cấu trúc lại nội dung một cách CHÍNH XÁC.
  QUY TẮC:
  1. Sửa lỗi chính tả, bỏ ký tự thừa, chuẩn hóa dấu câu và viết hoa cho đúng chuẩn tiếng Việt.
  2. GIỮ NGUYÊN văn phong và ý nghĩa của các câu trong JD gốc. Chỉ sửa lỗi chính tả và định dạng.
  3. Chỉ giữ lại 3 mục: "Mục đích công việc", "Mô tả công việc", và "Yêu cầu công việc".
  4. Loại bỏ nội dung thừa: giới thiệu công ty, phúc lợi, lương thưởng, thông tin liên hệ.
  5. Nếu không tìm thấy nội dung cho một mục, trả về chuỗi rỗng ("").
  6. LUÔN trả về JSON với 3 khóa: MucDichCongViec, MoTaCongViec, YeuCauCongViec.
  Văn bản JD thô cần xử lý:
  ---
  ${rawJdText.slice(0, 4000)}
  ---`;
  try {
    const response = await generateContentWithFallback(MODEL_NAME, prompt, {
      responseMimeType: "application/json",
      responseSchema: jdSchema,
      temperature: 0, topP: 0, topK: 1,
    });
    const resultJson = JSON.parse(response.text);
    const hasContent = resultJson.MucDichCongViec?.trim() || resultJson.MoTaCongViec?.trim() || resultJson.YeuCauCongViec?.trim();
    if (!hasContent) throw new Error("Không thể trích xuất nội dung có ý nghĩa nào từ JD.");
    let formattedString = '';
    if (resultJson.MucDichCongViec?.trim()) formattedString += `MỤC ĐÍCH CÔNG VIỆC\n${resultJson.MucDichCongViec.trim()}\n\n`;
    if (resultJson.MoTaCongViec?.trim()) formattedString += `MÔ TẢ CÔNG VIỆC\n${resultJson.MoTaCongViec.trim()}\n\n`;
    if (resultJson.YeuCauCongViec?.trim()) formattedString += `YÊU CẦU CÔNG VIỆC\n${resultJson.YeuCauCongViec.trim()}\n\n`;
    return formattedString.trim();
  } catch (error) {
    console.error("Lỗi khi lọc và cấu trúc JD:", error);
    if (error instanceof Error && error.message.includes("Không thể trích xuất")) throw error;
    throw new Error("AI không thể phân tích cấu trúc JD. Vui lòng thử lại.");
  }
};

export const extractJobPositionFromJD = async (jdText: string): Promise<string> => {
  if (!jdText || jdText.trim().length < 20) return '';
  const prompt = `Bạn là chuyên gia phân tích JD. Nhiệm vụ: Tìm và trả về CHÍNH XÁC tên chức danh công việc từ văn bản JD.
  CHIẾN LƯỢC:
  1. Tìm trực tiếp: "Vị trí tuyển dụng", "Chức danh", "Position", "Job Title", "Tuyển dụng [Chức danh]"
  2. Suy luận từ mô tả công việc nếu không có chức danh rõ ràng
  3. Định cấp bậc từ yêu cầu kinh nghiệm: 0-1 năm → Junior, 2-4 năm → Mid-level, 5+ năm → Senior, Lead team → Lead/Manager
  QUY TẮC: CHỈ trả về tên chức danh (3-50 ký tự), KHÔNG có th��m text. LUÔN trả về kết quả.
  PHÂN TÍCH VĂN BẢN JD:
  ---
  ${jdText.slice(0, 2000)}
  ---
  Chức danh công việc:`;
  try {
    const response = await generateContentWithFallback(MODEL_NAME, prompt, { temperature: 0.3, topP: 0.7, topK: 10, thinkingConfig: { thinkingBudget: 0 } });
    let position = response.text.trim()
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^(chức danh|vị trí|position|job title)[:\s]*/i, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (position.length >= 3 && position.length <= 80) return position;
    return '';
  } catch (error) {
    console.error("Lỗi trích xuất chức danh:", error);
    return '';
  }
};

// ── CV Analysis Schemas & Prompts ───────────────────────────────────────────

export const detailedScoreSchema = {
  type: Type.OBJECT,
  properties: {
    "Tiêu chí": { type: Type.STRING },
    "Điểm": { type: Type.STRING },
    "Công thức": { type: Type.STRING },
    "Dẫn chứng": { type: Type.STRING },
    "Giải thích": { type: Type.STRING },
  },
  required: ["Tiêu chí", "Điểm", "Công thức", "Dẫn chứng", "Giải thích"]
};

export const analysisSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      candidateName: { type: Type.STRING },
      phone: { type: Type.STRING },
      email: { type: Type.STRING },
      fileName: { type: Type.STRING },
      jobTitle: { type: Type.STRING },
      industry: { type: Type.STRING },
      department: { type: Type.STRING },
      experienceLevel: { type: Type.STRING },
      hardFilterFailureReason: { type: Type.STRING },
      softFilterWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
      detectedLocation: { type: Type.STRING },
      analysis: {
        type: Type.OBJECT,
        properties: {
          "Tổng điểm": { type: Type.INTEGER },
          "Hạng": { type: Type.STRING },
          "Chi tiết": { type: Type.ARRAY, items: detailedScoreSchema },
          "Điểm mạnh CV": { type: Type.ARRAY, items: { type: Type.STRING } },
          "Điểm yếu CV": { type: Type.ARRAY, items: { type: Type.STRING } },
          "educationValidation": {
            type: Type.OBJECT,
            properties: {
              "standardizedEducation": { type: Type.STRING },
              "validationNote": { type: Type.STRING },
              "warnings": { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["standardizedEducation", "validationNote"]
          },
        },
        required: ["Tổng điểm", "Hạng", "Chi tiết", "Điểm mạnh CV", "Điểm yếu CV"]
      }
    },
    required: ["candidateName", "fileName", "analysis"]
  }
};

export const buildCompactCriteria = (weights: WeightCriteria): string => {
  return Object.values(weights).map((c: MainCriterion) => {
    const totalWeight = c.children?.reduce((sum, child) => sum + child.weight, 0) || c.weight || 0;
    return `${c.name}: ${totalWeight}%`;
  }).join('\n');
};

export const createAnalysisPrompt = (jdText: string, weights: WeightCriteria, hardFilters: HardFilters): string => {
  const compactJD = jdText.replace(/\s+/g, ' ').trim().slice(0, 5000);
  const compactWeights = buildCompactCriteria(weights);
  return `
    ADVANCED CV ANALYSIS SYSTEM. Role: AI Recruiter với khả năng phân tích sâu và chính xác cao. Language: VIETNAMESE ONLY. Output: STRICT JSON ARRAY.
    **NHIỆM VỤ:** Phân tích CV với độ chính xác cao, tập trung vào sự phù hợp thực tế với JD và đánh giá toàn diện ứng viên.
    **JOB DESCRIPTION:**
    ${compactJD}
    **TIÊU CHÍ ĐÁNH GIÁ & TRỌNG SỐ:**
    ${compactWeights}
    **BỘ LỌC CỨNG:**
    Địa điểm: ${hardFilters.location || 'Linh hoạt'}
    Kinh nghiệm tối thiểu: ${hardFilters.minExp || 'Không yêu cầu'} năm
    Cấp độ: ${hardFilters.seniority || 'Linh hoạt'}
    **QUY TẮC ĐẦU RA:**
    1. Tạo JSON array cho mỗi CV theo đúng schema
    2. Tính điểm chi tiết cho 9 tiêu chí theo thang trọng số
    3. Tổng điểm = Điểm cơ sở + Tổng điểm tiêu chí + Bonus - Penalty (0-100)
    4. Hạng: A (75-100), B (50-74), C (0-49)
    5. CV không đọc được: Tạo FAILED entry
  `;
};

// ── Text Processing Helpers ──────────────────────────────────────────────────

export const optimizeContentForAI = (text: string, fileName: string): string => {
  const MAX_CHARS = 10000;
  if (text.length <= MAX_CHARS) return text;
  const prioritySections = [
    /(?:thông tin cá nhân|personal info|contact)[\s\S]*?(?=\n[A-Z]|\n\s*\n|$)/gi,
    /(?:mục tiêu|objective|career objective)[\s\S]*?(?=\n[A-Z]|\n\s*\n|$)/gi,
    /(?:kinh nghiệm|experience|work history|employment)[\s\S]*?(?=\n[A-Z]|\n\s*\n|$)/gi,
    /(?:kỹ năng|skills|technical skills|competencies)[\s\S]*?(?=\n[A-Z]|\n\s*\n|$)/gi,
    /(?:học vấn|education|qualifications)[\s\S]*?(?=\n[A-Z]|\n\s*\n|$)/gi,
    /(?:dự án|projects|portfolio)[\s\S]*?(?=\n[A-Z]|\n\s*\n|$)/gi,
    /(?:chứng chỉ|certificates|certifications)[\s\S]*?(?=\n[A-Z]|\n\s*\n|$)/gi,
  ];
  let priorityContent = '';
  let remainingChars = MAX_CHARS;
  for (const pattern of prioritySections) {
    const matches = text.match(pattern);
    if (matches && remainingChars > 0) {
      for (const match of matches) {
        if (remainingChars > match.length) { priorityContent += match + '\n\n'; remainingChars -= match.length; }
        else { priorityContent += match.substring(0, remainingChars) + '...'; remainingChars = 0; break; }
      }
    }
    if (remainingChars <= 0) break;
  }
  if (remainingChars > 200 && priorityContent.length < text.length) {
    const remainingText = text.replace(new RegExp(prioritySections.map(p => p.source).join('|'), 'gi'), '');
    priorityContent += remainingText.length > remainingChars ? '\n\n--- Additional Info ---\n' + remainingText.substring(0, remainingChars - 50) + '...' : '\n\n--- Additional Info ---\n' + remainingText;
  }
  return priorityContent || text.substring(0, MAX_CHARS) + '...';
};

export const attemptPartialJsonRecovery = (text: string): any[] | null => {
  try {
    const startIndex = text.indexOf('[');
    const lastIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
      const jsonPart = text.substring(startIndex, lastIndex + 1);
      try { return JSON.parse(jsonPart); } catch {
        const fixed = jsonPart.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/}\s*{/g, '},{');
        return JSON.parse(fixed);
      }
    }
    return null;
  } catch { return null; }
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
        const msgs = [`Tên trường '${foundForbidden}' không phải là một trường đại học hợp lệ.`, `Phát hiện nền tảng tuyển dụng "${foundForbidden}" trong mục học vấn.`];
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

// ── Education & Name Refinement ──────────────────────────────────────────────

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
    const response = await generateContentWithFallback(MODEL_NAME, prompt, { responseMimeType: "application/json", temperature: 0, topP: 0, topK: 1 });
    return JSON.parse(response.text);
  } catch (error) { console.warn("Lỗi refine education:", error); return null; }
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
    const response = await generateContentWithFallback(MODEL_NAME, prompt, { temperature: 0.1, topP: 0.1, topK: 1 });
    let name = response.text.trim().replace(/^["']|["']$/g, '');
    if (name.length < 2 || name.toLowerCase() === 'null' || name.toLowerCase() === 'không tìm thấy') return null;
    return name;
  } catch { return null; }
};

// ── File Processing ─────────────────────────────────────────────────────────

export const getFileContentPart = async (file: File, onProgress?: (message: string) => void): Promise<{text: string} | null> => {
  try {
    const progressCallback = (message: string) => { if (onProgress) onProgress(`${file.name}: ${message}`); };
    const textContent = await processFileToText(file, progressCallback);
    const optimizedContent = optimizeContentForAI(textContent, file.name);
    return { text: `--- CV: ${file.name} ---\n${optimizedContent}` };
  } catch(e) { console.error(`Could not process file ${file.name}`, e); return null; }
};

// ── Language Level Conversion ───────────────────────────────────────────────

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

// ── Industry Detection ─────────────────────────────────────────────────────────

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

type FileLookupMap = Map<string, File>;
type FileTextMap = Map<string, string>;

export const getCvTextForFile = async (fileName: string, fileLookup: FileLookupMap, fileTextMap: FileTextMap): Promise<string | null> => {
  if (!fileName) return null;
  const cached = fileTextMap.get(fileName);
  if (cached) return cached;
  const file = fileLookup.get(fileName);
  if (!file) return null;
  const part = await getFileContentPart(file);
  if (part?.text) { fileTextMap.set(fileName, part.text); return part.text; }
  return null;
};

export const applyIndustryBaselineEnhancement = async (
  candidate: Candidate, fileName: string, fileLookup: FileLookupMap, fileTextMap: FileTextMap, hardFilters: HardFilters
): Promise<void> => {
  if (!candidate || candidate.embeddingInsights) return;
  const industry = detectIndustry(candidate, hardFilters);
  if (!industry) return;
  try {
    const cvText = await getCvTextForFile(fileName, fileLookup, fileTextMap);
    if (!cvText) return;
    const insight = await computeIndustrySimilarity(industry, cvText);
    if (!insight) return;
    candidate.embeddingInsights = insight;
    if (!candidate.analysis) return;
    if (!Array.isArray(candidate.analysis['Chi tiết'])) candidate.analysis['Chi tiết'] = [];
    const evidence = insight.topMatches.slice(0, 3).map(m => `${m.name || m.role || m.id} ${(m.similarity * 100).toFixed(1)}%`).join('; ');
    const industryNameMap: Record<string, string> = { it: 'IT', sales: 'Kinh doanh', marketing: 'Marketing', design: 'Thiết kế' };
    const industryName = industryNameMap[industry] || industry;
    candidate.analysis['Chi tiết'].unshift({
      'Tiêu chí': `Chuẩn mẫu ${industryName}`,
      'Điểm': `${insight.bonusPoints.toFixed(1)}/5`,
      'Công thức': `Similarity ${(insight.averageSimilarity * 100).toFixed(1)}% => +${insight.bonusPoints.toFixed(1)} điểm`,
      'Dẫn chứng': evidence || `Khớp cao với thư viện CV ${industryName} chuẩn.`,
      'Giải thích': `CV tương đồng thư viện CV ${industryName} chuẩn.`,
    });
    const currentScore = typeof candidate.analysis['Tổng điểm'] === 'number' ? candidate.analysis['Tổng điểm'] : 0;
    candidate.analysis['Tổng điểm'] = Math.min(100, currentScore + insight.bonusPoints);
  } catch (error) { console.warn('[EmbeddingBaseline] Không thể áp dụng baseline:', error); }
};
