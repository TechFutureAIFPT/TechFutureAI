"use client";

import { useState, useMemo } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type JobPosition } from "@/lib/mock-data";
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
  Briefcase,
  Search,
  Plus,
  LayoutGrid,
  List,
  Download,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { JobModal } from "@/components/dashboard/modals/job-modal";
import { JobDetailModal } from "@/components/dashboard/modals/job-detail-modal";

export function JobsSection() {
  const { jobs, deleteJob, exportJobsCsv, candidates } = useSalesOps();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobPosition | null>(null);
  const [detailJob, setDetailJob] = useState<JobPosition | null>(null);

  // Filter jobs
  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.requirements.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = deptFilter === "all" || j.department === deptFilter;
      const matchesLevel = levelFilter === "all" || j.level === levelFilter;
      const matchesStatus = statusFilter === "all" || j.status === statusFilter;

      return matchesSearch && matchesDept && matchesLevel && matchesStatus;
    });
  }, [jobs, searchQuery, deptFilter, levelFilter, statusFilter]);

  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <Badge className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
          Tổng cộng: {jobs.length} Vị trí tuyển dụng
        </Badge>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportJobsCsv}
            className="border-slate-200 hover:bg-sky-50 hover:text-sky-700 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            Xuất File CSV
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setJobToEdit(null);
              setJobModalOpen(true);
            }}
            className="bg-sky-600 text-white hover:bg-sky-700 text-xs shadow-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo Chiến Dịch JD
          </Button>
        </div>
      </div>

      {/* Filter and View Controls */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full md:w-auto flex-1">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm vị trí JD, kỹ năng yêu cầu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
                />
              </div>

              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                  <SelectValue placeholder="Phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                  <SelectValue placeholder="Cấp bậc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cấp bậc</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Team Lead</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-sky-600 shadow-xs border border-sky-100 font-bold"
                    : "text-muted-foreground hover:text-slate-900"
                }`}
                title="Dạng Thẻ Lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-sky-600 shadow-xs border border-sky-100 font-bold"
                    : "text-muted-foreground hover:text-slate-900"
                }`}
                title="Dạng Bảng Danh Sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Mode */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => {
            const matchingCount = candidates.filter(
              (c) => c.jobTarget.toLowerCase() === job.title.toLowerCase()
            ).length;
            const progress = Math.round((job.hiredCount / (job.openings || 1)) * 100);

            return (
              <Card
                key={job.id}
                onClick={() => setDetailJob(job)}
                className="border-border hover:border-sky-300 bg-card hover:bg-sky-50/20 cursor-pointer transition-all duration-200 shadow-xs flex flex-col justify-between group"
              >
                <CardContent className="p-5 space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 group-hover:scale-105 transition-transform">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          job.status === "active"
                            ? "bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold"
                            : "bg-slate-100 text-slate-500 text-[10px]"
                        }
                      >
                        {job.status === "active" ? "Đang tuyển" : "Tạm dừng"}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.department} • {job.level} • {job.location}
                    </p>
                  </div>

                  {/* Salary & Openings */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-sky-50/30 border border-sky-100 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Mức lương</span>
                      <span className="font-semibold text-sky-700 truncate block mt-0.5">
                        {job.salaryRange}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Đã tuyển / Chỉ tiêu</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {job.hiredCount} / {job.openings} người
                      </span>
                    </div>
                  </div>

                  {/* Rubric Weights Preview */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <Sparkles className="w-3 h-3 text-sky-600" />
                        Trọng số AI:
                      </span>
                      <span>
                        Chuyên môn {job.rubricWeights.role_skills}% • KN {job.rubricWeights.experience}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-sky-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      {matchingCount} ứng viên
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Hạn: {job.deadline}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <Card className="border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-sky-50/50 border-b border-border text-slate-700 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Tên Vị Trí JD</th>
                  <th className="py-3 px-4">Phòng Ban</th>
                  <th className="py-3 px-4">Cấp Bậc</th>
                  <th className="py-3 px-4">Mức Lương Đề Xuất</th>
                  <th className="py-3 px-4">Tiến Độ Tuyển</th>
                  <th className="py-3 px-4">Ứng Viên</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((j) => {
                  const matchingCount = candidates.filter(
                    (c) => c.jobTarget.toLowerCase() === j.title.toLowerCase()
                  ).length;

                  return (
                    <tr
                      key={j.id}
                      onClick={() => setDetailJob(j)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-sm text-slate-900 hover:text-sky-600 transition-colors block">
                          {j.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {j.location} • Phụ trách: {j.recruiter}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        {j.department}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] bg-slate-50">
                          {j.level}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-semibold text-sky-700">
                        {j.salaryRange}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {j.hiredCount} / {j.openings} người
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-100">
                          {matchingCount} CV
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          className={
                            j.status === "active"
                              ? "bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold"
                              : "bg-slate-100 text-slate-500 text-[10px]"
                          }
                        >
                          {j.status === "active" ? "Đang tuyển" : "Tạm dừng"}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setJobToEdit(j);
                              setJobModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-sky-600"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJob(j.id);
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <JobDetailModal
        job={detailJob}
        open={!!detailJob}
        onOpenChange={(open) => !open && setDetailJob(null)}
        onEdit={(job) => {
          setJobToEdit(job);
          setJobModalOpen(true);
        }}
      />

      <JobModal
        open={jobModalOpen}
        onOpenChange={setJobModalOpen}
        jobToEdit={jobToEdit}
      />
    </div>
  );
}

export const CustomersSection = JobsSection;
