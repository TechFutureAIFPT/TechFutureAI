"use client";

import { useState, useRef } from "react";
import {
  useSalesOps,
  type WorkflowSubWeights,
  defaultStandardSubWeights,
} from "@/lib/sales-ops-context";
import { type Candidate } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Sliders,
  Sparkles,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Calendar,
  Mail,
  Zap,
  Briefcase,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Server,
  Filter,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Wand2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CandidateDetailModal } from "@/components/dashboard/modals/candidate-detail-modal";
import { InterviewModal } from "@/components/dashboard/modals/interview-modal";
import { EmailModal } from "@/components/dashboard/modals/email-modal";
import { toast } from "sonner";
import { ai, files } from "@/lib/api-endpoints";
import { criterionPercentage, mapAnalysisResult } from "@/lib/mappers";
import { GoogleDrivePicker } from "./google-drive-picker";

export function MatchWorkflowSection() {
  const {
    workflow,
    setWorkflowStep,
    setWorkflowJD,
    loadJDTemplate,
    addWorkflowFile,
    removeWorkflowFile,
    setWorkflowWeights,
    setWorkflowHardFilters,
    toggleWorkflowOCR,
    resetWorkflow,
    jdTemplates,
    candidates,
    saveCandidates,
    authUser,
    exportCandidatesCsv,
    backendStatus,
    userProfile,
    saveUserDefaultCriteria,
  } = useSalesOps();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jdTitleInput, setJdTitleInput] = useState(workflow.jdTitle);
  const [jdContentInput, setJdContentInput] = useState(workflow.jdContent);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // AI Assistant processing states
  const [isStructuringJd, setIsStructuringJd] = useState(false);
  const [isDetectingPosition, setIsDetectingPosition] = useState(false);
  const [isSuggestingFilters, setIsSuggestingFilters] = useState(false);
  const [isExtractingFiles, setIsExtractingFiles] = useState(false);

  // Live Analysis Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLiveRunning, setIsLiveRunning] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Sub-weights state
  const [subWeights, setSubWeights] = useState<WorkflowSubWeights>(
    userProfile.defaultSubWeights || defaultStandardSubWeights
  );

  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({
    role_skills: false,
    experience: false,
    job_fit: false,
    impact: false,
    soft_skills: false,
    education: false,
  });

  const toggleExpand = (criterion: string) => {
    setExpandedCriteria((prev) => ({
      ...prev,
      [criterion]: !prev[criterion],
    }));
  };

  const handleSubWeightChange = <
    T extends keyof WorkflowSubWeights,
    K extends keyof WorkflowSubWeights[T]
  >(
    parentKey: T,
    subKey: K,
    val: number
  ) => {
    const updatedSub = {
      ...subWeights,
      [parentKey]: {
        ...subWeights[parentKey],
        [subKey]: val,
      },
    };
    setSubWeights(updatedSub);

    // Sync parent weight to sum of sub weights
    const parentValues = Object.values(updatedSub[parentKey]) as number[];
    const newParentTotal = parentValues.reduce((a, b) => a + b, 0);
    setWorkflowWeights({
      ...workflow.weights,
      [parentKey]: newParentTotal,
      subWeights: updatedSub,
    });
  };

  // Action: Structure JD via POST /api/jd/structure
  const handleStructureJd = async () => {
    if (!jdContentInput.trim()) {
      toast.error("Vui lòng nhập nội dung JD trước khi chuẩn hóa");
      return;
    }
    setIsStructuringJd(true);
    const toastId = toast.loading("AI đang phân tích và chuẩn hóa cấu trúc JD...");
    try {
      const res = await ai.structureJd(jdContentInput);
      if (res && res.structured_text) {
        setJdContentInput(res.structured_text);
        toast.success("Đã chuẩn hóa cấu trúc JD thành công!", { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch {
      toast.error("Chưa chuẩn hóa được mô tả công việc. Vui lòng kiểm tra kết nối model và thử lại.", { id: toastId });
    } finally {
      setIsStructuringJd(false);
    }
  };

  // Action: Detect Position via POST /api/jd/position
  const handleDetectPosition = async () => {
    if (!jdContentInput.trim()) {
      toast.error("Vui lòng nhập nội dung JD");
      return;
    }
    setIsDetectingPosition(true);
    const toastId = toast.loading("AI đang nhận diện chức danh vị trí...");
    try {
      const res = await ai.detectPosition(jdContentInput);
      if (res && res.job_position) {
        setJdTitleInput(res.job_position);
        toast.success(`Đã nhận diện chức danh: "${res.job_position}"`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch {
      toast.dismiss(toastId);
    } finally {
      setIsDetectingPosition(false);
    }
  };

  // Action: Suggest Hard Filters via POST /api/jd/hard-filters
  const handleSuggestHardFilters = async () => {
    if (!jdContentInput.trim() && !jdTitleInput.trim()) {
      toast.error("Vui lòng nhập nội dung hoặc tên vị trí JD");
      return;
    }
    setIsSuggestingFilters(true);
    const toastId = toast.loading("AI đang trích xuất các điều kiện cứng từ JD...");
    try {
      const res = await ai.suggestHardFilters(jdContentInput || jdTitleInput);
      if (res && res.filters) {
        const f = res.filters;
        setWorkflowHardFilters({
          minExp: Number(f.minExp ?? f.min_exp ?? 0),
          education: String(f.education ?? ""),
          location: String(f.location ?? ""),
          seniority: String(f.seniority ?? ""),
          languageLevel: String(f.languageLevel ?? ""),
          workFormat: String(f.workFormat ?? ""),
          contractType: String(f.contractType ?? ""),
        });
        toast.success("Đã nạp các tiêu chí cứng được AI đề xuất!", { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch {
      toast.error("Chưa trích xuất được điều kiện từ JD. Các thiết lập hiện tại được giữ nguyên.", { id: toastId });
    } finally {
      setIsSuggestingFilters(false);
    }
  };

  // Action: Real File Upload with OCR via POST /api/files/extract-text
  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;
    if (workflow.uploadedFiles.length + filesList.length > 20) {
      toast.error("Mỗi phiên phân tích hỗ trợ tối đa 20 hồ sơ. Vui lòng chia thành nhiều phiên.");
      e.target.value = "";
      return;
    }

    setIsExtractingFiles(true);
    const toastId = toast.loading(`Đang trích xuất ${filesList.length} tệp hồ sơ (OCR: ${workflow.enableOCR ? "Bật" : "Tắt"})...`);
    let extractedCount = 0;
    const failedFiles: string[] = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";

      try {
        const extracted = await files.extractText(file, { forceOcr: workflow.enableOCR });
        if (!extracted.extracted_text?.trim()) throw new Error("Không trích xuất được văn bản từ tệp.");
        addWorkflowFile({
          name: file.name,
          size: sizeStr,
          type: ext,
          rawText: extracted.extracted_text,
        });
        extractedCount++;
      } catch {
        failedFiles.push(file.name);
      }
    }
    setIsExtractingFiles(false);
    if (failedFiles.length) {
      toast.error(`Đã trích xuất ${extractedCount}/${filesList.length} tệp. Không thể đọc: ${failedFiles.join(", ")}. Hãy kiểm tra tệp hoặc thử lại.`, { id: toastId });
    } else {
      toast.success(`Đã trích xuất ${extractedCount} hồ sơ.`, { id: toastId });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Radar data for top 2 candidates
  const topTwo = [...candidates].sort((left, right) => right.matchScore - left.matchScore).slice(0, 2);
  const radarData = [
    {
      subject: "Kỹ năng (Skills)",
      A: topTwo[0]?.criteriaScores?.skills ?? 0,
      B: topTwo[1]?.criteriaScores?.skills ?? 0,
      fullMark: 100,
    },
    {
      subject: "Kinh nghiệm (Exp)",
      A: topTwo[0]?.criteriaScores?.experience ?? 0,
      B: topTwo[1]?.criteriaScores?.experience ?? 0,
      fullMark: 100,
    },
    {
      subject: "Học vấn (Edu)",
      A: topTwo[0]?.criteriaScores?.education ?? 0,
      B: topTwo[1]?.criteriaScores?.education ?? 0,
      fullMark: 100,
    },
    {
      subject: "Kỹ năng mềm (Soft)",
      A: topTwo[0]?.criteriaScores?.softSkills ?? 0,
      B: topTwo[1]?.criteriaScores?.softSkills ?? 0,
      fullMark: 100,
    },
  ];

  const handleSaveStep1 = () => {
    if (!jdTitleInput.trim() || !jdContentInput.trim()) {
      toast.error("Vui lòng nhập tên vị trí và nội dung mô tả công việc.");
      return;
    }
    const lines = jdContentInput.split("\n").filter((l) => l.trim().startsWith("-"));
    const reqs = lines.length > 0 ? lines.map((l) => l.replace(/^-\s*/, "")) : jdContentInput.split("\n").map((line) => line.trim()).filter(Boolean);

    setWorkflowJD({
      title: jdTitleInput,
      content: jdContentInput,
      requirements: reqs,
    });
    setWorkflowStep(2);
  };

  const handleSimulateFileUpload = () => {
    const sampleNames = [
      "CV_HoangGiaBao_Senior_Developer.pdf",
      "CV_VuThiNgocAnh_Lead_Specialist.pdf",
      "CV_DoMinhTri_Software_Engineer.docx",
    ];
    const picked = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    addWorkflowFile({
      name: picked,
      size: "2.1 MB",
      type: picked.endsWith(".pdf") ? "PDF" : "DOCX",
      rawText: `${picked} - Ứng viên nhiều năm kinh nghiệm chuyên môn, có bằng cấp chính quy và thành tích tốt.`,
    });
  };

  const handleStartRealAnalysisJob = async () => {
    if (isExtractingFiles || !workflow.uploadedFiles.length || workflow.uploadedFiles.some((file) => !file.rawText?.trim())) {
      toast.error("Cần ít nhất một hồ sơ đã trích xuất văn bản trước khi phân tích.");
      return;
    }
    setLiveError(null);
    setWorkflowStep(4);
    setIsLiveRunning(true);
    setLiveProgress(10);
    const logs: string[] = [
      `[00:01] Khởi tạo phiên phân tích đối chiếu AI CV Match Engine...`,
      `[00:02] Chuẩn bị tệp dữ liệu: ${workflow.uploadedFiles.length} hồ sơ CV...`,
    ];
    setLiveLogs([...logs]);
    const toastId = toast.loading("Đang gửi yêu cầu phân tích dữ liệu...");

    try {
      // Build CoreCvAnalysisRequest payload
      const cvEntries = workflow.uploadedFiles.map((f) => ({
        file_name: f.name,
        text: f.rawText!,
        cv_id: f.id,
      }));

      // Call POST /api/analysis/jobs with authoritative weights & hard_filters
      const jobAccepted = await ai.createAnalysisJob({
        jd_text: workflow.jdContent || workflow.jdTitle,
        weights: {
          job_fit: workflow.weights.job_fit,
          role_skills: workflow.weights.role_skills,
          experience: workflow.weights.experience,
          impact: workflow.weights.impact,
          education: workflow.weights.education,
          soft_skills: workflow.weights.soft_skills,
        },
        hard_filters: {
          location: workflow.hardFilters.location,
          locationMandatory: workflow.hardFilters.locationMandatory,
          minExp: workflow.hardFilters.minExp,
          minExpMandatory: workflow.hardFilters.minExpMandatory,
          seniority: workflow.hardFilters.seniority,
          education: workflow.hardFilters.education,
          educationMandatory: workflow.hardFilters.educationMandatory,
          language: workflow.hardFilters.language,
          languageLevel: workflow.hardFilters.languageLevel,
          workFormat: workflow.hardFilters.workFormat,
          contractType: workflow.hardFilters.contractType,
          majorGroups: workflow.hardFilters.majorGroups,
          majorMandatory: workflow.hardFilters.majorMandatory,
          age: workflow.hardFilters.age,
          ageMandatory: workflow.hardFilters.ageMandatory,
        },
        cv_entries: cvEntries,
      });

      if (jobAccepted && jobAccepted.job_id) {
        setJobId(jobAccepted.job_id);
        logs.push(`[00:03] Job ID khởi tạo thành công: ${jobAccepted.job_id} (Status: ${jobAccepted.status})`);
        logs.push(`[00:04] Máy chủ đang đối chiếu hồ sơ theo tiêu chí đánh giá...`);
        setLiveLogs([...logs]);
        setLiveProgress(45);

        // Poll job status
        let attempts = 0;
        let polling = false;
        let failures = 0;
        const interval = setInterval(async () => {
          if (polling) return;
          polling = true;
          attempts++;
          try {
            if (attempts > 400) throw new Error("Hết thời gian chờ kết quả.");
            const statusRes = await ai.analysisStatus(jobAccepted.job_id);
            failures = 0;
            const progress = Number(statusRes.progress) || 0;
            setLiveProgress(Math.min(95, Math.max(10, progress <= 1 ? progress * 100 : progress)));

            if (statusRes.status === "completed") {
              clearInterval(interval);
              if (!statusRes.result?.candidates?.length) {
                const message = "Máy chủ hoàn tất nhưng chưa trả về kết quả ứng viên hợp lệ.";
                setLiveError(message);
                setIsLiveRunning(false);
                toast.error(message, { id: toastId });
                return;
              }
              logs.push(`[00:06] Hoàn tất chấm điểm toàn bộ ${cvEntries.length} hồ sơ ứng viên!`);
              logs.push(`[00:07] Nhận ma trận đối sánh, điểm mạnh, điểm yếu và câu hỏi phỏng vấn.`);
              setLiveLogs([...logs]);
              setLiveProgress(100);
              setIsLiveRunning(false);

              if (statusRes.result) {
                const mapped = mapAnalysisResult(statusRes.result);
                if (mapped.candidates && mapped.candidates.length > 0) {
                  const realCands: import("@/lib/mock-data").Candidate[] = mapped.candidates.map((c, idx) => ({
                    id: `cand-ai-${Date.now()}-${idx}`,
                    sourceBatchId:
                      mapped.savedHistoryId ??
                      (typeof statusRes.result?.pipeline?.historyId === "string"
                        ? statusRes.result.pipeline.historyId
                        : jobAccepted.job_id),
                    name: c.candidateName || `Ứng viên #${idx + 1}`,
                    email: c.email || "",
                    phone: c.phone || "",
                    jobTarget: workflow.jdTitle,
                    matchScore: c.hrSummary.tong_diem_phu_hop ?? c.analysis.total_score ?? 0,
                    stage: ((c.hrSummary.tong_diem_phu_hop ?? c.analysis.total_score ?? 0) >= 75 ? "qualified" : "screening"),
                    status: (c.hardFilterFailureReason ? "rejected" : "active"),
                    skills: c.hrSummary.danh_gia_ky_nang.map((s) => s.ten_ky_nang) || ["Chuyên môn", "Kỹ năng"],
                    experienceYears: parseFloat(c.hrSummary.kinh_nghiem.so_nam_thuc_te) || 0,
                    education: "Chưa xác định",
                    location: c.detectedLocation || "Chưa xác định",
                    expectedSalary: 0,
                    appliedDate: "Hôm nay",
                    recruiter: "Chuyên viên Tuyển dụng",
                    resumeUrl: "#",
                    aiSummary: c.hrSummary.nhan_xet_tong_quan || "Chưa có nhận xét tổng quan.",
                    criteriaScores: {
                      skills: criterionPercentage(c.analysis.details, "Kỹ năng chuyên môn"),
                      experience: criterionPercentage(c.analysis.details, "Kinh nghiệm"),
                      education: criterionPercentage(c.analysis.details, "Học vấn"),
                      softSkills: criterionPercentage(c.analysis.details, "Kỹ năng mềm"),
                    },
                    strengths: c.analysis.strengths || [],
                    weaknesses: c.analysis.weaknesses || [],
                    interviewQuestions: c.analysis.interview_questions || [],
                  }));
                  const persisted = await saveCandidates(realCands);
                  if (!persisted && authUser) {
                    toast.warning("Phân tích đã xong nhưng chưa lưu được danh sách ứng viên. Hãy thử tải lại sau.");
                  }
                }
              }

              setWorkflowStep(5);
              toast.success("Phân tích AI từ máy chủ hoàn tất!", { id: toastId });
            } else if (statusRes.status === "failed") {
              clearInterval(interval);
              logs.push(`[!] Lỗi từ máy chủ: ${statusRes.error || "Không thể hoàn thành job"}`);
              setLiveLogs([...logs]);
              setIsLiveRunning(false);
              setLiveError(statusRes.error || "Không thể hoàn thành phiên phân tích.");
              toast.error(statusRes.error || "Phân tích thất bại. Hãy kiểm tra kết nối và thử lại.", { id: toastId });
            }
          } catch {
            failures++;
            if (failures >= 3) {
              clearInterval(interval);
              setIsLiveRunning(false);
              setLiveError("Mất kết nối khi nhận kết quả. Không thể xác nhận phiên phân tích đã hoàn tất.");
              toast.error("Không thể nhận kết quả phân tích.", { id: toastId });
            }
          } finally {
            polling = false;
          }
        }, 1500);
        return;
      }
      throw new Error("Máy chủ chưa xác nhận phiên phân tích.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể kết nối dịch vụ phân tích.";
      logs.push(`[!] ${message}`);
      setLiveLogs([...logs]);
      setLiveError(message);
      setIsLiveRunning(false);
      toast.error(message, { id: toastId });
    }
  };

  const stepsList = [
    { num: 1, label: "Mô tả công việc", icon: FileText },
    { num: 2, label: "Tiêu chí đánh giá", icon: Sliders },
    { num: 3, label: "Tải hồ sơ", icon: Upload },
    { num: 4, label: "Phân tích AI", icon: Sparkles },
    { num: 5, label: "Kết quả đánh giá", icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Wizard Header Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {stepsList.map((step) => {
            const Icon = step.icon;
            const isActive = workflow.currentStep === step.num;
            const isCompleted = workflow.currentStep > step.num;

            return (
              <button
                key={step.num}
                aria-current={isActive ? "step" : undefined}
                aria-disabled={step.num > workflow.currentStep && workflow.currentStep !== 5}
                onClick={() => {
                  if (step.num <= workflow.currentStep || workflow.currentStep === 5) {
                    setWorkflowStep(step.num as 1 | 2 | 3 | 4 | 5);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-sky-600 text-white shadow-xs"
                    : isCompleted
                    ? "bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100"
                    : "text-muted-foreground hover:text-foreground opacity-60"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isCompleted
                      ? "bg-sky-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: JOB DESCRIPTION & TEMPLATES */}
      {workflow.currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      Mô tả công việc
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Nhập mô tả công việc hoặc dùng AI để đề xuất cấu trúc và tiêu chí đánh giá.
                    </CardDescription>
                  </div>
                  <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs w-fit">
                    Thiết lập yêu cầu
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* AI Assistant Quick Actions Bar */}
                <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-sky-900 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    Hỗ trợ AI:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStructureJd}
                    disabled={isStructuringJd}
                    className="text-xs h-7 px-2.5 bg-white border-sky-200 text-sky-700 hover:bg-sky-50 font-medium"
                  >
                    {isStructuringJd ? <RefreshCw className="w-3 h-3 animate-spin mr-1 text-sky-600" /> : <Wand2 className="w-3 h-3 mr-1 text-sky-600" />}
                    Chuẩn hóa nội dung
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectPosition}
                    disabled={isDetectingPosition}
                    className="text-xs h-7 px-2.5 bg-white border-sky-200 text-sky-700 hover:bg-sky-50 font-medium"
                  >
                    {isDetectingPosition ? <RefreshCw className="w-3 h-3 animate-spin mr-1 text-sky-600" /> : <Briefcase className="w-3 h-3 mr-1 text-sky-600" />}
                    Nhận diện chức danh
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSuggestHardFilters}
                    disabled={isSuggestingFilters}
                    className="text-xs h-7 px-2.5 bg-white border-sky-200 text-sky-700 hover:bg-sky-50 font-medium"
                  >
                    {isSuggestingFilters ? <RefreshCw className="w-3 h-3 animate-spin mr-1 text-sky-600" /> : <Filter className="w-3 h-3 mr-1 text-sky-600" />}
                    Đề xuất điều kiện
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <Label htmlFor="wf-jd-title" className="text-xs font-bold text-slate-800">Tên vị trí tuyển dụng *</Label>
                    <span className="text-[11px] text-muted-foreground">Ví dụ: Senior Frontend React/Next.js Engineer</span>
                  </div>
                  <Input
                    id="wf-jd-title"
                    value={jdTitleInput}
                    onChange={(e) => setJdTitleInput(e.target.value)}
                    placeholder="Ví dụ: Senior Frontend React/Next.js Engineer"
                    className="bg-slate-50/50 border-sky-100 font-semibold text-slate-900 focus:border-sky-500 focus:ring-sky-500 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <Label htmlFor="wf-jd-content" className="text-xs font-bold text-slate-800">Nội dung & yêu cầu công việc</Label>
                    <span className="text-[11px] text-muted-foreground">Định dạng markdown hoặc văn bản thuần</span>
                  </div>
                  <Textarea
                    id="wf-jd-content"
                    rows={10}
                    value={jdContentInput}
                    onChange={(e) => setJdContentInput(e.target.value)}
                    placeholder="Dán toàn bộ nội dung mô tả công việc, trách nhiệm và yêu cầu kỹ năng vào đây..."
                    className="bg-slate-50/50 border-sky-100 text-xs leading-relaxed font-mono focus:border-sky-500 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    Bạn có thể điều chỉnh nội dung trước khi tiếp tục.
                  </span>
                  <Button
                    onClick={handleSaveStep1}
                    className="bg-primary text-white hover:bg-primary/90 font-semibold text-xs shadow-xs"
                  >
                    Tiếp tục: Tiêu chí đánh giá
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* JD Template Library Picker */}
          <div className="space-y-4">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                    <Layers className="w-4 h-4 text-sky-600" />
                    Thư viện mô tả công việc
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 font-bold">
                    {jdTemplates.length} Mẫu
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Chọn một mẫu để điều chỉnh theo vị trí cần tuyển.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 pt-3">
                {jdTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      loadJDTemplate(tmpl.id);
                      setJdTitleInput(tmpl.title);
                      setJdContentInput(
                        `Mô tả công việc:\n${tmpl.description}\n\nYêu cầu ứng viên:\n${tmpl.requirements
                          .map((r) => `- ${r}`)
                          .join("\n")}`
                      );
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      workflow.selectedTemplateId === tmpl.id
                        ? "bg-sky-50 border-sky-500 text-slate-900 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="font-bold text-xs text-slate-900 line-clamp-1">
                        {tmpl.title}
                      </p>
                      <Badge variant="outline" className="text-[9px] shrink-0 border-sky-200 text-sky-700 bg-sky-50/60">
                        {tmpl.level}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                      {tmpl.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-sky-600 font-semibold pt-1 border-t border-slate-100">
                      <span>{tmpl.suggestedSalary}</span>
                      <span>Sử dụng mẫu &rarr;</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 2: RUBRIC WEIGHTS & HARD FILTERS CONFIGURATION */}
      {workflow.currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Authoritative 6 Rubric Weights (Total 100%) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                        <Sliders className="w-4 h-4 text-sky-600" />
                        Trọng số tiêu chí đánh giá
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Điều chỉnh trọng số của 6 nhóm tiêu chí. Tổng trọng số cần bằng 100%.
                      </CardDescription>
                    </div>

                    {(() => {
                      const total =
                        (workflow.weights.job_fit || 0) +
                        (workflow.weights.role_skills || 0) +
                        (workflow.weights.experience || 0) +
                        (workflow.weights.impact || 0) +
                        (workflow.weights.education || 0) +
                        (workflow.weights.soft_skills || 0);
                      const isValid = Math.abs(total - 100) < 0.05;
                      return (
                        <Badge
                          className={`text-xs font-bold shrink-0 ${
                            isValid
                              ? "bg-sky-50 text-sky-700 border-sky-300"
                              : "bg-destructive/10 text-destructive border-destructive/30"
                          }`}
                        >
                          Tổng: {total}% {isValid ? "✓ Hợp lệ" : "⚠ Chưa đủ 100%"}
                        </Badge>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  {/* Presets Row */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Bộ tiêu chí mẫu:
                      </span>
                      {userProfile.defaultWeights && (
                        <button
                          type="button"
                          onClick={() => {
                            if (userProfile.defaultWeights) setWorkflowWeights(userProfile.defaultWeights);
                            if (userProfile.defaultHardFilters) setWorkflowHardFilters(userProfile.defaultHardFilters);
                            toast.success("Đã áp dụng bộ tiêu chí & bộ lọc mặc định của bạn!");
                          }}
                          className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200"
                        >
                          <Zap className="w-3 h-3 text-sky-600" />
                          <span>Áp dụng tiêu chí đã lưu</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          name: "Chuẩn Cân Bằng (20-35-20-10-5-10)",
                          w: { job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 },
                        },
                        {
                          name: "Chuyên Sâu Kỹ năng (15-45-15-10-5-10)",
                          w: { job_fit: 15, role_skills: 45, experience: 15, impact: 10, education: 5, soft_skills: 10 },
                        },
                        {
                          name: "Ưu Tiên Kinh nghiệm (15-25-35-10-5-10)",
                          w: { job_fit: 15, role_skills: 25, experience: 35, impact: 10, education: 5, soft_skills: 10 },
                        },
                        {
                          name: "Quản Lý / Lead (20-20-25-15-5-15)",
                          w: { job_fit: 20, role_skills: 20, experience: 25, impact: 15, education: 5, soft_skills: 15 },
                        },
                        {
                          name: "Fresher / Junior (25-25-10-10-15-15)",
                          w: { job_fit: 25, role_skills: 25, experience: 10, impact: 10, education: 15, soft_skills: 15 },
                        },
                      ].map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => setWorkflowWeights(preset.w)}
                          className="text-[11px] h-6 px-2 border-slate-200 bg-slate-50/60 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300"
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 6 Sliders Grid with Sub-Weights Accordion */}
                  <div className="space-y-4 p-4 rounded-xl bg-sky-50/30 border border-sky-100">
                    {/* 1. Job Fit */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-sky-100/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">1. Phù hợp trực tiếp với JD (Job Fit)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand("job_fit")}
                            className="h-5 px-1.5 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded font-semibold"
                          >
                            {expandedCriteria.job_fit ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                <span>Thu gọn</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                <span>2 Trọng số con</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <span className="font-bold text-sky-700 text-sm">{workflow.weights.job_fit}%</span>
                      </div>
                      <Slider
                        value={[workflow.weights.job_fit]}
                        max={50}
                        min={5}
                        step={1}
                        onValueChange={(val) =>
                          setWorkflowWeights({ ...workflow.weights, job_fit: val[0] })
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Độ tương thích tổng quan giữa mục tiêu nghề nghiệp, vai trò và phạm vi công việc yêu cầu
                      </p>

                      {/* Sub-weights */}
                      {expandedCriteria.job_fit && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 bg-slate-50/80 p-2.5 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            Phân rã trọng số con (Tổng: {workflow.weights.job_fit}%)
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Khớp trách nhiệm công việc cốt lõi:</span>
                              <strong className="text-sky-700">{subWeights.job_fit.responsibilities}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.job_fit.responsibilities]}
                              max={25}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("job_fit", "responsibilities", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Tương đồng ngữ nghĩa Vector Embedding:</span>
                              <strong className="text-sky-700">{subWeights.job_fit.semantic_match}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.job_fit.semantic_match]}
                              max={25}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("job_fit", "semantic_match", val[0])}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Role Skills */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-sky-100/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">2. Kỹ năng chuyên môn theo vị trí (Role Skills)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand("role_skills")}
                            className="h-5 px-1.5 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded font-semibold"
                          >
                            {expandedCriteria.role_skills ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                <span>Thu gọn</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                <span>3 Trọng số con</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <span className="font-bold text-sky-700 text-sm">{workflow.weights.role_skills}%</span>
                      </div>
                      <Slider
                        value={[workflow.weights.role_skills]}
                        max={60}
                        min={10}
                        step={1}
                        onValueChange={(val) =>
                          setWorkflowWeights({ ...workflow.weights, role_skills: val[0] })
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Công nghệ lõi, framework, ngôn ngữ lập trình và kỹ năng chuyên sâu được kiểm chứng
                      </p>

                      {/* Sub-weights */}
                      {expandedCriteria.role_skills && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 bg-slate-50/80 p-2.5 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            Phân rã trọng số con (Tổng: {workflow.weights.role_skills}%)
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Công nghệ cốt lõi & Ngôn ngữ chính:</span>
                              <strong className="text-sky-700">{subWeights.role_skills.core_tech}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.role_skills.core_tech]}
                              max={35}
                              min={5}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("role_skills", "core_tech", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Frameworks & Công cụ phụ trợ:</span>
                              <strong className="text-sky-700">{subWeights.role_skills.frameworks_tools}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.role_skills.frameworks_tools]}
                              max={20}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("role_skills", "frameworks_tools", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Quy chuẩn thực thi / Testing / CI-CD:</span>
                              <strong className="text-sky-700">{subWeights.role_skills.best_practices}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.role_skills.best_practices]}
                              max={15}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("role_skills", "best_practices", val[0])}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Experience */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-sky-100/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">3. Kinh nghiệm & mức độ sở hữu (Experience)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand("experience")}
                            className="h-5 px-1.5 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded font-semibold"
                          >
                            {expandedCriteria.experience ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                <span>Thu gọn</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                <span>3 Trọng số con</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <span className="font-bold text-sky-700 text-sm">{workflow.weights.experience}%</span>
                      </div>
                      <Slider
                        value={[workflow.weights.experience]}
                        max={50}
                        min={5}
                        step={1}
                        onValueChange={(val) =>
                          setWorkflowWeights({ ...workflow.weights, experience: val[0] })
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Thâm niên thực chiến, độ phức tạp của dự án và mức độ đảm nhận trách nhiệm thực tế
                      </p>

                      {/* Sub-weights */}
                      {expandedCriteria.experience && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 bg-slate-50/80 p-2.5 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            Phân rã trọng số con (Tổng: {workflow.weights.experience}%)
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Tổng số năm kinh nghiệm thực tế:</span>
                              <strong className="text-sky-700">{subWeights.experience.total_years}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.experience.total_years]}
                              max={20}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("experience", "total_years", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Kinh nghiệm chuyên ngành / domain fit:</span>
                              <strong className="text-sky-700">{subWeights.experience.domain_exp}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.experience.domain_exp]}
                              max={15}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("experience", "domain_exp", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Mức độ làm chủ & Quản lý công việc (Ownership):</span>
                              <strong className="text-sky-700">{subWeights.experience.ownership}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.experience.ownership]}
                              max={15}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("experience", "ownership", val[0])}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Impact */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-sky-100/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">4. Dự án & kết quả định lượng (Impact)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand("impact")}
                            className="h-5 px-1.5 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded font-semibold"
                          >
                            {expandedCriteria.impact ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                <span>Thu gọn</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                <span>2 Trọng số con</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <span className="font-bold text-sky-700 text-sm">{workflow.weights.impact}%</span>
                      </div>
                      <Slider
                        value={[workflow.weights.impact]}
                        max={30}
                        min={0}
                        step={1}
                        onValueChange={(val) =>
                          setWorkflowWeights({ ...workflow.weights, impact: val[0] })
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Bằng chứng số liệu về hiệu quả kinh doanh, tối ưu hiệu năng hoặc quy mô người dùng
                      </p>

                      {/* Sub-weights */}
                      {expandedCriteria.impact && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 bg-slate-50/80 p-2.5 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            Phân rã trọng số con (Tổng: {workflow.weights.impact}%)
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Bằng chứng định lượng & chỉ số KPI:</span>
                              <strong className="text-sky-700">{subWeights.impact.quantified_kpis}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.impact.quantified_kpis]}
                              max={15}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("impact", "quantified_kpis", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Quy mô dự án & Độ phức tạp hệ thống:</span>
                              <strong className="text-sky-700">{subWeights.impact.project_scale}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.impact.project_scale]}
                              max={15}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("impact", "project_scale", val[0])}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. Education */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-sky-100/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">5. Học vấn & chứng chỉ liên quan (Education)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand("education")}
                            className="h-5 px-1.5 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded font-semibold"
                          >
                            {expandedCriteria.education ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                <span>Thu gọn</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                <span>2 Trọng số con</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <span className="font-bold text-sky-700 text-sm">{workflow.weights.education}%</span>
                      </div>
                      <Slider
                        value={[workflow.weights.education]}
                        max={25}
                        min={0}
                        step={1}
                        onValueChange={(val) =>
                          setWorkflowWeights({ ...workflow.weights, education: val[0] })
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Bằng cấp đại học, cao học và các chứng chỉ nghề nghiệp quốc tế chuyên ngành
                      </p>

                      {/* Sub-weights */}
                      {expandedCriteria.education && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 bg-slate-50/80 p-2.5 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            Phân rã trọng số con (Tổng: {workflow.weights.education}%)
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Bằng cấp & Chuyên ngành đào tạo:</span>
                              <strong className="text-sky-700">{subWeights.education.degree_major}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.education.degree_major]}
                              max={10}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("education", "degree_major", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Chứng chỉ chuyên môn nghề nghiệp:</span>
                              <strong className="text-sky-700">{subWeights.education.certificates}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.education.certificates]}
                              max={10}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("education", "certificates", val[0])}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 6. Soft Skills */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-sky-100/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">6. Kỹ năng phối hợp & độ tin cậy (Soft Skills)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand("soft_skills")}
                            className="h-5 px-1.5 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded font-semibold"
                          >
                            {expandedCriteria.soft_skills ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                <span>Thu gọn</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                <span>2 Trọng số con</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <span className="font-bold text-sky-700 text-sm">{workflow.weights.soft_skills}%</span>
                      </div>
                      <Slider
                        value={[workflow.weights.soft_skills]}
                        max={30}
                        min={0}
                        step={1}
                        onValueChange={(val) =>
                          setWorkflowWeights({ ...workflow.weights, soft_skills: val[0] })
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Kỹ năng giao tiếp, tinh thần đồng đội, tính nhất quán và mức độ minh bạch của hồ sơ
                      </p>

                      {/* Sub-weights */}
                      {expandedCriteria.soft_skills && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 bg-slate-50/80 p-2.5 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            Phân rã trọng số con (Tổng: {workflow.weights.soft_skills}%)
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Giao tiếp & Phối hợp liên phòng ban:</span>
                              <strong className="text-sky-700">{subWeights.soft_skills.communication}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.soft_skills.communication]}
                              max={15}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("soft_skills", "communication", val[0])}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700">• Độ tin cậy & Tính nhất quán hồ sơ:</span>
                              <strong className="text-sky-700">{subWeights.soft_skills.reliability}%</strong>
                            </div>
                            <Slider
                              value={[subWeights.soft_skills.reliability]}
                              max={15}
                              min={0}
                              step={1}
                              onValueChange={(val) => handleSubWeightChange("soft_skills", "reliability", val[0])}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Authoritative Hard Filters (Điều Kiện Bắt Buộc) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                    <Filter className="w-4 h-4 text-sky-600" />
                    Điều kiện bắt buộc
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Gắn cờ loại tự động (Eligibility Exclusion) nếu ứng viên không đáp ứng tiêu chuẩn cứng
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Min Experience */}
                  <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-900">1. Kinh nghiệm tối thiểu</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Bắt buộc loại:</span>
                        <Switch
                          checked={workflow.hardFilters.minExpMandatory}
                          onCheckedChange={(checked) =>
                            setWorkflowHardFilters({ minExpMandatory: checked })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={workflow.hardFilters.minExp}
                        onChange={(e) =>
                          setWorkflowHardFilters({ minExp: Number(e.target.value) || 0 })
                        }
                        className="bg-slate-50 border-sky-100 text-xs h-8 w-24 font-bold text-slate-900"
                      />
                      <span className="text-xs text-muted-foreground">năm kinh nghiệm thực tế</span>
                    </div>
                  </div>

                  {/* Education */}
                  <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-900">2. Trình độ học vấn</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Bắt buộc:</span>
                        <Switch
                          checked={workflow.hardFilters.educationMandatory}
                          onCheckedChange={(checked) =>
                            setWorkflowHardFilters({ educationMandatory: checked })
                          }
                        />
                      </div>
                    </div>
                    <Select
                      value={workflow.hardFilters.education}
                      onValueChange={(val) => setWorkflowHardFilters({ education: val })}
                    >
                      <SelectTrigger className="bg-slate-50 border-sky-100 text-xs h-8 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bachelor">Đại học / Kỹ sư (Bachelor)</SelectItem>
                        <SelectItem value="Master">Thạc sĩ (Master)</SelectItem>
                        <SelectItem value="Associate">Cao đẳng (Associate)</SelectItem>
                        <SelectItem value="PhD">Tiến sĩ (PhD)</SelectItem>
                        <SelectItem value="High School">THPT (High School)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-900">3. Địa điểm làm việc</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Bắt buộc:</span>
                        <Switch
                          checked={workflow.hardFilters.locationMandatory}
                          onCheckedChange={(checked) =>
                            setWorkflowHardFilters({ locationMandatory: checked })
                          }
                        />
                      </div>
                    </div>
                    <Input
                      value={workflow.hardFilters.location}
                      onChange={(e) => setWorkflowHardFilters({ location: e.target.value })}
                      placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng, Remote..."
                      className="bg-slate-50 border-sky-100 text-xs h-8"
                    />
                  </div>

                  {/* Seniority & Language */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-900">4. Cấp độ vị trí</Label>
                      <Select
                        value={workflow.hardFilters.seniority}
                        onValueChange={(val) => setWorkflowHardFilters({ seniority: val })}
                      >
                        <SelectTrigger className="bg-slate-50 border-sky-100 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Intern">Thực tập sinh (Intern)</SelectItem>
                          <SelectItem value="Junior">Junior (1-2 năm)</SelectItem>
                          <SelectItem value="Mid-level">Mid-level (2-4 năm)</SelectItem>
                          <SelectItem value="Senior">Senior (5+ năm)</SelectItem>
                          <SelectItem value="Lead">Lead / Quản lý</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-900">5. Ngoại ngữ yêu cầu</Label>
                      <Select
                        value={workflow.hardFilters.languageLevel}
                        onValueChange={(val) => setWorkflowHardFilters({ languageLevel: val })}
                      >
                        <SelectTrigger className="bg-slate-50 border-sky-100 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B1">Tiếng anh - b1 (giao tiếp)</SelectItem>
                          <SelectItem value="B2">Tiếng anh - B2 (độc lập)</SelectItem>
                          <SelectItem value="C1">Tiếng anh - c1 (chuyên sâu)</SelectItem>
                          <SelectItem value="C2">Tiếng anh - c2 (bản ngữ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Work Format & Contract */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-900">6. Hình thức làm việc</Label>
                      <Select
                        value={workflow.hardFilters.workFormat}
                        onValueChange={(val) => setWorkflowHardFilters({ workFormat: val })}
                      >
                        <SelectTrigger className="bg-slate-50 border-sky-100 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Onsite">Tại văn phòng (Onsite)</SelectItem>
                          <SelectItem value="Hybrid">Linh hoạt kết hợp (Hybrid)</SelectItem>
                          <SelectItem value="Remote">Làm việc từ xa (Remote)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-900">7. Loại hợp đồng</Label>
                      <Select
                        value={workflow.hardFilters.contractType}
                        onValueChange={(val) => setWorkflowHardFilters({ contractType: val })}
                      >
                        <SelectTrigger className="bg-slate-50 border-sky-100 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Toàn thời gian (Full-time)</SelectItem>
                          <SelectItem value="Part-time">Bán thời gian (Part-time)</SelectItem>
                          <SelectItem value="Contract">Thời vụ / Hợp đồng (Contract)</SelectItem>
                          <SelectItem value="Intern">Thực tập (Intern)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Policy Note Alert */}
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 flex items-start gap-2 text-xs text-foreground">
                    <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-sky-900">
                      <strong className="text-slate-900">Cách áp dụng điều kiện bắt buộc:</strong> Hồ sơ không đáp ứng điều kiện bắt buộc vẫn có điểm tham khảo và được đánh dấu để bạn xem xét.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* User Default Rubric & Criteria Quick Save Bar */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-white to-blue-50/50 border border-sky-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Lưu làm tiêu chí mặc định</span>
                  <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] font-bold">
                    Tự động áp dụng
                  </Badge>
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Lưu thiết lập 6 trọng số rubric và các điều kiện cứng hiện tại vào tài khoản để dùng lại tự động cho các JD sau mà không cần chỉnh lại.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => saveUserDefaultCriteria(workflow.weights, workflow.hardFilters, true)}
              className="text-xs font-bold bg-white text-sky-700 border-sky-300 hover:bg-sky-50 shrink-0 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
              <span>Lưu làm tiêu chí mặc định</span>
            </Button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <Button
              variant="outline"
              onClick={() => setWorkflowStep(1)}
              className="text-xs border-border"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Quay lại bước 1 (JD)
            </Button>
            <Button
              onClick={() => setWorkflowStep(3)}
              className="bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-xs px-5"
            >
              Tiếp tục: tải lên hồ sơ (CV)
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: BATCH CV UPLOAD & OCR */}
      {workflow.currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Hidden File Input for Real Uploading */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleRealFileUpload}
            multiple
            accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
            className="hidden"
          />

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                    <Upload className="w-4 h-4 text-sky-600" />
                    Tải hồ sơ ứng viên
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Hỗ trợ tệp PDF, word (.DOCX) hoặc ảnh quét hồ sơ (PNG, JPG) kèm trích xuất OCR tự động
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                    <span className="text-sky-900 font-medium">Tự động bật OCR (Trích xuất ảnh):</span>
                    <Switch
                      checked={workflow.enableOCR}
                      onCheckedChange={toggleWorkflowOCR}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex justify-end">
                <GoogleDrivePicker forceOcr={workflow.enableOCR} disabled={isExtractingFiles || isLiveRunning || workflow.uploadedFiles.length >= 20} onImport={(file) => {
                  addWorkflowFile({ name: file.fileName, size: `${(file.fileSize / 1048576).toFixed(1)} MB`, type: file.fileName.split(".").pop()?.toUpperCase() || "DRIVE", rawText: file.extractedText });
                  toast.success(`Đã nhập hồ sơ ${file.fileName} từ Google Drive.`);
                }} />
              </div>
              {/* Drag and Drop Zone with Real File Upload Trigger */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-sky-200 hover:border-sky-500 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-sky-50/30 hover:bg-sky-50/70 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-sky-100 flex items-center justify-center mx-auto mb-3 text-sky-600 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="font-bold text-sm text-slate-900">
                  Bấm để chọn hồ sơ CV từ máy tính
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Đã tải lên {workflow.uploadedFiles.length} tệp hồ sơ sẵn sàng cho phân tích AI
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-sky-600 text-white hover:bg-sky-700 text-xs shadow-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Chọn tệp từ máy tính
                  </Button>
                </div>
              </div>

              {/* Uploaded Files Table */}
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                    Danh Sách Tệp Hồ Sơ Chờ Phân Tích ({workflow.uploadedFiles.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-sky-600 hover:underline p-0 h-auto font-semibold"
                    >
                      + Tải thêm tệp
                    </Button>
                    <span className="text-slate-300">|</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSimulateFileUpload}
                      className="text-xs text-muted-foreground hover:underline p-0 h-auto"
                    >
                      + Nạp mẫu kiểm thử
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {workflow.uploadedFiles.map((file, fIdx) => (
                    <div
                      key={`${file.id}-${fIdx}-${file.name}`}
                      className="p-3 rounded-xl bg-white border border-sky-100 hover:border-sky-300 shadow-2xs flex items-center justify-between gap-2 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 font-bold text-[11px]">
                          {file.type}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {file.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-sky-600" />
                            {file.size} • Đã trích xuất
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Xóa tệp ${file.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWorkflowFile(file.id);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setWorkflowStep(2)}
                  className="text-xs border-border w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Quay lại bước 2 (trọng số rubric)
                </Button>
                <Button
                  onClick={handleStartRealAnalysisJob}
                  disabled={isExtractingFiles || isLiveRunning || workflow.uploadedFiles.length === 0}
                  className="bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-xs px-5 w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Bắt đầu phân tích & chấm điểm AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* STEP 4: LIVE AI ANALYSIS STATUS */}
      {workflow.currentStep === 4 && (
        <Card className="border-border bg-card shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Sparkles className="w-7 h-7" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              {liveError ? "Chưa thể hoàn tất phân tích" : "Đang tiến hành phân tích & chấm điểm bằng AI"}
            </CardTitle>
            <CardDescription className="text-xs">
              {liveError || "Mô hình AI đang đối chiếu hồ sơ theo trọng số và tiêu chí đã chọn."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-xl mx-auto py-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">Tiến độ phân tích AI:</span>
                <span className="font-bold text-sky-600">{liveProgress}%</span>
              </div>
              <div className="w-full h-3 bg-sky-50 rounded-full overflow-hidden border border-sky-100">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${liveProgress}%` }}
                />
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300 space-y-1.5 max-h-48 overflow-y-auto shadow-inner">
              {liveLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-sky-500 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <Button
                size="sm"
                disabled={isLiveRunning}
                onClick={() => setWorkflowStep(liveError ? 3 : 5)}
                className="bg-sky-600 text-white hover:bg-sky-700 text-xs font-semibold shadow-xs"
              >
                {liveError ? "Quay lại hồ sơ để thử lại" : "Xem kết quả xếp hạng →"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: MATCHING RESULTS & RADAR COMPARISON */}
      {workflow.currentStep === 5 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Top Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Kết quả xếp hạng & đánh giá chi tiết AI
                </h2>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs font-bold">
                  Hoàn Tất
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vị trí JD: <span className="font-semibold text-slate-900">{workflow.jdTitle}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={resetWorkflow}
                className="border-border text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1 text-sky-600" />
                Chạy đợt mới
              </Button>
              <Button
                size="sm"
                onClick={exportCandidatesCsv}
                className="bg-sky-600 text-white hover:bg-sky-700 text-xs shadow-xs font-bold"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Xuất báo cáo excel
              </Button>
            </div>
          </div>

          {/* Visual Analysis Row: Radar Chart + KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Radar Comparison Chart */}
            <Card className="lg:col-span-2 border-border bg-card shadow-xs">
              <CardHeader className="pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Biểu đồ radar so sánh top 2 ứng viên dẫn đầu
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-sky-700">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      {topTwo[0]?.name || "Ứng viên 1"}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      {topTwo[1]?.name || "Ứng viên 2"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#e0f2fe" />
                      <PolarAngleAxis
                        dataKey="subject"
                        stroke="#475569"
                        fontSize={12}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        stroke="#94a3b8"
                        fontSize={10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #bae6fd",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#0f172a",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Radar
                        name={topTwo[0]?.name || "Ứng viên 1"}
                        dataKey="A"
                        stroke="#0284c7"
                        fill="#0284c7"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name={topTwo[1]?.name || "Ứng viên 2"}
                        dataKey="B"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Summary Cards */}
            <div className="space-y-4">
              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900">
                    Tổng quan phiên đánh giá
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/50 border border-sky-100">
                      <span className="text-muted-foreground">Tổng số CV đã phân tích:</span>
                      <span className="font-bold text-slate-900">{candidates.length} hồ sơ</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/50 border border-sky-100">
                      <span className="text-muted-foreground">Đạt chuẩn đối chiếu (≥ 75%):</span>
                      <span className="font-bold text-sky-700">
                        {candidates.filter((c) => c.matchScore >= 75).length} ứng viên
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/50 border border-sky-100">
                      <span className="text-muted-foreground">Điểm Match cao nhất:</span>
                      <span className="font-bold text-sky-700">{candidates.length ? `${Math.max(...candidates.map((candidate) => candidate.matchScore))}/100` : "Chưa có kết quả"}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setInterviewCandidate(candidates[0]);
                      setInterviewModalOpen(true);
                    }}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700 text-xs mt-2 font-semibold shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Lên lịch phỏng vấn top 1
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Detailed Ranking Table */}
          <Card className="border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-sky-50/30">
              <CardTitle className="text-base font-bold text-slate-900">
                Bảng xếp hạng ứng viên theo điểm phù hợp
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-sky-50/60 border-b border-border text-slate-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Hạng</th>
                    <th className="py-3 px-4">Ứng viên</th>
                    <th className="py-3 px-4">Điểm phù hợp</th>
                    <th className="py-3 px-4">Kinh nghiệm</th>
                    <th className="py-3 px-4">Lương kỳ vọng</th>
                    <th className="py-3 px-4">Tóm tắt phân tích AI</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates.map((cand, idx) => (
                    <tr
                      key={`${cand.id}-${idx}`}
                      onClick={() => setSelectedCandidate(cand)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        #{idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-sm text-slate-900 hover:text-sky-600 transition-colors">
                          {cand.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {cand.education}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          className={`text-xs font-bold ${
                            cand.matchScore >= 85
                              ? "bg-sky-50 text-sky-700 border-sky-300"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          <Sparkles className="w-3 h-3 mr-1 text-sky-600" />
                          {cand.matchScore}%
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {cand.experienceYears} Năm
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {(cand.expectedSalary / 1000000).toFixed(0)} Triệu ₫
                      </td>

                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {cand.aiSummary || "Đạt chuẩn yêu cầu chuyên môn của vị trí."}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInterviewCandidate(cand);
                              setInterviewModalOpen(true);
                            }}
                            className="h-7 text-xs border-border hover:bg-sky-50 hover:text-sky-700"
                          >
                            <Calendar className="w-3 h-3 mr-1 text-sky-600" />
                            Phỏng Vấn
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmailCandidate(cand);
                              setEmailModalOpen(true);
                            }}
                            className="h-7 text-xs border-border hover:bg-sky-50 hover:text-sky-700"
                          >
                            <Mail className="w-3 h-3 mr-1 text-sky-600" />
                            Email
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(open) => !open && setSelectedCandidate(null)}
        onEdit={() => {}}
        onScheduleInterview={(c) => {
          setInterviewCandidate(c);
          setInterviewModalOpen(true);
        }}
        onSendEmail={(c) => {
          setEmailCandidate(c);
          setEmailModalOpen(true);
        }}
      />

      <InterviewModal
        open={interviewModalOpen}
        onOpenChange={setInterviewModalOpen}
        candidateName={interviewCandidate?.name}
        candidateEmail={interviewCandidate?.email}
        jobTitle={interviewCandidate?.jobTarget}
      />

      <EmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        recipientName={emailCandidate?.name}
        recipientEmail={emailCandidate?.email}
        jobTitle={emailCandidate?.jobTarget}
        matchScore={emailCandidate?.matchScore}
      />
    </div>
  );
}
