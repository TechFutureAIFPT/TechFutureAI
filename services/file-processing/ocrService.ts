import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cvCache } from '../history-cache/cacheService';

// Set the workerSrc for pdf.js. This is crucial for it to work from a CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs`;

const FILE_SIZE_LIMIT_MB = 15;
const MIN_PDF_TEXT_LENGTH = 200;
const MAX_OCR_PAGES = 3;        // Tăng lên 3 trang để không bỏ sót nội dung
const CANVAS_SCALE = 2.5;       // Tăng độ phân giải PDF render
const GEMINI_VISION_MODEL = 'gemini-1.5-flash';

const GOOGLE_CLOUD_VISION_API_KEY = (import.meta as any)?.env?.VITE_GOOGLE_CLOUD_VISION_API_KEY;

const geminiVisionKeys = [
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_1,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_2,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_3,
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY_4,
].filter((key): key is string => Boolean(key));

let geminiVisionClient: GoogleGenerativeAI | null = null;
let geminiVisionModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
let activeVisionKeyIndex = 0;
let visionKeyWarningShown = false;

const getGeminiVisionModel = (): ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null => {
  if (!geminiVisionKeys.length) {
    if (!visionKeyWarningShown) {
      console.warn('[OCR] Không tìm thấy VITE_GEMINI_API_KEY_x để sử dụng fallback OCR bằng Gemini Vision.');
      visionKeyWarningShown = true;
    }
    return null;
  }

  if (!geminiVisionClient) {
    geminiVisionClient = new GoogleGenerativeAI(geminiVisionKeys[activeVisionKeyIndex]);
    geminiVisionModel = geminiVisionClient.getGenerativeModel({ model: GEMINI_VISION_MODEL });
  }

  return geminiVisionModel;
};

const rotateVisionKey = () => {
  if (!geminiVisionKeys.length) return;
  activeVisionKeyIndex = (activeVisionKeyIndex + 1) % geminiVisionKeys.length;
  geminiVisionClient = null;
  geminiVisionModel = null;
};

const buildVisionPrompt = (documentType: 'cv' | 'jd'): string => {
  const base = [
    'Bạn là chuyên gia OCR cấp cao, chuyên xử lý hồ sơ việc làm bằng tiếng Việt và tiếng Anh.',
    '',
    'NHIỆM VỤ: Chuyển toàn bộ nội dung có trong hình ảnh thành văn bản chính xác.',
    '',
    'QUY TẮC BẮT BUỘC:',
    '1. SAO CHÉP NGUYÊN VẸN tất cả từ ngữ - không tóm tắt, không bỏ sót bất kỳ dòng nào.',
    '2. GIỮ NGUYÊN cấu trúc: xuống dòng, gạch đầu dòng, số thứ tự, bảng biểu.',
    '3. SỬA LỖI OCR rõ ràng: "rn" thành "m", số "0" thành chữ "o" khi ở giữa từ.',
    '4. DẤU TIẾNG VIỆT: ghi đúng dấu hoàn toàn (à, á, ạ, ả, ã, â, ầ, ấ...).',
    '5. Email, số điện thoại, URL: giữ nguyên chính xác 100%.',
    '6. CHỈ trả về văn bản đã trích xuất. KHÔNG thêm lời dẫn hay giải thích.',
  ].join('\n');

  if (documentType === 'jd') {
    return base + '\n\nLOẠI TÀI LIỆU: Mô tả công việc (JD). Ưu tiên trích xuất:\n- Tên vị trí / chức danh\n- Yêu cầu kinh nghiệm, kỹ năng bắt buộc\n- Bằng cấp, chứng chỉ\n- Quyền lợi, mức lương (nếu có)\n- Địa điểm làm việc';
  } else {
    return base + '\n\nLOẠI TÀI LIỆU: Hồ sơ người xét tuyển (CV). Ưu tiên trích xuất:\n- Họ tên, email, điện thoại, địa chỉ\n- Tất cả vị trí công việc đã làm và thời gian\n- Học vấn và bằng cấp\n- Kỹ năng, công cụ, công nghệ\n- Dự án, thành tựu nổi bật';
  }
};

const runGeminiVisionOCR = async (canvas: HTMLCanvasElement, documentType: 'cv' | 'jd'): Promise<string> => {
  if (!geminiVisionKeys.length) return '';

  // JPEG chất lượng cao: nhỏ hơn PNG, ít noise hơn, Gemini xử lý tốt hơn
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64 = dataUrl.split(',')[1];
  const maxAttempts = Math.max(1, geminiVisionKeys.length);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = getGeminiVisionModel();
    if (!model) return '';

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64, mimeType: 'image/jpeg' } },
              { text: buildVisionPrompt(documentType) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          topP: 0.05,
          topK: 1,
          maxOutputTokens: 8192, // Tăng để không bị cắt giữa chừng
          responseMimeType: 'text/plain',
        },
      });

      const text = typeof result.response?.text === 'function'
        ? result.response.text()
        : result.response?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('\n');
      if (text && text.trim().length > 20) {
        return text.trim();
      }
      return text?.trim() || '';
    } catch (error: any) {
      // Hết quota → chuyển key khác ngay
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('exhausted')) {
        console.warn(`[OCR] Gemini key [${activeVisionKeyIndex}] hết quota, chuyển sang key khác...`);
      } else {
        console.warn('[OCR] Gemini Vision OCR thất bại:', error);
      }
      rotateVisionKey();
    }
  }

  return '';
};

const runGoogleCloudVisionOCR = async (canvas: HTMLCanvasElement): Promise<string> => {
  if (!GOOGLE_CLOUD_VISION_API_KEY) return '';

  try {
    // Use JPEG for better compression/performance with Cloud Vision
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1];

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION', // Optimized for dense text (documents)
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
    return text;
  } catch (error) {
    console.warn('[OCR] Google Cloud Vision API failed:', error);
    return '';
  }
};

/**
 * Adaptive contrast enhancement for OCR (CLAHE-like).
 * Dùng cho Tesseract — KHÔNG dùng trước khi gửi Gemini.
 * Hiệu quả hơn binarization cứng vì giữ được dấu tiếng Việt.
 */
const enhanceImageForOCR = (context: CanvasRenderingContext2D, width: number, height: number): void => {
  try {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Bước 1: Chuyển sang grayscale
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Bước 2: Adaptive contrast theo block 64×64
    const blockSize = 64;
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    const minMap = new Float32Array(cols * rows).fill(255);
    const maxMap = new Float32Array(cols * rows).fill(0);

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const bi = Math.min(Math.floor(px / blockSize), cols - 1);
        const bj = Math.min(Math.floor(py / blockSize), rows - 1);
        const idx = bj * cols + bi;
        const val = gray[py * width + px];
        if (val < minMap[idx]) minMap[idx] = val;
        if (val > maxMap[idx]) maxMap[idx] = val;
      }
    }

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const bi = Math.min(Math.floor(px / blockSize), cols - 1);
        const bj = Math.min(Math.floor(py / blockSize), rows - 1);
        const idx = bj * cols + bi;
        const range = maxMap[idx] - minMap[idx];
        const pixIdx = py * width + px;
        let v = range > 8 ? ((gray[pixIdx] - minMap[idx]) / range) * 255 : gray[pixIdx];
        v = Math.min(255, Math.max(0, v));
        const di = pixIdx * 4;
        data[di] = data[di + 1] = data[di + 2] = v;
      }
    }

    context.putImageData(imageData, 0, 0);
  } catch (error) {
    console.warn('Image enhancement failed, using original image:', error);
  }
};

// Job title patterns for better extraction
const JOB_TITLE_PATTERNS = [
  /(?:vị trí|position|chức danh|job title|role)[:\s]*([^\n\r]{5,50})/i,
  /(?:tuyển dụng|hiring|tìm kiếm)[:\s]*([^\n\r]{5,50})/i,
  /(?:cần tuyển|we need|looking for)[:\s]*([^\n\r]{5,50})/i,
  /(?:mô tả công việc|job description)[:\s\n]*([^\n\r]{5,50})/i,
];

/**
 * Enhanced CV text processing for better data extraction
 */
const processCVText = async (text: string): Promise<ParsedCV> => {
  const normalizedText = normalizeText(text);
  const correctedText = correctOCRErrors(normalizedText);
  
  // Use smart section detection with CV-specific patterns
  const sections = detectCVSections(correctedText);
  
  return parseCVFields(correctedText);
};

/**
 * CV-specific section detection with improved patterns
 */
const detectCVSections = (text: string): Record<string, string> => {
  const sections: Record<string, string> = {};
  const lines = text.split('\n').map(line => line.trim());
  
  // Enhanced section headers for Vietnamese CVs
  const sectionPatterns = {
    personal: /^(thông tin cá nhân|personal info|liên hệ|contact|hồ sơ|profile)/i,
    education: /^(học vấn|education|bằng cấp|qualifications)/i,
    experience: /^(kinh nghiệm|experience|công việc|work|career)/i,
    skills: /^(kỹ năng|skills|chuyên môn|expertise|năng lực)/i,
    projects: /^(dự án|projects|portfolio)/i,
    certifications: /^(chứng chỉ|certificates|certifications)/i,
    languages: /^(ngoại ngữ|languages|ngôn ngữ)/i,
    objectives: /^(mục tiêu|objective|goals|career objective)/i
  };
  
  let currentSection = '';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    let foundSection = false;
    
    // Check if line matches any section pattern
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line)) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = sectionName;
        currentContent = [];
        foundSection = true;
        break;
      }
    }
    
    if (!foundSection && currentSection) {
      currentContent.push(line);
    } else if (!foundSection && !currentSection) {
      // First lines without section header - likely personal info
      if (!sections.personal) {
        sections.personal = '';
      }
      sections.personal += line + '\n';
    }
  }
  
  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
};

/**
 * Enhanced job position extraction with multiple techniques
 */
const extractJobPositionFromText = (text: string): string => {
  // Method 1: Pattern matching
  for (const pattern of JOB_TITLE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim().replace(/[^\w\sÀ-ỹĐđ-]/g, '');
      if (title.length >= 5 && title.length <= 50) {
        return title;
      }
    }
  }
  
  // Method 2: Look for common job title keywords
  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
  const jobKeywords = ['developer', 'engineer', 'manager', 'analyst', 'designer', 'specialist', 'coordinator', 'assistant', 'senior', 'junior', 'lead', 'kỹ sư', 'chuyên viên', 'quản lý', 'trưởng', 'phó'];
  
  for (const line of lines.slice(0, 10)) { // Check first 10 lines
    const lowerLine = line.toLowerCase();
    if (jobKeywords.some(keyword => lowerLine.includes(keyword)) && line.length >= 5 && line.length <= 60) {
      return line;
    }
  }
  
  return '';
};

// Validation and normalization utilities
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /(\+84|84|0)[3|5|7|8|9][0-9]{8}\b/;
const DATE_REGEX = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/;

const SYNONYM_MAP: Record<string, string[]> = {
  'Hà Nội': ['Ha Noi', 'Hanoi', 'HN'],
  'Hồ Chí Minh': ['Ho Chi Minh', 'HCM', 'Sài Gòn', 'Saigon'],
  'Cử nhân': ['BSc', 'Bachelor', 'Cử nhân Đại học'],
  'Thạc sĩ': ['MSc', 'Master', 'Thạc sĩ'],
  'Tiến sĩ': ['PhD', 'Doctor', 'Tiến sĩ'],
  'Kỹ sư': ['Engineer', 'Kỹ sư'],
  'Quản lý': ['Manager', 'Quản lý'],
};

export interface ParsedField {
  value: string;
  confidence: 'high' | 'medium' | 'low';
  validationErrors?: string[];
}

export interface ParsedCV {
  name?: ParsedField;
  email?: ParsedField;
  phone?: ParsedField;
  location?: ParsedField;
  experience?: ParsedField;
  education?: ParsedField;
  skills?: ParsedField;
  rawText: string;
}

export const parseCVFields = async (text: string): Promise<ParsedCV> => {
  const normalizedText = normalizeText(text);

  // Basic layout detection - look for common section headers
  const sections = detectSections(normalizedText);

  const result: ParsedCV = {
    rawText: normalizedText,
  };

  // Extract fields with validation
  result.name = extractField(sections, ['name', 'full name', 'họ tên', 'tên'], (value) => ({
    value: normalizeName(value),
    confidence: 'high' as const
  }));

  result.email = extractField(sections, ['email', 'e-mail', 'mail'], (value) => {
    const emails = value.match(EMAIL_REGEX);
    if (emails) {
      return {
        value: emails[0],
        confidence: 'high' as const
      };
    }
    return {
      value,
      confidence: 'low' as const,
      validationErrors: ['Invalid email format']
    };
  });

  result.phone = extractField(sections, ['phone', 'tel', 'mobile', 'điện thoại', 'sđt'], (value) => {
    const phones = value.match(PHONE_REGEX);
    if (phones) {
      return {
        value: phones[0],
        confidence: 'high' as const
      };
    }
    return {
      value,
      confidence: 'low' as const,
      validationErrors: ['Invalid phone format']
    };
  });

  result.location = extractField(sections, ['location', 'address', 'địa chỉ', 'địa điểm'], (value) => ({
    value: normalizeLocation(value),
    confidence: 'medium' as const
  }));

  result.experience = extractField(sections, ['experience', 'kinh nghiệm', 'làm việc'], (value) => ({
    value,
    confidence: 'medium' as const
  }));

  result.education = extractField(sections, ['education', 'học vấn', 'học vấn', 'bằng cấp'], (value) => ({
    value: normalizeEducation(value),
    confidence: 'medium' as const
  }));

  result.skills = extractField(sections, ['skills', 'kỹ năng', 'chuyên môn'], (value) => ({
    value,
    confidence: 'medium' as const
  }));

  return result;
};

const detectSections = (text: string): Record<string, string> => {
  const sections: Record<string, string> = {};
  const lines = text.split('\n');

  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    // Check if line looks like a section header
    if (lowerLine.match(/^(name|email|phone|location|experience|education|skills|kinh nghiệm|học vấn|kỹ năng|họ tên|điện thoại|địa chỉ)/i)) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }

      currentSection = lowerLine;
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }

  return sections;
};

const extractField = (
  sections: Record<string, string>,
  keywords: string[],
  processor: (value: string) => ParsedField
): ParsedField | undefined => {
  for (const keyword of keywords) {
    for (const [sectionName, content] of Object.entries(sections)) {
      if (sectionName.includes(keyword.toLowerCase())) {
        const trimmed = content.trim();
        if (trimmed) {
          return processor(trimmed);
        }
      }
    }
  }
  return undefined;
};

const normalizeName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

const normalizeLocation = (location: string): string => {
  let normalized = location.trim();

  // Apply synonym normalization
  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const synonym of synonyms) {
      const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
      if (regex.test(normalized)) {
        normalized = normalized.replace(regex, canonical);
        break;
      }
    }
  }

  return normalized;
};

const normalizeEducation = (education: string): string => {
  let normalized = education.trim();

  // Apply synonym normalization
  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const synonym of synonyms) {
      const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
      normalized = normalized.replace(regex, canonical);
    }
  }

  return normalized;
};

/**
 * Enhanced text normalization with OCR error correction
 */
const normalizeText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n') // Standardize line endings
    .replace(/\r/g, '\n')
    .replace(/[ \t]{2,}/g, ' ') // Collapse multiple spaces/tabs
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines to a paragraph break
    .trim();
};

/**
 * Advanced OCR text correction for job descriptions
 * Fixes common OCR errors that affect job title extraction
 */
const correctOCRErrors = (text: string): string => {
  // Common OCR mistakes and their corrections
  const ocrCorrections = [
    // Letter confusion
    [/([a-zA-Z])0([a-zA-Z])/g, '$1o$2'], // 0 -> o in middle of words
    [/([a-zA-Z])1([a-zA-Z])/g, '$1l$2'], // 1 -> l in middle of words
    [/([a-zA-Z])5([a-zA-Z])/g, '$1s$2'], // 5 -> s in middle of words
    [/([a-zA-Z])8([a-zA-Z])/g, '$1B$2'], // 8 -> B in middle of words
    
    // Common Vietnamese OCR errors
    [/(?<=[aeiouAEIOU])rn(?=[aeiouAEIOU])/g, 'm'], // rn -> m
    [/(?<=[aeiouAEIOU])ii(?=[aeiouAEIOU])/g, 'u'], // ii -> u
    [/cl(?=[aeiouAEIOU])/g, 'd'], // cl -> d
    [/([A-Z])l([A-Z])/g, '$1I$2'], // l -> I inside caps (e.g. SKlLLS -> SKILLS)
    [/([a-z])I([a-z])/g, '$1l$2'], // I -> l inside lowercase
    
    // Job title specific corrections
    [/[Mm]anag(?:e|3)r/g, 'Manager'],
    [/[Dd]ev(?:e|3)l(?:o|0)p(?:e|3)r/g, 'Developer'],
    [/[Ee]ngin(?:e|3)(?:e|3)r/g, 'Engineer'],
    [/[Ss](?:e|3)ni(?:o|0)r/g, 'Senior'],
    [/[Jj]uni(?:o|0)r/g, 'Junior'],
    [/[Ll](?:e|3)(?:a|4)d/g, 'Lead'],
    
    // Vietnamese job titles
    [/[Kk]ỹ\s*sư/g, 'Kỹ sư'],
    [/[Cc]huyên\s*viên/g, 'Chuyên viên'],
    [/[Qq]uản\s*lý/g, 'Quản lý'],
    [/[Tt]rưởng\s*phòng/g, 'Trưởng phòng'],
    
    // Space and punctuation cleanup
    [/\s*[-–—]\s*/g, ' - '], // Normalize dashes
    [/\s*[,;]\s*/g, ', '], // Normalize commas
    [/\s*[:]\s*/g, ': '], // Normalize colons
  ];
  
  let corrected = text;
  
  // Apply all corrections
  for (const [pattern, replacement] of ocrCorrections) {
    corrected = corrected.replace(pattern as RegExp, replacement as string);
  }
  
  // Remove extra whitespace
  corrected = corrected.replace(/\s+/g, ' ').trim();
  
  return corrected;
};

/**
 * Checks if PDF text content is sufficient or if OCR is needed
 */
const isTextContentSufficient = (text: string, minLength: number = MIN_PDF_TEXT_LENGTH): boolean => {
  // Check for meaningful text content (not just symbols or short fragments)
  const meaningfulText = text.replace(/[^\w\s]/g, '').trim();
  return meaningfulText.length >= minLength;
};

/**
 * Optimized OCR function with fine-tuned settings for both CVs and job descriptions
 */
const performOptimizedOCR = async (canvas: HTMLCanvasElement, documentType: 'cv' | 'jd' = 'cv'): Promise<string> => {
  try {
    // CHIẾN LƯỢC MỚI: Ưu tiên Google Cloud Vision API (Chính xác nhất) -> Gemini Vision -> Tesseract

    // 1. Google Cloud Vision API (Highest Accuracy)
    if (GOOGLE_CLOUD_VISION_API_KEY) {
      console.log('🚀 [OCR] Đang sử dụng Google Cloud Vision API (High Accuracy)...');
      const cloudVisionText = await runGoogleCloudVisionOCR(canvas);
      
      if (cloudVisionText && cloudVisionText.trim().length > 50) {
        console.log('✅ [OCR] Google Cloud Vision hoàn thành xuất sắc.');
        return cloudVisionText.trim();
      }
      console.warn('⚠️ [OCR] Google Cloud Vision trả về ít dữ liệu, chuyển sang Gemini Vision...');
    }

    // 2. Gemini Vision (High Accuracy - Generative)
    if (geminiVisionKeys.length > 0) {
      console.log('🚀 [OCR] Đang sử dụng Gemini Vision làm công cụ chính để tối ưu độ chính xác...');
      const visionText = await runGeminiVisionOCR(canvas, documentType);
      
      // Nếu Gemini trả về kết quả tốt (đủ dài), dùng luôn và bỏ qua Tesseract
      if (visionText && visionText.trim().length > 50) {
        console.log('✅ [OCR] Gemini Vision hoàn thành xuất sắc.');
        return visionText.trim();
      }
      console.warn('⚠️ [OCR] Gemini Vision trả về ít dữ liệu, kích hoạt Tesseract dự phòng...');
    } else {
      console.log('ℹ️ [OCR] Không tìm thấy Gemini Key, sử dụng Tesseract thuần.');
    }

    // Dynamic OCR settings based on document type
    const baseOptions = {
      lang: 'eng+vie',
      options: {
        tessedit_pageseg_mode: documentType === 'jd' ? '1' : '3', // Auto page segmentation
        tessedit_ocr_engine_mode: '2', // LSTM engine for accuracy
        preserve_interword_spaces: '1',
        tessedit_enable_doc_dict: '0',
        load_system_dawg: '0',
        load_freq_dawg: '0',
        load_unambig_dawg: '0',
        load_punc_dawg: '0',
        load_number_dawg: '0',
        load_bigram_dawg: '0',
        wordrec_enable_assoc: '0',
        // CV-specific optimizations
        ...(documentType === 'cv' && {
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ (),./\\-+&:;@%',
          tessedit_pageseg_mode: '6', // Uniform block for CV structure
        }),
      }
    };

    // Multiple OCR attempts with different configurations for better reliability
    const attempts = [
      baseOptions,
      // Fallback with simpler settings
      {
        lang: 'eng+vie',
        options: {
          tessedit_pageseg_mode: '3',
          tessedit_ocr_engine_mode: '2',
          preserve_interword_spaces: '1',
        }
      }
    ];

    let bestResult = '';
    let bestConfidence = 0;

    for (let i = 0; i < attempts.length; i++) {
      try {
        const result = await Tesseract.recognize(canvas, attempts[i].lang, {
          ...attempts[i].options,
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Attempt ${i + 1} Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        const confidence = result.data.confidence || 0;
        if (confidence > bestConfidence && result.data.text.length > bestResult.length * 0.8) {
          bestResult = result.data.text;
          bestConfidence = confidence;
        }

        // If we get high confidence, stop trying
        if (confidence > 85) break;
        
      } catch (attemptError) {
        console.warn(`OCR attempt ${i + 1} failed:`, attemptError);
        continue;
      }
    }

    const trimmedResult = bestResult.trim();

    // Fallback logic: Nếu Tesseract thất bại VÀ chưa chạy Gemini trước đó (hoặc Gemini thất bại)
    // Lưu ý: Nếu đã chạy Gemini ở đầu hàm mà thất bại, đoạn này sẽ cho Gemini cơ hội thứ 2 (nếu muốn)
    // Nhưng logic hiện tại là Gemini First -> Tesseract Fallback.
    // Nếu Tesseract cũng fail (text ngắn hoặc confidence thấp), ta có thể thử lại Gemini lần nữa hoặc chấp nhận kết quả.
    
    // Tuy nhiên, vì ta đã chạy Gemini First rồi, nên nếu xuống đây nghĩa là Gemini đã fail hoặc không có key.
    // Nếu không có key thì không gọi lại được. Nếu có key mà fail thì gọi lại cũng ít hy vọng.
    // Nhưng để an toàn cho trường hợp "Gemini First" bị skip do lỗi mạng tạm thời, ta vẫn giữ logic này nhưng check kỹ hơn.

    if ((trimmedResult.length < 150 || bestConfidence < 80) && geminiVisionKeys.length > 0) {
       // Chỉ thử lại nếu kết quả Tesseract quá tệ
       console.log('⚠️ [OCR] Tesseract kết quả kém, thử lại Gemini Vision lần cuối...');
       const visionText = await runGeminiVisionOCR(canvas, documentType);
       if (visionText.length > trimmedResult.length) {
         return visionText;
       }
    }

    return trimmedResult;
  } catch (error) {
    console.warn('All OCR attempts failed, returning empty string:', error);
    return '';
  }
};

/**
 * Extracts text from a given file (PDF, DOCX, or Image).
 * Handles PDF text layers with an optimized OCR fallback for scanned documents.
 * @param file The file to process.
 * @param onProgress A callback to report progress messages.
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromFile = async (
  file: File,
  onProgress: (message: string) => void,
  options: { forceOcr?: boolean } = {}
): Promise<string> => {
  if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
    throw new Error(`File is too large. Maximum size is ${FILE_SIZE_LIMIT_MB}MB.`);
  }

  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Check cache first (skip cache if forceOcr is true)
  if (!options.forceOcr) {
    const cachedText = cvCache.get<string>(file, 'text-extraction');
    if (cachedText) {
      onProgress('Đang tải từ cache...');
      return cachedText;
    }
  }

  let rawText = '';

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      onProgress('Đang đọc file PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let textLayerContent = '';
      // Read first few pages for text content check
      const pagesToCheck = Math.min(3, pdf.numPages);
      for (let i = 1; i <= pagesToCheck; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        textLayerContent += textContent.items.map(item => (item as any).str).join(' ') + '\n';
      }

      // If text layer has sufficient content AND forceOcr is false, use it; otherwise OCR
      if (!options.forceOcr && isTextContentSufficient(textLayerContent)) {
        // Read all pages for text content
        for (let i = 1; i <= pdf.numPages; i++) {
          if (i > pagesToCheck) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            textLayerContent += textContent.items.map(item => (item as any).str).join(' ') + '\n';
          }
        }
        rawText = textLayerContent;
        onProgress('Đã trích xuất text từ PDF thành công');
      } else {
        if (options.forceOcr) {
          onProgress('Đang dùng Cloud Vision (Force OCR) để đọc kỹ dữ liệu...');
        } else {
          onProgress('PDF là ảnh scan, đang dùng OCR tối ưu...');
        }
        
        let ocrText = '';
        const numPagesToOcr = Math.min(MAX_OCR_PAGES, pdf.numPages);

        // Process pages sequentially with enhanced preprocessing for better job title recognition
        for (let i = 1; i <= numPagesToOcr; i++) {
          onProgress(`Đang OCR trang ${i}/${numPagesToOcr} với AI tối ưu...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: CANVAS_SCALE });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { willReadFrequently: true });

          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            
            // Preprocess image for better OCR accuracy
            enhanceImageForOCR(context, canvas.width, canvas.height);
            
            const pageText = await performOptimizedOCR(canvas, 'jd');
            ocrText += pageText + '\n\n';
          }
        }
        rawText = ocrText;
        onProgress('Đã hoàn thành OCR');
      }

    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      onProgress('Đang đọc file DOCX...');
      const arrayBuffer = await file.arrayBuffer();
      const result = await (mammoth as any).extractRawText({ arrayBuffer });
      rawText = result.value;
      onProgress('Đã đọc file DOCX thành công');

    } else if (fileType.startsWith('image/')) {
      onProgress('Đang OCR ảnh với AI tối ưu cho JD...');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Optimize image size for better OCR performance on job descriptions
          // Tối đa 3200×4400 — đủ sắc nét cho chữ nhỏ
          const MAX_W = 3200;
          const MAX_H = 4400;
          let { width, height } = img;

          let scale = Math.min(MAX_W / width, MAX_H / height);
          // Upscale nếu ảnh gốc nhỏ hơn 1200px ở cạnh ngắn nhất
          const shortSide = Math.min(width, height) * scale;
          if (shortSide < 1200) scale = Math.min(scale * (1200 / shortSide), 3.0);
          scale = Math.min(scale, 3.0); // Không upscale quá 3x

          const newWidth = Math.floor(width * scale);
          const newHeight = Math.floor(height * scale);

          canvas.width = newWidth;
          canvas.height = newHeight;

          if (ctx) {
            // Nền trắng — tránh alpha channel gây nhiễu cho OCR
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, newWidth, newHeight);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            // KHÔNG enhance trước Gemini — AI nhận ảnh gốc sẽ tốt hơn
          }

          resolve(void 0);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Tự phát hiện loại tài liệu từ tên file
      const docType: 'cv' | 'jd' = (fileName.includes('jd') || fileName.includes('job') || fileName.includes('position')) ? 'jd' : 'cv';
      rawText = await performOptimizedOCR(canvas, docType);

      onProgress('Đã OCR ảnh thành công');

    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      rawText = await file.text();
      onProgress('Đã đọc file text');
    } else {
      throw new Error(`Định dạng file không được hỗ trợ: ${file.name}`);
    }

    // Apply OCR error correction for better job title extraction
    const correctedText = correctOCRErrors(rawText);
    const normalizedText = normalizeText(correctedText);

    // Cache the result
    cvCache.set(file, normalizedText, 'text-extraction');

    return normalizedText;

  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Lỗi xử lý file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Legacy exports for backward compatibility
export const extractTextFromJdFile = extractTextFromFile;
export const processFileToText = extractTextFromFile;