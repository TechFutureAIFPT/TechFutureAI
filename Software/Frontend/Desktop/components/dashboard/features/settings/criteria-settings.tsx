"use client";

import { useState } from "react";
import {
  useSalesOps,
  type WorkflowWeights,
  type WorkflowSubWeights,
  type WorkflowHardFilters,
  defaultStandardSubWeights,
} from "@/lib/sales-ops-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sliders,
  Sparkles,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Zap,
  RefreshCw,
  Award,
  Layers,
  FileCheck,
  User,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { accountApi } from "@/lib/api-endpoints";

export function CriteriaSettingsSection() {
  const {
    userProfile,
    updateUserProfile,
    saveUserDefaultCriteria,
    setActiveSection,
    authUser,
  } = useSalesOps();

  // Rubric weights state
  const [weights, setWeights] = useState<WorkflowWeights>(
    userProfile.defaultWeights || {
      job_fit: 20,
      role_skills: 35,
      experience: 20,
      impact: 10,
      education: 5,
      soft_skills: 10,
    }
  );

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
    setWeights((prev) => ({
      ...prev,
      [parentKey]: newParentTotal,
    }));
  };

  // Hard filters state
  const [hardFilters, setHardFilters] = useState<WorkflowHardFilters>(
    userProfile.defaultHardFilters || {
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
    }
  );

  const [minMatchScore, setMinMatchScore] = useState(
    userProfile.minMatchScoreThreshold ? userProfile.minMatchScoreThreshold.toString() : "75"
  );
  const [autoOcr, setAutoOcr] = useState(userProfile.autoExtractOCR ?? true);
  const [autoApply, setAutoApply] = useState(userProfile.autoApplyUserRubric ?? true);
  const [isSaving, setIsSaving] = useState(false);

  // Total weight percentage
  const totalWeightPercent =
    (weights.job_fit || 0) +
    (weights.role_skills || 0) +
    (weights.experience || 0) +
    (weights.impact || 0) +
    (weights.education || 0) +
    (weights.soft_skills || 0);

  const isValidTotal = Math.abs(totalWeightPercent - 100) < 0.05;

  const handleWeightChange = (key: keyof WorkflowWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyPreset = (presetWeights: WorkflowWeights, presetName: string) => {
    setWeights(presetWeights);
    toast.info(`Đã nạp bộ trọng số mẫu: ${presetName}`);
  };

  const handleResetToStandard = () => {
    setWeights({
      job_fit: 20,
      role_skills: 35,
      experience: 20,
      impact: 10,
      education: 5,
      soft_skills: 10,
    });
    setSubWeights(defaultStandardSubWeights);
    setHardFilters({
      location: "TP. Hồ Chí Minh",
      locationMandatory: false,
      minExp: 2,
      minExpMandatory: false,
      industry: "IT/Software",
      industryMandatory: false,
      seniority: "Senior",
      seniorityMandatory: false,
      education: "Bachelor",
      educationMandatory: false,
      language: "Tiếng Anh",
      languageLevel: "B2",
      languageMandatory: false,
      workFormat: "Hybrid",
      workFormatMandatory: false,
      contractType: "Full-time",
      contractTypeMandatory: false,
      majorGroups: ["information-technology"],
      majorMandatory: false,
      age: { min: 22, max: 35 },
      ageMandatory: false,
    });
    setMinMatchScore("75");
    toast.success("Đã khôi phục bộ tiêu chí và trọng số con về chuẩn mặc định!");
  };

  const handleSaveCriteria = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const scoreNum = parseInt(minMatchScore, 10) || 75;

    const weightsWithSub = {
      ...weights,
      subWeights,
    };

    saveUserDefaultCriteria(weightsWithSub, hardFilters, autoApply);
    updateUserProfile({
      minMatchScoreThreshold: scoreNum,
      autoExtractOCR: autoOcr,
      autoApplyUserRubric: autoApply,
      defaultWeights: weightsWithSub,
      defaultSubWeights: subWeights,
      defaultHardFilters: hardFilters,
    });

    try {
      if (authUser) {
        await accountApi.patchSettings({
          minMatchScoreThreshold: scoreNum,
          autoExtractOCR: autoOcr,
        });
      }
      toast.success("Đã lưu và đồng bộ Bộ Tiêu Chí Chấm Điểm & Bộ Lọc JD thành công!");
    } catch {
      toast.success("Đã lưu bộ tiêu chí mặc định cho tài khoản của bạn!");
    } finally {
      setIsSaving(false);
    }
  };

  const currentScoreNum = parseInt(minMatchScore, 10) || 75;

  return (
    <div className="space-y-4 w-full">
      {/* 1. TOP DUAL-PAGE NAVIGATION SWITCHER */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSection("settings")}
            className="text-xs font-semibold h-9 px-4 text-slate-600 hover:text-sky-800 hover:bg-white/80 rounded-xl"
          >
            <User className="w-3.5 h-3.5 mr-2 text-slate-500" />
            <span>Hồ Sơ & Cài Đặt</span>
          </Button>

          <Button
            type="button"
            className="text-xs font-bold h-9 px-4 bg-white text-sky-700 shadow-xs border border-sky-200/80 rounded-xl hover:bg-white"
          >
            <Sliders className="w-3.5 h-3.5 mr-2 text-sky-600" />
            <span>Tiêu Chí Chấm Điểm JD</span>
          </Button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToStandard}
            className="text-xs font-semibold h-8 text-slate-600 hover:text-sky-800 border-slate-200 bg-white shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            <span>Khôi Phục Chuẩn Ban Đầu</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveCriteria} className="space-y-4 w-full">
        {/* 2. AUTO APPLY CRITERIA TOGGLE */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <p className="font-bold text-xs text-sky-950 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Tự Động Áp Dụng Bộ Tiêu Chí & Bộ Lọc Này Cho Các JD Tiếp Theo</span>
            </p>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              Hệ thống sẽ tự động nạp 6 trọng số Rubric và điều kiện lọc cứng này vào Bước 3 đối chiếu khi bạn chọn bất kỳ JD mới nào.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-sky-900">
              {autoApply ? "BẬT" : "TẮT"}
            </span>
            <Switch
              checked={autoApply}
              onCheckedChange={setAutoApply}
            />
          </div>
        </div>

        {/* 4. MAIN 2-COLUMN SETTINGS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 6 Rubric Weights (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-3 bg-gradient-to-r from-sky-50/40 via-white to-blue-50/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        1. Trọng Số Tiêu Chí Chấm Điểm Rubric (Tổng 100%)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Tỷ trọng điểm số phân bổ cho 6 trụ cột năng lực ứng viên
                      </CardDescription>
                    </div>
                  </div>

                  <Badge
                    className={`text-xs font-bold ${
                      isValidTotal
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    Tổng: {totalWeightPercent}% {isValidTotal ? "✓ Hợp lệ" : "⚠ Chưa đủ 100%"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Presets List */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Gợi ý bộ trọng số chuẩn hóa theo nhóm vai trò:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        name: "Chuẩn Backend (20-35-20-10-5-10)",
                        w: { job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 },
                      },
                      {
                        name: "Chuyên Sâu Kỹ Năng (15-45-15-10-5-10)",
                        w: { job_fit: 15, role_skills: 45, experience: 15, impact: 10, education: 5, soft_skills: 10 },
                      },
                      {
                        name: "Ưu Tiên Kinh Nghiệm (15-25-35-10-5-10)",
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
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset(preset.w, preset.name)}
                        className="text-[11px] h-6.5 px-2 border-slate-200 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 font-medium"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 6 Sliders Detailed with Sub-Weights */}
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  {/* 1. Role Skills */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">1. Kỹ Năng Chuyên Môn (Role Skills)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand("role_skills")}
                          className="h-6 px-2 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md font-semibold"
                        >
                          {expandedCriteria.role_skills ? (
                            <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              <span>Thu gọn trọng số con</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              <span>3 Trọng số con</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <strong className="text-sky-700 font-extrabold text-sm">{weights.role_skills}%</strong>
                    </div>
                    <Slider
                      value={[weights.role_skills]}
                      max={60}
                      min={10}
                      step={1}
                      onValueChange={(val) => handleWeightChange("role_skills", val[0])}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Công nghệ lõi, framework, ngôn ngữ chuyên ngành và công cụ bắt buộc của vị trí
                    </p>

                    {/* Sub-weights Accordion */}
                    {expandedCriteria.role_skills && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                          Phân rã trọng số con (Tổng: {weights.role_skills}%)
                        </span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">• Công nghệ cốt lõi & Ngôn ngữ chính:</span>
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
                            <span className="font-medium text-slate-700">• Frameworks & Công cụ phụ trợ:</span>
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
                            <span className="font-medium text-slate-700">• Quy chuẩn thực thi / Testing / CI-CD:</span>
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

                  {/* 2. Experience */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">2. Số Năm Kinh Nghiệm (Experience)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand("experience")}
                          className="h-6 px-2 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md font-semibold"
                        >
                          {expandedCriteria.experience ? (
                            <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              <span>Thu gọn trọng số con</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              <span>3 Trọng số con</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <strong className="text-sky-700 font-extrabold text-sm">{weights.experience}%</strong>
                    </div>
                    <Slider
                      value={[weights.experience]}
                      max={50}
                      min={5}
                      step={1}
                      onValueChange={(val) => handleWeightChange("experience", val[0])}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Thâm niên thực chiến, độ phức tạp của dự án đã làm và mức độ đảm nhận trách nhiệm
                    </p>

                    {/* Sub-weights Accordion */}
                    {expandedCriteria.experience && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                          Phân rã trọng số con (Tổng: {weights.experience}%)
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">• Tổng số năm kinh nghiệm thực tế:</span>
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
                            <span className="font-medium text-slate-700">• Kinh nghiệm chuyên ngành / Domain Fit:</span>
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
                            <span className="font-medium text-slate-700">• Mức độ làm chủ & Quản lý công việc (Ownership):</span>
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

                  {/* 3. Job Fit */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">3. Độ Phù Hợp Trực Tiếp Với JD (Job Fit)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand("job_fit")}
                          className="h-6 px-2 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md font-semibold"
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
                      <strong className="text-sky-700 font-extrabold text-sm">{weights.job_fit}%</strong>
                    </div>
                    <Slider
                      value={[weights.job_fit]}
                      max={50}
                      min={5}
                      step={1}
                      onValueChange={(val) => handleWeightChange("job_fit", val[0])}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Độ tương thích tổng quan giữa mục tiêu nghề nghiệp, phạm vi công việc và kỳ vọng JD
                    </p>

                    {/* Sub-weights Accordion */}
                    {expandedCriteria.job_fit && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                          Phân rã trọng số con (Tổng: {weights.job_fit}%)
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">• Khớp trách nhiệm công việc cốt lõi:</span>
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
                            <span className="font-medium text-slate-700">• Tương đồng ngữ nghĩa Vector Embedding:</span>
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

                  {/* 4. Impact */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">4. Mức Độ Tác Động & Kết Quả (Impact)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand("impact")}
                          className="h-6 px-2 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md font-semibold"
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
                      <strong className="text-sky-700 font-extrabold text-sm">{weights.impact}%</strong>
                    </div>
                    <Slider
                      value={[weights.impact]}
                      max={30}
                      min={0}
                      step={1}
                      onValueChange={(val) => handleWeightChange("impact", val[0])}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Các chỉ số định lượng, thành tích đóng góp, sản phẩm đã hoàn thành thực tế
                    </p>

                    {/* Sub-weights Accordion */}
                    {expandedCriteria.impact && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                          Phân rã trọng số con (Tổng: {weights.impact}%)
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">• Bằng chứng định lượng & Chỉ số KPI:</span>
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
                            <span className="font-medium text-slate-700">• Quy mô dự án & Độ phức tạp hệ thống:</span>
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

                  {/* 5. Soft Skills */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">5. Kỹ Năng Mềm & Phối Hợp (Soft Skills)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand("soft_skills")}
                          className="h-6 px-2 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md font-semibold"
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
                      <strong className="text-sky-700 font-extrabold text-sm">{weights.soft_skills}%</strong>
                    </div>
                    <Slider
                      value={[weights.soft_skills]}
                      max={30}
                      min={0}
                      step={1}
                      onValueChange={(val) => handleWeightChange("soft_skills", val[0])}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Giao tiếp, làm việc nhóm, tinh thần trách nhiệm và tính nhất quán của hồ sơ
                    </p>

                    {/* Sub-weights Accordion */}
                    {expandedCriteria.soft_skills && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                          Phân rã trọng số con (Tổng: {weights.soft_skills}%)
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">• Giao tiếp & Phối hợp liên phòng ban:</span>
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
                            <span className="font-medium text-slate-700">• Độ tin cậy & Tính nhất quán hồ sơ:</span>
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

                  {/* 6. Education */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">6. Học Vấn & Bằng Cấp (Education)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand("education")}
                          className="h-6 px-2 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md font-semibold"
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
                      <strong className="text-sky-700 font-extrabold text-sm">{weights.education}%</strong>
                    </div>
                    <Slider
                      value={[weights.education]}
                      max={25}
                      min={0}
                      step={1}
                      onValueChange={(val) => handleWeightChange("education", val[0])}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Bằng cấp đại học, chứng chỉ chuyên môn quốc tế và đào tạo chính quy
                    </p>

                    {/* Sub-weights Accordion */}
                    {expandedCriteria.education && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                          Phân rã trọng số con (Tổng: {weights.education}%)
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">• Bằng cấp & Chuyên ngành đào tạo:</span>
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
                            <span className="font-medium text-slate-700">• Chứng chỉ chuyên môn nghề nghiệp:</span>
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Hard Filters & Thresholds (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 2. HARD FILTERS (TIÊU CHÍ CỨNG) */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-3 bg-gradient-to-r from-sky-50/40 via-white to-blue-50/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      2. Điều Kiện Lọc Cứng Mặc Định (Hard Filters)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Bộ lọc điều kiện bắt buộc tự động gán vào đợt lọc
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800">Khu Vực Tuyển Dụng Mặc Định</Label>
                  <Select
                    value={hardFilters.location}
                    onValueChange={(val) => setHardFilters((prev) => ({ ...prev, location: val }))}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</SelectItem>
                      <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                      <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                      <SelectItem value="Toàn Quốc">Toàn Quốc (Tất cả khu vực)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Experience */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-800">Kinh Nghiệm Tối Thiểu</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">Bắt buộc loại:</span>
                      <Switch
                        checked={hardFilters.minExpMandatory}
                        onCheckedChange={(checked) =>
                          setHardFilters((prev) => ({ ...prev, minExpMandatory: checked }))
                        }
                      />
                    </div>
                  </div>
                  <Select
                    value={String(hardFilters.minExp)}
                    onValueChange={(val) => setHardFilters((prev) => ({ ...prev, minExp: parseInt(val, 10) || 0 }))}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Không yêu cầu kinh nghiệm</SelectItem>
                      <SelectItem value="1">Tối thiểu 1 năm</SelectItem>
                      <SelectItem value="2">Tối thiểu 2 năm</SelectItem>
                      <SelectItem value="3">Tối thiểu 3 năm</SelectItem>
                      <SelectItem value="5">Tối thiểu 5 năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seniority & Education */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800">Cấp Bậc</Label>
                    <Select
                      value={hardFilters.seniority}
                      onValueChange={(val) => setHardFilters((prev) => ({ ...prev, seniority: val }))}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Intern">Intern / Thực tập</SelectItem>
                        <SelectItem value="Junior">Junior (1-2 năm)</SelectItem>
                        <SelectItem value="Mid-level">Mid-level (2-4 năm)</SelectItem>
                        <SelectItem value="Senior">Senior (5+ năm)</SelectItem>
                        <SelectItem value="Lead">Lead / Trưởng nhóm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800">Trình Độ Học Vấn</Label>
                    <Select
                      value={hardFilters.education}
                      onValueChange={(val) => setHardFilters((prev) => ({ ...prev, education: val }))}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Associate">Cao đẳng / Nghề</SelectItem>
                        <SelectItem value="Bachelor">Cử nhân / Đại học</SelectItem>
                        <SelectItem value="Master">Thạc sĩ (Master)</SelectItem>
                        <SelectItem value="PhD">Tiến sĩ (PhD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Work Format & Contract */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800">Hình Thức</Label>
                    <Select
                      value={hardFilters.workFormat}
                      onValueChange={(val) => setHardFilters((prev) => ({ ...prev, workFormat: val }))}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hybrid">Hybrid (Linh hoạt)</SelectItem>
                        <SelectItem value="Onsite">Onsite (Tại VP)</SelectItem>
                        <SelectItem value="Remote">Remote (Từ xa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800">Loại Hợp Đồng</Label>
                    <Select
                      value={hardFilters.contractType}
                      onValueChange={(val) => setHardFilters((prev) => ({ ...prev, contractType: val }))}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Toàn thời gian</SelectItem>
                        <SelectItem value="Part-time">Bán thời gian</SelectItem>
                        <SelectItem value="Contract">Hợp đồng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Language & Certificate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-800">Ngoại Ngữ Yêu Cầu</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Bắt buộc:</span>
                        <Switch
                          checked={hardFilters.languageMandatory ?? false}
                          onCheckedChange={(checked) =>
                            setHardFilters((prev) => ({ ...prev, languageMandatory: checked }))
                          }
                        />
                      </div>
                    </div>
                    <Select
                      value={hardFilters.language}
                      onValueChange={(val) => setHardFilters((prev) => ({ ...prev, language: val }))}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tiếng Anh">Tiếng Anh (B2 / IELTS / Giao tiếp)</SelectItem>
                        <SelectItem value="Tiếng Nhật">Tiếng Nhật (N1 / N2 / N3)</SelectItem>
                        <SelectItem value="Tiếng Trung">Tiếng Trung (HSK 4+ / Giao tiếp)</SelectItem>
                        <SelectItem value="Không yêu cầu">Không yêu cầu ngoại ngữ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-800">Ngành Nghề (Industry)</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Bắt buộc:</span>
                        <Switch
                          checked={hardFilters.industryMandatory ?? false}
                          onCheckedChange={(checked) =>
                            setHardFilters((prev) => ({ ...prev, industryMandatory: checked }))
                          }
                        />
                      </div>
                    </div>
                    <Select
                      value={hardFilters.industry || "IT/Software"}
                      onValueChange={(val) => setHardFilters((prev) => ({ ...prev, industry: val }))}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT/Software">Công Nghệ Thông Tin / Phần Mềm</SelectItem>
                        <SelectItem value="Kinh Doanh">Kinh Doanh / Bán Hàng / Sales</SelectItem>
                        <SelectItem value="Tài Chính">Tài Chính / Ngân Hàng / Kế Toán</SelectItem>
                        <SelectItem value="Marketing">Marketing / Truyền Thông</SelectItem>
                        <SelectItem value="Nhân Sự">Nhân Sự / Hành Chính</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-start gap-2 text-[11px] text-sky-900">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>Các tiêu chí lọc cứng này được chuẩn hóa đồng bộ với dữ liệu Firebase Database, tự động phân loại ứng viên Đạt chuẩn hay Bị loại.</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. THRESHOLD & OCR CONFIG */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-3 bg-gradient-to-r from-sky-50/40 via-white to-blue-50/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      3. Ngưỡng Điểm Đạt & Động Cơ OCR
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Thiết lập mức điểm phân loại chất lượng ứng viên
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">Ngưỡng Đạt Chuẩn (Min Score)</p>
                      <p className="text-[10px] text-muted-foreground">Tự động gắn nhãn "Đạt Chuẩn"</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min="50"
                        max="95"
                        value={minMatchScore}
                        onChange={(e) => setMinMatchScore(e.target.value)}
                        className="w-14 h-8 text-center font-extrabold bg-white border-sky-300 text-sky-800 text-sm rounded-md"
                      />
                      <span className="font-bold text-sky-700 text-xs">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-muted-foreground text-[10px]">Phân loại:</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        currentScoreNum >= 80
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : currentScoreNum >= 70
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {currentScoreNum >= 80 ? "🟢 Tiêu chuẩn cao" : currentScoreNum >= 70 ? "🔵 Tiêu chuẩn trung bình" : "🟡 Mở rộng phễu"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="space-y-0.5 pr-2">
                    <p className="font-semibold text-xs text-slate-900">Tự Động Trích Xuất OCR</p>
                    <p className="text-[10px] text-muted-foreground">Nhận diện tệp ảnh PNG/JPG & PDF quét</p>
                  </div>
                  <Switch checked={autoOcr} onCheckedChange={setAutoOcr} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 5. STICKY SAVE BAR */}
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Bộ tiêu chí này sẽ tự động lưu và áp dụng cho toàn bộ các JD & đợt lọc CV tiếp theo</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 px-5 shadow-xs transition-all"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Đang Lưu Tiêu Chí...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Lưu Cấu Hình Tiêu Chí JD Mặc Định</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
