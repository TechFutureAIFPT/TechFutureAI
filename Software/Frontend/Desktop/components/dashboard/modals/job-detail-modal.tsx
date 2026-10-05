"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  DollarSign,
  Edit,
  Trash2,
  Sparkles,
  Layers,
} from "lucide-react";
import { type JobPosition } from "@/lib/mock-data";
import { useSalesOps } from "@/lib/sales-ops-context";

interface JobDetailModalProps {
  job: JobPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (job: JobPosition) => void;
}

export function JobDetailModal({
  job,
  open,
  onOpenChange,
  onEdit,
}: JobDetailModalProps) {
  const { deleteJob, candidates, setActiveSection } = useSalesOps();

  if (!job) return null;

  const matchingCandidates = candidates.filter(
    (c) => c.jobTarget.toLowerCase() === job.title.toLowerCase()
  );

  const handleDelete = () => {
    deleteJob(job.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4 pr-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-sky-600 shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-slate-900 truncate">
                  {job.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {job.department} • {job.level} • {job.location}
                </p>
              </div>
            </div>

            <Badge
              className={
                job.status === "active"
                  ? "bg-sky-50 text-sky-700 border-sky-200 font-bold"
                  : "bg-muted text-muted-foreground"
              }
            >
              {job.status === "active" ? "Đang Tuyển Dụng" : "Tạm Dừng"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
            <span className="text-xs text-muted-foreground block">Chỉ tiêu tuyển</span>
            <span className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1">
              <Users className="w-4 h-4 text-sky-600" />
              {job.hiredCount} / {job.openings} người
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
            <span className="text-xs text-muted-foreground block">Mức lương</span>
            <span className="text-xs font-bold text-sky-700 mt-1.5 block truncate">
              {job.salaryRange}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
            <span className="text-xs text-muted-foreground block">Tổng hồ sơ CV</span>
            <span className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1">
              <Layers className="w-4 h-4 text-sky-600" />
              {matchingCandidates.length} hồ sơ
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
            <span className="text-xs text-muted-foreground block">Hạn nộp hồ sơ</span>
            <span className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {job.deadline}
            </span>
          </div>
        </div>

        {/* AI Rubric Weights */}
        <div className="space-y-2 py-2">
          <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Cấu hình 6 Trọng Số Rubric Backend (Tổng 100%)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-center">
              <span className="text-[11px] text-muted-foreground block truncate">Job Fit</span>
              <span className="text-sm font-bold text-sky-800">
                {job.rubricWeights.job_fit}%
              </span>
            </div>
            <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-center">
              <span className="text-[11px] text-muted-foreground block truncate">Chuyên môn</span>
              <span className="text-sm font-bold text-sky-800">
                {job.rubricWeights.role_skills}%
              </span>
            </div>
            <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-center">
              <span className="text-[11px] text-muted-foreground block truncate">Kinh nghiệm</span>
              <span className="text-sm font-bold text-sky-800">
                {job.rubricWeights.experience}%
              </span>
            </div>
            <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-center">
              <span className="text-[11px] text-muted-foreground block truncate">Dự án & Impact</span>
              <span className="text-sm font-bold text-sky-800">
                {job.rubricWeights.impact}%
              </span>
            </div>
            <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-center">
              <span className="text-[11px] text-muted-foreground block truncate">Học vấn</span>
              <span className="text-sm font-bold text-sky-800">
                {job.rubricWeights.education}%
              </span>
            </div>
            <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-center">
              <span className="text-[11px] text-muted-foreground block truncate">Kỹ năng mềm</span>
              <span className="text-sm font-bold text-sky-800">
                {job.rubricWeights.soft_skills}%
              </span>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-2 py-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Yêu cầu tiêu chuẩn đối chiếu
          </h4>
          <div className="space-y-1.5">
            {job.requirements.map((req, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 bg-slate-50/70 rounded-lg border border-slate-200 text-xs text-slate-900"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matching Candidates */}
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Ứng viên ứng tuyển vị trí này ({matchingCandidates.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                setActiveSection("candidates");
              }}
              className="text-xs text-sky-600 hover:underline p-0 h-auto font-semibold"
            >
              Xem tất cả &rarr;
            </Button>
          </div>

          {matchingCandidates.length > 0 ? (
            <div className="space-y-1.5">
              {matchingCandidates.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-200 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    <p className="text-[11px] text-muted-foreground">
                      {c.experienceYears} năm KN • {c.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        c.matchScore >= 85
                          ? "bg-sky-50 text-sky-700 border-sky-200 text-[11px] font-bold"
                          : "bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-bold"
                      }
                    >
                      Match: {c.matchScore}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-xs text-muted-foreground bg-slate-50/50 rounded-lg border border-slate-200">
              Chưa có ứng viên nộp hồ sơ cho vị trí này.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 text-xs border-slate-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Xóa Vị Trí
          </Button>

          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEdit(job);
            }}
            className="bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-xs"
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Chỉnh Sửa JD
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
