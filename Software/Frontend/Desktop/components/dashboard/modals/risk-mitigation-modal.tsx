"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Briefcase,
} from "lucide-react";
import { type HiringRisk } from "@/lib/mock-data";

interface RiskMitigationModalProps {
  risk: HiringRisk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiskMitigationModal({
  risk,
  open,
  onOpenChange,
}: RiskMitigationModalProps) {
  if (!risk) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  risk.severity === "high"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-warning/20 text-warning"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {risk.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Mức độ: {risk.severity === "high" ? "CAO" : "TRUNG BÌNH"} • Ảnh hưởng:{" "}
                  <span className="font-semibold text-destructive">{risk.impact}</span>
                </DialogDescription>
              </div>
            </div>

            <Badge
              className={
                risk.severity === "high"
                  ? "bg-destructive/20 text-destructive border-destructive/30"
                  : "bg-warning/20 text-warning border-warning/30"
              }
            >
              {risk.impact}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Mô tả Nút Thắt Tuyển Dụng
            </h4>
            <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg border border-border leading-relaxed">
              {risk.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-sky-600" />
              Các Vị Trí Tuyển Dụng Bị Ảnh Hưởng
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {risk.impactedJobs.map((j) => (
                <Badge key={j} variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs py-1 px-2.5">
                  {j}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Kế Hoạch Hành Động Ứng Phó (Mitigation Plan)
            </h4>
            <div className="space-y-2.5">
              {risk.mitigationPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {step.step}
                    </p>
                    <Badge
                      className={
                        step.status === "completed"
                          ? "bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold"
                          : step.status === "in-progress"
                          ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold"
                          : "bg-muted text-muted-foreground text-[10px]"
                      }
                    >
                      {step.status === "completed" && (
                        <CheckCircle2 className="w-3 h-3 mr-1 text-sky-600" />
                      )}
                      {step.status === "in-progress" && (
                        <Clock className="w-3 h-3 mr-1 text-blue-600" />
                      )}
                      {step.status === "completed"
                        ? "HOÀN TẤT"
                        : step.status === "in-progress"
                        ? "ĐANG XỬ LÝ"
                        : "CHỜ THỰC HIỆN"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-sky-600" />
                      <span>Phụ trách: {step.owner}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>Thời hạn: {step.timeline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
