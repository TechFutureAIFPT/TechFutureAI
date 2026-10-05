"use client";

import { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type Candidate } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  Calendar,
  Mail,
  Edit,
  Trash2,
  Briefcase,
  Clock,
  User,
} from "lucide-react";
import { CandidateModal } from "@/components/dashboard/modals/candidate-modal";
import { CandidateDetailModal } from "@/components/dashboard/modals/candidate-detail-modal";
import { InterviewModal } from "@/components/dashboard/modals/interview-modal";
import { EmailModal } from "@/components/dashboard/modals/email-modal";

const pipelineStages: {
  key: Candidate["stage"];
  name: string;
  badgeClass: string;
  color: string;
}[] = [
  {
    key: "screening",
    name: "Sơ Loại CV",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    color: "#0284c7",
  },
  {
    key: "qualified",
    name: "Đạt Chuẩn (≥ 75%)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    color: "#0ea5e9",
  },
  {
    key: "interview",
    name: "Vòng Phỏng Vấn",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    color: "#38bdf8",
  },
  {
    key: "offer",
    name: "Đề Nghị Nhận Việc",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    color: "#0369a1",
  },
];

export function PipelineSection() {
  const {
    candidates,
    jobs,
    recruiters,
    moveCandidateStage,
    deleteCandidate,
  } = useSalesOps();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedRecruiter, setSelectedRecruiter] = useState("all");

  // Modals state
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [targetStageForNew, setTargetStageForNew] = useState<Candidate["stage"]>("screening");

  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.jobTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesJob = selectedJob === "all" || c.jobTarget === selectedJob;
    const matchesRecruiter =
      selectedRecruiter === "all" || c.recruiter === selectedRecruiter;

    return matchesSearch && matchesJob && matchesRecruiter;
  });

  const handleAddNewCandidate = (stage: Candidate["stage"]) => {
    setCandidateToEdit(null);
    setTargetStageForNew(stage);
    setCandidateModalOpen(true);
  };

  const getStageNext = (current: Candidate["stage"]): Candidate["stage"] | null => {
    const idx = pipelineStages.findIndex((s) => s.key === current);
    return idx < pipelineStages.length - 1 ? pipelineStages[idx + 1].key : null;
  };

  const getStagePrev = (current: Candidate["stage"]): Candidate["stage"] | null => {
    const idx = pipelineStages.findIndex((s) => s.key === current);
    return idx > 0 ? pipelineStages[idx - 1].key : null;
  };

  return (
    <div className="space-y-6">
      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên ứng viên, kỹ năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>

          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 text-xs h-9">
              <SelectValue placeholder="Vị trí tuyển dụng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vị trí JD</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.title}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
            <SelectTrigger className="w-[170px] bg-slate-50 border-slate-200 text-xs h-9">
              <SelectValue placeholder="Chuyên viên HR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả Recruiter</SelectItem>
              {recruiters.map((r) => (
                <SelectItem key={r.id} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={() => handleAddNewCandidate("screening")}
          className="bg-sky-600 text-white hover:bg-sky-700 shrink-0 text-xs shadow-xs font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tiếp Nhận CV Mới
        </Button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {pipelineStages.map((stage) => {
          const stageCandidates = filteredCandidates.filter(
            (c) => c.stage === stage.key
          );
          const avgScore =
            stageCandidates.length > 0
              ? Math.round(
                  stageCandidates.reduce((sum, c) => sum + c.matchScore, 0) /
                    stageCandidates.length
                )
              : 0;

          return (
            <div
              key={stage.key}
              className="bg-card border border-border rounded-xl p-3 flex flex-col min-h-[550px] shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-bold text-sm text-slate-900">
                    {stage.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50">
                    {stageCandidates.length}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddNewCandidate(stage.key)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-sky-600 hover:bg-sky-50 cursor-pointer"
                  title="Thêm ứng viên vào cột này"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Sub-header metric */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3 px-1">
                <span>Điểm Match TB:</span>
                <span className="font-bold text-sky-700">{avgScore}%</span>
              </div>

              {/* Candidates List in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
                {stageCandidates.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-xs text-muted-foreground border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <span>Chưa có ứng viên ở giai đoạn này</span>
                    <button
                      onClick={() => handleAddNewCandidate(stage.key)}
                      className="mt-2 text-sky-600 hover:underline text-xs font-semibold cursor-pointer"
                    >
                      + Thêm hồ sơ
                    </button>
                  </div>
                ) : (
                  stageCandidates.map((cand, idx) => {
                    const nextSt = getStageNext(cand.stage);
                    const prevSt = getStagePrev(cand.stage);

                    return (
                      <Card
                        key={`${cand.id}-${idx}`}
                        onClick={() => setDetailCandidate(cand)}
                        className="border border-slate-200 hover:border-sky-300 bg-white hover:bg-sky-50/30 cursor-pointer transition-all duration-200 shadow-xs group"
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          {/* Top Row: Name + Match Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                                {cand.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3 text-sky-600 shrink-0" />
                                <span className="truncate">{cand.jobTarget}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Badge
                                className={`text-[11px] font-bold ${
                                  cand.matchScore >= 85
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                <Sparkles className="w-3 h-3 mr-0.5 text-sky-600" />
                                {cand.matchScore}%
                              </Badge>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded hover:bg-sky-50 text-muted-foreground hover:text-sky-600 cursor-pointer"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 text-xs">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailCandidate(cand);
                                    }}
                                  >
                                    Xem Chi Tiết & AI Evaluation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInterviewCandidate(cand);
                                      setInterviewModalOpen(true);
                                    }}
                                  >
                                    <Calendar className="w-3.5 h-3.5 mr-2" />
                                    Lên Lịch Phỏng Vấn
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEmailCandidate(cand);
                                      setEmailModalOpen(true);
                                    }}
                                  >
                                    <Mail className="w-3.5 h-3.5 mr-2" />
                                    Gửi Email Tuyển Dụng
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCandidateToEdit(cand);
                                      setCandidateModalOpen(true);
                                    }}
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-2" />
                                    Chỉnh Sửa Hồ Sơ
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCandidate(cand.id);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Xóa Hồ Sơ
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Skills Chips */}
                          <div className="flex flex-wrap gap-1">
                            {cand.skills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 rounded bg-sky-50 text-[10px] text-sky-800 border border-sky-100/80 truncate max-w-[120px]"
                              >
                                {s}
                              </span>
                            ))}
                            {cand.skills.length > 3 && (
                              <span className="text-[10px] text-muted-foreground self-center">
                                +{cand.skills.length - 3}
                              </span>
                            )}
                          </div>

                          {/* Details Row: Salary & Recruiter */}
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                            <span className="font-semibold text-slate-900">
                              {(cand.expectedSalary / 1000000).toFixed(0)} Tr ₫
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {cand.recruiter}
                            </span>
                          </div>

                          {/* Quick Stage Movement Controls */}
                          <div className="flex items-center justify-between pt-1 gap-1">
                            {prevSt ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCandidateStage(cand.id, prevSt);
                                }}
                                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-sky-600 hover:bg-sky-50"
                                title="Quay lại giai đoạn trước"
                              >
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Lùi bước
                              </Button>
                            ) : (
                              <div />
                            )}

                            {nextSt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCandidateStage(cand.id, nextSt);
                                }}
                                className="h-6 px-2 text-[10px] bg-sky-50 hover:bg-sky-600 hover:text-white border-sky-200 text-sky-700 font-semibold"
                                title="Chuyển sang giai đoạn tiếp theo"
                              >
                                Tiến bước
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={detailCandidate}
        open={!!detailCandidate}
        onOpenChange={(open) => !open && setDetailCandidate(null)}
        onEdit={(cand) => {
          setCandidateToEdit(cand);
          setCandidateModalOpen(true);
        }}
        onScheduleInterview={(cand) => {
          setInterviewCandidate(cand);
          setInterviewModalOpen(true);
        }}
        onSendEmail={(cand) => {
          setEmailCandidate(cand);
          setEmailModalOpen(true);
        }}
      />

      {/* Candidate Create/Edit Modal */}
      <CandidateModal
        open={candidateModalOpen}
        onOpenChange={setCandidateModalOpen}
        candidateToEdit={candidateToEdit}
        defaultStage={targetStageForNew}
      />

      {/* Interview Modal */}
      <InterviewModal
        open={interviewModalOpen}
        onOpenChange={setInterviewModalOpen}
        candidateName={interviewCandidate?.name}
        candidateEmail={interviewCandidate?.email}
        jobTitle={interviewCandidate?.jobTarget}
      />

      {/* Email Modal */}
      <EmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        recipientName={emailCandidate?.name}
        recipientEmail={emailCandidate?.email}
        jobTitle={emailCandidate?.jobTarget}
      />
    </div>
  );
}
