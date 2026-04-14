import type { HardFilters } from '../../../../assets/types';
import { generateContentWithFallback, convertLanguageLevelToCEFR } from './gemini-core';
import { MODEL_NAME } from '../../../../assets/constants';

const hardFiltersSchema = {
  type: "OBJECT" as const,
  properties: {
    "location": { type: "STRING" as const },
    "minExp": { type: "STRING" as const },
    "seniority": { type: "STRING" as const },
    "education": { type: "STRING" as const },
    "language": { type: "STRING" as const },
    "languageLevel": { type: "STRING" as const },
    "certificates": { type: "STRING" as const },
    "workFormat": { type: "STRING" as const },
    "contractType": { type: "STRING" as const },
    "industry": { type: "STRING" as const },
  },
  required: []
};

export const extractHardFiltersFromJD = async (jdText: string): Promise<Partial<HardFilters>> => {
  if (!jdText || jdText.trim().length < 50) return {};

  const prompt = `Bạn là chuyên gia phân tích JD thông minh. Trích xuất và CHUYỂN ĐỔI thông tin tiêu chí lọc từ văn bản JD.
  1. Địa điểm: Chỉ từ "Hà Nội", "Hải Phòng", "Đà Nẵng", "Thành phố Hồ Chí Minh", "Remote"
  2. Kinh nghiệm: "1", "2", "3", "5" (số năm)
  3. Cấp bậc: "Intern", "Junior", "Mid-level", "Senior", "Lead"
  4. Học vấn: "High School", "Associate", "Bachelor", "Master", "PhD"
  5. Ngôn ngữ: ngôn ngữ cụ thể (Tiếng Anh, Tiếng Nhật, v.v.)
  6. Trình độ ngôn ngữ: "B1", "B2", "C1", "C2"
  7. Chứng chỉ: tên chứng chỉ cụ thể
  8. Hình thức: "Onsite", "Hybrid", "Remote"
  9. Loại hợp đồng: "Full-time", "Part-time", "Intern", "Contract"
  10. Ngành: ngành nghề chính
  JD: ${jdText.slice(0, 3000)}`;

  try {
    const response = await generateContentWithFallback(MODEL_NAME, prompt, {
      temperature: 0.1, topP: 0.3, topK: 5,
      generationConfig: { responseMimeType: 'application/json', responseSchema: hardFiltersSchema },
    });
    let result = response.text.trim().replace(/```json\s*|\s*```/g, '');
    const hardFilters = JSON.parse(result);
    const validated: any = {};

    const validLocations = ['Hà Nội', 'Hải Phòng', 'Đà Nẵng', 'Thành phố Hồ Chí Minh', 'Remote'];
    const locationMap: Record<string, string> = { 'HN': 'Hà Nội', 'Hanoi': 'Hà Nội', 'HCM': 'Thành phố Hồ Chí Minh', 'TP.HCM': 'Thành phố Hồ Chí Minh', 'Da Nang': 'Đà Nẵng', 'WFH': 'Remote' };
    if (hardFilters.location) {
      const loc = hardFilters.location.trim();
      if (validLocations.includes(loc)) validated.location = loc;
      else if (locationMap[loc]) validated.location = locationMap[loc];
    }

    const validExp = ['1', '2', '3', '5'];
    if (hardFilters.minExp) {
      const exp = hardFilters.minExp.toString().trim();
      if (validExp.includes(exp)) validated.minExp = exp;
      else {
        const match = exp.match(/(\d+)/);
        if (match) {
          const num = match[1];
          if (num === '0' || num === '1') validated.minExp = '1';
          else if (num === '2') validated.minExp = '2';
          else if (num === '3' || num === '4') validated.minExp = '3';
          else if (parseInt(num) >= 5) validated.minExp = '5';
        }
      }
    }

    const validSeniority = ['Intern', 'Junior', 'Mid-level', 'Senior', 'Lead'];
    const seniorityMap: Record<string, string> = { 'Fresher': 'Junior', 'Entry': 'Junior', 'Middle': 'Mid-level', 'Mid': 'Mid-level', 'Staff': 'Senior', 'Manager': 'Lead', 'Tech Lead': 'Lead', 'Team Lead': 'Lead' };
    if (hardFilters.seniority) {
      const sen = hardFilters.seniority.trim();
      if (validSeniority.includes(sen)) validated.seniority = sen;
      else if (seniorityMap[sen]) validated.seniority = seniorityMap[sen];
    }

    const validEducation = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD'];
    const educationMap: Record<string, string> = { 'THPT': 'High School', 'Cao đẳng': 'Associate', 'Đại học': 'Bachelor', 'Kỹ sư': 'Bachelor', 'Thạc sĩ': 'Master', 'Tiến sĩ': 'PhD' };
    if (hardFilters.education) {
      const edu = hardFilters.education.trim();
      if (validEducation.includes(edu)) validated.education = edu;
      else if (educationMap[edu]) validated.education = educationMap[edu];
    }

    const langMap: Record<string, string> = { 'English': 'Tiếng Anh', 'Vietnamese': 'Tiếng Việt', 'Japanese': 'Tiếng Nhật', 'Korean': 'Tiếng Hàn', 'Chinese': 'Tiếng Trung' };
    if (hardFilters.language && typeof hardFilters.language === 'string' && hardFilters.language.trim()) {
      validated.language = langMap[hardFilters.language.trim()] || hardFilters.language.trim();
    }

    const validLangLevels = ['B1', 'B2', 'C1', 'C2'];
    if (hardFilters.languageLevel) {
      const level = hardFilters.languageLevel.trim().toUpperCase();
      if (validLangLevels.includes(level)) validated.languageLevel = level;
    }
    if (!validated.languageLevel && hardFilters.certificates) {
      const cefrLevel = convertLanguageLevelToCEFR(hardFilters.certificates);
      if (cefrLevel) validated.languageLevel = cefrLevel;
    }
    if (!validated.languageLevel) {
      const cefrLevel = convertLanguageLevelToCEFR(jdText);
      if (cefrLevel) validated.languageLevel = cefrLevel;
    }

    if (hardFilters.certificates && typeof hardFilters.certificates === 'string' && hardFilters.certificates.trim()) {
      validated.certificates = hardFilters.certificates.trim();
    }

    const validWorkFormats = ['Onsite', 'Hybrid', 'Remote'];
    const workFormatMap: Record<string, string> = { 'Office': 'Onsite', 'WFH': 'Remote', 'Flexible': 'Hybrid', 'Linh hoạt': 'Hybrid' };
    if (hardFilters.workFormat) {
      const wf = hardFilters.workFormat.trim();
      if (validWorkFormats.includes(wf)) validated.workFormat = wf;
      else if (workFormatMap[wf]) validated.workFormat = workFormatMap[wf];
    }

    const validContractTypes = ['Full-time', 'Part-time', 'Intern', 'Contract'];
    const contractMap: Record<string, string> = { 'Toàn thời gian': 'Full-time', 'Bán thời gian': 'Part-time', 'Thực tập': 'Intern', 'Thời vụ': 'Contract' };
    if (hardFilters.contractType) {
      const ct = hardFilters.contractType.trim();
      if (validContractTypes.includes(ct)) validated.contractType = ct;
      else if (contractMap[ct]) validated.contractType = contractMap[ct];
    }

    if (hardFilters.industry && typeof hardFilters.industry === 'string' && hardFilters.industry.trim()) {
      validated.industry = hardFilters.industry.trim();
    }

    return validated;
  } catch (error) {
    console.error("Lỗi khi trích xuất hard filters:", error);
    return {};
  }
};
