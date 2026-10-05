"use client";

import { useState, useMemo } from "react";
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
  Search,
  Download,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Calendar,
  Mail,
  Edit,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  User,
} from "lucide-react";
import { CandidateModal } from "@/components/dashboard/modals/candidate-modal";
import { CandidateDetailModal } from "@/components/dashboard/modals/candidate-detail-modal";
import { InterviewModal } from "@/components/dashboard/modals/interview-modal";
import { EmailModal } from "@/components/dashboard/modals/email-modal";

const stageBadges: Record<Candidate["stage"], { label: string; className: string }> = {
  screening: { label: "Sơ loại CV", className: "bg-sky-50 text-sky-700 border-sky-200" },
  qualified: { label: "Đạt chuẩn (>=75%)", className: "bg-blue-50 text-blue-700 border-blue-200" },
  interview: { label: "Vòng phỏng vấn", className: "bg-amber-50 text-amber-700 border-amber-200" },
  offer: { label: "Đề nghị tuyển dụng", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
};

export function CandidatesSection() {
  const {
    candidates,
    jobs,
    recruiters,
    deleteCandidate,
    exportCandidatesCsv,
  } = useSalesOps();

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [recruiterFilter, setRecruiterFilter] = useState("all");

  const [sortField, setSortField] = useState<"matchScore" | "name" | "expectedSalary" | "experienceYears" | "appliedDate">("matchScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);

  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);

  // Filter candidates
  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.jobTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStage = stageFilter === "all" || c.stage === stageFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesJob = jobFilter === "all" || c.jobTarget === jobFilter;
      const matchesRecruiter =
        recruiterFilter === "all" || c.recruiter === recruiterFilter;

      return matchesSearch && matchesStage && matchesStatus && matchesJob && matchesRecruiter;
    });
  }, [candidates, searchQuery, stageFilter, statusFilter, jobFilter, recruiterFilter]);

  // Sort candidates
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === "matchScore") comparison = a.matchScore - b.matchScore;
      if (sortField === "name") comparison = a.name.localeCompare(b.name);
      if (sortField === "expectedSalary") comparison = a.expectedSalary - b.expectedSalary;
      if (sortField === "experienceYears") comparison = a.experienceYears - b.experienceYears;
      if (sortField === "appliedDate") comparison = a.appliedDate.localeCompare(b.appliedDate);

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortField, sortDirection]);

  // Paginated
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <Badge className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
          Tổng cộng: {filtered.length} Hồ sơ ứng viên
        </Badge>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCandidatesCsv}
            className="border-slate-200 hover:bg-sky-50 hover:text-sky-700 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            Xuất File CSV
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setCandidateToEdit(null);
              setCandidateModalOpen(true);
            }}
            className="bg-sky-600 text-white hover:bg-sky-700 text-xs shadow-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tiếp Nhận CV
          </Button>
        </div>
      </div>

      {/* Multi-criteria Filter Bar */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm ứng viên, kỹ năng, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
              />
            </div>

            <Select
              value={stageFilter}
              onValueChange={(v) => {
                setStageFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                <SelectValue placeholder="Giai đoạn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                <SelectItem value="screening">Sơ loại CV</SelectItem>
                <SelectItem value="qualified">Đạt chuẩn (≥ 75%)</SelectItem>
                <SelectItem value="interview">Phỏng vấn</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang xử lý</SelectItem>
                <SelectItem value="hired">Đã nhận việc</SelectItem>
                <SelectItem value="rejected">Không phù hợp</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={jobFilter}
              onValueChange={(v) => {
                setJobFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                <SelectValue placeholder="Vị trí JD" />
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
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-sky-50/50 border-b border-border text-slate-700 uppercase tracking-wider font-bold">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="py-3 px-4 cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center gap-1">
                    Ứng Viên
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Vị Trí Ứng Tuyển</th>
                <th
                  onClick={() => handleSort("matchScore")}
                  className="py-3 px-4 cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center gap-1">
                    Điểm Match AI
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("experienceYears")}
                  className="py-3 px-4 cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center gap-1">
                    Kinh Nghiệm
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("expectedSalary")}
                  className="py-3 px-4 cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center gap-1">
                    Lương Kỳ Vọng
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Giai Đoạn</th>
                <th className="py-3 px-4">Recruiter</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy ứng viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginated.map((c, idx) => {
                  const badge = stageBadges[c.stage];

                  return (
                    <tr
                      key={`${c.id}-${idx}`}
                      onClick={() => setDetailCandidate(c)}
                      className="hover:bg-sky-50/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {c.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 hover:text-sky-600 transition-colors">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 truncate max-w-[200px] block">
                          {c.jobTarget}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {c.location}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-xs font-bold ${
                              c.matchScore >= 85
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : c.matchScore >= 70
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            <Sparkles className="w-3 h-3 mr-0.5 text-sky-600" />
                            {c.matchScore}%
                          </Badge>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.experienceYears} Năm
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {(c.expectedSalary / 1000000).toFixed(0)} Triệu ₫
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {c.recruiter}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInterviewCandidate(c);
                              setInterviewModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Lên lịch phỏng vấn"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmailCandidate(c);
                              setEmailModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Gửi email tuyển dụng"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailCandidate(c);
                                }}
                              >
                                Xem Chi Tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCandidateToEdit(c);
                                  setCandidateModalOpen(true);
                                }}
                              >
                                <Edit className="w-3.5 h-3.5 mr-2" />
                                Chỉnh Sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCandidate(c.id);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Xóa Hồ Sơ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/20 text-xs text-muted-foreground">
          <span>
            Hiển thị{" "}
            <span className="font-semibold text-foreground">
              {paginated.length}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            hồ sơ
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-foreground">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals */}
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

      <CandidateModal
        open={candidateModalOpen}
        onOpenChange={setCandidateModalOpen}
        candidateToEdit={candidateToEdit}
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

export const DealsSection = CandidatesSection;
