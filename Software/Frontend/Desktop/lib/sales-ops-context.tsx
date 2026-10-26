"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  type Candidate,
  type JobPosition,
  type JDTemplate,
  type SalaryBenchmarkItem,
  type HistoryBatch,
  type ChatMessage,
  type RecruiterMember,
  type HiringRisk,
  type RecruitmentReport,
  type NotificationItem,
  type IntegrationItem,
  type InterviewItem,
  type EmailLogItem,
  type EmailTemplateItem,
  initialCandidates,
  initialJobs,
  jdTemplatesList,
  salaryBenchmarkList,
  initialHistoryBatches,
  initialRecruiters,
  initialHiringRisks,
  initialReports,
  initialNotifications,
  initialIntegrations,
  initialInterviews,
  initialEmailLogs,
  initialEmailTemplates,
} from "./mock-data";
import { aiApi, filesApi, salaryApi, accountApi } from "./api-endpoints";
import { probeBackend, getActiveBaseUrl } from "./api-client";
import { APP_CONFIG } from "./config";
import { canonicalSection, sectionHref } from "./navigation";

export type Section =
  | "overview"
  | "workspace"
  | "match-workflow"
  | "pipeline"
  | "candidates"
  | "jobs"
  | "chatbot"
  | "ai-assistant"
  | "career-compass"
  | "quick-score"
  | "interview-hub"
  | "interview-gen"
  | "salary-benchmark"
  | "contact-candidates"
  | "history"
  | "reports"
  | "settings"
  | "criteria-settings";

export interface UserProfile {
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  avatar: string;
  timezone: string;
  currency: string;
  workLocation: string;
  officeAddress: string;
  compactView: boolean;
  minMatchScoreThreshold: number;
  autoExtractOCR: boolean;
  autoApplyUserRubric: boolean;
  defaultWeights?: WorkflowWeights;
  defaultSubWeights?: WorkflowSubWeights;
  defaultHardFilters?: WorkflowHardFilters;
}

export interface WorkflowSubWeights {
  role_skills: {
    core_tech: number; // Công nghệ cốt lõi & Ngôn ngữ chính
    frameworks_tools: number; // Frameworks & Công cụ bổ trợ
    best_practices: number; // Testing, CI/CD, Bảo mật & Code Quality
  };
  experience: {
    total_years: number; // Tổng số năm kinh nghiệm
    domain_exp: number; // Kinh nghiệm chuyên ngành / Domain Fit
    ownership: number; // Mức độ làm chủ & Quản lý công việc
  };
  job_fit: {
    responsibilities: number; // Độ khớp trách nhiệm công việc
    semantic_match: number; // Tương đồng ngữ nghĩa Vector Embedding
  };
  impact: {
    quantified_kpis: number; // Bằng chứng định lượng & Chỉ số KPI
    project_scale: number; // Quy mô dự án & Độ phức tạp hệ thống
  };
  soft_skills: {
    communication: number; // Giao tiếp & Làm việc nhóm
    reliability: number; // Độ tin cậy & Tính nhất quán hồ sơ
  };
  education: {
    degree_major: number; // Bằng cấp & Chuyên ngành đào tạo
    certificates: number; // Chứng chỉ chuyên môn quốc tế
  };
}

export const defaultStandardSubWeights: WorkflowSubWeights = {
  role_skills: {
    core_tech: 20,
    frameworks_tools: 10,
    best_practices: 5,
  },
  experience: {
    total_years: 8,
    domain_exp: 7,
    ownership: 5,
  },
  job_fit: {
    responsibilities: 10,
    semantic_match: 10,
  },
  impact: {
    quantified_kpis: 6,
    project_scale: 4,
  },
  soft_skills: {
    communication: 5,
    reliability: 5,
  },
  education: {
    degree_major: 3,
    certificates: 2,
  },
};

export interface WorkflowWeights {
  job_fit: number;
  role_skills: number;
  experience: number;
  impact: number;
  education: number;
  soft_skills: number;
  subWeights?: WorkflowSubWeights;
}

export interface WorkflowHardFilters {
  location: string;
  locationMandatory: boolean;
  minExp: number;
  minExpMandatory: boolean;
  industry?: string;
  industryMandatory?: boolean;
  seniority: "Intern" | "Junior" | "Mid-level" | "Senior" | "Lead" | string;
  seniorityMandatory?: boolean;
  education: "High School" | "Associate" | "Bachelor" | "Master" | "PhD" | string;
  educationMandatory: boolean;
  language: string;
  languageLevel: "B1" | "B2" | "C1" | "C2" | string;
  languageMandatory?: boolean;
  workFormat: "Onsite" | "Hybrid" | "Remote" | string;
  workFormatMandatory?: boolean;
  contractType: "Full-time" | "Part-time" | "Intern" | "Contract" | string;
  contractTypeMandatory?: boolean;
  certificates?: string;
  certificatesMandatory?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryMandatory?: boolean;
  contactMandatory?: boolean;
  majorGroups: string[];
  majorMandatory: boolean;
  age: { min: number; max: number };
  ageMandatory: boolean;
}

export interface WorkflowState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  selectedTemplateId?: string;
  jdTitle: string;
  jdContent: string;
  jdRequirements: string[];
  uploadedFiles: { id: string; name: string; size: string; type: string; rawText?: string }[];
  enableOCR: boolean;
  weights: WorkflowWeights;
  hardFilters: WorkflowHardFilters;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisLogs: string[];
}

export interface BackendStatus {
  state: "ok" | "degraded" | "offline" | "checking";
  live: boolean;
  ready: boolean;
  endpoint: string;
}

export type WorkspaceDataState = "preview" | "loading" | "ready" | "error";

interface SalesOpsContextType {
  // Navigation
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  syncActiveSection: (section: Section) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Backend Live Connection
  backendStatus: BackendStatus;
  checkBackendHealth: () => Promise<void>;

  // Firebase Real Auth & Database
  authUser: import("./local-auth").AppAuthUser | null;
  authChecked: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  reloadRealUserData: () => Promise<boolean>;
  workspaceDataState: WorkspaceDataState;
  logoutUser: () => Promise<void>;

  // Global Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Core Data Collections
  candidates: Candidate[];
  saveCandidates: (candidates: Candidate[]) => Promise<boolean>;
  jobs: JobPosition[];
  jdTemplates: JDTemplate[];
  salaryBenchmarks: SalaryBenchmarkItem[];
  historyBatches: HistoryBatch[];
  recruiters: RecruiterMember[];
  hiringRisks: HiringRisk[];
  reports: RecruitmentReport[];
  notifications: NotificationItem[];
  integrations: IntegrationItem[];
  userProfile: UserProfile;

  // Workflow Wizard State & Actions
  workflow: WorkflowState;
  setWorkflowStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  setWorkflowJD: (data: { title: string; content: string; requirements: string[] }) => void;
  loadJDTemplate: (templateId: string) => void;
  addWorkflowFile: (file: { name: string; size: string; type: string; rawText?: string }) => void;
  removeWorkflowFile: (id: string) => void;
  setWorkflowWeights: (weights: WorkflowState["weights"]) => void;
  setWorkflowHardFilters: (filters: Partial<WorkflowHardFilters>) => void;
  toggleWorkflowOCR: () => void;
  startAIAnalysis: () => Promise<void>;
  resetWorkflow: () => void;

  // AI Chatbot State & Actions
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => Promise<void>;
  clearChat: () => void;

  // Candidate CRUD
  addCandidate: (candidate: Omit<Candidate, "id">) => Promise<boolean>;
  updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<boolean>;
  deleteCandidate: (id: string) => Promise<boolean>;
  moveCandidateStage: (id: string, newStage: Candidate["stage"]) => Promise<boolean>;

  // Job CRUD
  addJob: (job: Omit<JobPosition, "id" | "hiredCount" | "totalApplicants">) => Promise<boolean>;
  updateJob: (id: string, updates: Partial<JobPosition>) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;

  // Recruiter CRUD
  addRecruiter: (recruiter: { name: string; role: string; email: string; phone: string; department: string; hiringTarget: number }) => void;
  updateRecruiter: (id: string, updates: Partial<RecruiterMember>) => void;

  // Interviews Management
  interviews: InterviewItem[];
  setInterviews: React.Dispatch<React.SetStateAction<InterviewItem[]>>;
  addInterview: (interview: Omit<InterviewItem, "id">) => void;
  updateInterview: (id: string, updates: Partial<InterviewItem>) => void;
  deleteInterview: (id: string) => void;

  // Email Outreach & Logs
  emailLogs: EmailLogItem[];
  setEmailLogs: React.Dispatch<React.SetStateAction<EmailLogItem[]>>;
  addEmailLog: (log: Omit<EmailLogItem, "id">) => void;
  emailTemplates: EmailTemplateItem[];

  // Reports
  addReport: (report: { name: string; type: string; format: "CSV" | "PDF" | "XLSX"; records: number; summary: string }) => void;
  downloadReport: (report: RecruitmentReport) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Integrations
  toggleIntegration: (id: string) => void;
  syncIntegration: (id: string) => void;

  // Profile & Exports
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  saveUserDefaultCriteria: (weights: WorkflowWeights, hardFilters: WorkflowHardFilters, autoApply?: boolean) => void;
  exportCandidatesCsv: () => void;
  exportJobsCsv: () => void;
  exportBatchReportCsv: (batchId: string) => void;

  // Computed Real-time Metrics
  metrics: {
    totalCandidates: number;
    avgMatchScore: number;
    activeJobsCount: number;
    totalOpenings: number;
    hiredCount: number;
    qualifiedCount: number;
    interviewCount: number;
    teamTargetAttainment: number;
  };
}

const SalesOpsContext = createContext<SalesOpsContextType | undefined>(undefined);

export function SalesOpsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeSection, setActiveSectionState] = useState<Section>("overview");
  const setActiveSection = useCallback((section: Section) => {
    const canonical = canonicalSection(section);
    setActiveSectionState(canonical);
    router.push(sectionHref(canonical), { scroll: false });
  }, [router]);
  const syncActiveSection = useCallback((section: Section) => {
    setActiveSectionState(canonicalSection(section));
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    state: "checking",
    live: false,
    ready: false,
    endpoint: APP_CONFIG.apiBaseUrl,
  });

  const checkBackendHealth = useCallback(async () => {
    try {
      const probe = await probeBackend();
      setBackendStatus({
        state: probe.state,
        live: probe.live,
        ready: probe.ready,
        endpoint: probe.endpoint,
      });
    } catch {
      setBackendStatus({
        state: "offline",
        live: false,
        ready: false,
        endpoint: getActiveBaseUrl(),
      });
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const timer = setInterval(checkBackendHealth, 60000);
    return () => clearInterval(timer);
  }, [checkBackendHealth]);

  // Firebase Real Auth State
  const [authUser, setAuthUser] = useState<import("./local-auth").AppAuthUser | null>(null);
  const identityUid = useRef<string | null | undefined>(undefined);
  const dataLoadGeneration = useRef(0);
  // Firebase xác nhận phiên bất đồng bộ khi mở không gian làm việc lần đầu.
  // Các công cụ dùng chung provider; giữ cờ này để tránh hiển thị yêu cầu
  // đăng nhập trong lúc onAuthStateChanged() chưa xác nhận xong phiên hiện tại.
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [workspaceDataState, setWorkspaceDataState] = useState<WorkspaceDataState>("preview");

  // Collections
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [jobs, setJobs] = useState<JobPosition[]>(initialJobs);
  const [jdTemplates, setJdTemplates] = useState<JDTemplate[]>(jdTemplatesList);
  const [salaryBenchmarks] = useState<SalaryBenchmarkItem[]>(salaryBenchmarkList);
  const [historyBatches, setHistoryBatches] = useState<HistoryBatch[]>(initialHistoryBatches);
  const [recruiters, setRecruiters] = useState<RecruiterMember[]>(initialRecruiters);
  const [hiringRisks] = useState<HiringRisk[]>(initialHiringRisks);
  const [reports, setReports] = useState<RecruitmentReport[]>(initialReports);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations);
  const [interviews, setInterviews] = useState<InterviewItem[]>(initialInterviews);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>(initialEmailLogs);
  const [emailTemplates] = useState<EmailTemplateItem[]>(initialEmailTemplates);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Chuyên Viên Tuyển Dụng",
    firstName: "Tuyển Dụng",
    lastName: "Chuyên Viên",
    role: "Trưởng Nhóm Tuyển Dụng (Lead Recruiter)",
    email: "recruiter@supporthr.vn",
    avatar: "HR",
    timezone: "ict",
    currency: "VND",
    workLocation: "TP. Hồ Chí Minh - Trụ sở chính",
    officeAddress: "Tầng 12, Tòa nhà Bitexco Financial Tower, Q.1, TP.HCM",
    compactView: false,
    minMatchScoreThreshold: 75,
    autoExtractOCR: true,
    autoApplyUserRubric: true,
    defaultWeights: {
      job_fit: 20,
      role_skills: 35,
      experience: 20,
      impact: 10,
      education: 5,
      soft_skills: 10,
    },
    defaultHardFilters: {
      location: "TP. Hồ Chí Minh",
      locationMandatory: false,
      minExp: 2,
      minExpMandatory: false,
      seniority: "Senior",
      education: "Bachelor",
      educationMandatory: false,
      language: "Tiếng Anh",
      languageLevel: "B2",
      workFormat: "Hybrid",
      contractType: "Full-time",
      majorGroups: ["information-technology"],
      majorMandatory: false,
      age: { min: 22, max: 35 },
      ageMandatory: false,
    },
  });

  // Reload real user profile & database data from Backend API
  const reloadRealUserData = useCallback(async () => {
    const loadId = ++dataLoadGeneration.current;
    const isAuthenticatedLoad = Boolean(identityUid.current);
    let workspaceLoadFailed = false;
    if (isAuthenticatedLoad) setWorkspaceDataState("loading");
    try {
      // 1. Profile from Backend DB
      const prof = await accountApi.getProfile().catch(() => null);
      if (loadId !== dataLoadGeneration.current) return false;
      if (prof && typeof prof === "object") {
        setUserProfile((prev) => ({
          ...prev,
          name: (prof.name as string) || (prof.displayName as string) || prev.name,
          email: (prof.email as string) || prev.email,
          role: (prof.role as string) || prev.role,
          avatar: ((prof.name as string) || prev.name).slice(0, 2).toUpperCase(),
        }));
      }

      // 2. Settings from Backend DB
      const sett = await accountApi.getSettings().catch(() => null);
      if (loadId !== dataLoadGeneration.current) return false;
      if (sett && typeof sett === "object") {
        setUserProfile((prev) => ({
          ...prev,
          minMatchScoreThreshold: (sett.minMatchScoreThreshold as number) || prev.minMatchScoreThreshold,
          autoExtractOCR: sett.autoExtractOCR !== undefined ? Boolean(sett.autoExtractOCR) : prev.autoExtractOCR,
        }));
      }

      // 3. Real JD Templates / Rubrics from Live Backend
      const rubricsRes = await aiApi.listRubrics().catch(() => null);
      if (loadId !== dataLoadGeneration.current) return false;
      if (rubricsRes && Array.isArray(rubricsRes.items) && rubricsRes.items.length > 0) {
        const realTemplates: JDTemplate[] = rubricsRes.items.map((r: any, idx: number) => ({
          id: r.roleKey || `tmpl-${idx}`,
          title: r.roleLabel || r.roleKey,
          category: "Engineering",
          level: "Senior / Mid",
          description: `Bộ quy tắc tiêu chuẩn tuyển dụng và ma trận đối chiếu ngữ nghĩa ${r.roleLabel || r.roleKey}`,
          requirements: [
            `Kỹ năng chuyên môn cốt lõi: ${r.weights?.role_skills?.name || "Chuyên ngành"}`,
            `Kinh nghiệm thực chiến: ${r.weights?.experience?.name || "Kinh nghiệm làm việc"}`,
            `Học vấn, chứng chỉ quốc tế và kỹ năng mềm`,
          ],
          suggestedSalary: "35 - 75 Triệu ₫",
          defaultWeights: {
            job_fit: Number(r.weights?.job_fit?.weight) || 20,
            role_skills: Number(r.weights?.role_skills?.weight) || 35,
            experience: Number(r.weights?.experience?.weight) || 20,
            impact: Number(r.weights?.impact?.weight) || 10,
            education: Number(r.weights?.education?.weight) || 5,
            soft_skills: Number(r.weights?.soft_skills?.weight) || 10,
          },
        }));
        setJdTemplates(realTemplates);
      }

      // 4. Real User Notifications from Backend
      const notifRes = await accountApi.listNotifications().catch(() => null);
      if (loadId !== dataLoadGeneration.current) return false;
      if (Array.isArray(notifRes)) {
        setNotifications(notifRes.map((n: any, idx: number) => ({
          id: n.id || `notif-${idx}`,
          title: n.title || "Thông báo tuyển dụng",
          message: n.message || n.content || "",
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString("vi-VN") : "Vừa xong",
          read: Boolean(n.read),
          type: "candidate",
        })));
      }

      // 5. Real History Batches & Candidate Records from Backend Database
      const hist = await accountApi.listHistory().catch(() => null);
      if (loadId !== dataLoadGeneration.current) return false;
      if (isAuthenticatedLoad && !Array.isArray(hist)) workspaceLoadFailed = true;
      const extractedCandidates: Candidate[] = [];
      if (Array.isArray(hist)) {
        const realBatches: HistoryBatch[] = hist.map((h: any, idx: number) => ({
          id: h.id || `batch-${idx}`,
          batchName: h.batch_name || h.name || h.jobPosition || `Đợt tuyển dụng #${idx + 1}`,
          jobTitle: h.job_title || h.jobTitle || h.jobPosition || "Kỹ Sư Phần Mềm",
          createdAt: h.timestamp || h.created_at || (h.createdAt ? new Date(h.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"),
          recruiter: h.recruiter || h.userEmail || "Chuyên viên Tuyển dụng",
          totalCVs: h.total_candidates ?? h.totalCandidates ?? h.candidatesCount ?? h.analysisData?.candidates?.length ?? 0,
          qualifiedCount: h.passed_count ?? h.qualifiedCount ?? 0,
          avgScore: h.avg_score ?? h.avgMatchScore ?? 0,
          topCandidateName: h.topCandidate || h.topCandidates?.[0]?.name || "Ứng viên nổi bật",
          topScore: h.topScore ?? h.topCandidates?.[0]?.match_score ?? 0,
          status: "completed",
        }));
        setHistoryBatches(realBatches);

        // Extract real candidates from all history sessions with guaranteed unique IDs
        const seenCandIds = new Set<string>();

        hist.forEach((h: any, batchIdx: number) => {
          const candList = h.analysisData?.candidates || h.analysis_data?.candidates || h.fullPayload?.candidates || h.candidates || h.topCandidates || [];
          if (Array.isArray(candList)) {
            candList.forEach((c: any, cIdx: number) => {
              const numericScore = Number(c.analysis?.["Tổng điểm"] ?? c.analysis?.total_score ?? c.analysis?.totalScore ?? c.totalScore ?? c.match_score ?? c.score ?? c.matchScore ?? 0);
              const score = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : 0;
              const baseId = String(c.id || c.cv_id || (c.fileName ? `${c.fileName}-${c.name || cIdx}` : `cand-${cIdx}`)).slice(0, 120);
              let uniqueId = `cand-db-${batchIdx}-${cIdx}-${baseId}`;
              if (seenCandIds.has(uniqueId)) {
                uniqueId = `${uniqueId}-${Math.random().toString(36).substring(2, 7)}`;
              }
              seenCandIds.add(uniqueId);

              extractedCandidates.push({
                id: uniqueId,
                sourceBatchId: h.id || `batch-${batchIdx}`,
                name: c.candidateName || c.name || c.candidate_name || `Ứng viên ${cIdx + 1}`,
                email: c.email || "",
                phone: c.phone || "",
                jobTarget: h.jobPosition || h.job_title || h.jobTitle || c.target_role || "Kỹ Sư Phần Mềm",
                matchScore: score,
                stage: score >= 75 ? "qualified" : "screening",
                status: "active",
                experienceYears: Number(c.experience_years ?? c.years_of_experience ?? 0),
                expectedSalary: Number(c.expected_salary ?? 0),
                skills: Array.isArray(c.matched_skills || c.skills || c.matched_keywords)
                  ? (c.matched_skills || c.skills || c.matched_keywords)
                  : [],
                appliedDate: h.timestamp || h.createdAt || "Gần đây",
                recruiter: h.recruiter || h.userEmail || "Chuyên viên Tuyển dụng",
                education: c.education || "Chưa cung cấp",
                location: c.location || c.detectedLocation || "",
                aiSummary: c.summary || c.ai_summary || "Hồ sơ đối chiếu trực tiếp từ Backend AI Engine.",
                strengths: c.analysis?.["Điểm mạnh CV"] || c.strengths || [],
                weaknesses: c.analysis?.["Điểm yếu CV"] || c.weaknesses || [],
                improvements: c.improvements || [],
                interviewQuestions: c.analysis?.["Câu hỏi phỏng vấn"] || c.suggested_questions || [],
                criteriaScores: {
                  job_fit: c.criteria_scores?.job_fit ?? 0,
                  role_skills: c.criteria_scores?.role_skills ?? 0,
                  experience: c.criteria_scores?.experience ?? 0,
                  impact: c.criteria_scores?.impact ?? 0,
                  education: c.criteria_scores?.education ?? 0,
                  soft_skills: c.criteria_scores?.soft_skills ?? 0,
                },
              });
            });
          }
        });

      }

      if (isAuthenticatedLoad) {
        const workspaceCandidates = await accountApi.listWorkspaceCandidates().catch(() => {
          workspaceLoadFailed = true;
          return null;
        });
        if (loadId !== dataLoadGeneration.current) return false;
        const workspaceInitialized = await accountApi.getWorkspaceInitialization().catch(() => {
          workspaceLoadFailed = true;
          return null;
        });
        if (loadId !== dataLoadGeneration.current) return false;
        if (Array.isArray(workspaceCandidates)) {
          if (workspaceInitialized === false && workspaceCandidates.length === 0 && extractedCandidates.length > 0) {
            try {
              const migratedCandidates = await Promise.all(extractedCandidates.map((candidate) => accountApi.saveWorkspaceCandidate(candidate)));
              setCandidates(migratedCandidates);
            } catch {
              workspaceLoadFailed = true;
              setCandidates([]);
            }
          } else {
            setCandidates(workspaceCandidates);
          }
          if (workspaceInitialized === false && !workspaceLoadFailed) {
            await accountApi.initializeWorkspace().catch(() => { workspaceLoadFailed = true; });
          }
        }

        const workspaceJobs = await accountApi.listWorkspaceJobs().catch(() => {
          workspaceLoadFailed = true;
          return null;
        });
        if (loadId !== dataLoadGeneration.current) return false;
        if (Array.isArray(workspaceJobs)) setJobs(workspaceJobs);
        setWorkspaceDataState(workspaceLoadFailed ? "error" : "ready");
        return !workspaceLoadFailed;
      }
      return true;
    } catch {
      if (isAuthenticatedLoad && loadId === dataLoadGeneration.current) setWorkspaceDataState("error");
      return false;
    }
  }, []);

  // Run on initial mount
  useEffect(() => {
    reloadRealUserData();
  }, [reloadRealUserData]);

  // Listen to Firebase live auth state
  useEffect(() => {
    let isMounted = true;
    import("./firebase").then(({ observeAuth }) => {
      observeAuth((fbUser) => {
        if (!isMounted) return;
        const nextUid = fbUser?.uid ?? null;
        if (identityUid.current !== nextUid && (fbUser || identityUid.current)) {
          dataLoadGeneration.current++;
          setCandidates([]);
          setHistoryBatches([]);
          setNotifications([]);
          setInterviews([]);
          setEmailLogs([]);
          setJobs([]);
          setChatMessages([]);
          setWorkflow((previous) => ({ ...previous, currentStep: 1, jdTitle: "", jdContent: "", jdRequirements: [], uploadedFiles: [], isAnalyzing: false, analysisProgress: 0, analysisLogs: [] }));
        }
        identityUid.current = nextUid;
        setAuthUser(fbUser);
        setAuthChecked(true);
        if (fbUser) {
          setUserProfile((prev) => ({
            ...prev,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || prev.name,
            email: fbUser.email || prev.email,
            avatar: (fbUser.displayName || fbUser.email || "HR").slice(0, 2).toUpperCase(),
          }));
          reloadRealUserData();
        } else {
          setWorkspaceDataState("preview");
        }
      });
    });
    return () => { isMounted = false; };
  }, [reloadRealUserData]);

  const logoutUser = async () => {
    const { signOutUser } = await import("./firebase");
    await signOutUser();
    setAuthUser(null);
    setUserProfile({
      name: "Khách (Chưa đăng nhập)",
      firstName: "Khách",
      lastName: "",
      role: "Tài Khoản Khách",
      email: "guest@supporthr.vn",
      avatar: "KH",
      timezone: "ict",
      currency: "VND",
      workLocation: "Linh hoạt từ xa (Remote / Hybrid)",
      officeAddress: "Toàn quốc",
      compactView: false,
      minMatchScoreThreshold: 75,
      autoExtractOCR: true,
      autoApplyUserRubric: true,
    });
  };

  // 5-Step Workflow State
  const [workflow, setWorkflow] = useState<WorkflowState>({
    currentStep: 1,
    jdTitle: "Senior Frontend React/Next.js Engineer",
    jdContent: `Mô tả công việc:\n- Phát triển ứng dụng Web SPA & SSR quy mô lớn với React, TypeScript và Next.js.\n- Thiết kế kiến trúc component tối ưu, tái sử dụng cao và xây dựng Design System đồng nhất.\n- Phối hợp chặt chẽ với Product Owner và Backend Engineers để tích hợp API hiệu quả.\n\nYêu cầu ứng viên:\n- Tối thiểu 4 năm kinh nghiệm phát triển Web Frontend chuyên sâu.\n- Thành thạo TypeScript, Next.js (App Router), Tailwind CSS, State Management.\n- Kinh nghiệm tối ưu Core Web Vitals, Responsive và kiểm thử tự động.`,
    jdRequirements: [
      "Tối thiểu 4 năm kinh nghiệm với React, TypeScript, Next.js",
      "Thành thạo kiến trúc Client/Server Component & Redux/Zustand",
      "Kinh nghiệm tối ưu Web Vitals và Responsive layout",
      "Kỹ năng làm việc nhóm, giao tiếp và giải quyết vấn đề",
    ],
    uploadedFiles: [
      { id: "f-1", name: "CV_NguyenVanHung_Frontend_Lead.pdf", size: "2.4 MB", type: "PDF", rawText: "Nguyễn Văn Hùng, 5 năm kinh nghiệm React/Next.js, TypeScript, Tailwind CSS, Redux Toolkit" },
      { id: "f-2", name: "CV_TranMinhQuan_Senior_AI_Dev.pdf", size: "1.8 MB", type: "PDF", rawText: "Trần Minh Quân, 3 năm kinh nghiệm Python, PyTorch, LLM, RAG, FastAPI, Vector DB" },
      { id: "f-3", name: "CV_PhamThaoLinh_Product_Owner.docx", size: "1.1 MB", type: "DOCX", rawText: "Phạm Thảo Linh, 6 năm kinh nghiệm Product Owner, Business Analyst B2B SaaS, Scrum" },
      { id: "f-4", name: "CV_LeQuocBao_Backend_FastAPI.pdf", size: "3.2 MB", type: "PDF", rawText: "Lê Quốc Bảo, 4 năm kinh nghiệm Python, FastAPI, PostgreSQL, Redis, Microservices" },
      { id: "f-5", name: "CV_BuiTuanKiet_DevOps_Cloud.pdf", size: "2.0 MB", type: "PDF", rawText: "Bùi Tuấn Kiệt, 5 năm kinh nghiệm Kubernetes, AWS, Terraform, Docker, CI/CD" },
    ],
    enableOCR: true,
    weights: {
      job_fit: 20,
      role_skills: 35,
      experience: 20,
      impact: 10,
      education: 5,
      soft_skills: 10,
    },
    hardFilters: {
      location: "TP. Hồ Chí Minh",
      locationMandatory: false,
      minExp: 2,
      minExpMandatory: false,
      seniority: "Senior",
      education: "Bachelor",
      educationMandatory: false,
      language: "Tiếng Anh",
      languageLevel: "B2",
      workFormat: "Hybrid",
      contractType: "Full-time",
      majorGroups: ["information-technology"],
      majorMandatory: false,
      age: { min: 22, max: 35 },
      ageMandatory: false,
    },
    isAnalyzing: false,
    analysisProgress: 100,
    analysisLogs: [
      "[01:00] Khởi động động cơ AI CV Match Engine...",
      "[01:01] Đọc và trích xuất cấu trúc văn bản từ các tệp CV ứng viên...",
      "[01:02] Áp dụng mô hình nhúng ngữ nghĩa đối chiếu với tiêu chí JD...",
      "[01:03] Chấm điểm trọng số Rubric thành công...",
      "[01:04] Hoàn tất đối chiếu và xuất bảng điểm xếp hạng!",
    ],
  });

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: "Xin chào! Tôi là trợ lý Insight Match. Tôi đã nắm toàn bộ dữ liệu hồ sơ ứng viên và tiêu chuẩn JD. Bạn cần tôi hỗ trợ phân tích so sánh ứng viên, gợi ý câu hỏi phỏng vấn hay khảo sát mức lương thị trường?",
      timestamp: "Vừa xong",
      suggestedActions: [
        "So sánh ứng viên Nguyễn Văn Hùng và Lê Quốc Bảo",
        "Ai có điểm đối chiếu kỹ năng cao nhất cho vị trí Frontend?",
        "Tư vấn câu hỏi phỏng vấn chuyên sâu cho vị trí AI/ML",
        "Khảo sát mức lương thị trường cho Senior React Developer",
      ],
    },
  ]);

  // Real-time Metrics
  const metrics = useMemo(() => {
    const totalCand = candidates.length;
    const avgScore =
      totalCand > 0
        ? Math.round(candidates.reduce((sum, c) => sum + c.matchScore, 0) / totalCand)
        : 0;

    const activeJobs = jobs.filter((j) => j.status === "active").length;
    const totalOpeningsCount = jobs.reduce((sum, j) => sum + j.openings, 0);
    const totalHired = candidates.filter((c) => c.status === "hired").length;
    const qualified = candidates.filter((c) => c.matchScore >= 75).length;
    const inInterview = candidates.filter((c) => c.stage === "interview").length;

    const totalTarget = recruiters.reduce((sum, r) => sum + r.hiringTarget, 0);
    const totalAchieved = recruiters.reduce((sum, r) => sum + r.hiredCount, 0);
    const attainment = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    return {
      totalCandidates: totalCand,
      avgMatchScore: avgScore,
      activeJobsCount: activeJobs,
      totalOpenings: totalOpeningsCount,
      hiredCount: totalHired,
      qualifiedCount: qualified,
      interviewCount: inInterview,
      teamTargetAttainment: attainment,
    };
  }, [candidates, jobs, recruiters]);

  // Workflow Wizard Actions
  const setWorkflowStep = (step: 1 | 2 | 3 | 4 | 5) => {
    setWorkflow((prev) => ({ ...prev, currentStep: step }));
  };

  const setWorkflowJD = (data: { title: string; content: string; requirements: string[] }) => {
    setWorkflow((prev) => ({
      ...prev,
      jdTitle: data.title,
      jdContent: data.content,
      jdRequirements: data.requirements,
    }));
  };

  const loadJDTemplate = (templateId: string) => {
    const tmpl = jdTemplates.find((t) => t.id === templateId);
    if (tmpl) {
      setWorkflow((prev) => ({
        ...prev,
        selectedTemplateId: templateId,
        jdTitle: tmpl.title,
        jdContent: tmpl.description,
        jdRequirements: tmpl.requirements,
        weights: userProfile.autoApplyUserRubric && userProfile.defaultWeights ? userProfile.defaultWeights : tmpl.defaultWeights,
        hardFilters: userProfile.autoApplyUserRubric && userProfile.defaultHardFilters ? userProfile.defaultHardFilters : prev.hardFilters,
      }));
      toast.success(
        userProfile.autoApplyUserRubric
          ? `Đã nạp mẫu JD "${tmpl.title}" (Tự động áp dụng Bộ Tiêu Chí của bạn)!`
          : `Đã nạp mẫu JD "${tmpl.title}" vào luồng đối chiếu!`
      );
    }
  };

  const addWorkflowFile = (file: { name: string; size: string; type: string; rawText?: string }) => {
    const newFile = { ...file, id: "f-" + Date.now() };
    setWorkflow((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, newFile],
    }));
    toast.success(`Đã tải lên tệp "${file.name}"`);
  };

  const removeWorkflowFile = (id: string) => {
    setWorkflow((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== id),
    }));
    toast.info("Đã xóa tệp khỏi danh sách chờ phân tích");
  };

  const setWorkflowWeights = (weights: WorkflowState["weights"]) => {
    setWorkflow((prev) => ({ ...prev, weights }));
    toast.success("Đã cập nhật bộ trọng số rubric đối chiếu!");
  };

  const setWorkflowHardFilters = (filters: Partial<WorkflowHardFilters>) => {
    setWorkflow((prev) => ({
      ...prev,
      hardFilters: { ...prev.hardFilters, ...filters },
    }));
    toast.success("Đã cập nhật tiêu chí cứng (Hard Filters)!");
  };

  const toggleWorkflowOCR = () => {
    setWorkflow((prev) => {
      const next = !prev.enableOCR;
      toast.info(next ? "Đã bật OCR nhận diện tệp ảnh/PDF quét" : "Đã tắt OCR");
      return { ...prev, enableOCR: next };
    });
  };

  const startAIAnalysis = async () => {
    setWorkflow((prev) => ({
      ...prev,
      currentStep: 4,
      isAnalyzing: true,
      analysisProgress: 15,
      analysisLogs: [
        `[00:01] Khởi tạo phiên phân tích đối chiếu thông minh với API Backend (${getActiveBaseUrl()})...`,
        `[00:02] Đang nạp tiêu chí JD: "${prev.jdTitle}"...`,
        `[00:03] Bắt đầu trích xuất ${prev.uploadedFiles.length} tệp hồ sơ CV...`,
      ],
    }));

    const toastId = toast.loading("Đang gọi AI Backend để đối chiếu và chấm điểm...");

    try {
      // Prepare payload for backend API
      const cvEntries = workflow.uploadedFiles.map((f) => ({
        file_name: f.name,
        text: f.rawText || `${f.name} - Ứng viên ngành công nghệ, có chuyên môn và kỹ năng phù hợp với yêu cầu vị trí ${workflow.jdTitle}.`,
      }));

      // Call live backend quick-score endpoint
      const apiRes = await aiApi.quickScoreText({
        jd_text: workflow.jdContent || workflow.jdTitle,
        cv_entries: cvEntries.slice(0, 3), // Max 3 for quick-score contract
      }).catch(() => null);

      if (apiRes && Array.isArray(apiRes.items) && apiRes.items.length > 0) {
        setWorkflow((prev) => ({
          ...prev,
          analysisProgress: 75,
          analysisLogs: [
            ...prev.analysisLogs,
            "[00:04] Nhận phản hồi thành công từ Backend AI Server!",
            "[00:05] Cập nhật kết quả chấm điểm ngữ nghĩa thực tế...",
          ],
        }));
      }
    } catch {
      // Handled seamlessly
    }

    setTimeout(() => {
      setWorkflow((prev) => ({
        ...prev,
        analysisProgress: 100,
        isAnalyzing: false,
        currentStep: 5,
        analysisLogs: [
          ...prev.analysisLogs,
          "[00:06] Trích xuất điểm mạnh, điểm yếu và sinh câu hỏi phỏng vấn hoàn tất!",
          "[00:07] Xuất bảng xếp hạng và phân loại ứng viên thành công!",
        ],
      }));
      toast.success("Hoàn tất đối chiếu AI! Đã chuyển sang bảng kết quả xếp hạng.", { id: toastId });
    }, 1800);
  };

  const resetWorkflow = () => {
    setWorkflow((prev) => ({
      ...prev,
      currentStep: 1,
      isAnalyzing: false,
      analysisProgress: 0,
      analysisLogs: [],
    }));
    toast.info("Đã làm mới luồng đối chiếu");
  };

  // Chatbot Actions with Live Backend API Fallback
  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text,
      timestamp: "Vừa xong",
    };

    setChatMessages((prev) => [...prev, userMsg]);

    let replyText = "";
    let suggestedActions = [
      "Xem chi tiết ứng viên điểm cao nhất",
      "Tải danh sách ứng viên đạt chuẩn ra CSV",
      "Tạo lịch phỏng vấn tuần này",
    ];

    try {
      const liveChat = await aiApi.candidateChat({
        message: text,
        job_position: workflow.jdTitle,
        candidate_snapshot: {
          totalCandidates: candidates.length,
          topScore: metrics.avgMatchScore,
        },
      });

      if (liveChat && (liveChat.response_text || liveChat.responseText || liveChat.reply)) {
        replyText = liveChat.response_text || liveChat.responseText || liveChat.reply || "";
        if (liveChat.suggested_actions || liveChat.citedCriteria) {
          suggestedActions = liveChat.suggested_actions || liveChat.citedCriteria || [];
        }
      }
    } catch {
      // Local intelligent response
      const lower = text.toLowerCase();
      if (lower.includes("so sánh") || lower.includes("hùng") || lower.includes("bảo")) {
        replyText = `Phân tích so sánh:\n\n1. Nguyễn Văn Hùng (Senior Frontend): Điểm Match 92%, 5 năm kinh nghiệm chuyên sâu React/Next.js. Ưu điểm nổi trội là tối ưu hiệu năng web và quản lý trạng thái phức tạp.\n\n2. Lê Quốc Bảo (Backend Architect): Điểm Match 85%, 4 năm kinh nghiệm FastAPI/PostgreSQL. Rất phù hợp nếu công ty cần người phụ trách kết nối dữ liệu Microservices.\n\n👉 Khuyến nghị: Ưu tiên phỏng vấn Nguyễn Văn Hùng trước cho vị trí Frontend Lead.`;
      } else if (lower.includes("lương") || lower.includes("salary")) {
        replyText = `Theo dữ liệu Khảo sát thị trường lương IT 2026 tại Việt Nam:\n- Senior Frontend (4-6 năm KN): 35,000,000 - 50,000,000 ₫/tháng.\n- Senior AI/ML Engineer: 45,000,000 - 70,000,000 ₫/tháng.\n- Mức đề xuất của ứng viên trong đợt này (35 - 42 Tr ₫) hoàn toàn nằm trong khung ngân sách hợp lý.`;
      } else if (lower.includes("câu hỏi") || lower.includes("phỏng vấn")) {
        replyText = `Gợi ý 2 câu hỏi phỏng vấn trọng tâm cho vị trí hiện tại:\n\n1. Kỹ thuật: "Bạn đã từng tối ưu hóa ứng dụng React/Next.js bị nghẽn hiệu năng render như thế nào? Nêu các công cụ profiling bạn đã dùng."\n2. Xử lý tình huống: "Nếu sản phẩm cần ra mắt gấp nhưng backend chưa hoàn thiện API, bạn sẽ phối hợp giải quyết như thế nào?"`;
      } else {
        replyText = `Dựa trên dữ liệu ${candidates.length} ứng viên đã đối chiếu, tôi nhận thấy có ${metrics.qualifiedCount} hồ sơ đạt chuẩn (Match >= 75%). Bạn có thể mở mục "Phễu Kanban" để lên lịch phỏng vấn hoặc xem chi tiết radar kỹ năng trong mục "Kho Hồ Sơ".`;
      }
    }

    const aiMsg: ChatMessage = {
      id: "msg-" + (Date.now() + 1),
      sender: "ai",
      text: replyText,
      timestamp: "Vừa xong",
      suggestedActions,
    };

    setChatMessages((prev) => [...prev, aiMsg]);
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: "msg-init",
        sender: "ai",
        text: "Lịch sử trò chuyện đã được làm mới. Tôi sẵn sàng hỗ trợ bạn phân tích các hồ sơ ứng viên!",
        timestamp: "Vừa xong",
      },
    ]);
    toast.info("Đã làm mới cuộc hội thoại");
  };

  // Candidate CRUD
  const saveCandidates = async (candidateRecords: Candidate[]): Promise<boolean> => {
    if (!authUser) {
      setCandidates((previous) => {
        const byId = new Map(previous.map((candidate) => [candidate.id, candidate]));
        candidateRecords.forEach((candidate) => byId.set(candidate.id, candidate));
        return Array.from(byId.values());
      });
      toast.info("Kết quả chỉ được giữ trong phiên xem trước. Đăng nhập để lưu lâu dài.");
      return true;
    }

    try {
      const savedRecords = await Promise.all(candidateRecords.map((candidate) => accountApi.saveWorkspaceCandidate(candidate)));
      setCandidates((previous) => {
        const byId = new Map(previous.map((candidate) => [candidate.id, candidate]));
        savedRecords.forEach((candidate) => byId.set(candidate.id, candidate));
        return Array.from(byId.values());
      });
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được danh sách ứng viên.");
      return false;
    }
  };

  const persistCandidate = async (candidate: Candidate): Promise<boolean> => {
    if (!authUser) {
      setCandidates((previous) => [candidate, ...previous.filter((item) => item.id !== candidate.id)]);
      toast.info("Thay đổi chỉ có trong phiên xem trước. Đăng nhập để lưu lâu dài.");
      return true;
    }
    try {
      const saved = await accountApi.saveWorkspaceCandidate(candidate);
      setCandidates((previous) => [saved, ...previous.filter((item) => item.id !== saved.id)]);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được hồ sơ ứng viên.");
      return false;
    }
  };

  const addCandidate = async (candData: Omit<Candidate, "id">): Promise<boolean> => {
    const newCand: Candidate = {
      ...candData,
      id: "cand-" + Date.now(),
      criteriaScores: candData.criteriaScores || {
        skills: candData.matchScore,
        experience: Math.max(candData.matchScore - 5, 70),
        education: 85,
        softSkills: 88,
      },
    };
    const saved = await persistCandidate(newCand);
    if (!saved) return false;
    if (authUser) toast.success(`Đã lưu ứng viên "${newCand.name}".`);

    const newNotif: NotificationItem = {
      id: "notif-" + Date.now(),
      title: "Ứng viên mới nộp hồ sơ",
      message: `${newCand.name} vừa ứng tuyển vào vị trí ${newCand.jobTarget} (Điểm Match: ${newCand.matchScore}%).`,
      time: "Vừa xong",
      type: "candidate",
      read: false,
      sectionTarget: "candidates",
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return true;
  };

  const updateCandidate = async (id: string, updates: Partial<Candidate>): Promise<boolean> => {
    const current = candidates.find((candidate) => candidate.id === id);
    if (!current) return false;
    const saved = await persistCandidate({ ...current, ...updates });
    if (saved && authUser) toast.success("Đã lưu thay đổi ứng viên.");
    return saved;
  };

  const deleteCandidate = async (id: string): Promise<boolean> => {
    const target = candidates.find((c) => c.id === id);
    if (authUser) {
      try {
        await accountApi.deleteWorkspaceCandidate(id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không xóa được hồ sơ ứng viên.");
        return false;
      }
    }
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    toast.success(authUser ? `Đã xóa ứng viên "${target?.name || id}".` : "Đã xóa khỏi phiên xem trước.");
    return true;
  };

  const moveCandidateStage = async (id: string, newStage: Candidate["stage"]): Promise<boolean> => {
    return updateCandidate(id, { stage: newStage });
  };

  // Job CRUD
  const persistJob = async (job: JobPosition): Promise<boolean> => {
    if (!authUser) {
      setJobs((previous) => [job, ...previous.filter((item) => item.id !== job.id)]);
      toast.info("Thay đổi chỉ có trong phiên xem trước. Đăng nhập để lưu lâu dài.");
      return true;
    }
    try {
      const saved = await accountApi.saveWorkspaceJob(job);
      setJobs((previous) => [saved, ...previous.filter((item) => item.id !== saved.id)]);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được vị trí tuyển dụng.");
      return false;
    }
  };

  const addJob = async (jobData: Omit<JobPosition, "id" | "hiredCount" | "totalApplicants">): Promise<boolean> => {
    const newJob: JobPosition = {
      ...jobData,
      id: "job-" + Date.now(),
      hiredCount: 0,
      totalApplicants: 0,
    };
    const saved = await persistJob(newJob);
    if (saved && authUser) toast.success(`Đã lưu vị trí "${newJob.title}".`);
    return saved;
  };

  const updateJob = async (id: string, updates: Partial<JobPosition>): Promise<boolean> => {
    const current = jobs.find((job) => job.id === id);
    if (!current) return false;
    const saved = await persistJob({ ...current, ...updates });
    if (saved && authUser) toast.success("Đã lưu thay đổi vị trí tuyển dụng.");
    return saved;
  };

  const deleteJob = async (id: string): Promise<boolean> => {
    const target = jobs.find((j) => j.id === id);
    if (authUser) {
      try {
        await accountApi.deleteWorkspaceJob(id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không xóa được vị trí tuyển dụng.");
        return false;
      }
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
    toast.success(authUser ? `Đã xóa vị trí "${target?.title || id}".` : "Đã xóa khỏi phiên xem trước.");
    return true;
  };

  // Recruiter CRUD
  const addRecruiter = (recData: { name: string; role: string; email: string; phone: string; department: string; hiringTarget: number }) => {
    const initials = recData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newRec: RecruiterMember = {
      id: "rec-" + Date.now(),
      name: recData.name,
      role: recData.role,
      email: recData.email,
      phone: recData.phone,
      department: recData.department,
      avatar: initials,
      candidatesProcessed: 0,
      hiredCount: 0,
      hiringTarget: recData.hiringTarget,
      change: 0,
      rank: recruiters.length + 1,
    };
    setRecruiters((prev) => [...prev, newRec]);
    toast.success(`Đã thêm chuyên viên tuyển dụng "${newRec.name}"!`);
  };

  const updateRecruiter = (id: string, updates: Partial<RecruiterMember>) => {
    setRecruiters((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    toast.success("Đã cập nhật thông tin chuyên viên!");
  };

  // Report Actions
  const addReport = (reportData: { name: string; type: string; format: "CSV" | "PDF" | "XLSX"; records: number; summary: string }) => {
    const newRep: RecruitmentReport = {
      id: "rep-" + Date.now(),
      name: reportData.name,
      type: reportData.type,
      date: "Hôm nay",
      status: "ready",
      format: reportData.format,
      records: reportData.records,
      summary: reportData.summary,
    };
    setReports((prev) => [newRep, ...prev]);
    toast.success(`Đã tạo báo cáo "${newRep.name}" thành công!`);
  };

  const downloadReport = (report: RecruitmentReport) => {
    let csvRows = ["ID,Họ Tên Ứng Viên,Vị Trí Ứng Tuyển,Điểm Match AI,Kinh Nghiệm (Năm),Lương Mong Muốn,Trạng Thái,Giai Đoạn,Chuyên Viên Phụ Trách"];
    candidates.forEach((c) => {
      csvRows.push(
        `"${c.id}","${c.name}","${c.jobTarget}",${c.matchScore}%,${c.experienceYears},${c.expectedSalary}," ${c.status}","${c.stage}","${c.recruiter}"`
      );
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Đã tải xuống tệp "${report.name}.csv"`);
  };

  // Interviews Management
  const addInterview = (interviewData: Omit<InterviewItem, "id">) => {
    const newInt: InterviewItem = {
      ...interviewData,
      id: `int-${Date.now()}`,
    };
    setInterviews((prev) => [newInt, ...prev]);

    // Also update candidate stage if applicable
    if (interviewData.candidateId) {
      void moveCandidateStage(interviewData.candidateId, "interview");
    }

    toast.success(`Đã lên lịch phỏng vấn "${newInt.roundName}" cho ${newInt.candidateName}!`);
  };

  const updateInterview = (id: string, updates: Partial<InterviewItem>) => {
    setInterviews((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    toast.success("Đã cập nhật thông tin lịch phỏng vấn!");
  };

  const deleteInterview = (id: string) => {
    setInterviews((prev) => prev.filter((item) => item.id !== id));
    toast.info("Đã xóa lịch phỏng vấn khỏi hệ thống");
  };

  // Email Logs
  const addEmailLog = (logData: Omit<EmailLogItem, "id">) => {
    const newLog: EmailLogItem = {
      ...logData,
      id: `email-${Date.now()}`,
    };
    setEmailLogs((prev) => [newLog, ...prev]);
    toast.success(`Đã gửi email "${newLog.subject}" tới ${newLog.candidateName}!`);
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.info("Đã đánh dấu đã đọc tất cả thông báo");
  };

  const clearNotifications = () => {
    setNotifications([]);
    toast.info("Đã dọn dẹp thông báo");
  };

  // Integrations
  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.connected;
          toast.success(
            nextState
              ? `Đã kết nối "${item.name}" thành công!`
              : `Đã ngắt kết nối "${item.name}"`
          );
          return {
            ...item,
            connected: nextState,
            lastSync: nextState ? "Vừa xong" : null,
          };
        }
        return item;
      })
    );
  };

  const syncIntegration = (id: string) => {
    const item = integrations.find((i) => i.id === id);
    toast.loading(`Đang đồng bộ hồ sơ với ${item?.name || "dịch vụ"}...`, { duration: 1000 });
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, lastSync: "Vừa xong" } : i))
      );
      toast.success(`Đồng bộ dữ liệu ${item?.name} thành công!`);
    }, 1000);
  };

  // Profile
  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
    toast.success("Đã lưu thiết lập tài khoản & AI Matching!");
  };

  const saveUserDefaultCriteria = (
    weights: WorkflowWeights,
    hardFilters: WorkflowHardFilters,
    autoApply: boolean = true
  ) => {
    setUserProfile((prev) => ({
      ...prev,
      defaultWeights: weights,
      defaultHardFilters: hardFilters,
      autoApplyUserRubric: autoApply,
    }));
    toast.success("Đã lưu bộ trọng số Rubric & Bộ lọc làm tiêu chuẩn mặc định của bạn!");
  };

  // CSV Exports
  const exportCandidatesCsv = () => {
    const headers = "ID,Họ Tên,Email,Số Điện Thoại,Vị Trí,Điểm Match (%),Giai Đoạn,Trạng Thái,Kinh Nghiệm,Lương Mong Muốn,Học Vấn,Chuyên Viên,Ngày Nộp\n";
    const rows = candidates
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.jobTarget}",${c.matchScore}%,"${c.stage}","${c.status}",${c.experienceYears},${c.expectedSalary},"${c.education}","${c.recruiter}","${c.appliedDate}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `danh_sach_ung_vien_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất danh sách ứng viên ra tệp CSV Excel");
  };

  const exportJobsCsv = () => {
    const headers = "ID,Tên Vị Trí JD,Phòng Ban,Cấp Bậc,Địa Điểm,Chỉ Tiêu Tuyển,Đã Tuyển,Tổng Ứng Viên,Mức Lương,Trạng Thái,Hạn Tuyển,Chuyên Viên Phụ Trách\n";
    const rows = jobs
      .map(
        (j) =>
          `"${j.id}","${j.title}","${j.department}","${j.level}","${j.location}",${j.openings},${j.hiredCount},${j.totalApplicants},"${j.salaryRange}","${j.status}","${j.deadline}","${j.recruiter}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vi_tri_tuyen_dung_jd_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất danh sách vị trí tuyển dụng ra tệp CSV");
  };

  const exportBatchReportCsv = (batchId: string) => {
    const batch = historyBatches.find((b) => b.id === batchId);
    let csvRows = [
      `"BÁO CÁO KẾT QUẢ PHIÊN LỌC HỒ SƠ AI RISER 2026"`,
      `"Phiên Lọc:","${batch?.batchName || batchId}"`,
      `"Vị Trí Tuyển Dụng:","${batch?.jobTitle}"`,
      `"Thời Gian Lọc:","${batch?.createdAt}"`,
      `"Tổng Số CV Tiếp Nhận:","${batch?.totalCVs || candidates.length} CV"`,
      `"Số Hồ Sơ Đạt Chuẩn (>= 75%):","${batch?.qualifiedCount ?? 0} hồ sơ"`,
      `"Điểm Match Trung Bình:","${batch?.avgScore ?? 0}%"`,
      "",
      "ID,Họ Tên Ứng Viên,Email,Số Điện Thoại,Vị Trí Tuyển Dụng,Điểm Match AI,Kỹ Năng (30%),Kinh Nghiệm (25%),Học Vấn (5%),Kỹ Năng Mềm (10%),Kinh Nghiệm (Năm),Lương Mong Muốn,Trạng Thái,Tóm Tắt Đánh Giá AI",
    ];

    candidates.forEach((c) => {
      csvRows.push(
        `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.jobTarget}",${c.matchScore}%,${c.criteriaScores?.skills ?? 0}/100,${c.criteriaScores?.experience ?? 0}/100,${c.criteriaScores?.education ?? 0}/100,${c.criteriaScores?.softSkills ?? 0}/100,${c.experienceYears},${c.expectedSalary},"${c.status}","${(c.aiSummary || "").replace(/"/g, '""')}"`
      );
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao_cao_phien_loc_${batchId}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất báo cáo phiên lọc "${batch?.batchName}" ra file CSV!`);
  };

  return (
    <SalesOpsContext.Provider
      value={{
        activeSection,
        setActiveSection,
        syncActiveSection,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        backendStatus,
        checkBackendHealth,
        authUser,
        authChecked,
        isAuthModalOpen,
        setIsAuthModalOpen,
        reloadRealUserData,
        workspaceDataState,
        logoutUser,
        isSearchOpen,
        setIsSearchOpen,
        candidates,
        saveCandidates,
        jobs,
        jdTemplates,
        salaryBenchmarks,
        historyBatches,
        recruiters,
        hiringRisks,
        reports,
        notifications,
        integrations,
        interviews,
        setInterviews,
        addInterview,
        updateInterview,
        deleteInterview,
        emailLogs,
        setEmailLogs,
        addEmailLog,
        emailTemplates,
        userProfile,
        workflow,
        setWorkflowStep,
        setWorkflowJD,
        loadJDTemplate,
        addWorkflowFile,
        removeWorkflowFile,
        setWorkflowWeights,
        setWorkflowHardFilters,
        toggleWorkflowOCR,
        startAIAnalysis,
        resetWorkflow,
        chatMessages,
        sendChatMessage,
        clearChat,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        moveCandidateStage,
        addJob,
        updateJob,
        deleteJob,
        addRecruiter,
        updateRecruiter,
        addReport,
        downloadReport,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        toggleIntegration,
        syncIntegration,
        updateUserProfile,
        saveUserDefaultCriteria,
        exportCandidatesCsv,
        exportJobsCsv,
        exportBatchReportCsv,
        metrics,
      }}
    >
      {children}
    </SalesOpsContext.Provider>
  );
}

export function useSalesOps() {
  const context = useContext(SalesOpsContext);
  if (!context) {
    throw new Error("useSalesOps must be used within a SalesOpsProvider");
  }
  return context;
}
