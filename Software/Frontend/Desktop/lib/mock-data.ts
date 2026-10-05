export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTarget: string;
  matchScore: number;
  stage: "screening" | "qualified" | "interview" | "offer";
  status: "active" | "hired" | "rejected";
  experienceYears: number;
  expectedSalary: number;
  skills: string[];
  appliedDate: string;
  recruiter: string;
  education: string;
  location: string;
  aiSummary?: string;
  interviewQuestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  criteriaScores?: {
    job_fit?: number;
    role_skills?: number;
    experience?: number;
    impact?: number;
    education?: number;
    soft_skills?: number;
    skills?: number;
    softSkills?: number;
  };
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  level: "Junior" | "Mid-Level" | "Senior" | "Lead" | "Manager";
  location: string;
  openings: number;
  hiredCount: number;
  totalApplicants: number;
  salaryRange: string;
  status: "active" | "paused" | "closed";
  deadline: string;
  recruiter: string;
  requirements: string[];
  rubricWeights: {
    job_fit: number;
    role_skills: number;
    experience: number;
    impact: number;
    education: number;
    soft_skills: number;
  };
}

export interface JDTemplate {
  id: string;
  title: string;
  category: "Engineering" | "AI & Data" | "Product & Design" | "Management" | "Business & HR";
  level: string;
  description: string;
  requirements: string[];
  suggestedSalary: string;
  defaultWeights: {
    job_fit: number;
    role_skills: number;
    experience: number;
    impact: number;
    education: number;
    soft_skills: number;
  };
}

export interface SalaryBenchmarkItem {
  id: string;
  jobTitle: string;
  category: string; // Industry name
  fresherSalary: [number, number]; // [min, max] triệu VNĐ (Dưới 1 năm)
  juniorSalary: [number, number]; // [min, max] triệu VNĐ (1-3 năm)
  midSalary: [number, number]; // [min, max] triệu VNĐ (3-5 năm)
  seniorSalary: [number, number]; // [min, max] triệu VNĐ (Trên 5 năm)
  leadSalary: [number, number]; // [min, max] triệu VNĐ (Lead / Quản lý)
  p25: number; // 25th percentile (Triệu VNĐ)
  p50: number; // Trung vị thị trường Median (Triệu VNĐ)
  p75: number; // 75th percentile (Triệu VNĐ)
  p90: number; // 90th percentile (Triệu VNĐ)
  topSkills: string[];
  marketGrowth: string;
  demandLevel: "Rất Cao" | "Cao" | "Trung Bình";
  sampleDescription: string;
}

export interface HistoryBatch {
  id: string;
  batchName: string;
  jobTitle: string;
  createdAt: string;
  recruiter: string;
  totalCVs: number;
  qualifiedCount: number;
  avgScore: number;
  topCandidateName: string;
  topScore: number;
  status: "completed" | "processing";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

export interface RecruiterMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  candidatesProcessed: number;
  hiredCount: number;
  hiringTarget: number;
  change: number;
  rank: number;
  department: string;
}

export interface HiringRisk {
  id: string;
  title: string;
  description: string;
  impact: string;
  severity: "high" | "medium" | "low";
  impactedJobs: string[];
  mitigationPlan: {
    step: string;
    owner: string;
    timeline: string;
    status: "in-progress" | "pending" | "completed";
  }[];
}

export interface RecruitmentReport {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "ready" | "generating";
  format: "CSV" | "PDF" | "XLSX";
  records: number;
  summary: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "candidate" | "job" | "interview" | "risk" | "system";
  read: boolean;
  sectionTarget?: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSync: string | null;
  category: string;
}

export interface InterviewItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatar?: string;
  jobTitle: string;
  round: "screening" | "technical" | "final" | "culture";
  roundName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  format: "gmeet" | "zoom" | "onsite";
  meetingUrlOrRoom: string;
  interviewers: string[];
  status: "scheduled" | "completed" | "rescheduled" | "cancelled";
  notes?: string;
  score?: number;
  feedback?: string;
}

export interface EmailLogItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  subject: string;
  type: "invite" | "offer" | "thankyou" | "reminder";
  sentAt: string;
  status: "delivered" | "opened" | "replied" | "bounced";
  openCount: number;
  contentPreview: string;
}

export interface EmailTemplateItem {
  id: string;
  title: string;
  type: "invite" | "offer" | "thankyou" | "reminder";
  subject: string;
  body: string;
  description: string;
  lastUpdated: string;
}

// Initial Candidates Data
export const initialCandidates: Candidate[] = [
  {
    id: "cand-1",
    name: "Nguyễn Văn Hùng",
    email: "hung.nguyen@email.com",
    phone: "0908 123 456",
    jobTarget: "Senior Frontend React/Vue Developer",
    matchScore: 92,
    stage: "interview",
    status: "active",
    experienceYears: 5,
    expectedSalary: 35000000,
    skills: ["ReactJS", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "Performance Optimization"],
    appliedDate: "2026-08-12",
    recruiter: "Nguyễn Thị Mai",
    education: "ĐH Bách Khoa TP.HCM - Kỹ thuật Phần mềm",
    location: "TP. Hồ Chí Minh",
    aiSummary: "Ứng viên có kiến trúc frontend vững chắc, 5 năm kinh nghiệm thực chiến với React/Next.js, tối ưu hóa bundle và render rất tốt.",
    criteriaScores: { skills: 94, experience: 90, education: 88, softSkills: 92 },
    interviewQuestions: [
      "Trình bày cách bạn xử lý re-render dư thừa trong các dự án SPA quy mô lớn?",
      "Kinh nghiệm của bạn trong việc thiết lập Server-Side Rendering và ISR với Next.js?",
    ],
  },
  {
    id: "cand-2",
    name: "Trần Minh Quân",
    email: "quan.tran@email.com",
    phone: "0912 345 678",
    jobTarget: "AI / Machine Learning Engineer",
    matchScore: 88,
    stage: "qualified",
    status: "active",
    experienceYears: 3,
    expectedSalary: 40000000,
    skills: ["Python", "PyTorch", "NLP", "LLM Fine-tuning", "FastAPI", "Vector Database"],
    appliedDate: "2026-08-14",
    recruiter: "Lê Hoàng Nam",
    education: "ĐH Khoa học Tự nhiên - Khoa học Dữ liệu",
    location: "Hà Nội",
    aiSummary: "Chuyên sâu về mô hình ngôn ngữ lớn (LLMs), RAG pipelines và triển khai mô hình với FastAPI/Docker.",
    criteriaScores: { skills: 92, experience: 82, education: 90, softSkills: 85 },
    interviewQuestions: [
      "Bạn tối ưu hoá độ trễ của mô hình LLM khi xử lý tài liệu dài như thế nào?",
      "Cách thiết lập Vector Database cho hệ thống đối chiếu CV tự động?",
    ],
  },
  {
    id: "cand-3",
    name: "Phạm Thảo Linh",
    email: "linh.pham@email.com",
    phone: "0987 654 321",
    jobTarget: "Product Owner / Senior Business Analyst",
    matchScore: 95,
    stage: "offer",
    status: "active",
    experienceYears: 6,
    expectedSalary: 45000000,
    skills: ["Agile/Scrum", "Product Roadmap", "UI/UX Thinking", "Data Analytics", "HR Tech", "User Stories"],
    appliedDate: "2026-08-08",
    recruiter: "Nguyễn Thị Mai",
    education: "ĐH Kinh tế Quốc dân - Hệ thống Thông tin Quản lý",
    location: "Hà Nội",
    aiSummary: "Ứng viên xuất sắc, có kinh nghiệm trực tiếp làm sản phẩm B2B SaaS HRTech và quản lý đội ngũ scrum 15 thành viên.",
    criteriaScores: { skills: 96, experience: 95, education: 92, softSkills: 98 },
    interviewQuestions: [
      "Cách bạn xác định độ ưu tiên giữa nợ kỹ thuật và tính năng mới cho người dùng?",
      "Chia sẻ một case study bạn tăng tỉ lệ giữ chân người dùng thành công?",
    ],
  },
  {
    id: "cand-4",
    name: "Lê Quốc Bảo",
    email: "bao.le@email.com",
    phone: "0977 888 999",
    jobTarget: "Backend Python / FastAPI Architect",
    matchScore: 85,
    stage: "interview",
    status: "active",
    experienceYears: 4,
    expectedSalary: 38000000,
    skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Microservices", "Docker", "AsyncIO"],
    appliedDate: "2026-08-10",
    recruiter: "Vũ Hải Đăng",
    education: "ĐH FPT - Kỹ thuật Phần mềm",
    location: "Đà Nẵng",
    aiSummary: "Thiết kế kiến trúc API chuẩn RESTful, cơ sở dữ liệu phân tán và cache Redis tốc độ cao.",
    criteriaScores: { skills: 88, experience: 82, education: 80, softSkills: 86 },
    interviewQuestions: [
      "Cách bạn tối ưu truy vấn PostgreSQL khi bảng dữ liệu vượt 10 triệu bản ghi?",
      "Trình bày chiến lược xử lý asynchronous job queue với Redis & Celery?",
    ],
  },
  {
    id: "cand-5",
    name: "Đặng Hoàng Anh",
    email: "anh.dang@email.com",
    phone: "0903 456 789",
    jobTarget: "UI/UX Product Designer",
    matchScore: 78,
    stage: "screening",
    status: "active",
    experienceYears: 2,
    expectedSalary: 22000000,
    skills: ["Figma", "Design System", "User Research", "Wireframing", "Prototyping"],
    appliedDate: "2026-08-15",
    recruiter: "Trần Thu Hà",
    education: "ĐH Mỹ thuật Công nghiệp",
    location: "TP. Hồ Chí Minh",
    aiSummary: "Portfolio đẹp, tư duy visual tốt, cần bổ sung thêm kinh nghiệm về nghiên cứu hành vi người dùng B2B.",
    criteriaScores: { skills: 80, experience: 72, education: 85, softSkills: 80 },
    interviewQuestions: [
      "Quy trình xây dựng và duy trì Design System giữa Designer và Developer?",
    ],
  },
  {
    id: "cand-6",
    name: "Bùi Tuấn Kiệt",
    email: "kiet.bui@email.com",
    phone: "0934 567 890",
    jobTarget: "DevOps & Cloud Infrastructure Engineer",
    matchScore: 90,
    stage: "offer",
    status: "active",
    experienceYears: 5,
    expectedSalary: 42000000,
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD GitLab", "Monitoring Prometheus", "Docker"],
    appliedDate: "2026-08-05",
    recruiter: "Lê Hoàng Nam",
    education: "ĐH Công nghệ - ĐHQGHN",
    location: "Hà Nội",
    aiSummary: "Kinh nghiệm quản lý cụm Kubernetes chịu tải cao, tự động hóa hạ tầng bằng Terraform và bảo mật Cloud.",
    criteriaScores: { skills: 92, experience: 90, education: 85, softSkills: 88 },
    interviewQuestions: [
      "Chiến lược Zero Downtime Deployment cho dịch vụ Microservices?",
    ],
  },
];

// Initial Job Positions Data
export const initialJobs: JobPosition[] = [
  {
    id: "job-1",
    title: "Senior Frontend React/Vue Developer",
    department: "Engineering",
    level: "Senior",
    location: "TP. Hồ Chí Minh (Hybrid)",
    openings: 3,
    hiredCount: 1,
    totalApplicants: 48,
    salaryRange: "30,000,000 - 45,000,000 ₫",
    status: "active",
    deadline: "2026-09-15",
    recruiter: "Nguyễn Thị Mai",
    requirements: [
      "Tối thiểu 4 năm kinh nghiệm phát triển SPA với React hoặc Vue",
      "Thành thạo TypeScript, Next.js, Redux Toolkit hoặc Pinia",
      "Hiểu sâu về tối ưu hiệu năng web và responsive layout",
    ],
    rubricWeights: { job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 },
  },
  {
    id: "job-2",
    title: "AI / Machine Learning Engineer",
    department: "AI Research",
    level: "Senior",
    location: "Hà Nội",
    openings: 2,
    hiredCount: 0,
    totalApplicants: 32,
    salaryRange: "35,000,000 - 55,000,000 ₫",
    status: "active",
    deadline: "2026-09-30",
    recruiter: "Lê Hoàng Nam",
    requirements: [
      "Có kinh nghiệm thực chiến với mô hình LLM, Fine-tuning, RAG",
      "Thành thạo Python, PyTorch, Transformers, Vector DB",
      "Kinh nghiệm tối ưu hóa và đóng gói API triển khai sản xuất",
    ],
    rubricWeights: { job_fit: 15, role_skills: 45, experience: 15, impact: 10, education: 5, soft_skills: 10 },
  },
  {
    id: "job-3",
    title: "Backend Python / FastAPI Architect",
    department: "Engineering",
    level: "Lead",
    location: "Toàn quốc (Remote)",
    openings: 1,
    hiredCount: 0,
    totalApplicants: 24,
    salaryRange: "40,000,000 - 50,000,000 ₫",
    status: "active",
    deadline: "2026-09-10",
    recruiter: "Vũ Hải Đăng",
    requirements: [
      "Thiết kế kiến trúc hệ thống backend chịu tải cao với FastAPI / Python",
      "Kinh nghiệm xử lý bất đồng bộ AsyncIO, PostgreSQL, Redis, Celery",
      "Thành thạo Docker, Microservices, hệ thống phân tán",
    ],
    rubricWeights: { job_fit: 15, role_skills: 35, experience: 25, impact: 10, education: 5, soft_skills: 10 },
  },
  {
    id: "job-4",
    title: "Product Owner / Senior Business Analyst",
    department: "Product",
    level: "Manager",
    location: "Hà Nội",
    openings: 1,
    hiredCount: 1,
    totalApplicants: 19,
    salaryRange: "35,000,000 - 48,000,000 ₫",
    status: "active",
    deadline: "2026-09-05",
    recruiter: "Nguyễn Thị Mai",
    requirements: [
      "Trên 4 năm kinh nghiệm làm Product Owner hoặc Senior BA sản phẩm B2B SaaS",
      "Kỹ năng phân tích nghiệp vụ, viết User Stories và quản lý Backlog",
      "Khả năng điều phối liên phòng ban và giao tiếp xuất sắc",
    ],
    rubricWeights: { job_fit: 20, role_skills: 20, experience: 25, impact: 15, education: 5, soft_skills: 15 },
  },
  {
    id: "job-5",
    title: "DevOps & Cloud Infrastructure Engineer",
    department: "Infrastructure",
    level: "Mid-Level",
    location: "TP. Hồ Chí Minh",
    openings: 2,
    hiredCount: 1,
    totalApplicants: 27,
    salaryRange: "30,000,000 - 42,000,000 ₫",
    status: "active",
    deadline: "2026-09-20",
    recruiter: "Lê Hoàng Nam",
    requirements: [
      "Thành thạo Kubernetes, Docker, AWS hoặc Google Cloud",
      "Xây dựng pipeline CI/CD tự động hóa kiểm thử và triển khai",
      "Kinh nghiệm giám sát hệ thống với Prometheus / Grafana",
    ],
    rubricWeights: { job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 },
  },
];

// JD Templates Library
export const jdTemplatesList: JDTemplate[] = [
  {
    id: "tmpl-fe",
    title: "Senior Frontend React/Next.js Engineer",
    category: "Engineering",
    level: "Senior (4+ năm KN)",
    description: "Phát triển giao diện web ứng dụng quy mô lớn, tối ưu hóa tốc độ load trang và trải nghiệm người dùng.",
    requirements: [
      "Tối thiểu 4 năm kinh nghiệm với React, TypeScript, Next.js",
      "Hiểu sâu về Client/Server Component, State Management (Redux/Zustand)",
      "Kinh nghiệm tối ưu Web Vitals, Responsive CSS và Tailwind CSS",
      "Kỹ năng viết Unit/Integration Tests với Jest hoặc Playwright",
    ],
    suggestedSalary: "32,000,000 - 48,000,000 ₫",
    defaultWeights: { job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 },
  },
  {
    id: "tmpl-be",
    title: "Backend Python / FastAPI Microservices Architect",
    category: "Engineering",
    level: "Senior/Lead (5+ năm KN)",
    description: "Thiết kế và xây dựng hạ tầng API hiệu năng cao, quản lý cơ sở dữ liệu phân tán và message queue.",
    requirements: [
      "Thành thạo Python 3.11+, FastAPI, SQLAlchemy, AsyncIO",
      "Kinh nghiệm tối ưu truy vấn PostgreSQL, Redis caching, RabbitMQ",
      "Thiết kế kiến trúc Clean Architecture, Microservices, Docker, K8s",
      "Tư duy bảo mật API, OAuth2, JWT và Rate Limiting",
    ],
    suggestedSalary: "38,000,000 - 55,000,000 ₫",
    defaultWeights: { job_fit: 15, role_skills: 35, experience: 25, impact: 10, education: 5, soft_skills: 10 },
  },
  {
    id: "tmpl-ai",
    title: "AI / LLM Application Engineer (RAG & NLP)",
    category: "AI & Data",
    level: "Senior (3+ năm KN AI)",
    description: "Nghiên cứu và triển khai các giải pháp AI Tạo sinh, hệ thống RAG và mô hình đối chiếu ngữ nghĩa thông minh.",
    requirements: [
      "Thành thạo Python, PyTorch, HuggingFace Transformers, LangChain/LlamaIndex",
      "Kinh nghiệm thực chiến triển khai Vector Database (Qdrant/Pinecone/Milvus)",
      "Kỹ năng Fine-tuning mô hình ngôn ngữ và Prompt Engineering nâng cao",
      "Đóng gói mô hình phục vụ sản xuất với ONNX / TensorRT / vLLM",
    ],
    suggestedSalary: "40,000,000 - 65,000,000 ₫",
    defaultWeights: { job_fit: 15, role_skills: 45, experience: 15, impact: 10, education: 5, soft_skills: 10 },
  },
  {
    id: "tmpl-devops",
    title: "DevOps / Site Reliability Engineer (SRE)",
    category: "Engineering",
    level: "Mid/Senior (3-5 năm KN)",
    description: "Vận hành và tự động hóa cụm hạ tầng đám mây, đảm bảo hệ thống đạt độ sẵn sàng 99.99%.",
    requirements: [
      "Quản trị cụm Kubernetes (EKS/GKE), Terraform (IaC)",
      "Thiết lập CI/CD pipeline tự động hóa với GitLab CI / GitHub Actions",
      "Giám sát cảnh báo với Prometheus, Grafana, ELK stack",
      "Kiến thức vững về Network, DNS, SSL/TLS, CDN và Cloud Security",
    ],
    suggestedSalary: "30,000,000 - 45,000,000 ₫",
    defaultWeights: { job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 },
  },
  {
    id: "tmpl-po",
    title: "Product Owner / Senior Technical BA",
    category: "Product & Design",
    level: "Senior (4+ năm KN)",
    description: "Định hình tầm nhìn sản phẩm B2B SaaS, phân tích yêu cầu nghiệp vụ và điều phối nhóm phát triển Agile.",
    requirements: [
      "Kinh nghiệm làm Product Owner cho sản phẩm công nghệ SaaS/Fintech/HRTech",
      "Kỹ năng viết User Stories, PRD, Acceptance Criteria và quản lý Product Backlog",
      "Phân tích dữ liệu người dùng (Product Analytics) để ra quyết định dựa trên số liệu",
      "Khả năng giao tiếp, thương lượng và trình bày xuất sắc",
    ],
    suggestedSalary: "35,000,000 - 50,000,000 ₫",
    defaultWeights: { job_fit: 20, role_skills: 20, experience: 25, impact: 15, education: 5, soft_skills: 15 },
  },
  {
    id: "tmpl-qa",
    title: "Automation QA Lead Engineer",
    category: "Engineering",
    level: "Senior (4+ năm KN)",
    description: "Xây dựng khung kiểm thử tự động hóa toàn diện từ API, UI đến kiểm thử chịu tải hiệu năng.",
    requirements: [
      "Thành thạo Playwright / Selenium / Cypress với TypeScript hoặc Python",
      "Kinh nghiệm viết test case API với Postman / REST Assured",
      "Kiểm thử tải với JMeter / K6 và tích hợp kiểm thử vào CI/CD",
      "Tư duy phát hiện lỗi sắc bén và đảm bảo chất lượng phát hành",
    ],
    suggestedSalary: "28,000,000 - 40,000,000 ₫",
    defaultWeights: { job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 },
  },
];

// Comprehensive Multi-Industry Salary Benchmark Dataset for Vietnam
export const salaryBenchmarkList: SalaryBenchmarkItem[] = [
  // --- NHÓM 1: CÔNG NGHỆ THÔNG TIN / PHẦN MỀM ---
  {
    id: "sal-it-1",
    jobTitle: "Frontend Developer (React / Next.js / Vue)",
    category: "Công nghệ thông tin",
    fresherSalary: [9.5, 14.5],
    juniorSalary: [13.5, 22.0],
    midSalary: [22.0, 36.0],
    seniorSalary: [36.0, 55.0],
    leadSalary: [55.0, 80.0],
    p25: 18.5,
    p50: 28.5,
    p75: 42.0,
    p90: 60.0,
    topSkills: ["ReactJS", "Next.js 15", "TypeScript", "Tailwind CSS", "Redux Toolkit", "Web Performance"],
    marketGrowth: "+14.2% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Thị trường ưu tiên ứng viên thành thạo TypeScript, Next.js App Router, SSR/ISR và có tư duy tối ưu Core Web Vitals.",
  },
  {
    id: "sal-it-2",
    jobTitle: "Backend Developer (NodeJS / Python / Java / Golang)",
    category: "Công nghệ thông tin",
    fresherSalary: [10.0, 15.5],
    juniorSalary: [15.0, 24.5],
    midSalary: [24.5, 38.5],
    seniorSalary: [38.5, 60.0],
    leadSalary: [60.0, 90.0],
    p25: 20.0,
    p50: 32.0,
    p75: 48.0,
    p90: 72.0,
    topSkills: ["Node.js", "Python FastAPI", "Java Spring Boot", "Golang", "PostgreSQL", "Redis", "Kafka"],
    marketGrowth: "+16.8% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Nhu cầu cao đối với kỹ sư có kinh nghiệm Microservices, kiến trúc phân tán (Event-driven) và xử lý tải lớn.",
  },
  {
    id: "sal-it-3",
    jobTitle: "AI / Machine Learning Engineer (LLM & GenAI)",
    category: "Công nghệ thông tin",
    fresherSalary: [14.0, 20.0],
    juniorSalary: [20.0, 32.0],
    midSalary: [32.0, 52.0],
    seniorSalary: [52.0, 85.0],
    leadSalary: [85.0, 130.0],
    p25: 28.0,
    p50: 45.0,
    p75: 68.0,
    p90: 100.0,
    topSkills: ["Python", "PyTorch", "LLM Fine-tuning", "RAG Pipeline", "Vector DB", "Gemini API", "Agentic AI"],
    marketGrowth: "+38.5% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Phân khúc lương tăng trưởng mạnh nhất toàn thị trường. Doanh nghiệp săn đón kỹ sư am hiểu Agentic AI, RAG và tối ưu hóa hệ thống.",
  },
  {
    id: "sal-it-4",
    jobTitle: "DevOps & Cloud Infrastructure Engineer",
    category: "Công nghệ thông tin",
    fresherSalary: [11.0, 16.0],
    juniorSalary: [16.0, 26.0],
    midSalary: [26.0, 42.0],
    seniorSalary: [42.0, 65.0],
    leadSalary: [65.0, 95.0],
    p25: 22.0,
    p50: 35.0,
    p75: 52.0,
    p90: 78.0,
    topSkills: ["Docker", "Kubernetes", "AWS / GCP", "Terraform", "CI/CD", "Prometheus/Grafana"],
    marketGrowth: "+20.4% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Doanh nghiệp sẵn sàng chi trả mức lương cao cho kỹ sư có chứng chỉ AWS/GCP Professional và kinh nghiệm Kubernetes quy mô lớn.",
  },
  {
    id: "sal-it-5",
    jobTitle: "Fullstack Software Engineer",
    category: "Công nghệ thông tin",
    fresherSalary: [10.0, 15.0],
    juniorSalary: [14.5, 23.5],
    midSalary: [23.5, 37.0],
    seniorSalary: [37.0, 58.0],
    leadSalary: [58.0, 85.0],
    p25: 19.5,
    p50: 30.5,
    p75: 46.0,
    p90: 68.0,
    topSkills: ["React/Next.js", "Node.js/NestJS", "TypeScript", "PostgreSQL", "REST/GraphQL", "Docker"],
    marketGrowth: "+15.6% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Phù hợp cho các doanh nghiệp công nghệ và sản phẩm SaaS yêu cầu kỹ sư có thể phụ trách toàn diện cả giao diện và API.",
  },
  {
    id: "sal-it-6",
    jobTitle: "Mobile App Developer (Flutter / React Native / iOS / Android)",
    category: "Công nghệ thông tin",
    fresherSalary: [9.0, 14.0],
    juniorSalary: [13.0, 22.0],
    midSalary: [22.0, 35.0],
    seniorSalary: [35.0, 52.0],
    leadSalary: [52.0, 75.0],
    p25: 17.5,
    p50: 27.5,
    p75: 41.0,
    p90: 58.0,
    topSkills: ["Flutter (Dart)", "React Native", "Swift", "Kotlin", "Mobile State Management", "CI/CD Mobile"],
    marketGrowth: "+11.8% YoY",
    demandLevel: "Cao",
    sampleDescription: "Nhu cầu cao đối với lập trình viên Cross-platform Flutter và React Native có tư duy tối ưu hóa hiệu năng ứng dụng.",
  },
  {
    id: "sal-it-7",
    jobTitle: "Software QA/QC & Automation Test Engineer",
    category: "Công nghệ thông tin",
    fresherSalary: [8.5, 13.0],
    juniorSalary: [12.0, 19.0],
    midSalary: [19.0, 30.0],
    seniorSalary: [30.0, 45.0],
    leadSalary: [45.0, 65.0],
    p25: 15.0,
    p50: 24.0,
    p75: 36.0,
    p90: 50.0,
    topSkills: ["Selenium", "Playwright", "Cypress", "Postman", "JMeter", "Python/Java for Test", "API Security Test"],
    marketGrowth: "+13.4% YoY",
    demandLevel: "Cao",
    sampleDescription: "Xu hướng thị trường dịch chuyển mạnh sang Automation Testing, Performance Testing và kiểm thử tự động trong CI/CD.",
  },
  {
    id: "sal-it-8",
    jobTitle: "Product Owner / Senior Business Analyst",
    category: "Công nghệ thông tin",
    fresherSalary: [10.0, 15.0],
    juniorSalary: [14.0, 22.0],
    midSalary: [22.0, 36.0],
    seniorSalary: [36.0, 55.0],
    leadSalary: [55.0, 85.0],
    p25: 18.0,
    p50: 29.0,
    p75: 44.0,
    p90: 65.0,
    topSkills: ["Agile/Scrum", "Product Roadmap", "User Stories", "Data Analytics", "B2B SaaS Thinking", "Jira/Confluence"],
    marketGrowth: "+13.0% YoY",
    demandLevel: "Cao",
    sampleDescription: "Yêu cầu cao về tư duy sản phẩm định lượng (Data-driven) và năng lực điều phối nhóm Scrum liên chức năng.",
  },

  // --- NHÓM 2: KINH DOANH / BÁN HÀNG (SALES) ---
  {
    id: "sal-sales-1",
    jobTitle: "Chuyên Viên Kinh Doanh B2B / Enterprise Sales",
    category: "Kinh doanh / Bán hàng",
    fresherSalary: [9.0, 14.0],
    juniorSalary: [14.0, 22.0],
    midSalary: [22.0, 38.0],
    seniorSalary: [38.0, 65.0],
    leadSalary: [65.0, 110.0],
    p25: 16.5,
    p50: 28.0,
    p75: 45.0,
    p90: 80.0,
    topSkills: ["B2B Solution Selling", "Negotiation", "Key Account Management", "CRM (Hubspot/Salesforce)", "Contract Closing"],
    marketGrowth: "+15.2% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Mức thu nhập bao gồm Lương cứng + Hoa hồng doanh số cao. Ưu tiên ứng viên có mạng lưới quan hệ khách hàng doanh nghiệp sẵn có.",
  },
  {
    id: "sal-sales-2",
    jobTitle: "Nhân Viên Kinh Doanh / Sales Executive",
    category: "Kinh doanh / Bán hàng",
    fresherSalary: [7.5, 12.0],
    juniorSalary: [11.0, 18.0],
    midSalary: [18.0, 28.0],
    seniorSalary: [28.0, 42.0],
    leadSalary: [42.0, 65.0],
    p25: 12.0,
    p50: 18.5,
    p75: 30.0,
    p90: 48.0,
    topSkills: ["Sales Pitching", "Customer Relationship", "Direct Sales", "Lead Generation", "Closing Deal"],
    marketGrowth: "+11.5% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Vị trí có nhu cầu tuyển dụng đông đảo nhất thị trường, thu nhập lũy tiến mạnh theo hiệu suất KPI và hoa hồng.",
  },
  {
    id: "sal-sales-3",
    jobTitle: "Trưởng Phòng Kinh Doanh (Sales Manager)",
    category: "Kinh doanh / Bán hàng",
    fresherSalary: [18.0, 25.0],
    juniorSalary: [25.0, 35.0],
    midSalary: [35.0, 55.0],
    seniorSalary: [55.0, 85.0],
    leadSalary: [85.0, 140.0],
    p25: 32.0,
    p50: 48.0,
    p75: 75.0,
    p90: 120.0,
    topSkills: ["Sales Strategy", "Team Leadership", "Revenue Forecasting", "Channel Development", "Executive Presentation"],
    marketGrowth: "+14.0% YoY",
    demandLevel: "Cao",
    sampleDescription: "Chịu trách nhiệm trực tiếp về chỉ tiêu doanh thu, phát triển mạng lưới phân phối và đào tạo đội ngũ nhân viên kinh doanh.",
  },

  // --- NHÓM 3: MARKETING & TRUYỀN THÔNG ---
  {
    id: "sal-mkt-1",
    jobTitle: "Chuyên Viên Digital Marketing & Performance Media",
    category: "Marketing & Truyền thông",
    fresherSalary: [8.5, 13.5],
    juniorSalary: [13.5, 20.0],
    midSalary: [20.0, 32.0],
    seniorSalary: [32.0, 48.0],
    leadSalary: [48.0, 70.0],
    p25: 15.5,
    p50: 25.0,
    p75: 38.0,
    p90: 55.0,
    topSkills: ["Facebook Ads", "Google Ads", "TikTok Ads", "GA4 / GTM", "ROAS Optimization", "Marketing Funnel"],
    marketGrowth: "+16.0% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Ưu tiên nhân sự am hiểu tối ưu hóa chi phí quảng cáo (ROAS/CPA), phân tích dữ liệu chuyển đổi và tiếp thị đa kênh.",
  },
  {
    id: "sal-mkt-2",
    jobTitle: "Content Marketing Specialist & Copywriter",
    category: "Marketing & Truyền thông",
    fresherSalary: [7.5, 12.0],
    juniorSalary: [11.5, 17.5],
    midSalary: [17.5, 26.0],
    seniorSalary: [26.0, 38.0],
    leadSalary: [38.0, 55.0],
    p25: 12.5,
    p50: 18.0,
    p75: 28.0,
    p90: 42.0,
    topSkills: ["Content Strategy", "Storytelling", "SEO Content", "Social Media Copy", "Creative Concept", "AI Writing Tools"],
    marketGrowth: "+9.8% YoY",
    demandLevel: "Trung Bình",
    sampleDescription: "Ứng viên có khả năng sáng tạo nội dung viral, kết hợp sử dụng công cụ AI và am hiểu hành vi khách hàng được trả lương cao hơn.",
  },
  {
    id: "sal-mkt-3",
    jobTitle: "Trưởng Phòng Marketing (Marketing Manager)",
    category: "Marketing & Truyền thông",
    fresherSalary: [18.0, 25.0],
    juniorSalary: [25.0, 38.0],
    midSalary: [38.0, 58.0],
    seniorSalary: [58.0, 85.0],
    leadSalary: [85.0, 120.0],
    p25: 32.0,
    p50: 48.0,
    p75: 70.0,
    p90: 100.0,
    topSkills: ["Brand Strategy", "Omnichannel Marketing", "Budget Allocation", "Team Management", "Market Research"],
    marketGrowth: "+12.2% YoY",
    demandLevel: "Cao",
    sampleDescription: "Định hướng chiến lược thương hiệu tổng thể, phân bổ ngân sách tiếp thị và tối ưu hóa hiệu quả kinh doanh cho doanh nghiệp.",
  },

  // --- NHÓM 4: TÀI CHÍNH / KẾ TOÁN / KIỂM TOÁN ---
  {
    id: "sal-fin-1",
    jobTitle: "Kế Toán Tổng Hợp (General Accountant)",
    category: "Tài chính / Kế toán",
    fresherSalary: [8.0, 12.5],
    juniorSalary: [12.0, 18.0],
    midSalary: [18.0, 26.0],
    seniorSalary: [26.0, 36.0],
    leadSalary: [36.0, 50.0],
    p25: 13.0,
    p50: 19.5,
    p75: 28.0,
    p90: 40.0,
    topSkills: ["Báo cáo tài chính", "Khai báo thuế", "Hạch toán kế toán", "Phần mềm MISA/SAP", "Quyết toán thuế"],
    marketGrowth: "+8.5% YoY",
    demandLevel: "Cao",
    sampleDescription: "Nhu cầu ổn định trên toàn quốc. Ứng viên có chứng chỉ kế toán và kinh nghiệm làm việc với cơ quan thuế có mức lương cạnh tranh.",
  },
  {
    id: "sal-fin-2",
    jobTitle: "Kế Toán Trưởng (Chief Accountant)",
    category: "Tài chính / Kế toán",
    fresherSalary: [18.0, 25.0],
    juniorSalary: [25.0, 38.0],
    midSalary: [38.0, 55.0],
    seniorSalary: [55.0, 80.0],
    leadSalary: [80.0, 120.0],
    p25: 30.0,
    p50: 45.0,
    p75: 65.0,
    p90: 95.0,
    topSkills: ["Chứng chỉ KTT", "Tối ưu hóa chi phí thuế", "Kiểm soát nội bộ", "Chuẩn mực VAS/IFRS", "Quản lý dòng tiền"],
    marketGrowth: "+10.0% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Vị trí chủ chốt quản lý toàn bộ hệ thống kế toán, đảm bảo tuân thủ pháp luật và tham mưu tài chính trực tiếp cho Ban Giám đốc.",
  },
  {
    id: "sal-fin-3",
    jobTitle: "Chuyên Viên Phân Tích Tài Chính (Financial Analyst)",
    category: "Tài chính / Kế toán",
    fresherSalary: [10.0, 15.0],
    juniorSalary: [15.0, 24.0],
    midSalary: [24.0, 38.0],
    seniorSalary: [38.0, 58.0],
    leadSalary: [58.0, 85.0],
    p25: 18.0,
    p50: 28.0,
    p75: 45.0,
    p90: 70.0,
    topSkills: ["Financial Modeling", "CFA / CPA", "Valuation", "Budgeting", "Power BI / Advanced Excel", "M&A Analysis"],
    marketGrowth: "+15.5% YoY",
    demandLevel: "Cao",
    sampleDescription: "Ưu tiên ứng viên có chứng chỉ quốc tế CFA/ACCA, kỹ năng xây dựng mô hình tài chính và thẩm định dự án đầu tư.",
  },

  // --- NHÓM 5: HÀNH CHÍNH / NHÂN SỰ (HR & ADMIN) ---
  {
    id: "sal-hr-1",
    jobTitle: "Chuyên Viên Tuyển Dụng (Talent Acquisition Specialist)",
    category: "Hành chính / Nhân sự",
    fresherSalary: [8.0, 13.0],
    juniorSalary: [12.0, 18.5],
    midSalary: [18.5, 28.0],
    seniorSalary: [28.0, 42.0],
    leadSalary: [42.0, 60.0],
    p25: 13.5,
    p50: 20.5,
    p75: 32.0,
    p90: 48.0,
    topSkills: ["Headhunting", "Sourcing Tech Talent", "Interviewing & Rubric Scoring", "Employer Branding", "ATS System"],
    marketGrowth: "+12.8% YoY",
    demandLevel: "Cao",
    sampleDescription: "Săn tìm và đánh giá nhân sự chất lượng cao. Các Headhunter mảng IT và tài chính có thu nhập thưởng tuyển dụng rất lớn.",
  },
  {
    id: "sal-hr-2",
    jobTitle: "Chuyên Viên Tiền Lương & Phúc Lợi (C&B Specialist)",
    category: "Hành chính / Nhân sự",
    fresherSalary: [8.5, 13.5],
    juniorSalary: [13.0, 20.0],
    midSalary: [20.0, 30.0],
    seniorSalary: [30.0, 45.0],
    leadSalary: [45.0, 65.0],
    p25: 15.0,
    p50: 22.5,
    p75: 35.0,
    p90: 52.0,
    topSkills: ["Luật lao động", "BHXH & PIT", "Xây dựng thang bảng lương", "Chính sách đãi ngộ", "HRIS System"],
    marketGrowth: "+11.0% YoY",
    demandLevel: "Cao",
    sampleDescription: "Đảm bảo tuân thủ chính sách lao động, thiết kế cơ chế lương thưởng hấp dẫn giữ chân nhân tài cho doanh nghiệp.",
  },
  {
    id: "sal-hr-3",
    jobTitle: "Trưởng Phòng Nhân Sự (HR Manager / HRBP)",
    category: "Hành chính / Nhân sự",
    fresherSalary: [18.0, 25.0],
    juniorSalary: [25.0, 36.0],
    midSalary: [36.0, 52.0],
    seniorSalary: [52.0, 78.0],
    leadSalary: [78.0, 115.0],
    p25: 30.0,
    p50: 45.0,
    p75: 65.0,
    p90: 95.0,
    topSkills: ["HR Business Partnering", "Talent Management", "Organization Development", "Văn hóa doanh nghiệp", "Labor Compliance"],
    marketGrowth: "+13.5% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Đối tác chiến lược cùng Ban điều hành trong việc hoạch định nhân sự, phát triển văn hóa và nâng cao năng suất tổ chức.",
  },

  // --- NHÓM 6: THIẾT KẾ / SÁNG TẠO (DESIGN) ---
  {
    id: "sal-des-1",
    jobTitle: "UI/UX Product Designer",
    category: "Thiết kế / Sáng tạo",
    fresherSalary: [8.5, 13.5],
    juniorSalary: [12.5, 20.0],
    midSalary: [20.0, 32.0],
    seniorSalary: [32.0, 48.0],
    leadSalary: [48.0, 70.0],
    p25: 16.0,
    p50: 25.5,
    p75: 38.0,
    p90: 55.0,
    topSkills: ["Figma", "Design System", "UX Research", "Wireframing & Prototyping", "User Journey", "Mobile App UI"],
    marketGrowth: "+10.8% YoY",
    demandLevel: "Cao",
    sampleDescription: "Thiết kế trải nghiệm người dùng tối ưu cho các sản phẩm Web/App, am hiểu tâm lý người dùng và nguyên lý thiết kế tương tác.",
  },
  {
    id: "sal-des-2",
    jobTitle: "Graphic Designer / Thiết Kế Đồ Họa 2D",
    category: "Thiết kế / Sáng tạo",
    fresherSalary: [7.0, 11.5],
    juniorSalary: [11.0, 16.5],
    midSalary: [16.5, 24.0],
    seniorSalary: [24.0, 35.0],
    leadSalary: [35.0, 50.0],
    p25: 11.5,
    p50: 17.0,
    p75: 25.0,
    p90: 38.0,
    topSkills: ["Photoshop", "Illustrator", "Brand Identity", "Social Media Key Visual", "Typography", "InDesign"],
    marketGrowth: "+8.2% YoY",
    demandLevel: "Trung Bình",
    sampleDescription: "Phụ trách thiết kế bộ nhận diện thương hiệu, ấn phẩm truyền thông và hình ảnh quảng bá sản phẩm.",
  },

  // --- NHÓM 7: LOGISTICS & XUẤT NHẬP KHẨU ---
  {
    id: "sal-log-1",
    jobTitle: "Chuyên Viên Xuất Nhập Khẩu (Import/Export Specialist)",
    category: "Logistics / Xuất nhập khẩu",
    fresherSalary: [8.0, 12.5],
    juniorSalary: [12.0, 18.0],
    midSalary: [18.0, 28.0],
    seniorSalary: [28.0, 40.0],
    leadSalary: [40.0, 60.0],
    p25: 13.0,
    p50: 19.5,
    p75: 30.0,
    p90: 45.0,
    topSkills: ["Incoterms", "Khai báo Hải quan điện tử (VNACCS)", "Chứng từ xuất nhập khẩu (B/L, C/O)", "Tiếng Anh thương mại", "Forwarder Negotiation"],
    marketGrowth: "+14.5% YoY",
    demandLevel: "Cao",
    sampleDescription: "Hưởng lợi lớn từ làn sóng dịch chuyển sản xuất FDI về Việt Nam. Ứng viên thông thạo ngoại ngữ và thủ tục hải quan có mức đãi ngộ cao.",
  },
  {
    id: "sal-log-2",
    jobTitle: "Quản Lý Kho Vận & Chuỗi Cung Ứng (Supply Chain Manager)",
    category: "Logistics / Xuất nhập khẩu",
    fresherSalary: [18.0, 25.0],
    juniorSalary: [25.0, 36.0],
    midSalary: [36.0, 52.0],
    seniorSalary: [52.0, 78.0],
    leadSalary: [78.0, 120.0],
    p25: 30.0,
    p50: 45.0,
    p75: 68.0,
    p90: 100.0,
    topSkills: ["WMS System", "Inventory Optimization", "Demand Planning", "Vendor Management", "Logistics Cost Reduction"],
    marketGrowth: "+15.0% YoY",
    demandLevel: "Rất Cao",
    sampleDescription: "Tối ưu hóa toàn bộ chuỗi cung ứng từ thu mua nguyên vật liệu, lưu kho đến vận chuyển phân phối thành phẩm.",
  },

  // --- NHÓM 8: DỊCH VỤ KHÁCH HÀNG (CUSTOMER SERVICE) ---
  {
    id: "sal-cs-1",
    jobTitle: "Chuyên Viên Chăm Sóc Khách Hàng (Customer Care Specialist)",
    category: "Dịch vụ khách hàng",
    fresherSalary: [7.5, 11.5],
    juniorSalary: [10.5, 16.0],
    midSalary: [16.0, 23.0],
    seniorSalary: [23.0, 32.0],
    leadSalary: [32.0, 45.0],
    p25: 11.0,
    p50: 16.5,
    p75: 24.0,
    p90: 35.0,
    topSkills: ["Kỹ năng giao tiếp", "Xử lý khiếu nại", "CRM Software", "Dịch vụ khách hàng đa kênh", "Giọng nói truyền cảm"],
    marketGrowth: "+9.0% YoY",
    demandLevel: "Cao",
    sampleDescription: "Đại diện tiếng nói của doanh nghiệp, giữ chân khách hàng và giải quyết các khiếu nại, nâng cao sự hài lòng CSAT.",
  },
];


// History Batches Data
export const initialHistoryBatches: HistoryBatch[] = [
  {
    id: "batch-2026-08",
    batchName: "Đợt Tuyển Dụng Tech Lead & Senior Engineers Q3/2026",
    jobTitle: "Senior Frontend React & Backend Python",
    createdAt: "15/08/2026",
    recruiter: "Nguyễn Thị Mai",
    totalCVs: 48,
    qualifiedCount: 18,
    avgScore: 84,
    topCandidateName: "Phạm Thảo Linh",
    topScore: 95,
    status: "completed",
  },
  {
    id: "batch-2026-07",
    batchName: "Chiến Dịch Tuyển Dụng AI Research & LLM Specialist",
    jobTitle: "AI / Machine Learning Engineer",
    createdAt: "28/07/2026",
    recruiter: "Lê Hoàng Nam",
    totalCVs: 32,
    qualifiedCount: 11,
    avgScore: 81,
    topCandidateName: "Trần Minh Quân",
    topScore: 88,
    status: "completed",
  },
  {
    id: "batch-2026-06",
    batchName: "Tuyển Dụng Mở Rộng Đội Ngũ DevOps & Cloud Infrastructure",
    jobTitle: "DevOps & Cloud Infrastructure Engineer",
    createdAt: "18/06/2026",
    recruiter: "Lê Hoàng Nam",
    totalCVs: 27,
    qualifiedCount: 9,
    avgScore: 82,
    topCandidateName: "Bùi Tuấn Kiệt",
    topScore: 90,
    status: "completed",
  },
  {
    id: "batch-2026-05",
    batchName: "Đợt Tuyển Dụng Product Management & UI/UX Designer",
    jobTitle: "Product Owner & UI/UX Designer",
    createdAt: "22/05/2026",
    recruiter: "Trần Thu Hà",
    totalCVs: 36,
    qualifiedCount: 14,
    avgScore: 79,
    topCandidateName: "Vũ Thị Ngọc Ánh",
    topScore: 94,
    status: "completed",
  },
];

// Initial Recruiters Data
export const initialRecruiters: RecruiterMember[] = [
  {
    id: "rec-1",
    name: "Nguyễn Thị Mai",
    role: "Senior Talent Acquisition Lead",
    email: "mai.nguyen@supporthr.vn",
    phone: "0908 999 111",
    avatar: "NM",
    candidatesProcessed: 142,
    hiredCount: 12,
    hiringTarget: 15,
    change: 18,
    rank: 1,
    department: "Tech & Product Hiring",
  },
  {
    id: "rec-2",
    name: "Lê Hoàng Nam",
    role: "Technical Recruiter Specialist",
    email: "nam.le@supporthr.vn",
    phone: "0908 999 222",
    avatar: "LN",
    candidatesProcessed: 118,
    hiredCount: 9,
    hiringTarget: 12,
    change: 12,
    rank: 2,
    department: "AI & Infrastructure Hiring",
  },
  {
    id: "rec-3",
    name: "Vũ Hải Đăng",
    role: "Senior IT Headhunter",
    email: "dang.vu@supporthr.vn",
    phone: "0908 999 333",
    avatar: "VD",
    candidatesProcessed: 95,
    hiredCount: 8,
    hiringTarget: 10,
    change: 8,
    rank: 3,
    department: "Backend & Systems",
  },
  {
    id: "rec-4",
    name: "Trần Thu Hà",
    role: "Recruitment Coordinator",
    email: "ha.tran@supporthr.vn",
    phone: "0908 999 444",
    avatar: "TH",
    candidatesProcessed: 84,
    hiredCount: 6,
    hiringTarget: 8,
    change: -4,
    rank: 4,
    department: "Design & Marketing Hiring",
  },
];

// Initial Hiring Risks Data
export const initialHiringRisks: HiringRisk[] = [
  {
    id: "risk-1",
    title: "Khan hiếm Ứng viên AI/ML Cấp cao",
    description: "Vị trí AI/ML Engineer có ít hồ sơ đạt điểm match >= 85% do cạnh tranh mức lương thị trường quốc tế.",
    impact: "Chậm tiến độ 20 ngày",
    severity: "high",
    impactedJobs: ["AI / Machine Learning Engineer", "Backend Python Architect"],
    mitigationPlan: [
      {
        step: "Mở rộng nguồn tuyển dụng từ các cộng đồng AI quốc tế và cựu sinh viên du học",
        owner: "Lê Hoàng Nam",
        timeline: "28/08/2026",
        status: "in-progress",
      },
      {
        step: "Đề xuất chính sách làm việc Remote 100% kèm thưởng ký hợp đồng (Sign-on bonus)",
        owner: "HR Director",
        timeline: "30/08/2026",
        status: "pending",
      },
      {
        step: "Kích hoạt chương trình thưởng giới thiệu nội bộ (Referral Bonus x2)",
        owner: "Nguyễn Thị Mai",
        timeline: "Hoàn tất",
        status: "completed",
      },
    ],
  },
  {
    id: "risk-2",
    title: "Tỉ lệ Ứng viên từ chối Offer do chênh lệch lương",
    description: "2 ứng viên Senior Frontend vừa từ chối nhận việc do các công ty đối thủ trả cao hơn 15%.",
    impact: "Tăng chi phí tuyển dụng 12%",
    severity: "medium",
    impactedJobs: ["Senior Frontend React/Vue Developer"],
    mitigationPlan: [
      {
        step: "Cập nhật dữ liệu khảo sát thị trường lương IT 2026 (Vietnam Salary Benchmark)",
        owner: "C&B Lead",
        timeline: "25/08/2026",
        status: "in-progress",
      },
      {
        step: "Tối ưu hóa gói đãi ngộ: Thưởng hiệu suất quý, bảo hiểm sức khỏe cao cấp gia đình",
        owner: "HR Director",
        timeline: "02/09/2026",
        status: "pending",
      },
    ],
  },
  {
    id: "risk-3",
    title: "Nút thắt thời gian duyệt hồ sơ từ Hiring Manager",
    description: "Thời gian phản hồi đánh giá vòng 2 từ phòng ban Kỹ thuật trung bình kéo dài 6 ngày.",
    impact: "Ứng viên tìm được việc khác",
    severity: "high",
    impactedJobs: ["Senior Frontend", "Backend Architect", "DevOps Engineer"],
    mitigationPlan: [
      {
        step: "Tự động gửi báo cáo tóm tắt CV đạt chuẩn qua Slack/Email hằng ngày cho Tech Lead",
        owner: "Hệ thống AI CV Match",
        timeline: "Tức thì",
        status: "completed",
      },
      {
        step: "Quy định SLA phản hồi tối đa 48 giờ cho mọi hồ sơ có điểm Match AI >= 85%",
        owner: "CTO & HR Lead",
        timeline: "26/08/2026",
        status: "in-progress",
      },
    ],
  },
];

// Initial Reports Data
export const initialReports: RecruitmentReport[] = [
  {
    id: "rep-1",
    name: "Báo cáo Tổng hợp Tuyển dụng & Tỉ lệ Match Q3/2026",
    type: "Báo cáo Hiệu quả",
    date: "20/08/2026",
    status: "ready",
    format: "CSV",
    records: 240,
    summary: "Tổng hợp toàn diện số lượng CV tiếp nhận, phân bổ điểm match AI, tỉ lệ chuyển đổi qua các vòng và chi phí tuyển dụng.",
  },
  {
    id: "rep-2",
    name: "Hiệu quả các Kênh Nguồn Tuyển dụng (Source Attribution)",
    type: "Kênh tuyển dụng",
    date: "18/08/2026",
    status: "ready",
    format: "CSV",
    records: 185,
    summary: "Đánh giá chất lượng hồ sơ và tỉ lệ trúng tuyển từ LinkedIn, TopCV, VietnamWorks, Giới thiệu nội bộ và Website.",
  },
  {
    id: "rep-3",
    name: "Báo cáo Tốc độ Tuyển dụng & SLA Phỏng vấn (Time-to-Hire)",
    type: "Tốc độ xử lý",
    date: "15/08/2026",
    status: "ready",
    format: "CSV",
    records: 96,
    summary: "Thống kê chi tiết thời gian trung bình từ lúc nhận CV, chấm điểm AI, phỏng vấn đến khi phát hành thư mời nhận việc.",
  },
  {
    id: "rep-4",
    name: "Bảng Chỉ tiêu Tuyển dụng & Hiệu suất Recruiter",
    type: "Đội ngũ HR",
    date: "10/08/2026",
    status: "ready",
    format: "CSV",
    records: 52,
    summary: "Đánh giá tiến độ hoàn thành KPI tuyển dụng, số lượng ứng viên đã phỏng vấn và tỉ lệ nhận việc theo từng chuyên viên.",
  },
];

// Initial Notifications
export const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Ứng viên xuất sắc mới (Match 95%)",
    message: "Phạm Thảo Linh vừa ứng tuyển vị trí Product Owner với điểm đối chiếu AI đạt 95%.",
    time: "15 phút trước",
    type: "candidate",
    read: false,
    sectionTarget: "candidates",
  },
  {
    id: "notif-2",
    title: "Đạt chỉ tiêu tuyển dụng tháng",
    message: "Nguyễn Thị Mai đã hoàn thành 80% chỉ tiêu tuyển dụng Q3/2026 với 12 nhân sự trúng tuyển.",
    time: "1 giờ trước",
    type: "interview",
    read: false,
    sectionTarget: "overview",
  },
  {
    id: "notif-3",
    title: "Cảnh báo nút thắt tuyển dụng",
    message: "Vị trí AI/ML Engineer đang thiếu ứng viên đạt chuẩn >= 85%. Xem kế hoạch ứng phó.",
    time: "3 giờ trước",
    type: "risk",
    read: false,
    sectionTarget: "reports",
  },
  {
    id: "notif-4",
    title: "Đồng bộ hồ sơ Google Drive hoàn tất",
    message: "48 tệp CV PDF từ thư mục 'CV_UngVien_2026' đã được trích xuất và chấm điểm tự động.",
    time: "Hôm nay",
    type: "system",
    read: true,
    sectionTarget: "settings",
  },
];

// Initial Integrations
export const initialIntegrations: IntegrationItem[] = [
  {
    id: "google-drive",
    name: "Google Drive CV Sync",
    description: "Tự động đồng bộ và đọc hàng loạt tệp CV PDF / Word từ thư mục Drive",
    connected: true,
    lastSync: "15 phút trước",
    category: "Lưu trữ tài liệu",
  },
  {
    id: "gmail",
    name: "Gmail / Google Workspace",
    description: "Tự động quét CV từ hòm thư tuyển dụng và gửi thư mời phỏng vấn tự động",
    connected: true,
    lastSync: "Vừa xong",
    category: "Email & Lịch họp",
  },
  {
    id: "slack",
    name: "Slack Hiring Alerts",
    description: "Gửi thông báo tức thì khi có ứng viên điểm match >= 90% vào channel #recruitment",
    connected: true,
    lastSync: "Thời gian thực",
    category: "Thông báo đội ngũ",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Đồng bộ lịch phỏng vấn và tự động tạo link Google Meet cho ứng viên",
    connected: true,
    lastSync: "1 giờ trước",
    category: "Lịch phỏng vấn",
  },
  {
    id: "topcv",
    name: "Cổng tuyển dụng TopCV API",
    description: "Tự động nhận hồ sơ ứng tuyển từ các tin tuyển dụng đang đăng trên TopCV",
    connected: false,
    lastSync: null,
    category: "Kênh tuyển dụng",
  },
  {
    id: "linkedin",
    name: "LinkedIn Recruiter Sync",
    description: "Đồng bộ danh sách ứng viên tiềm năng và profile từ mạng lưới LinkedIn",
    connected: false,
    lastSync: null,
    category: "Kênh tuyển dụng",
  },
];

export const monthlyRecruitmentTrend = [
  { month: "T1", candidates: 120, target: 100, hired: 8, matchAvg: 82 },
  { month: "T2", candidates: 145, target: 110, hired: 11, matchAvg: 84 },
  { month: "T3", candidates: 180, target: 130, hired: 14, matchAvg: 86 },
  { month: "T4", candidates: 195, target: 140, hired: 15, matchAvg: 85 },
  { month: "T5", candidates: 160, target: 130, hired: 12, matchAvg: 83 },
  { month: "T6", candidates: 210, target: 150, hired: 18, matchAvg: 88 },
  { month: "T7", candidates: 230, target: 160, hired: 20, matchAvg: 87 },
  { month: "T8", candidates: 250, target: 170, hired: 22, matchAvg: 89 },
  { month: "T9", candidates: 220, target: 160, hired: 19, matchAvg: 86 },
  { month: "T10", candidates: 260, target: 180, hired: 24, matchAvg: 90 },
  { month: "T11", candidates: 280, target: 190, hired: 25, matchAvg: 91 },
  { month: "T12", candidates: 300, target: 200, hired: 28, matchAvg: 92 },
];

export const quarterlyRecruitmentTrend = [
  { quarter: "Q1", applicants: 445, target: 340, hired: 33, qualifiedRate: 78 },
  { quarter: "Q2", applicants: 565, target: 420, hired: 45, qualifiedRate: 82 },
  { quarter: "Q3", applicants: 700, target: 490, hired: 61, qualifiedRate: 85 },
  { quarter: "Q4", applicants: 840, target: 570, hired: 77, qualifiedRate: 89 },
];

export const initialInterviews: InterviewItem[] = [
  {
    id: "int-1",
    candidateId: "cand-1",
    candidateName: "Nguyễn Văn Hùng",
    candidateEmail: "hung.nguyen@email.com",
    candidatePhone: "0908 123 456",
    candidateAvatar: "NH",
    jobTitle: "Senior Frontend React/Vue Developer",
    round: "technical",
    roundName: "Vòng 2: Đánh Giá Kỹ Thuật (Technical Round)",
    date: "2026-08-25",
    time: "10:00",
    durationMinutes: 60,
    format: "gmeet",
    meetingUrlOrRoom: "https://meet.google.com/abc-tech-round",
    interviewers: ["Trần Tuấn Anh (Tech Lead)", "Nguyễn Thị Mai (HR Recruiter)"],
    status: "scheduled",
    notes: "Tập trung đánh giá kiến trúc Next.js SSR, tối ưu hoá bundle size và kỹ năng quản trị state Redux/Zustand.",
    score: 92,
  },
  {
    id: "int-2",
    candidateId: "cand-2",
    candidateName: "Trần Thị Mai Anh",
    candidateEmail: "maianh.tran@email.com",
    candidatePhone: "0912 345 678",
    candidateAvatar: "TM",
    jobTitle: "DevOps / SRE Cloud Engineer",
    round: "final",
    roundName: "Vòng 3: Phỏng Vấn Giám Đốc Kỹ Thuật (CTO / Culture Fit)",
    date: "2026-08-25",
    time: "14:30",
    durationMinutes: 45,
    format: "gmeet",
    meetingUrlOrRoom: "https://meet.google.com/devops-final-round",
    interviewers: ["Lê Hoàng Nam (CTO)", "Phạm Đức Minh (HR Manager)"],
    status: "scheduled",
    notes: "Đánh giá mức độ phù hợp văn hóa, cam kết dài hạn và kỳ vọng thu nhập 38 Tr/tháng.",
    score: 95,
  },
  {
    id: "int-3",
    candidateId: "cand-3",
    candidateName: "Lê Hoàng Long",
    candidateEmail: "long.le@email.com",
    candidatePhone: "0987 654 321",
    candidateAvatar: "LL",
    jobTitle: "Senior Backend Node.js / Go Engineer",
    round: "screening",
    roundName: "Vòng 1: Sơ Vấn Nhân Sự (HR Screening)",
    date: "2026-08-26",
    time: "09:30",
    durationMinutes: 30,
    format: "zoom",
    meetingUrlOrRoom: "https://zoom.us/j/889234112",
    interviewers: ["Nguyễn Thị Mai (HR Recruiter)"],
    status: "scheduled",
    notes: "Xác nhận thời gian có thể bắt đầu nhận việc (Notice Period) và làm rõ các dự án Microservices trước đây.",
    score: 88,
  },
  {
    id: "int-4",
    candidateId: "cand-4",
    candidateName: "Phạm Minh Đức",
    candidateEmail: "duc.pham@email.com",
    candidatePhone: "0934 567 890",
    candidateAvatar: "PM",
    jobTitle: "Kế Toán Trưởng (Chief Accountant)",
    round: "final",
    roundName: "Vòng 3: Phỏng Vấn Giám Đốc Tài Chính (CFO Round)",
    date: "2026-08-24",
    time: "15:00",
    durationMinutes: 60,
    format: "onsite",
    meetingUrlOrRoom: "Phòng Họp Executive - Tầng 12 (Bitexco)",
    interviewers: ["Vũ Thị Hương (CFO)", "Phạm Đức Minh (HR Manager)"],
    status: "completed",
    notes: "Ứng viên thể hiện xuất sắc kinh nghiệm thanh kiểm tra thuế và tối ưu chi phí doanh nghiệp.",
    score: 94,
    feedback: "Khuyến nghị gửi thư mời nhận việc (Job Offer) mức lương 28 Tr/tháng kèm phụ cấp.",
  },
  {
    id: "int-5",
    candidateId: "cand-5",
    candidateName: "Hoàng Bích Thủy",
    candidateEmail: "thuy.hoang@email.com",
    candidatePhone: "0945 678 901",
    candidateAvatar: "HB",
    jobTitle: "Digital Marketing Specialist",
    round: "technical",
    roundName: "Vòng 2: Đánh Giá Chuyên Môn Marketing (Campaign Review)",
    date: "2026-08-23",
    time: "11:00",
    durationMinutes: 45,
    format: "gmeet",
    meetingUrlOrRoom: "https://meet.google.com/mkt-specialist-round",
    interviewers: ["Đặng Quốc Bảo (Marketing Lead)"],
    status: "completed",
    notes: "Kỹ năng chạy Performance Ads TikTok & Facebook tốt, đã đạt chỉ tiêu KPI đề ra.",
    score: 89,
  },
];

export const initialEmailLogs: EmailLogItem[] = [
  {
    id: "email-1",
    candidateId: "cand-1",
    candidateName: "Nguyễn Văn Hùng",
    candidateEmail: "hung.nguyen@email.com",
    jobTitle: "Senior Frontend React/Vue Developer",
    subject: "Thư Mời Tham Gia Phỏng Vấn Kỹ Thuật (Technical Round) - CV Match",
    type: "invite",
    sentAt: "Hôm nay 08:30",
    status: "replied",
    openCount: 4,
    contentPreview: "Chào Nguyễn Văn Hùng, Cảm ơn bạn đã ứng tuyển vị trí Senior Frontend. Điểm AI Match của bạn đạt 92%...",
  },
  {
    id: "email-2",
    candidateId: "cand-2",
    candidateName: "Trần Thị Mai Anh",
    candidateEmail: "maianh.tran@email.com",
    jobTitle: "DevOps / SRE Cloud Engineer",
    subject: "Thư Mời Phỏng Vấn Giám Đốc Kỹ Thuật (CTO Round) - Vị Trí DevOps",
    type: "invite",
    sentAt: "Hôm nay 09:15",
    status: "opened",
    openCount: 2,
    contentPreview: "Chào Trần Thị Mai Anh, Chúng tôi trân trọng mời bạn tham gia buổi phỏng vấn trực tiếp cùng Ban Giám Đốc...",
  },
  {
    id: "email-3",
    candidateId: "cand-4",
    candidateName: "Phạm Minh Đức",
    candidateEmail: "duc.pham@email.com",
    jobTitle: "Kế Toán Trưởng (Chief Accountant)",
    subject: "Thư Đề Nghị Nhận Việc Chính Thức (Job Offer) - Vị Trí Kế Toán Trưởng",
    type: "offer",
    sentAt: "Hôm qua 16:45",
    status: "replied",
    openCount: 6,
    contentPreview: "Chào Phạm Minh Đức, Chúc mừng bạn đã xuất sắc vượt qua toàn bộ các vòng phỏng vấn. Ban Giám Đốc trân trọng gửi Offer...",
  },
  {
    id: "email-4",
    candidateId: "cand-6",
    candidateName: "Vũ Đình Trọng",
    candidateEmail: "trong.vu@email.com",
    jobTitle: "UI/UX Product Designer",
    subject: "Cảm Ơn Bạn Đã Tham Gia Ứng Tuyển Vị Trí UI/UX Designer",
    type: "thankyou",
    sentAt: "23/08/2026",
    status: "delivered",
    openCount: 1,
    contentPreview: "Chào Vũ Đình Trọng, Cảm ơn bạn đã dành thời gian trao đổi. Chúng tôi xin phép lưu hồ sơ vào Talent Pool...",
  },
];

export const initialEmailTemplates: EmailTemplateItem[] = [
  {
    id: "tpl-1",
    title: "Thư Mời Phỏng Vấn Kỹ Thuật (Interview Invitation)",
    type: "invite",
    subject: "Thư Mời Tham Gia Phỏng Vấn Tuyển Dụng Vị Trí {{job}} - Support HR",
    body: `Chào {{name}},\n\nCảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí {{job}} tại công ty chúng tôi.\n\nSau khi đối chiếu hồ sơ với các tiêu chuẩn chuyên môn, Ban Tuyển Dụng đánh giá hồ sơ của bạn đạt mức tương thích xuất sắc ({{score}}%). Chúng tôi trân trọng mời bạn tham dự buổi phỏng vấn kỹ thuật trực tuyến:\n\n• Thời gian: {{time}} ngày {{date}}\n• Hình thức: Trực tuyến qua Google Meet\n• Link phòng họp: {{link}}\n• Người phỏng vấn: {{interviewers}}\n\nVui lòng phản hồi lại email này để xác nhận lịch hẹn. Chúc bạn có một buổi phỏng vấn thành công!\n\nTrân trọng,\nBan Tuyển Dụng & Quản Trị Nhân Sự`,
    description: "Mẫu thư gửi ứng viên đạt chuẩn để mời tham gia phỏng vấn kỹ thuật hoặc sơ vấn HR",
    lastUpdated: "2026-08-20",
  },
  {
    id: "tpl-2",
    title: "Thư Đề Nghị Nhận Việc (Job Offer Letter)",
    type: "offer",
    subject: "Thư Đề Nghị Nhận Việc Chính Thức (Job Offer) - Vị Trí {{job}}",
    body: `Chào {{name}},\n\nChúc mừng bạn đã xuất sắc vượt qua toàn bộ các vòng phỏng vấn cho vị trí {{job}} tại công ty chúng tôi.\n\nBan Giám Đốc và Đội ngũ Nhân sự đánh giá rất cao năng lực chuyên môn và tinh thần trách nhiệm của bạn. Chúng tôi trân trọng gửi đến bạn Thư Đề Nghị Tuyển Dụng chính thức với các thông tin chi tiết đính kèm:\n\n• Vị trí công tác: {{job}}\n• Mức lương đề xuất: {{salary}}\n• Ngày bắt đầu nhận việc: {{start_date}}\n• Địa điểm làm việc: {{location}}\n\nTrân trọng,\nPhòng Quản Trị Nhân Sự`,
    description: "Mẫu thư gửi ứng viên đã trúng tuyển kèm các chế độ đãi ngộ và ngày nhận việc",
    lastUpdated: "2026-08-22",
  },
  {
    id: "tpl-3",
    title: "Thư Cảm Ơn & Lưu Trữ Hồ Sơ (Thank You & Talent Pool)",
    type: "thankyou",
    subject: "Cảm Ơn Bạn Đã Tham Gia Ứng Tuyển Vị Trí {{job}}",
    body: `Chào {{name}},\n\nCảm ơn bạn đã dành thời gian và sự quan tâm đối với vị trí {{job}} tại công ty chúng tôi.\n\nSau khi cân nhắc kỹ lưỡng, chúng tôi rất tiếc chưa thể đồng hành cùng bạn ở giai đoạn này. Dù vậy, hồ sơ của bạn đã được lưu trữ an toàn trong Talent Pool của chúng tôi và Ban Tuyển Dụng sẽ chủ động liên hệ ngay khi có cơ hội phù hợp hơn trong tương lai.\n\nChúc bạn luôn gặt hái nhiều thành công trên con đường sự nghiệp!\n\nTrân trọng,\nĐội ngũ Tuyển Dụng`,
    description: "Mẫu thư cảm ơn lịch sự và lưu trữ hồ sơ cho các cơ hội tuyển dụng tiếp theo",
    lastUpdated: "2026-08-18",
  },
];

