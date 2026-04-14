import { GoogleGenAI, Type } from '@google/genai';
import type { AnalysisRunData, Candidate } from '../../../../assets/types';
import { MODEL_NAME } from '../../../../assets/constants';

// Sử dụng lại AI client từ geminiService
let ai: GoogleGenAI | null = null;
let currentKeyIndex = 0;
const apiKeys = [
  (import.meta as any).env?.VITE_GEMINI_API_KEY_1,
  (import.meta as any).env?.VITE_GEMINI_API_KEY_2,
  (import.meta as any).env?.VITE_GEMINI_API_KEY_3,
  (import.meta as any).env?.VITE_GEMINI_API_KEY_4,
].filter(Boolean);

function getAi(): GoogleGenAI {
  if (!ai) {
    if (apiKeys.length === 0) {
      throw new Error("No GEMINI_API_KEY environment variables set.");
    }
    const key = apiKeys[currentKeyIndex];
    if (!key) {
      throw new Error("API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

function switchToNextKey() {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  ai = null;
}

async function generateContentWithFallback(model: string, contents: any, config: any): Promise<any> {
  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    try {
      const aiInstance = getAi();
      const response = await aiInstance.models.generateContent({
        model,
        contents,
        config,
      });
      return response;
    } catch (error) {
      console.warn(`API key ${currentKeyIndex + 1} failed:`, error);
      switchToNextKey();
    }
  }
  throw new Error("All API keys failed. Please check your API keys and quota.");
}

// Schema cho câu trả lời từ AI
const questionSetSchema = {
  type: Type.OBJECT,
  properties: {
    "questionSets": {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          "category": { type: Type.STRING, description: "Tên danh mục câu hỏi" },
          "icon": { type: Type.STRING, description: "Font Awesome icon class" },
          "color": { type: Type.STRING, description: "Tailwind color class" },
          "questions": {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Danh sách câu hỏi trong danh mục"
          }
        },
        required: ["category", "icon", "color", "questions"]
      }
    }
  },
  required: ["questionSets"]
};

interface AnalysisStats {
  jobPosition: string;
  totalCandidates: number;
  industries: string[];
  levels: string[];
  topCandidates: Candidate[];
  commonWeaknesses: string[];
  skillGaps: string[];
}

interface QuestionSet {
  category: string;
  icon: string;
  color: string;
  questions: string[];
}

export const generateInterviewQuestions = async (
  analysisData: AnalysisRunData,
  analysisStats: AnalysisStats,
  questionType: 'general' | 'specific' | 'comparative',
  candidateData?: Candidate | Candidate[] | null
): Promise<QuestionSet[]> => {
  
  let prompt = '';
  
  if (questionType === 'general') {
    prompt = createGeneralQuestionsPrompt(analysisData, analysisStats);
  } else if (questionType === 'specific' && candidateData && !Array.isArray(candidateData)) {
    prompt = createSpecificQuestionsPrompt(analysisData, analysisStats, candidateData);
  } else if (questionType === 'comparative' && Array.isArray(candidateData)) {
    prompt = createComparativeQuestionsPrompt(analysisData, analysisStats, candidateData);
  } else {
    throw new Error('Invalid question type or candidate data');
  }

  try {
    const response = await generateContentWithFallback(MODEL_NAME, prompt, {
      responseMimeType: "application/json",
      responseSchema: questionSetSchema,
      temperature: 0.3, // Một chút creativity cho câu hỏi đa dạng
      topP: 0.8,
      topK: 40,
    });

    const result = JSON.parse(response.text);
    return result.questionSets || [];
    
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw error;
  }
};

const createGeneralQuestionsPrompt = (analysisData: AnalysisRunData, stats: AnalysisStats): string => {
  return `
Bạn là chuyên gia tuyển dụng với 15+ năm kinh nghiệm. Nhiệm vụ: Tạo câu hỏi phỏng vấn thông minh dựa trên dữ liệu thực tế.

**THÔNG TIN TUYỂN DỤNG:**
- Vị trí: ${stats.jobPosition}
- Địa điểm: ${analysisData.job.locationRequirement}
- Tổng ứng viên đã lọc: ${stats.totalCandidates}
- Ngành nghề chính: ${stats.industries.join(', ')}
- Cấp độ phổ biến: ${stats.levels.join(', ')}

**ĐIỂM YẾU PHỔ BIẾN CỦA ỨNG VIÊN:**
${stats.commonWeaknesses.length > 0 ? stats.commonWeaknesses.map((w, i) => `${i+1}. ${w}`).join('\n') : 'Không có dữ liệu đặc biệt'}

**KỸ NĂNG THIẾU PHỔ BIẾN:**
${stats.skillGaps.length > 0 ? stats.skillGaps.map((s, i) => `${i+1}. ${s}`).join('\n') : 'Không có dữ liệu đặc biệt'}

**YÊU CẦU:**
1. Tạo 4-5 nhóm câu hỏi khác nhau
2. Mỗi nhóm 4-6 câu hỏi cụ thể, thực tế
3. Câu hỏi PHẢI dựa trên dữ liệu thực tế về điểm yếu và kỹ năng thiếu
4. Tránh câu hỏi chung chung, tập trung vào những vấn đề cụ thể từ việc lọc CV
5. Bao gồm cả câu hỏi kỹ thuật và soft skills
6. Câu hỏi phải phù hợp với vị trí ${stats.jobPosition}

**NHÓM GỢI Ý:**
- Câu hỏi chuyên môn theo vị trí và ngành nghề
- Câu hỏi về những điểm yếu phổ biến đã phát hiện
- Câu hỏi đánh giá kỹ năng thiếu
- Câu hỏi tình huống thực tế
- Câu hỏi về cultural fit và growth mindset

Trả về JSON với format yêu cầu. Icon sử dụng Font Awesome classes, color sử dụng Tailwind classes.
`;
};

const createSpecificQuestionsPrompt = (analysisData: AnalysisRunData, stats: AnalysisStats, candidate: Candidate): string => {
  const candidateStrengths = candidate.analysis?.['Điểm mạnh CV'] || [];
  const candidateWeaknesses = candidate.analysis?.['Điểm yếu CV'] || [];
  const candidateDetails = candidate.analysis?.['Chi tiết'] || [];
  
  // Phân tích điểm số chi tiết để tìm điểm mạnh/yếu
  const strengthAreas: string[] = [];
  const weaknessAreas: string[] = [];
  
  candidateDetails.forEach(detail => {
    const score = parseFloat(detail['Điểm'].split('/')[0]);
    const maxScore = parseFloat(detail['Điểm'].split('/')[1]);
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 80) {
      strengthAreas.push(detail['Tiêu chí']);
    } else if (percentage < 50) {
      weaknessAreas.push(detail['Tiêu chí']);
    }
  });

  return `
Bạn là chuyên gia tuyển dụng. Tạo câu hỏi phỏng vấn CỤ THỂ cho ứng viên này dựa trên phân tích CV chi tiết.

**THÔNG TIN VỊ TRÍ:**
- Vị trí: ${stats.jobPosition}
- Địa điểm: ${analysisData.job.locationRequirement}

**THÔNG TIN ỨNG VIÊN:**
- Tên: ${candidate.candidateName}
- Chức danh hiện tại: ${candidate.jobTitle}
- Ngành: ${candidate.industry}
- Cấp độ: ${candidate.experienceLevel}
- Điểm tổng: ${candidate.analysis?.['Tổng điểm']}/100
- Hạng: ${candidate.analysis?.['Hạng']}

**ĐIỂM MẠNH CỦA ỨNG VIÊN:**
${candidateStrengths.length > 0 ? candidateStrengths.map((s, i) => `${i+1}. ${s}`).join('\n') : 'Chưa xác định'}

**ĐIỂM YẾU CỦA ỨNG VIÊN:**
${candidateWeaknesses.length > 0 ? candidateWeaknesses.map((w, i) => `${i+1}. ${w}`).join('\n') : 'Chưa xác định'}

**LĨNH VỰC MẠNH (điểm >=80%):**
${strengthAreas.length > 0 ? strengthAreas.join(', ') : 'Không có'}

**LĨNH VỰC YẾU (điểm <50%):**
${weaknessAreas.length > 0 ? weaknessAreas.join(', ') : 'Không có'}

**YÊU CẦU:**
1. Tạo câu hỏi RIÊNG BIỆT cho ứng viên này, không phải template chung
2. Khai thác sâu vào điểm mạnh để xác nhận
3. Thách thức những điểm yếu để test khả năng
4. Câu hỏi phải cụ thể, có thể verify được qua câu trả lời
5. Bao gồm câu hỏi tình huống dựa trên background của ứng viên
6. Tập trung vào việc validate những gì đã thể hiện trong CV

**NHÓM CÂUHỎI GỢI Ý:**
- Xác nhận điểm mạnh và kinh nghiệm
- Thách thức điểm yếu đã phát hiện  
- Câu hỏi kỹ thuật theo chuyên môn
- Tình huống thực tế trong vai trò ${stats.jobPosition}
- Câu hỏi về growth và learning ability

Mỗi nhóm 4-5 câu cụ thể. Trả về JSON format.
`;
};

const createComparativeQuestionsPrompt = (analysisData: AnalysisRunData, stats: AnalysisStats, candidates: Candidate[]): string => {
  const candidateProfiles = candidates.map(c => ({
    name: c.candidateName,
    rank: c.analysis?.['Hạng'],
    score: c.analysis?.['Tổng điểm'],
    title: c.jobTitle,
    level: c.experienceLevel,
    strengths: c.analysis?.['Điểm mạnh CV'] || [],
    weaknesses: c.analysis?.['Điểm yếu CV'] || []
  }));

  return `
Bạn là chuyên gia tuyển dụng. Tạo câu hỏi để SO SÁNH và lựa chọn giữa các ứng viên tốt nhất.

**THÔNG TIN VỊ TRÍ:**
- Vị trí: ${stats.jobPosition}
- Địa điểm: ${analysisData.job.locationRequirement}

**ỨNG VIÊN CẦN SO SÁNH:**
${candidateProfiles.map((c, i) => `
${i+1}. ${c.name}
   - Hạng: ${c.rank} (${c.score} điểm)
   - Vị trí: ${c.title}
   - Cấp độ: ${c.level}
   - Điểm mạnh: ${c.strengths.slice(0, 3).join(', ')}
   - Điểm yếu: ${c.weaknesses.slice(0, 2).join(', ')}
`).join('\n')}

**MỤC TIÊU:**
Tạo câu hỏi giúp HR so sánh trực tiếp và chọn ứng viên phù hợp nhất cho vị trí ${stats.jobPosition}.

**YÊU CẦU:**
1. Câu hỏi phải giúp phân biệt rõ ràng giữa các ứng viên
2. Tập trung vào những điểm khác biệt quan trọng
3. Câu hỏi tình huống để test khả năng xử lý thực tế
4. So sánh về technical skills, soft skills, cultural fit
5. Câu hỏi về motivation và commitment
6. Đánh giá potential và growth mindset

**NHÓM CÂUHỎI:**
- Câu hỏi phân biệt khả năng kỹ thuật
- So sánh kinh nghiệm và achievements
- Đánh giá leadership và teamwork
- Test problem-solving approach
- Cultural fit và long-term commitment
- Scenario-based questions

Mỗi nhóm 4-5 câu, thiết kế để so sánh trực tiếp. Trả về JSON format.
`;
};

// Hàm tạo câu hỏi dựa trên ngành nghề cụ thể
export const getIndustrySpecificQuestions = (industry: string, position: string): string[] => {
  const industryQuestions: Record<string, string[]> = {
    'Công nghệ thông tin': [
      'Bạn cập nhật xu hướng công nghệ mới như thế nào?',
      'Mô tả một bug phức tạp bạn đã debug thành công.',
      'Bạn approach một dự án mới với yêu cầu không rõ ràng ra sao?',
      'Kinh nghiệm làm việc với các framework/library hiện đại?'
    ],
    'Marketing': [
      'Mô tả một campaign thành công bạn đã thực hiện.',
      'Bạn đo lường ROI của hoạt động marketing như thế nào?',
      'Xu hướng digital marketing nào đang hot hiện tại?',
      'Cách bạn xây dựng brand awareness cho sản phẩm mới?'
    ],
    'Tài chính': [
      'Bạn phân tích rủi ro tài chính như thế nào?',
      'Kinh nghiệm với các công cụ phân tích tài chính nào?',
      'Cách bạn present báo cáo tài chính cho leadership?',
      'Xử lý tình huống cash flow âm ra sao?'
    ]
  };

  return industryQuestions[industry] || [
    `Thách thức lớn nhất trong ngành ${industry} hiện tại là gì?`,
    `Bạn theo dõi xu hướng ngành ${industry} qua kênh nào?`,
    `Kỹ năng quan trọng nhất cho vị trí ${position} là gì?`,
    `Dự án nào trong ${industry} bạn tự hào nhất?`
  ];
};

// Hàm tạo câu hỏi dựa trên cấp độ kinh nghiệm
export const getLevelSpecificQuestions = (level: string): string[] => {
  const levelQuestions: Record<string, string[]> = {
    'Intern': [
      'Bạn học hỏi kỹ năng mới như thế nào?',
      'Mô tả một dự án học tập ấn tượng của bạn.',
      'Bạn xử lý feedback và criticism ra sao?',
      'Mục tiêu phát triển trong 6 tháng đầu là gì?'
    ],
    'Junior': [
      'Mô tả một thách thức kỹ thuật bạn đã vượt qua.',
      'Bạn tự học và improve skills như thế nào?',
      'Kinh nghiệm làm việc nhóm và nhận guidance?',
      'Dự án nào giúp bạn grow nhiều nhất?'
    ],
    'Senior': [
      'Bạn mentor junior team members như thế nào?',
      'Cách bạn make technical decisions và trade-offs?',
      'Kinh nghiệm lead projects và manage timeline?',
      'Xử lý conflict trong team ra sao?'
    ],
    'Lead': [
      'Bạn build và scale team như thế nào?',
      'Cách bạn align technical vision với business goals?',
      'Kinh nghiệm manage stakeholder expectations?',
      'Strategy để improve team productivity?'
    ]
  };

  return levelQuestions[level] || [
    'Mô tả vai trò và trách nhiệm chính trong vị trí hiện tại.',
    'Thành tựu lớn nhất trong career của bạn?',
    'Cách bạn handle pressure và deadlines?',
    'Mục tiêu phát triển trong 1-2 năm tới?'
  ];
};