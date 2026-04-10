/*
 * Extended Vietnamese academic institution dataset (subset).
 * Source: Wikipedia "Danh sách trường đại học, học viện và cao đẳng tại Việt Nam" (fetched 2025-10-25).
 * Each record has: canonical name, aliases (common short forms), tier and a qualityWeight heuristic (0.3 - 1.0).
 * NOTE: This is a curated subset focusing on major recognition. More can be appended safely.
 */

export type InstitutionTier = 'national' | 'regional' | 'sectoral' | 'flagship' | 'private' | 'foreign' | 'college' | 'vocational';

export interface UniversityRecord {
  name: string;          // Canonical Vietnamese name
  aliases?: string[];    // Common abbreviations / English variants
  tier: InstitutionTier; // Category for heuristic boosting
  qualityWeight: number; // 0.3 (low) .. 1.0 (top)
}

// --- Flagship & National Systems ---
export const NATIONAL_FLAGSHIP: UniversityRecord[] = [
  { name: 'Đại học Quốc gia Hà Nội', aliases: ['VNU', 'VNU Hanoi'], tier: 'national', qualityWeight: 1.0 },
  { name: 'Đại học Quốc gia Thành phố Hồ Chí Minh', aliases: ['VNU HCM'], tier: 'national', qualityWeight: 0.98 },
  { name: 'Đại học Bách khoa Hà Nội', aliases: ['HUST', 'Bách khoa Hà Nội'], tier: 'flagship', qualityWeight: 0.97 },
  { name: 'Đại học Kinh tế Quốc dân', aliases: ['NEU'], tier: 'flagship', qualityWeight: 0.94 },
  { name: 'Đại học Ngoại thương', aliases: ['FTU', 'Foreign Trade University'], tier: 'flagship', qualityWeight: 0.93 },
  { name: 'Học viện Công nghệ Bưu chính Viễn thông', aliases: ['PTIT'], tier: 'sectoral', qualityWeight: 0.90 },
  { name: 'Học viện Tài chính', aliases: ['AOF'], tier: 'sectoral', qualityWeight: 0.89 },
  { name: 'Đại học Cần Thơ', aliases: ['Can Tho University'], tier: 'regional', qualityWeight: 0.88 },
  { name: 'Đại học Huế', aliases: ['Hue University'], tier: 'regional', qualityWeight: 0.86 },
  { name: 'Đại học Đà Nẵng', aliases: ['Da Nang University'], tier: 'regional', qualityWeight: 0.86 },
  { name: 'Đại học Thái Nguyên', aliases: ['Thai Nguyen University'], tier: 'regional', qualityWeight: 0.84 }
];

// --- Sectoral / Specialized (public) ---
export const SECTORAL_PUBLIC: UniversityRecord[] = [
  { name: 'Đại học Y Hà Nội', aliases: ['Trường Đại học Y Hà Nội', 'HMU'], tier: 'sectoral', qualityWeight: 0.95 },
  { name: 'Đại học Dược Hà Nội', aliases: ['HUP'], tier: 'sectoral', qualityWeight: 0.90 },
  { name: 'Đại học Y Dược Thành phố Hồ Chí Minh', aliases: ['UMP', 'Đại học Y Dược TP.HCM'], tier: 'sectoral', qualityWeight: 0.94 },
  { name: 'Học viện Ngoại giao', aliases: ['DAV'], tier: 'sectoral', qualityWeight: 0.90 },
  { name: 'Học viện Ngân hàng', aliases: ['BAV'], tier: 'sectoral', qualityWeight: 0.88 },
  { name: 'Học viện Kỹ thuật Quân sự', aliases: ['MTA'], tier: 'sectoral', qualityWeight: 0.92 },
  { name: 'Đại học Luật Hà Nội', aliases: ['HLU'], tier: 'sectoral', qualityWeight: 0.85 },
  { name: 'Đại học Giao thông Vận tải', aliases: ['UTC'], tier: 'sectoral', qualityWeight: 0.85 },
  { name: 'Đại học Nông Lâm Thành phố Hồ Chí Minh', aliases: ['NLU'], tier: 'sectoral', qualityWeight: 0.83 },
  { name: 'Đại học Sư phạm Hà Nội', aliases: ['HNUE'], tier: 'sectoral', qualityWeight: 0.86 },
  { name: 'Đại học Bách khoa Thành phố Hồ Chí Minh', aliases: ['HCMUT'], tier: 'flagship', qualityWeight: 0.96 },
  { name: 'Đại học Khoa học Tự nhiên Hà Nội', aliases: ['HUS'], tier: 'sectoral', qualityWeight: 0.90 },
  { name: 'Đại học Khoa học Tự nhiên TP.HCM', aliases: ['HCMUS'], tier: 'sectoral', qualityWeight: 0.90 },
  { name: 'Đại học Công nghệ Thông tin', aliases: ['UIT'], tier: 'sectoral', qualityWeight: 0.89 },
  // Thêm các trường Kinh tế cụ thể
  { name: 'Đại học Kinh tế Thành phố Hồ Chí Minh', aliases: ['UEH', 'Đại học Kinh tế TP.HCM'], tier: 'flagship', qualityWeight: 0.93 },
  { name: 'Đại học Kinh tế Đà Nẵng', aliases: ['DUE'], tier: 'regional', qualityWeight: 0.82 },
  { name: 'Đại học Kinh tế - Luật (ĐHQG TP.HCM)', aliases: ['UEL'], tier: 'sectoral', qualityWeight: 0.88 },
  { name: 'Đại học Kinh tế - Tài chính TP.HCM', aliases: ['UEF'], tier: 'sectoral', qualityWeight: 0.80 },
  // Thêm các trường Sư phạm cụ thể
  { name: 'Đại học Sư phạm Thành phố Hồ Chí Minh', aliases: ['HCMUE'], tier: 'sectoral', qualityWeight: 0.86 },
  { name: 'Đại học Sư phạm Kỹ thuật Thành phố Hồ Chí Minh', aliases: ['HCMUTE'], tier: 'sectoral', qualityWeight: 0.84 },
  { name: 'Đại học Sư phạm Đà Nẵng', aliases: [], tier: 'regional', qualityWeight: 0.80 },
  // Thêm các trường Công nghệ cụ thể
  { name: 'Đại học Công nghệ - ĐHQG Hà Nội', aliases: ['UET', 'Đại học Công nghệ Hà Nội'], tier: 'flagship', qualityWeight: 0.92 },
  { name: 'Đại học Công nghệ Sài Gòn', aliases: ['STU'], tier: 'private', qualityWeight: 0.78 },
  // Thêm các trường Khoa học Xã hội & Nhân văn
  { name: 'Đại học Khoa học Xã hội và Nhân văn Hà Nội', aliases: ['USSH', 'ĐHKHXH&NV HN'], tier: 'sectoral', qualityWeight: 0.88 },
  { name: 'Đại học Khoa học Xã hội và Nhân văn TP.HCM', aliases: ['HCMUSSH'], tier: 'sectoral', qualityWeight: 0.88 }
];

// --- Private Universities ---
export const PRIVATE_UNIS: UniversityRecord[] = [
  { name: 'Đại học FPT', aliases: ['FPT University'], tier: 'private', qualityWeight: 0.82 },
  { name: 'Đại học Duy Tân', aliases: ['DTU'], tier: 'private', qualityWeight: 0.80 },
  { name: 'Đại học Hoa Sen', aliases: ['HSU'], tier: 'private', qualityWeight: 0.78 },
  { name: 'Đại học Văn Lang', aliases: ['VLU'], tier: 'private', qualityWeight: 0.78 },
  { name: 'Đại học Quốc tế Sài Gòn', aliases: ['SIU'], tier: 'private', qualityWeight: 0.76 },
  { name: 'Đại học Nguyễn Tất Thành', aliases: ['NTTU'], tier: 'private', qualityWeight: 0.75 },
  { name: 'Đại học Thành Đô', aliases: ['TDU'], tier: 'private', qualityWeight: 0.70 },
  { name: 'Đại học Thăng Long', aliases: ['TLU'], tier: 'private', qualityWeight: 0.74 },
  { name: 'Đại học Đại Nam', aliases: ['DNU'], tier: 'private', qualityWeight: 0.71 },
  { name: 'Đại học Văn Hiến', aliases: ['VHU'], tier: 'private', qualityWeight: 0.70 },
  { name: 'Đại học Phenikaa', aliases: [], tier: 'private', qualityWeight: 0.80 }
];

// --- Foreign / International ---
export const FOREIGN_UNIS: UniversityRecord[] = [
  { name: 'Đại học Fulbright Việt Nam', aliases: ['Fulbright University Vietnam'], tier: 'foreign', qualityWeight: 0.93 },
  { name: 'Đại học Quốc tế RMIT Việt Nam', aliases: ['RMIT Việt Nam', 'RMIT University Vietnam'], tier: 'foreign', qualityWeight: 0.92 },
  { name: 'Đại học VinUni', aliases: ['VinUni'], tier: 'foreign', qualityWeight: 0.94 },
  { name: 'Đại học Việt Đức', aliases: ['VGU'], tier: 'foreign', qualityWeight: 0.90 },
  { name: 'Đại học Việt Nhật', aliases: ['VJU'], tier: 'foreign', qualityWeight: 0.88 },
  { name: 'Swinburne Việt Nam', aliases: ['Swinburne University Vietnam'], tier: 'foreign', qualityWeight: 0.85 },
  { name: 'Greenwich Việt Nam', aliases: ['Greenwich University Vietnam'], tier: 'foreign', qualityWeight: 0.84 }
];

// --- Colleges / Vocational (lower boost) ---
export const VOCATIONAL_COLLEGES: UniversityRecord[] = [
  { name: 'Trường Cao đẳng Sư phạm Trung ương', aliases: [], tier: 'college', qualityWeight: 0.55 },
  { name: 'Trường Cao đẳng Sư phạm Hà Nội', aliases: [], tier: 'college', qualityWeight: 0.55 },
  { name: 'Trường Cao đẳng Y tế Hà Nội', aliases: [], tier: 'college', qualityWeight: 0.50 },
  { name: 'Trường Cao đẳng Kỹ thuật Cao Thắng', aliases: [], tier: 'vocational', qualityWeight: 0.52 },
  { name: 'Trường Cao đẳng Công nghệ Thông tin TP.HCM', aliases: [], tier: 'vocational', qualityWeight: 0.50 },
  { name: 'Trường Cao đẳng Du lịch Hà Nội', aliases: [], tier: 'vocational', qualityWeight: 0.48 }
];

export const EXTENDED_INSTITUTIONS: UniversityRecord[] = [
  ...NATIONAL_FLAGSHIP,
  ...SECTORAL_PUBLIC,
  ...PRIVATE_UNIS,
  ...FOREIGN_UNIS,
  ...VOCATIONAL_COLLEGES
];

// Fast index map for name/alias (accent-insensitive)
function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // keep spaces
    .replace(/\s+/g, ' ')          // collapse
    .trim();
}

const INDEX: Record<string, UniversityRecord> = {};
for (const inst of EXTENDED_INSTITUTIONS) {
  INDEX[normalize(inst.name)] = inst;
  (inst.aliases || []).forEach(a => { INDEX[normalize(a)] = inst; });
}

export interface InstitutionMatchResult {
  raw: string;
  matched: UniversityRecord | null;
  normalized: string;
  needsVerification?: boolean;  // Flag cho các trường hợp cần HR xác thực
  reason?: string;  // Lý do cần xác thực
}

// Danh sách các địa danh để nhận diện trường cụ thể
const LOCATION_INDICATORS = [
  'ha noi',
  'thanh pho ho chi minh',
  'tp hcm',
  'tphcm',
  'ho chi minh',
  'da nang',
  'can tho',
  'hue',
  'hai phong',
  'quoc dan',       // Kinh tế Quốc dân
  'quoc gia',       // ĐHQG
  'bach khoa',      // Bách khoa (luôn có địa danh)
  'ngoai thuong',   // Ngoại thương (chỉ có 1)
  'fpt',
  'rmit',
  'vinuni',
  'fulbright',
  'ptit',
];

// Danh sách các từ/cụm từ giả mạo hoặc không hợp lệ
const SUSPICIOUS_PATTERNS = [
  /top cv/i,              // Đại học TOP CV - không tồn tại
  /topcv/i,
  /dai hoc top/i,
  /truong top/i,
  /university top/i,
  /top university/i,
  /dai hoc hang dau/i,
  /dai hoc uy tin/i,
  /dai hoc noi tieng/i,
  /dai hoc chat luong cao/i,
  /dai hoc xin$/i,        // "Đại học xin" - tên không hợp lệ
  /truong xin$/i,
];

// Danh sách tên trường CHUNG CHUNG cần xác thực (không có địa danh cụ thể)
const AMBIGUOUS_PATTERNS = [
  { pattern: /^dai hoc kinh te$/i, name: 'Đại học Kinh tế' },
  { pattern: /^dai hoc su pham$/i, name: 'Đại học Sư phạm' },
  { pattern: /^dai hoc cong nghe$/i, name: 'Đại học Công nghệ' },
  { pattern: /^dai hoc khoa hoc$/i, name: 'Đại học Khoa học' },
  { pattern: /^dai hoc khoa hoc tu nhien$/i, name: 'Đại học Khoa học Tự nhiên' },
  { pattern: /^dai hoc y$/i, name: 'Đại học Y' },
  { pattern: /^dai hoc duoc$/i, name: 'Đại học Dược' },
  { pattern: /^dai hoc luat$/i, name: 'Đại học Luật' },
  { pattern: /^dai hoc nong nghiep$/i, name: 'Đại học Nông nghiệp' },
  { pattern: /^dai hoc nong lam$/i, name: 'Đại học Nông Lâm' },
  { pattern: /^dai hoc xay dung$/i, name: 'Đại học Xây dựng' },
  { pattern: /^dai hoc my thuat$/i, name: 'Đại học Mỹ thuật' },
  { pattern: /^dai hoc am nhac$/i, name: 'Đại học Âm nhạc' },
  { pattern: /^dai hoc giao thong van tai$/i, name: 'Đại học Giao thông Vận tải' },
];

export function matchInstitutionLine(line: string): InstitutionMatchResult | null {
  const norm = normalize(line);
  if (!norm) return null;
  
  // Kiểm tra các pattern đáng ngờ/giả mạo TRƯỚC KHI match
  const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(norm) || pattern.test(line));
  if (isSuspicious) {
    console.warn(`🚨 [CẢNH BÁO: Tên trường không hợp lệ] "${line}" - Không phải tên trường chính thức`);
    return {
      raw: line,
      matched: null,
      normalized: norm,
      needsVerification: true,
      reason: `⚠️ "${line}" KHÔNG PHẢI tên trường đại học chính thức tại Việt Nam. HR BẮT BUỘC phải xác thực lại với tên đầy đủ và chính xác.`
    };
  }
  
  // Kiểm tra xem có địa danh cụ thể không
  const hasLocation = LOCATION_INDICATORS.some(loc => norm.includes(loc));
  
  // Kiểm tra xem có phải tên chung chung không (không có địa danh)
  let isAmbiguous = false;
  let ambiguousName = '';
  
  if (!hasLocation) {
    for (const { pattern, name } of AMBIGUOUS_PATTERNS) {
      if (pattern.test(norm)) {
        isAmbiguous = true;
        ambiguousName = name;
        break;
      }
    }
  }
  
  // Quick containment heuristic: look for keywords
  const candidates = Object.keys(INDEX).filter(k => norm.includes(k));
  if (candidates.length) {
    // Choose longest key (most specific) for match
    const bestKey = candidates.sort((a,b) => b.length - a.length)[0];
    
    const result: InstitutionMatchResult = { 
      raw: line, 
      matched: INDEX[bestKey], 
      normalized: norm 
    };
    
    // Đánh dấu cần xác thực nếu là tên chung chung
    if (isAmbiguous) {
      result.needsVerification = true;
      result.reason = `"${ambiguousName}" chưa đủ cụ thể. Có nhiều trường cùng tên ở các thành phố khác nhau. HR cần xác nhận trường nào.`;
    }
    
    return result;
  }
  
  // Fallback: direct exact match tokens
  if (INDEX[norm]) {
    const result: InstitutionMatchResult = { 
      raw: line, 
      matched: INDEX[norm], 
      normalized: norm 
    };
    
    if (isAmbiguous) {
      result.needsVerification = true;
      result.reason = `"${ambiguousName}" chưa rõ thành phố. HR cần xác nhận.`;
    }
    
    return result;
  }
  
  // Không tìm thấy match nhưng vẫn kiểm tra ambiguous
  if (isAmbiguous) {
    return {
      raw: line,
      matched: null,
      normalized: norm,
      needsVerification: true,
      reason: `"${ambiguousName}" không có trong database và chưa đủ cụ thể. HR cần xác nhận trường đầy đủ.`
    };
  }
  
  return { raw: line, matched: null, normalized: norm };
}

export function extractInstitutionMatches(educationLines: string[]): InstitutionMatchResult[] {
  const results: InstitutionMatchResult[] = [];
  educationLines.forEach(l => {
    const m = matchInstitutionLine(l);
    if (m) {
      // Luôn thêm vào results, kể cả khi needsVerification = true
      results.push(m);
      
      // Log cảnh báo nếu cần xác thực
      if (m.needsVerification) {
        console.warn(`⚠️ [Institution Verification] ${m.raw} - ${m.reason}`);
      }
    }
  });
  
  // Deduplicate by canonical name
  const seen = new Set<string>();
  return results.filter(r => {
    if (!r.matched) return false;
    const key = r.matched.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function computeInstitutionBoost(matches: InstitutionMatchResult[]): number {
  if (!matches.length) return 0;
  // Weighted average quality
  const total = matches.reduce((sum, m) => sum + (m.matched?.qualityWeight || 0), 0);
  return total / matches.length; // 0..1
}

export function evaluateInstitutionsFromEducation(educationArr: any[]): { 
  matches: InstitutionMatchResult[]; 
  boost: number;
  verificationNeeded: boolean;
  verificationReasons: string[];
} {
  const lines: string[] = [];
  for (const e of educationArr) {
    ['school','degree','major'].forEach(f => { if (e && e[f]) lines.push(String(e[f])); });
  }
  const matches = extractInstitutionMatches(lines);
  const boost = computeInstitutionBoost(matches);
  
  // Kiểm tra xem có trường nào cần verification không
  const needsVerification = matches.some(m => m.needsVerification);
  const verificationReasons = matches
    .filter(m => m.needsVerification && m.reason)
    .map(m => `${m.raw}: ${m.reason}`);
  
  return { 
    matches, 
    boost,
    verificationNeeded: needsVerification,
    verificationReasons
  };
}

export function extendInstitutionIndex(extra: UniversityRecord[]) {
  extra.forEach(inst => {
    const normName = normalize(inst.name);
    INDEX[normName] = inst;
    (inst.aliases || []).forEach(a => { INDEX[normalize(a)] = inst; });
  });
}
