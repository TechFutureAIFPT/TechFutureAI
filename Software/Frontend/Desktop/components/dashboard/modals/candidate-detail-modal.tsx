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
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  MapPin,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  HelpCircle,
  DollarSign,
} from "lucide-react";
import { type Candidate } from "@/lib/mock-data";
import { useSalesOps } from "@/lib/sales-ops-context";

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onSendEmail: (candidate: Candidate) => void;
}

const stageSequence: Candidate["stage"][] = [
  "screening",
  "qualified",
  "interview",
  "offer",
];

const stageLabels: Record<Candidate["stage"], string> = {
  screening: "Sơ loại CV",
  qualified: "Đạt chuẩn (>=75%)",
  interview: "Vòng phỏng vấn",
  offer: "Đề nghị tuyển dụng",
};

export function CandidateDetailModal({
  candidate,
  open,
  onOpenChange,
  onEdit,
  onScheduleInterview,
  onSendEmail,
}: CandidateDetailModalProps) {
  const { moveCandidateStage, updateCandidate, deleteCandidate } = useSalesOps();

  if (!candidate) return null;

  const currentStageIndex = stageSequence.indexOf(candidate.stage);
  const nextStage =
    currentStageIndex < stageSequence.length - 1
      ? stageSequence[currentStageIndex + 1]
      : null;

  const handleNextStage = () => {
    if (nextStage) {
      moveCandidateStage(candidate.id, nextStage);
    }
  };

  const handleMarkHired = () => {
    updateCandidate(candidate.id, { status: "hired", stage: "offer" });
  };

  const handleMarkRejected = () => {
    updateCandidate(candidate.id, { status: "rejected" });
  };

  const handleDelete = () => {
    deleteCandidate(candidate.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="border-b border-border pb-4 pr-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-xs">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                  {candidate.name}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{candidate.jobTarget}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                  candidate.matchScore >= 85
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : candidate.matchScore >= 70
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Match AI: {candidate.matchScore}%
              </div>

              <Badge
                className={`px-3 py-1 text-xs font-semibold ${
                  candidate.status === "hired"
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : candidate.status === "rejected"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                {candidate.status === "hired" && "Đã nhận việc"}
                {candidate.status === "rejected" && "Không phù hợp"}
                {candidate.status === "active" && "Đang xử lý"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Stage Progress Bar */}
        <div className="py-3 px-3.5 bg-sky-50/40 rounded-xl border border-sky-100">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-medium">Tiến độ phễu tuyển dụng:</span>
            <span className="font-bold text-slate-900 text-xs">
              {stageLabels[candidate.stage]}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stageSequence.map((st, idx) => (
              <div key={st} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx <= currentStageIndex ? "bg-sky-600" : "bg-sky-100"
                  }`}
                />
                <span className="text-[11px] font-medium text-muted-foreground block text-center leading-tight">
                  {stageLabels[st]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Kinh nghiệm</span>
            <span className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600 shrink-0" />
              {candidate.experienceYears} năm
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Lương mong muốn</span>
            <span className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-sky-600 shrink-0" />
              {(candidate.expectedSalary / 1000000).toFixed(0)} Triệu ₫
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Khu vực</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5 break-words">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{candidate.location}</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Recruiter phụ trách</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5 break-words">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{candidate.recruiter}</span>
            </span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 py-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Thông tin liên hệ & Học vấn
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-slate-900 font-medium">{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-slate-900 font-medium">{candidate.phone}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-slate-900 font-medium">{candidate.education}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2 py-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Kỹ năng chuyên môn đối chiếu
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs font-medium py-1 px-2.5">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* AI Evaluation Summary */}
        {candidate.aiSummary && (
          <div className="space-y-1.5 py-1">
            <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Đánh giá từ AI CV Match
            </h4>
            <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 text-xs text-slate-800 leading-relaxed">
              {candidate.aiSummary}
            </div>
          </div>
        )}

        {/* Suggested Interview Questions */}
        {candidate.interviewQuestions && candidate.interviewQuestions.length > 0 && (
          <div className="space-y-1.5 py-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              Câu hỏi phỏng vấn đề xuất từ AI
            </h4>
            <div className="space-y-1.5">
              {candidate.interviewQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-200 text-xs text-slate-800"
                >
                  <span className="font-bold text-sky-700 mr-1.5">Q{idx + 1}:</span>
                  {q}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {nextStage && candidate.status === "active" && (
              <Button
                size="sm"
                onClick={handleNextStage}
                className="bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-xs"
              >
                Chuyển sang: {stageLabels[nextStage]}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}

            {candidate.status === "active" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkHired}
                  className="text-success border-success/30 hover:bg-success/10 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Nhận Việc
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkRejected}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Loại
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onScheduleInterview(candidate);
              }}
              className="text-xs"
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Lịch Phỏng Vấn
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onSendEmail(candidate);
              }}
              className="text-xs"
            >
              <Mail className="w-3.5 h-3.5 mr-1" />
              Gửi Mail
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEdit(candidate);
              }}
              className="text-xs"
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              Sửa
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
